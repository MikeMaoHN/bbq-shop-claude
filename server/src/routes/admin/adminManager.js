const express = require('express');
const db = require('../../models');
const { success, paginate, fail } = require('../../utils/response');
const { requireRole } = require('../../middleware/auth');

const router = express.Router();

// 管理员列表（仅超级管理员）
router.get('/', requireRole('super_admin'), async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const result = await db.Admin.findAndCountAll({
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      limit: parseInt(pageSize, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(pageSize, 10),
    });
    paginate(res, { ...result, page: parseInt(page, 10), pageSize: parseInt(pageSize, 10) });
  } catch (err) {
    next(err);
  }
});

// 添加管理员
router.post('/', requireRole('super_admin'), async (req, res, next) => {
  try {
    const { username, password, name, role = 'admin' } = req.body;
    if (!username || !password) {
      return fail(res, '用户名和密码不能为空');
    }
    const existing = await db.Admin.findOne({ where: { username } });
    if (existing) {
      return fail(res, '用户名已存在');
    }
    const admin = await db.Admin.create({ username, password, name, role });
    success(res, { id: admin.id, username: admin.username, name: admin.name, role: admin.role }, '添加成功');
  } catch (err) {
    next(err);
  }
});

// 编辑管理员
router.put('/:id', requireRole('super_admin'), async (req, res, next) => {
  try {
    const admin = await db.Admin.findByPk(req.params.id);
    if (!admin) return fail(res, '管理员不存在', 404);
    const { password, ...data } = req.body;
    if (password) {
      data.password = password;
    }
    await admin.update(data);
    success(res, { id: admin.id, username: admin.username, name: admin.name, role: admin.role, status: admin.status }, '更新成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
