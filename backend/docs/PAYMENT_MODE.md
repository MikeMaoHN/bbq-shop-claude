# 支付模式配置指南

## 概述

本项目支持**模拟支付**和**真实支付**两种模式，通过 `PAYMENT_MODE` 环境变量控制。

## 模式说明

### 📌 MOCK 模式（模拟支付）

**适用场景**：
- 开发环境调试
- 功能测试
- CI/CD 自动化测试
- 演示环境

**特点**：
- ✅ 无需微信支付商户号
- ✅ 支付请求直接返回成功
- ✅ 正常扣减库存、更新订单状态
- ✅ 记录支付日志
- ❌ 不调用真实微信支付 API
- ❌ 不产生真实交易

### 💳 REAL 模式（真实支付）

**适用场景**：
- 生产环境
- 真实用户交易
- 收银对账测试

**特点**：
- ✅ 调用微信支付 V3 API
- ✅ 生成真实支付参数
- ✅ 处理支付回调
- ✅ 支持退款操作
- ❌ 需要完整的微信商户配置
- ❌ 产生真实资金流转

## 配置方法

### 方法一：使用切换脚本（推荐）

```bash
cd backend

# 查看当前模式
node scripts/toggle-payment-mode.js

# 切换到模拟支付
node scripts/toggle-payment-mode.js MOCK

# 切换到真实支付
node scripts/toggle-payment-mode.js REAL
```

### 方法二：手动修改 .env

```bash
# 开发环境 - 模拟支付
PAYMENT_MODE=MOCK

# 生产环境 - 真实支付
PAYMENT_MODE=REAL
```

**修改后需要重启服务**。

## 环境配置清单

### 开发环境 (.env)

```env
# 服务器配置
NODE_ENV=development
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=dev_password

# JWT 配置
JWT_SECRET=dev_only_secret_not_for_production

# 微信支付配置（模拟模式可不填）
WX_APPID=wx_test_appid
WX_SECRET=wx_test_secret
WX_MCHID=your_merchant_id
WX_APIKEY=your_api_key
WX_NOTIFY_URL=http://localhost:3000/api/pay/notify
WX_SERIAL_NO=
WX_PRIVATE_KEY_PATH=./certs/apiclient_key.pem

# 支付模式 - 开发环境使用模拟
PAYMENT_MODE=MOCK
```

### 生产环境 (.env.production)

```env
# 服务器配置
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=prod-db.example.com
DB_USER=prod_user
DB_PASSWORD=STRONG_PASSWORD_HERE

# JWT 配置（必须使用强密钥）
JWT_SECRET=7f3a8b2c9d4e5f6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a

# 微信支付配置（必须完整配置）
WX_APPID=wx_real_appid
WX_SECRET=wx_real_secret
WX_MCHID=1234567890
WX_APIKEY=your_strong_apikey
WX_NOTIFY_URL=https://api.yourdomain.com/api/pay/notify
WX_SERIAL_NO=5A3B7C9D2E1F4A8B...
WX_PRIVATE_KEY_PATH=./certs/apiclient_key.pem

# 支付模式 - 生产环境使用真实
PAYMENT_MODE=REAL

# CORS 配置（必须限制域名）
CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com
```

## 部署检查清单

### 从 MOCK 切换到 REAL 前

- [ ] 已申请微信支付商户号
- [ ] 已下载 API 证书（apiclient_key.pem）
- [ ] 已将证书放入 `backend/certs/` 目录
- [ ] 已配置 `WX_MCHID`（商户号）
- [ ] 已配置 `WX_SERIAL_NO`（证书序列号）
- [ ] 已配置 `WX_PRIVATE_KEY_PATH`（私钥路径）
- [ ] 已配置 `WX_APIKEY`（API 密钥）
- [ ] 已配置 `WX_NOTIFY_URL`（支付回调地址，必须 HTTPS）
- [ ] 已在测试环境验证支付流程
- [ ] 已备份当前配置
- [ ] 已通知相关人员（财务、测试等）

### 切换流程

```bash
# 1. 备份当前配置
cp .env .env.backup.$(date +%Y%m%d)

# 2. 切换到真实支付模式
node scripts/toggle-payment-mode.js REAL

# 3. 检查配置是否完整
node scripts/toggle-payment-mode.js

# 4. 重启服务
pm2 restart bbq-backend

# 5. 验证支付功能（小额测试）
# 创建订单 → 支付 0.01 元 → 检查回调

# 6. 查看日志确认无错误
tail -f logs/app.log | grep -E "(支付 | 回调|error)"
```

## API 响应差异

### 创建订单响应

**MOCK 模式**：
```json
{
  "code": 200,
  "message": "订单创建成功，模拟支付已开启",
  "data": {
    "order": {...},
    "payParams": null,
    "paymentMode": "MOCK"
  }
}
```

**REAL 模式**：
```json
{
  "code": 200,
  "message": "订单创建成功，请调用支付",
  "data": {
    "order": {...},
    "payParams": {
      "appId": "wx1234567890",
      "timeStamp": "1234567890",
      "nonceStr": "abc123def456",
      "package": "prepay_id=wx20230309123456789abcdef",
      "signType": "RSA",
      "paySign": "MIIEvQIBADANBgkqhkiG9w0BAQEFAAS..."
    },
    "paymentMode": "REAL"
  }
}
```

### 支付响应

**MOCK 模式**：
```json
{
  "code": 200,
  "message": "支付成功（模拟支付）",
  "data": {
    "order": {...},
    "paymentMode": "MOCK"
  }
}
```

**REAL 模式**：
```json
{
  "code": 200,
  "message": "请调用 wx.requestPayment 完成支付",
  "data": {
    "payParams": {...},
    "order": {...},
    "paymentMode": "REAL"
  }
}
```

## 日志示例

### MOCK 模式日志
```
[2026-03-09 12:00:00] INFO  OrderController: 订单 ORD202603090000000000 使用模拟支付模式
[2026-03-09 12:00:01] WARN  OrderController: 订单 ORD202603090000000000 使用模拟支付（开发模式）
```

### REAL 模式日志
```
[2026-03-09 12:00:00] INFO  OrderController: 订单 ORD202603090000000000 已生成真实支付参数
[2026-03-09 12:00:05] INFO  OrderController: 支付回调：{ transaction_id: "4200001234567890" }
[2026-03-09 12:00:05] INFO  OrderController: 订单 ORD202603090000000000 支付成功
```

## 常见问题

### Q1: 切换模式后需要重启服务吗？
**A**: 是的，修改 `.env` 后必须重启服务才能生效。

### Q2: 模拟支付会影响库存吗？
**A**: 会。模拟支付也会正常扣减库存、更新订单状态，只是不调用真实支付 API。

### Q3: 如何在生产环境测试支付？
**A**: 建议：
1. 使用微信支付沙箱环境测试
2. 或在 MOCK 模式下测试完整流程
3. 切换到 REAL 后只做小额验证（0.01 元）

### Q4: 忘记配置证书序列号会怎样？
**A**: 系统会自动降级为 MOCK 模式，并在日志中提示错误。

### Q5: 可以在运行时动态切换吗？
**A**: 不建议。运行时切换可能导致状态不一致，建议重启服务。

## 安全提醒

⚠️ **重要**：
1. 生产环境**严禁**使用 MOCK 模式
2. `.env` 文件不要提交到 Git
3. 证书文件要设置正确的文件权限（600）
4. 定期更换 JWT_SECRET 和 API 密钥
5. 支付回调地址必须使用 HTTPS

## 相关文件

- `backend/.env` - 环境变量配置
- `backend/src/config/index.js` - 配置加载
- `backend/src/controllers/orderController.js` - 支付逻辑
- `backend/src/services/wechatPayService.js` - 微信支付服务
- `backend/scripts/toggle-payment-mode.js` - 模式切换脚本

---

*最后更新：2026-03-09*
