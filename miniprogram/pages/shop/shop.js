/**
 * 商城页逻辑
 */
const api = require('../../utils/api');
const config = require('../../config');

Page({
  data: {
    categories: [],
    products: [],
    categoryId: '',
    searchKeyword: '',
    loading: false,
    hasMore: true,
    page: 1,
    cartCount: 0
  },

  onLoad(options) {
    if (options.categoryId) {
      this.setData({ categoryId: options.categoryId });
    }
    this.loadCategories();
    this.loadProducts();
  },

  onShow() {
    this.loadCartCount();
  },

  async loadCategories() {
    try {
      const categories = await api.getCategories();
      const processedCategories = categories.map(cat => ({
        ...cat,
        icon: cat.icon ? config.imageBase + cat.icon : config.imageBase + '/images/default-category.png'
      }));
      this.setData({ categories: processedCategories });
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  },

  async loadProducts() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({ loading: true });

    try {
      const params = {
        page: this.data.page,
        limit: 20
      };
      
      if (this.data.categoryId) {
        params.categoryId = this.data.categoryId;
      }
      
      if (this.data.searchKeyword) {
        params.keyword = this.data.searchKeyword;
      }

      const result = await api.getProducts(params);
      
      const processedProducts = result.list.map(item => {
        let firstImage = config.imageBase + '/images/default-product.png';
        try {
          const images = item.images ? JSON.parse(item.images) : [];
          if (images.length > 0) firstImage = config.imageBase + images[0];
        } catch (e) {}
        const priceYuan = (parseFloat(item.price) / 100).toFixed(2);
        const originalPriceYuan = item.original_price ? (parseFloat(item.original_price) / 100).toFixed(2) : null;
        return { 
          ...item, 
          firstImage,
          priceFixed: priceYuan,
          originalPriceFixed: originalPriceYuan
        };
      });
      
      const newProducts = this.data.page === 1 ? processedProducts : [...this.data.products, ...processedProducts];
      
      this.setData({
        products: newProducts,
        hasMore: newProducts.length < result.total,
        page: this.data.page + 1,
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      console.error('加载商品失败:', error);
    }
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  clearSearch() {
    this.setData({ searchKeyword: '' });
    this.loadProducts();
  },

  doSearch() {
    this.setData({
      products: [],
      page: 1,
      hasMore: true,
      categoryId: ''
    });
    this.loadProducts();
  },

  async loadCartCount() {
    try {
      const cart = await api.getCart();
      const items = cart.items || [];
      this.setData({
        cartCount: items.filter(item => item.checked).length
      });
    } catch (error) {
      console.error('加载购物车失败:', error);
    }
  },

  selectCategory(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({
      categoryId: id === '' ? '' : id,
      searchKeyword: '',
      products: [],
      page: 1,
      hasMore: true
    });
    this.loadProducts();
  },

  goProduct(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/product/product?id=${id}` });
  },

  async addToCart(e) {
    e.stopPropagation();
    const { id } = e.currentTarget.dataset;
    
    try {
      await api.addToCart(id, 1);
      wx.showToast({ title: '已加入购物车', icon: 'success' });
      this.loadCartCount();
    } catch (error) {
      console.error('加入购物车失败:', error);
    }
  },

  goCart() {
    wx.navigateTo({ url: '/pages/product/product?cart=1' });
  },

  onReachBottom() {
    this.loadProducts();
  }
})
