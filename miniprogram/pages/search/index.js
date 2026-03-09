const api = require('../../utils/api')

Page({
  data: {
    keyword: '',
    history: [],
    results: [],
    total: 0,
    hasResult: false,
    loading: false,
  },

  onLoad() {
    const history = wx.getStorageSync('search_history') || []
    this.setData({ history })
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  async onSearch() {
    const kw = this.data.keyword.trim()
    if (!kw) return
    this.setData({ loading: true })

    // 保存历史
    const history = [kw, ...this.data.history.filter(h => h !== kw)].slice(0, 10)
    wx.setStorageSync('search_history', history)
    this.setData({ history })

    try {
      const res = await api.product.search(kw)
      const { list, pagination } = res.data
      this.setData({ results: list, total: pagination.total, hasResult: true, loading: false })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  onHistoryTap(e) {
    const word = e.currentTarget.dataset.word
    this.setData({ keyword: word })
    this.onSearch()
  },

  onClearHistory() {
    wx.setStorageSync('search_history', [])
    this.setData({ history: [] })
  },

  onProductTap(e) {
    wx.navigateTo({ url: `/pages/product-detail/index?id=${e.currentTarget.dataset.id}` })
  },
})
