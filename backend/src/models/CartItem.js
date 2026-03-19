/**
 * 购物车模型 - MySQL 版本
 * 购物车条目与商品表做 JOIN 查询，避免独立查询商品信息（防止 N+1）。
 * 勾选状态（checked）用于区分结算与未结算商品。
 */
const pool = require('../config/database');

class CartItem {
  /**
   * 获取用户购物车全部商品，关联商品表取名称/价格/图片/库存/状态
   * 按加入购物车时间倒序排列
   */
  static async findByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT ci.*, p.name, p.price, p.images, p.stock, p.status
       FROM cart_items ci
       INNER JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?
       ORDER BY ci.created_at DESC`,
      [userId]
    );
    return rows;
  }

  /** 按购物车条目 ID 查询单条，同时 JOIN 商品表 */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT ci.*, p.name, p.price, p.images, p.stock, p.status
       FROM cart_items ci
       INNER JOIN products p ON ci.product_id = p.id
       WHERE ci.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /** 按用户 + 商品联合查询，用于判断购物车中是否已有该商品 */
  static async findByUserAndProduct(userId, productId) {
    const [rows] = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    return rows[0] || null;
  }

  /**
   * 加入购物车或更新数量
   * 若该商品已在购物车中，则在原有数量基础上累加；否则新建条目
   */
  static async addOrUpdate(userId, productId, quantity, checked = 1) {
    const existing = await this.findByUserAndProduct(userId, productId);

    if (existing) {
      // 已存在则累加数量
      await pool.query(
        'UPDATE cart_items SET quantity = quantity + ?, checked = ? WHERE id = ?',
        [quantity, checked, existing.id]
      );
      return existing.id;
    } else {
      const [result] = await pool.query(
        'INSERT INTO cart_items (user_id, product_id, quantity, checked) VALUES (?, ?, ?, ?)',
        [userId, productId, quantity, checked]
      );
      return result.insertId;
    }
  }

  /** 修改购物车条目数量（WHERE 包含 userId 防止越权修改） */
  static async updateQuantity(id, userId, quantity) {
    await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, id, userId]
    );
  }

  /** 修改单条购物车的勾选状态 */
  static async updateChecked(id, userId, checked) {
    await pool.query(
      'UPDATE cart_items SET checked = ? WHERE id = ? AND user_id = ?',
      [checked ? 1 : 0, id, userId]
    );
  }

  /** 全选/取消全选：批量更新该用户所有购物车条目的勾选状态 */
  static async updateAllChecked(userId, checked) {
    await pool.query(
      'UPDATE cart_items SET checked = ? WHERE user_id = ?',
      [checked ? 1 : 0, userId]
    );
  }

  /** 删除单条购物车条目（校验 userId 防越权） */
  static async delete(id, userId) {
    await pool.query('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [id, userId]);
  }

  /** 按用户 + 商品删除购物车条目（下单后清除已购商品使用） */
  static async deleteByUserAndProduct(userId, productId) {
    await pool.query(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
  }

  /** 清空指定用户的整个购物车 */
  static async clear(userId) {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
  }

  /**
   * 获取用户已勾选且商品上架（status=1）的购物车条目
   * 用于下单前汇总商品信息，过滤已下架商品
   */
  static async getCheckedItems(userId) {
    const [rows] = await pool.query(
      `SELECT ci.*, p.name, p.price, p.images, p.stock, p.status
       FROM cart_items ci
       INNER JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ? AND ci.checked = 1 AND p.status = 1
       ORDER BY ci.created_at DESC`,
      [userId]
    );
    return rows;
  }
}

module.exports = CartItem;
