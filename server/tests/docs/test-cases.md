# 测试用例 — 微信支付模块

> 项目：烤乐汇（BBQ Shop）
> 模块：微信支付对接
> 版本：v1.2.0
> 日期：2026-03-09
> 测试框架：Jest 30 + Supertest 7

---

## 目录

1. [单元测试 — 服务层（TC-SVC）](#1-单元测试--服务层)
2. [单元测试 — 真实支付路径（TC-REAL）](#2-单元测试--真实支付路径)
3. [集成测试 — 小程序支付 API（TC-PAY）](#3-集成测试--小程序支付-api)
4. [集成测试 — 管理端支付配置（TC-ADMIN-PAY）](#4-集成测试--管理端支付配置)
5. [集成测试 — 极端错误路径（TC-EDGE）](#5-集成测试--极端错误路径)
6. [测试覆盖范围说明](#6-测试覆盖范围说明)

---

## 1. 单元测试 — 服务层（mock 模式）

测试文件：`tests/unit/wechatPay.service.test.js`

### TC-SVC-01：XML 工具函数

| 用例编号 | 用例名称 | 输入 | 预期输出 | 优先级 |
|----------|----------|------|----------|--------|
| TC-SVC-01-1 | toXml 序列化 | `{return_code:'SUCCESS'}` | 含 CDATA 包裹的 XML | P0 |
| TC-SVC-01-2 | parseXml CDATA 解析 | CDATA XML | `obj.return_code==='SUCCESS'` | P0 |
| TC-SVC-01-3 | parseXml 空字符串 | `''` | `{}` | P1 |
| TC-SVC-01-4 | toXml→parseXml 往返一致 | 多字段对象 | 值完全一致 | P0 |
| TC-SVC-01-5 | parseXml 同名标签去重 | 含 CDATA+纯文本同名标签 | CDATA 优先，duplicate 忽略 | P1 |

### TC-SVC-02：verifyNotify — 签名验证

| 用例编号 | 用例名称 | 输入 | 预期 | 优先级 |
|----------|----------|------|------|--------|
| TC-SVC-02-1 | 正确签名 | 正确签名参数包 | `true` | P0 |
| TC-SVC-02-2 | 错误签名 | `WRONG_SIGN` | `false` | P0 |
| TC-SVC-02-3 | 篡改参数 | total_fee 被篡改 | `false` | P0 |
| TC-SVC-02-4 | 含空字符串字段 | 空字段不影响正确签名 | `true` | P1 |

### TC-SVC-03：isMockMode — 模式检测

| 用例编号 | DB 值 | ENV | 预期 |
|----------|-------|-----|------|
| TC-SVC-03-1 | `true` | 任意 | `true` |
| TC-SVC-03-2 | `false` | 任意 | `false` |
| TC-SVC-03-3 | null | NODE_ENV=test | `true`（安全默认） |
| TC-SVC-03-4 | 抛出异常 | 任意 | 返回布尔，不抛出 |

### TC-SVC-04：createPrepay（mock 模式）

| 用例编号 | 用例名称 | 预期 |
|----------|----------|------|
| TC-SVC-04-1 | mock 字段 | `{mock:true, prepayId:'MOCK_PREPAY_*'}` |
| TC-SVC-04-2 | 必要字段完整性 | 含 appId/timeStamp/nonceStr/paySign |
| TC-SVC-04-3 | 不同订单不同 prepayId | 两次结果不同 |
| TC-SVC-04-4 | appId 为空时兜底 | `appId === 'wx_mock_appid'` |

### TC-SVC-05：processRefund（mock 模式）

| 用例编号 | 用例名称 | 预期 |
|----------|----------|------|
| TC-SVC-05-1 | 立即成功 | `{mock:true, result_code:'SUCCESS'}` |
| TC-SVC-05-2 | 响应时间 <200ms | 无网络请求 |

---

## 2. 单元测试 — 真实支付路径（HTTPS Mock）

测试文件：`tests/unit/wechatPay.realMode.test.js`

### TC-REAL-01：createPrepay（非 mock 模式）

| 用例编号 | 用例名称 | 微信 API 响应 | 预期 |
|----------|----------|--------------|------|
| TC-REAL-01-1 | 统一下单成功 | SUCCESS XML | 返回完整 JSAPI 参数，paySign 为 32 位大写 MD5 |
| TC-REAL-01-2 | return_code=FAIL | `{return_code:'FAIL', return_msg:'商户号无效'}` | 抛出 `商户号无效` |
| TC-REAL-01-3 | return_code=FAIL 无 return_msg | `{return_code:'FAIL'}` | 抛出 `统一下单失败` |
| TC-REAL-01-4 | result_code=FAIL 含 err_code_des | `{result_code:'FAIL', err_code_des:'openid 不正确'}` | 抛出 `openid 不正确` |
| TC-REAL-01-5 | result_code=FAIL 含 err_code | `{result_code:'FAIL', err_code:'INVALID_REQUEST'}` | 抛出 `INVALID_REQUEST` |
| TC-REAL-01-6 | result_code=FAIL 无任何错误信息 | `{result_code:'FAIL'}` | 抛出 `统一下单业务失败` |
| TC-REAL-01-7 | HTTPS 网络错误 | 触发 error 事件 | 抛出 `connect ECONNREFUSED` |
| TC-REAL-01-8 | https.request 调用次数 | SUCCESS XML | `https.request` 调用一次，path='/pay/unifiedorder' |
| TC-REAL-01-9 | ip 缺省使用 127.0.0.1 | SUCCESS XML | 不抛出 |

### TC-REAL-02：processRefund（非 mock 模式）

| 用例编号 | 用例名称 | 微信 API 响应 | 预期 |
|----------|----------|--------------|------|
| TC-REAL-02-1 | 退款成功 | SUCCESS XML | 返回响应对象，不含 mock |
| TC-REAL-02-2 | transaction_id 写入请求 | — | 请求 XML 含 transaction_id |
| TC-REAL-02-3 | 无 transaction_id 时不写字段 | — | 请求 XML 不含 `<transaction_id>` |
| TC-REAL-02-4 | return_code=FAIL 含 return_msg | — | 抛出对应消息 |
| TC-REAL-02-5 | return_code=FAIL 无 return_msg | — | 抛出 `退款请求失败` |
| TC-REAL-02-6 | result_code=FAIL 含 err_code_des | — | 抛出 `余额不足` |
| TC-REAL-02-7 | result_code=FAIL 无 err_code_des | — | 抛出 `退款失败` |
| TC-REAL-02-8 | 退款接口路径正确 | — | path='/secapi/pay/refund' |

---

## 3. 集成测试 — 小程序支付 API

测试文件：`tests/integration/pay.api.test.js`

### TC-PAY：路由测试

| 用例编号 | 接口 | 场景 | 预期状态码 | 关键断言 |
|----------|------|------|-----------|----------|
| TC-PAY-01-1 | GET /mock-mode | mock=true | 200 | `data.mock===true` |
| TC-PAY-01-2 | GET /mock-mode | mock=false | 200 | `data.mock===false` |
| TC-PAY-02 | POST /prepay | mock 模式正常 | 200 | `data.mock=true, prepayId=MOCK_PREPAY_*` |
| TC-PAY-03 | POST /prepay | 无 Token | 401 | — |
| TC-PAY-04 | POST /prepay | 订单不存在 | 404 | `message='订单不存在'` |
| TC-PAY-05 | POST /prepay | 已支付 | 400 | `message='订单已支付或已关闭'` |
| TC-PAY-05b | POST /prepay | 缺 order_id | 400 | `message='缺少 order_id'` |
| TC-PAY-11 | POST /prepay | DB 异常 | 500 | `message含'DB connection lost'` |
| TC-PAY-06 | POST /mock-confirm | mock 成功 | 200 | order.update({status:1,transaction_id:'MOCK_TXN_*'}) |
| TC-PAY-06b | POST /mock-confirm | 缺 order_id | 400 | `message='缺少 order_id'` |
| TC-PAY-07 | POST /mock-confirm | 真实模式 | 403 | `message含'非模拟支付模式'` |
| TC-PAY-08 | POST /mock-confirm | 已付款 | 400 | — |
| TC-PAY-08b | POST /mock-confirm | 用户无此订单 | 404 | — |
| TC-PAY-12 | POST /mock-confirm | DB 异常 | 500 | — |
| TC-PAY-09 | POST /notify | 合法回调 | 200 | CDATA SUCCESS，order.update 被调用 |
| TC-PAY-09b | POST /notify | 无 transaction_id | 200 | `transaction_id===''` |
| TC-PAY-09c | POST /notify | 空 body | 200 | CDATA FAIL（签名失败） |
| TC-PAY-10 | POST /notify | 签名错误 | 200 | CDATA FAIL Sign failed |
| TC-PAY-10b | POST /notify | result_code=FAIL | 200 | order.update 不调用 |
| TC-PAY-10c | POST /notify | 重复回调 | 200 | order.update 不调用（幂等） |
| TC-PAY-13 | POST /notify | DB 异常 | 200 | CDATA FAIL System error |

---

## 4. 集成测试 — 管理端支付配置

测试文件：`tests/integration/admin.pay.test.js`

| 用例编号 | 接口 | 场景 | 预期状态码 |
|----------|------|------|-----------|
| TC-ADMIN-01-1 | GET /mock-mode | 正常查询 | 200，含 mock 布尔 |
| TC-ADMIN-01-2 | GET /mock-mode | DB=true | 200，mock=true |
| TC-ADMIN-01-3 | GET /mock-mode | DB=false | 200，mock=false |
| TC-ADMIN-02 | PUT /mock-mode | mock=true | 200，upsert 含 value='true' |
| TC-ADMIN-03 | PUT /mock-mode | mock=false | 200，upsert 含 value='false' |
| TC-ADMIN-03b | PUT /mock-mode | description 字段 | 200，upsert 含 description |
| TC-ADMIN-04-1 | GET /mock-mode | 无 Token | 401 |
| TC-ADMIN-04-2 | PUT /mock-mode | 无效 Token | 401 |
| TC-ADMIN-04-3 | GET /mock-mode | 禁用账号 | 401 |
| TC-ADMIN-05-1 | PUT /mock-mode | DB 写入失败 | 500 |
| TC-ADMIN-05-2 | GET /mock-mode | DB 读取失败降级 | 200（回退 ENV） |

---

## 5. 集成测试 — 极端错误路径

测试文件：`tests/integration/pay.errorEdge.test.js`

| 用例编号 | 接口 | 场景 | 预期 |
|----------|------|------|------|
| TC-EDGE-01 | GET /pay/mock-mode（用户端） | wechatPay service 直接抛出 | 500 |
| TC-EDGE-02 | GET /pay/mock-mode（管理端） | wechatPay service 直接抛出 | 500 |

---

## 6. 测试覆盖范围说明

### 覆盖率（v1.2.0 最终结果）

| 文件 | 语句 | 分支 | 函数 | 行 |
|------|------|------|------|----|
| `payConfig.js` | 100% | 100% | 100% | 100% |
| `pay.js` | 100% | 100% | 100% | 100% |
| `wechatPay.js` | 100% | 97.2%* | 100% | 100% |

> *剩余 2.8% 为 `randomStr(len = 16)` 默认参数的 Istanbul 编译器分支，属工具无法规避的计数器产物，不影响实际逻辑覆盖。

### 已自动化覆盖

| 功能点 | 方式 |
|--------|------|
| XML 解析（含 CDATA、去重、空串） | 单元测试 |
| MD5 签名验证（正/负/篡改/空字段） | 单元测试 |
| isMockMode 优先级（DB > ENV，异常降级） | 单元测试 |
| mock 预支付参数生成 | 单元 + 集成 |
| mock 退款 | 单元 + 集成 |
| 真实统一下单（HTTPS Mock，含全部错误分支） | 单元测试 |
| 真实退款（HTTPS Mock，含全部错误分支） | 单元测试 |
| 支付路由完整 HTTP 流程（11 场景） | 集成测试 |
| 管理端切换路由（含鉴权，11 场景） | 集成测试 |
| 极端错误路径 next(err)（catch 兜底） | 集成测试 |

### 仍需手动验证（依赖外部服务）

| 项目 | 原因 |
|------|------|
| 真实微信收银台调起 | 微信小程序原生 API |
| 微信沙箱端到端支付 | 需真实商户证书 |
| 退款双向 SSL 证书 | 需 PFX 文件 |
