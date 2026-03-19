# 数据库设计文档

## 基础信息

| 项目 | 值 |
|------|-----|
| 数据库类型 | MySQL 8.0 / SQLite (开发) |
| 字符集 | utf8mb4 |
| 排序规则 | utf8mb4_unicode_ci |

---

## ER 图

```
┌─────────────┐     ┌─────────────┐
│    users    │     │  categories │
├─────────────┤     ├─────────────┤
│ id          │     │ id          │
│ openid      │     │ name        │
│ nickname    │     │ icon        │
│ avatar      │     │ sort        │
│ phone       │     │ created_at  │
│ created_at  │     │ updated_at  │
└─────────────┘     └─────────────┘
       │                    │
       │                    │
       │              ┌─────▼─────┐
       │              │ products  │
       │              ├───────────┤
       │              │ id        │
       │              │ name      │
       │              │ desc      │
       │              │ price     │
       │              │ stock     │
       │              │ sales     │
       │              │ images    │
       │              │ category_id│
       │              │ is_hot    │
       │              │ status    │
       │              └─────┬─────┘
       │                    │
┌──────▼──────┐      ┌──────▼──────┐
│   cart      │      │   orders    │
├─────────────┤      ├─────────────┤
│ id          │      │ id          │
│ user_id    │      │ user_id     │
│ product_id │      │ address_id  │
│ quantity   │      │ total_amount│
│ checked    │      │ status      │
│ created_at │      │ remark      │
└─────────────┘      │ created_at  │
                     └──────┬──────┘
                            │
                     ┌──────▼──────┐
                     │ order_items │
                     ├─────────────┤
                     │ id          │
                     │ order_id    │
                     │ product_id  │
                     │ price       │
                     │ quantity    │
                     └─────────────┘

┌─────────────┐
│  addresses  │
├─────────────┤
│ id          │
│ user_id     │
│ name        │
│ phone       │
│ province    │
│ city        │
│ district    │
│ detail      │
│ is_default  │
└─────────────┘
```

---

## 表结构详情

### users - 用户表

| 字段 | 类型 | 长度 | 必填 | 默认 | 说明 |
|------|------|------|------|------|------|
| id | BIGINT | - | 是 | AI | 主键 |
| openid | VARCHAR | 64 | 是 | - | 微信 openid（唯一） |
| unionid | VARCHAR | 64 | 否 | NULL | 微信 unionid |
| nickname | VARCHAR | 64 | 否 | NULL | 昵称 |
| avatar | VARCHAR | 255 | 否 | NULL | 头像 URL |
| phone | VARCHAR | 20 | 否 | NULL | 手机号 |
| is_admin | TINYINT | 1 | 是 | 0 | 是否管理员 |
| created_at | DATETIME | - | 是 | NOW | 创建时间 |
| updated_at | DATETIME | - | 是 | NOW | 更新时间 |

**索引**:
- `PRIMARY KEY (id)`
- `UNIQUE KEY uk_openid (openid)`
- `KEY idx_phone (phone)`

---

### categories - 分类表

| 字段 | 类型 | 长度 | 必填 | 默认 | 说明 |
|------|------|------|------|------|------|
| id | BIGINT | - | 是 | AI | 主键 |
| name | VARCHAR | 64 | 是 | - | 分类名称 |
| icon | VARCHAR | 255 | 否 | NULL | 分类图标 URL |
| sort | INT | - | 否 | 0 | 排序（越小越前） |
| status | TINYINT | 1 | 是 | 1 | 状态：1=启用 0=禁用 |
| created_at | DATETIME | - | 是 | NOW | 创建时间 |
| updated_at | DATETIME | - | 是 | NOW | 更新时间 |

**索引**:
- `PRIMARY KEY (id)`
- `KEY idx_sort (sort)`

---

### products - 商品表

| 字段 | 类型 | 长度 | 必填 | 默认 | 说明 |
|------|------|------|------|------|------|
| id | BIGINT | - | 是 | AI | 主键 |
| name | VARCHAR | 128 | 是 | - | 商品名称 |
| description | TEXT | - | 否 | NULL | 商品描述 |
| price | BIGINT | - | 是 | - | 价格（分） |
| original_price | BIGINT | - | 否 | NULL | 原价（分） |
| stock | INT | - | 是 | 0 | 库存 |
| sales | INT | - | 是 | 0 | 销量 |
| images | TEXT | - | 否 | NULL | 图片 JSON 数组 |
| category_id | BIGINT | - | 否 | NULL | 分类 ID（外键） |
| is_hot | TINYINT | 1 | 是 | 0 | 是否热销 |
| status | TINYINT | 1 | 是 | 1 | 状态：1=上架 0=下架 |
| created_at | DATETIME | - | 是 | NOW | 创建时间 |
| updated_at | DATETIME | - | 是 | NOW | 更新时间 |

**索引**:
- `PRIMARY KEY (id)`
- `KEY idx_category (category_id)`
- `KEY idx_is_hot (is_hot)`
- `KEY idx_status (status)`
- `KEY idx_created (created_at)`

**外键**:
- `FOREIGN KEY (category_id) REFERENCES categories(id)`

---

### cart - 购物车表

| 字段 | 类型 | 长度 | 必填 | 默认 | 说明 |
|------|------|------|------|------|------|
| id | BIGINT | - | 是 | AI | 主键 |
| user_id | BIGINT | - | 是 | - | 用户 ID（外键） |
| product_id | BIGINT | - | 是 | - | 商品 ID（外键） |
| quantity | INT | - | 是 | 1 | 数量 |
| checked | TINYINT | 1 | 是 | 1 | 是否选中 |
| created_at | DATETIME | - | 是 | NOW | 创建时间 |
| updated_at | DATETIME | - | 是 | NOW | 更新时间 |

**索引**:
- `PRIMARY KEY (id)`
- `UNIQUE KEY uk_user_product (user_id, product_id)`
- `KEY idx_user_checked (user_id, checked)`

**外键**:
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE`

---

### addresses - 地址表

| 字段 | 类型 | 长度 | 必填 | 默认 | 说明 |
|------|------|------|------|------|------|
| id | BIGINT | - | 是 | AI | 主键 |
| user_id | BIGINT | - | 是 | - | 用户 ID（外键） |
| name | VARCHAR | 64 | 是 | - | 收货人姓名 |
| phone | VARCHAR | 20 | 是 | - | 收货人手机 |
| province | VARCHAR | 64 | 是 | - | 省 |
| city | VARCHAR | 64 | 是 | - | 市 |
| district | VARCHAR | 64 | 是 | - | 区 |
| detail | VARCHAR | 255 | 是 | - | 详细地址 |
| is_default | TINYINT | 1 | 是 | 0 | 是否默认地址 |
| created_at | DATETIME | - | 是 | NOW | 创建时间 |
| updated_at | DATETIME | - | 是 | NOW | 更新时间 |

**索引**:
- `PRIMARY KEY (id)`
- `KEY idx_user (user_id)`
- `KEY idx_user_default (user_id, is_default)`

**外键**:
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`

---

### orders - 订单表

| 字段 | 类型 | 长度 | 必填 | 默认 | 说明 |
|------|------|------|------|------|------|
| id | BIGINT | - | 是 | AI | 主键 |
| order_no | VARCHAR | 64 | 是 | - | 订单号（唯一） |
| user_id | BIGINT | - | 是 | - | 用户 ID（外键） |
| address_id | BIGINT | - | 是 | - | 地址 ID（外键） |
| total_amount | BIGINT | - | 是 | - | 订单总金额（分） |
| freight_amount | BIGINT | - | 是 | 0 | 运费（分） |
| status | TINYINT | 1 | 是 | 0 | 订单状态 |
| remark | VARCHAR | 255 | 否 | NULL | 用户备注 |
| remark_merchant | VARCHAR | 255 | 否 | NULL | 商家备注 |
| pay_time | DATETIME | - | 否 | NULL | 支付时间 |
| delivery_time | DATETIME | - | 否 | NULL | 发货时间 |
| receive_time | DATETIME | - | 否 | NULL | 收货时间 |
| cancel_time | DATETIME | - | 否 | NULL | 取消时间 |
| cancel_reason | VARCHAR | 255 | 否 | NULL | 取消原因 |
| created_at | DATETIME | - | 是 | NOW | 创建时间 |
| updated_at | DATETIME | - | 是 | NOW | 更新时间 |

**订单状态**:
- 0: 待付款
- 1: 待发货
- 2: 待收货
- 3: 已完成
- 4: 已取消

**索引**:
- `PRIMARY KEY (id)`
- `UNIQUE KEY uk_order_no (order_no)`
- `KEY idx_user (user_id)`
- `KEY idx_user_status (user_id, status)`
- `KEY idx_status (status)`
- `KEY idx_created (created_at)`

**外键**:
- `FOREIGN KEY (user_id) REFERENCES users(id)`
- `FOREIGN KEY (address_id) REFERENCES addresses(id)`

---

### order_items - 订单明细表

| 字段 | 类型 | 长度 | 必填 | 默认 | 说明 |
|------|------|------|------|------|------|
| id | BIGINT | - | 是 | AI | 主键 |
| order_id | BIGINT | - | 是 | - | 订单 ID（外键） |
| product_id | BIGINT | - | 是 | - | 商品 ID（外键） |
| product_name | VARCHAR | 128 | 是 | - | 商品名称快照 |
| product_image | VARCHAR | 255 | 否 | NULL | 商品图片快照 |
| price | BIGINT | - | 是 | - | 商品单价（分） |
| quantity | INT | - | 是 | 1 | 商品数量 |
| total_amount | BIGINT | - | 是 | - | 小计金额（分） |
| created_at | DATETIME | - | 是 | NOW | 创建时间 |

**索引**:
- `PRIMARY KEY (id)`
- `KEY idx_order (order_id)`

**外键**:
- `FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE`
- `FOREIGN KEY (product_id) REFERENCES products(id)`

---

### operation_logs - 操作日志表

| 字段 | 类型 | 长度 | 必填 | 默认 | 说明 |
|------|------|------|------|------|------|
| id | BIGINT | - | 是 | AI | 主键 |
| user_id | BIGINT | - | 否 | NULL | 用户 ID |
| action | VARCHAR | 64 | 是 | - | 操作类型 |
| module | VARCHAR | 64 | 否 | NULL | 模块 |
| ip | VARCHAR | 64 | 否 | NULL | IP 地址 |
| user_agent | VARCHAR | 255 | 否 | NULL | 用户代理 |
| request_data | TEXT | - | 否 | NULL | 请求数据（脱敏） |
| response_status | INT | - | 否 | NULL | 响应状态码 |
| created_at | DATETIME | - | 是 | NOW | 创建时间 |

**索引**:
- `PRIMARY KEY (id)`
- `KEY idx_user (user_id)`
- `KEY idx_action (action)`
- `KEY idx_created (created_at)`

---

## 数据字典

### 订单状态 (orders.status)

| 值 | 名称 | 说明 |
|----|------|------|
| 0 | 待付款 | 订单创建，等待支付 |
| 1 | 待发货 | 支付成功，等待发货 |
| 2 | 待收货 | 已发货，等待收货 |
| 3 | 已完成 | 用户确认收货 |
| 4 | 已取消 | 订单已取消 |

### 商品状态 (products.status)

| 值 | 名称 | 说明 |
|----|------|------|
| 0 | 下架 | 不可购买 |
| 1 | 上架 | 正常销售 |

### 是否标记 (TINYINT)

| 值 | 名称 |
|----|------|
| 0 | 否 |
| 1 | 是 |

---

## 价格说明

所有金额字段使用 **分 (cents)** 为单位存储，避免浮点数精度问题。

**示例**:
- 99.00 元 → 存储为 `9900`
- 前端展示时需除以 100 转换为元

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0 | 2024-01-01 | 初始设计 |
| v1.1 | 2024-01-10 | 新增 operation_logs 表 |
| v1.2 | 2024-01-15 | 完善索引设计 |
