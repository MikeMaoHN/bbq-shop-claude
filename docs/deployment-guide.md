# 微信支付上线部署指南

> 版本：v1.0 | 适用项目：烤乐汇小程序（bbq-shop）

---

## 目录

1. [前置条件](#1-前置条件)
2. [微信商户账号配置](#2-微信商户账号配置)
3. [服务器环境变量配置](#3-服务器环境变量配置)
4. [数据库迁移](#4-数据库迁移)
5. [小程序域名白名单](#5-小程序域名白名单)
6. [上线前冒烟测试（Mock 模式）](#6-上线前冒烟测试mock-模式)
7. [切换真实支付](#7-切换真实支付)
8. [监控与回滚预案](#8-监控与回滚预案)
9. [核对清单](#9-核对清单)

---

## 1. 前置条件

| 项目 | 要求 |
|------|------|
| 服务器 | HTTPS（有效 SSL 证书）+ ICP 备案域名 |
| Node.js | >= 16.x |
| MySQL | >= 5.7 |
| 微信小程序 | 已完成企业主体认证 |
| 微信支付商户 | 企业/个体工商户资质（个人不支持） |

> **重要**：支付回调（`/api/v1/pay/notify`）必须通过 HTTPS 公网可访问，否则订单将永远停在"待支付"状态。

---

## 2. 微信商户账号配置

### 2.1 申请商户号

1. 前往 [微信支付商户平台](https://pay.weixin.qq.com) 注册
2. 完成企业资质认证，获取 **商户号（mch_id）**

### 2.2 获取 API 密钥

1. 商户平台 → **账户中心 → API 安全 → 设置 API 密钥**
2. 生成 32 位随机字符串作为密钥（建议使用平台提供的随机生成功能）
3. 记录密钥，写入服务器环境变量 `WX_MCH_KEY`

### 2.3 下载退款 SSL 证书（退款功能必须）

1. 商户平台 → **账户中心 → API 安全 → 申请 API 证书**
2. 下载 `apiclient_cert.p12`，上传到服务器**非 Web 根目录**的安全路径（如 `/secure/wechat/`）
3. 设置文件权限为 `600`，仅 Node 进程用户可读

```bash
chmod 600 /secure/wechat/apiclient_cert.p12
```

### 2.4 绑定小程序与商户号

- 微信公众平台 → **微信支付 → 关联商户号**
- 输入商户号完成绑定，需商户平台管理员确认

---

## 3. 服务器环境变量配置

编辑生产服务器 `server/.env`（或通过系统环境变量注入）：

```bash
# 运行环境
NODE_ENV=production
PORT=3000

# 数据库
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=bbq_shop
DB_USER=bbq_user
DB_PASS=your_db_password

# 微信小程序
WX_APP_ID=wx你的真实AppID
WX_APP_SECRET=你的AppSecret

# 微信支付（核心配置）
WX_MCH_ID=你的商户号
WX_MCH_KEY=32位API密钥
WX_NOTIFY_URL=https://你的域名/api/v1/pay/notify

# 退款证书路径（如启用退款）
WX_CERT_PATH=/secure/wechat/apiclient_cert.p12

# 支付模式（由管理端数据库控制，此处为兜底默认值）
# 初次部署建议设 true，验证通过后通过管理端切换
WECHAT_PAY_MOCK=true

# JWT
JWT_SECRET=生产环境随机密钥
```

> **优先级说明**：运行时支付模式由数据库 `settings.pay_mock_mode` 控制，优先级高于此 ENV 变量，可在管理端实时切换，无需重启服务。

---

## 4. 数据库迁移

### 4.1 新增 transaction_id 字段

```sql
-- 在 orders 表添加微信交易号字段
ALTER TABLE orders
ADD COLUMN transaction_id VARCHAR(64) NOT NULL DEFAULT ''
COMMENT '微信支付交易号'
AFTER pay_time;
```

### 4.2 确保 settings 表存在

```sql
CREATE TABLE IF NOT EXISTS settings (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  `key`     VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
  value     TEXT                          COMMENT '配置值',
  description TEXT                        COMMENT '说明',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4.3 初始化支付模式配置

```sql
-- 默认为模拟支付模式，上线验证后通过管理端切换
INSERT INTO settings (`key`, value, description)
VALUES ('pay_mock_mode', 'true', '支付模式：true=模拟，false=真实')
ON DUPLICATE KEY UPDATE updated_at = NOW();
```

---

## 5. 小程序域名白名单

在 **微信公众平台 → 开发 → 开发管理 → 开发设置 → 服务器域名** 中添加：

| 类型 | 域名 |
|------|------|
| request 合法域名 | `https://你的域名` |

> 微信支付回调由微信服务器主动 POST 到你的 `WX_NOTIFY_URL`，不受小程序域名白名单限制，但必须是 HTTPS。

---

## 6. 上线前冒烟测试（Mock 模式）

在切换真实支付前，在生产环境用 **Mock 模式**完成端到端验证：

### 确认 Mock 模式已启用

- 管理端 → **系统设置 → 支付设置** → 确认开关显示"模拟支付"（橙色提示）

### 测试流程

```
1. 用真实手机打开小程序
2. 正常选餐 → 下单 → 进入支付页面
3. 点击"立即支付"→ 跳过微信收银台，直接模拟支付成功
4. 确认订单状态变为"已支付"
5. 管理端 → 订单管理 → 找到该订单 → 发起退款
6. 确认订单状态变为"已退款"
```

所有步骤通过后，进入下一步。

---

## 7. 切换真实支付

### 7.1 通过管理端切换（推荐）

1. 管理端 → **系统设置 → 支付设置**
2. 将"模拟支付"开关切换为关闭状态（绿色提示"真实支付"）
3. 切换**立即生效**，无需重启服务

### 7.2 真实支付验证

使用真实微信账号完整走一遍流程：

```
1. 下单 → 支付（建议金额 ¥0.01）
2. 确认微信收到扣款通知
3. 查看订单：status=paid，transaction_id 已写入真实交易号
4. 发起退款，确认资金退回原支付方式
```

### 7.3 验证 Notify 回调

```bash
# 查看服务器日志，确认收到微信回调
tail -f /var/log/bbq-shop/app.log | grep "pay/notify"
```

应看到类似：
```
POST /api/v1/pay/notify 200 - 微信回调处理成功
```

---

## 8. 监控与回滚预案

### 监控要点

| 监控项 | 预警阈值 |
|--------|---------|
| `/pay/notify` 接口成功率 | < 99% 告警 |
| 订单支付成功率 | 异常下降告警 |
| `orders.status` 卡在 `pending` 超过 15 分钟 | 告警 |

### 回滚方案

出现问题时，**无需回滚代码**，直接在管理端切换：

1. 管理端 → **系统设置 → 支付设置 → 切换回"模拟支付"**
2. 秒级生效，用户端自动降级为 Mock 流程
3. 问题排查修复后，再切回真实支付

---

## 9. 核对清单

上线前逐条确认：

```
微信商户配置
[ ] 商户号（mch_id）已申请并获取
[ ] API 密钥（32位）已设置并记录
[ ] 小程序 AppID 与商户号已完成绑定
[ ] SSL 退款证书已下载并部署（如需退款）

服务器配置
[ ] WX_APP_ID 填入真实 AppID
[ ] WX_MCH_ID 填入商户号
[ ] WX_MCH_KEY 填入 API 密钥
[ ] WX_NOTIFY_URL 指向 HTTPS 生产域名
[ ] 服务器域名已加入小程序 request 白名单

数据库
[ ] orders 表已添加 transaction_id 列
[ ] settings 表已存在
[ ] pay_mock_mode 初始值已插入

上线验证
[ ] Mock 模式下完成端到端冒烟测试（下单→支付→退款）
[ ] 切换真实支付后完成真实小额支付验证
[ ] 确认 /pay/notify 回调正常接收并处理
[ ] 确认退款流程正常（资金成功退回）
[ ] 监控告警已配置
```

---

*文档维护：如有变更请同步更新本文件。*
