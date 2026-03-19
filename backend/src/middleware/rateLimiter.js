/**
 * 速率限制中间件
 * 防止暴力破解和 DDoS 攻击
 */
const rateLimit = require('express-rate-limit');
const Logger = require('../utils/logger');
const log = new Logger('RateLimiter');

// 登录限流 - 最严格
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 5, // 最多 5 次
  message: {
    code: 429,
    message: '登录尝试次数过多，请稍后再试',
    timestamp: Date.now()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn(`登录限流触发：IP=${req.ip}`);
    res.status(429).json({
      code: 429,
      message: '登录尝试次数过多，请稍后再试',
      timestamp: Date.now()
    });
  }
});

// API 通用限流
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 100, // 最多 100 次
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
    timestamp: Date.now()
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 跳过健康检查
    return req.path === '/health';
  },
  handler: (req, res) => {
    log.warn(`API 限流触发：IP=${req.ip}, Path=${req.path}`);
    res.status(429).json({
      code: 429,
      message: '请求过于频繁，请稍后再试',
      timestamp: Date.now()
    });
  }
});

// 敏感操作限流（支付、修改密码等）
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 10, // 最多 10 次
  message: {
    code: 429,
    message: '操作过于频繁，请稍后再试',
    timestamp: Date.now()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn(`敏感操作限流触发：IP=${req.ip}, Path=${req.path}`);
    res.status(429).json({
      code: 429,
      message: '操作过于频繁，请稍后再试',
      timestamp: Date.now()
    });
  }
});

// 文件上传限流
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 50, // 最多 50 次
  message: {
    code: 429,
    message: '上传次数过多，请稍后再试',
    timestamp: Date.now()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn(`上传限流触发：IP=${req.ip}`);
    res.status(429).json({
      code: 429,
      message: '上传次数过多，请稍后再试',
      timestamp: Date.now()
    });
  }
});

module.exports = {
  loginLimiter,
  apiLimiter,
  sensitiveLimiter,
  uploadLimiter
};
