const express = require('express');
const https = require('https');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const db = require('../../models');
const { success, fail } = require('../../utils/response');

const router = express.Router();

function wxCode2Session(code) {
  return new Promise((resolve, reject) => {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.wx.appId}&secret=${config.wx.appSecret}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('微信接口响应解析失败'));
        }
      });
    }).on('error', reject);
  });
}

router.post('/login', async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return fail(res, '缺少登录code');
    }

    let openid;
    if (config.env === 'production') {
      const wxRes = await wxCode2Session(code);
      if (wxRes.errcode) {
        return fail(res, `微信登录失败: ${wxRes.errmsg || wxRes.errcode}`);
      }
      openid = wxRes.openid;
    } else {
      // 开发/测试环境使用 mock openid
      openid = `mock_${code}`;
    }

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
