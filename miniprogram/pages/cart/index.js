const api = require('../../utils/api')

Page({
  data: {
    cartItems: [],
    loading: true,
  },

  onShow() {
    this.loadCart()
  },

  async loadCart() {
    try {
      const res = await api.cart.getList()
      const items = (res.data || []).map(item => ({ ...item, checked: true }))
      this.setData({ cartItems: items, loading: false })
      this.calcTotal()
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  calcTotal() {
    let total = 0
    let count = 0
    this.data.cartItems.forEach(item => {
      if (item.checked && item.Product) {
        const price = item.ProductSpec ? item.ProductSpec.price : item.Product.price
        total += price * item.quantity
        count++
      }
    })
    const allChecked = this.data.cartItems.length > 0 && this.data.cartItems.every(i => i.checked)
    this.setData({
      totalPrice: total.toFixed(2),
      checkedCount: count,
      allChecked,
    })
  },

  onToggleItem(e) {
    const { index } = e.currentTarget.dataset
    const key = `cartItems[${index}].checked`
    this.setData({ [key]: !this.data.cartItems[index].checked })
    this.calcTotal()
  },

  onSelectAll() {
    const allChecked = !this.data.allChecked
    const items = this.data.cartItems.map(i => ({ ...i, checked: allChecked }))
    this.setData({ cartItems: items })
    this.calcTotal()
  },

  async onIncrease(e) {
    const { index } = e.currentTarget.dataset
    const item = this.data.cartItems[index]
    const qty = item.quantity + 1
    await api.cart.update(item.id, qty)
    this.setData({ [`cartItems[${index}].quantity`]: qty })
    this.calcTotal()
  },

  async onDecrease(e) {
    const { index } = e.currentTarget.dataset
    const item = this.data.cartItems[index]
    if (item.quantity <= 1) return this.onDelete({ currentTarget: { dataset: { id: item.id } } })
    const qty = item.quantity - 1
    await api.cart.update(item.id, qty)
    this.setData({ [`cartItems[${index}].quantity`]: qty })
    this.calcTotal()
  },

  async onDelete(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '提示', content: '确认删除该商品？',
      success: async (res) => {
        if (!res.confirm) return
        await api.cart.remove(id)
        const items = this.data.cartItems.filter(i => i.id !== id)
        this.setData({ cartItems: items })
        this.calcTotal()
      }
    })
  },

  onProductTap(e) {
    wx.navigateTo({ url: `/pages/product-detail/index?id=${e.currentTarget.dataset.id}` })
  },

  onCheckout() {
    const checked = this.data.cartItems.filter(i => i.checked)
    if (!checked.length) return wx.showToast({ title: '请选择商品', icon: 'none' })
    const token = wx.getStorageSync('token')
    if (!token) return wx.navigateTo({ url: '/pages/user/index' })
    wx.navigateTo({ url: '/pages/order-confirm/index?from=cart' })
  },
})
