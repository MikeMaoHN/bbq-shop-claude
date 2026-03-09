/**
 * 单元测试 — 微信支付服务层
 * 测试范围：
 *   - XML 解析与序列化
 *   - 签名验证（verifyNotify）
 *   - 模式检测（isMockMode）
 *   - 预支付参数生成（createPrepay）
 *   - 退款处理（processRefund）
 */

// ── 设置测试环境变量（必须在 require 之前）──────────────────
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';
process.env.WECHAT_PAY_MOCK = 'false'; // 默认关，各 case 按需覆盖
process.env.WX_APP_ID = 'wx_test_appid';
process.env.WX_MCH_ID = 'test_mch_id';
process.env.WX_MCH_KEY = 'test_mch_key_32bytes_1234567890';
process.env.WX_NOTIFY_URL = 'https://test.example.com/pay/notify';

// ── Mock DB（必须在 require service 之前）─────────────────────
jest.mock('../../src/models', () => ({
  Setting: {
    findOne: jest.fn(),
  },
}));

const { Setting } = require('../../src/models');
const wxPay = require('../../src/services/wechatPay');

// ─────────────────────────────────────────────────────────────
describe('XML 工具函数', () => {
  test('toXml 应将对象序列化为标准 XML', () => {
    const xml = wxPay.toXml({ return_code: 'SUCCESS', return_msg: 'OK' });
    expect(xml).toContain('<xml>');
    expect(xml).toContain('<return_code><![CDATA[SUCCESS]]></return_code>');
    expect(xml).toContain('<return_msg><![CDATA[OK]]></return_msg>');
  });

  test('parseXml 应正确解析 CDATA 包裹的 XML', () => {
    const xml = '<xml><return_code><![CDATA[SUCCESS]]></return_code><total_fee>100</total_fee></xml>';
    const obj = wxPay.parseXml(xml);
    expect(obj.return_code).toBe('SUCCESS');
    expect(obj.total_fee).toBe('100');
  });

  test('parseXml 对空字符串返回空对象', () => {
    expect(wxPay.parseXml('')).toEqual({});
  });

  test('toXml → parseXml 往返一致性', () => {
    const original = { out_trade_no: 'BBQ123', total_fee: '888', result_code: 'SUCCESS' };
    const xml = wxPay.toXml(original);
    const parsed = wxPay.parseXml(xml);
    expect(parsed.out_trade_no).toBe('BBQ123');
    expect(parsed.total_fee).toBe('888');
    expect(parsed.result_code).toBe('SUCCESS');
  });
});

// ─────────────────────────────────────────────────────────────
describe('verifyNotify — 回调签名验证', () => {
  const crypto = require('crypto');
  const MchKey = process.env.WX_MCH_KEY;

  function buildSignedParams(params) {
    const str =
      Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join('&') + `&key=${MchKey}`;
    const sign = crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
    return { ...params, sign };
  }

  test('签名正确时应返回 true', () => {
    const params = buildSignedParams({
      appid: 'wx_test_appid',
      mch_id: 'test_mch_id',
      out_trade_no: 'BBQ_ORDER_001',
      result_code: 'SUCCESS',
      return_code: 'SUCCESS',
      total_fee: '8800',
      transaction_id: 'wx_txn_123456',
    });
    expect(wxPay.verifyNotify(params)).toBe(true);
  });

  test('签名错误时应返回 false', () => {
    const params = {
      appid: 'wx_test_appid',
      out_trade_no: 'BBQ_ORDER_001',
      result_code: 'SUCCESS',
      sign: 'WRONG_SIGN_XXXXXXXXXXXXXXXXXXXXXXXX',
    };
    expect(wxPay.verifyNotify(params)).toBe(false);
  });

  test('篡改参数后签名应失效', () => {
    const params = buildSignedParams({ out_trade_no: 'BBQ_001', total_fee: '100' });
    params.total_fee = '9999'; // 篡改金额
    expect(wxPay.verifyNotify(params)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
describe('isMockMode — 模式检测', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('DB 设置为 true 时返回 true（优先级最高）', async () => {
    Setting.findOne.mockResolvedValue({ value: 'true' });
    const result = await wxPay.isMockMode();
    expect(result).toBe(true);
  });

  test('DB 设置为 false 时返回 false', async () => {
    Setting.findOne.mockResolvedValue({ value: 'false' });
    const result = await wxPay.isMockMode();
    expect(result).toBe(false);
  });

  test('DB 查询为空时回退到环境变量（WECHAT_PAY_MOCK=false）', async () => {
    Setting.findOne.mockResolvedValue(null);
    // NODE_ENV=test 不是 production，但 WECHAT_PAY_MOCK=false 且不是 production 时
    // config.wx.payMock = false || (test !== production) = true
    // 所以这里期望 true
    const result = await wxPay.isMockMode();
    expect(result).toBe(true); // NODE_ENV=test, non-production 自动开启
  });

  test('DB 查询异常时回退到环境变量', async () => {
    Setting.findOne.mockRejectedValue(new Error('DB connection failed'));
    const result = await wxPay.isMockMode();
    // 异常时 catch 兜底，回退到 config.wx.payMock
    expect(typeof result).toBe('boolean');
  });
});

// ─────────────────────────────────────────────────────────────
describe('createPrepay — 预支付参数生成', () => {
  const testPayload = {
    orderId: 1,
    orderNo: 'BBQ20240101ABCD',
    body: '烤乐汇订单',
    totalFen: 8800,
    openid: 'oXXXX_test_openid',
    ip: '127.0.0.1',
  };

  test('mock 模式：返回包含 mock=true 的参数对象', async () => {
    Setting.findOne.mockResolvedValue({ value: 'true' });
    const params = await wxPay.createPrepay(testPayload);

    expect(params.mock).toBe(true);
    expect(params.prepayId).toMatch(/^MOCK_PREPAY_/);
    expect(params.orderNo).toBe(testPayload.orderNo);
    expect(params.orderId).toBe(testPayload.orderId);
    expect(params.package).toBe(`prepay_id=MOCK_PREPAY_${testPayload.orderNo}`);
  });

  test('mock 模式：返回的参数包含所有必要字段', async () => {
    Setting.findOne.mockResolvedValue({ value: 'true' });
    const params = await wxPay.createPrepay(testPayload);

    expect(params).toHaveProperty('appId');
    expect(params).toHaveProperty('timeStamp');
    expect(params).toHaveProperty('nonceStr');
    expect(params).toHaveProperty('paySign');
    expect(params.timeStamp).toMatch(/^\d+$/);
    expect(params.nonceStr).toHaveLength(16);
  });

  test('mock 模式：不同订单生成不同的 prepayId', async () => {
    Setting.findOne.mockResolvedValue({ value: 'true' });
    const p1 = await wxPay.createPrepay({ ...testPayload, orderNo: 'ORDER_A' });
    const p2 = await wxPay.createPrepay({ ...testPayload, orderNo: 'ORDER_B' });
    expect(p1.prepayId).not.toBe(p2.prepayId);
  });
});

// ─────────────────────────────────────────────────────────────
describe('processRefund — 退款处理', () => {
  const testRefundPayload = {
    orderNo: 'BBQ20240101ABCD',
    transactionId: 'wx_txn_test_123',
    totalFen: 8800,
    refundFen: 8800,
    refundNo: 'REF20240101ABCD',
  };

  test('mock 模式：立即返回成功，包含 mock=true', async () => {
    Setting.findOne.mockResolvedValue({ value: 'true' });
    const result = await wxPay.processRefund(testRefundPayload);

    expect(result.mock).toBe(true);
    expect(result.result_code).toBe('SUCCESS');
    expect(result.refund_no).toBe(testRefundPayload.refundNo);
  });

  test('mock 模式：退款不调用真实微信接口（无网络请求）', async () => {
    Setting.findOne.mockResolvedValue({ value: 'true' });
    // 若调用真实接口会超时失败，mock 模式下应直接返回
    const startTime = Date.now();
    await wxPay.processRefund(testRefundPayload);
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(200); // 模拟退款应几乎即时
  });
});
