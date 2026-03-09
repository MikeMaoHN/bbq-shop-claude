const api = require('../../utils/api')

Page({
  data: {
    order: null,
    statusText: { 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消', 5: '退款中', 6: '已退款' },
    statusIcons: { 0: '⏳', 1: '📦', 2: '🚚', 3: '✅', 4: '❌', 5: '🔄', 6: '💰' },
  },

  onLoad(options) {
    this.orderId = options.id
    this.loadOrder()
  },

  async loadOrder() {
    try {
      const res = await api.order.getDetail(this.orderId)
      this.setData({ order: res.data })
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async onCancel() {
    wx.showModal({
      title: '取消订单', content: '确定取消该订单？',
      success: async (res) => {
        if (!res.confirm) return
        await api.order.cancel(this.orderId)
        wx.showToast({ title: '已取消', icon: 'success' })
        this.loadOrder()
      }
    })
  },

  async onReceive() {
    wx.showModal({
      title: '确认收货', content: '确认已收到商品？',
      success: async (res) => {
        if (!res.confirm) return
        await api.order.receive(this.orderId)
        wx.showToast({ title: '已确认收货', icon: 'success' })
        this.loadOrder()
      }
    })
  },

  async onRefund() {
    await api.order.refund(this.orderId)
    wx.showToast({ title: '退款申请已提交', icon: 'success' })
    this.loadOrder()
  },
})
