const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../models');

// User authentication (mini program)
const authUser = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ code: 401, message: '请先登录' });
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await db.User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
  }
};

// Admin authentication
const authAdmin = async (req, res, next) => {
  const token = req.cookies.admin_access_token;
  if (!token) {
    return res.status(401).json({ code: 401, message: '请先登录' });
  }
  try {
    const decoded = jwt.verify(token, config.jwt.adminSecret);
    const admin = await db.Admin.findByPk(decoded.id);
    if (!admin || admin.status !== 1) {
      return res.status(401).json({ code: 401, message: '账号已被禁用' });
    }
    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
  }
};

// Role check
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({ code: 403, message: '权限不足' });
    }
    next();
  };
};

module.exports = { authUser, authAdmin, requireRole };
