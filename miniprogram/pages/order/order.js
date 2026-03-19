/**
 * 订单页逻辑
 */
const api = require('../../utils/api');
const config = require('../../config');

Page({
  data: {
    isConfirmMode: false,
    orderItems: [],
    selectedAddress: null,
    remark: '',
    goodsAmount: 0,
    freightAmount: 0,
    totalAmount: 0,
    
    // 订单列表
    orders: [],
    statusFilter: '',
    statusMap: config.orderStatus,
    loading: false,
    hasMore: true,
    page: 1
  },

  onLoad(options) {
    if (options.items) {
      this.setData({ isConfirmMode: true });
      try {
        const items = JSON.parse(decodeURIComponent(options.items));
        this.loadOrderItems(items);
        this.loadAddress();
      } catch (e) {
        console.error('parse items error:', e);
        wx.showToast({ title: '参数错误', icon: 'none' });
      }
    }
  },

  onShow() {
    const pendingItems = wx.getStorageSync('pendingOrderItems');
    if (pendingItems) {
      wx.removeStorageSync('pendingOrderItems');
      try {
        const items = JSON.parse(pendingItems);
        this.setData({ isConfirmMode: true });
        this.loadOrderItems(items);
        this.loadAddress();
      } catch (e) {
        console.error('parse pending items error:', e);
      }
    } else if (!this.data.isConfirmMode) {
      this.loadOrders();
    } else if (this.data.selectedAddress) {
      this.loadAddress();
    }
  },

  async loadOrderItems(items) {
    try {
      // 并发请求所有商品详情，避免串行等待
      const products = await Promise.all(
        items.map(item => api.getProductDetail(item.productId))
      );

      const orderItems = items.map((item, idx) => {
        const product = products[idx];
        let image = config.imageBase + '/images/default-product.png';
        try {
          const images = product.images ? JSON.parse(product.images) : [];
          if (images.length > 0) image = config.imageBase + images[0];
        } catch (e) {}
        return {
          productId: product.id,
          name: product.name,
          price: product.price,
          priceFixed: (parseFloat(product.price) / 100).toFixed(2),
          quantity: item.quantity,
          image
        };
      });

      const goodsAmount = orderItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0) / 100;
      const totalAmount = goodsAmount;

      this.setData({
        orderItems,
        goodsAmount,
        totalAmount,
        goodsAmountFixed: goodsAmount.toFixed(2),
        freightAmountFixed: this.data.freightAmount > 0 ? (this.data.freightAmount / 100).toFixed(2) : '0.00',
        totalAmountFixed: totalAmount.toFixed(2)
      });
    } catch (error) {
      console.error('加载商品信息失败:', error);
      wx.showToast({ title: '加载商品信息失败', icon: 'none' });
    }
  },

  async loadAddress() {
    try {
      const result = await api.getAddresses();
      const addresses = result && result.list ? result.list : [];
      const selectedAddress = addresses.find(addr => addr.is_default) || addresses[0] || null;
      this.setData({ selectedAddress });
    } catch (error) {
      console.error('加载地址失败:', error);
    }
  },

  selectAddress() {
    wx.navigateTo({ url: '/pages/profile/profile?selectAddress=1' });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  async submitOrder() {
    if (!this.data.selectedAddress) {
      wx.showToast({ title: '请选择收货地址', icon: 'none' });
      return;
    }

    try {
      const items = this.data.orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const order = await api.createOrder({
        addressId: this.data.selectedAddress.id,
        remark: this.data.remark,
        items
      });

      wx.showModal({
        title: '订单创建成功',
        content: '是否立即支付？',
        success: (res) => {
          if (res.confirm) {
            this.payOrder({ currentTarget: { dataset: { id: order.id } } });
          } else {
            wx.redirectTo({ url: '/pages/order/order' });
          }
        }
      });
    } catch (error) {
      console.error('创建订单失败:', error);
    }
  },

  async payOrder(e) {
    const { id } = e.currentTarget.dataset;
    
    try {
      // 在模拟支付模式下，后端直接返回成功
      // 在真实支付模式下，后端返回支付参数，需要调用 wx.requestPayment
      const result = await api.payOrder(id);
      
      // 如果后端返回支付参数（真实支付模式）
      if (result.paymentData) {
        await wx.requestPayment({
          timeStamp: result.paymentData.timeStamp,
          nonceStr: result.paymentData.nonceStr,
          package: result.paymentData.package,
          signType: result.paymentData.signType,
          paySign: result.paymentData.paySign,
          success: async () => {
            wx.showToast({ title: '支付成功', icon: 'success' });
            this.loadOrders();
          },
          fail: (err) => {
            console.error('支付失败:', err);
            wx.showToast({ title: '支付取消', icon: 'none' });
          }
        });
      } else {
        // 模拟支付模式，直接成功
        wx.showToast({ title: '支付成功', icon: 'success' });
        this.loadOrders();
      }
    } catch (error) {
      console.error('支付失败:', error);
    }
  },

  async cancelOrder(e) {
    const { id } = e.currentTarget.dataset;
    // 找到当前订单，判断状态以展示不同提示文案
    const order = this.data.orders.find(o => o.id === id);
    const isPendingShip = order && order.status === 1;

    wx.showModal({
      title: '提示',
      content: isPendingShip
        ? '订单已付款，确定申请取消吗？取消后将退款，商家会收到通知。'
        : '确定取消订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.cancelOrder(id, '用户申请取消');
            wx.showToast({ title: '订单已取消', icon: 'success' });
            this.loadOrders();
          } catch (error) {
            console.error('取消订单失败:', error);
          }
        }
      }
    });
  },

  async confirmReceipt(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '提示',
      content: '确认已收到商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.confirmReceipt(id);
            wx.showToast({ title: '确认成功', icon: 'success' });
            this.loadOrders();
          } catch (error) {
            console.error('确认收货失败:', error);
          }
        }
      }
    });
  },

  selectStatus(e) {
    const { status } = e.currentTarget.dataset;
    this.setData({
      statusFilter: status,
      orders: [],
      page: 1,
      hasMore: true
    });
    this.loadOrders();
  },

  async loadOrders() {
    if (this.data.loading || !this.data.hasMore || this.data.isConfirmMode) return;

    this.setData({ loading: true });

    try {
      const params = {
        page: this.data.page,
        limit: 10
      };
      
      if (this.data.statusFilter !== '') {
        params.status = parseInt(this.data.statusFilter);
      }

      const result = await api.getOrders(params);
      
      const processedOrders = result.list.map(order => {
        const processedItems = order.items.map(item => ({
          ...item,
          priceFixed: (parseFloat(item.price) / 100).toFixed(2),
          product_image: item.product_image ? config.imageBase + item.product_image : config.imageBase + '/images/default-product.png'
        }));
        return {
          ...order,
          items: processedItems,
          totalAmountFixed: (parseFloat(order.total_amount) / 100).toFixed(2)
        };
      });
      
      const newOrders = this.data.page === 1 ? processedOrders : [...this.data.orders, ...processedOrders];
      
      this.setData({
        orders: newOrders,
        hasMore: newOrders.length < result.total,
        page: this.data.page + 1,
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      console.error('加载订单失败:', error);
    }
  },

  onReachBottom() {
    if (!this.data.isConfirmMode) {
      this.loadOrders();
    }
  }
})
