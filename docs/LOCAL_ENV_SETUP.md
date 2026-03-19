# 本地开发环境配置指南

**版本**: v1.0  
**更新日期**: 2026-03-17  
**适用**: 本地开发环境搭建

---

## 一、环境要求

- Node.js >= 18.x
- MySQL >= 8.0
- npm >= 9.x

---

## 二、配置步骤

### 2.1 克隆代码

```bash
cd /home/admin/bbq-shop
git pull origin main
```

### 2.2 安装依赖

```bash
cd backend
npm install
```

### 2.3 配置环境变量

```bash
# 复制环境配置模板
cp .env.example .env

# 编辑 .env 文件，配置以下内容
vim .env
```

### 2.4 关键配置项

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=BbqShop2026!
DB_NAME=bbq_shop

# 微信小程序配置
WX_APPID=wx94b4d7c059d93cea
WX_SECRET=1d0214841c5827fdce6f06127a331282
WX_GRANT_TYPE=authorization_code

# 支付模式（本地开发使用模拟支付）
PAYMENT_MODE=MOCK
```

### 2.5 初始化数据库

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE IF NOT EXISTS bbq_shop;
USE bbq_shop;

# 导入表结构
source backend/database/schema.sql;
source backend/database/seed.sql;
```

### 2.6 启动服务

```bash
# 方式 1: 直接启动
npm start

# 方式 2: 使用 PM2
pm2 start ecosystem.config.js
```

### 2.7 验证配置

```bash
# 运行配置验证脚本
node scripts/verify-wx-config.js

# 测试健康检查接口
curl http://localhost:3000/health

# 预期输出
# {"status":"ok","timestamp":"..."}
```

---

## 三、常见问题

### Q1: 数据库连接失败

**错误**: `Access denied for user 'root'@'localhost'`

**解决**:
1. 检查 `.env` 中的 `DB_PASSWORD` 是否正确
2. 确认 MySQL 服务已启动：`systemctl status mysqld`
3. 测试连接：`mysql -u root -p`

### Q2: 微信登录失败

**错误**: `invalid appid` 或 `invalid secret`

**解决**:
1. 检查 `.env` 中的 `WX_APPID` 和 `WX_SECRET`
2. 确认配置与微信开放平台一致
3. 重启服务：`pm2 restart bbq-backend`

### Q3: 端口被占用

**错误**: `EADDRINUSE: address already in use :::3000`

**解决**:
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或修改端口配置
vim .env  # 修改 PORT=3001
```

---

## 四、开发工具推荐

- **代码编辑器**: VS Code
- **数据库管理**: MySQL Workbench / DBeaver
- **API 测试**: Postman / Insomnia
- **日志查看**: PM2 logs (`pm2 logs bbq-backend`)

---

## 五、配置检查清单

部署完成后请检查：

- [ ] Node.js 版本 >= 18.x
- [ ] MySQL 服务已启动
- [ ] `.env` 文件已配置
- [ ] 数据库已初始化
- [ ] 依赖已安装
- [ ] 服务可正常启动
- [ ] 健康检查通过
- [ ] 微信配置验证通过

---

**最后更新**: 2026-03-17
