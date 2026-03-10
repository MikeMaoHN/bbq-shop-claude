/**
 * 测试公共工具
 * 提供 JWT 生成、Express 测试 App 构建等通用方法
 */
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const TEST_JWT_SECRET = 'test_jwt_secret';
const TEST_ADMIN_SECRET = 'test_admin_jwt_secret';
const TEST_ADMIN_REFRESH_SECRET = 'test_admin_refresh_secret';

/**
 * 生成测试用户 Token
 */
function genUserToken(userId = 1) {
  return jwt.sign({ id: userId }, TEST_JWT_SECRET, { expiresIn: '1h' });
}

/**
 * 生成测试管理员 Access Token
 */
function genAdminToken(adminId = 1, role = 'super') {
  return jwt.sign({ id: adminId, role }, TEST_ADMIN_SECRET, { expiresIn: '1h' });
}

/**
 * 生成测试管理员 Refresh Token
 */
function genAdminRefreshToken(adminId = 1, role = 'super') {
  return jwt.sign({ id: adminId, role }, TEST_ADMIN_REFRESH_SECRET, { expiresIn: '7d' });
}

/**
 * 生成用于 supertest .set('Cookie', ...) 的管理员 Cookie 字符串
 */
function genAdminCookie(adminId = 1, role = 'super') {
  const token = genAdminToken(adminId, role);
  return `admin_access_token=${token}`;
}

/**
 * 构建仅包含指定路由的轻量 Express App（不连接 DB）
 */
function buildApp(routerPath, mountPath = '/') {
  const app = express();
  app.use(express.json());
  app.use(express.text({ type: 'text/xml' }));
  app.use(cookieParser());
  // 覆盖 config 中的 JWT 密钥，使测试 token 可通过验证
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  process.env.JWT_ADMIN_SECRET = TEST_ADMIN_SECRET;
  process.env.JWT_ADMIN_REFRESH_SECRET = TEST_ADMIN_REFRESH_SECRET;
  const router = require(routerPath);
  app.use(mountPath, router);
  // 全局错误处理
  app.use((err, req, res, _next) => {
    res.status(500).json({ code: 500, message: err.message });
  });
  return app;
}

/**
 * 构建标准模拟 Order 对象
 */
function mockOrder(overrides = {}) {
  return {
    id: 1,
    order_no: 'BBQ20240101120000ABCD',
    user_id: 1,
    pay_amount: '88.00',
    status: 0,
    transaction_id: '',
    update: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

/**
 * 构建标准模拟 User 对象
 */
function mockUser(overrides = {}) {
  return {
    id: 1,
    openid: 'test_openid_001',
    nickname: '测试用户',
    phone: '13800138000',
    ...overrides,
  };
}

/**
 * 构建标准模拟 Admin 对象
 */
function mockAdmin(overrides = {}) {
  return {
    id: 1,
    username: 'admin',
    name: '超级管理员',
    status: 1,
    role: 'super',
    ...overrides,
  };
}

module.exports = {
  genUserToken,
  genAdminToken,
  genAdminRefreshToken,
  genAdminCookie,
  buildApp,
  mockOrder,
  mockUser,
  mockAdmin,
  TEST_JWT_SECRET,
  TEST_ADMIN_SECRET,
  TEST_ADMIN_REFRESH_SECRET,
};

