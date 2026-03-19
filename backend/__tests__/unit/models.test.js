/**
 * 单元测试：核心数据模型（Address / Admin / Category / User / CartItem / StockLog）
 *
 * 所有测试均使用 jest.mock 模拟数据库连接，不依赖真实 MySQL 环境。
 */

const pool = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

beforeEach(() => {
  jest.clearAllMocks();
});

// ──────────────────────────────────────────────
// Address 模型
// ──────────────────────────────────────────────
describe('Address Model', () => {
  const Address = require('../../src/models/Address');

  describe('findByUserId', () => {
    it('应返回用户的地址列表（默认地址排在前）', async () => {
      const mockRows = [
        { id: 1, user_id: 1, is_default: 1, name: '张三' },
        { id: 2, user_id: 1, is_default: 0, name: '李四' }
      ];
      pool.query.mockResolvedValue([mockRows]);

      const result = await Address.findByUserId(1);

      expect(result).toHaveLength(2);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY is_default DESC'),
        [1]
      );
    });
  });

  describe('findById', () => {
    it('应返回指定 ID 的地址', async () => {
      const mockRow = { id: 5, user_id: 1, name: '王五' };
      pool.query.mockResolvedValue([[mockRow]]);

      const result = await Address.findById(5);

      expect(result).toEqual(mockRow);
    });

    it('地址不存在时应返回 null', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await Address.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findDefault', () => {
    it('应返回用户的默认地址', async () => {
      const defaultAddr = { id: 1, user_id: 1, is_default: 1 };
      pool.query.mockResolvedValue([[defaultAddr]]);

      const result = await Address.findDefault(1);

      expect(result).toEqual(defaultAddr);
    });

    it('无默认地址时应返回 null', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await Address.findDefault(1);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('创建普通地址时不清除默认标记', async () => {
      pool.query.mockResolvedValue([{ insertId: 10 }]);

      const id = await Address.create({
        userId: 1, name: '测试', phone: '13800138000',
        province: '广东', city: '深圳', district: '南山', detail: '某某路',
        isDefault: false
      });

      // isDefault=false → 不应 UPDATE 其他地址
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(id).toBe(10);
    });

    it('创建默认地址时先清除其他地址的默认标记', async () => {
      pool.query
        .mockResolvedValueOnce([{}])            // UPDATE is_default=0
        .mockResolvedValueOnce([{ insertId: 11 }]); // INSERT

      const id = await Address.create({
        userId: 1, name: '默认', phone: '13800138000',
        province: '广东', city: '深圳', district: '南山', detail: '某某路',
        isDefault: true
      });

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(id).toBe(11);
    });
  });

  describe('delete', () => {
    it('应仅删除属于该用户的地址（防越权）', async () => {
      pool.query.mockResolvedValue([{}]);

      await Address.delete(5, 1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ? AND user_id = ?'),
        [5, 1]
      );
    });
  });
});

// ──────────────────────────────────────────────
// Admin 模型
// ──────────────────────────────────────────────
describe('Admin Model', () => {
  const Admin = require('../../src/models/Admin');

  describe('findByUsername', () => {
    it('应返回匹配用户名的管理员', async () => {
      const mockAdmin = { id: 1, username: 'admin', role: 'super_admin' };
      pool.query.mockResolvedValue([[mockAdmin]]);

      const result = await Admin.findByUsername('admin');

      expect(result).toEqual(mockAdmin);
    });

    it('用户名不存在时应返回 null', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await Admin.findByUsername('notexist');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('应返回指定 ID 的管理员', async () => {
      const mockAdmin = { id: 2, username: 'manager' };
      pool.query.mockResolvedValue([[mockAdmin]]);

      const result = await Admin.findById(2);

      expect(result).toEqual(mockAdmin);
    });
  });

  describe('verifyPassword', () => {
    it('正确密码应返回 true', async () => {
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash('admin123', 10);
      const mockAdmin = { password: hashed };

      const result = await Admin.verifyPassword(mockAdmin, 'admin123');

      expect(result).toBe(true);
    });

    it('错误密码应返回 false', async () => {
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash('admin123', 10);
      const mockAdmin = { password: hashed };

      const result = await Admin.verifyPassword(mockAdmin, 'wrongpassword');

      expect(result).toBe(false);
    });
  });

  describe('updateStatus', () => {
    it('应更新管理员启用/禁用状态', async () => {
      pool.query.mockResolvedValue([{}]);

      await Admin.updateStatus(1, 0);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE admins SET status'),
        [0, 1]
      );
    });
  });
});

// ──────────────────────────────────────────────
// Category 模型
// ──────────────────────────────────────────────
describe('Category Model', () => {
  const Category = require('../../src/models/Category');

  describe('findAll', () => {
    it('应只返回启用的分类，按 sort 排序', async () => {
      const mockCats = [{ id: 1, name: '肉类', status: 1, sort: 1 }];
      pool.query.mockResolvedValue([mockCats]);

      const result = await Category.findAll();

      expect(result).toHaveLength(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('status = 1')
      );
    });
  });

  describe('findById', () => {
    it('应返回指定分类（包括禁用状态）', async () => {
      const mockCat = { id: 3, name: '海鲜', status: 0 };
      pool.query.mockResolvedValue([[mockCat]]);

      const result = await Category.findById(3);

      expect(result).toEqual(mockCat);
    });

    it('分类不存在时应返回 null', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await Category.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('应插入分类并返回新 ID', async () => {
      pool.query.mockResolvedValue([{ insertId: 5 }]);

      const id = await Category.create({ name: '蔬菜', icon: '', sort: 10 });

      expect(id).toBe(5);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categories'),
        ['蔬菜', '', 10]
      );
    });
  });

  describe('update', () => {
    it('应只更新传入的字段', async () => {
      pool.query.mockResolvedValue([{}]);

      await Category.update(1, { name: '新名称' });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('name = ?');
      expect(sql).not.toContain('icon = ?');
      expect(params).toContain('新名称');
    });

    it('空数据时不执行 SQL', async () => {
      const result = await Category.update(1, {});

      expect(pool.query).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('应删除指定 ID 的分类', async () => {
      pool.query.mockResolvedValue([{}]);

      await Category.delete(3);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM categories WHERE id = ?'),
        [3]
      );
    });
  });
});

// ──────────────────────────────────────────────
// User 模型
// ──────────────────────────────────────────────
describe('User Model', () => {
  const User = require('../../src/models/User');

  describe('findByOpenid', () => {
    it('应通过 openid 查找用户', async () => {
      const mockUser = { id: 1, openid: 'wx_abc123' };
      pool.query.mockResolvedValue([[mockUser]]);

      const result = await User.findByOpenid('wx_abc123');

      expect(result).toEqual(mockUser);
    });

    it('openid 不存在时应返回 null', async () => {
      pool.query.mockResolvedValue([[]]);

      const result = await User.findByOpenid('wx_notexist');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('应通过 ID 查找用户', async () => {
      const mockUser = { id: 7, openid: 'wx_def456' };
      pool.query.mockResolvedValue([[mockUser]]);

      const result = await User.findById(7);

      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('应创建用户并返回新 ID', async () => {
      pool.query.mockResolvedValue([{ insertId: 42 }]);

      const id = await User.create({
        openid: 'wx_new', session_key: 'sk_123',
        nickname: '新用户', avatar: '', phone: ''
      });

      expect(id).toBe(42);
    });
  });

  describe('update', () => {
    it('只更新传入的字段', async () => {
      pool.query.mockResolvedValue([{}]);

      await User.update(1, { nickname: '新昵称' });

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('nickname = ?');
      expect(sql).not.toContain('avatar = ?');
      expect(params).toContain('新昵称');
    });

    it('空数据时不执行 SQL', async () => {
      const result = await User.update(1, {});

      expect(pool.query).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('updateSessionKey', () => {
    it('应更新指定 openid 的 session_key', async () => {
      pool.query.mockResolvedValue([{}]);

      await User.updateSessionKey('wx_abc', 'new_sk');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET session_key'),
        ['new_sk', 'wx_abc']
      );
    });
  });
});

// ──────────────────────────────────────────────
// StockLog 模型
// ──────────────────────────────────────────────
describe('StockLog Model', () => {
  const StockLog = require('../../src/models/StockLog');

  describe('create', () => {
    it('应创建库存流水记录并返回新 ID', async () => {
      pool.query.mockResolvedValue([{ insertId: 100 }]);

      const id = await StockLog.create({
        productId: 1,
        changeQty: -2,
        beforeStock: 50,
        afterStock: 48,
        reason: '下单扣减',
        referenceType: 'order',
        referenceId: 10,
        operatorId: null,
        remark: ''
      });

      expect(id).toBe(100);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO stock_logs'),
        expect.arrayContaining([1, -2, 50, 48, '下单扣减'])
      );
    });
  });

  describe('findByProductId', () => {
    it('应返回指定商品的库存流水（分页）', async () => {
      const mockList = [{ id: 1, product_id: 1, change_qty: -2 }];
      pool.query
        .mockResolvedValueOnce([mockList])
        .mockResolvedValueOnce([[{ total: 1 }]]);

      const result = await StockLog.findByProductId(1, 1, 10);

      expect(result.list).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getLowStockProducts', () => {
    it('应返回库存低于阈值的在售商品', async () => {
      const mockProducts = [
        { id: 1, name: '牛肉', stock: 5, status: 1 }
      ];
      pool.query.mockResolvedValue([mockProducts]);

      const result = await StockLog.getLowStockProducts(10);

      expect(result).toHaveLength(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('stock <= ?'),
        [10]
      );
    });
  });
});

// ──────────────────────────────────────────────
// CartItem 模型
// ──────────────────────────────────────────────
describe('CartItem Model', () => {
  const CartItem = require('../../src/models/CartItem');

  describe('findByUserId', () => {
    it('应返回用户购物车中所有商品（含商品信息）', async () => {
      const mockItems = [
        { id: 1, user_id: 1, product_id: 1, quantity: 2, name: '牛肉' }
      ];
      pool.query.mockResolvedValue([mockItems]);

      const result = await CartItem.findByUserId(1);

      expect(result).toHaveLength(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INNER JOIN products'),
        [1]
      );
    });
  });

  describe('addOrUpdate', () => {
    it('商品不存在时应创建新条目', async () => {
      pool.query
        .mockResolvedValueOnce([[]])                   // findByUserAndProduct → 不存在
        .mockResolvedValueOnce([{ insertId: 20 }]);    // INSERT

      const id = await CartItem.addOrUpdate(1, 5, 3);

      expect(id).toBe(20);
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('商品已存在时应累加数量', async () => {
      pool.query
        .mockResolvedValueOnce([[{ id: 10, user_id: 1, product_id: 5, quantity: 2 }]])  // 已存在
        .mockResolvedValueOnce([{}]);   // UPDATE

      const id = await CartItem.addOrUpdate(1, 5, 1);

      expect(id).toBe(10);
      expect(pool.query).toHaveBeenLastCalledWith(
        expect.stringContaining('quantity = quantity + ?'),
        expect.arrayContaining([1])
      );
    });
  });

  describe('clear', () => {
    it('应清空指定用户的购物车', async () => {
      pool.query.mockResolvedValue([{}]);

      await CartItem.clear(1);

      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM cart_items WHERE user_id = ?',
        [1]
      );
    });
  });

  describe('getCheckedItems', () => {
    it('应只返回已勾选且商品上架的购物车条目', async () => {
      const mockItems = [{ id: 1, checked: 1, status: 1 }];
      pool.query.mockResolvedValue([mockItems]);

      const result = await CartItem.getCheckedItems(1);

      expect(result).toHaveLength(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('checked = 1 AND p.status = 1'),
        [1]
      );
    });
  });
});
