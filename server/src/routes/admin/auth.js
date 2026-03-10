const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const db = require('../../models');
const { success, fail } = require('../../utils/response');
const { authAdmin } = require('../../middleware/auth');

const router = express.Router();

const isProd = config.env === 'production';

function setCookies(res, accessToken, refreshToken) {
  res.cookie('admin_access_token', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 2 * 60 * 60 * 1000, // 2h
  });
  res.cookie('admin_refresh_token', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/api/admin/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
  });
}

function clearCookies(res) {
  res.clearCookie('admin_access_token');
  res.clearCookie('admin_refresh_token', { path: '/api/admin/auth/refresh' });
}

// 管理员登录
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return fail(res, '请输入用户名和密码');
    }
    const admin = await db.Admin.findOne({ where: { username } });
    if (!admin) {
      return fail(res, '用户名或密码错误');
    }
    if (admin.status !== 1) {
      return fail(res, '账号已被禁用');
    }
    const valid = await admin.validatePassword(password);
    if (!valid) {
      return fail(res, '用户名或密码错误');
    }
    await admin.update({ last_login_at: new Date() });
    const payload = { id: admin.id, role: admin.role };
    const accessToken = jwt.sign(payload, config.jwt.adminSecret, { expiresIn: config.jwt.adminExpiresIn });
    const refreshToken = jwt.sign(payload, config.jwt.adminRefreshSecret, { expiresIn: config.jwt.adminRefreshExpiresIn });
    setCookies(res, accessToken, refreshToken);
    success(res, {
      admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role },
    });
  } catch (err) {
    next(err);
  }
});

// 刷新 access token
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.admin_refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.adminRefreshSecret);
    } catch {
      clearCookies(res);
      return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
    }
    const admin = await db.Admin.findByPk(decoded.id);
    if (!admin || admin.status !== 1) {
      clearCookies(res);
      return res.status(401).json({ code: 401, message: '账号已被禁用' });
    }
    const payload = { id: admin.id, role: admin.role };
    const newAccessToken = jwt.sign(payload, config.jwt.adminSecret, { expiresIn: config.jwt.adminExpiresIn });
    const newRefreshToken = jwt.sign(payload, config.jwt.adminRefreshSecret, { expiresIn: config.jwt.adminRefreshExpiresIn });
    setCookies(res, newAccessToken, newRefreshToken);
    success(res, null);
  } catch (err) {
    next(err);
  }
});

// 获取当前管理员信息
router.get('/info', authAdmin, async (req, res) => {
  const { id, username, name, role } = req.admin;
  success(res, { id, username, name, role });
});

// 退出登录
router.post('/logout', authAdmin, (req, res) => {
  clearCookies(res);
  success(res, null, '已退出登录');
});

module.exports = router;
