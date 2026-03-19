# API 接口文档

## 基础信息

| 项目 | 值 |
|------|-----|
| Base URL | `http://47.113.189.235:3000/api` |
| 认证方式 | Bearer Token |
| 内容类型 | `application/json` |
| 字符编码 | UTF-8 |

## 认证说明

### 请求头
```
Authorization: Bearer {token}
```

### Token 获取
通过微信登录接口获取，有效期 7 天。

### Token 刷新
当 Token 剩余有效期 < 1 小时，响应头会携带 `X-New-Token`，客户端应更新存储。

---

## 接口列表

### 认证模块

#### POST /api/auth/wx-login

**描述**: 微信登录

**请求体**:
```json
{
  "code": "wx_code_from_wx_login"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "openid": "xxx",
      "nickname": "用户昵称",
      "avatar": "头像 URL",
      "phone": "手机号"
    }
  }
}
```

**错误码**:
| 码 | 说明 |
|----|------|
| 400 | code 无效 |
| 500 | 微信服务异常 |

---

### 用户模块

#### GET /api/user/info

**描述**: 获取当前用户信息

**请求头**: `Authorization: Bearer {token}`

**响应**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "openid": "xxx",
    "nickname": "用户昵称",
    "avatar": "头像 URL",
    "phone": "手机号"
  }
}
```

#### PUT /api/user/info

**描述**: 更新用户信息

**请求体**:
```json
{
  "nickname": "新昵称",
  "phone": "新手机号"
}
```

---

### 分类模块

#### GET /api/categories

**描述**: 获取分类列表

**参数**: 无

**响应**:
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "肉类",
      "icon": "/images/categories/meat.png",
      "sort": 1
    }
  ]
}
```

---

### 商品模块

#### GET /api/products

**描述**: 获取商品列表（支持分页、筛选、搜索）

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 20 |
| categoryId | number | 否 | 分类 ID 筛选 |
| keyword | string | 否 | 搜索关键词 |
| isHot | string | 否 | 是否热销：1=是 |

**响应**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "name": "澳洲牛排",
        "price": 9900,
        "original_price": 12900,
        "stock": 100,
        "sales": 500,
        "images": "[\"/images/products/steak1.jpg\"]",
        "category_id": 1
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

#### GET /api/products/:id

**描述**: 获取商品详情

**响应**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "name": "澳洲牛排",
    "description": "商品详情描述",
    "price": 9900,
    "original_price": 12900,
    "stock": 100,
    "sales": 500,
    "images": "[\"/images/products/steak1.jpg\",\"/images/products/steak2.jpg\"]",
    "category_id": 1,
    "category_name": "肉类"
  }
}
```

---

### 购物车模块

#### GET /api/cart

**描述**: 获取购物车列表

**响应**:
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "澳洲牛排",
        "price": 9900,
        "quantity": 2,
        "stock": 100,
        "checked": true,
        "images": "[\"/images/products/steak1.jpg\"]"
      }
    ],
    "total": 1
  }
}
```

#### POST /api/cart

**描述**: 添加到购物车

**请求体**:
```json
{
  "productId": 1,
  "quantity": 2
}
```

#### PUT /api/cart/:id

**描述**: 更新购物车商品数量

**请求体**:
```json
{
  "quantity": 3
}
```

#### PUT /api/cart/:id/checked

**描述**: 更新购物车商品选中状态

**请求体**:
```json
{
  "checked": true
}
```

#### PUT /api/cart/checked

**描述**: 全选/取消全选

**请求体**:
```json
{
  "checked": true
}
```

#### DELETE /api/cart/:id

**描述**: 删除购物车商品

#### DELETE /api/cart

**描述**: 清空购物车

---

### 地址模块

#### GET /api/addresses

**描述**: 获取地址列表

**响应**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "name": "张三",
        "phone": "13800138000",
        "province": "广东省",
        "city": "深圳市",
        "district": "南山区",
        "detail": "xx 街道 xx 号",
        "is_default": true
      }
    ],
    "total": 1
  }
}
```

#### POST /api/addresses

**描述**: 创建地址

**请求体**:
```json
{
  "name": "张三",
  "phone": "13800138000",
  "province": "广东省",
  "city": "深圳市",
  "district": "南山区",
  "detail": "xx 街道 xx 号",
  "isDefault": true
}
```

#### PUT /api/addresses/:id

**描述**: 更新地址

#### DELETE /api/addresses/:id

**描述**: 删除地址

---

### 订单模块

#### POST /api/order/create

**描述**: 创建订单

**请求体**:
```json
{
  "addressId": 1,
  "remark": "备注",
  "items": [
    {"productId": 1, "quantity": 2}
  ]
}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "id": "ORD-20240101-001",
    "totalAmount": 19800,
    "status": 0
  }
}
```

**错误码**:
| 码 | 说明 |
|----|------|
| 400 | 参数错误/库存不足 |
| 401 | 未登录 |
| 403 | 无权操作 |

#### GET /api/order/list

**描述**: 获取订单列表

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |
| status | number | 否 | 订单状态筛选 |

**响应**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "ORD-20240101-001",
        "status": 0,
        "status_text": "待付款",
        "total_amount": 19800,
        "created_at": "2024-01-01 12:00:00",
        "items": [
          {
            "product_id": 1,
            "product_name": "澳洲牛排",
            "price": 9900,
            "quantity": 2,
            "product_image": "/images/products/steak1.jpg"
          }
        ]
      }
    ],
    "total": 10
  }
}
```

#### GET /api/order/:id

**描述**: 获取订单详情

#### POST /api/order/:id/pay

**描述**: 支付订单

**响应** (MOCK 模式):
```json
{
  "code": 200,
  "message": "支付成功"
}
```

**响应** (REAL 模式):
```json
{
  "code": 200,
  "data": {
    "paymentData": {
      "timeStamp": "1234567890",
      "nonceStr": "xxx",
      "package": "prepay_id=xxx",
      "signType": "RSA",
      "paySign": "xxx"
    }
  }
}
```

#### POST /api/order/:id/cancel

**描述**: 取消订单

**请求体**:
```json
{
  "reason": "不想要了"
}
```

#### POST /api/order/:id/confirm

**描述**: 确认收货

---

### 支付回调接口

#### POST /api/pay/notify

**描述**: 微信支付回调通知

**请求体** (微信原始数据):
```xml
<xml>
  <appid>xxx</appid>
  <mch_id>xxx</mch_id>
  <out_trade_no>ORD-20240101-001</out_trade_no>
  <transaction_id>xxx</transaction_id>
  <trade_state>SUCCESS</trade_state>
  <total_fee>19800</total_fee>
</xml>
```

**响应**:
```xml
<xml>
  <return_code>SUCCESS</return_code>
  <return_msg>OK</return_msg>
</xml>
```

---

## 全局错误码

| 码 | 说明 | 处理建议 |
|----|------|----------|
| 200 | 成功 | - |
| 400 | 参数错误 | 检查请求参数 |
| 401 | 未授权 | 跳转登录页 |
| 403 | 禁止访问 | 检查权限 |
| 404 | 资源不存在 | - |
| 429 | 请求过于频繁 | 限流触发 |
| 500 | 服务器内部错误 | 联系管理员 |

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0 | 2024-01-01 | 初始版本 |
| v1.1 | 2024-01-10 | 新增支付回调接口文档 |
| v1.2 | 2024-01-15 | 完善错误码说明 |
