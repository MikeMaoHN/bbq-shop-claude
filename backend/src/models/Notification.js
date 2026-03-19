/**
 * 站内信通知模型
 * 仅面向管理端，用于记录需要人工关注的系统事件（如用户取消待发货订单）。
 */
const pool = require('../config/database');

class Notification {
  /**
   * 创建一条通知
   * @param {object} data - { type, title, content, refType, refId }
   */
  static async create({ type = 'order_cancel', title, content, refType = null, refId = null }) {
    const [result] = await pool.query(
      `INSERT INTO notifications (type, title, content, ref_type, ref_id)
       VALUES (?, ?, ?, ?, ?)`,
      [type, title, content, refType, refId]
    );
    return result.insertId;
  }

  /**
   * 分页查询通知列表，未读优先
   * @param {object} options - { page, limit }
   */
  static async getList({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;

    const [list] = await pool.query(
      `SELECT * FROM notifications
       ORDER BY is_read ASC, created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM notifications'
    );

    return { list, total, page, limit };
  }

  /**
   * 获取未读通知数量
   */
  static async getUnreadCount() {
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE is_read = 0'
    );
    return count;
  }

  /**
   * 将指定通知标记为已读
   * @param {number} id - 通知 ID
   */
  static async markRead(id) {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [id]
    );
  }

  /**
   * 将所有未读通知标记为已读
   */
  static async markAllRead() {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE is_read = 0'
    );
    return result.affectedRows;
  }
}

module.exports = Notification;
