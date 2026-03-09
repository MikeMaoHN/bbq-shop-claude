const express = require('express');
const { Op } = require('sequelize');
const db = require('../../models');
const { success, paginate, fail } = require('../../utils/response');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, category_id, sort = 'default' } = req.query;
    const where = { status: 1 };
    if (category_id) where.category_id = category_id;

    let order;
    switch (sort) {
      case 'price_asc': order = [['price', 'ASC']]; break;
      case 'price_desc': order = [['price', 'DESC']]; break;
      case 'sales': order = [['sales', 'DESC']]; break;
      default: order = [['created_at', 'DESC']];
    }

    const result = await db.Product.findAndCountAll({
      where, order,
      limit: parseInt(pageSize, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(pageSize, 10),
      include: [{ model: db.Category, attributes: ['id', 'name'] }],
    });
    paginate(res, { ...result, page: parseInt(page, 10), pageSize: parseInt(pageSize, 10) });
  } catch (err) {
    next(err);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const { keyword, page = 1, pageSize = 10 } = req.query;
    if (!keyword) return fail(res, '请输入搜索关键词');

    const result = await db.Product.findAndCountAll({
      where: {
        status: 1,
        [Op.or]: [
          { name: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } },
        ],
      },
      order: [['sales', 'DESC']],
      limit: parseInt(pageSize, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(pageSize, 10),
    });
    paginate(res, { ...result, page: parseInt(page, 10), pageSize: parseInt(pageSize, 10) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await db.Product.findByPk(req.params.id, {
      include: [
        { model: db.Category, attributes: ['id', 'name'] },
        { model: db.ProductSpec, as: 'specs' },
      ],
    });
    if (!product || product.status !== 1) return fail(res, '商品不存在', 404);
    success(res, product);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
