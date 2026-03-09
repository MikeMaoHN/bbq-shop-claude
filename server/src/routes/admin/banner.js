const express = require('express');
const db = require('../../models');
const { success, fail } = require('../../utils/response');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const banners = await db.Banner.findAll({ order: [['sort_order', 'ASC']] });
    success(res, banners);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const banner = await db.Banner.create(req.body);
    success(res, banner, '添加成功');
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const banner = await db.Banner.findByPk(req.params.id);
    if (!banner) return fail(res, '轮播图不存在', 404);
    await banner.update(req.body);
    success(res, banner, '更新成功');
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const banner = await db.Banner.findByPk(req.params.id);
    if (!banner) return fail(res, '轮播图不存在', 404);
    await banner.destroy();
    success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
