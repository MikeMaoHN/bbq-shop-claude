/**
 * 收货地址模型 - MySQL 版本
 * 封装用户收货地址的增删改查，支持默认地址互斥逻辑。
 */
const pool = require('../config/database');

class Address {
  /** 查询指定用户的全部地址，默认地址排在最前 */
  static async findByUserId(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC',
      [userId]
    );
    return rows;
  }

  /** 按主键查询单条地址 */
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM addresses WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /** 获取用户的默认地址，不存在时返回 null */
  static async findDefault(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? AND is_default = 1',
      [userId]
    );
    return rows[0] || null;
  }

  /**
   * 创建新地址
   * 若新地址设为默认，先将该用户所有地址的 is_default 清零，确保互斥
   */
  static async create(data) {
    const { userId, name, phone, province, city, district, detail, isDefault } = data;

    if (isDefault) {
      // 取消同一用户其他地址的默认标记
      await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }

    const [result] = await pool.query(
      'INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, name, phone, province, city, district, detail, isDefault ? 1 : 0]
    );
    return result.insertId;
  }

  /**
   * 更新地址字段（仅修改传入的字段，避免覆盖未变更的值）
   * 若将某地址设为默认，同时清除同用户其他地址的默认标记
   */
  static async update(id, userId, data) {
    const fields = [];
    const values = [];

    // 动态构建 SET 子句，只更新有值的字段
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.province !== undefined) { fields.push('province = ?'); values.push(data.province); }
    if (data.city !== undefined) { fields.push('city = ?'); values.push(data.city); }
    if (data.district !== undefined) { fields.push('district = ?'); values.push(data.district); }
    if (data.detail !== undefined) { fields.push('detail = ?'); values.push(data.detail); }

    if (data.isDefault !== undefined) {
      fields.push('is_default = ?');
      values.push(data.isDefault ? 1 : 0);
      if (data.isDefault) {
        // 将同用户其他地址的默认标记清零（排除当前地址）
        await pool.query(
          'UPDATE addresses SET is_default = 0 WHERE user_id = ? AND id != ?',
          [userId, id]
        );
      }
    }

    if (fields.length === 0) return true;

    values.push(id, userId);
    await pool.query(
      `UPDATE addresses SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    return true;
  }

  /** 删除地址，WHERE 条件同时校验 userId 防止越权删除 */
  static async delete(id, userId) {
    await pool.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
  }
}

module.exports = Address;
