/**
 * 数据库配置 - MySQL 版本
 * 使用 mysql2/promise 连接池，支持异步操作和事务管理
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bbq_shop',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+08:00'
});

// 验证数据库连接
pool.getConnection()
  .then(conn => {
    console.log('✓ MySQL 数据库连接成功');
    conn.release();
  })
  .catch(err => {
    console.error('✗ MySQL 数据库连接失败:', err.message);
    console.error('请检查 .env 文件中的数据库配置（DB_HOST, DB_USER, DB_PASSWORD, DB_NAME）');
  });

module.exports = pool;
