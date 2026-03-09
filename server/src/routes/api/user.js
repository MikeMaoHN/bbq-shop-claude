const express = require('express');
const db = require('../../models');
const { authUser } = require('../../middleware/auth');
const { success, fail } = require('../../utils/response');

const router = express.Router();
router.use(authUser);

router.get('/profile', async (req, res) => {
  const { id, nickname, avatar, phone, created_at } = req.user;
  success(res, { id, nickname, avatar, phone, created_at });
});

router.put('/profile', async (req, res, next) => {
  try {
    const { nickname, avatar, phone } = req.body;
    await req.user.update({
      ...(nickname !== undefined && { nickname }),
      ...(avatar !== undefined && { avatar }),
      ...(phone !== undefined && { phone }),
    });
    success(res, { id: req.user.id, nickname: req.user.nickname, avatar: req.user.avatar, phone: req.user.phone }, '更新成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
