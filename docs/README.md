# bbq-shop 项目文档中心

本目录包含 bbq-shop 烧烤食材售卖系统的全部过程资产文档。

---

## 文档导航

### 📱 产品文档 `01-PRODUCT/`

| 文档 | 说明 | 负责人 |
|------|------|--------|
| [PRD.md](01-PRODUCT/PRD.md) | 产品需求文档 | Product Manager |
| [CHANGELOG.md](01-PRODUCT/CHANGELOG.md) | 版本变更日志 | Tech Lead |

### 🏗️ 架构文档 `02-ARCHITECTURE/`

| 文档 | 说明 | 负责人 |
|------|------|--------|
| [SYSTEM_DESIGN.md](02-ARCHITECTURE/SYSTEM_DESIGN.md) | 系统设计文档 | Architect |
| [API_REFERENCE.md](02-ARCHITECTURE/API_REFERENCE.md) | API 接口文档 | Backend Lead |
| [DATABASE_SCHEMA.md](02-ARCHITECTURE/DATABASE_SCHEMA.md) | 数据库设计文档 | Architect |

### 💻 开发文档 `03-DEVELOPMENT/`

| 文档 | 说明 | 负责人 |
|------|------|--------|
| [DEV_LOG.md](03-DEVELOPMENT/DEV_LOG.md) | 开发日志 | Coder |
| [CODING_STANDARDS.md](03-DEVELOPMENT/CODING_STANDARDS.md) | 编码规范 | Tech Lead |
| [GIT_WORKFLOW.md](03-DEVELOPMENT/GIT_WORKFLOW.md) | Git 工作流 | Tech Lead |

### 🚀 运维文档 `04-OPERATIONS/`

| 文档 | 说明 | 负责人 |
|------|------|--------|
| [DEPLOYMENT.md](04-OPERATIONS/DEPLOYMENT.md) | 部署指南 | DevOps |
| [SECURITY.md](04-OPERATIONS/SECURITY.md) | 安全说明 | DevOps |
| [MONITORING.md](04-OPERATIONS/MONITORING.md) | 监控告警 | DevOps |

### 🧪 测试资产 `../test-assets/`

| 资产 | 说明 | 负责人 |
|------|------|--------|
| [test-cases/](../test-assets/test-cases/) | 测试用例 | QA Lead |
| [test-reports/](../test-assets/test-reports/) | 测试报告 | QA Lead |
| [traceability-matrix.md](../test-assets/traceability-matrix.md) | 需求追溯矩阵 | QA Lead |

---

## 文档更新规范

### 更新时机

| 变更类型 | 需更新的文档 |
|----------|-------------|
| 新增 API 接口 | API_REFERENCE.md |
| 数据库表结构变更 | DATABASE_SCHEMA.md |
| 新功能发布 | CHANGELOG.md + PRD.md |
| Bug 修复 | CHANGELOG.md |
| 架构调整 | SYSTEM_DESIGN.md |

### 提交流程

```bash
# 1. 更新文档
git add docs/

# 2. 提交（使用 docs 类型）
git commit -m "docs(api): 新增订单退款接口文档"

# 3. PR 审查时检查文档完整性
```

### 审查清单

PR 合并前必须确认：
- [ ] 相关文档已更新
- [ ] 文档中的代码示例可运行
- [ ] CHANGELOG.md 已记录变更
- [ ] 无敏感信息泄露

---

## 版本归档

每个发布版本的文档快照归档至：
```
docs/archive/v{版本号}/
```

---

## 联系方式

| 角色 | 联系人 |
|------|--------|
| Product Manager | Mike |
| Tech Lead | Leia |

---

*最后更新：2024-01-15*
