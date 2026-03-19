# 🚀 BBQ Shop 快速部署指南

## 一、环境准备

### 1. 系统要求
- Node.js >= 16.x
- MySQL >= 8.0
- 微信小程序账号（可选，用于真实支付）

### 2. 检查环境
```bash
node -v
mysql --version
```

---

## 二、快速启动（开发环境）

### 1. 安装依赖
```bash
cd backend
npm install

cd ../web-admin
npm install
```

### 2. 初始化数据库
```bash
cd backend
mysql -u root -p < database/schema.sql
```

### 3. 配置环境变量
```bash
# 复制配置模板
cp .env.example .env.local

# 编辑配置（至少修改数据库密码）
vim .env.local
```

**最小配置**：
```env
DB_PASSWORD=your_password
JWT_SECRET=dev_secret_123456
PAYMENT_MODE=MOCK
```

### 4. 启动服务
```bash
# 后端（端口 3000）
npm run dev

# Web 管理端（新终端，端口 3001）
cd ../web-admin
npm run dev
```

### 5. 访问系统
- **Web 管理端**: http://localhost:3001
- **后端 API**: http://localhost:3000
- **健康检查**: http://localhost:3000/health

**默认管理员账号**: `admin` / `admin123`

---

## 三、支付模式切换

### 查看当前模式
```bash
cd backend
npm run payment:mode
```

### 切换到模拟支付（开发）
```bash
npm run payment:mode MOCK
```
✅ 支付直接成功，无需微信商户号

### 切换到真实支付（生产）
```bash
npm run payment:mode REAL
```
⚠️ 需要完整配置微信支付证书

---

## 四、生产环境部署

### 1. 安全配置清单

```bash
# 1. 生成强 JWT 密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. 配置 .env.local
PAYMENT_MODE=REAL
JWT_SECRET=上一步生成的密钥
CORS_ORIGIN=https://yourdomain.com

# 3. 配置微信支付证书
mkdir -p certs
cp /path/to/apiclient_key.pem certs/
```

### 2. 部署检查清单

- [ ] JWT_SECRET 已更换为强密钥
- [ ] 数据库密码已修改
- [ ] CORS 已限制为具体域名
- [ ] 支付模式已切换为 REAL
- [ ] 微信支付证书已配置
- [ ] HTTPS 已配置（支付回调必须）
- [ ] 日志轮转已配置
- [ ] 数据库备份已配置
- [ ] 监控告警已配置

### 3. 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 创建 ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'bbq-backend',
    script: 'src/index.js',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
}
EOF

# 启动服务
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

---

## 五、常用命令

### 后端
```bash
# 开发
npm run dev              # 启动开发服务器
npm run payment:mode     # 查看支付模式

# 测试
npm test                 # 运行所有测试
npm test -- --coverage   # 查看覆盖率

# 数据库
npm run db:init          # 初始化数据库
npm run db:seed          # 导入测试数据

# 生产
npm start                # 启动生产服务器
```

### 前端
```bash
npm run dev              # 开发模式
npm run build            # 构建生产版本
npm run preview          # 预览构建结果
```

---

## 六、故障排查

### 1. 无法启动
```bash
# 检查端口占用
lsof -i :3000
kill -9 <PID>

# 检查日志
tail -f logs/app.log
```

### 2. 数据库连接失败
```bash
# 测试连接
mysql -h localhost -u root -p

# 检查 MySQL 状态
systemctl status mysqld
```

### 3. 支付失败
```bash
# 查看支付模式
npm run payment:mode

# 检查证书
ls -la certs/

# 查看支付日志
grep -E "(支付 | 回调)" logs/app.log
```

### 4. 测试支付流程
```bash
# 1. 切换到 MOCK 模式
npm run payment:mode MOCK

# 2. 重启服务
pm2 restart bbq-backend

# 3. 创建测试订单并支付

# 4. 检查订单状态
# 5. 切换到 REAL 模式（生产环境）
npm run payment:mode REAL
```

---

## 七、文件结构

```
bbq-shop/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── models/         # 数据模型
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由
│   │   ├── services/       # 服务层
│   │   └── utils/          # 工具函数
│   ├── database/           # 数据库脚本
│   ├── certs/              # 微信支付证书
│   ├── logs/               # 日志文件
│   ├── uploads/            # 上传文件
│   └── __tests__/          # 测试文件
├── web-admin/              # Web 管理端
│   ├── src/
│   │   ├── views/         # 页面组件
│   │   ├── components/    # 公共组件
│   │   ├── api/           # API 封装
│   │   └── stores/        # 状态管理
│   └── __tests__/         # 测试文件
├── miniprogram/            # 微信小程序
│   ├── pages/             # 页面
│   └── utils/             # 工具
└── docs/                   # 文档
```

---

## 八、相关文档

- [安全与测试报告](./SECURITY_AND_TESTS.md)
- [支付模式配置](./backend/docs/PAYMENT_MODE.md)
- [测试文档](./backend/TESTS.md)
- [README](./README.md)

---

## 九、获取帮助

```bash
# 查看支付模式帮助
npm run payment:mode -- --help

# 查看测试帮助
npm test -- --help
```

---

*最后更新：2026-03-09*
