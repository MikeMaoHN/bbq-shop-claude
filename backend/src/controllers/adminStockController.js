/**
 * 管理端 - 库存控制器
 */
const Response = require('../utils/response');
const Product = require('../models/Product');
const StockLog = require('../models/StockLog');
const db = require('../config/database');

class AdminStockController {
  /**
   * 获取商品列表（库存管理用）
   */
  static async getProducts(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await Product.getAllForAdmin({
        page: parseInt(page),
        limit: parseInt(limit)
      });
      res.json(Response.success(result));
    } catch (error) {
      console.error('获取商品列表错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 更新商品库存
   */
  static async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { stock, reason = '手动调整', remark = '' } = req.body;
      
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json(Response.error('商品不存在'));
      }
      
      const oldStock = product.stock;
      const changeQty = stock - oldStock;
      
      // 更新库存
      await Product.update(id, { stock });
      
      // 记录库存流水
      await StockLog.create({
        productId: id,
        changeQty,
        beforeStock: oldStock,
        afterStock: stock,
        reason,
        referenceType: 'admin',
        referenceId: req.admin?.adminId || null,
        operatorId: req.admin?.adminId || null,
        remark
      });
      
      const updatedProduct = await Product.findById(id);
      res.json(Response.success(updatedProduct, '库存更新成功'));
    } catch (error) {
      console.error('更新库存错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 获取库存流水记录
   */
  static async getStockLogs(req, res) {
    try {
      const { productId, page = 1, limit = 50 } = req.query;
      
      let result;
      if (productId) {
        result = await StockLog.findByProductId(parseInt(productId), parseInt(page), parseInt(limit));
      } else {
        result = await StockLog.findAll(parseInt(page), parseInt(limit));
      }
      
      res.json(Response.success(result));
    } catch (error) {
      console.error('获取库存流水错误:', error);
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

module.exports = AdminStockController;
