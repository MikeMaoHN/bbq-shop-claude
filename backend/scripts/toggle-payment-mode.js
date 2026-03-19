#!/usr/bin/env node

/**
 * 支付模式切换脚本
 * 用法：
 *   node scripts/toggle-payment-mode.js        # 查看当前模式
 *   node scripts/toggle-payment-mode.js MOCK   # 切换到模拟支付
 *   node scripts/toggle-payment-mode.js REAL   # 切换到真实支付
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '../.env');
const VALID_MODES = ['MOCK', 'REAL'];

function readEnvFile() {
  if (!fs.existsSync(ENV_FILE)) {
    console.error('错误：.env 文件不存在');
    process.exit(1);
  }
  return fs.readFileSync(ENV_FILE, 'utf8');
}

function writeEnvFile(content) {
  fs.writeFileSync(ENV_FILE, content, 'utf8');
}

function getCurrentMode(content) {
  const match = content.match(/PAYMENT_MODE=(\w+)/);
  return match ? match[1] : 'MOCK';
}

function updateMode(content, newMode) {
  if (content.includes('PAYMENT_MODE=')) {
    return content.replace(/PAYMENT_MODE=\w+/, `PAYMENT_MODE=${newMode}`);
  } else {
    // 如果没有配置，添加到文件末尾
    return content.trimEnd() + '\n\n# 支付模式\nPAYMENT_MODE=' + newMode + '\n';
  }
}

function printUsage() {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║           烧烤店支付模式切换工具                       ║
╠═══════════════════════════════════════════════════════╣
║  用法：                                               ║
║    node scripts/toggle-payment-mode.js               ║
║    node scripts/toggle-payment-mode.js MOCK          ║
║    node scripts/toggle-payment-mode.js REAL          ║
║                                                       ║
║  模式说明：                                           ║
║    MOCK - 模拟支付（开发/测试环境）                   ║
║    REAL - 真实支付（生产环境）                        ║
╚═══════════════════════════════════════════════════════╝
`);
}

function main() {
  const args = process.argv.slice(2);
  const content = readEnvFile();
  const currentMode = getCurrentMode(content);

  // 没有参数时，显示当前模式
  if (args.length === 0) {
    console.log(`\n当前支付模式：${currentMode}`);
    
    if (currentMode === 'MOCK') {
      console.log('\n📌 模拟支付模式已启用');
      console.log('   - 所有支付请求将直接返回成功');
      console.log('   - 不会调用微信支付 API');
      console.log('   - 适用于开发和测试环境\n');
    } else {
      console.log('\n💳 真实支付模式已启用');
      console.log('   - 将调用微信支付 V3 API');
      console.log('   - 需要正确配置商户证书');
      console.log('   - 适用于生产环境\n');
      
      // 检查配置完整性
      const checks = [
        { key: 'WX_MCHID', name: '商户号', pattern: /WX_MCHID=([\w]+)/ },
        { key: 'WX_SERIAL_NO', name: '证书序列号', pattern: /WX_SERIAL_NO=([\w]+)/ },
        { key: 'WX_PRIVATE_KEY_PATH', name: '私钥路径', pattern: /WX_PRIVATE_KEY_PATH=([\w./]+)/ }
      ];
      
      let allConfigured = true;
      checks.forEach(check => {
        const match = content.match(check.pattern);
        const value = match ? match[1] : '';
        const isDefault = value === '' || value === 'your_merchant_id' || value.includes('your_');
        
        if (isDefault) {
          console.log(`   ⚠️  ${check.name} 未配置 (${check.key})`);
          allConfigured = false;
        } else {
          console.log(`   ✅ ${check.name} 已配置`);
        }
      });
      
      if (!allConfigured) {
        console.log('\n   ⚠️  警告：真实支付模式需要完整配置才能正常工作\n');
      }
    }
    
    printUsage();
    return;
  }

  // 有参数时，切换模式
  const newMode = args[0].toUpperCase();
  
  if (!VALID_MODES.includes(newMode)) {
    console.error(`\n❌ 错误：无效的支付模式 "${args[0]}"`);
    console.error(`   有效值：${VALID_MODES.join(' | ')}\n`);
    process.exit(1);
  }

  if (currentMode === newMode) {
    console.log(`\nℹ️  已经是 ${newMode} 模式，无需切换\n`);
    return;
  }

  // 确认切换
  if (newMode === 'REAL') {
    console.log('\n⚠️  警告：切换到真实支付模式前，请确保：');
    console.log('   1. 已配置正确的微信支付商户号');
    console.log('   2. 已上传商户证书到 certs/ 目录');
    console.log('   3. 已配置证书序列号');
    console.log('   4. 已测试过支付流程');
    console.log('');
  }

  const updatedContent = updateMode(content, newMode);
  writeEnvFile(updatedContent);

  console.log(`\n✅ 支付模式已切换：${currentMode} → ${newMode}`);
  
  if (newMode === 'MOCK') {
    console.log('   📌 现在使用模拟支付，支付请求将直接成功');
  } else {
    console.log('   💳 现在使用真实支付，请确保配置正确');
  }
  console.log('');
  console.log('提示：重启服务后生效\n');
}

main();
