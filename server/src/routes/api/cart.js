const express = require('express');
const db = require('../../models');
const { authUser } = require('../../middleware/auth');
const { success, fail } = require('../../utils/response');

const router = express.Router();
router.use(authUser);

router.get('/', async (req, res, next) => {
  try {
    const items = await db.CartItem.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: db.Product, attributes: ['id', 'name', 'price', 'images', 'stock', 'status'] },
        { model: db.ProductSpec, attributes: ['id', 'name', 'price', 'stock'] },
      ],
      order: [['created_at', 'DESC']],
    });
    // Mark items whose product is no longer available so the client can display a warning
    const result = items.map((item) => {
      const plain = item.toJSON();
      plain.available = !!(plain.Product && plain.Product.status === 1);
      return plain;
    });
    success(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { product_id, spec_id = null, quantity = 1 } = req.body;
    if (!product_id) return fail(res, '缺少商品ID');

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1 || qty > 999) return fail(res, '数量不合法，请输入1~999之间的整数');

    const product = await db.Product.findByPk(product_id);
    if (!product || product.status !== 1) return fail(res, '商品不存在或已下架');

    if (spec_id) {
      const spec = await db.ProductSpec.findOne({ where: { id: spec_id, product_id } });
      if (!spec) return fail(res, '商品规格不存在');
    }

    const existing = await db.CartItem.findOne({
      where: { user_id: req.user.id, product_id, spec_id },
    });
    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > 999) return fail(res, '购物车单品数量不能超过999');
      await existing.update({ quantity: newQty });
      return success(res, existing, '已更新数量');
    }
    const item = await db.CartItem.create({ user_id: req.user.id, product_id, spec_id, quantity: qty });
    success(res, item, '已加入购物车');
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const item = await db.CartItem.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!item) return fail(res, '购物车商品不存在', 404);
    const qty = parseInt(req.body.quantity, 10);
    if (isNaN(qty) || qty < 1 || qty > 999) return fail(res, '数量不合法，请输入1~999之间的整数');
    await item.update({ quantity: qty });
    success(res, item);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const item = await db.CartItem.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!item) return fail(res, '购物车商品不存在', 404);
    await item.destroy();
    success(res, null, '已删除');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
