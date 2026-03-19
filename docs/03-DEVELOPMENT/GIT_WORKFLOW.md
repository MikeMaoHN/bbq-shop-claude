# Git 工作流规范

## 分支策略

```
main (生产分支，受保护)
  │
  ├── develop (开发分支)
  │     │
  │     ├── feature/{功能名}
  │     ├── bugfix/{问题 ID}
  │     └── hotfix/{紧急问题}
  │
  └── release/v{版本} (发布分支)
```

---

## 分支说明

| 分支 | 命名 | 来源 | 合并目标 | 说明 |
|------|------|------|----------|------|
| 生产分支 | main | - | - | 生产环境代码，受保护 |
| 开发分支 | develop | main | main | 日常开发集成分支 |
| 功能分支 | feature/* | develop | develop | 新功能开发 |
| 修复分支 | bugfix/* | develop | develop | Bug 修复 |
| 热修复分支 | hotfix/* | main | main, develop | 生产紧急修复 |
| 发布分支 | release/v* | develop | main, develop | 版本发布准备 |

---

## 开发流程

### 1. 新功能开发

```bash
# 从 develop 创建功能分支
git checkout develop
git pull
git checkout -b feature/order-refund

# 开发完成后提交
git add .
git commit -m "feat(order): 新增订单退款功能"
git push origin feature/order-refund

# 创建 Pull Request 到 develop
# Code Review 通过后合并
```

### 2. Bug 修复

```bash
# 从 develop 创建修复分支
git checkout develop
git pull
git checkout -b bugfix/130

# 修复后提交
git add .
git commit -m "fix(cart): 修复购物车重复添加 #130"
git push origin bugfix/130

# 创建 PR 到 develop
```

### 3. 生产热修复

```bash
# 从 main 创建热修复分支
git checkout main
git pull
git checkout -b hotfix/payment-callback

# 修复后提交
git add .
git commit -m "fix(payment): 修复支付回调重复处理 #131"
git push origin hotfix/payment-callback

# 创建 PR 到 main 和 develop
```

### 4. 版本发布

```bash
# 从 develop 创建发布分支
git checkout develop
git pull
git checkout -b release/v1.2.0

# 进行最终测试和文档更新
git add .
git commit -m "docs(changelog): v1.2.0 发布准备"

# 测试通过后合并到 main 和 develop
git checkout main
git merge release/v1.2.0
git tag v1.2.0
git push origin main --tags

git checkout develop
git merge release/v1.2.0
git push origin develop

# 删除发布分支
git branch -d release/v1.2.0
```

---

## 提交规范

### 格式

```
<type>(<scope>): <subject>
```

### 类型说明

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档更新 |
| style | 代码格式（不影响逻辑） |
| refactor | 重构 |
| test | 测试相关 |
| chore | 构建/工具/配置 |

### 作用域说明

| 作用域 | 说明 |
|--------|------|
| order | 订单模块 |
| cart | 购物车模块 |
| product | 商品模块 |
| user | 用户模块 |
| payment | 支付模块 |
| admin | 管理端 |
| miniprogram | 小程序端 |
| api | 后端 API |

### 提交示例

```bash
# 新功能
git commit -m "feat(order): 新增订单退款功能"

# Bug 修复
git commit -m "fix(cart): 修复购物车数量计算错误 #130"

# 文档更新
git commit -m "docs(api): 更新支付接口文档"

# 测试相关
git commit -m "test(order): 新增订单创建单元测试"

# 代码重构
git commit -m "refactor(payment): 重构支付回调逻辑"

# 综合提交
git commit -m "feat(coupon): 新增优惠券功能

- 新增优惠券表结构和 API
- docs: 同步更新 API_REFERENCE.md 和 CHANGELOG.md"
```

---

## Code Review 规范

### PR 审查清单

```markdown
## 代码审查清单

### 代码质量
- [ ] 代码符合 ESLint 规范
- [ ] 无重复代码 (DRY)
- [ ] 函数职责单一 (SRP)
- [ ] 变量命名清晰

### 安全性
- [ ] 无硬编码敏感信息
- [ ] 输入已验证/过滤
- [ ] SQL 使用参数化查询
- [ ] 认证/授权检查完整

### 测试
- [ ] 新增代码有对应测试
- [ ] 测试覆盖率不降低
- [ ] 关键逻辑有边界测试

### 文档
- [ ] 复杂逻辑有注释
- [ ] API 文档已更新
- [ ] CHANGELOG 已更新
```

### 审查流程

```
提交 PR → 自动触发 CI → Tech Lead Review → Mike 审批 → 合并
   │           │              │              │          │
   │          5min          24h            24h        即时
```

---

## 版本标签

```bash
# 创建版本标签
git tag v1.2.0

# 推送标签
git push origin v1.2.0

# 查看所有标签
git tag -l
```

---

## 冲突处理

### 解决步骤

```bash
# 1. 拉取最新代码
git checkout develop
git pull

# 2. 切换回功能分支
git checkout feature/order-refund

# 3. 合并 develop
git merge develop

# 4. 解决冲突
# 编辑冲突文件，保留需要的代码

# 5. 提交解决
git add .
git commit -m "merge: 解决与 develop 的冲突"

# 6. 推送
git push origin feature/order-refund
```

---

## 紧急回滚

```bash
# 回滚到上一个版本
git revert HEAD

# 强制回滚（谨慎使用）
git reset --hard v1.1.0
```

---

## 分支保护规则

| 规则 | main | develop | 其他 |
|------|------|---------|------|
| 直接推送 | ❌ | ❌ | ✅ |
| PR 审查 | ✅ | ✅ | - |
| CI 通过 | ✅ | ✅ | - |
| 至少 1 人 Review | ✅ | ✅ | - |

---

*最后更新：2024-01-15*
