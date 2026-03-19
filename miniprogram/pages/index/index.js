/**
 * 首页逻辑
 */
const api = require('../../utils/api');
const config = require('../../config');

Page({
  data: {
    banners: [
      { id: 1, image: config.imageBase + '/images/banner1.png' },
      { id: 2, image: config.imageBase + '/images/banner2.png' },
      { id: 3, image: config.imageBase + '/images/banner3.png' }
    ],
    categories: [],
    hotProducts: [],
    loading: false
  },

  onLoad() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadData() {
    this.setData({ loading: true });
    
    try {
      const [categories, hotProducts] = await Promise.all([
        api.getCategories(),
        api.getProducts({ isHot: '1', limit: 8 })
      ]);
      
      const processedCategories = categories.map(cat => ({
        ...cat,
        icon: cat.icon ? config.imageBase + cat.icon : config.imageBase + '/images/default-category.png'
      }));
      
      const processedProducts = hotProducts.list.map(item => {
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
      
      this.setData({
        categories: processedCategories,
        hotProducts: processedProducts
      });
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/shop/shop?search=1' });
  },

  goCategory(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/shop/shop?categoryId=${id}` });
  },

  goProduct(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/product/product?id=${id}` });
  }
})
