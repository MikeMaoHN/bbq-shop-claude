/**
 * 操作日志中间件
 * 记录所有管理员操作到数据库
 */
const OperationLog = require('../models/OperationLog');
const Logger = require('../utils/logger');
const log = new Logger('OperationLogMiddleware');

// 需要记录的操作路径映射
const actionMap = {
  // 商品管理
  'POST /admin/api/products': '创建商品',
  'PUT /admin/api/products/:id': '更新商品',
  'DELETE /admin/api/products/:id': '删除商品',
  'PUT /admin/api/products/batch-status': '批量修改商品状态',
  'PUT /admin/api/products/:id/stock': '调整商品库存',
  
  // 分类管理
  'POST /admin/api/categories': '创建分类',
  'PUT /admin/api/categories/:id': '更新分类',
  'DELETE /admin/api/categories/:id': '删除分类',
  
  // 订单管理
  'PUT /admin/api/orders/:id/ship': '订单发货',
  'PUT /admin/api/orders/:id/remark': '添加订单备注',
  
  // 管理员
  'PUT /admin/api/admin/password': '修改密码',
  
  // 库存
  'POST /admin/api/stock/adjust': '库存调整'
};

// 敏感信息字段（需要脱敏）
const sensitiveFields = ['password', 'oldPassword', 'newPassword', 'token', 'apikey', 'secret'];

/**
 * 脱敏处理
 */
function sanitize(data) {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveFields.includes(key.toLowerCase())) {
      sanitized[key] = '***';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitize(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * 获取客户端 IP
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         'unknown';
}

/**
 * 操作日志中间件
 */
const operationLogMiddleware = async (req, res, next) => {
  // 仅记录管理端 API
  if (!req.path.startsWith('/admin/api')) {
    return next();
  }
  
  // 跳过查询请求和登录
  if (req.method === 'GET' || req.path === '/admin/api/login') {
    return next();
  }
  
  const startTime = Date.now();
  const originalJson = res.json.bind(res);
  
  // 缓存响应数据
  let responseData;
  res.json = (data) => {
    responseData = data;
    return originalJson(data);
  };
  
  try {
    // 等待请求处理完成
    await next();
    
    // 异步记录日志（不阻塞响应）
    setImmediate(async () => {
      try {
        const actionKey = `${req.method} ${req.path}`;
        const action = actionMap[actionKey] || `${req.method} ${req.path}`;
        
        // 提取关键参数
        const params = {
          body: sanitize(req.body),
          query: sanitize(req.query),
          params: sanitize(req.params)
        };
        
        // 记录操作日志
        await OperationLog.create({
          adminId: req.admin?.adminId || null,
          action,
          module: req.path.split('/')[2] || 'unknown',
          method: req.method,
          path: req.path,
          params,
          ip: getClientIP(req),
          userAgent: req.headers['user-agent'] || '',
          status: res.statusCode,
          response: sanitize(responseData),
          duration: Date.now() - startTime
        });
        
        log.info(`操作日志：${req.admin?.username || 'anonymous'} - ${action} - ${res.statusCode}`);
      } catch (error) {
        log.error('记录操作日志失败:', error.message);
      }
    });
  } catch (error) {
    // 错误情况下也记录日志
    setImmediate(async () => {
      try {
        await OperationLog.create({
          adminId: req.admin?.adminId || null,
          action: `${req.method} ${req.path}`,
          module: req.path.split('/')[2] || 'unknown',
          method: req.method,
          path: req.path,
          params: { body: sanitize(req.body), query: sanitize(req.query) },
          ip: getClientIP(req),
          userAgent: req.headers['user-agent'] || '',
          status: res.statusCode,
          response: { error: error.message },
          duration: Date.now() - startTime
        });
      } catch (logError) {
        log.error('记录错误日志失败:', logError.message);
      }
    });
    
    throw error;
  }
};

module.exports = operationLogMiddleware;
