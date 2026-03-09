const api = require('../../utils/api')

Page({
  data: {
    activeTab: 0,
    coupons: [],
    loading: true,
    statusText: { 0: '未使用', 1: '已使用', 2: '已过期' },
  },

  onShow() {
    this.loadCoupons()
  },

  async loadCoupons() {
    this.setData({ loading: true })
    try {
      const res = await api.coupon.getMine({ status: this.data.activeTab })
      this.setData({ coupons: res.data || [], loading: false })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  onTabChange(e) {
    this.setData({ activeTab: parseInt(e.currentTarget.dataset.tab) })
    this.loadCoupons()
  },
})
