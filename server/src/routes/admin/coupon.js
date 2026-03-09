const express = require('express');
const db = require('../../models');
const { success, paginate, fail } = require('../../utils/response');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const result = await db.Coupon.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit: parseInt(pageSize, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(pageSize, 10),
    });
    paginate(res, { ...result, page: parseInt(page, 10), pageSize: parseInt(pageSize, 10) });
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
