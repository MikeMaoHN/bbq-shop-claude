const express = require('express');
const db = require('../../models');
const { success, paginate, fail } = require('../../utils/response');
const { requireRole } = require('../../middleware/auth');

const router = express.Router();

function parsePage(raw, defaultVal = 1) {
  const v = parseInt(raw, 10);
  return isNaN(v) || v < 1 ? defaultVal : v;
}
function parsePageSize(raw, defaultVal = 10, max = 100) {
  const v = parseInt(raw, 10);
  if (isNaN(v) || v < 1) return defaultVal;
  return Math.min(v, max);
}

// 管理员列表（仅超级管理员）
router.get('/', requireRole('super_admin'), async (req, res, next) => {
  try {
    const page = parsePage(req.query.page);
    const pageSize = parsePageSize(req.query.pageSize);
    const result = await db.Admin.findAndCountAll({
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    paginate(res, { ...result, page, pageSize });
  } catch (err) {
    next(err);
  }
});

const ALLOWED_ROLES = ['admin', 'super_admin'];

// 添加管理员
router.post('/', requireRole('super_admin'), async (req, res, next) => {
  try {
    const { username, password, name, role = 'admin' } = req.body;
    if (!username || !password) {
      return fail(res, '用户名和密码不能为空');
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return fail(res, '角色无效');
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
    // Whitelist updatable fields to prevent privilege escalation
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.password) updates.password = req.body.password;
    if (req.body.role !== undefined) {
      if (!ALLOWED_ROLES.includes(req.body.role)) return fail(res, '角色无效');
      updates.role = req.body.role;
    }
    if (req.body.status !== undefined) updates.status = req.body.status;
    await admin.update(updates);
    success(res, { id: admin.id, username: admin.username, name: admin.name, role: admin.role, status: admin.status }, '更新成功');
  } catch (err) {
    next(err);
  }
});

// 删除管理员（仅超级管理员，且不允许删除自己）
router.delete('/:id', requireRole('super_admin'), async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (targetId === req.admin.id) return fail(res, '不能删除自己的账号');
    const admin = await db.Admin.findByPk(targetId);
    if (!admin) return fail(res, '管理员不存在', 404);
    await admin.destroy();
    success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
