# 烤乐汇 — 烧烤食材售卖平台

全栈烧烤食材电商系统，包含微信小程序（用户端）、Vue3 管理后台（商家端）和 Node.js 后端 API。

---

## 项目架构

```
bbq-shop/
├── server/          # Node.js + Express 后端 API
├── admin/           # Vue3 + Element Plus 管理后台
├── miniprogram/     # 微信小程序（用户端）
└── docs/            # 部署指南 & 操作手册
```

| 层级 | 技术栈 |
|---|---|
| 用户端 | 微信小程序（原生开发） |
| 管理后台 | Vue 3 · Pinia · Vue Router · Element Plus · ECharts |
| 后端 API | Node.js · Express · Sequelize · MySQL |
| 认证 | JWT（双 Token，httpOnly Cookie） |
| 支付 | 微信支付（含模拟模式） |
| 测试 | Jest + Supertest（后端）· Vitest + Vue Test Utils（前端） |

---

## 功能模块

### 用户端（微信小程序）
- 商品浏览、分类筛选、关键词搜索
- 购物车管理
- 下单 & 微信支付
- 订单跟踪
- 优惠券领取 & 核销
- 收货地址管理
- 个人中心

### 管理后台
- 数据看板（销售额、订单量、商品排行、趋势图）
- 商品管理（上架/下架、规格、图片上传）
- 分类管理（两级分类）
- 订单管理（发货、退款）
- 优惠券管理
- 轮播图管理
- 用户管理
- 管理员账号管理（角色权限）
- 系统设置（店铺信息、运费规则）
- 支付模式切换（模拟 / 真实）

---

## 快速开始

### 环境要求

- Node.js ≥ 18
- MySQL ≥ 8.0
- 微信开发者工具（小程序运行）

### 1. 克隆仓库

```bash
git clone <repo-url>
cd bbq-shop
```

### 2. 后端服务

```bash
cd server

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填写数据库连接、JWT 密钥等（详见下方配置说明）

# 开发模式启动（自动同步数据库结构并写入初始数据）
npm run dev
```

服务默认监听 `http://localhost:3000`。

### 3. 管理后台

```bash
cd admin
npm install
npm run dev
```

管理后台默认运行在 `http://localhost:8080`，通过 Vite 代理转发 `/api` 请求至后端。

### 4. 微信小程序

使用微信开发者工具打开 `miniprogram/` 目录，在 `app.js` 中将 `baseUrl` 配置为后端地址。

---

## 环境变量

在 `server/` 目录下复制 `.env.example` 为 `.env` 并按需修改：

```dotenv
PORT=3000
NODE_ENV=development

# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bbq_shop
DB_USER=root
DB_PASSWORD=your_password

# JWT（用户端）
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# JWT（管理端 Access Token，2h 短期）
JWT_ADMIN_SECRET=your_admin_jwt_secret_key
JWT_ADMIN_EXPIRES_IN=2h

# JWT（管理端 Refresh Token，7d 长期）
JWT_ADMIN_REFRESH_SECRET=your_admin_refresh_secret_key
JWT_ADMIN_REFRESH_EXPIRES_IN=7d

# 管理后台前端地址（CORS 白名单）
ADMIN_ORIGIN=http://localhost:8080

# 微信小程序
WX_APP_ID=your_wx_app_id
WX_APP_SECRET=your_wx_app_secret

# 微信支付
WX_MCH_ID=your_mch_id
WX_MCH_KEY=your_mch_key
WX_NOTIFY_URL=https://yourdomain.com/api/v1/pay/notify

# 支付模式（true=模拟，false=真实微信支付）
WECHAT_PAY_MOCK=true

# 文件上传
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

---

## 数据库

### 初始化

开发模式启动（`npm run dev`）时会自动同步表结构并写入初始数据，无需手动操作。

如需手动控制：

```bash
npm run db:migrate   # 执行迁移
npm run db:seed      # 写入种子数据
npm run db:reset     # 重置（回滚 → 迁移 → 种子）
```

### 默认账号

| 角色 | 用户名 | 密码 |
|---|---|---|
| 超级管理员 | `admin` | `admin123` |

### 数据模型

`User` · `Category` · `Product` · `ProductSpec` · `Address` · `Order` · `OrderItem` · `CartItem` · `Coupon` · `UserCoupon` · `Banner` · `Admin` · `Setting`

---

## API 路由概览

### 用户端 `/api/v1`

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/auth/login` | 微信授权登录 |
| GET | `/home` | 首页数据 |
| GET | `/products` | 商品列表 |
| GET/POST/DELETE | `/cart` | 购物车 |
| POST | `/orders` | 创建订单 |
| POST | `/pay` | 发起支付 |
| GET | `/coupons` | 可用优惠券 |
| CRUD | `/address` | 收货地址 |

### 管理端 `/api/admin`

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/auth/login` | 管理员登录 |
| POST | `/auth/refresh` | 刷新 Access Token |
| POST | `/auth/logout` | 退出登录 |
| GET | `/dashboard/overview` | 数据概览 |
| CRUD | `/products` | 商品管理 |
| CRUD | `/categories` | 分类管理 |
| CRUD | `/orders` | 订单管理 |
| CRUD | `/coupons` | 优惠券管理 |
| CRUD | `/banners` | 轮播图管理 |
| CRUD | `/admins` | 管理员账号 |
| GET/PUT | `/settings` | 系统设置 |
| GET/PUT | `/pay/mock-mode` | 支付模式 |

---

## 认证机制

管理端采用双 Token + httpOnly Cookie 方案：

- **Access Token**：有效期 2 小时，存于 `admin_access_token` httpOnly Cookie
- **Refresh Token**：有效期 7 天，存于 `admin_refresh_token` httpOnly Cookie（路径限制在 `/api/admin/auth/refresh`）
- 前端 axios 响应拦截器在收到 401 时自动调用 `/auth/refresh` 续期，并重试原请求；并发 401 请求会排队，避免重复刷新

Token 不落地 localStorage，规避 XSS 窃取凭证风险。

---

## 测试

### 后端（Jest）

```bash
cd server

npm test                  # 全量测试 + 覆盖率报告
npm run test:unit         # 仅单元测试
npm run test:integration  # 仅集成测试
```

覆盖的模块：`auth` 中间件 · 管理端认证路由 · 支付路由 · 微信支付服务。

### 前端（Vitest）

```bash
cd admin

npm test                  # 运行测试
npm run test:coverage     # 生成覆盖率报告
```

覆盖的模块：`user` Pinia Store（login / getInfo / logout）。

---

## 目录结构

```
server/
├── src/
│   ├── config/          # 应用配置
│   ├── middleware/       # 认证、上传等中间件
│   ├── models/          # Sequelize 数据模型
│   ├── routes/
│   │   ├── admin/       # 管理端路由
│   │   └── api/         # 用户端路由
│   ├── services/        # 业务服务（微信支付等）
│   └── utils/           # 工具函数
├── database/
│   ├── migrations/      # 数据库迁移
│   └── seeds/           # 初始数据
└── tests/
    ├── unit/            # 单元测试
    ├── integration/     # 集成测试
    └── helpers/         # 测试工具

admin/
├── src/
│   ├── api/             # axios 请求封装
│   ├── router/          # Vue Router 路由配置
│   ├── stores/          # Pinia 状态管理
│   └── views/           # 页面组件
└── vitest.config.js
```

---

## 部署

参见 [`docs/deployment-guide.md`](docs/deployment-guide.md)。

生产环境关键配置：

- 将 `NODE_ENV` 设为 `production`
- 将 `WECHAT_PAY_MOCK` 设为 `false` 以启用真实支付
- 将 `ADMIN_ORIGIN` 设为管理后台实际域名
- 配置 HTTPS（Cookie `Secure` 属性在生产环境自动启用）

---

## 许可证

MIT
