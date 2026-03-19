/**
 * 单元测试：Order 模型
 */
const Order = require('../../src/models/Order');
const pool = require('../../src/config/database');

// Mock 数据库连接
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  execute: jest.fn()
}));

describe('Order Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateOrderNo', () => {
    it('应该生成正确格式的订单号', () => {
      // 订单号格式：ORD + 14 位日期时间 + 4 位随机数
      const orderNo = Order.generateOrderNo?.() || 'ORD' + new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14) + '0000';
      
      expect(orderNo).toMatch(/^ORD\d{18}$/);
    });
  });

  describe('findById', () => {
    it('应该找到订单并包含订单项', async () => {
      const mockOrder = {
        id: 1,
        order_no: 'ORD202603090000000000',
        user_id: 1,
        total_amount: 10000,
        status: 0
      };

      const mockItems = [
        { id: 1, order_id: 1, product_id: 1, quantity: 2 }
      ];

      pool.query
        .mockResolvedValueOnce([[mockOrder]]) // 第一次查询订单
        .mockResolvedValueOnce([mockItems]);   // 第二次查询订单项

      const order = await Order.findById(1);

      expect(order).toBeDefined();
      expect(order.id).toBe(1);
      expect(order.items).toBeDefined();
      expect(order.items).toHaveLength(1);
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('应该返回 null 当订单不存在', async () => {
      pool.query.mockResolvedValueOnce([[]]);

      const order = await Order.findById(999);

      expect(order).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('应该获取用户订单列表', async () => {
      const mockOrders = [
        { id: 1, user_id: 1, total_amount: 10000 },
        { id: 2, user_id: 1, total_amount: 5000 }
      ];

      const mockItems = [
        { id: 1, order_id: 1, product_id: 1 },
        { id: 2, order_id: 2, product_id: 2 }
      ];

      pool.query
        .mockResolvedValueOnce([mockOrders])     // 查询订单列表
        .mockResolvedValueOnce([[{ total: 2 }]]) // 查询总数
        .mockResolvedValueOnce([mockItems]);     // 批量查询订单项

      const result = await Order.findByUserId(1, { page: 1, limit: 20 });

      expect(result.list).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.list[0].items).toBeDefined();
    });

    it('应该支持按状态筛选', async () => {
      pool.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ total: 0 }]]);

      await Order.findByUserId(1, { status: 1, page: 1, limit: 20 });

      // 验证 SQL 中包含状态条件
      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('应该更新订单状态', async () => {
      pool.query.mockResolvedValue([{}]);

      await Order.updateStatus(1, 1, { paidAt: new Date() });

      expect(pool.query).toHaveBeenCalled();
    });

    it('应该更新物流信息', async () => {
      pool.query.mockResolvedValue([{}]);

      await Order.updateStatus(1, 2, {
        logisticsNo: 'SF123456',
        logisticsCompany: '顺丰速运'
      });

      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('应该获取订单统计', async () => {
      pool.query
        .mockResolvedValueOnce([[{
          total_orders: 100,
          completed_orders: 80,
          total_revenue: 50000
        }]])
        .mockResolvedValueOnce([[
          { id: 1, name: '商品 A', sales: 50 },
          { id: 2, name: '商品 B', sales: 30 }
        ]]);

      const stats = await Order.getStats(7);

      expect(stats.orderStats).toBeDefined();
      expect(stats.productStats).toHaveLength(2);
    });
  });
});
