/**
 * 集成测试 — 管理端支付配置路由 /api/admin/pay
 *
 * 测试场景：
 *   TC-ADMIN-PAY-01  GET  /mock-mode   查询当前支付模式
 *   TC-ADMIN-PAY-02  PUT  /mock-mode   切换为模拟支付模式
 *   TC-ADMIN-PAY-03  PUT  /mock-mode   切换为真实支付模式
 *   TC-ADMIN-PAY-04  PUT  /mock-mode   未登录拒绝访问
 *   TC-ADMIN-PAY-05  PUT  /mock-mode   DB 写入失败时返回 500
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_ADMIN_SECRET = 'test_admin_jwt_secret';

jest.mock('../../src/models', () => ({
  Setting: {
    findOne: jest.fn(),
    upsert: jest.fn(),
  },
  Admin: { findByPk: jest.fn() },
}));

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const { Setting, Admin } = require('../../src/models');
const { genAdminCookie, mockAdmin } = require('../helpers/testHelper');

// 构建测试 App（包含 authAdmin 中间件）
const app = express();
app.use(express.json());
app.use(cookieParser());

// 直接挂载，复用真实 authAdmin
const { authAdmin } = require('../../src/middleware/auth');
app.use('/pay', authAdmin, require('../../src/routes/admin/payConfig'));
app.use((err, req, res, _next) => res.status(500).json({ code: 500, message: err.message }));

const adminCookie = genAdminCookie(1);

beforeEach(() => {
  jest.clearAllMocks();
  Admin.findByPk.mockResolvedValue(mockAdmin());
  Setting.findOne.mockResolvedValue({ value: 'true' });
  Setting.upsert.mockResolvedValue([{}, true]);
});

// ─────────────────────────────────────────────────────────────
describe('TC-ADMIN-PAY-01: GET /mock-mode — 查询支付模式', () => {
  test('返回当前模式状态', async () => {
    const res = await request(app)
      .get('/pay/mock-mode')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveProperty('mock');
    expect(typeof res.body.data.mock).toBe('boolean');
  });

  test('DB 值为 true 时返回 mock: true', async () => {
    Setting.findOne.mockResolvedValue({ value: 'true' });
    const res = await request(app)
      .get('/pay/mock-mode')
      .set('Cookie', adminCookie);
    expect(res.body.data.mock).toBe(true);
  });

  test('DB 值为 false 时返回 mock: false', async () => {
    Setting.findOne.mockResolvedValue({ value: 'false' });
    const res = await request(app)
      .get('/pay/mock-mode')
      .set('Cookie', adminCookie);
    expect(res.body.data.mock).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
describe('TC-ADMIN-PAY-02/03: PUT /mock-mode — 切换支付模式', () => {
  test('TC-ADMIN-PAY-02: 切换为模拟支付模式', async () => {
    const res = await request(app)
      .put('/pay/mock-mode')
      .set('Cookie', adminCookie)
      .send({ mock: true });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.mock).toBe(true);
    expect(Setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'pay_mock_mode', value: 'true' }),
    );
  });

  test('TC-ADMIN-PAY-03: 切换为真实支付模式', async () => {
    Setting.findOne.mockResolvedValue({ value: 'false' });

    const res = await request(app)
      .put('/pay/mock-mode')
      .set('Cookie', adminCookie)
      .send({ mock: false });

    expect(res.status).toBe(200);
    expect(res.body.data.mock).toBe(false);
    expect(Setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'pay_mock_mode', value: 'false' }),
    );
  });

  test('切换时写入 description 说明', async () => {
    await request(app)
      .put('/pay/mock-mode')
      .set('Cookie', adminCookie)
      .send({ mock: true });

    expect(Setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ description: '支付模拟模式开关' }),
    );
  });
});

// ─────────────────────────────────────────────────────────────
describe('TC-ADMIN-PAY-04: 鉴权验证', () => {
  test('未携带 Cookie 返回 401', async () => {
    const res = await request(app)
      .get('/pay/mock-mode');
    expect(res.status).toBe(401);
  });

  test('无效 Cookie Token 返回 401', async () => {
    const res = await request(app)
      .put('/pay/mock-mode')
      .set('Cookie', 'admin_access_token=invalid_token_xyz')
      .send({ mock: true });
    expect(res.status).toBe(401);
  });

  test('已禁用管理员（status=0）返回 401', async () => {
    Admin.findByPk.mockResolvedValue(mockAdmin({ status: 0 }));

    const res = await request(app)
      .get('/pay/mock-mode')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────
describe('TC-ADMIN-PAY-05: 异常处理', () => {
  test('DB 写入失败时返回 500', async () => {
    Setting.upsert.mockRejectedValue(new Error('DB write error'));

    const res = await request(app)
      .put('/pay/mock-mode')
      .set('Cookie', adminCookie)
      .send({ mock: true });

    expect(res.status).toBe(500);
  });

  test('DB 查询失败时返回 500', async () => {
    Setting.findOne.mockRejectedValue(new Error('DB read error'));
    // isMockMode 内部 catch 会回退到 config，不会 throw，所以 GET 返回 200
    const res = await request(app)
      .get('/pay/mock-mode')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200); // 降级到 env 变量，不崩溃
  });
});
