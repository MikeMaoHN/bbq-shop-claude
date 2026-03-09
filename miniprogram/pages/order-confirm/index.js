const api = require('../../utils/api')

Page({
  data: {
    address: null,
    orderItems: [],
    remark: '',
    selectedTime: '',
    timeSlots: ['尽快送达', '09:00-12:00', '12:00-14:00', '14:00-18:00', '18:00-21:00'],
    totalAmount: '0.00',
    deliveryFee: '0.00',
    payAmount: '0.00',
    submitting: false,
    isMockPay: false, // 是否为模拟支付模式（由后端 DB 设置控制）
  },

  onLoad(options) {
    this.from = options.from
    if (options.from === 'cart') {
      this.loadFromCart()
    } else {
      this.loadDirectBuy(options)
    }
    this.loadDefaultAddress()
    this.loadPayMode()
  },

  onShow() {
    const selected = wx.getStorageSync('selected_address')
    if (selected) {
      this.setData({ address: selected })
      wx.removeStorageSync('selected_address')
    }
  },

  // 查询当前支付模式（mock/真实），用于页面提示
  async loadPayMode() {
    try {
      const res = await api.pay.getMockMode()
      this.setData({ isMockPay: res.data.mock === true })
    } catch (e) {}
  },

  async loadDefaultAddress() {
    try {
      const res = await api.address.getList()
      const addrs = res.data || []
      const def = addrs.find(a => a.is_default) || addrs[0]
      if (def && !this.data.address) this.setData({ address: def })
    } catch (e) {}
  },

  async loadFromCart() {
    try {
      const res = await api.cart.getList()
      const checked = wx.getStorageSync('cart_checked_ids') || []
      const all = res.data || []
      const items = (checked.length ? all.filter(i => checked.includes(i.id)) : all).map(i => ({
        cart_item_id: i.id,
        product_id: i.product_id,
        spec_id: i.spec_id,
        name: i.Product?.name,
        image: i.Product?.images?.[0],
        price: i.ProductSpec ? i.ProductSpec.price : i.Product?.price,
        spec_name: i.ProductSpec?.name || '',
        quantity: i.quantity,
      }))
      this.setData({ orderItems: items })
      this.calcAmount(items)
    } catch (e) {}
  },

  async loadDirectBuy(options) {
    try {
      const res = await api.product.getDetail(options.product_id)
      const p = res.data
      const spec = p.specs?.find(s => s.id == options.spec_id)
      const items = [{
        product_id: parseInt(options.product_id),
        spec_id: options.spec_id ? parseInt(options.spec_id) : null,
        name: p.name,
        image: p.images?.[0],
        price: spec ? spec.price : p.price,
        spec_name: spec?.name || '',
        quantity: parseInt(options.quantity) || 1,
      }]
      this.setData({ orderItems: items })
      this.calcAmount(items)
    } catch (e) {}
  },

  calcAmount(items) {
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const fee = total >= 99 ? 0 : 8
    this.setData({
      totalAmount: total.toFixed(2),
      deliveryFee: fee.toFixed(2),
      payAmount: (total + fee).toFixed(2),
    })
  },

  onSelectAddress() {
    wx.navigateTo({ url: '/pages/address-list/index?mode=select' })
  },

  onTimeChange(e) {
    this.setData({ selectedTime: this.data.timeSlots[e.detail.value] })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  // ────────────────────────────────────────────
  // 提交订单 → 发起支付（两步走）
  // ────────────────────────────────────────────
  async onSubmit() {
    if (!this.data.address) return wx.showToast({ title: '请选择收货地址', icon: 'none' })
    if (!this.data.orderItems.length) return wx.showToast({ title: '请选择商品', icon: 'none' })
    this.setData({ submitting: true })
    try {
      // Step 1: 创建订单（status=0 待付款）
      const orderRes = await api.order.create({
        address_id: this.data.address.id,
        items: this.data.orderItems.map(i => ({
          product_id: i.product_id,
          spec_id: i.spec_id,
          quantity: i.quantity,
        })),
        remark: this.data.remark,
        delivery_time_slot: this.data.selectedTime,
      })
      const orderId = orderRes.data.id

      // Step 2: 发起支付
      await this.doPay(orderId)
    } catch (e) {
      wx.showToast({ title: e.message || '下单失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 获取预支付参数，根据 mock 字段分流
  async doPay(orderId) {
    const prepayRes = await api.pay.prepay(orderId)
    const params = prepayRes.data

    if (params.mock) {
      // ── 模拟支付：直接调后端确认，无需 wx.requestPayment ──
      await this._mockPayConfirm(orderId)
    } else {
      // ── 真实支付：调起微信收银台 ──
      await this._realPay(orderId, params)
    }
  },

  // 真实微信支付
  _realPay(orderId, params) {
    return new Promise((resolve, reject) => {
      wx.requestPayment({
        appId: params.appId,
        timeStamp: params.timeStamp,
        nonceStr: params.nonceStr,
        package: params.package,
        signType: params.signType || 'MD5',
        paySign: params.paySign,
        success: () => { this._onPaySuccess(orderId); resolve() },
        fail: (err) => {
          if (err.errMsg && err.errMsg.includes('cancel')) {
            wx.showToast({ title: '已取消支付', icon: 'none' })
          } else {
            wx.showToast({ title: '支付失败，请重试', icon: 'none' })
          }
          // 跳到订单详情，允许用户再次支付
          setTimeout(() => wx.redirectTo({ url: `/pages/order-detail/index?id=${orderId}` }), 1500)
          reject(new Error(err.errMsg))
        },
      })
    })
  },

  // 模拟支付确认（调后端 /pay/mock-confirm）
  async _mockPayConfirm(orderId) {
    wx.showLoading({ title: '模拟支付中...' })
    try {
      await api.pay.mockConfirm(orderId)
      wx.hideLoading()
      this._onPaySuccess(orderId)
    } catch (e) {
      wx.hideLoading()
      throw e
    }
  },

  _onPaySuccess(orderId) {
    wx.showToast({ title: '支付成功', icon: 'success' })
    setTimeout(() => wx.redirectTo({ url: `/pages/order-detail/index?id=${orderId}` }), 1000)
  },
})
