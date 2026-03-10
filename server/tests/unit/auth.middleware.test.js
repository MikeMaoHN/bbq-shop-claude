/**
 * 单元测试 — auth 中间件
 *
 * 测试场景：
 *   authUser     — TC-MW-U-01 ~ 04
 *   authAdmin    — TC-MW-A-01 ~ 05
 *   requireRole  — TC-MW-R-01 ~ 04
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_ADMIN_SECRET = 'test_admin_jwt_secret';

jest.mock('../../src/models', () => ({
  User: { findByPk: jest.fn() },
  Admin: { findByPk: jest.fn() },
}));

const jwt = require('jsonwebtoken');
const { User, Admin } = require('../../src/models');
const { authUser, authAdmin, requireRole } = require('../../src/middleware/auth');

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRes() {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

function makeReq(overrides = {}) {
  return { headers: {}, cookies: {}, ...overrides };
}

const genUserToken = (id = 1) =>
  jwt.sign({ id }, 'test_jwt_secret', { expiresIn: '1h' });

const genAdminToken = (id = 1, role = 'super') =>
  jwt.sign({ id, role }, 'test_admin_jwt_secret', { expiresIn: '1h' });

beforeEach(() => jest.clearAllMocks());

// ── authUser ─────────────────────────────────────────────────────────────────

describe('authUser', () => {
  test('TC-MW-U-01: 缺少 Authorization 头返回 401', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await authUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-MW-U-02: 无效 Token 返回 401', async () => {
    const req = makeReq({ headers: { authorization: 'Bearer invalid_token' } });
    const res = makeRes();
    const next = jest.fn();

    await authUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-MW-U-03: Token 有效但用户不存在返回 401', async () => {
    User.findByPk.mockResolvedValue(null);
    const req = makeReq({ headers: { authorization: `Bearer ${genUserToken(99)}` } });
    const res = makeRes();
    const next = jest.fn();

    await authUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-MW-U-04: 有效 Token 且用户存在时调用 next 并挂载 req.user', async () => {
    const user = { id: 1, nickname: '测试用户' };
    User.findByPk.mockResolvedValue(user);
    const req = makeReq({ headers: { authorization: `Bearer ${genUserToken(1)}` } });
    const res = makeRes();
    const next = jest.fn();

    await authUser(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBe(user);
  });
});

// ── authAdmin ────────────────────────────────────────────────────────────────

describe('authAdmin', () => {
  test('TC-MW-A-01: 缺少 Cookie 返回 401', async () => {
    const req = makeReq({ cookies: {} });
    const res = makeRes();
    const next = jest.fn();

    await authAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-MW-A-02: Cookie 中 Token 无效返回 401', async () => {
    const req = makeReq({ cookies: { admin_access_token: 'bad_token' } });
    const res = makeRes();
    const next = jest.fn();

    await authAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-MW-A-03: Token 有效但管理员不存在返回 401', async () => {
    Admin.findByPk.mockResolvedValue(null);
    const req = makeReq({ cookies: { admin_access_token: genAdminToken(99) } });
    const res = makeRes();
    const next = jest.fn();

    await authAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-MW-A-04: 管理员已禁用（status=0）返回 401', async () => {
    Admin.findByPk.mockResolvedValue({ id: 1, status: 0 });
    const req = makeReq({ cookies: { admin_access_token: genAdminToken(1) } });
    const res = makeRes();
    const next = jest.fn();

    await authAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-MW-A-05: 有效 Token 且管理员已启用时调用 next 并挂载 req.admin', async () => {
    const admin = { id: 1, status: 1, role: 'super' };
    Admin.findByPk.mockResolvedValue(admin);
    const req = makeReq({ cookies: { admin_access_token: genAdminToken(1) } });
    const res = makeRes();
    const next = jest.fn();

    await authAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.admin).toBe(admin);
  });
});

// ── requireRole ───────────────────────────────────────────────────────────────

describe('requireRole', () => {
  test('TC-MW-R-01: req.admin 未设置时返回 403', () => {
    const middleware = requireRole('super');
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-MW-R-02: 角色不匹配时返回 403', () => {
    const middleware = requireRole('super');
    const req = { ...makeReq(), admin: { id: 1, role: 'operator' } };
    const res = makeRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-MW-R-03: 角色精确匹配时调用 next', () => {
    const middleware = requireRole('super');
    const req = { ...makeReq(), admin: { id: 1, role: 'super' } };
    const res = makeRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('TC-MW-R-04: 多角色中有一个匹配时调用 next', () => {
    const middleware = requireRole('super', 'admin');
    const req = { ...makeReq(), admin: { id: 1, role: 'admin' } };
    const res = makeRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
