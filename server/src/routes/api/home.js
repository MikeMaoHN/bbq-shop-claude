const express = require('express');
const db = require('../../models');
const { success } = require('../../utils/response');

const router = express.Router();

router.get('/banners', async (req, res, next) => {
  try {
    const banners = await db.Banner.findAll({
      where: { status: 1 },
      order: [['sort_order', 'ASC']],
    });
    success(res, banners);
  } catch (err) {
    next(err);
  }
});

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await db.Category.findAll({
      where: { parent_id: 0, status: 1 },
      order: [['sort_order', 'ASC']],
    });
    success(res, categories);
  } catch (err) {
    next(err);
  }
});

router.get('/hot-products', async (req, res, next) => {
  try {
    const products = await db.Product.findAll({
      where: { is_hot: 1, status: 1 },
      limit: 10,
      order: [['sales', 'DESC']],
    });
    success(res, products);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
