# 烧烤食材售卖微信小程序 PRD 文档

## 1. 项目概述

### 1.1 项目背景
为烧烤食材售卖店开发一套完整的线上销售系统，包含微信小程序客户端、Web 管理端和服务后台，实现商品展示、在线下单、库存管理、订单发货等核心功能。

### 1.2 项目目标
- 为客户提供便捷的线上选购体验
- 为店家提供高效的商品和订单管理工具
- 实现完整的电商交易闭环

### 1.3 用户角色
| 角色 | 描述 |
|------|------|
| 客户 | 微信小程序用户，浏览商品、下单购买 |
| 店家管理员 | Web 管理端用户，管理商品、库存、订单 |

---

## 2. 功能需求

### 2.1 小程序端（客户端）

#### 2.1.1 用户注册/登录
- 微信一键授权登录
- 自动获取用户昵称、头像
- 绑定手机号（可选）

#### 2.1.2 首页
- 轮播图展示活动/推荐
- 商品分类导航
- 热销商品推荐
- 搜索功能

#### 2.1.3 商品列表/详情页
- 按分类筛选商品
- 商品图片、名称、价格、库存展示
- 商品详情（描述、规格）
- 加入购物车/立即购买

#### 2.1.4 购物车
- 商品增删改查
- 数量调整
- 价格合计
- 批量结算

#### 2.1.5 订单模块
- 确认订单（选择地址、备注）
- 订单列表（全部、待付款、待发货、待收货、已完成）
- 订单详情
- 订单取消（待付款状态；待发货状态亦可取消，取消后自动恢复库存并向管理端发送站内信通知）

#### 2.1.6 个人中心
- 用户信息展示
- 收货地址管理
- 订单入口
- 联系客服

### 2.2 Web 管理端（店家端）

#### 2.2.1 登录认证
- 账号密码登录
- 权限管理

#### 2.2.2 商品管理
- 商品列表（增删改查）
- 商品分类管理
- 商品图片上传
- 上下架管理

#### 2.2.3 库存管理
- 库存查询
- 库存预警设置
- 库存调整记录

#### 2.2.4 订单管理
- 订单列表（按状态筛选）
- 订单详情查看
- 发货操作（填写物流信息）
- 订单备注

#### 2.2.5 站内信通知中心
- 通知列表（分页展示，未读优先高亮）
- 待发货订单被用户取消时自动推送站内信
- 单条已读 / 一键全部已读
- 顶部导航栏展示未读数角标，实时提醒管理员

#### 2.2.7 数据统计
- 销售统计（日/周/月）
- 商品销量排行
- 订单状态分布

### 2.3 服务后台（API）

#### 2.3.1 用户服务
- 微信登录验证
- 用户信息管理

#### 2.3.2 商品服务
- 商品 CRUD
- 分类管理
- 库存查询/扣减

#### 2.3.3 订单服务
- 订单创建
- 订单状态流转
- 支付回调处理

#### 2.3.4 地址服务
- 收货地址 CRUD

---

## 3. 技术架构

### 3.1 技术栈
| 模块 | 技术选型 |
|------|----------|
| 小程序端 | 微信小程序原生开发 |
| Web 管理端 | Vue3 + Element Plus |
| 服务后台 | Node.js + Express |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis（可选） |

### 3.2 系统架构图
```
┌─────────────────┐     ┌─────────────────┐
│   微信小程序     │     │   Web 管理端     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────▼──────┐
              │  API Gateway │
              └──────┬──────┘
                     │
         ┌───────────▼───────────┐
         │    Node.js Server     │
         │  (Express Framework)  │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │       MySQL DB        │
         └───────────────────────┘
```

---

## 4. 数据库设计

### 4.1 用户表 (users)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| openid | VARCHAR(64) | 微信 openid |
| nickname | VARCHAR(64) | 昵称 |
| avatar | VARCHAR(255) | 头像 URL |
| phone | VARCHAR(20) | 手机号 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 4.2 商品分类表 (categories)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| name | VARCHAR(64) | 分类名称 |
| sort | INT | 排序 |
| status | TINYINT | 状态 (1 启用/0 禁用) |

### 4.3 商品表 (products)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| category_id | INT | 分类 ID |
| name | VARCHAR(128) | 商品名称 |
| description | TEXT | 描述 |
| images | JSON | 图片 URLs |
| price | DECIMAL(10,2) | 价格 |
| stock | INT | 库存 |
| status | TINYINT | 状态 (1 上架/0 下架) |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 4.4 收货地址表 (addresses)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| user_id | BIGINT | 用户 ID |
| name | VARCHAR(64) | 收货人 |
| phone | VARCHAR(20) | 电话 |
| province | VARCHAR(64) | 省 |
| city | VARCHAR(64) | 市 |
| district | VARCHAR(64) | 区 |
| detail | VARCHAR(255) | 详细地址 |
| is_default | TINYINT | 是否默认 |

### 4.5 购物车表 (cart_items)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| user_id | BIGINT | 用户 ID |
| product_id | BIGINT | 商品 ID |
| quantity | INT | 数量 |
| checked | TINYINT | 是否选中 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 4.6 订单表 (orders)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| order_no | VARCHAR(32) | 订单号 |
| user_id | BIGINT | 用户 ID |
| total_amount | DECIMAL(10,2) | 订单总额 |
| status | TINYINT | 状态 (0 待付款/1 待发货/2 待收货/3 已完成/4 已取消) |
| remark | VARCHAR(255) | 用户备注 |
| receiver_name | VARCHAR(64) | 收货人 |
| receiver_phone | VARCHAR(20) | 收货电话 |
| receiver_address | VARCHAR(255) | 收货地址 |
| logistics_no | VARCHAR(64) | 物流单号 |
| logistics_company | VARCHAR(64) | 物流公司 |
| paid_at | DATETIME | 支付时间 |
| shipped_at | DATETIME | 发货时间 |
| completed_at | DATETIME | 完成时间 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 4.7 订单商品表 (order_items)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| order_id | BIGINT | 订单 ID |
| product_id | BIGINT | 商品 ID |
| product_name | VARCHAR(128) | 商品名称 |
| product_image | VARCHAR(255) | 商品图片 |
| price | DECIMAL(10,2) | 单价 |
| quantity | INT | 数量 |

### 4.8 库存流水表 (stock_logs)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| product_id | BIGINT | 商品 ID |
| change_qty | INT | 变动数量 (+/-) |
| before_stock | INT | 变动前库存 |
| after_stock | INT | 变动后库存 |
| reason | VARCHAR(64) | 原因 (下单/取消/手动调整) |
| reference_id | BIGINT | 关联 ID(订单 ID 等) |
| created_at | DATETIME | 创建时间 |

### 4.9 管理员表 (admins)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| username | VARCHAR(64) | 用户名 |
| password | VARCHAR(128) | 密码 (加密) |
| role | VARCHAR(32) | 角色 |
| status | TINYINT | 状态 |
| created_at | DATETIME | 创建时间 |

### 4.10 站内信通知表 (notifications)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| type | VARCHAR(32) | 通知类型（如 order_cancel） |
| title | VARCHAR(128) | 标题 |
| content | TEXT | 内容 |
| ref_type | VARCHAR(32) | 关联类型（如 order） |
| ref_id | BIGINT | 关联 ID（如订单 ID） |
| is_read | TINYINT | 是否已读（0 未读 / 1 已读） |
| created_at | DATETIME | 创建时间 |

---

## 5. API 接口设计

### 5.1 用户接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/wx-login | 微信登录 |
| GET | /api/user/info | 获取用户信息 |
| PUT | /api/user/info | 更新用户信息 |

### 5.2 地址接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/addresses | 地址列表 |
| POST | /api/addresses | 新增地址 |
| PUT | /api/addresses/:id | 更新地址 |
| DELETE | /api/addresses/:id | 删除地址 |

### 5.3 商品接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/products | 商品列表 |
| GET | /api/products/:id | 商品详情 |
| GET | /api/categories | 分类列表 |

### 5.4 购物车接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/cart | 购物车列表 |
| POST | /api/cart/items | 添加商品 |
| PUT | /api/cart/items/:id | 更新数量 |
| DELETE | /api/cart/items/:id | 删除商品 |

### 5.5 订单接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/orders | 创建订单 |
| GET | /api/orders | 订单列表 |
| GET | /api/orders/:id | 订单详情 |
| PUT | /api/orders/:id/cancel | 取消订单 |
| POST | /api/orders/:id/pay | 支付订单 |

### 5.6 管理端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /admin/api/login | 管理员登录 |
| GET | /admin/api/products | 商品列表 |
| POST | /admin/api/products | 新增商品 |
| PUT | /admin/api/products/:id | 更新商品 |
| DELETE | /admin/api/products/:id | 删除商品 |
| GET | /admin/api/orders | 订单列表 |
| PUT | /admin/api/orders/:id/ship | 发货 |
| GET | /admin/api/stats | 统计数据 |
| GET | /admin/api/notifications | 站内信列表 |
| GET | /admin/api/notifications/unread-count | 未读数量 |
| PUT | /admin/api/notifications/:id/read | 标记单条已读 |
| PUT | /admin/api/notifications/read-all | 全部已读 |

---

## 6. 订单状态流转

```
待付款 (0) ──支付──► 待发货 (1) ──发货──► 待收货 (2) ──确认收货──► 已完成 (3)
    │                    │
    └──取消订单──────────┘──► 已取消 (4)
                              （待发货取消：恢复库存 + 站内信通知管理员）
```

---

## 7. 实现状态（截至 2026-03-19）

### 7.1 功能实现进度

| 模块 | 功能 | 状态 |
|------|------|------|
| 小程序端 | 微信登录 | ✅ 已实现 |
| 小程序端 | 商品列表/详情 | ✅ 已实现 |
| 小程序端 | 购物车 | ✅ 已实现 |
| 小程序端 | 订单创建/查询/取消（含待发货取消） | ✅ 已实现 |
| 小程序端 | 微信支付 | ✅ 已实现（支持 MOCK/REAL 双模式） |
| 小程序端 | 收货地址管理 | ✅ 已实现 |
| 小程序端 | 个人中心 | ✅ 已实现 |
| Web 管理端 | 管理员登录 | ✅ 已实现 |
| Web 管理端 | 商品 CRUD + 图片上传 | ✅ 已实现 |
| Web 管理端 | 分类管理 | ✅ 已实现 |
| Web 管理端 | 订单管理（发货/备注） | ✅ 已实现 |
| Web 管理端 | 站内信通知中心（取消订单提醒） | ✅ 已实现 |
| Web 管理端 | 库存管理（调整/预警） | ✅ 已实现 |
| Web 管理端 | 数据概览仪表盘 | ✅ 已实现 |
| 后端 API | 用户认证（JWT + Token 刷新） | ✅ 已实现 |
| 后端 API | 商品/分类/购物车/订单/地址 | ✅ 已实现 |
| 后端 API | 库存流水记录 | ✅ 已实现 |
| 后端 API | 操作日志中间件 | ✅ 已实现 |
| 后端 API | 请求速率限制 | ✅ 已实现 |
| 后端 API | 输入验证中间件 | ✅ 已实现 |
| 后端 API | HTTPS 支持 | ✅ 已实现（证书存在时自动启用） |
| 优惠券系统 | 优惠券/活动价 | ❌ 未实现（v1.4.0 规划） |
| 评价系统 | 商品评价/星级 | ❌ 未实现（v2.0.0 规划） |

### 7.2 测试状态

| 层次 | 测试文件 | 测试数量 | 覆盖率 |
|------|---------|---------|--------|
| 单元测试 - 中间件 | middleware.test.js | 10 | validation: 100% / auth: 60% |
| 单元测试 - 订单模型 | order.test.js | 13 | Order model: 51% |
| 单元测试 - 核心模型 | models.test.js | 36 | 模型层均值: 42.8% |
| 集成测试 - API | api.test.js | 10 | 路由层: 89.7% |
| 集成测试 - 订单流程 | order-flow.test.js | 4 | 认证层: 100% |
| **合计** | **5 套件** | **73** | **语句覆盖: 28%** |

**测试覆盖率提升路径：**
- v1.4.0 目标：controller 层覆盖率 > 50%（补充 authController / productController 测试）
- v1.5.0 目标：整体语句覆盖率 > 50%（补充 wechatPayService / operationLog 测试）

---

## 8. 开发计划

### ✅ 已完成阶段
- **第一阶段**：数据库设计、后端框架搭建、基础配置
- **第二阶段**：用户认证、商品管理、订单模块、微信支付
- **第三阶段**：小程序页面、Web 管理端
- **第四阶段**：测试修复、代码注释完善、测试覆盖率提升（73 用例全通过）

### 🔜 规划阶段

#### v1.4.0（计划 2026-04）
- 优惠券系统
- 批量商品导入
- Controller 层单元测试覆盖率 > 50%

#### v2.0.0（计划 2026-06）
- 多店铺支持
- 商品评价系统
- 骑手配送对接
- 整体测试覆盖率 > 60%

---

## 9. 注意事项

1. 微信支付需在 `config/.env` 配置商户号，开发期可使用 MOCK 模式
2. 密码使用 bcrypt（salt rounds=10）存储，不允许明文出现在代码或日志
3. 所有接口通过 JWT + 角色校验（用户/管理员）控制权限
4. 图片上传到本地 `uploads/` 目录，生产环境建议配置 CDN
5. 重要操作（发货、库存调整、登录）通过 `OperationLog` 中间件记录审计日志
6. 速率限制：登录接口 5 次/15min，支付接口 3 次/min

---

*文档版本：v1.4*
*最后更新：2026-03-19*
