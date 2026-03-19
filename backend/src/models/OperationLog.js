/**
 * 操作日志模型
 */
const pool = require('../config/database');

class OperationLog {
  /**
   * 创建操作日志
   */
  static async create(data) {
    const {
      adminId,
      action,
      module,
      method,
      path,
      params,
      ip,
      userAgent,
      status,
      response,
      duration
    } = data;

    try {
      await pool.query(
        `INSERT INTO operation_logs 
         (admin_id, action, module, method, path, params, ip, user_agent, status, response, duration) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          adminId,
          action,
          module,
          method,
          path,
          JSON.stringify(params),
          ip,
          userAgent,
          status,
          JSON.stringify(response),
          duration || 0
        ]
      );
    } catch (error) {
      // 日志记录失败不影响主流程
      console.error('记录操作日志失败:', error.message);
    }
  }

  /**
   * 获取操作日志列表
   */
  static async list(options = {}) {
    const {
      adminId,
      action,
      module,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = options;

    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (adminId) {
      where += ' AND admin_id = ?';
      params.push(adminId);
    }

    if (action) {
      where += ' AND action LIKE ?';
      params.push(`%${action}%`);
    }

    if (module) {
      where += ' AND module = ?';
      params.push(module);
    }

    if (startDate) {
      where += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      where += ' AND created_at <= ?';
      params.push(endDate);
    }

    const [list] = await pool.query(
      `SELECT o.*, a.username as admin_username
       FROM operation_logs o
       LEFT JOIN admins a ON o.admin_id = a.id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM operation_logs o ${where}`,
      params
    );

    return { list, total, page, limit };
  }

  /**
   * 获取管理员操作统计
   */
  static async getAdminStats(adminId, days = 7) {
    const [stats] = await pool.query(
      `SELECT 
        a.username,
        COUNT(*) as total_actions,
        COUNT(DISTINCT DATE(created_at)) as active_days,
        MAX(created_at) as last_action_time
       FROM operation_logs o
       LEFT JOIN admins a ON o.admin_id = a.id
       WHERE o.admin_id = ? AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY a.id, a.username`,
      [adminId, days]
    );

    return stats[0] || null;
  }

  /**
   * 获取热门操作
   */
  static async getTopActions(limit = 10) {
    const [actions] = await pool.query(
      `SELECT action, COUNT(*) as count
       FROM operation_logs
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY action
       ORDER BY count DESC
       LIMIT ?`,
      [limit]
    );

    return actions;
  }

  /**
   * 清理过期日志
   */
  static async cleanExpired(days = 90) {
    const [result] = await pool.query(
      `DELETE FROM operation_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    return result.affectedRows;
  }
}

module.exports = OperationLog;
