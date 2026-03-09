const api = require('../../utils/api')

Page({
  data: { userInfo: null },

  onShow() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.loadProfile()
    }
  },

  async loadProfile() {
    try {
      const res = await api.user.getProfile()
      this.setData({ userInfo: res.data })
    } catch (e) {
      wx.removeStorageSync('token')
    }
  },

  onLogin() {
    wx.login({
      success: async (res) => {
        if (!res.code) return
        try {
          const loginRes = await api.auth.login(res.code)
          wx.setStorageSync('token', loginRes.data.token)
          this.setData({ userInfo: loginRes.data.userInfo })
          wx.showToast({ title: '登录成功', icon: 'success' })
        } catch (e) {
          wx.showToast({ title: '登录失败', icon: 'none' })
        }
      }
    })
  },

  onContact() {
    wx.makePhoneCall({ phoneNumber: '400-888-8888' })
  },
})
