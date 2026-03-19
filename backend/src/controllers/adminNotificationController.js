/**
 * 管理端 - 站内信通知控制器
 */
const Response = require('../utils/response');
const Notification = require('../models/Notification');

class AdminNotificationController {
  /**
   * 获取通知列表（未读优先，分页）
   */
  static async list(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await Notification.getList({
        page: parseInt(page),
        limit: parseInt(limit)
      });
      res.json(Response.success(result));
    } catch (error) {
      console.error('获取通知列表错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 获取未读通知数量（用于顶部角标）
   */
  static async getUnreadCount(req, res) {
    try {
      const count = await Notification.getUnreadCount();
      res.json(Response.success({ count }));
    } catch (error) {
      console.error('获取未读数量错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 将指定通知标记为已读
   */
  static async markRead(req, res) {
    try {
      const { id } = req.params;
      await Notification.markRead(id);
      res.json(Response.success(null, '已读'));
    } catch (error) {
      console.error('标记已读错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 全部标记为已读
   */
  static async markAllRead(req, res) {
    try {
      const affected = await Notification.markAllRead();
      res.json(Response.success({ affected }, '已全部标记为已读'));
    } catch (error) {
      console.error('全部已读错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }
}

module.exports = AdminNotificationController;
