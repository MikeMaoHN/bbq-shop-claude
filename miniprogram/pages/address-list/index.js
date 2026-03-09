const api = require('../../utils/api')

Page({
  data: { addresses: [], loading: true, selectMode: false },

  onLoad(options) {
    this.setData({ selectMode: options.mode === 'select' })
  },

  onShow() {
    this.loadAddresses()
  },

  async loadAddresses() {
    try {
      const res = await api.address.getList()
      this.setData({ addresses: res.data || [], loading: false })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  onSelect(e) {
    if (this.data.selectMode) {
      wx.setStorageSync('selected_address', e.currentTarget.dataset.item)
      wx.navigateBack()
    }
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/address-edit/index' })
  },

  onEdit(e) {
    wx.navigateTo({ url: `/pages/address-edit/index?id=${e.currentTarget.dataset.id}` })
  },

  async onDelete(e) {
    wx.showModal({
      title: '删除地址', content: '确定删除该地址？',
      success: async (res) => {
        if (!res.confirm) return
        await api.address.remove(e.currentTarget.dataset.id)
        wx.showToast({ title: '已删除', icon: 'success' })
        this.loadAddresses()
      }
    })
  },
})
