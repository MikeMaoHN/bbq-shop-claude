# 测试报告 — 微信支付模块

> 项目：烤乐汇（BBQ Shop）
> 模块：微信支付对接（含模拟测试接口）
> 版本：v1.2.0
> 测试执行日期：2026-03-09
> 测试框架：Jest 30.2.0 + Supertest 7.2.2
> 环境：Node.js，内存 Mock（无真实 DB / 网络依赖）

---

## 一、执行摘要

| 指标 | 数值 |
|------|------|
| 测试套件总数 | 5 |
| 测试套件通过 | **5** ✅ |
| 测试用例总数 | **72** |
| 通过 | **72** ✅ |
| 失败 | 0 |
| 总执行时长 | ~0.86 s |
| 整体结论 | **✅ 全部通过** |

---

## 二、代码覆盖率（最终）

```
File                  | Stmts  | Branch | Funcs  | Lines
----------------------|--------|--------|--------|------
routes/admin/
  payConfig.js        | 100.00 | 100.00 | 100.00 | 100.00
routes/api/
  pay.js              | 100.00 | 100.00 | 100.00 | 100.00
services/
  wechatPay.js        | 100.00 |  97.22 | 100.00 | 100.00
----------------------|--------|--------|--------|------
All files             | 100.00 |  98.52 | 100.00 | 100.00
```

> **注**：`wechatPay.js` 剩余 2.78% 分支差距来自 `randomStr(len = 16)` 默认参数声明，
> 这是 Istanbul/V8 覆盖工具对默认参数生成虚拟分支的已知计数问题，
> 该函数仅被内部以显式参数调用，不存在逻辑遗漏。

---

## 三、测试套件与用例详情

### 3.1 单元测试 — 服务层 mock 模式（wechatPay.service.test.js）

| # | 测试组 | 用例 | 结果 |
|---|--------|------|------|
| 1 | XML 工具 | toXml 序列化 | ✅ |
| 2 | XML 工具 | parseXml CDATA 解析 | ✅ |
| 3 | XML 工具 | parseXml 空字符串 | ✅ |
| 4 | XML 工具 | 往返一致性 | ✅ |
| 5 | verifyNotify | 正确签名 | ✅ |
| 6 | verifyNotify | 错误签名 | ✅ |
| 7 | verifyNotify | 篡改参数 | ✅ |
| 8 | isMockMode | DB=true | ✅ |
| 9 | isMockMode | DB=false | ✅ |
| 10 | isMockMode | DB 为空回退 ENV | ✅ |
| 11 | isMockMode | DB 异常降级 | ✅ |
| 12 | createPrepay | mock 返回 mock=true | ✅ |
| 13 | createPrepay | 必要字段完整 | ✅ |
| 14 | createPrepay | 不同订单不同 prepayId | ✅ |
| 15 | processRefund | mock 立即成功 | ✅ |
| 16 | processRefund | 响应时间 <200ms | ✅ |
| 17 | 分支覆盖 | parseXml 同名标签去重 | ✅ |
| 18 | 分支覆盖 | appId 为空时兜底 | ✅ |
| 19 | 分支覆盖 | verifyNotify 含空字段 | ✅ |

**小计：19 / 19**

---

### 3.2 单元测试 — 真实支付路径（wechatPay.realMode.test.js）

| # | 测试组 | 用例 | 结果 |
|---|--------|------|------|
| 20 | createPrepay 真实 | 统一下单成功，JSAPI 参数完整 | ✅ |
| 21 | createPrepay 真实 | return_code=FAIL + return_msg | ✅ |
| 22 | createPrepay 真实 | result_code=FAIL + err_code_des | ✅ |
| 23 | createPrepay 真实 | HTTPS 网络错误 reject | ✅ |
| 24 | createPrepay 真实 | https.request 调用一次 + 正确路径 | ✅ |
| 25 | createPrepay 真实 | ip 缺省使用 127.0.0.1 | ✅ |
| 26 | processRefund 真实 | 退款成功返回 | ✅ |
| 27 | processRefund 真实 | transaction_id 写入请求 XML | ✅ |
| 28 | processRefund 真实 | 无 transaction_id 不写字段 | ✅ |
| 29 | processRefund 真实 | return_code=FAIL 抛出消息 | ✅ |
| 30 | processRefund 真实 | result_code=FAIL 抛出消息 | ✅ |
| 31 | processRefund 真实 | 退款接口路径正确 | ✅ |
| 32 | 错误消息 fallback | 统一下单无 return_msg → 默认消息 | ✅ |
| 33 | 错误消息 fallback | result_code=FAIL 用 err_code | ✅ |
| 34 | 错误消息 fallback | result_code=FAIL 兜底消息 | ✅ |
| 35 | 错误消息 fallback | 退款无 return_msg → 默认消息 | ✅ |
| 36 | 错误消息 fallback | 退款 result_code=FAIL 默认消息 | ✅ |
| 37 | signV2 过滤 | undefined/空串字段被过滤 | ✅ |
| 38 | signV2 过滤 | 含空字段签名正确 | ✅ |

**小计：19 / 19**

---

### 3.3 集成测试 — 小程序支付 API（pay.api.test.js）

| # | 用例 | 结果 |
|---|------|------|
| 39 | GET /mock-mode mock=true | ✅ |
| 40 | GET /mock-mode mock=false | ✅ |
| 41 | POST /prepay mock 正常 | ✅ |
| 42 | POST /prepay 无 Token 401 | ✅ |
| 43 | POST /prepay 订单不存在 404 | ✅ |
| 44 | POST /prepay 已支付 400 | ✅ |
| 45 | POST /prepay 缺 order_id 400 | ✅ |
| 46 | POST /mock-confirm 缺 order_id 400 | ✅ |
| 47 | POST /mock-confirm mock 成功 | ✅ |
| 48 | POST /mock-confirm 真实模式 403 | ✅ |
| 49 | POST /mock-confirm 已付款 400 | ✅ |
| 50 | POST /mock-confirm 不属于用户 404 | ✅ |
| 51 | POST /notify 空 body → FAIL | ✅ |
| 52 | POST /notify 合法回调成功 | ✅ |
| 53 | POST /notify 无 transaction_id → 空串 | ✅ |
| 54 | POST /notify 签名错误 → FAIL | ✅ |
| 55 | POST /notify result_code=FAIL 不更新 | ✅ |
| 56 | POST /notify 重复回调幂等 | ✅ |
| 57 | POST /prepay DB 异常 500 | ✅ |
| 58 | POST /mock-confirm DB 异常 500 | ✅ |
| 59 | POST /notify DB 异常 → FAIL XML | ✅ |

**小计：21 / 21**

---

### 3.4 集成测试 — 管理端支付配置（admin.pay.test.js）

| # | 用例 | 结果 |
|---|------|------|
| 60 | GET /mock-mode 查询正常 | ✅ |
| 61 | GET /mock-mode DB=true | ✅ |
| 62 | GET /mock-mode DB=false | ✅ |
| 63 | PUT /mock-mode 切换为 mock | ✅ |
| 64 | PUT /mock-mode 切换为真实 | ✅ |
| 65 | PUT /mock-mode 写入 description | ✅ |
| 66 | GET /mock-mode 无 Token 401 | ✅ |
| 67 | PUT /mock-mode 无效 Token 401 | ✅ |
| 68 | GET /mock-mode 禁用账号 401 | ✅ |
| 69 | PUT /mock-mode DB 失败 500 | ✅ |
| 70 | GET /mock-mode DB 失败降级 200 | ✅ |

**小计：11 / 11**

---

### 3.5 集成测试 — 极端错误路径（pay.errorEdge.test.js）

| # | 用例 | 结果 |
|---|------|------|
| 71 | GET /pay/mock-mode（用户端）service 抛出 → 500 | ✅ |
| 72 | GET /pay/mock-mode（管理端）service 抛出 → 500 | ✅ |

**小计：2 / 2**

---

## 四、缺陷记录

### v1.1.0 发现并修复

| 编号 | 严重级别 | 描述 | 状态 |
|------|----------|------|------|
| BUG-001 | **P0** | `parseXml()` 可选 CDATA 正则导致字段值为 undefined，微信回调签名必然失败 | ✅ 已修复 |

### v1.2.0 补充测试发现

无新缺陷。通过增量覆盖测试确认原有实现逻辑正确。

---

## 五、用户故事验收矩阵

| 用户故事 | 关联测试 | 状态 |
|----------|----------|------|
| US-001 模拟支付完成 | TC-PAY-02/06/07 | ✅ |
| US-002 真实支付完成 | TC-REAL-01/TC-PAY-09 | ✅ |
| US-003 管理员切换模式 | TC-ADMIN-01~05 | ✅ |
| US-004 回调通知处理 | TC-PAY-09/10/13 | ✅ |
| US-005 退款（mock） | TC-SVC-05/TC-REAL-02 | ✅ |
| US-006 模式优先级控制 | TC-SVC-03 | ✅ |

---

## 六、测试结论

**72 / 72 通过，关键文件语句/函数/行覆盖率 100%，分支覆盖率 98.52%（剩余 1.48% 为工具计数器产物）。**

所有业务逻辑路径（mock 模式、真实模式、错误降级、签名验证、幂等回调）均已通过自动化测试验证。
