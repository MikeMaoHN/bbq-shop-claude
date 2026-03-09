const api = require('../../utils/api')

const STATUS_TEXT = { '-1': '全部', 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消', 5: '退款中', 6: '已退款' }
const STATUS_CLASS = { 0: 'orange', 1: 'blue', 2: 'blue', 3: 'green', 4: 'gray', 5: 'orange', 6: 'gray' }

Page({
  data: {
    tabs: [
      { label: '全部', value: -1 },
      { label: '待付款', value: 0 },
      { label: '待发货', value: 1 },
      { label: '待收货', value: 2 },
      { label: '已完成', value: 3 },
    ],
    activeTab: -1,
    orders: [],
    loading: true,
    page: 1,
    hasMore: true,
    statusText: STATUS_TEXT,
    statusClass: STATUS_CLASS,
  },

  onLoad(options) {
    const status = options.status !== undefined ? parseInt(options.status) : -1
    this.setData({ activeTab: status })
    this.loadOrders(true)
  },

  onPullDownRefresh() {
    this.loadOrders(true).then(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore) this.loadOrders(false)
  },

  async loadOrders(reset) {
    if (reset) this.setData({ page: 1, orders: [], hasMore: true })
    this.setData({ loading: true })
    try {
      const params = { page: this.data.page, pageSize: 10 }
      if (this.data.activeTab >= 0) params.status = this.data.activeTab
      const res = await api.order.getList(params)
      const { list, pagination } = res.data
      this.setData({
        orders: reset ? list : [...this.data.orders, ...list],
        hasMore: this.data.page < pagination.totalPages,
        page: this.data.page + 1,
        loading: false,
      })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.value })
    this.loadOrders(true)
  },

  onOrderTap(e) {
    wx.navigateTo({ url: `/pages/order-detail/index?id=${e.currentTarget.dataset.id}` })
  },

  async onCancel(e) {
    wx.showModal({
      title: '确认取消', content: '确定要取消该订单？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await api.order.cancel(e.currentTarget.dataset.id)
          wx.showToast({ title: '已取消', icon: 'success' })
          this.loadOrders(true)
        } catch (err) {
          wx.showToast({ title: err.message || '操作失败', icon: 'none' })
        }
      }
    })
  },

  async onReceive(e) {
    wx.showModal({
      title: '确认收货', content: '确认已收到商品？',
      success: async (res) => {
        if (!res.confirm) return
        await api.order.receive(e.currentTarget.dataset.id)
        wx.showToast({ title: '已确认收货', icon: 'success' })
        this.loadOrders(true)
      }
    })
  },

  async onRefund(e) {
    await api.order.refund(e.currentTarget.dataset.id)
    wx.showToast({ title: '退款申请已提交', icon: 'success' })
    this.loadOrders(true)
  },
})
