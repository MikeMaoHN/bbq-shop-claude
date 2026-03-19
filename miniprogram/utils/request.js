/**
 * 封装网络请求
 */
const config = require('../config');

class Request {
  constructor() {
    this.baseUrl = config.baseUrl;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
    wx.setStorageSync('token', token);
  }

  getToken() {
    if (this.token) return this.token;
    this.token = wx.getStorageSync('token');
    return this.token;
  }

  clearToken() {
    this.token = null;
    wx.removeStorageSync('token');
  }

  request(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.baseUrl + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        timeout: 10000, // 请求超时 10 秒
        header: {
          'Content-Type': 'application/json',
          'Authorization': this.getToken() ? `Bearer ${this.getToken()}` : ''
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
            resolve(res.data.data);
          } else if (res.statusCode === 401) {
            // Token 过期，清除并跳转登录
            this.clearToken();
            const pages = getCurrentPages();
            const currentPage = pages[pages.length - 1];
            if (currentPage && currentPage.route !== 'pages/profile/profile') {
              wx.reLaunch({ url: '/pages/profile/profile' });
            }
            reject({ code: 401, message: '未授权' });
          } else {
            wx.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            });
            reject(res.data);
          }
        },
        fail: (err) => {
          const isTimeout = err.errMsg && err.errMsg.includes('timeout');
          wx.showToast({
            title: isTimeout ? '请求超时，请检查网络' : '网络错误，请稍后重试',
            icon: 'none'
          });
          reject(err);
        }
      });
    });
  }

  get(url, data) {
    return this.request({ url, method: 'GET', data });
  }

  post(url, data) {
    return this.request({ url, method: 'POST', data });
  }

  put(url, data) {
    return this.request({ url, method: 'PUT', data });
  }

  delete(url, data) {
    return this.request({ url, method: 'DELETE', data });
  }
}

const request = new Request();
module.exports = request;
