require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    adminSecret: process.env.JWT_ADMIN_SECRET || 'default_admin_jwt_secret',
    adminExpiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '24h',
  },

  wx: {
    appId: process.env.WX_APP_ID || '',
    appSecret: process.env.WX_APP_SECRET || '',
    mchId: process.env.WX_MCH_ID || '',
    mchKey: process.env.WX_MCH_KEY || '',
    notifyUrl: process.env.WX_NOTIFY_URL || '',
    // 启动默认：true=模拟支付，false=真实支付（可被管理后台 DB 设置覆盖，运行时生效）
    payMock: process.env.WECHAT_PAY_MOCK === 'true' || process.env.NODE_ENV !== 'production',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,
  },
};
