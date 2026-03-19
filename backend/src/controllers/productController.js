/**
 * 商品控制器 - 带日志
 */
const Logger = require('../utils/logger')
const log = new Logger('ProductController')
const Response = require('../utils/response')
const Product = require('../models/Product')

class ProductController {
  static async list(req, res) {
    try {
      const { categoryId, isHot, page = 1, limit = 20, keyword } = req.query
      let result
      if (keyword) {
        result = await Product.search(keyword, parseInt(page), parseInt(limit))
      } else {
        result = await Product.findAll({
          categoryId: categoryId ? parseInt(categoryId) : undefined,
          isHot: isHot === '1',
          page: parseInt(page),
          limit: parseInt(limit)
        })
      }
      log.info(`获取商品列表成功，返回 ${result.list.length} 个商品`)
      res.json(Response.success(result))
    } catch (error) {
      log.error('获取商品列表失败:', error)
      res.status(500).json(Response.error('服务器错误'))
    }
  }

  static async detail(req, res) {
    try {
      const { id } = req.params
      const product = await Product.findById(id)
      if (!product) {
        return res.status(404).json(Response.error('商品不存在'))
      }
      res.json(Response.success(product))
    } catch (error) {
      log.error('获取商品详情失败:', error)
      res.status(500).json(Response.error('服务器错误'))
    }
  }

  static async listForAdmin(req, res) {
    log.info('=== 获取商品列表 (管理端) ===')
    log.info('请求参数:', JSON.stringify(req.query))
    try {
      const { page = 1, limit = 50, status, categoryId } = req.query
      const result = await Product.getAllForAdmin({
        page: parseInt(page),
        limit: parseInt(limit),
        status: status !== undefined ? parseInt(status) : undefined,
        categoryId: categoryId ? parseInt(categoryId) : undefined
      })
      log.info(`查询成功，返回 ${result.list.length} 个商品，总数：${result.total}`)
      res.json(Response.success(result))
    } catch (error) {
      log.error('获取商品列表失败:', error)
      res.status(500).json(Response.error('服务器错误'))
    }
  }

  static async create(req, res) {
    log.info('创建商品请求')
    try {
      const { categoryId, name, description, images, price, originalPrice, stock, isHot, sort } = req.body
      if (!categoryId || !name || !price) {
        return res.status(400).json(Response.error('请填写必填项'))
      }
      const id = await Product.create({
        categoryId, name, description,
        images: images || [],
        price: Math.round(parseFloat(price) * 100),
        originalPrice: originalPrice ? Math.round(parseFloat(originalPrice) * 100) : null,
        stock: parseInt(stock) || 0,
        isHot: !!isHot,
        sort
      })
      log.info(`商品创建成功，ID: ${id}`)
      const product = await Product.findById(id)
      res.json(Response.success(product, '创建成功'))
    } catch (error) {
      log.error('创建商品失败:', error)
      res.status(500).json(Response.error('服务器错误'))
    }
  }

  static async update(req, res) {
    log.info(`更新商品请求，ID: ${req.params.id}`)
    try {
      const { id } = req.params
      const data = req.body
      if (data.price !== undefined) {
        data.price = Math.round(parseFloat(data.price) * 100)
      }
      if (data.originalPrice !== undefined) {
        data.originalPrice = Math.round(parseFloat(data.originalPrice) * 100)
      }
      // 处理 is_hot 字段（支持 isHot 和 is_hot 两种格式）
      if (data.is_hot !== undefined) {
        data.isHot = data.is_hot
        delete data.is_hot
      }
      await Product.update(id, data)
      log.info('商品更新成功')
      const product = await Product.findById(id)
      res.json(Response.success(product, '更新成功'))
    } catch (error) {
      log.error('更新商品失败:', error)
      res.status(500).json(Response.error('服务器错误'))
    }
  }

  static async delete(req, res) {
    log.info(`删除商品请求，ID: ${req.params.id}`)
    try {
      await Product.delete(req.params.id)
      log.info('商品删除成功')
      res.json(Response.success(null, '删除成功'))
    } catch (error) {
      log.error('删除商品失败:', error)
      res.status(500).json(Response.error('服务器错误'))
    }
  }

  static async batchUpdateStatus(req, res) {
    try {
      const { ids, status } = req.body
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json(Response.error('请选择商品'))
      }
      for (const id of ids) {
        await Product.update(id, { status })
      }
      res.json(Response.success(null, status === 1 ? '上架成功' : '下架成功'))
    } catch (error) {
      log.error('批量更新状态失败:', error)
      res.status(500).json(Response.error('服务器错误'))
    }
  }

  static async updateStock(req, res) {
    log.info(`更新库存请求，ID: ${req.params.id}`)
    try {
      const { id } = req.params
      const { stock, reason = '手动调整' } = req.body
      const oldStock = await Product.getStock(id)
      log.info(`库存：${oldStock} -> ${stock}`)
      await Product.update(id, { stock })
      const StockLog = require('../models/StockLog')
      await StockLog.create({
        productId: id, changeQty: stock - oldStock,
        beforeStock: oldStock, afterStock: stock, reason,
        referenceType: 'admin',
        referenceId: req.admin?.adminId || null,
        operatorId: req.admin?.adminId || null
      })
      const product = await Product.findById(id)
      res.json(Response.success(product, '库存更新成功'))
    } catch (error) {
      log.error('更新库存失败:', error)
      res.status(500).json(Response.error('服务器错误'))
    }
  }
}

module.exports = ProductController
