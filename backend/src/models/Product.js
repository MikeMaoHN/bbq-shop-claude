/**
 * 商品模型 - MySQL 版本
 */
const pool = require('../config/database');

class Product {
  static async findAll(options = {}) {
    const { categoryId, isHot, page = 1, limit = 20 } = options;
    // 分页参数校验，防止越界或超大查询
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (safePage - 1) * safeLimit;

    let where = 'WHERE p.status = 1';
    const params = [];

    if (categoryId) {
      where += ' AND p.category_id = ?';
      params.push(categoryId);
    }
    if (isHot) {
      where += ' AND p.is_hot = 1';
    }

    const [list] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${where}
       ORDER BY p.sort ASC, p.id DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM products p ${where}`,
      params
    );

    return { list, total, page: safePage, limit: safeLimit };
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const { categoryId, name, description, images, price, originalPrice, stock, isHot, sort } = data;
    const [result] = await pool.query(
      'INSERT INTO products (category_id, name, description, images, price, original_price, stock, is_hot, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [categoryId, name, description, JSON.stringify(images), price, originalPrice, stock, isHot ? 1 : 0, sort || 0]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.categoryId !== undefined) { fields.push('category_id = ?'); values.push(data.categoryId); }
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.images !== undefined) { fields.push('images = ?'); values.push(JSON.stringify(data.images)); }
    if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
    if (data.originalPrice !== undefined) { fields.push('original_price = ?'); values.push(data.originalPrice); }
    if (data.stock !== undefined) { fields.push('stock = ?'); values.push(data.stock); }
    if (data.isHot !== undefined) { fields.push('is_hot = ?'); values.push(data.isHot ? 1 : 0); }
    if (data.sort !== undefined) { fields.push('sort = ?'); values.push(data.sort); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }

    if (fields.length === 0) return true;

    values.push(id);
    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async delete(id) {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
  }

  static async updateStock(id, quantity, checkStock = true) {
    if (checkStock) {
      const [rows] = await pool.query('SELECT stock FROM products WHERE id = ?', [id]);
      if (!rows[0] || rows[0].stock < quantity) return false;
    }
    const [result] = await pool.query(
      'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
      [quantity, id, quantity]
    );
    return result.affectedRows > 0;
  }

  static async increaseStock(id, quantity) {
    await pool.query('UPDATE products SET stock = stock + ? WHERE id = ?', [quantity, id]);
  }

  static async getStock(id) {
    const [rows] = await pool.query('SELECT stock FROM products WHERE id = ?', [id]);
    return rows[0]?.stock || 0;
  }

  static async search(keyword, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const searchPattern = `%${keyword}%`;

    const [list] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.status = 1 AND (p.name LIKE ? OR p.description LIKE ?)
       ORDER BY p.sort ASC, p.id DESC
       LIMIT ? OFFSET ?`,
      [searchPattern, searchPattern, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM products p WHERE p.status = 1 AND (p.name LIKE ? OR p.description LIKE ?)',
      [searchPattern, searchPattern]
    );

    return { list, total, page, limit };
  }

  static async getAllForAdmin(options = {}) {
    const { page = 1, limit = 20, status, categoryId } = options;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];

    if (status !== undefined) { where += ' AND p.status = ?'; params.push(status); }
    if (categoryId) { where += ' AND p.category_id = ?'; params.push(categoryId); }

    const [list] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${where}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM products p ${where}`,
      params
    );

    return { list, total, page, limit };
  }
}

module.exports = Product;
