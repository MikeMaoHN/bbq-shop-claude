/**
 * 管理员模型 - MySQL 版本
 * 提供管理员账号的查询、创建、密码校验与状态管理。
 * 密码均通过 bcrypt（salt rounds=10）存储，不保存明文。
 */
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class Admin {
  /** 按用户名查询管理员，登录鉴权时使用 */
  static async findByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
    return rows[0] || null;
  }

  /** 按主键查询管理员 */
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM admins WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /**
   * 创建新管理员
   * @param {string} role - 角色，默认 'admin'，超管为 'super_admin'
   */
  static async create({ username, password, role = 'admin' }) {
    // 入库前 hash 密码，禁止明文存储
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO admins (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );
    return result.insertId;
  }

  /** 校验明文密码是否与数据库 hash 匹配，返回 boolean */
  static async verifyPassword(admin, password) {
    return bcrypt.compare(password, admin.password);
  }

  /** 修改密码（入库前重新 hash） */
  static async updatePassword(id, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, id]);
  }

  /** 启用/禁用管理员账号（status: 1=启用, 0=禁用） */
  static async updateStatus(id, status) {
    await pool.query('UPDATE admins SET status = ? WHERE id = ?', [status, id]);
  }
}

module.exports = Admin;
