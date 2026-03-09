# 烧烤食材售卖小程序 - 产品需求文档（PRD）

## 一、项目概述

### 1.1 项目名称
**烤乐汇** - 烧烤食材在线售卖平台

### 1.2 项目背景
随着户外烧烤、家庭聚会等场景的流行，烧烤食材的需求日益增长。用户需要一个便捷的线上平台来选购新鲜的烧烤食材，并享受配送到家的服务。本项目旨在打造一个集食材浏览、在线下单、订单管理于一体的微信小程序平台。

### 1.3 目标用户
- **C 端用户**：有烧烤食材购买需求的个人/家庭用户
- **B 端管理员**：商家运营人员，负责商品管理、订单处理、数据统计

### 1.4 技术架构

```
┌─────────────────┐  ┌─────────────────┐
│  微信小程序（C端） │  │  管理后台（B端）   │
│  原生微信开发     │  │  Vue3+ElementPlus │
└────────┬────────┘  └────────┬────────┘
         │                     │
         └──────────┬──────────┘
                    │ HTTPS
         ┌──────────▼──────────┐
         │   后端服务 (API)     │
         │  Node.js + Express  │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │   MySQL + Redis     │
         │   数据存储 + 缓存    │
         └─────────────────────┘
```

---

## 二、功能模块设计

### 2.1 微信小程序（用户端）

#### 2.1.1 首页
| 功能 | 描述 |
|------|------|
| 轮播 Banner | 展示促销活动、新品推荐，支持跳转 |
| 分类导航 | 横向滑动分类入口（肉类、海鲜、蔬菜、套餐、工具等） |
| 热门推荐 | 根据销量/运营配置展示热门商品 |
| 搜索 | 关键词搜索商品，支持历史搜索记录 |

#### 2.1.2 商品分类
| 功能 | 描述 |
|------|------|
| 二级分类 | 左侧一级分类列表，右侧对应二级分类+商品列表 |
| 商品卡片 | 展示商品图片、名称、价格、规格、加入购物车按钮 |
| 排序筛选 | 按价格、销量排序 |

#### 2.1.3 商品详情
| 功能 | 描述 |
|------|------|
| 商品图片 | 轮播展示商品多图 |
| 基本信息 | 名称、价格、原价、销量、库存 |
| 规格选择 | 支持多规格（如重量：500g/1kg） |
| 数量选择 | 增减数量，不超过库存 |
| 商品描述 | 富文本描述（产地、保鲜方式等） |
| 加入购物车 | 添加至购物车 |
| 立即购买 | 直接进入结算页 |

#### 2.1.4 购物车
| 功能 | 描述 |
|------|------|
| 商品列表 | 展示已添加商品，支持修改数量/删除 |
| 全选/单选 | 勾选需要结算的商品 |
| 价格计算 | 实时计算选中商品总价 |
| 去结算 | 跳转至订单确认页 |
| 失效商品 | 已下架/缺货商品标记失效 |

#### 2.1.5 订单模块
| 功能 | 描述 |
|------|------|
| 订单确认 | 选择收货地址、查看商品清单、选择配送时间 |
| 支付方式 | 微信支付 |
| 订单列表 | 全部/待付款/待发货/待收货/已完成/已取消 |
| 订单详情 | 查看订单商品、物流状态、支付信息 |
| 取消订单 | 待付款订单可取消 |
| 确认收货 | 用户手动确认收货 |
| 申请退款 | 支持订单退款申请 |

#### 2.1.6 用户中心
| 功能 | 描述 |
|------|------|
| 微信登录 | 一键微信授权登录 |
| 个人信息 | 头像、昵称、手机号 |
| 收货地址 | 地址列表的增删改查，设置默认地址 |
| 我的订单 | 各状态订单快捷入口 |
| 优惠券 | 查看可用/已使用/已过期优惠券 |
| 联系客服 | 拨打客服电话/在线客服 |

---

### 2.2 管理后台（Web 端）

#### 2.2.1 仪表盘
| 功能 | 描述 |
|------|------|
| 数据概览 | 今日订单数、今日营收、待处理订单、商品总数 |
| 销售趋势 | 近7天/30天销售额折线图 |
| 热销排行 | 商品销量 TOP10 |
| 订单状态分布 | 各状态订单占比饼图 |

#### 2.2.2 商品管理
| 功能 | 描述 |
|------|------|
| 商品列表 | 分页展示所有商品，支持搜索/筛选 |
| 添加商品 | 名称、分类、价格、原价、库存、规格、图片、描述 |
| 编辑商品 | 修改商品信息 |
| 上下架 | 控制商品是否在小程序展示 |
| 删除商品 | 软删除商品 |
| 批量操作 | 批量上下架、批量删除 |

#### 2.2.3 分类管理
| 功能 | 描述 |
|------|------|
| 分类列表 | 树形结构展示一二级分类 |
| 添加/编辑分类 | 分类名称、图标、排序、父级分类 |
| 删除分类 | 无子分类且无关联商品时可删除 |

#### 2.2.4 订单管理
| 功能 | 描述 |
|------|------|
| 订单列表 | 分页展示，按状态/时间/订单号筛选 |
| 订单详情 | 商品信息、收货信息、支付信息、操作日志 |
| 发货操作 | 填写物流信息 |
| 退款处理 | 审核退款申请（同意/拒绝） |
| 导出订单 | 导出订单数据为 Excel |

#### 2.2.5 用户管理
| 功能 | 描述 |
|------|------|
| 用户列表 | 展示注册用户，搜索/筛选 |
| 用户详情 | 基本信息、订单记录、消费统计 |

#### 2.2.6 营销管理
| 功能 | 描述 |
|------|------|
| 轮播管理 | 首页 Banner 的增删改查、排序 |
| 优惠券管理 | 创建/编辑优惠券（满减、折扣），设置有效期、使用条件 |
| 优惠券发放 | 全员发放/指定用户发放 |

#### 2.2.7 系统设置
| 功能 | 描述 |
|------|------|
| 管理员账号 | 管理员列表、添加/禁用管理员 |
| 角色权限 | 角色管理，分配菜单/操作权限 |
| 配送设置 | 配送费规则、起送金额、配送范围 |
| 店铺信息 | 店铺名称、联系电话、营业时间 |

---

## 三、数据库设计

### 3.1 核心表结构

#### users（用户表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK, AUTO_INCREMENT | 用户ID |
| openid | VARCHAR(64), UNIQUE | 微信openid |
| nickname | VARCHAR(64) | 昵称 |
| avatar | VARCHAR(255) | 头像URL |
| phone | VARCHAR(20) | 手机号 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### categories（分类表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK | 分类ID |
| parent_id | INT, DEFAULT 0 | 父级分类ID，0为一级分类 |
| name | VARCHAR(50) | 分类名称 |
| icon | VARCHAR(255) | 分类图标 |
| sort_order | INT, DEFAULT 0 | 排序值 |
| status | TINYINT, DEFAULT 1 | 状态：1启用 0禁用 |
| created_at | DATETIME | 创建时间 |

#### products（商品表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK | 商品ID |
| category_id | INT, FK | 所属分类 |
| name | VARCHAR(100) | 商品名称 |
| description | TEXT | 商品描述 |
| price | DECIMAL(10,2) | 销售价 |
| original_price | DECIMAL(10,2) | 原价 |
| stock | INT | 库存数量 |
| sales | INT, DEFAULT 0 | 销量 |
| images | JSON | 商品图片数组 |
| status | TINYINT, DEFAULT 1 | 状态：1上架 0下架 |
| is_hot | TINYINT, DEFAULT 0 | 是否热门推荐 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### product_specs（商品规格表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK | 规格ID |
| product_id | INT, FK | 商品ID |
| name | VARCHAR(50) | 规格名称（如500g） |
| price | DECIMAL(10,2) | 该规格价格 |
| stock | INT | 该规格库存 |

#### addresses（收货地址表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK | 地址ID |
| user_id | INT, FK | 用户ID |
| name | VARCHAR(50) | 收货人姓名 |
| phone | VARCHAR(20) | 收货人手机号 |
| province | VARCHAR(30) | 省 |
| city | VARCHAR(30) | 市 |
| district | VARCHAR(30) | 区 |
| detail | VARCHAR(200) | 详细地址 |
| is_default | TINYINT, DEFAULT 0 | 是否默认地址 |
| created_at | DATETIME | 创建时间 |

#### orders（订单表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK | 订单ID |
| order_no | VARCHAR(32), UNIQUE | 订单编号 |
| user_id | INT, FK | 用户ID |
| address_snapshot | JSON | 收货地址快照 |
| total_amount | DECIMAL(10,2) | 商品总金额 |
| delivery_fee | DECIMAL(10,2) | 配送费 |
| discount_amount | DECIMAL(10,2), DEFAULT 0 | 优惠金额 |
| pay_amount | DECIMAL(10,2) | 实付金额 |
| status | TINYINT | 0待付款 1已付款待发货 2已发货 3已完成 4已取消 5退款中 6已退款 |
| pay_time | DATETIME | 支付时间 |
| deliver_time | DATETIME | 发货时间 |
| receive_time | DATETIME | 收货时间 |
| delivery_time_slot | VARCHAR(50) | 期望配送时段 |
| remark | VARCHAR(200) | 订单备注 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### order_items（订单商品表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK | 记录ID |
| order_id | INT, FK | 订单ID |
| product_id | INT, FK | 商品ID |
| product_name | VARCHAR(100) | 商品名称（快照） |
| product_image | VARCHAR(255) | 商品图片（快照） |
| spec_name | VARCHAR(50) | 规格名称 |
| price | DECIMAL(10,2) | 单价 |
| quantity | INT | 数量 |

#### cart_items（购物车表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK | 记录ID |
| user_id | INT, FK | 用户ID |
| product_id | INT, FK | 商品ID |
| spec_id | INT | 规格ID |
| quantity | INT | 数量 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### coupons（优惠券模板表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK | 优惠券ID |
| name | VARCHAR(100) | 优惠券名称 |
| type | TINYINT | 1满减 2折扣 |
| value | DECIMAL(10,2) | 优惠值（金额或折扣率） |
| min_amount | DECIMAL(10,2) | 最低使用金额 |
| total_count | INT | 发放总量 |
| used_count | INT, DEFAULT 0 | 已使用数量 |
| start_time | DATETIME | 有效期开始 |
| end_time | DATETIME | 有效期结束 |
| status | TINYINT, DEFAULT 1 | 状态：1启用 0禁用 |
| created_at | DATETIME | 创建时间 |

#### user_coupons（用户优惠券表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK | 记录ID |
| user_id | INT, FK | 用户ID |
| coupon_id | INT, FK | 优惠券ID |
| order_id | INT | 使用的订单ID |
| status | TINYINT | 0未使用 1已使用 2已过期 |
| created_at | DATETIME | 领取时间 |
| used_at | DATETIME | 使用时间 |

#### banners（轮播图表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK | 轮播图ID |
| image | VARCHAR(255) | 图片URL |
| link_type | TINYINT | 跳转类型：0无跳转 1商品 2分类 3外链 |
| link_value | VARCHAR(255) | 跳转目标值 |
| sort_order | INT, DEFAULT 0 | 排序 |
| status | TINYINT, DEFAULT 1 | 状态：1启用 0禁用 |
| created_at | DATETIME | 创建时间 |

#### admins（管理员表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK | 管理员ID |
| username | VARCHAR(50), UNIQUE | 用户名 |
| password | VARCHAR(255) | 密码（bcrypt加密） |
| name | VARCHAR(50) | 姓名 |
| role | VARCHAR(20) | 角色：super_admin / admin / operator |
| status | TINYINT, DEFAULT 1 | 状态：1启用 0禁用 |
| last_login_at | DATETIME | 最后登录时间 |
| created_at | DATETIME | 创建时间 |

#### settings（系统配置表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK | 配置ID |
| key | VARCHAR(50), UNIQUE | 配置键 |
| value | TEXT | 配置值（JSON） |
| description | VARCHAR(100) | 配置说明 |

---

## 四、API 接口设计

### 4.1 小程序端接口（/api/v1/）

#### 认证
- `POST /auth/login` — 微信登录（code 换取 openid）
- `POST /auth/phone` — 绑定手机号

#### 首页
- `GET /home/banners` — 获取轮播图
- `GET /home/categories` — 获取首页分类导航
- `GET /home/hot-products` — 获取热门推荐商品

#### 商品
- `GET /categories` — 获取全部分类（含子分类）
- `GET /products` — 商品列表（分页、分类筛选、排序）
- `GET /products/:id` — 商品详情
- `GET /products/search` — 搜索商品

#### 购物车
- `GET /cart` — 获取购物车列表
- `POST /cart` — 添加商品到购物车
- `PUT /cart/:id` — 修改购物车商品数量
- `DELETE /cart/:id` — 删除购物车商品

#### 地址
- `GET /addresses` — 获取地址列表
- `POST /addresses` — 新增地址
- `PUT /addresses/:id` — 编辑地址
- `DELETE /addresses/:id` — 删除地址

#### 订单
- `POST /orders` — 创建订单
- `GET /orders` — 订单列表（按状态筛选）
- `GET /orders/:id` — 订单详情
- `PUT /orders/:id/cancel` — 取消订单
- `PUT /orders/:id/receive` — 确认收货
- `POST /orders/:id/refund` — 申请退款

#### 支付
- `POST /pay/:orderId` — 发起微信支付
- `POST /pay/notify` — 微信支付回调

#### 优惠券
- `GET /coupons/available` — 可领取的优惠券
- `POST /coupons/:id/claim` — 领取优惠券
- `GET /coupons/mine` — 我的优惠券

#### 用户
- `GET /user/profile` — 获取个人信息
- `PUT /user/profile` — 更新个人信息

### 4.2 管理后台接口（/api/admin/）

#### 认证
- `POST /auth/login` — 管理员登录
- `POST /auth/logout` — 退出登录
- `GET /auth/info` — 获取当前管理员信息

#### 仪表盘
- `GET /dashboard/overview` — 数据概览
- `GET /dashboard/sales-trend` — 销售趋势
- `GET /dashboard/top-products` — 热销排行

#### 商品管理
- `GET /products` — 商品列表（分页/搜索/筛选）
- `POST /products` — 添加商品
- `PUT /products/:id` — 编辑商品
- `PUT /products/:id/status` — 上下架
- `DELETE /products/:id` — 删除商品

#### 分类管理
- `GET /categories` — 分类列表
- `POST /categories` — 添加分类
- `PUT /categories/:id` — 编辑分类
- `DELETE /categories/:id` — 删除分类

#### 订单管理
- `GET /orders` — 订单列表
- `GET /orders/:id` — 订单详情
- `PUT /orders/:id/deliver` — 发货
- `PUT /orders/:id/refund` — 处理退款
- `GET /orders/export` — 导出订单

#### 用户管理
- `GET /users` — 用户列表
- `GET /users/:id` — 用户详情

#### 营销管理
- `GET /banners` — 轮播图列表
- `POST /banners` — 添加轮播图
- `PUT /banners/:id` — 编辑轮播图
- `DELETE /banners/:id` — 删除轮播图
- `GET /coupons` — 优惠券列表
- `POST /coupons` — 创建优惠券
- `PUT /coupons/:id` — 编辑优惠券

#### 系统设置
- `GET /admins` — 管理员列表
- `POST /admins` — 添加管理员
- `PUT /admins/:id` — 编辑管理员
- `GET /settings` — 获取系统配置
- `PUT /settings` — 更新系统配置

---

## 五、项目目录结构

```
bbq-shop/
├── server/                   # 后端服务
│   ├── src/
│   │   ├── config/           # 配置文件
│   │   ├── middleware/       # 中间件（鉴权、错误处理等）
│   │   ├── models/           # 数据模型（Sequelize）
│   │   ├── routes/           # 路由
│   │   │   ├── api/          # 小程序端API
│   │   │   └── admin/        # 管理后台API
│   │   ├── services/         # 业务逻辑层
│   │   ├── utils/            # 工具函数
│   │   └── app.js            # 应用入口
│   ├── database/
│   │   ├── migrations/       # 数据库迁移
│   │   └── seeds/            # 种子数据
│   ├── uploads/              # 文件上传目录
│   └── package.json
│
├── admin/                    # 管理后台前端
│   ├── src/
│   │   ├── api/              # API 请求封装
│   │   ├── assets/           # 静态资源
│   │   ├── components/       # 公共组件
│   │   ├── layouts/          # 布局组件
│   │   ├── router/           # 路由配置
│   │   ├── stores/           # Pinia 状态管理
│   │   ├── views/            # 页面视图
│   │   ├── utils/            # 工具函数
│   │   ├── App.vue
│   │   └── main.js
│   ├── public/
│   └── package.json
│
├── miniprogram/              # 微信小程序
│   ├── pages/                # 页面
│   │   ├── index/            # 首页
│   │   ├── category/         # 分类页
│   │   ├── product-detail/   # 商品详情
│   │   ├── cart/             # 购物车
│   │   ├── order-confirm/    # 订单确认
│   │   ├── order-list/       # 订单列表
│   │   ├── order-detail/     # 订单详情
│   │   ├── user/             # 用户中心
│   │   ├── address-list/     # 地址列表
│   │   ├── address-edit/     # 编辑地址
│   │   └── coupon/           # 优惠券
│   ├── components/           # 公共组件
│   ├── utils/                # 工具函数
│   ├── images/               # 图片资源
│   ├── app.js
│   ├── app.json
│   ├── app.wxss
│   └── project.config.json
│
├── PRD.md                    # 产品需求文档
└── README.md                 # 项目说明
```

---

## 六、非功能性需求

### 6.1 性能要求
- API 响应时间 < 200ms（P95）
- 首页加载时间 < 2s
- 支持 500+ 并发用户

### 6.2 安全要求
- 用户密码 bcrypt 加密存储
- API 接口 JWT 鉴权
- 管理端接口基于角色的权限控制（RBAC）
- 防 SQL 注入、XSS 攻击
- 微信支付签名验证
- 敏感配置环境变量管理

### 6.3 可用性
- 服务可用性 > 99.9%
- 数据库定期备份
- 错误日志记录与监控

---

## 七、开发计划

| 阶段 | 内容 | 优先级 |
|------|------|--------|
| P0 - 基础框架 | 项目初始化、数据库设计、基础API框架搭建 | 最高 |
| P1 - 核心商品 | 商品分类/列表/详情（前后端） | 高 |
| P2 - 购物下单 | 购物车、订单创建、地址管理 | 高 |
| P3 - 管理后台 | 商品管理、订单管理、分类管理 | 高 |
| P4 - 用户体系 | 微信登录、用户中心、个人信息 | 中 |
| P5 - 营销功能 | 轮播管理、优惠券 | 中 |
| P6 - 数据统计 | 仪表盘、销售数据、导出功能 | 低 |
| P7 - 支付对接 | 微信支付集成（需要商户号） | 低 |
