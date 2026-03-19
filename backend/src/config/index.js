/**
 * 应用配置
 */
require('dotenv').config();

module.exports = {
  // 服务器配置
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('生产环境必须配置 JWT_SECRET 环境变量，建议使用 crypto.randomBytes(32).toString("hex") 生成');
      }
      return 'dev_only_secret_not_for_production';
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // 微信小程序配置
  wx: {
    appid: process.env.WX_APPID || '',
    secret: process.env.WX_SECRET || '',
    grantType: process.env.WX_GRANT_TYPE || 'authorization_code'
  },

  // 微信支付配置
  wxPay: {
    mchid: process.env.WX_MCHID || '',
    apikey: process.env.WX_APIKEY || '',
    notifyUrl: process.env.WX_NOTIFY_URL || '',
    serialNo: process.env.WX_SERIAL_NO || '',
    privateKeyPath: process.env.WX_PRIVATE_KEY_PATH || './certs/apiclient_key.pem',
    // 支付模式：MOCK(模拟) | REAL(真实)
    mode: process.env.PAYMENT_MODE || 'MOCK'
  },

  // 文件上传配置
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
  },

  // CORS 配置
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  }
};
