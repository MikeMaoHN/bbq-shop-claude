/**
 * 全局配置
 * 只需修改 HOST 为实际服务器地址，baseUrl 和 imageBase 自动更新
 */

// 服务器地址：开发时填写局域网 IP，生产时替换为正式域名
// 注意：生产环境必须使用 HTTPS，否则小程序无法上线
const HOST = 'http://47.113.189.235:3000'

// 开发环境标志（手动切换）
const isDev = true // 开发环境设为 true，生产环境改为 false

if (!isDev && HOST.startsWith('http://')) {
  console.warn('⚠️ 警告：生产环境请使用 HTTPS 以确保数据传输安全')
}

module.exports = {
  // API 基础地址
  baseUrl: HOST + '/api',

  // 图片地址前缀
  imageBase: HOST,

  // 订单状态映射
  orderStatus: {
    0: '待付款',
    1: '待发货',
    2: '待收货',
    3: '已完成',
    4: '已取消'
  }
}
