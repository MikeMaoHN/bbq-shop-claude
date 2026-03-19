/**
 * API 接口封装
 */
const request = require('./request');

module.exports = {
  // 登录
  wxLogin: (code) => request.post('/auth/wx-login', { code }),
  
  // 用户
  getUserInfo: () => request.get('/user/info'),
  updateUserInfo: (data) => request.put('/user/info', data),
  
  // 分类
  getCategories: () => request.get('/categories'),
  
  // 商品
  getProducts: (params) => request.get('/products', params),
  getProductDetail: (id) => request.get(`/products/${id}`),
  
  // 购物车
  getCart: () => request.get('/cart'),
  addToCart: (productId, quantity) => request.post('/cart/items', { productId, quantity }),
  updateCartQuantity: (id, quantity) => request.put(`/cart/items/${id}`, { quantity }),
  updateCartChecked: (id, checked) => request.put(`/cart/items/${id}/checked`, { checked }),
  updateAllChecked: (checked) => request.put('/cart/checked', { checked }),
  deleteCartItem: (id) => request.delete(`/cart/items/${id}`),
  clearCart: () => request.delete('/cart'),
  
  // 地址
  getAddresses: () => request.get('/addresses'),
  getAddressDetail: (id) => request.get(`/addresses/${id}`),
  createAddress: (data) => request.post('/addresses', data),
  updateAddress: (id, data) => request.put(`/addresses/${id}`, data),
  deleteAddress: (id) => request.delete(`/addresses/${id}`),
  setDefaultAddress: (id) => request.put(`/addresses/${id}/default`),
  
  // 订单
  createOrder: (data) => request.post('/orders', data),
  payOrder: (orderId) => request.post('/orders/pay', { orderId }),
  cancelOrder: (orderId, reason) => request.post('/orders/cancel', { orderId, reason }),
  confirmReceipt: (orderId) => request.post('/orders/confirm', { orderId }),
  getOrders: (params) => request.get('/orders', params),
  getOrderDetail: (id) => request.get(`/orders/${id}`)
}
