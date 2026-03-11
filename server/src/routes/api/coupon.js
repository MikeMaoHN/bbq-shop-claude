const express = require('express');
const { Op } = require('sequelize');
const db = require('../../models');
const { authUser } = require('../../middleware/auth');
const { success, fail } = require('../../utils/response');

const router = express.Router();

// 可领取的优惠券（公开）
router.get('/available', async (req, res, next) => {
  try {
    const now = new Date();
    const coupons = await db.Coupon.findAll({
      where: {
        status: 1,
        start_time: { [Op.lte]: now },
        end_time: { [Op.gte]: now },
      },
      order: [['value', 'DESC']],
    });
    success(res, coupons);
  } catch (err) {
    next(err);
  }
});

// 领取优惠券
router.post('/:id/claim', authUser, async (req, res, next) => {
  const t = await db.sequelize.transaction();
  try {
    const coupon = await db.Coupon.findByPk(req.params.id, { lock: t.LOCK.UPDATE, transaction: t });
    if (!coupon || coupon.status !== 1) { await t.rollback(); return fail(res, '优惠券不存在'); }

    const existing = await db.UserCoupon.findOne({
      where: { user_id: req.user.id, coupon_id: coupon.id },
      transaction: t,
    });
    if (existing) { await t.rollback(); return fail(res, '已领取过该优惠券'); }

    if (coupon.total_count > 0 && coupon.used_count >= coupon.total_count) {
      await t.rollback();
      return fail(res, '优惠券已领完');
    }

    await db.UserCoupon.create({ user_id: req.user.id, coupon_id: coupon.id, status: 0 }, { transaction: t });
    await db.Coupon.increment('used_count', { where: { id: coupon.id }, transaction: t });
    await t.commit();
    success(res, null, '领取成功');
  } catch (err) {
    await t.rollback();
    next(err);
  }
});

// 我的优惠券
router.get('/mine', authUser, async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = { user_id: req.user.id };
    if (status !== undefined && status !== '') where.status = parseInt(status, 10);

    const coupons = await db.UserCoupon.findAll({
      where,
      include: [{ model: db.Coupon }],
      order: [['created_at', 'DESC']],
    });
    success(res, coupons);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
