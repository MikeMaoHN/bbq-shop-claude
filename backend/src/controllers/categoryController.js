/**
 * 商品分类控制器
 */
const Response = require('../utils/response');
const Category = require('../models/Category');

class CategoryController {
  /**
   * 获取分类列表（小程序端）
   */
  static async list(req, res) {
    try {
      const categories = await Category.findAllWithCount();
      res.json(Response.success(categories));
    } catch (error) {
      console.error('获取分类列表错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 获取分类列表（管理端）- 返回完整数组
   */
  static async listForAdmin(req, res) {
    try {
      // 返回所有分类，不分页
      const categories = await Category.findAll();
      res.json(Response.success(categories));
    } catch (error) {
      console.error('获取分类列表错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 获取分类详情
   */
  static async detail(req, res) {
    try {
      const { id } = req.params;
      const category = await Category.findById(id);
      
      if (!category) {
        return res.status(404).json(Response.error('分类不存在'));
      }
      
      res.json(Response.success(category));
    } catch (error) {
      console.error('获取分类详情错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 创建分类
   */
  static async create(req, res) {
    try {
      const { name, icon, sort } = req.body;
      
      if (!name) {
        return res.status(400).json(Response.error('分类名称不能为空'));
      }

      const id = await Category.create({ name, icon, sort });
      const category = await Category.findById(id);
      
      res.json(Response.success(category, '创建成功'));
    } catch (error) {
      console.error('创建分类错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 更新分类
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, icon, sort, status } = req.body;
      
      await Category.update(id, { name, icon, sort, status });
      const category = await Category.findById(id);
      
      res.json(Response.success(category, '更新成功'));
    } catch (error) {
      console.error('更新分类错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 删除分类
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      await Category.delete(id);
      res.json(Response.success(null, '删除成功'));
    } catch (error) {
      console.error('删除分类错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }
}

module.exports = CategoryController;
