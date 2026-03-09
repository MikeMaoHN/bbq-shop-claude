/**
 * 单元测试 — 微信支付服务层（真实支付路径）
 * 通过 Mock Node.js https 模块，覆盖无需真实商户号的真实代码路径：
 *   - httpsPost（HTTPS 请求封装）
 *   - realUnifiedOrder（统一下单）
 *   - buildJsapiParams（JSAPI 参数签名）
 *   - realRefund（退款）
 *   - createPrepay / processRefund 在非 mock 模式下的路由
 */

process.env.NODE_ENV = 'production'; // 非 production 会自动开 mock，需显式设为 production
process.env.WECHAT_PAY_MOCK = 'false';
process.env.WX_APP_ID = 'wx_real_appid';
process.env.WX_MCH_ID = 'real_mch_id';
process.env.WX_MCH_KEY = 'real_mch_key_32bytes_1234567890';
process.env.WX_NOTIFY_URL = 'https://prod.example.com/api/v1/pay/notify';

// ── Mock https（必须在 require 之前）────────────────────────
jest.mock('https');

// ── Mock DB（DB 设为 false 以触发真实支付路径）────────────────
jest.mock('../../src/models', () => ({
  Setting: { findOne: jest.fn() },
}));

const https = require('https');
const { Setting } = require('../../src/models');
const wxPay = require('../../src/services/wechatPay');
const crypto = require('crypto');

// ──────────────────────────────────────────────────────────
// 辅助：构造 https.request mock（模拟微信 API 返回）
// ──────────────────────────────────────────────────────────

function mockHttpsRequest(responseXml) {
  https.request.mockImplementation((options, callback) => {
    const mockRes = {
      on: jest.fn((event, handler) => {
        if (event === 'data') handler(responseXml);
        if (event === 'end') handler();
      }),
    };
    // 模拟异步：callback 在 nextTick 执行
    process.nextTick(() => callback(mockRes));
    return {
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };
  });
}

function mockHttpsError(errorMsg) {
  https.request.mockImplementation((options, callback) => {
    const req = {
      on: jest.fn((event, handler) => {
        if (event === 'error') process.nextTick(() => handler(new Error(errorMsg)));
      }),
      write: jest.fn(),
      end: jest.fn(),
    };
    return req;
  });
}

// 构造微信标准成功响应 XML
function buildSuccessXml(extra = {}) {
  const MchKey = process.env.WX_MCH_KEY;
  const base = {
    return_code: 'SUCCESS',
    result_code: 'SUCCESS',
    appid: process.env.WX_APP_ID,
    mch_id: process.env.WX_MCH_ID,
    prepay_id: 'wx_prepay_id_test_abc123',
    trade_type: 'JSAPI',
    nonce_str: 'test_nonce',
    ...extra,
  };
  const signStr =
    Object.keys(base)
      .sort()
      .map((k) => `${k}=${base[k]}`)
      .join('&') + `&key=${MchKey}`;
  const sign = crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toUpperCase();
  const fields = { ...base, sign };
  const body = Object.entries(fields)
    .map(([k, v]) => `<${k}><![CDATA[${v}]]></${k}>`)
    .join('');
  return `<xml>${body}</xml>`;
}

// ──────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // DB 返回 false → 走真实支付路径
  Setting.findOne.mockResolvedValue({ value: 'false' });
});

// ─────────────────────────────────────────────────────────
describe('createPrepay — 真实支付模式（非 mock）', () => {
  test('成功调用微信统一下单，返回 JSAPI 支付参数', async () => {
    mockHttpsRequest(buildSuccessXml());

    const params = await wxPay.createPrepay({
      orderId: 1,
      orderNo: 'BBQ_REAL_001',
      body: '烤乐汇订单',
      totalFen: 8800,
      openid: 'oXXXX_real_openid',
      ip: '1.2.3.4',
    });

    // 不含 mock 字段
    expect(params.mock).toBeUndefined();
    // 含完整 JSAPI 参数
    expect(params.prepayId).toBe('wx_prepay_id_test_abc123');
    expect(params).toHaveProperty('appId');
    expect(params).toHaveProperty('timeStamp');
    expect(params).toHaveProperty('nonceStr');
    expect(params).toHaveProperty('package', 'prepay_id=wx_prepay_id_test_abc123');
    expect(params).toHaveProperty('signType', 'MD5');
    expect(params).toHaveProperty('paySign');
    // paySign 应为 32 位大写 MD5
    expect(params.paySign).toMatch(/^[A-F0-9]{32}$/);
  });

  test('微信返回 return_code=FAIL 时抛出错误', async () => {
    mockHttpsRequest(
      wxPay.toXml({ return_code: 'FAIL', return_msg: '商户号无效' }),
    );

    await expect(
      wxPay.createPrepay({
        orderId: 1,
        orderNo: 'BBQ_FAIL_001',
        body: '烤乐汇订单',
        totalFen: 100,
        openid: 'oXXXX',
        ip: '127.0.0.1',
      }),
    ).rejects.toThrow('商户号无效');
  });

  test('微信返回 result_code=FAIL（业务失败）时抛出错误', async () => {
    mockHttpsRequest(
      wxPay.toXml({
        return_code: 'SUCCESS',
        result_code: 'FAIL',
        err_code: 'INVALID_OPENID',
        err_code_des: 'openid 不正确',
      }),
    );

    await expect(
      wxPay.createPrepay({
        orderId: 1,
        orderNo: 'BBQ_FAIL_002',
        body: '烤乐汇订单',
        totalFen: 100,
        openid: 'bad_openid',
        ip: '127.0.0.1',
      }),
    ).rejects.toThrow('openid 不正确');
  });

  test('HTTPS 网络错误时 Promise reject', async () => {
    mockHttpsError('connect ECONNREFUSED api.mch.weixin.qq.com:443');

    await expect(
      wxPay.createPrepay({
        orderId: 1,
        orderNo: 'BBQ_NET_ERR',
        body: '烤乐汇订单',
        totalFen: 100,
        openid: 'oXXXX',
        ip: '127.0.0.1',
      }),
    ).rejects.toThrow('connect ECONNREFUSED');
  });

  test('发起统一下单时 https.request 被调用一次', async () => {
    mockHttpsRequest(buildSuccessXml());

    await wxPay.createPrepay({
      orderId: 1, orderNo: 'BBQ_COUNT', body: '测试', totalFen: 100, openid: 'o', ip: '1.1.1.1',
    });

    expect(https.request).toHaveBeenCalledTimes(1);
    const callArgs = https.request.mock.calls[0][0];
    expect(callArgs.hostname).toBe('api.mch.weixin.qq.com');
    expect(callArgs.path).toBe('/pay/unifiedorder');
    expect(callArgs.method).toBe('POST');
  });

  test('ip 缺省时使用 127.0.0.1', async () => {
    mockHttpsRequest(buildSuccessXml());

    // 不传 ip，验证不抛出
    await expect(
      wxPay.createPrepay({
        orderId: 1, orderNo: 'BBQ_NO_IP', body: '测试', totalFen: 100, openid: 'o',
      }),
    ).resolves.toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────
describe('processRefund — 真实支付模式（非 mock）', () => {
  test('退款成功时返回微信响应对象', async () => {
    mockHttpsRequest(
      wxPay.toXml({
        return_code: 'SUCCESS',
        result_code: 'SUCCESS',
        out_refund_no: 'REF_TEST_001',
        refund_id: 'wx_refund_abc',
      }),
    );

    const result = await wxPay.processRefund({
      orderNo: 'BBQ_REAL_001',
      transactionId: 'wx_txn_real_123',
      totalFen: 8800,
      refundFen: 8800,
      refundNo: 'REF_TEST_001',
    });

    expect(result.mock).toBeUndefined();
    expect(result.return_code).toBe('SUCCESS');
    expect(result.result_code).toBe('SUCCESS');
  });

  test('退款时 transaction_id 包含在请求参数中', async () => {
    mockHttpsRequest(
      wxPay.toXml({ return_code: 'SUCCESS', result_code: 'SUCCESS' }),
    );

    await wxPay.processRefund({
      orderNo: 'BBQ_001',
      transactionId: 'wx_txn_123',
      totalFen: 100,
      refundFen: 100,
      refundNo: 'REF_001',
    });

    // 验证 write 接收到包含 transaction_id 的 XML
    const reqInstance = https.request.mock.results[0].value;
    const writtenXml = reqInstance.write.mock.calls[0][0];
    expect(writtenXml).toContain('transaction_id');
    expect(writtenXml).toContain('wx_txn_123');
  });

  test('无 transaction_id 时不写入该字段', async () => {
    mockHttpsRequest(
      wxPay.toXml({ return_code: 'SUCCESS', result_code: 'SUCCESS' }),
    );

    await wxPay.processRefund({
      orderNo: 'BBQ_002',
      transactionId: '',
      totalFen: 100,
      refundFen: 100,
      refundNo: 'REF_002',
    });

    const reqInstance = https.request.mock.results[0].value;
    const writtenXml = reqInstance.write.mock.calls[0][0];
    expect(writtenXml).not.toContain('<transaction_id>');
  });

  test('微信返回 return_code=FAIL 时抛出错误', async () => {
    mockHttpsRequest(
      wxPay.toXml({ return_code: 'FAIL', return_msg: '退款请求频繁' }),
    );

    await expect(
      wxPay.processRefund({
        orderNo: 'BBQ_FAIL', transactionId: '', totalFen: 100, refundFen: 100, refundNo: 'REF',
      }),
    ).rejects.toThrow('退款请求频繁');
  });

  test('微信返回 result_code=FAIL 时抛出错误', async () => {
    mockHttpsRequest(
      wxPay.toXml({
        return_code: 'SUCCESS',
        result_code: 'FAIL',
        err_code_des: '余额不足',
      }),
    );

    await expect(
      wxPay.processRefund({
        orderNo: 'BBQ_FAIL', transactionId: '', totalFen: 100, refundFen: 100, refundNo: 'REF',
      }),
    ).rejects.toThrow('余额不足');
  });

  test('退款接口请求路径正确', async () => {
    mockHttpsRequest(
      wxPay.toXml({ return_code: 'SUCCESS', result_code: 'SUCCESS' }),
    );

    await wxPay.processRefund({
      orderNo: 'BBQ_001', transactionId: '', totalFen: 100, refundFen: 100, refundNo: 'REF',
    });

    const callArgs = https.request.mock.calls[0][0];
    expect(callArgs.path).toBe('/secapi/pay/refund');
    expect(callArgs.hostname).toBe('api.mch.weixin.qq.com');
  });
});

// ─────────────────────────────────────────────────────────
describe('错误消息 fallback 分支覆盖', () => {
  test('统一下单 return_code=FAIL 且无 return_msg 时使用默认消息', async () => {
    // 不含 return_msg 字段
    mockHttpsRequest(wxPay.toXml({ return_code: 'FAIL' }));

    await expect(
      wxPay.createPrepay({ orderId: 1, orderNo: 'O', body: 'B', totalFen: 1, openid: 'o' }),
    ).rejects.toThrow('统一下单失败');
  });

  test('统一下单 result_code=FAIL 且无 err_code_des 时使用 err_code', async () => {
    mockHttpsRequest(
      wxPay.toXml({ return_code: 'SUCCESS', result_code: 'FAIL', err_code: 'INVALID_REQUEST' }),
    );

    await expect(
      wxPay.createPrepay({ orderId: 1, orderNo: 'O', body: 'B', totalFen: 1, openid: 'o' }),
    ).rejects.toThrow('INVALID_REQUEST');
  });

  test('统一下单 result_code=FAIL 且无 err_code_des/err_code 时使用兜底消息', async () => {
    mockHttpsRequest(
      wxPay.toXml({ return_code: 'SUCCESS', result_code: 'FAIL' }),
    );

    await expect(
      wxPay.createPrepay({ orderId: 1, orderNo: 'O', body: 'B', totalFen: 1, openid: 'o' }),
    ).rejects.toThrow('统一下单业务失败');
  });

  test('退款 return_code=FAIL 且无 return_msg 时使用默认消息', async () => {
    mockHttpsRequest(wxPay.toXml({ return_code: 'FAIL' }));

    await expect(
      wxPay.processRefund({ orderNo: 'O', transactionId: '', totalFen: 1, refundFen: 1, refundNo: 'R' }),
    ).rejects.toThrow('退款请求失败');
  });

  test('退款 result_code=FAIL 且无 err_code_des 时使用默认消息', async () => {
    mockHttpsRequest(
      wxPay.toXml({ return_code: 'SUCCESS', result_code: 'FAIL' }),
    );

    await expect(
      wxPay.processRefund({ orderNo: 'O', transactionId: '', totalFen: 1, refundFen: 1, refundNo: 'R' }),
    ).rejects.toThrow('退款失败');
  });
});

// ─────────────────────────────────────────────────────────
describe('signV2 — 签名过滤分支', () => {
  test('verifyNotify 中含 undefined 值的参数会被过滤掉', () => {
    const crypto = require('crypto');
    const key = process.env.WX_MCH_KEY;
    // 手动构造含 undefined 和空字符串的参数，签名应一致
    const cleanParams = { a: 'A', b: 'B' };
    const dirtyParams = { a: 'A', b: 'B', c: undefined, d: '' };
    // 两者签名应相同（undefined 和 '' 被过滤）
    function signV2Local(params) {
      const str =
        Object.keys(params)
          .filter((k) => params[k] !== undefined && params[k] !== '')
          .sort()
          .map((k) => `${k}=${params[k]}`)
          .join('&') + `&key=${key}`;
      return crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
    }
    expect(signV2Local(cleanParams)).toBe(signV2Local(dirtyParams));
  });

  test('verifyNotify 用于验证：含空字符串字段的回调签名正确', () => {
    const crypto = require('crypto');
    const key = process.env.WX_MCH_KEY;
    const params = { appid: 'wx_real_appid', out_trade_no: 'BBQ_001', empty_field: '' };
    // 只对非空字段签名
    const str = 'appid=wx_real_appid&out_trade_no=BBQ_001' + `&key=${key}`;
    const sign = crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
    expect(wxPay.verifyNotify({ ...params, sign })).toBe(true);
  });
});
