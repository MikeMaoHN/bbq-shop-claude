const express = require('express');
const { Op } = require('sequelize');
const db = require('../../models');
const { success, paginate, fail } = require('../../utils/response');

const router = express.Router();

// 商品列表
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword, category_id, status } = req.query;
    const where = {};
    if (keyword) {
      where.name = { [Op.like]: `%${keyword}%` };
    }
    if (category_id) {
      where.category_id = category_id;
    }
    if (status !== undefined && status !== '') {
      where.status = parseInt(status, 10);
    }

    const result = await db.Product.findAndCountAll({
      where,
      include: [
        { model: db.Category, attributes: ['id', 'name'] },
        { model: db.ProductSpec, as: 'specs' },
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

// 添加商品
router.post('/', async (req, res, next) => {
  try {
    const { specs, ...productData } = req.body;
    const product = await db.sequelize.transaction(async (t) => {
      const p = await db.Product.create(productData, { transaction: t });
      if (specs && specs.length > 0) {
        await db.ProductSpec.bulkCreate(
          specs.map((s) => ({ ...s, product_id: p.id })),
          { transaction: t },
        );
      }
      return p;
    });

    const result = await db.Product.findByPk(product.id, {
      include: [{ model: db.ProductSpec, as: 'specs' }],
    });
    success(res, result, '添加成功');
  } catch (err) {
    next(err);
  }
});

// 编辑商品
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { specs, ...productData } = req.body;
    const product = await db.Product.findByPk(id);
    if (!product) {
      return fail(res, '商品不存在', 404);
    }

    await db.sequelize.transaction(async (t) => {
      await product.update(productData, { transaction: t });
      if (specs) {
        await db.ProductSpec.destroy({ where: { product_id: id }, transaction: t });
        if (specs.length > 0) {
          await db.ProductSpec.bulkCreate(
            specs.map((s) => ({ ...s, product_id: id })),
            { transaction: t },
          );
        }
      }
    });

    const result = await db.Product.findByPk(id, {
      include: [{ model: db.ProductSpec, as: 'specs' }],
    });
    success(res, result, '更新成功');
  } catch (err) {
    next(err);
  }
});

// 上下架
router.put('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const product = await db.Product.findByPk(id);
    if (!product) {
      return fail(res, '商品不存在', 404);
    }
    await product.update({ status });
    success(res, null, status === 1 ? '已上架' : '已下架');
  } catch (err) {
    next(err);
  }
});

// 删除商品
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await db.Product.findByPk(id);
    if (!product) {
      return fail(res, '商品不存在', 404);
    }
    await db.sequelize.transaction(async (t) => {
      await db.ProductSpec.destroy({ where: { product_id: id }, transaction: t });
      await product.destroy({ transaction: t });
    });
    success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
