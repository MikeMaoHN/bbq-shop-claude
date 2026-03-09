const express = require('express');
const db = require('../../models');
const { authUser } = require('../../middleware/auth');
const { success, fail } = require('../../utils/response');

const router = express.Router();
router.use(authUser);

router.get('/', async (req, res, next) => {
  try {
    const addresses = await db.Address.findAll({
      where: { user_id: req.user.id },
      order: [['is_default', 'DESC'], ['created_at', 'DESC']],
    });
    success(res, addresses);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, phone, province, city, district, detail, is_default } = req.body;
    if (!name || !phone || !detail) return fail(res, '请填写完整地址信息');

    if (is_default) {
      await db.Address.update({ is_default: 0 }, { where: { user_id: req.user.id } });
    }
    const address = await db.Address.create({
      user_id: req.user.id, name, phone, province, city, district, detail, is_default: is_default ? 1 : 0,
    });
    success(res, address, '添加成功');
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const address = await db.Address.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!address) return fail(res, '地址不存在', 404);

    if (req.body.is_default && !address.is_default) {
      await db.Address.update({ is_default: 0 }, { where: { user_id: req.user.id } });
    }
    await address.update(req.body);
    success(res, address, '更新成功');
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const address = await db.Address.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!address) return fail(res, '地址不存在', 404);
    await address.destroy();
    success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
