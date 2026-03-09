const api = require('../../utils/api')

Page({
  data: {
    banners: [],
    categories: [],
    hotProducts: [],
    loading: true
  },

  onLoad() {
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const [bannersRes, categoriesRes, hotRes] = await Promise.all([
        api.home.getBanners(),
        api.home.getCategories(),
        api.home.getHotProducts()
      ])
      this.setData({
        banners: bannersRes.data || [],
        categories: categoriesRes.data || [],
        hotProducts: hotRes.data || [],
        loading: false
      })
    } catch (e) {
      console.error('加载首页数据失败', e)
      this.setData({ loading: false })
    }
  },

  onSearchTap() {
    wx.navigateTo({
      url: '/pages/search/index'
    })
  },

  onBannerTap(e) {
    const { link, type } = e.currentTarget.dataset
    if (type === 'product' && link) {
      wx.navigateTo({
        url: `/pages/product-detail/index?id=${link}`
      })
    }
  },

  onCategoryTap(e) {
    const { id } = e.currentTarget.dataset
    wx.switchTab({
      url: '/pages/category/index'
    })
  },

  onProductTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/product-detail/index?id=${id}`
    })
  },

  async onAddCart(e) {
    const { id } = e.currentTarget.dataset
    try {
      await api.cart.add({ productId: id, quantity: 1 })
      wx.showToast({
        title: '已加入购物车',
        icon: 'success'
      })
    } catch (err) {
      console.error('加入购物车失败', err)
    }
  }
})
