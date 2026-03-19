/**
 * 集成测试：订单流程
 *
 * 这里使用 Mock 数据库，只测试 HTTP 路由层（认证、路由解析、响应格式）。
 * 业务逻辑层的测试见 unit/order.test.js。
 * 所有需要认证的请求均期望 401，因为测试中不使用真实 JWT。
 */
const request = require('supertest');
const app = require('../../src/index');
const pool = require('../../src/config/database');

// mockConnection 暴露在模块作用域，方便各测试用例设置返回值
const mockConnection = {
  beginTransaction: jest.fn().mockResolvedValue(undefined),
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
  release: jest.fn(),
  execute: jest.fn().mockResolvedValue([[]])
};

jest.mock('../../src/config/database', () => ({
  query: jest.fn().mockResolvedValue([[]]),
  getConnection: jest.fn()
}));

beforeAll(() => {
  // 让 getConnection 返回上方定义的 mockConnection（异步）
  pool.getConnection.mockResolvedValue(mockConnection);
});

describe('Order Flow Integration Tests', () => {
  const mockOrder = {
    id: 1,
    order_no: 'ORD202603090000000000',
    user_id: 1,
    total_amount: 10000,
    status: 0,
    items: [{ product_id: 1, quantity: 2, price: 5000 }]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // 重置 getConnection mock（clearAllMocks 会清掉）
    pool.getConnection.mockResolvedValue(mockConnection);
  });

  describe('Order Creation Flow', () => {
    it('未认证请求应返回 401', async () => {
      // 设置 mockConnection.execute 的返回序列（即使不会执行到业务逻辑）
      mockConnection.execute
        .mockResolvedValueOnce([[{ id: 1, user_id: 1, name: 'Test', phone: '13800138000',
          province: '广东', city: '深圳', district: '南山', detail: '测试' }]])
        .mockResolvedValueOnce([[{ id: 1, name: 'product', price: 5000, stock: 100, status: 1, images: '[]' }]])
        .mockResolvedValueOnce([{ insertId: 1 }]);

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer invalid_token')
        .send({ addressId: 1, items: [{ productId: 1, quantity: 2 }] });

      // 无效 token → 401
      expect(res.status).toBe(401);
    });

    it('缺少认证头应返回 401', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({ addressId: 1, items: [{ productId: 1, quantity: 2 }] });

      expect(res.status).toBe(401);
    });
  });

  describe('Order Payment Flow', () => {
    it('未认证支付请求应返回 401', async () => {
      const res = await request(app)
        .post('/api/orders/pay')
        .set('Authorization', 'Bearer invalid_token')
        .send({ orderId: 1 });

      expect(res.status).toBe(401);
    });
  });

  describe('Order Cancel Flow', () => {
    it('未认证取消请求应返回 401', async () => {
      const res = await request(app)
        .post('/api/orders/cancel')
        .set('Authorization', 'Bearer invalid_token')
        .send({ orderId: 1, reason: '用户取消' });

      expect(res.status).toBe(401);
    });
  });
});
