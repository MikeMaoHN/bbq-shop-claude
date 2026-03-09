const express = require('express');
const db = require('../../models');
const { success, fail } = require('../../utils/response');

const router = express.Router();

// 分类列表（树形结构）
router.get('/', async (req, res, next) => {
  try {
    const categories = await db.Category.findAll({
      where: { parent_id: 0 },
      include: [{ model: db.Category, as: 'children', order: [['sort_order', 'ASC']] }],
      order: [['sort_order', 'ASC']],
    });
    success(res, categories);
  } catch (err) {
    next(err);
  }
});

// 添加分类
router.post('/', async (req, res, next) => {
  try {
    const { name, parent_id = 0, icon = '', sort_order = 0 } = req.body;
    if (!name) {
      return fail(res, '分类名称不能为空');
    }
    const category = await db.Category.create({ name, parent_id, icon, sort_order });
    success(res, category, '添加成功');
  } catch (err) {
    next(err);
  }
});

// 编辑分类
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await db.Category.findByPk(id);
    if (!category) {
      return fail(res, '分类不存在', 404);
    }
    await category.update(req.body);
    success(res, category, '更新成功');
  } catch (err) {
    next(err);
  }
});

// 删除分类
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const children = await db.Category.count({ where: { parent_id: id } });
    if (children > 0) {
      return fail(res, '该分类下有子分类，无法删除');
    }
    const products = await db.Product.count({ where: { category_id: id } });
    if (products > 0) {
      return fail(res, '该分类下有商品，无法删除');
    }
    await db.Category.destroy({ where: { id } });
    success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
