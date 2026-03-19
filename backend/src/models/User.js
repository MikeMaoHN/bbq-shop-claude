/**
 * 用户模型 - MySQL 版本
 * 对应微信小程序用户，主键为数据库自增 ID，业务唯一标识为微信 openid。
 */
const pool = require('../config/database');

class User {
  /** 按微信 openid 查询用户，登录时用于判断是否首次登录 */
  static async findByOpenid(openid) {
    const [rows] = await pool.query('SELECT * FROM users WHERE openid = ?', [openid]);
    return rows[0] || null;
  }

  /** 按数据库主键查询用户（JWT payload 中存储的是 userId） */
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /** 新用户首次登录时创建记录，返回新用户 ID */
  static async create({ openid, session_key, nickname, avatar, phone }) {
    const [result] = await pool.query(
      'INSERT INTO users (openid, session_key, nickname, avatar, phone) VALUES (?, ?, ?, ?, ?)',
      [openid, session_key, nickname, avatar, phone]
    );
    return result.insertId;
  }

  /**
   * 部分更新用户资料（只更新传入的字段）
   * 可更新：昵称、头像 URL、手机号
   */
  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.nickname !== undefined) { fields.push('nickname = ?'); values.push(data.nickname); }
    if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }

    if (fields.length === 0) return true;

    values.push(id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  /**
   * 更新微信 session_key
   * 每次登录时微信会下发新的 session_key，需同步更新以保持有效性
   */
  static async updateSessionKey(openid, sessionKey) {
    await pool.query('UPDATE users SET session_key = ? WHERE openid = ?', [sessionKey, openid]);
  }
}

module.exports = User;
