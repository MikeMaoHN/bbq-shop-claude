const jwt = require('jsonwebtoken');
const config = require('../config');
const Response = require('../utils/response');
const Logger = require('../utils/logger');
const log = new Logger('AuthMiddleware');

/**
 * 生成 Token
 * @param {Object} payload - 用户信息
 * @param {boolean} isAdmin - 是否管理员
 * @returns {string} Token
 */
const generateToken = (payload, isAdmin = false) => {
  return jwt.sign(
    { 
      ...payload, 
      isAdmin,
      iat: Math.floor(Date.now() / 1000)
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * 刷新 Token
 * @param {string} token - 原 Token
 * @returns {string|null} 新 Token，如果原 Token 无效则返回 null
 */
const refreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    // 删除 JWT 标准字段，重新生成
    const { exp, iat, ...payload } = decoded;
    return generateToken(payload, decoded.isAdmin);
  } catch (error) {
    log.warn(`Token 刷新失败：${error.message}`);
    return null;
  }
};

/**
 * JWT 认证中间件
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(Response.error('未授权访问', 401));
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret);
    
    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(Response.error('Token 已过期', 401));
    }
    return res.status(401).json(Response.error('Token 无效', 401));
  }
};

/**
 * 管理员认证中间件
 */
const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(Response.error('未授权访问', 401));
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret);
    
    if (!decoded.isAdmin) {
      return res.status(403).json(Response.error('权限不足', 403));
    }
    
    req.admin = decoded;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(Response.error('Token 已过期', 401));
    }
    return res.status(401).json(Response.error('Token 无效', 401));
  }
};

/**
 * Token 刷新中间件（可选）
 * 在响应中自动附加新 Token
 */
const tokenRefreshMiddleware = (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = (data) => {
    // 如果请求中有有效 Token 且即将过期（< 1 小时），刷新 Token
    if (req.token && req.user) {
      try {
        const decoded = jwt.verify(req.token, config.jwt.secret);
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = decoded.exp - now;
        
        // 如果剩余时间小于 1 小时，刷新 Token
        if (expiresIn < 3600 && expiresIn > 0) {
          const newToken = refreshToken(req.token);
          if (newToken) {
            res.set('X-New-Token', newToken);
            log.debug(`Token 已刷新，剩余时间：${expiresIn}s`);
          }
        }
      } catch (error) {
        // Token 已过期或无效，不处理
      }
    }
    return originalJson(data);
  };
  next();
};

module.exports = { 
  authMiddleware, 
  adminMiddleware, 
  generateToken, 
  refreshToken,
  tokenRefreshMiddleware 
};
