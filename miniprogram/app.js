// 根据环境切换 API 地址
const envConfig = {
  develop: 'http://localhost:3000/api/v1',
  trial: 'https://your-staging-domain.com/api/v1',
  release: 'https://your-production-domain.com/api/v1',
}
const accountInfo = wx.getAccountInfoSync ? wx.getAccountInfoSync() : {}
const envVersion = (accountInfo.miniProgram && accountInfo.miniProgram.envVersion) || 'develop'

App({
  globalData: {
    userInfo: null,
    token: '',
    baseUrl: envConfig[envVersion] || envConfig.develop
  },

  onLaunch() {
    this.checkLogin()
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        this.globalData.userInfo = userInfo
      }
    }
  },

  setToken(token) {
    this.globalData.token = token
    wx.setStorageSync('token', token)
  },

  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
  },

  clearAuth() {
    this.globalData.token = ''
    this.globalData.userInfo = null
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
  }
})
