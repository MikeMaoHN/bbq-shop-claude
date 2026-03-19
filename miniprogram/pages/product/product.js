/**
 * 商品/购物车页逻辑
 */
const api = require('../../utils/api');
const config = require('../../config');

Page({
  data: {
    isCartMode: false,
    cartItems: [],
    allChecked: false,
    checkedCount: 0,
    totalPrice: 0,
    product: {},
    productImages: []
  },

  onLoad(options) {
    if (options.cart) {
      this.setData({ isCartMode: true });
      this.loadCart();
    } else if (options.id) {
      this.loadProduct(options.id);
    }
  },

  async loadCart() {
    try {
      const cart = await api.getCart();
      const items = cart.items || [];
      
      const processedItems = items.map(item => {
        let firstImage = config.imageBase + '/images/default-product.png';
        try {
          const images = item.images ? JSON.parse(item.images) : [];
          if (images.length > 0) firstImage = config.imageBase + images[0];
        } catch (e) {}
        return { 
          ...item, 
          firstImage,
          priceFixed: (parseFloat(item.price) / 100).toFixed(2)
        };
      });
      
      const allChecked = processedItems.length > 0 && processedItems.every(item => item.checked);
      
      this.setData({
        cartItems: processedItems,
        allChecked
      });
      this.calculateTotal();
    } catch (error) {
      console.error('加载购物车失败:', error);
    }
  },

  async loadProduct(id) {
    try {
      const product = await api.getProductDetail(id);
      
      let images = [];
      try {
        images = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []);
      } catch (e) {
        console.error('parse images error:', e);
      }
      
      const processedProduct = {
        ...product,
        priceFixed: (parseFloat(product.price) / 100).toFixed(2),
        originalPriceFixed: product.original_price ? (parseFloat(product.original_price) / 100).toFixed(2) : null
      };
      
      const processedImages = images.length > 0 
        ? images.map(img => config.imageBase + img)
        : [config.imageBase + '/images/default-product.png'];
      
      this.setData({
        product: processedProduct,
        productImages: processedImages
      });
    } catch (error) {
      console.error('加载商品详情失败:', error);
      wx.showToast({ title: '加载失败: ' + (error.message || error), icon: 'none' });
      setTimeout(() => wx.navigateBack(), 2000);
    }
  },

  calculateTotal() {
    const { cartItems } = this.data;
    const checkedItems = cartItems.filter(item => item.checked);
    const totalPrice = checkedItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0) / 100;
    
    this.setData({
      checkedCount: checkedItems.length,
      totalPrice,
      totalPriceFixed: totalPrice.toFixed(2)
    });
  },

  toggleCheck(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.cartItems.find(item => item.id === id);
    
    api.updateCartChecked(id, !item.checked).then(() => {
      item.checked = !item.checked;
      this.setData({
        cartItems: [...this.data.cartItems],
        allChecked: this.data.cartItems.every(item => item.checked)
      });
      this.calculateTotal();
    });
  },

  toggleAll() {
    const newChecked = !this.data.allChecked;
    
    api.updateAllChecked(newChecked).then(() => {
      this.data.cartItems.forEach(item => {
        item.checked = newChecked;
      });
      this.setData({
        cartItems: [...this.data.cartItems],
        allChecked: newChecked
      });
      this.calculateTotal();
    });
  },

  increase(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.cartItems.find(item => item.id === id);
    
    if (item.quantity >= item.stock) {
      wx.showToast({ title: '库存不足', icon: 'none' });
      return;
    }
    
    api.updateCartQuantity(id, item.quantity + 1).then(() => {
      item.quantity++;
      this.setData({ cartItems: [...this.data.cartItems] });
      this.calculateTotal();
    });
  },

  decrease(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.cartItems.find(item => item.id === id);
    
    if (item.quantity <= 1) {
      this.deleteItem({ currentTarget: { dataset: { id } } });
      return;
    }
    
    api.updateCartQuantity(id, item.quantity - 1).then(() => {
      item.quantity--;
      this.setData({ cartItems: [...this.data.cartItems] });
      this.calculateTotal();
    });
  },

  deleteItem(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '提示',
      content: '确定删除该商品吗？',
      success: (res) => {
        if (res.confirm) {
          api.deleteCartItem(id).then(() => {
            this.setData({
              cartItems: this.data.cartItems.filter(item => item.id !== id)
            });
            this.calculateTotal();
          });
        }
      }
    });
  },

  clearCart() {
    wx.showModal({
      title: '提示',
      content: '确定清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          api.clearCart().then(() => {
            this.setData({ cartItems: [] });
            this.calculateTotal();
          });
        }
      }
    });
  },

  checkout() {
    if (this.data.checkedCount === 0) {
      wx.showToast({ title: '请选择商品', icon: 'none' });
      return;
    }
    
    const items = this.data.cartItems.filter(item => item.checked).map(item => ({
      productId: item.product_id,
      quantity: item.quantity
    }));
    
    wx.setStorageSync('pendingOrderItems', JSON.stringify(items));
    wx.switchTab({ url: '/pages/order/order' });
  },

  goShop() {
    wx.switchTab({ url: '/pages/shop/shop' });
  },

  async addToCart() {
    try {
      await api.addToCart(this.data.product.id, 1);
      wx.showToast({ title: '已加入购物车', icon: 'success' });
    } catch (error) {
      console.error('加入购物车失败:', error);
    }
  },

  buyNow() {
    if (!this.data.product || !this.data.product.id) {
      wx.showToast({ title: '商品未加载', icon: 'none' });
      return;
    }
    const items = JSON.stringify([{ productId: this.data.product.id, quantity: 1 }]);
    const url = `/pages/order/order?items=${items}`;
    wx.setStorageSync('pendingOrderItems', items);
    wx.switchTab({ url: '/pages/order/order' });
  }
})
