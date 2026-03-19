# 测试运行脚本

## 运行所有测试
```bash
npm test
```

## 运行单元测试
```bash
npm run test:unit
```

## 运行集成测试
```bash
npm run test:integration
```

## 监听模式（开发时使用）
```bash
npm run test:watch
```

## 查看测试覆盖率
```bash
npm test -- --coverage
```

覆盖率报告将生成在 `coverage/` 目录中。

## 测试文件结构

```
__tests__/
├── unit/                   # 单元测试
│   ├── middleware.test.js  # 中间件测试
│   ├── auth.test.js        # 认证测试
│   └── order.test.js       # 订单模型测试
└── integration/            # 集成测试
    ├── api.test.js         # API 端点测试
    └── order-flow.test.js  # 订单流程测试
```

## 测试覆盖率目标

- 语句覆盖率：> 50%
- 分支覆盖率：> 50%
- 函数覆盖率：> 50%
- 行覆盖率：> 50%

## 常见问题

### 1. 测试失败：Cannot find module
确保已安装所有依赖：
```bash
npm install
```

### 2. 数据库连接错误
测试使用 Mock 数据库，不需要真实连接。

### 3. Token 相关测试失败
单元测试中的 Token 是 Mock 的，不代表真实场景。
