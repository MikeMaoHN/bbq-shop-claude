/**
 * 认证控制器
 * 处理微信小程序登录及用户信息管理
 */
const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('../config');
const Response = require('../utils/response');
const User = require('../models/User');

class AuthController {
  /**
   * 微信小程序登录
   * 用小程序端的临时 code 换取 openid 和 session_key，
   * 首次登录自动创建用户记录，返回 JWT token。
   * 若 code 以 "test_" 开头，走本地测试模式跳过微信 API 调用。
   */
  static async wxLogin(req, res) {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json(Response.error('缺少 code 参数'));
      }

      // 测试模式：code = "test_xxx"，openid = "wx_test_xxx"，免去真实微信鉴权
      if (code.startsWith('test_')) {
        const openid = 'wx_test_' + code.substring(5);
        let user = await User.findByOpenid(openid);
        if (!user) {
          const userId = await User.create({ openid, session_key: null, nickname: "测试用户", avatar: "", phone: "" });
          user = await User.findById(userId);
        }
        const token = jwt.sign({ userId: user.id, openid: user.openid, isAdmin: false }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
        return res.json(Response.success({ token, user }));
      }

      // 正式模式：调用微信 jscode2session 接口换取 openid
      const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
          appid: config.wx.appid,
          secret: config.wx.secret,
          js_code: code,
          grant_type: config.wx.grantType
        }
      });
      const { openid, session_key, errcode, errmsg } = wxResponse.data;
      if (errcode) {
        return res.status(400).json(Response.error('微信登录失败：' + errmsg));
      }

      // 首次登录自动注册，已有用户只更新 session_key
      let user = await User.findByOpenid(openid);
      if (!user) {
        const userId = await User.create({ openid, session_key, nickname: '新用户', avatar: '', phone: '' });
        user = await User.findById(userId);
      } else {
        await User.updateSessionKey(openid, session_key);
      }

      // 签发 JWT，payload 中不含敏感的 session_key
      const token = jwt.sign({ userId: user.id, openid: user.openid, isAdmin: false }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
      res.json(Response.success({ token, user }));
    } catch (error) {
      console.error('微信登录错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 获取当前登录用户信息
   * 依赖 auth 中间件在 req.user 中注入的 userId
   */
  static async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json(Response.error('用户不存在'));
      }
      res.json(Response.success(user));
    } catch (error) {
      console.error('获取用户信息错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 更新当前登录用户的资料（昵称、头像、手机号）
   */
  static async updateCurrentUser(req, res) {
    try {
      const { nickname, avatar, phone } = req.body;
      await User.update(req.user.userId, { nickname, avatar, phone });
      const user = await User.findById(req.user.userId);
      res.json(Response.success(user, '更新成功'));
    } catch (error) {
      console.error('更新用户信息错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }
}

module.exports = AuthController;
