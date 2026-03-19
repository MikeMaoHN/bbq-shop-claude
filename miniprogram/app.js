/**
 * 小程序入口
 */
const request = require('./utils/request');

App({
  onLaunch() {
    // 从缓存恢复 token
    const token = wx.getStorageSync('token');
    if (token) {
      request.setToken(token);
    }
  },

  globalData: {
    userInfo: null
  }
})
