/**
 * 商品分类模型 - MySQL 版本
 * 小程序端与管理端共用，区别在于查询范围：
 * - 小程序端只返回 status=1 的启用分类
 * - 管理端（getAllForAdmin）不过滤状态，支持分页
 */
const pool = require('../config/database');

class Category {
  /** 获取所有启用的分类，按 sort 升序（小程序端首页使用） */
  static async findAll() {
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE status = 1 ORDER BY sort ASC, id ASC'
    );
    return rows;
  }

  /**
   * 获取启用分类并附带每个分类下的上架商品数量
   * 使用 LEFT JOIN + COUNT 一次查询避免 N+1
   */
  static async findAllWithCount() {
    const [rows] = await pool.query(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 1
      WHERE c.status = 1
      GROUP BY c.id
      ORDER BY c.sort ASC, c.id ASC
    `);
    return rows;
  }

  /** 按主键查询分类（不过滤状态，管理端编辑时使用） */
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /** 创建分类，sort 默认为 0（最靠前） */
  static async create({ name, icon, sort = 0 }) {
    const [result] = await pool.query(
      'INSERT INTO categories (name, icon, sort) VALUES (?, ?, ?)',
      [name, icon, sort]
    );
    return result.insertId;
  }

  /**
   * 部分更新分类字段（动态构建 SET 子句，只更新传入的字段）
   * 支持同时更新名称、图标、排序、状态
   */
  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.icon !== undefined) { fields.push('icon = ?'); values.push(data.icon); }
    if (data.sort !== undefined) { fields.push('sort = ?'); values.push(data.sort); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }

    if (fields.length === 0) return true;

    values.push(id);
    await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  /** 硬删除分类（调用前应检查是否有关联商品） */
  static async delete(id) {
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  }

  /**
   * 管理端分页查询所有分类（含禁用状态）
   * 同时返回总数用于前端分页组件
   */
  static async getAllForAdmin(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [list] = await pool.query(
      'SELECT * FROM categories ORDER BY sort ASC, id ASC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM categories');
    return { list, total, page, limit };
  }
}

module.exports = Category;
