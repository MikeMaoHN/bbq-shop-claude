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
    success(res, items);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { product_id, spec_id = null, quantity = 1 } = req.body;
    if (!product_id) return fail(res, '缺少商品ID');

    const product = await db.Product.findByPk(product_id);
    if (!product || product.status !== 1) return fail(res, '商品不存在或已下架');

    const existing = await db.CartItem.findOne({
      where: { user_id: req.user.id, product_id, spec_id },
    });
    if (existing) {
      await existing.update({ quantity: existing.quantity + parseInt(quantity, 10) });
      return success(res, existing, '已更新数量');
    }
    const item = await db.CartItem.create({ user_id: req.user.id, product_id, spec_id, quantity: parseInt(quantity, 10) });
    success(res, item, '已加入购物车');
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const item = await db.CartItem.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!item) return fail(res, '购物车商品不存在', 404);
    await item.update({ quantity: parseInt(req.body.quantity, 10) });
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
