/**
 * 集成测试：API 端点
 */
const request = require('supertest');
const app = require('../../src/index');
const pool = require('../../src/config/database');

// Mock 数据库
jest.mock('../../src/config/database', () => {
  const mockPool = {
    query: jest.fn(),
    execute: jest.fn(),
    getConnection: jest.fn()
  };
  return mockPool;
});

describe('API Integration Tests', () => {
  let authToken;
  let adminToken;

  beforeAll(() => {
    // 模拟数据库连接获取
    pool.getConnection.mockResolvedValue({
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      execute: jest.fn()
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('应该返回健康状态', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Admin Login', () => {
    it('应该拒绝空用户名密码', async () => {
      const res = await request(app)
        .post('/admin/api/login')
        .send({ username: '', password: '' });

      expect(res.status).toBe(400);
    });

    it('应该拒绝不存在的用户', async () => {
      pool.query.mockResolvedValue([[]]);

      const res = await request(app)
        .post('/admin/api/login')
        .send({ username: 'notexist', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });

  describe('Product List', () => {
    it('应该获取商品列表', async () => {
      pool.query
        .mockResolvedValueOnce([[]])  // 商品列表
        .mockResolvedValueOnce([[{ total: 0 }]]); // 总数

      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
    });

    it('应该支持分页参数', async () => {
      pool.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ total: 0 }]]);

      const res = await request(app)
        .get('/api/products?page=2&pageSize=10');

      expect(res.status).toBe(200);
    });
  });

  describe('Categories', () => {
    it('应该获取分类列表', async () => {
      pool.query.mockResolvedValue([[]]);

      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
    });
  });

  describe('Protected Routes', () => {
    it('应该拒绝未授权的购物车请求', async () => {
      const res = await request(app).get('/api/cart');

      expect(res.status).toBe(401);
    });

    it('应该拒绝未授权的订单创建', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({ addressId: 1, items: [] });

      expect(res.status).toBe(401);
    });

    it('应该拒绝未授权的管理端请求', async () => {
      const res = await request(app).get('/admin/api/products');

      expect(res.status).toBe(401);
    });
  });

  describe('CORS', () => {
    it('应该允许配置的来源', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3001');

      // 检查 CORS 头
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('404 Handler', () => {
    it('应该返回 404 对于不存在的路由', async () => {
      const res = await request(app).get('/api/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  describe('Rate Limiting', () => {
    it('应该限制登录请求频率', async () => {
      pool.query.mockResolvedValue([[]]);

      // 连续发送 6 次登录请求（限制 5 次）
      for (let i = 0; i < 6; i++) {
        const res = await request(app)
          .post('/admin/api/login')
          .send({ username: 'admin', password: 'test' });

        if (i === 5) {
          expect(res.status).toBe(429);
        }
      }
    });
  });
});
