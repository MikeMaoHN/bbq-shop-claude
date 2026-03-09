const api = require('../../utils/api')

Page({
  data: {
    product: null,
    selectedSpec: null,
    quantity: 1,
    currentPrice: 0,
    loading: true,
  },

  onLoad(options) {
    this.productId = options.id
    this.loadProduct()
  },

  async loadProduct() {
    try {
      const res = await api.product.getDetail(this.productId)
      const product = res.data
      const selectedSpec = product.specs && product.specs.length > 0 ? product.specs[0] : null
      this.setData({
        product,
        selectedSpec,
        currentPrice: selectedSpec ? selectedSpec.price : product.price,
        loading: false,
      })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onSelectSpec(e) {
    const spec = e.currentTarget.dataset.spec
    this.setData({ selectedSpec: spec, currentPrice: spec.price })
  },

  onIncQty() {
    const max = this.data.selectedSpec ? this.data.selectedSpec.stock : this.data.product.stock
    if (this.data.quantity >= max) return wx.showToast({ title: '库存不足', icon: 'none' })
    this.setData({ quantity: this.data.quantity + 1 })
  },

  onDecQty() {
    if (this.data.quantity <= 1) return
    this.setData({ quantity: this.data.quantity - 1 })
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showModal({
        title: '提示', content: '请先登录',
        success: (res) => { if (res.confirm) wx.switchTab({ url: '/pages/user/index' }) }
      })
      return false
    }
    return true
  },

  async onAddCart() {
    if (!this.checkLogin()) return
    try {
      await api.cart.add({
        product_id: this.productId,
        spec_id: this.data.selectedSpec?.id || null,
        quantity: this.data.quantity,
      })
      wx.showToast({ title: '已加入购物车', icon: 'success' })
    } catch (e) {
      wx.showToast({ title: e.message || '操作失败', icon: 'none' })
    }
  },

  onBuyNow() {
    if (!this.checkLogin()) return
    const specId = this.data.selectedSpec?.id || ''
    wx.navigateTo({
      url: `/pages/order-confirm/index?from=direct&product_id=${this.productId}&spec_id=${specId}&quantity=${this.data.quantity}`
    })
  },
})
