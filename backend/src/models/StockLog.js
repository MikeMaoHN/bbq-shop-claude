/**
 * 库存流水模型 - MySQL 版本
 * 记录每次库存变动的完整快照（变动前/后数量、原因、关联单号），
 * 用于库存审计和追溯。
 */
const pool = require('../config/database');

class StockLog {
  /**
   * 记录一次库存变动流水
   * @param {object} data
   * @param {number} data.changeQty      - 变动数量（正=入库，负=出库）
   * @param {number} data.beforeStock    - 变动前库存快照
   * @param {number} data.afterStock     - 变动后库存快照
   * @param {string} data.referenceType  - 关联业务类型，如 'order'/'manual'
   * @param {number} data.referenceId    - 关联业务 ID（如订单 ID）
   */
  static async create(data) {
    const { productId, changeQty, beforeStock, afterStock, reason, referenceType, referenceId, operatorId, remark } = data;

    const [result] = await pool.query(
      `INSERT INTO stock_logs (product_id, change_qty, before_stock, after_stock, reason, reference_type, reference_id, operator_id, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, changeQty, beforeStock, afterStock, reason, referenceType, referenceId, operatorId, remark]
    );
    return result.insertId;
  }

  /**
   * 按商品 ID 分页查询库存流水，关联商品名称
   * 按时间倒序返回，便于管理员查看最新变动
   */
  static async findByProductId(productId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const [list] = await pool.query(
      `SELECT sl.*, p.name as product_name
       FROM stock_logs sl
       LEFT JOIN products p ON sl.product_id = p.id
       WHERE sl.product_id = ?
       ORDER BY sl.created_at DESC
       LIMIT ? OFFSET ?`,
      [productId, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM stock_logs WHERE product_id = ?',
      [productId]
    );
    return { list, total, page, limit };
  }

  /** 查询全部商品的库存流水（管理端库存日志页使用），分页返回 */
  static async findAll(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const [list] = await pool.query(
      `SELECT sl.*, p.name as product_name
       FROM stock_logs sl
       LEFT JOIN products p ON sl.product_id = p.id
       ORDER BY sl.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM stock_logs');
    return { list, total, page, limit };
  }

  /**
   * 查询库存低于预警阈值的在售商品
   * 默认阈值 10 件，按库存升序排列（最紧缺的优先）
   */
  static async getLowStockProducts(threshold = 10) {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE stock <= ? AND status = 1 ORDER BY stock ASC',
      [threshold]
    );
    return rows;
  }
}

module.exports = StockLog;
