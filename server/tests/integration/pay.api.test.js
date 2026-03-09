/**
 * 集成测试 — 小程序支付路由 /api/v1/pay
 *
 * 测试场景：
 *   TC-PAY-01  GET  /mock-mode   查询支付模式
 *   TC-PAY-02  POST /prepay      模拟模式下发起预支付
 *   TC-PAY-03  POST /prepay      未登录拒绝访问
 *   TC-PAY-04  POST /prepay      订单不存在返回 404
 *   TC-PAY-05  POST /prepay      订单已支付返回 400
 *   TC-PAY-06  POST /mock-confirm 模拟支付确认成功
 *   TC-PAY-07  POST /mock-confirm 真实模式下禁止调用
 *   TC-PAY-08  POST /mock-confirm 订单状态不正确返回 400
 *   TC-PAY-09  POST /notify      合法回调更新订单状态
 *   TC-PAY-10  POST /notify      签名错误拒绝回调
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_ADMIN_SECRET = 'test_admin_jwt_secret';
process.env.WX_APP_ID = 'wx_test_appid';
process.env.WX_MCH_ID = 'test_mch_id';
process.env.WX_MCH_KEY = 'test_mch_key_32bytes_1234567890';

// ── Mock 依赖 ───────────────────────────────────────────────
jest.mock('../../src/models', () => ({
  Setting: { findOne: jest.fn() },
  Order: { findOne: jest.fn(), findByPk: jest.fn() },
  User: { findByPk: jest.fn() },
  Admin: { findByPk: jest.fn() },
}));

const request = require('supertest');
const crypto = require('crypto');
const express = require('express');
const { Setting, Order, User } = require('../../src/models');
const { genUserToken, mockOrder, mockUser } = require('../helpers/testHelper');

// 构建测试 App
const app = express();
app.use(express.json());
app.use(express.text({ type: 'text/xml' }));
app.use('/pay', require('../../src/routes/api/pay'));
app.use((err, req, res, _next) => res.status(500).json({ code: 500, message: err.message }));

const userToken = genUserToken(1);

// ── 签名工具（复用与服务层相同的算法）──────────────────────
function signV2(params, key) {
  const str =
    Object.keys(params)
      .filter((k) => params[k] !== undefined && params[k] !== '')
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&') + `&key=${key}`;
  return crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
}

function buildNotifyXml(params) {
  const MchKey = process.env.WX_MCH_KEY;
  const withSign = { ...params, sign: signV2(params, MchKey) };
  const body = Object.entries(withSign)
    .map(([k, v]) => `<${k}><![CDATA[${v}]]></${k}>`)
    .join('');
  return `<xml>${body}</xml>`;
}

beforeEach(() => {
  jest.clearAllMocks();
  // 默认：mock 模式开启，用户已存在
  Setting.findOne.mockResolvedValue({ value: 'true' });
  User.findByPk.mockResolvedValue(mockUser());
});

// ─────────────────────────────────────────────────────────────
describe('TC-PAY-01: GET /mock-mode — 查询支付模式', () => {
  test('mock 模式开启时返回 {mock: true}', async () => {
    const res = await request(app).get('/pay/mock-mode');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.mock).toBe(true);
  });

  test('mock 模式关闭时返回 {mock: false}', async () => {
    Setting.findOne.mockResolvedValue({ value: 'false' });
    const res = await request(app).get('/pay/mock-mode');
    expect(res.status).toBe(200);
    expect(res.body.data.mock).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
describe('TC-PAY-02/03/04/05: POST /prepay — 发起预支付', () => {
  test('TC-PAY-02: mock 模式下返回包含 mock=true 的支付参数', async () => {
    Order.findOne.mockResolvedValue(mockOrder({ status: 0, pay_amount: '88.00' }));

    const res = await request(app)
      .post('/pay/prepay')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ order_id: 1 });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.mock).toBe(true);
    expect(res.body.data.prepayId).toMatch(/^MOCK_PREPAY_/);
    expect(res.body.data).toHaveProperty('timeStamp');
    expect(res.body.data).toHaveProperty('nonceStr');
    expect(res.body.data).toHaveProperty('paySign');
  });

  test('TC-PAY-03: 未携带 Token 返回 401', async () => {
    const res = await request(app)
      .post('/pay/prepay')
      .send({ order_id: 1 });
    expect(res.status).toBe(401);
  });

  test('TC-PAY-04: 订单不存在返回 404', async () => {
    Order.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/pay/prepay')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ order_id: 999 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('订单不存在');
  });

  test('TC-PAY-05: 订单已支付（status=1）返回 400', async () => {
    Order.findOne.mockResolvedValue(mockOrder({ status: 1 }));

    const res = await request(app)
      .post('/pay/prepay')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ order_id: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('订单已支付或已关闭');
  });

  test('缺少 order_id 参数返回 400', async () => {
    const res = await request(app)
      .post('/pay/prepay')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('缺少 order_id');
  });
});

// ─────────────────────────────────────────────────────────────
describe('TC-PAY-06/07/08: POST /mock-confirm — 模拟支付确认', () => {
  test('TC-PAY-06: mock 模式下成功确认，订单 update 被调用', async () => {
    const order = mockOrder({ status: 0 });
    Order.findOne.mockResolvedValue(order);

    const res = await request(app)
      .post('/pay/mock-confirm')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ order_id: 1 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('模拟支付成功');
    expect(order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 1,
        transaction_id: expect.stringContaining('MOCK_TXN_'),
      }),
    );
    expect(order.update.mock.calls[0][0].pay_time).toBeInstanceOf(Date);
  });

  test('TC-PAY-07: 真实支付模式下调用 /mock-confirm 返回 403', async () => {
    Setting.findOne.mockResolvedValue({ value: 'false' });

    const res = await request(app)
      .post('/pay/mock-confirm')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ order_id: 1 });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('非模拟支付模式');
  });

  test('TC-PAY-08: 订单已付款（status=1）时返回 400', async () => {
    Order.findOne.mockResolvedValue(mockOrder({ status: 1 }));

    const res = await request(app)
      .post('/pay/mock-confirm')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ order_id: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('订单已支付或已关闭');
  });

  test('订单不属于当前用户返回 404', async () => {
    Order.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/pay/mock-confirm')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ order_id: 999 });

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────
describe('TC-PAY-09/10: POST /notify — 微信支付回调', () => {
  test('TC-PAY-09: 合法签名回调，订单状态更新为已付款', async () => {
    const order = mockOrder({ status: 0, order_no: 'BBQ_TEST_ORDER' });
    Order.findOne.mockResolvedValue(order);

    const xml = buildNotifyXml({
      appid: 'wx_test_appid',
      mch_id: 'test_mch_id',
      out_trade_no: 'BBQ_TEST_ORDER',
      result_code: 'SUCCESS',
      return_code: 'SUCCESS',
      total_fee: '8800',
      transaction_id: 'wx_txn_abc123',
    });

    const res = await request(app)
      .post('/pay/notify')
      .set('Content-Type', 'text/xml')
      .send(xml);

    expect(res.status).toBe(200);
    expect(res.text).toContain('<return_code><![CDATA[SUCCESS]]></return_code>');
    expect(order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 1,
        transaction_id: 'wx_txn_abc123',
      }),
    );
  });

  test('TC-PAY-10: 签名错误的回调返回 FAIL XML', async () => {
    const xml = '<xml><return_code><![CDATA[SUCCESS]]></return_code><sign><![CDATA[FAKESIGN]]></sign></xml>';

    const res = await request(app)
      .post('/pay/notify')
      .set('Content-Type', 'text/xml')
      .send(xml);

    expect(res.status).toBe(200); // 微信要求始终返回 200
    expect(res.text).toContain('<return_code><![CDATA[FAIL]]></return_code>');
    expect(res.text).toContain('Sign failed');
  });

  test('result_code=FAIL 的回调不更新订单', async () => {
    const order = mockOrder({ status: 0 });
    Order.findOne.mockResolvedValue(order);

    const xml = buildNotifyXml({
      appid: 'wx_test_appid',
      mch_id: 'test_mch_id',
      out_trade_no: 'BBQ_TEST_ORDER',
      result_code: 'FAIL',
      return_code: 'SUCCESS',
      err_code: 'NOTENOUGH',
    });

    await request(app)
      .post('/pay/notify')
      .set('Content-Type', 'text/xml')
      .send(xml);

    expect(order.update).not.toHaveBeenCalled();
  });

  test('订单已付款时重复回调不再更新', async () => {
    const order = mockOrder({ status: 1 }); // 已是已付款状态
    Order.findOne.mockResolvedValue(order);

    const xml = buildNotifyXml({
      appid: 'wx_test_appid',
      mch_id: 'test_mch_id',
      out_trade_no: 'BBQ_TEST_ORDER',
      result_code: 'SUCCESS',
      return_code: 'SUCCESS',
      transaction_id: 'wx_txn_dup',
    });

    await request(app)
      .post('/pay/notify')
      .set('Content-Type', 'text/xml')
      .send(xml);

    expect(order.update).not.toHaveBeenCalled();
  });
});
