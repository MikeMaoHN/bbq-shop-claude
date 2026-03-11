const express = require('express');
const { Op } = require('sequelize');
const db = require('../../models');
const { success, paginate, fail } = require('../../utils/response');

const router = express.Router();

// 用户列表
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 10));
    const { keyword } = req.query;
    const where = {};
    if (keyword) {
      const safeKeyword = String(keyword).slice(0, 50);
      where[Op.or] = [
        { nickname: { [Op.like]: `%${safeKeyword}%` } },
        { phone: { [Op.like]: `%${safeKeyword}%` } },
      ];
    }
    const result = await db.User.findAndCountAll({
      where,
      attributes: { exclude: ['openid'] },
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    paginate(res, { ...result, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// 用户详情
router.get('/:id', async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.params.id, {
      attributes: { exclude: ['openid'] },
    });
    if (!user) {
      return fail(res, '用户不存在', 404);
    }
    const orderCount = await db.Order.count({ where: { user_id: user.id } });
    const totalSpent = await db.Order.sum('pay_amount', {
      where: { user_id: user.id, status: { [Op.gte]: 1, [Op.lte]: 3 } },
    });
    success(res, { ...user.toJSON(), orderCount, totalSpent: totalSpent || 0 });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
