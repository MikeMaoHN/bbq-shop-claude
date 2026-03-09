const api = require('../../utils/api')

Page({
  data: {
    isEdit: false,
    addressId: null,
    form: { name: '', phone: '', province: '', city: '', district: '', detail: '', is_default: false },
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, addressId: options.id })
      this.loadAddress(options.id)
    }
  },

  async loadAddress(id) {
    const res = await api.address.getList()
    const addr = (res.data || []).find(a => a.id == id)
    if (addr) this.setData({ form: { ...addr, is_default: addr.is_default === 1 } })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  onPickRegion() {
    wx.chooseLocation({
      success: () => {},
    })
    // Use address picker
    wx.showActionSheet({
      itemList: ['广东省', '北京市', '上海市', '浙江省', '江苏省'],
      success: (res) => {
        const provinces = ['广东省', '北京市', '上海市', '浙江省', '江苏省']
        this.setData({ 'form.province': provinces[res.tapIndex], 'form.city': '', 'form.district': '' })
      }
    })
  },

  onDefaultChange(e) {
    this.setData({ 'form.is_default': e.detail.value })
  },

  async onSave() {
    const { name, phone, detail } = this.data.form
    if (!name) return wx.showToast({ title: '请输入收货人', icon: 'none' })
    if (!phone || phone.length < 11) return wx.showToast({ title: '请输入正确手机号', icon: 'none' })
    if (!detail) return wx.showToast({ title: '请输入详细地址', icon: 'none' })
    try {
      if (this.data.isEdit) {
        await api.address.update(this.data.addressId, this.data.form)
      } else {
        await api.address.create(this.data.form)
      }
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1000)
    } catch (e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' })
    }
  },

  async onDelete() {
    wx.showModal({
      title: '删除地址', content: '确定删除该地址？',
      success: async (res) => {
        if (!res.confirm) return
        await api.address.remove(this.data.addressId)
        wx.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1000)
      }
    })
  },
})
