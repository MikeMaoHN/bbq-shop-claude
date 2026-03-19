/**
 * 单元测试：验证中间件 & 认证中间件
 */
const { adminLoginValidation, orderCreateValidation } = require('../../src/middleware/validation');
const { generateToken, refreshToken } = require('../../src/middleware/auth');

// ─────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────

const createMockReq = (body = {}, params = {}, query = {}) => ({
  body,
  params,
  query
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * 依次执行 express-validator 中间件数组（模拟 Express 链式调用）
 *
 * express-validator 的 validator 函数需按顺序执行，才能将错误注入到 req，
 * 供最后的 handleValidationErrors 读取。
 *
 * 特殊处理：当 handleValidationErrors 发现错误时会调用 res.json() 而不是 next()，
 * 此时 Promise 应立即 resolve（响应已发送，链终止）。
 */
const runMiddlewareChain = (middlewares, req, res) => {
  return new Promise((resolve, reject) => {
    // 拦截 res.json：响应发出即视为链结束
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      originalJson(data);
      resolve();
      return res;
    };

    let index = 0;

    const next = (err) => {
      if (err) return reject(err);
      index++;
      if (index < middlewares.length) {
        try {
          const result = middlewares[index](req, res, next);
          if (result && typeof result.catch === 'function') {
            result.catch(reject);
          }
        } catch (e) {
          reject(e);
        }
      } else {
        // 所有中间件都调用了 next()，说明验证通过
        resolve();
      }
    };

    try {
      const result = middlewares[0](req, res, next);
      if (result && typeof result.catch === 'function') {
        result.catch(reject);
      }
    } catch (e) {
      reject(e);
    }
  });
};

// ─────────────────────────────────────────────
// 验证中间件测试
// ─────────────────────────────────────────────

describe('Validation Middleware', () => {
  describe('adminLoginValidation', () => {
    it('应该通过有效的登录参数', async () => {
      const req = createMockReq({ username: 'admin', password: 'admin123' });
      const res = createMockRes();
      const next = jest.fn();

      await runMiddlewareChain(adminLoginValidation, req, res);

      // 整个链执行完后 next 在 handleValidationErrors 中被调用
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该拒绝空用户名', async () => {
      const req = createMockReq({ username: '', password: 'admin123' });
      const res = createMockRes();

      await runMiddlewareChain(adminLoginValidation, req, res);

      // res.json 被 runMiddlewareChain 包装，通过检查 status(400) 确认请求被拒绝
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('应该拒绝过短的密码', async () => {
      const req = createMockReq({ username: 'admin', password: '123' });
      const res = createMockRes();

      await runMiddlewareChain(adminLoginValidation, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('应该拒绝过长的用户名', async () => {
      const req = createMockReq({ username: 'a'.repeat(65), password: 'admin123' });
      const res = createMockRes();

      await runMiddlewareChain(adminLoginValidation, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('orderCreateValidation', () => {
    it('应该通过有效的订单参数', async () => {
      const req = createMockReq({
        addressId: 1,
        items: [{ productId: 1, quantity: 2 }],
        remark: '请尽快发货'
      });
      const res = createMockRes();

      await runMiddlewareChain(orderCreateValidation, req, res);

      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该拒绝空的购物车', async () => {
      const req = createMockReq({ addressId: 1, items: [] });
      const res = createMockRes();

      await runMiddlewareChain(orderCreateValidation, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('应该拒绝超出上限的数量', async () => {
      const req = createMockReq({
        addressId: 1,
        items: [{ productId: 1, quantity: 100 }]  // 最大 99
      });
      const res = createMockRes();

      await runMiddlewareChain(orderCreateValidation, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('应该拒绝缺少 addressId', async () => {
      const req = createMockReq({
        items: [{ productId: 1, quantity: 2 }]
      });
      const res = createMockRes();

      await runMiddlewareChain(orderCreateValidation, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});

// ─────────────────────────────────────────────
// 认证中间件测试
// ─────────────────────────────────────────────

describe('Auth Middleware', () => {
  describe('generateToken', () => {
    it('应该生成有效的 JWT token（三段式结构）', () => {
      const payload = { userId: 1, username: 'test' };
      const token = generateToken(payload, false);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('应该生成包含管理员标志的 token', () => {
      const payload = { adminId: 1, username: 'admin' };
      const token = generateToken(payload, true);

      expect(token).toBeDefined();
      // 解码验证 isAdmin 字段
      const jwt = require('jsonwebtoken');
      const config = require('../../src/config');
      const decoded = jwt.verify(token, config.jwt.secret);
      expect(decoded.isAdmin).toBe(true);
    });
  });

  describe('refreshToken', () => {
    it('应该刷新有效的 token 并返回新 token', () => {
      // 使用假定时器让两次 Date.now() 相差 1 秒，避免同秒 iat 相同
      jest.useFakeTimers();
      const payload = { userId: 1, username: 'test' };
      const originalToken = generateToken(payload, false);

      jest.advanceTimersByTime(2000); // 推进 2 秒
      const newToken = refreshToken(originalToken);
      jest.useRealTimers();

      expect(newToken).toBeDefined();
      expect(newToken).not.toBeNull();
      expect(newToken).not.toBe(originalToken);
    });

    it('应该返回 null 对于无效的 token', () => {
      const result = refreshToken('invalid_token');
      expect(result).toBeNull();
    });

    it('应该保留原 token 的 userId payload', () => {
      jest.useFakeTimers();
      const payload = { userId: 42, username: 'testuser' };
      const originalToken = generateToken(payload, false);

      jest.advanceTimersByTime(2000);
      const newToken = refreshToken(originalToken);
      jest.useRealTimers();

      const jwt = require('jsonwebtoken');
      const config = require('../../src/config');
      const decoded = jwt.verify(newToken, config.jwt.secret);
      expect(decoded.userId).toBe(42);
    });
  });
});
