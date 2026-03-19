/**
 * 管理端 - 订单控制器
 */
const Response = require('../utils/response');
const Order = require('../models/Order');
const Product = require('../models/Product');
const StockLog = require('../models/StockLog');
const db = require('../config/database');

class AdminOrderController {
  /**
   * 获取订单列表
   */
  static async list(req, res) {
    try {
      const { status, userId, page = 1, limit = 20 } = req.query;
      
      const result = await Order.getAllForAdmin({
        status: status !== undefined ? parseInt(status) : undefined,
        userId: userId ? parseInt(userId) : undefined,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json(Response.success(result));
    } catch (error) {
      console.error('获取订单列表错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 获取订单详情
   */
  static async detail(req, res) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);
      
      if (!order) {
        return res.status(404).json(Response.error('订单不存在'));
      }
      
      res.json(Response.success(order));
    } catch (error) {
      console.error('获取订单详情错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 发货
   */
  static async ship(req, res) {
    try {
      const { id } = req.params;
      const { logisticsNo, logisticsCompany } = req.body;
      
      if (!logisticsNo || !logisticsCompany) {
        return res.status(400).json(Response.error('请填写物流信息'));
      }
      
      const order = await Order.findById(id);
      
      if (!order) {
        return res.status(404).json(Response.error('订单不存在'));
      }
      
      if (order.status !== 1) {
        return res.status(400).json(Response.error('订单状态不正确，只能对待发货订单进行发货'));
      }

      await Order.ship(id, logisticsNo, logisticsCompany);
      
      const updatedOrder = await Order.findById(id);
      res.json(Response.success(updatedOrder, '发货成功'));
    } catch (error) {
      console.error('发货错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 备注订单
   */
  static async remark(req, res) {
    try {
      const { id } = req.params;
      const { remark } = req.body;
      
      const [result] = await db.execute(
        'UPDATE orders SET remark = ? WHERE id = ?',
        [remark, id]
      );
      
      const order = await Order.findById(id);
      res.json(Response.success(order, '备注成功'));
    } catch (error) {
      console.error('备注订单错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 获取统计数据
   */
  static async stats(req, res) {
    try {
      const { days = 7 } = req.query;
      const stats = await Order.getStats(parseInt(days));
      res.json(Response.success(stats));
    } catch (error) {
      console.error('获取统计数据错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 获取库存预警商品
   */
  static async getLowStockProducts(req, res) {
    try {
      const { threshold = 10 } = req.query;
      const products = await StockLog.getLowStockProducts(parseInt(threshold));
      res.json(Response.success(products));
    } catch (error) {
      console.error('获取库存预警错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }
}

module.exports = AdminOrderController;
