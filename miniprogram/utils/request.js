const app = getApp()

function request(options) {
  const { url, method = 'GET', data = {}, header = {} } = options
  const baseUrl = app.globalData.baseUrl
  const token = wx.getStorageSync('token')

  return new Promise((resolve, reject) => {
    wx.request({
      url: baseUrl + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...header
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          app.clearAuth()
          wx.showToast({
            title: '请重新登录',
            icon: 'none'
          })
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/user/index'
            })
          }, 1500)
          reject(res.data)
        } else {
          wx.showToast({
            title: res.data.message || '请求失败',
            icon: 'none'
          })
          reject(res.data)
        }
      },
      fail(err) {
        wx.showToast({
          title: '网络异常，请稍后重试',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

function get(url, data = {}) {
  return request({ url, method: 'GET', data })
}

function post(url, data = {}) {
  return request({ url, method: 'POST', data })
}

function put(url, data = {}) {
  return request({ url, method: 'PUT', data })
}

function del(url, data = {}) {
  return request({ url, method: 'DELETE', data })
}

module.exports = {
  request,
  get,
  post,
  put,
  del
}
