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
  },

  onLoad(options) {
    this.from = options.from
    if (options.from === 'cart') {
      this.loadFromCart()
    } else {
      this.loadDirectBuy(options)
    }
    this.loadDefaultAddress()
  },

  onShow() {
    const selected = wx.getStorageSync('selected_address')
    if (selected) {
      this.setData({ address: selected })
      wx.removeStorageSync('selected_address')
    }
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

  async onSubmit() {
    if (!this.data.address) return wx.showToast({ title: '请选择收货地址', icon: 'none' })
    if (!this.data.orderItems.length) return wx.showToast({ title: '请选择商品', icon: 'none' })
    this.setData({ submitting: true })
    try {
      const res = await api.order.create({
        address_id: this.data.address.id,
        items: this.data.orderItems.map(i => ({
          product_id: i.product_id,
          spec_id: i.spec_id,
          quantity: i.quantity,
        })),
        remark: this.data.remark,
        delivery_time_slot: this.data.selectedTime,
      })
      wx.showToast({ title: '下单成功', icon: 'success' })
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/order-detail/index?id=${res.data.id}` })
      }, 1000)
    } catch (e) {
      wx.showToast({ title: e.message || '下单失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },
})
