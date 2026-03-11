require('dotenv').config();

const isProduction = (process.env.NODE_ENV || 'development') === 'production';

function requireSecret(envVar, defaultVal) {
  if (isProduction && !process.env[envVar]) {
    console.error(`[config] FATAL: ${envVar} must be set in production environment`);
    process.exit(1);
  }
  return process.env[envVar] || defaultVal;
}

module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',

  jwt: {
    secret: requireSecret('JWT_SECRET', 'default_jwt_secret'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    adminSecret: requireSecret('JWT_ADMIN_SECRET', 'default_admin_jwt_secret'),
    adminExpiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '2h',
    adminRefreshSecret: requireSecret('JWT_ADMIN_REFRESH_SECRET', 'default_admin_refresh_secret'),
    adminRefreshExpiresIn: process.env.JWT_ADMIN_REFRESH_EXPIRES_IN || '7d',
  },

  admin: {
    origin: process.env.ADMIN_ORIGIN || 'http://localhost:8080',
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
