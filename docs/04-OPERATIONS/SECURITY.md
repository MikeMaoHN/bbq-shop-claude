# 安全说明

## 认证安全

### JWT Token 管理

```javascript
// Token 配置
const jwtConfig = {
  secret: process.env.JWT_SECRET,  // 生产环境必须使用强随机密钥
  expiresIn: '7d'                   // 7 天有效期
}

// Token 刷新机制
// 当 Token 剩余有效期 < 1 小时，响应头携带 X-New-Token
```

### 密码安全

```javascript
// ✅ 使用 bcrypt 加密
const bcrypt = require('bcryptjs')
const hash = await bcrypt.hash(password, 10)
const valid = await bcrypt.compare(password, hash)

// ❌ 禁止明文存储
```

---

## 接口安全

### 输入验证

```javascript
// ✅ 使用 validation 中间件
const validation = require('./middleware/validation')

app.post('/api/order/create', 
  validation.createOrder,
  orderController.create
)

// 验证规则
- 价格必须为正整数
- 数量限制 1-99
- 手机号格式验证
- 地址字段完整性验证
```

### SQL 注入防护

```javascript
// ✅ 使用参数化查询
const order = await Order.findOne({
  where: { id: orderId, user_id: userId }
})

// ❌ 避免拼接 SQL
const sql = `SELECT * FROM orders WHERE id = ${orderId}`
```

### XSS 防护

```javascript
// ✅ 输出转义
const escapeHtml = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 小程序自动转义，无需额外处理
```

---

## 速率限制

### 登录限流

```javascript
// 15 分钟内最多 5 次登录尝试
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: '登录尝试次数过多，请稍后再试'
})

app.post('/api/auth/wx-login', loginLimiter, authController.wxLogin)
```

### API 限流

```javascript
// 1 分钟内最多 100 次请求
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: '请求过于频繁，请稍后再试'
})

app.use('/api', apiLimiter)
```

### 敏感操作限流

```javascript
// 支付操作：1 分钟最多 10 次
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10
})

app.post('/api/order/:id/pay', paymentLimiter)
```

---

## 数据脱敏

### 日志脱敏

```javascript
// ✅ 敏感字段脱敏
const safeLog = {
  ...data,
  password: '***',
  token: '***'
}

logger.info('user login', safeLog)
```

### 响应脱敏

```javascript
// ✅ 用户信息脱敏
const safeUser = {
  id: user.id,
  nickname: user.nickname,
  avatar: user.avatar,
  phone: user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}
```

---

## CORS 配置

### 生产环境配置

```javascript
// ✅ 指定允许的域名
const corsOptions = {
  origin: process.env.CORS_ORIGIN.split(','),
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))

// ❌ 避免生产环境使用 *
// origin: '*'
```

---

## 文件上传安全

### 文件类型验证

```javascript
// ✅ 限制文件类型
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
if (!allowedTypes.includes(file.mimetype)) {
  throw new Error('不支持的文件类型')
}
```

### 文件大小限制

```javascript
// ✅ 限制文件大小（2MB）
app.use(fileUpload({
  limits: { fileSize: 2 * 1024 * 1024 }
}))
```

### 文件名安全

```javascript
// ✅ 使用随机文件名
const safeFilename = `${Date.now()}-${uuid()}-${file.name}`
```

---

## 数据库安全

### 连接安全

```env
# .env 配置
DB_HOST=localhost
DB_USER=app_user
DB_PASSWORD=strong_password_here
DB_NAME=bbq_shop
```

### 权限最小化

```sql
-- 创建只读用户
CREATE USER 'bbq_read'@'localhost' IDENTIFIED BY 'password';
GRANT SELECT ON bbq_shop.* TO 'bbq_read'@'localhost';

-- 创建应用用户
CREATE USER 'bbq_app'@'localhost' IDENTIFIED BY 'password';
GRANT SELECT, INSERT, UPDATE, DELETE ON bbq_shop.* TO 'bbq_app'@'localhost';
```

---

## 操作审计

### 日志记录

```javascript
// 记录关键操作
operationLog.create({
  user_id: userId,
  action: 'CREATE_ORDER',
  module: 'order',
  ip: req.ip,
  request_data: safeData
})
```

### 审计日志

| 操作类型 | 记录内容 |
|----------|----------|
| 用户登录 | 时间、IP、设备 |
| 订单创建 | 订单号、金额 |
| 支付操作 | 订单号、支付结果 |
| 管理员操作 | 操作类型、影响范围 |

---

## 安全扫描

### 依赖扫描

```bash
# 检查依赖漏洞
npm audit

# 自动修复
npm audit fix
```

### 代码扫描

```bash
# ESLint 安全检查
npm run lint

# SonarQube 扫描
```

---

## 应急响应

### 安全事件处理流程

```
1. 发现安全事件
   ↓
2. 立即隔离受影响系统
   ↓
3. 收集证据和日志
   ↓
4. 评估影响范围
   ↓
5. 修复漏洞
   ↓
6. 恢复服务
   ↓
7. 事后分析和总结
```

### 联系方式

| 角色 | 联系方式 |
|------|----------|
| 安全负责人 | Mike |
| 技术负责人 | Leia |

---

## 安全清单

### 上线前检查

- [ ] JWT_SECRET 已修改为强随机密钥
- [ ] 数据库密码已修改
- [ ] CORS 已配置白名单
- [ ] 所有 API 有认证保护
- [ ] 敏感操作有权限验证
- [ ] 输入验证完整
- [ ] 日志脱敏处理
- [ ] HTTPS 证书有效

### 定期审查

- [ ] 每月审查操作日志
- [ ] 每季度审查权限配置
- [ ] 每半年进行安全扫描
- [ ] 每年进行渗透测试

---

*最后更新：2024-01-15*
