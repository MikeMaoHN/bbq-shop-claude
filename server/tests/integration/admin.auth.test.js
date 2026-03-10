/**
 * 集成测试 — 管理端认证路由 /auth
 *
 * 测试场景：
 *   TC-AUTH-01  POST /login    登录
 *   TC-AUTH-02  POST /refresh  刷新 Token
 *   TC-AUTH-03  GET  /info     获取管理员信息
 *   TC-AUTH-04  POST /logout   退出登录
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_ADMIN_SECRET = 'test_admin_jwt_secret';
process.env.JWT_ADMIN_REFRESH_SECRET = 'test_admin_refresh_secret';

jest.mock('../../src/models', () => ({
  Admin: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
}));

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const { Admin } = require('../../src/models');
const { genAdminCookie, genAdminRefreshToken, mockAdmin } = require('../helpers/testHelper');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/auth', require('../../src/routes/admin/auth'));
app.use((err, req, res, _next) => res.status(500).json({ code: 500, message: err.message }));

// 含 validatePassword 和 update 方法的完整 Admin mock
function mockAdminFull(overrides = {}) {
  return {
    ...mockAdmin(),
    validatePassword: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  Admin.findByPk.mockResolvedValue(mockAdmin());
  Admin.findOne.mockResolvedValue(mockAdminFull());
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

describe('TC-AUTH-01: POST /auth/login — 登录', () => {
  test('正确凭据登录成功，响应含 admin 信息', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'correct' });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.admin).toMatchObject({ id: 1, username: 'admin' });
  });

  test('登录成功后下发 access + refresh 两个 httpOnly Cookie', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'correct' });

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const names = cookies.map(c => c.split('=')[0]);
    expect(names).toContain('admin_access_token');
    expect(names).toContain('admin_refresh_token');
    expect(cookies.every(c => /HttpOnly/i.test(c))).toBe(true);
  });

  test('缺少用户名/密码返回 400', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin' });
    expect(res.status).toBe(400);
  });

  test('用户名不存在返回 400', async () => {
    Admin.findOne.mockResolvedValue(null);
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'ghost', password: 'x' });
    expect(res.status).toBe(400);
  });

  test('密码错误返回 400', async () => {
    Admin.findOne.mockResolvedValue(mockAdminFull({ validatePassword: jest.fn().mockResolvedValue(false) }));
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'wrong' });
    expect(res.status).toBe(400);
  });

  test('账号已禁用（status=0）返回 400', async () => {
    Admin.findOne.mockResolvedValue(mockAdminFull({ status: 0 }));
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'correct' });
    expect(res.status).toBe(400);
  });

  test('DB 异常返回 500', async () => {
    Admin.findOne.mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'x' });
    expect(res.status).toBe(500);
  });
});

// ── POST /auth/refresh ────────────────────────────────────────────────────────

describe('TC-AUTH-02: POST /auth/refresh — 刷新 Token', () => {
  test('有效 refresh token 返回 200 并下发新 Cookie', async () => {
    const token = genAdminRefreshToken(1);
    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `admin_refresh_token=${token}`);

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const names = cookies.map(c => c.split('=')[0]);
    expect(names).toContain('admin_access_token');
    expect(names).toContain('admin_refresh_token');
  });

  test('缺少 refresh token Cookie 返回 401', async () => {
    const res = await request(app).post('/auth/refresh');
    expect(res.status).toBe(401);
  });

  test('无效 refresh token 返回 401', async () => {
    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', 'admin_refresh_token=invalid_token_xyz');
    expect(res.status).toBe(401);
  });

  test('管理员不存在时刷新返回 401', async () => {
    Admin.findByPk.mockResolvedValue(null);
    const token = genAdminRefreshToken(1);
    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `admin_refresh_token=${token}`);
    expect(res.status).toBe(401);
  });

  test('管理员已禁用时刷新返回 401', async () => {
    Admin.findByPk.mockResolvedValue(mockAdmin({ status: 0 }));
    const token = genAdminRefreshToken(1);
    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `admin_refresh_token=${token}`);
    expect(res.status).toBe(401);
  });

  test('DB 异常返回 500', async () => {
    Admin.findByPk.mockRejectedValue(new Error('DB error'));
    const token = genAdminRefreshToken(1);
    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `admin_refresh_token=${token}`);
    expect(res.status).toBe(500);
  });
});

// ── GET /auth/info ────────────────────────────────────────────────────────────

describe('TC-AUTH-03: GET /auth/info — 获取管理员信息', () => {
  test('携带有效 access token Cookie 返回管理员信息', async () => {
    const res = await request(app)
      .get('/auth/info')
      .set('Cookie', genAdminCookie(1));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: 1, username: 'admin' });
  });

  test('未携带 Cookie 返回 401', async () => {
    const res = await request(app).get('/auth/info');
    expect(res.status).toBe(401);
  });

  test('无效 access token 返回 401', async () => {
    const res = await request(app)
      .get('/auth/info')
      .set('Cookie', 'admin_access_token=invalid_token');
    expect(res.status).toBe(401);
  });

  test('管理员已禁用时返回 401', async () => {
    Admin.findByPk.mockResolvedValue(mockAdmin({ status: 0 }));
    const res = await request(app)
      .get('/auth/info')
      .set('Cookie', genAdminCookie(1));
    expect(res.status).toBe(401);
  });
});

// ── POST /auth/logout ─────────────────────────────────────────────────────────

describe('TC-AUTH-04: POST /auth/logout — 退出登录', () => {
  test('携带有效 Cookie 退出成功并清除 Cookie', async () => {
    const res = await request(app)
      .post('/auth/logout')
      .set('Cookie', genAdminCookie(1));

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    // 清除 Cookie 表现为 Expires 设为过去时间或 Max-Age=0
    const accessCookie = cookies.find(c => c.startsWith('admin_access_token='));
    expect(accessCookie).toBeDefined();
    expect(/Expires=Thu, 01 Jan 1970|Max-Age=0/i.test(accessCookie)).toBe(true);
  });

  test('未携带 Cookie 退出返回 401', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(401);
  });
});
