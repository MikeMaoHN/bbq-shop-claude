/**
 * 管理端 API 模块
 * 封装所有与后端的 HTTP 通信，统一通过 request 工具处理 token 注入和错误提示。
 * 所有方法返回 Promise，业务层直接 await 使用。
 */
import request from '@/utils/request'

export default {
  // ==================== 认证 ====================
  /** 管理员登录，返回 token 和管理员信息 */
  login(data) {
    return request.post('/login', data)
  },

  /** 获取当前登录管理员信息 */
  getInfo() {
    return request.get('/admin/info')
  },

  // ==================== 分类管理 ====================
  /** 获取分类列表，支持分页参数 */
  getCategories(params) {
    return request.get('/categories', { params })
  },
  /** 获取单个分类详情 */
  getCategory(id) {
    return request.get(`/categories/${id}`)
  },
  /** 新增分类 */
  createCategory(data) {
    return request.post('/categories', data)
  },
  /** 更新分类（支持部分字段更新） */
  updateCategory(id, data) {
    return request.put(`/categories/${id}`, data)
  },
  /** 删除分类 */
  deleteCategory(id) {
    return request.delete(`/categories/${id}`)
  },

  // ==================== 商品管理 ====================
  /** 获取商品列表，支持关键词/分类/状态筛选和分页 */
  getProducts(params) {
    return request.get('/products', { params })
  },
  /** 获取单个商品详情 */
  getProduct(id) {
    return request.get(`/products/${id}`)
  },
  /** 新增商品 */
  createProduct(data) {
    return request.post('/products', data)
  },
  /** 更新商品信息（支持部分字段） */
  updateProduct(id, data) {
    return request.put(`/products/${id}`, data)
  },
  /** 删除商品 */
  deleteProduct(id) {
    return request.delete(`/products/${id}`)
  },
  /** 调整商品库存，会记录库存流水 */
  updateProductStock(id, data) {
    return request.put(`/products/${id}/stock`, data)
  },

  // ==================== 库存管理 ====================
  /** 获取商品库存列表（用于库存管理页） */
  getStockProducts(params) {
    return request.get('/stock/products', { params })
  },
  /** 获取库存流水记录 */
  getStockLogs(params) {
    return request.get('/stock/logs', { params })
  },

  // ==================== 订单管理 ====================
  /** 获取订单列表，支持状态筛选和分页 */
  getOrders(params) {
    return request.get('/orders', { params })
  },
  /** 获取订单详情（含商品明细和物流信息） */
  getOrder(id) {
    return request.get(`/orders/${id}`)
  },
  /** 发货操作，填写物流公司和单号后将订单状态改为待收货 */
  shipOrder(id, data) {
    return request.put(`/orders/${id}/ship`, data)
  },
  /** 更新订单管理员备注 */
  updateOrderRemark(id, data) {
    return request.put(`/orders/${id}/remark`, data)
  },

  // ==================== 数据统计 ====================
  /** 获取订单/销售额/商品销量等汇总统计，支持指定天数范围 */
  getStats(params) {
    return request.get('/stats', { params })
  },
  /** 获取库存低于预警阈值的商品列表 */
  getLowStockProducts(params) {
    return request.get('/stats/low-stock', { params })
  },

  // ==================== 文件上传 ====================
  /** 上传商品图片，返回图片访问路径 */
  uploadImage(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}
