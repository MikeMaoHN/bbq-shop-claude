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
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,
  },
};
