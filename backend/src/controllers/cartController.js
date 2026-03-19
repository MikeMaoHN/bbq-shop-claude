/**
 * 购物车控制器
 */
const Response = require('../utils/response');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');

class CartController {
  /**
   * 获取购物车列表
   */
  static async list(req, res) {
    try {
      const userId = req.user.userId;
      const items = await CartItem.findByUserId(userId);
      
      // 计算选中商品的总价
      let totalCount = 0;
      let totalPrice = 0;
      
      items.forEach(item => {
        if (item.checked && item.status === 1) {
          totalCount += item.quantity;
          totalPrice += item.price * item.quantity;
        }
      });
      
      res.json(Response.success({
        items,
        totalCount,
        totalPrice: totalPrice / 100 // 转换为元
      }));
    } catch (error) {
      console.error('获取购物车列表错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 添加商品到购物车
   */
  static async add(req, res) {
    try {
      const userId = req.user.userId;
      const { productId, quantity = 1 } = req.body;
      
      if (!productId) {
        return res.status(400).json(Response.error('请选择商品'));
      }
      
      // 检查商品是否存在和库存
      const product = await Product.findById(productId);
      if (!product || product.status !== 1) {
        return res.status(400).json(Response.error('商品不存在或已下架'));
      }
      
      const id = await CartItem.addOrUpdate(userId, productId, quantity);
      const item = await CartItem.findById(id);
      
      res.json(Response.success(item, '添加成功'));
    } catch (error) {
      console.error('添加商品到购物车错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 更新购物车商品数量
   */
  static async updateQuantity(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { quantity } = req.body;
      
      if (!quantity || quantity < 1) {
        return res.status(400).json(Response.error('数量必须大于 0'));
      }
      
      // 检查库存
      const item = await CartItem.findById(id);
      if (!item || item.user_id !== userId) {
        return res.status(404).json(Response.error('购物车商品不存在'));
      }
      
      if (quantity > item.stock) {
        return res.status(400).json(Response.error('库存不足'));
      }
      
      await CartItem.updateQuantity(id, userId, quantity);
      const updatedItem = await CartItem.findById(id);
      
      res.json(Response.success(updatedItem, '更新成功'));
    } catch (error) {
      console.error('更新购物车数量错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 更新购物车商品选中状态
   */
  static async updateChecked(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { checked } = req.body;
      
      await CartItem.updateChecked(id, userId, checked);
      res.json(Response.success(null, '更新成功'));
    } catch (error) {
      console.error('更新选中状态错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 全选/取消全选
   */
  static async updateAllChecked(req, res) {
    try {
      const userId = req.user.userId;
      const { checked } = req.body;
      
      await CartItem.updateAllChecked(userId, checked);
      res.json(Response.success(null, '更新成功'));
    } catch (error) {
      console.error('全选更新错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 删除购物车商品
   */
  static async delete(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      
      await CartItem.delete(id, userId);
      res.json(Response.success(null, '删除成功'));
    } catch (error) {
      console.error('删除购物车商品错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 清空购物车
   */
  static async clear(req, res) {
    try {
      const userId = req.user.userId;
      await CartItem.clear(userId);
      res.json(Response.success(null, '清空成功'));
    } catch (error) {
      console.error('清空购物车错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }
}

module.exports = CartController;
