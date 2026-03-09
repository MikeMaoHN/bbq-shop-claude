const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const db = require('../../models');
const { success, fail } = require('../../utils/response');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return fail(res, '缺少登录code');
    }

    // TODO: 生产环境调用微信接口获取 openid
    // const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', { params: { appid, secret, js_code: code, grant_type: 'authorization_code' } });
    // const { openid } = wxRes.data;
    const openid = `mock_${code}`;

    const [user, created] = await db.User.findOrCreate({
      where: { openid },
      defaults: { openid, nickname: '微信用户' },
    });

    const token = jwt.sign({ id: user.id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    success(res, {
      token,
      userInfo: { id: user.id, nickname: user.nickname, avatar: user.avatar, phone: user.phone },
      isNew: created,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
