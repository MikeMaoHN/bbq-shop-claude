/**
 * 个人中心页逻辑
 */
const api = require('../../utils/api');
const request = require('../../utils/request');

Page({
  data: {
    userInfo: null,
    selectAddressMode: false,
    showAddressForm: false,
    addresses: [],
    editingAddressId: null,
    formData: {
      name: '',
      phone: '',
      region: [],
      detail: '',
      isDefault: false
    }
  },

  onLoad(options) {
    if (options.selectAddress) {
      this.setData({ selectAddressMode: true });
      // 加载地址，完成后会自动判断是否弹出表单
      this.loadAddresses();
    }
  },

  onShow() {
    if (!this.data.selectAddressMode) {
      this.loadUserInfo();
    }
  },

  async loadUserInfo() {
    const token = request.getToken();
    if (!token) {
      this.setData({ userInfo: null });
      return;
    }

    try {
      const userInfo = await api.getUserInfo();
      this.setData({ userInfo });
    } catch (error) {
      console.error('获取用户信息失败:', error);
      this.setData({ userInfo: null });
    }
  },

  async wxLogin() {
    try {
      const { code } = await wx.login();
      const result = await api.wxLogin(code);
      
      request.setToken(result.token);
      this.setData({ userInfo: result.user });
      
      wx.showToast({ title: '登录成功', icon: 'success' });
    } catch (error) {
      console.error('登录失败:', error);
    }
  },
  
  // testLogin() {
  //   // 测试用登录方法，生产环境建议移除
  //   api.wxLogin('test_demo').then(result => {
  //     request.setToken(result.token);
  //     this.setData({ userInfo: result.user });
  //     wx.showToast({ title: '测试登录成功', icon: 'success' });
  //   }).catch(err => {
  //     console.error('测试登录失败:', err);
  //   });
  // },

  goOrder(e) {
    const { status } = e.currentTarget.dataset;
    wx.switchTab({ 
      url: `/pages/order/order${status !== '' ? `?status=${status}` : ''}` 
    });
  },

  /**
   * 返回订单页
   */
  backToOrder() {
    wx.navigateBack();
  },

  async loadAddresses() {
    try {
      const result = await api.getAddresses();
      const addresses = result && result.list ? result.list : [];
      
      // 先设置地址数据
      this.setData({ addresses }, () => {
        if (this.data.selectAddressMode && addresses.length === 0) {
          this.goAddAddress();
        }
      })
    } catch (error) {
      console.error('加载地址失败:', error);
    }
  },

  goAddresses() {
    this.setData({
      selectAddressMode: true,
      showAddressForm: false
    });
    this.loadAddresses();
  },

  selectAddress(e) {
    const { id } = e.currentTarget.dataset;
    const address = this.data.addresses.find(addr => addr.id === id);
    
    // 返回到订单确认页
    const pages = getCurrentPages();
    if (pages.length < 2) {
      wx.navigateBack();
      return;
    }
    
    const prevPage = pages[pages.length - 2];
    
    if (prevPage && prevPage.setData) {
      prevPage.setData({ selectedAddress: address });
    }
    
    wx.navigateBack();
  },

  goAddAddress() {
    this.setData({
      showAddressForm: true,
      editingAddressId: null,
      formData: {
        name: '',
        phone: '',
        region: [],
        detail: '',
        isDefault: false
      }
    });
  },

  editAddress(e) {
    const { id } = e.currentTarget.dataset;
    const address = this.data.addresses.find(addr => addr.id === id);
    
    if (address) {
      this.setData({
        showAddressForm: true,
        editingAddressId: id,
        formData: {
          name: address.name,
          phone: address.phone,
          region: [address.province, address.city, address.district],
          detail: address.detail,
          isDefault: address.is_default
        }
      });
    }
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  onRegionChange(e) {
    this.setData({
      'formData.region': e.detail.value
    });
  },

  toggleDefault() {
    this.setData({
      'formData.isDefault': !this.data.formData.isDefault
    });
  },

  cancelAddress() {
    this.setData({
      showAddressForm: false
    });
  },

  async saveAddress() {
    const { name, phone, region, detail, isDefault } = this.data.formData;

    if (!name || !phone || !region || region.length < 3 || !detail) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }

    try {
      const data = {
        name,
        phone,
        province: region[0],
        city: region[1],
        district: region[2],
        detail,
        isDefault
      };

      if (this.data.editingAddressId) {
        await api.updateAddress(this.data.editingAddressId, data);
      } else {
        await api.createAddress(data);
      }

      wx.showToast({ title: '保存成功', icon: 'success' });
      this.setData({ showAddressForm: false });
      this.loadAddresses();
      
      if (this.data.selectAddressMode) {
        // 由订单页 onShow 自动刷新地址，直接返回即可
        wx.navigateBack();
      }
    } catch (error) {
      console.error('保存地址失败:', error);
    }
  },

  contactService() {
    wx.makePhoneCall({
      phoneNumber: '13800138000'
    });
  },

  about() {
    wx.showModal({
      title: '关于我们',
      content: '烧烤食材售卖小程序，为您提供新鲜优质的烧烤食材，让您在家也能享受烧烤乐趣！',
      showCancel: false
    });
  }
})
