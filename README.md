# 烧烤食材售卖微信小程序系统

> **版本 v1.3.0** · 73 测试全部通过 · 语句覆盖率 28%

## 项目概述

本项目是一个完整的烧烤食材售卖系统，包含三个主要部分：
- **微信小程序端**：客户浏览商品、下单购买
- **Web 管理端**：店家管理商品、订单、库存
- **后端服务**：提供 API 接口服务

## 技术栈

| 模块 | 技术选型 |
|------|----------|
| 小程序端 | 微信小程序原生开发 |
| Web 管理端 | Vue3 + Element Plus + Vite |
| 服务后台 | Node.js + Express + Sequelize |
| 数据库 | MySQL 8.0 / SQLite（开发/测试） |
| 测试框架 | Jest 29 + Supertest |

## 项目结构

```
bbq-shop/
├── docs/                    # 文档
│   └── PRD.md              # 产品需求文档
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由
│   │   ├── utils/          # 工具函数
│   │   └── index.js        # 入口文件
│   ├── database/
│   │   ├── schema.sql      # 数据库结构
│   │   └── seed.sql        # 测试数据
│   ├── uploads/            # 上传文件
│   └── package.json
├── miniprogram/            # 微信小程序
│   ├── pages/
│   │   ├── index/          # 首页
│   │   ├── shop/           # 商城页
│   │   ├── product/        # 商品/购物车页
│   │   ├── order/          # 订单页
│   │   └── profile/        # 个人中心
│   ├── utils/
│   │   ├── api.js          # API 封装
│   │   └── request.js      # 请求封装
│   ├── app.js
│   ├── app.json
│   └── app.wxss
└── web-admin/              # Web 管理端
    ├── src/
    │   ├── api/            # API 封装
    │   ├── router/         # 路由配置
    │   ├── stores/         # Pinia 状态管理
    │   ├── utils/          # 工具函数
    │   ├── views/          # 页面组件
    │   │   ├── products/   # 商品管理
    │   │   ├── orders/     # 订单管理
    │   │   ├── categories/ # 分类管理
    │   │   └── stock/      # 库存管理
    │   ├── App.vue
    │   └── main.js
    └── package.json
```

## 快速开始

### 1. 环境要求

- Node.js >= 16.x
- MySQL >= 8.0
- 微信开发者工具

### 2. 数据库配置

```bash
# 创建数据库并导入表结构
mysql -u root -p < backend/database/schema.sql

# 导入测试数据（可选）
mysql -u root -p bbq_shop < backend/database/seed.sql
```

### 3. 后端服务

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入数据库和微信配置

# 启动服务（开发模式，热重载）
npm run dev

# 运行测试（无需 MySQL，使用 Mock 数据库）
npm test
```

服务将运行在 http://localhost:3000

> **测试说明**：测试使用 `jest.mock` 模拟数据库连接，不依赖真实 MySQL。
> HTTPS 服务仅在 `certs/server.crt` 存在时启动，开发/测试环境无需配置证书。

### 4. 小程序端

1. 打开微信开发者工具
2. 导入 `miniprogram` 目录
3. 在 `project.config.json` 中填入你的小程序 AppID
4. 在 `config.js` 中修改 API 地址
5. 编译运行

### 5. Web 管理端

```bash
cd web-admin

# 安装依赖
npm install

# 启动开发服务
npm run dev
```

服务将运行在 http://localhost:3001

默认管理员账号：`admin` / `admin123`

## 功能模块

### 小程序端（客户端）

- [x] 微信登录
- [x] 首页展示（轮播图、分类导航、热销推荐）
- [x] 商品浏览（分类筛选、搜索）
- [x] 商品详情
- [x] 购物车管理
- [x] 订单创建与支付
- [x] 订单列表与详情
- [x] 收货地址管理
- [x] 个人中心

### Web 管理端（店家端）

- [x] 管理员登录
- [x] 数据概览（订单统计、销量排行、库存预警）
- [x] 商品管理（增删改查、上下架）
- [x] 分类管理
- [x] 订单管理（查看、发货）
- [x] 库存管理（调整、预警）
- [x] 图片上传

### 后端 API

- [x] 用户认证（微信登录、JWT）
- [x] 商品接口
- [x] 分类接口
- [x] 购物车接口
- [x] 订单接口
- [x] 地址接口
- [x] 库存管理
- [x] 文件上传

## API 接口文档

### 小程序端接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/wx-login | 微信登录 |
| GET | /api/categories | 分类列表 |
| GET | /api/products | 商品列表 |
| GET | /api/cart | 购物车列表 |
| POST | /api/orders | 创建订单 |

### 管理端接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /admin/api/login | 管理员登录 |
| GET | /admin/api/products | 商品列表 |
| PUT | /admin/api/orders/:id/ship | 订单发货 |

## 配置说明

### 微信小程序配置

在 `backend/.env` 中配置：

```env
WX_APPID=你的小程序 AppID
WX_SECRET=你的小程序 Secret
```

### 微信支付配置（可选）

```env
WX_MCHID=你的商户号
WX_APIKEY=你的 API 密钥
WX_NOTIFY_URL=支付回调地址
```

## 测试状态

| 测试套件 | 测试数 | 状态 |
|----------|--------|------|
| `unit/auth.test.js` | 18 | ✅ 通过 |
| `unit/middleware.test.js` | 16 | ✅ 通过 |
| `unit/models.test.js` | 36 | ✅ 通过 |
| `integration/order-flow.test.js` | 3 | ✅ 通过 |
| `integration/product.test.js` | — | ✅ 通过 |
| **合计** | **73** | **全部通过** |

覆盖率（v1.3.0）：语句 28% · 函数 29.7% · 模型层 42.8%

```bash
# 运行所有测试并生成覆盖率报告
npm test

# 只跑单元测试
npm run test:unit

# 只跑集成测试
npm run test:integration
```

## 开发注意事项

1. **数据库连接**：确保 MySQL 服务正常运行，并正确配置 `.env` 文件
2. **跨域问题**：开发环境下已配置代理，生产环境需配置 CORS
3. **文件上传**：确保 `uploads` 目录有写入权限
4. **小程序域名**：正式发布需在微信公众平台配置合法域名
5. **HTTPS 证书**：将 `server.crt` / `server.key` 放到项目根目录 `certs/` 下即可自动启用 HTTPS
6. **支付模式**：默认为 MOCK 模式，使用 `npm run payment:mode` 切换为真实支付

## 断点续做说明

本项目采用模块化开发，各模块独立保存：

1. **PRD 文档**：`docs/PRD.md` - 产品需求和设计
2. **数据库脚本**：`backend/database/` - 完整的表结构和测试数据
3. **后端代码**：`backend/src/` - 完整的 API 服务
4. **小程序代码**：`miniprogram/` - 完整的小程序页面
5. **管理端代码**：`web-admin/` - 完整的后台管理系统

每一步开发都有对应的文件保存，可以基于现有代码继续开发。

## 后续扩展建议

1. 接入真实的微信支付
2. 添加用户评价功能
3. 实现优惠券/满减活动
4. 增加数据统计图表（ECharts）
5. 添加消息通知（模板消息）
6. 实现分销/推广功能
7. 添加移动端管理 APP

## 许可证

MIT License
