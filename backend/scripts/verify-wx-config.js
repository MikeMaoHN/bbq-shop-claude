#!/usr/bin/env node

/**
 * 微信小程序配置验证脚本
 * 用途：验证 WX_APPID 和 WX_SECRET 配置是否正确
 */

const path = require('path');
const crypto = require('crypto');

// 加载环境变量
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const config = {
  appid: process.env.WX_APPID,
  secret: process.env.WX_SECRET,
  grantType: process.env.WX_GRANT_TYPE
};

console.log('='.repeat(60));
console.log('微信小程序配置验证');
console.log('='.repeat(60));
console.log('');

// 验证配置完整性
let hasError = false;

console.log('【配置检查】');
if (!config.appid || config.appid === 'your_wx_appid') {
  console.log('❌ WX_APPID: 未配置或使用占位符');
  hasError = true;
} else {
  console.log(`✅ WX_APPID: ${config.appid}`);
}

if (!config.secret || config.secret === 'your_wx_secret') {
  console.log('❌ WX_SECRET: 未配置或使用占位符');
  hasError = true;
} else {
  console.log(`✅ WX_SECRET: ${'*'.repeat(8)}${config.secret.slice(-24)}`);
}

if (!config.grantType) {
  console.log('❌ WX_GRANT_TYPE: 未配置');
  hasError = true;
} else {
  console.log(`✅ WX_GRANT_TYPE: ${config.grantType}`);
}

console.log('');

// 验证 AppID 格式
console.log('【格式验证】');
const appidRegex = /^wx[a-f0-9]{8,}$/;
if (appidRegex.test(config.appid)) {
  console.log(`✅ AppID 格式正确`);
} else {
  console.log(`❌ AppID 格式错误 (应为 wx 开头的 16 位以上十六进制字符串)`);
  hasError = true;
}

const secretRegex = /^[a-f0-9]{32}$/;
if (secretRegex.test(config.secret)) {
  console.log(`✅ Secret 格式正确 (32 位十六进制)`);
} else {
  console.log(`❌ Secret 格式错误 (应为 32 位十六进制字符串)`);
  hasError = true;
}

console.log('');

// 生成配置校验和
console.log('【配置校验】');
const hash = crypto.createHash('sha256');
hash.update(`${config.appid}:${config.secret}`);
const checksum = hash.digest('hex');
console.log(`配置校验和：${checksum}`);

console.log('');
console.log('='.repeat(60));

if (hasError) {
  console.log('❌ 配置验证失败，请检查 .env 文件');
  process.exit(1);
} else {
  console.log('✅ 配置验证通过');
  console.log('');
  console.log('下一步：');
  console.log('1. 重启后端服务：pm2 restart bbq-backend');
  console.log('2. 测试微信登录功能');
  console.log('3. 验证 code2Session 接口返回正常');
  process.exit(0);
}
