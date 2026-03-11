const express = require('express');
const db = require('../../models');
const { success, paginate, fail } = require('../../utils/response');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 10));
    const result = await db.Coupon.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    paginate(res, { ...result, page, pageSize });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const coupon = await db.Coupon.create(req.body);
    success(res, coupon, '创建成功');
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const coupon = await db.Coupon.findByPk(req.params.id);
    if (!coupon) return fail(res, '优惠券不存在', 404);
    await coupon.update(req.body);
    success(res, coupon, '更新成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
