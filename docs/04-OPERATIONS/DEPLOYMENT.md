# 部署指南

## 环境要求

### 后端环境

| 项目 | 要求 |
|------|------|
| Node.js | ≥ 16.0.0 |
| MySQL | ≥ 8.0 (生产) / SQLite (开发) |
| 内存 | ≥ 512MB |
| 磁盘 | ≥ 1GB |

### 小程序环境

| 项目 | 要求 |
|------|------|
| 微信开发者工具 | ≥ 1.6.0 |
| 基础库 | ≥ 2.19.4 |
| AppID | 已注册小程序账号 |

### 管理端环境

| 项目 | 要求 |
|------|------|
| Node.js | ≥ 16.0.0 |
| 浏览器 | Chrome ≥ 90 |

---

## 后端部署

### 1. 克隆代码

```bash
cd D:/bbq-shop/backend
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env` 文件：

```env
# 服务配置
NODE_ENV=production
PORT=3000

# 数据库配置（生产环境）
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bbq_shop
DB_USER=root
DB_PASSWORD=your_password

# JWT 配置（生产环境必须修改）
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# CORS 配置（生产环境指定域名）
CORS_ORIGIN=https://yourdomain.com

# 支付配置
PAYMENT_MODE=MOCK
WECHAT_PAY_MCHID=你的商户号
WECHAT_PAY_KEY=你的 API 密钥
WECHAT_PAY_APPID=你的小程序 AppID
WECHAT_PAY_SERIAL=证书序列号
```

### 4. 数据库初始化

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE bbq_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# 执行迁移
npm run db:migrate

# 插入初始数据
npm run db:seed
```

### 5. 启动服务

```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

### 6. 验证服务

```bash
curl http://localhost:3000/api/health
```

预期响应：
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

## 小程序部署

### 1. 配置服务器域名

登录 [微信公众平台](https://mp.weixin.qq.com/) → 开发 → 开发管理 → 开发设置 → 服务器域名：

- request 合法域名：`https://yourdomain.com`
- uploadFile 合法域名：`https://yourdomain.com`
- downloadFile 合法域名：`https://yourdomain.com`

### 2. 修改配置

编辑 `miniprogram/config.js`：

```javascript
// 生产环境使用 HTTPS
const HOST = 'https://yourdomain.com'
```

### 3. 修改项目配置

编辑 `miniprogram/project.config.json`：

```json
{
  "appid": "你的小程序 AppID",
  "setting": {
    "urlCheck": true
  }
}
```

### 4. 上传代码

使用微信开发者工具：
1. 导入项目 `D:/bbq-shop/miniprogram`
2. 编译测试
3. 点击"上传"
4. 填写版本号和备注

### 5. 提交审核

登录微信公众平台 → 版本管理 → 提交审核

---

## 管理端部署

### 1. 安装依赖

```bash
cd D:/bbq-shop/web-admin
npm install
```

### 2. 配置 API 地址

编辑 `.env.production`：

```env
VITE_API_BASE_URL=https://yourdomain.com/api
```

### 3. 构建

```bash
npm run build
```

### 4. 部署到 Nginx

配置 Nginx：

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;
    
    location / {
        root /path/to/web-admin/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## HTTPS 配置

### 使用 Let's Encrypt 免费证书

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo crontab -e
# 添加：0 3 * * * certbot renew --quiet
```

### 配置 Nginx

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location /api {
        proxy_pass http://localhost:3000;
    }
}
```

---

## PM2 进程管理

### 安装 PM2

```bash
npm install -g pm2
```

### 配置 PM2

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'bbq-backend',
    cwd: '/path/to/backend',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production'
    },
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '500M'
  }]
}
```

### 启动服务

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 监控与日志

### 日志查看

```bash
# 后端日志
tail -f backend/logs/app.log

# PM2 日志
pm2 logs bbq-backend
```

### 监控指标

- CPU 使用率
- 内存使用率
- 请求 QPS
- 错误率
- 响应时间

---

## 回滚流程

### 后端回滚

```bash
# 切换到上一个版本
git checkout v1.1.0

# 重新安装依赖
npm install

# 重启服务
pm2 restart bbq-backend
```

### 小程序回滚

登录微信公众平台 → 版本管理 → 版本回退

---

## 检查清单

### 上线前检查

- [ ] 后端服务正常运行
- [ ] 数据库连接正常
- [ ] HTTPS 证书有效
- [ ] 小程序服务器域名已配置
- [ ] 支付参数已配置
- [ ] 日志系统正常
- [ ] 监控告警已配置
- [ ] 备份策略已配置

### 上线后验证

- [ ] 小程序能正常访问
- [ ] 登录功能正常
- [ ] 支付流程正常
- [ ] 订单创建正常
- [ ] 管理端能正常访问

---

*最后更新：2024-01-15*
