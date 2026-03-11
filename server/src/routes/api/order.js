const express = require('express');
const db = require('../../models');
const { authUser } = require('../../middleware/auth');
const { success, paginate, fail } = require('../../utils/response');
const { generateOrderNo } = require('../../utils/orderNo');

const router = express.Router();
router.use(authUser);

// 创建订单
router.post('/', async (req, res, next) => {
  const t = await db.sequelize.transaction();
  try {
    const { address_id, items, remark, delivery_time_slot } = req.body;
    if (!address_id || !items || !items.length) {
      await t.rollback();
      return fail(res, '请选择地址和商品');
    }

    const address = await db.Address.findOne({ where: { id: address_id, user_id: req.user.id } });
    if (!address) { await t.rollback(); return fail(res, '地址不存在'); }

    const address_snapshot = {
      name: address.name, phone: address.phone,
      province: address.province, city: address.city,
      district: address.district, detail: address.detail,
    };

    let total_amount = 0;
    const orderItems = [];

    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty < 1 || qty > 999) { await t.rollback(); return fail(res, '商品数量不合法'); }
      item.quantity = qty;

      const product = await db.Product.findByPk(item.product_id, { lock: t.LOCK.UPDATE, transaction: t });
      if (!product || product.status !== 1) { await t.rollback(); return fail(res, `商品 ${item.product_id} 不可用`); }

      let price = parseFloat(product.price);
      let stock = product.stock;
      let spec_name = '';

      if (item.spec_id) {
        const spec = await db.ProductSpec.findOne({
          where: { id: item.spec_id, product_id: item.product_id },
          lock: t.LOCK.UPDATE, transaction: t,
        });
        if (!spec) { await t.rollback(); return fail(res, '规格不存在'); }
        price = parseFloat(spec.price);
        stock = spec.stock;
        spec_name = spec.name;
      }

      if (stock < item.quantity) { await t.rollback(); return fail(res, `${product.name} 库存不足`); }

      // 扣减库存
      if (item.spec_id) {
        await db.ProductSpec.decrement('stock', { by: item.quantity, where: { id: item.spec_id }, transaction: t });
      }
      await db.Product.decrement('stock', { by: item.quantity, where: { id: item.product_id }, transaction: t });
      await db.Product.increment('sales', { by: item.quantity, where: { id: item.product_id }, transaction: t });

      total_amount += price * item.quantity;
      orderItems.push({
        product_id: item.product_id,
        product_name: product.name,
        product_image: product.images?.[0] || '',
        spec_name,
        price,
        quantity: item.quantity,
      });
    }

    // TODO: 配送费逻辑
    const delivery_fee = total_amount >= 99 ? 0 : 8;
    const pay_amount = total_amount + delivery_fee;

    const order = await db.Order.create({
      order_no: generateOrderNo(),
      user_id: req.user.id,
      address_snapshot,
      total_amount,
      delivery_fee,
      pay_amount,
      status: 0,
      remark: remark || '',
      delivery_time_slot: delivery_time_slot || '',
    }, { transaction: t });

    await db.OrderItem.bulkCreate(
      orderItems.map((item) => ({ ...item, order_id: order.id })),
      { transaction: t },
    );

    // 清空已购买商品的购物车
    await db.CartItem.destroy({
      where: { user_id: req.user.id, product_id: items.map((i) => i.product_id) },
      transaction: t,
    });

    await t.commit();
    success(res, order, '下单成功');
  } catch (err) {
    await t.rollback();
    next(err);
  }
});

// 订单列表
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 10));
    const where = { user_id: req.user.id };
    if (req.query.status !== undefined && req.query.status !== '') where.status = parseInt(req.query.status, 10);

    const result = await db.Order.findAndCountAll({
      where,
      include: [{ model: db.OrderItem, as: 'items' }],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    paginate(res, { ...result, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// 订单详情
router.get('/:id', async (req, res, next) => {
  try {
    const order = await db.Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{ model: db.OrderItem, as: 'items' }],
    });
    if (!order) return fail(res, '订单不存在', 404);
    success(res, order);
  } catch (err) {
    next(err);
  }
});

// 取消订单
router.put('/:id/cancel', async (req, res, next) => {
  try {
    const order = await db.Order.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!order) return fail(res, '订单不存在', 404);
    if (order.status !== 0) return fail(res, '仅待付款订单可取消');
    await order.update({ status: 4 });
    success(res, null, '已取消');
  } catch (err) {
    next(err);
  }
});

// 确认收货
router.put('/:id/receive', async (req, res, next) => {
  try {
    const order = await db.Order.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!order) return fail(res, '订单不存在', 404);
    if (order.status !== 2) return fail(res, '订单状态不正确');
    await order.update({ status: 3, receive_time: new Date() });
    success(res, null, '已确认收货');
  } catch (err) {
    next(err);
  }
});

// 申请退款
router.post('/:id/refund', async (req, res, next) => {
  try {
    const order = await db.Order.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!order) return fail(res, '订单不存在', 404);
    if (![1, 2].includes(order.status)) return fail(res, '当前订单状态不支持退款');
    await order.update({ status: 5 });
    success(res, null, '退款申请已提交');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
