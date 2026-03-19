/**
 * 全局错误处理中间件
 * 生产环境不暴露详细错误信息
 */
const Logger = require('../utils/logger');
const log = new Logger('ErrorHandler');

// 自定义错误类
class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 全局错误处理
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 记录错误
  if (err.status >= 500) {
    log.error('服务器错误:', err.message);
    log.error('错误堆栈:', err.stack);
  } else {
    log.warn(`客户端错误：${err.status} - ${err.message}`);
  }

  // MySQL 连接错误
  if (err.code === 'ECONNREFUSED') {
    error.status = 503;
    error.message = '数据库连接失败';
    error.code = 'DB_CONNECTION_ERROR';
  }

  // MySQL 语法错误
  if (err.code === 'ER_PARSE_ERROR') {
    error.status = 500;
    error.message = '数据库操作失败';
    error.code = 'DB_ERROR';
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    error.status = 401;
    error.message = 'Token 无效';
    error.code = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    error.status = 401;
    error.message = 'Token 已过期';
    error.code = 'TOKEN_EXPIRED';
  }

  // Multer 错误
  if (err.name === 'MulterError') {
    error.status = 400;
    error.message = `文件上传失败：${err.message}`;
    error.code = 'UPLOAD_ERROR';
  }

  // 响应
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(error.status || 500).json({
    code: error.code || 'INTERNAL_ERROR',
    message: isProduction && error.status >= 500 
      ? '服务器错误，请稍后重试' 
      : error.message || '服务器错误',
    error: isProduction ? undefined : err.stack,
    timestamp: Date.now()
  });
};

// 404 处理
const notFoundHandler = (req, res) => {
  log.warn(`404 - ${req.method} ${req.path}`);
  res.status(404).json({
    code: 'NOT_FOUND',
    message: '接口不存在',
    timestamp: Date.now()
  });
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler
};
