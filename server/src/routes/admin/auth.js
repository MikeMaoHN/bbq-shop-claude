const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const db = require('../../models');
const { success, fail } = require('../../utils/response');
const { authAdmin } = require('../../middleware/auth');

const router = express.Router();

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
    const token = jwt.sign({ id: admin.id, role: admin.role }, config.jwt.adminSecret, {
      expiresIn: config.jwt.adminExpiresIn,
    });
    success(res, {
      token,
      admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role },
    });
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
  success(res, null, '已退出登录');
});

module.exports = router;
