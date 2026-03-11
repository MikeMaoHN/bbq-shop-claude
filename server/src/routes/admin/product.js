const express = require('express');
const { Op } = require('sequelize');
const db = require('../../models');
const { success, paginate, fail } = require('../../utils/response');

const router = express.Router();

// 商品列表
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 10));
    const { keyword, category_id, status } = req.query;
    const where = {};
    if (keyword) {
      const safeKeyword = String(keyword).slice(0, 50);
      where.name = { [Op.like]: `%${safeKeyword}%` };
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
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    paginate(res, { ...result, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// 添加商品
router.post('/', async (req, res, next) => {
  try {
    const { specs, ...productData } = req.body;
    if (productData.price !== undefined && parseFloat(productData.price) < 0) return fail(res, '价格不能为负数');
    if (productData.stock !== undefined && parseInt(productData.stock, 10) < 0) return fail(res, '库存不能为负数');
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
    if (productData.price !== undefined && parseFloat(productData.price) < 0) return fail(res, '价格不能为负数');
    if (productData.stock !== undefined && parseInt(productData.stock, 10) < 0) return fail(res, '库存不能为负数');
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
