const api = require('../../utils/api')

Page({
  data: {
    categories: [],
    currentCategoryId: '',
    products: [],
    loading: true,
    productLoading: false
  },

  onLoad() {
    this.loadCategories()
  },

  async loadCategories() {
    this.setData({ loading: true })
    try {
      const res = await api.home.getCategories()
      const categories = res.data || []
      this.setData({
        categories,
        loading: false
      })
      if (categories.length > 0) {
        this.setData({ currentCategoryId: categories[0].id })
        this.loadProducts(categories[0].id)
      }
    } catch (e) {
      console.error('加载分类失败', e)
      this.setData({ loading: false })
    }
  },

  onCategoryTap(e) {
    const { id } = e.currentTarget.dataset
    if (id === this.data.currentCategoryId) return
    this.setData({ currentCategoryId: id })
    this.loadProducts(id)
  },

  async loadProducts(categoryId) {
    this.setData({ productLoading: true })
    try {
      const res = await api.product.getList({ categoryId })
      this.setData({
        products: res.data || [],
        productLoading: false
      })
    } catch (e) {
      console.error('加载商品失败', e)
      this.setData({ productLoading: false })
    }
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
      wx.showToast({ title: '已加入购物车', icon: 'success' })
    } catch (err) {
      console.error('加入购物车失败', err)
    }
  }
})
