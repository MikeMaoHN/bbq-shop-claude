const { get, post, put, del } = require('./request')

// ========== 认证模块 ==========
const auth = {
  login: (code) => post('/auth/login', { code })
}

// ========== 首页模块 ==========
const home = {
  getBanners: () => get('/home/banners'),
  getCategories: () => get('/home/categories'),
  getHotProducts: () => get('/home/hot-products')
}

// ========== 商品模块 ==========
const product = {
  getList: (params) => get('/products', params),
  search: (keyword) => get('/products/search', { keyword }),
  getDetail: (id) => get(`/products/${id}`)
}

// ========== 购物车模块 ==========
const cart = {
  getList: () => get('/cart'),
  add: (data) => post('/cart', data),
  update: (id, quantity) => put(`/cart/${id}`, { quantity }),
  remove: (id) => del(`/cart/${id}`)
}

// ========== 地址模块 ==========
const address = {
  getList: () => get('/addresses'),
  create: (data) => post('/addresses', data),
  update: (id, data) => put(`/addresses/${id}`, data),
  remove: (id) => del(`/addresses/${id}`)
}

// ========== 订单模块 ==========
const order = {
  create: (data) => post('/orders', data),
  getList: (params) => get('/orders', params),
  getDetail: (id) => get(`/orders/${id}`),
  cancel: (id) => put(`/orders/${id}/cancel`),
  receive: (id) => put(`/orders/${id}/receive`),
  refund: (id) => post(`/orders/${id}/refund`)
}

// ========== 优惠券模块 ==========
const coupon = {
  getAvailable: () => get('/coupons/available'),
  claim: (id) => post(`/coupons/${id}/claim`),
  getMine: () => get('/coupons/mine')
}

// ========== 用户模块 ==========
const user = {
  getProfile: () => get('/user/profile'),
  updateProfile: (data) => put('/user/profile', data)
}

// ========== 支付模块 ==========
const pay = {
  getMockMode: () => get('/pay/mock-mode'),
  prepay: (orderId) => post('/pay/prepay', { order_id: orderId }),
  mockConfirm: (orderId) => post('/pay/mock-confirm', { order_id: orderId })
}

module.exports = {
  auth,
  home,
  product,
  cart,
  address,
  order,
  coupon,
  user,
  pay
}
