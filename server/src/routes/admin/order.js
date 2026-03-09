const express = require('express');
const { Op } = require('sequelize');
const db = require('../../models');
const { success, paginate, fail } = require('../../utils/response');
const wxPay = require('../../services/wechatPay');
const { generateOrderNo } = require('../../utils/orderNo');

const router = express.Router();

// 订单列表
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, status, order_no, start_date, end_date } = req.query;
    const where = {};
    if (status !== undefined && status !== '') {
      where.status = parseInt(status, 10);
    }
    if (order_no) {
      where.order_no = { [Op.like]: `%${order_no}%` };
    }
    if (start_date && end_date) {
      where.created_at = { [Op.between]: [new Date(start_date), new Date(end_date)] };
    }

    const result = await db.Order.findAndCountAll({
      where,
      include: [
        { model: db.User, attributes: ['id', 'nickname', 'phone'] },
        { model: db.OrderItem, as: 'items' },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(pageSize, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(pageSize, 10),
    });

    paginate(res, { ...result, page: parseInt(page, 10), pageSize: parseInt(pageSize, 10) });
  } catch (err) {
    next(err);
  }
});

// 订单详情
router.get('/:id', async (req, res, next) => {
  try {
    const order = await db.Order.findByPk(req.params.id, {
      include: [
        { model: db.User, attributes: ['id', 'nickname', 'phone', 'avatar'] },
        { model: db.OrderItem, as: 'items' },
      ],
    });
    if (!order) {
      return fail(res, '订单不存在', 404);
    }
    success(res, order);
  } catch (err) {
    next(err);
  }
});

// 发货
router.put('/:id/deliver', async (req, res, next) => {
  try {
    const order = await db.Order.findByPk(req.params.id);
    if (!order) {
      return fail(res, '订单不存在', 404);
    }
    if (order.status !== 1) {
      return fail(res, '订单状态不允许发货');
    }
    await order.update({ status: 2, deliver_time: new Date() });
    success(res, null, '发货成功');
  } catch (err) {
    next(err);
  }
});

// 处理退款
router.put('/:id/refund', async (req, res, next) => {
  try {
    const { action } = req.body; // approve or reject
    const order = await db.Order.findByPk(req.params.id);
    if (!order) {
      return fail(res, '订单不存在', 404);
    }
    if (order.status !== 5) {
      return fail(res, '该订单未申请退款');
    }
    if (action === 'approve') {
      const totalFen = Math.round(parseFloat(order.pay_amount) * 100);
      await wxPay.processRefund({
        orderNo: order.order_no,
        transactionId: order.transaction_id,
        totalFen,
        refundFen: totalFen,
        refundNo: `REF${generateOrderNo()}`,
      });
      await order.update({ status: 6 });
      success(res, null, '退款已通过');
    } else {
      await order.update({ status: 1 });
      success(res, null, '退款已拒绝');
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
