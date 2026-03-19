/**
 * 小程序配置
 * 复制此文件为 config.js 并填入实际配置
 */

// 开发环境配置
const devConfig = {
  apiBaseUrl: 'http://localhost:3000/api',
  timeout: 10000
};

// 生产环境配置
const prodConfig = {
  apiBaseUrl: 'https://your-api-domain.com/api',
  timeout: 10000
};

// 根据环境导出配置
const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;

// 小程序配置（必填）
const APP_CONFIG = {
  // 你的小程序 AppID（在 project.config.json 中也需要配置）
  appid: 'wx94b4d7c059d93cea',
  
  // 页面路径配置
  pages: {
    index: '/pages/index/index',
    shop: '/pages/shop/shop',
    product: '/pages/product/product',
    order: '/pages/order/order',
    profile: '/pages/profile/profile'
  },
  
  // 订单状态映射
  orderStatus: {
    0: '待付款',
    1: '待发货',
    2: '待收货',
    3: '已完成',
    4: '已取消'
  }
};

module.exports = {
  ...config,
  ...APP_CONFIG
};
