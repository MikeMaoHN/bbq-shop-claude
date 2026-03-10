/**
 * 集成测试 — 支付路由极端错误路径
 * 专门测试 isMockMode() 自身因服务模块异常而抛出的情况
 * 覆盖 pay.js:112 和 payConfig.js:19（catch next(err)）
 *
 * 这些分支在正常运行时几乎不可触发（isMockMode 内部有 try/catch），
 * 此处通过直接 mock wechatPay 服务模块来完整覆盖防御性代码。
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_ADMIN_SECRET = 'test_admin_jwt_secret';

jest.mock('../../src/models', () => ({
  Setting: { findOne: jest.fn() },
  Admin: { findByPk: jest.fn() },
}));

// Mock 整个 wechatPay 服务，使 isMockMode 可受控地抛出
jest.mock('../../src/services/wechatPay', () => ({
  isMockMode: jest.fn(),
  createPrepay: jest.fn(),
  processRefund: jest.fn(),
  verifyNotify: jest.fn(),
  parseXml: jest.fn(),
  toXml: jest.fn(),
}));

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const wxPay = require('../../src/services/wechatPay');
const { Admin } = require('../../src/models');
const { genAdminCookie, mockAdmin, genUserToken } = require('../helpers/testHelper');

// 构建 app（小程序端 /mock-mode）
const userApp = express();
userApp.use(express.json());
userApp.use('/pay', require('../../src/routes/api/pay'));
userApp.use((err, req, res, _next) => res.status(500).json({ code: 500, message: err.message }));

// 构建 app（管理端 /mock-mode）
const { authAdmin } = require('../../src/middleware/auth');
const adminApp = express();
adminApp.use(express.json());
adminApp.use(cookieParser());
adminApp.use('/pay', authAdmin, require('../../src/routes/admin/payConfig'));
adminApp.use((err, req, res, _next) => res.status(500).json({ code: 500, message: err.message }));

const adminCookie = genAdminCookie(1);
const userToken = genUserToken(1);

beforeEach(() => {
  jest.clearAllMocks();
  Admin.findByPk.mockResolvedValue(mockAdmin());
});

describe('pay.js:112 — GET /mock-mode isMockMode 异常', () => {
  test('isMockMode 直接抛出时，路由通过 next(err) 返回 500', async () => {
    wxPay.isMockMode.mockRejectedValue(new Error('Unexpected service crash'));

    const res = await request(userApp).get('/pay/mock-mode');

    expect(res.status).toBe(500);
    expect(res.body.message).toContain('Unexpected service crash');
  });
});

describe('payConfig.js:19 — GET /pay/mock-mode (admin) isMockMode 异常', () => {
  test('isMockMode 直接抛出时，管理端路由通过 next(err) 返回 500', async () => {
    wxPay.isMockMode.mockRejectedValue(new Error('Admin service crash'));

    const res = await request(adminApp)
      .get('/pay/mock-mode')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(500);
    expect(res.body.message).toContain('Admin service crash');
  });
});
