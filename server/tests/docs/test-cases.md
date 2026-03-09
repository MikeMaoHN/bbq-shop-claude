# 测试用例 — 微信支付模块

> 项目：烤乐汇（BBQ Shop）
> 模块：微信支付对接
> 版本：v1.1.0
> 日期：2026-03-09
> 测试框架：Jest 30 + Supertest 7

---

## 目录

1. [单元测试 — 服务层（TC-SVC）](#1-单元测试--服务层)
2. [集成测试 — 小程序支付 API（TC-PAY）](#2-集成测试--小程序支付-api)
3. [集成测试 — 管理端支付配置（TC-ADMIN-PAY）](#3-集成测试--管理端支付配置)
4. [测试覆盖范围说明](#4-测试覆盖范围说明)

---

## 1. 单元测试 — 服务层

测试文件：`tests/unit/wechatPay.service.test.js`

### TC-SVC-01：XML 工具函数

| 用例编号 | 用例名称 | 前置条件 | 输入 | 预期输出 | 优先级 |
|----------|----------|----------|------|----------|--------|
| TC-SVC-01-1 | toXml 序列化 | 无 | `{return_code:'SUCCESS', return_msg:'OK'}` | 包含 `<return_code><![CDATA[SUCCESS]]></return_code>` | P0 |
| TC-SVC-01-2 | parseXml CDATA 解析 | 无 | CDATA 格式 XML 字符串 | `obj.return_code === 'SUCCESS'` | P0 |
| TC-SVC-01-3 | parseXml 空字符串 | 无 | `''` | `{}` | P1 |
| TC-SVC-01-4 | toXml → parseXml 往返一致性 | 无 | 含多字段对象 | 解析后值与原始值完全一致 | P0 |

**测试要点**：验证 XML 工具函数正确性，尤其是 CDATA 包裹内容的解析（微信回调格式关键）。

---

### TC-SVC-02：verifyNotify — 回调签名验证

| 用例编号 | 用例名称 | 前置条件 | 输入 | 预期输出 | 优先级 |
|----------|----------|----------|------|----------|--------|
| TC-SVC-02-1 | 正确签名验证通过 | 使用测试商户密钥生成签名 | 正确签名参数包 | `true` | P0 |
| TC-SVC-02-2 | 错误签名验证失败 | 无 | 含 `WRONG_SIGN` 的参数包 | `false` | P0 |
| TC-SVC-02-3 | 篡改参数后签名失效 | 基于正确签名 | 篡改 total_fee 后的参数包 | `false` | P0 |

**安全要点**：防止伪造支付回调，确保签名校验逻辑严格。

---

### TC-SVC-03：isMockMode — 模式检测

| 用例编号 | 用例名称 | DB 返回值 | ENV 设置 | 预期 | 优先级 |
|----------|----------|-----------|----------|------|--------|
| TC-SVC-03-1 | DB=true 优先于 ENV | `{value:'true'}` | 任意 | `true` | P0 |
| TC-SVC-03-2 | DB=false 返回 false | `{value:'false'}` | 任意 | `false` | P0 |
| TC-SVC-03-3 | DB 无记录 + 非生产环境 | `null` | `NODE_ENV=test` | `true`（安全默认） | P1 |
| TC-SVC-03-4 | DB 查询异常时降级 | 抛出异常 | 任意 | 返回布尔值，不抛出 | P1 |

---

### TC-SVC-04：createPrepay — 预支付参数生成

| 用例编号 | 用例名称 | mock 模式 | 输入 | 预期输出 | 优先级 |
|----------|----------|-----------|------|----------|--------|
| TC-SVC-04-1 | mock 模式返回 mock=true | 是 | 标准订单参数 | `{mock:true, prepayId:'MOCK_PREPAY_...'}` | P0 |
| TC-SVC-04-2 | 返回参数包含必要字段 | 是 | 标准订单参数 | 含 appId/timeStamp/nonceStr/paySign | P0 |
| TC-SVC-04-3 | 不同订单生成不同 prepayId | 是 | 两个不同 orderNo | 两个 prepayId 不相同 | P1 |

---

### TC-SVC-05：processRefund — 退款处理

| 用例编号 | 用例名称 | mock 模式 | 输入 | 预期输出 | 优先级 |
|----------|----------|-----------|------|----------|--------|
| TC-SVC-05-1 | mock 模式立即返回成功 | 是 | 标准退款参数 | `{mock:true, result_code:'SUCCESS'}` | P0 |
| TC-SVC-05-2 | mock 退款响应时间<200ms | 是 | 标准退款参数 | 耗时 < 200ms | P1 |

---

## 2. 集成测试 — 小程序支付 API

测试文件：`tests/integration/pay.api.test.js`
基础路径：`POST/GET /pay/...`

### TC-PAY-01：查询支付模式

| 用例编号 | 用例名称 | 请求 | mock DB 值 | 预期状态码 | 预期响应体 |
|----------|----------|------|-----------|-----------|------------|
| TC-PAY-01-1 | mock 开启时查询 | `GET /mock-mode` | `true` | 200 | `{code:0, data:{mock:true}}` |
| TC-PAY-01-2 | mock 关闭时查询 | `GET /mock-mode` | `false` | 200 | `{code:0, data:{mock:false}}` |

---

### TC-PAY-02~05：发起预支付

| 用例编号 | 用例名称 | Auth | 订单状态 | 预期状态码 | 预期关键字段 |
|----------|----------|------|----------|-----------|--------------|
| TC-PAY-02 | mock 模式正常预支付 | 有效 Token | status=0 | 200 | `data.mock=true, data.prepayId=MOCK_PREPAY_*` |
| TC-PAY-03 | 未登录被拒绝 | 无 Token | 任意 | 401 | — |
| TC-PAY-04 | 订单不存在 | 有效 Token | null | 404 | `message='订单不存在'` |
| TC-PAY-05 | 订单已支付 | 有效 Token | status=1 | 400 | `message='订单已支付或已关闭'` |
| TC-PAY-05b | 缺少 order_id | 有效 Token | — | 400 | `message='缺少 order_id'` |

---

### TC-PAY-06~08：模拟支付确认

| 用例编号 | 用例名称 | mock 模式 | 订单状态 | 预期状态码 | 副作用 |
|----------|----------|-----------|----------|-----------|--------|
| TC-PAY-06 | mock 模式下成功确认 | 是 | status=0 | 200 | `order.update({status:1, transaction_id:'MOCK_TXN_*', pay_time:Date})` 被调用 |
| TC-PAY-07 | 真实模式下被禁止 | 否 | 任意 | 403 | 无副作用 |
| TC-PAY-08 | 订单已付款 | 是 | status=1 | 400 | 无副作用 |
| TC-PAY-08b | 订单不属于当前用户 | 是 | null | 404 | 无副作用 |

---

### TC-PAY-09~10：微信支付回调（Notify）

| 用例编号 | 用例名称 | 请求体 | 预期状态码 | 预期响应体 | 副作用 |
|----------|----------|--------|-----------|------------|--------|
| TC-PAY-09 | 合法签名 + SUCCESS 回调 | 正确签名 XML | 200 | `<return_code>SUCCESS</return_code>` | `order.update({status:1, transaction_id:'wx_txn_*'})` |
| TC-PAY-10 | 签名错误回调 | 错误签名 XML | 200 | `<return_code>FAIL</return_code>` | 无 update |
| TC-PAY-10b | result_code=FAIL 回调 | 正确签名但 FAIL | 200 | `<return_code>SUCCESS</return_code>` | 无 update |
| TC-PAY-10c | 重复回调（订单已付款） | 正确签名 XML | 200 | 正常 | 无 update（幂等） |

---

## 3. 集成测试 — 管理端支付配置

测试文件：`tests/integration/admin.pay.test.js`
基础路径：`GET/PUT /pay/...`（需 Bearer 管理员 Token）

### TC-ADMIN-PAY-01：查询支付模式

| 用例编号 | 用例名称 | Auth | DB 值 | 预期状态码 | 预期 data |
|----------|----------|------|-------|-----------|-----------|
| TC-ADMIN-PAY-01-1 | 查询返回布尔类型 | 管理员 Token | 任意 | 200 | `{mock: Boolean}` |
| TC-ADMIN-PAY-01-2 | DB=true 时 | 管理员 Token | `true` | 200 | `{mock: true}` |
| TC-ADMIN-PAY-01-3 | DB=false 时 | 管理员 Token | `false` | 200 | `{mock: false}` |

---

### TC-ADMIN-PAY-02~03：切换支付模式

| 用例编号 | 用例名称 | 请求体 | 预期状态码 | DB upsert 调用参数 | 预期 data.mock |
|----------|----------|--------|-----------|-------------------|----------------|
| TC-ADMIN-PAY-02 | 切换为模拟模式 | `{mock: true}` | 200 | `{key:'pay_mock_mode', value:'true', description:'支付模拟模式开关'}` | `true` |
| TC-ADMIN-PAY-03 | 切换为真实模式 | `{mock: false}` | 200 | `{key:'pay_mock_mode', value:'false', ...}` | `false` |
| TC-ADMIN-PAY-03b | 写入 description | `{mock: true}` | 200 | 含 `description='支付模拟模式开关'` | — |

---

### TC-ADMIN-PAY-04：鉴权验证

| 用例编号 | 用例名称 | Auth | 预期状态码 |
|----------|----------|------|-----------|
| TC-ADMIN-PAY-04-1 | 无 Token | 无 | 401 |
| TC-ADMIN-PAY-04-2 | 无效 Token | `Bearer invalid_xyz` | 401 |
| TC-ADMIN-PAY-04-3 | 已禁用管理员 | 有效 Token（status=0） | 401 |

---

### TC-ADMIN-PAY-05：异常处理

| 用例编号 | 用例名称 | 异常注入 | 预期状态码 |
|----------|----------|----------|-----------|
| TC-ADMIN-PAY-05-1 | DB 写入失败 | `upsert()` 抛出异常 | 500 |
| TC-ADMIN-PAY-05-2 | DB 读取失败时降级 | `findOne()` 抛出异常 | 200（回退到 ENV 值） |

---

## 4. 测试覆盖范围说明

### 已覆盖（自动化测试）

| 功能点 | 覆盖方式 | 覆盖率 |
|--------|----------|--------|
| XML 解析与序列化 | 单元测试 | 100% |
| 签名验证（正/负/篡改） | 单元测试 | 100% |
| isMockMode 优先级逻辑 | 单元测试 | 100% |
| mock 模式预支付 | 单元 + 集成 | 100% |
| mock 模式退款 | 单元测试 | 100% |
| `/pay/prepay` 路由 | 集成测试 | ~89% |
| `/pay/notify` 路由 | 集成测试 | ~89% |
| `/pay/mock-confirm` 路由 | 集成测试 | ~89% |
| `/pay/mock-mode` 路由 | 集成测试 | 100% |
| `/admin/pay/mock-mode` 路由 | 集成测试 | ~94% |
| 管理端鉴权 | 集成测试 | 100% |

### 未覆盖（依赖外部服务，需手动或 E2E 测试）

| 功能点 | 原因 | 建议 |
|--------|------|------|
| 真实微信统一下单 HTTP 请求 | 需真实商户号 | 使用微信沙箱环境手动验证 |
| 真实微信退款 HTTP 请求 | 需商户双向 SSL 证书 | 微信商户平台沙箱测试 |
| `wx.requestPayment()` | 微信小程序原生 API | 小程序真机测试 |
| 小程序支付流程 E2E | 跨端 | 使用微信开发者工具手动验证 |
