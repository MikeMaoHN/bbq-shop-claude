# 监控告警指南

## 监控架构

```
应用层 (Node.js + PM2)
    │
    ├── PM2 监控 (CPU/内存/重启)
    ├── 应用日志 (logs/app.log)
    └── 业务指标 (QPS/错误率)
    │
    ▼
采集层
    │
    ├── pm2-logrotate (日志轮转)
    ├── winston (日志记录)
    └── 自定义指标采集
    │
    ▼
展示层
    │
    ├── PM2 Monitor (pm2 monit)
    ├── 日志文件查看
    └── 告警通知 (邮件/短信)
```

---

## PM2 监控

### 启动监控

```bash
# 查看实时监控
pm2 monit

# 查看日志
pm2 logs bbq-backend

# 查看进程状态
pm2 status
```

### 配置日志轮转

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 告警配置

创建 `pm2-alert.js`：

```javascript
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 587,
  secure: false,
  auth: {
    user: 'alert@yourdomain.com',
    pass: 'password'
  }
})

// 监听 PM2 事件
const pm2 = require('pm2')

pm2.launchBus((err, bus) => {
  bus.on('log:err', (packet) => {
    // 错误日志告警
    sendAlert('应用错误', packet.data)
  })
  
  bus.on('process:exception', (packet) => {
    // 异常告警
    sendAlert('应用异常', packet.data)
  })
})

function sendAlert(subject, body) {
  transporter.sendMail({
    from: 'alert@yourdomain.com',
    to: 'admin@yourdomain.com',
    subject,
    text: body
  })
}
```

---

## 应用监控

### 关键指标

| 指标 | 阈值 | 采集方式 |
|------|------|----------|
| CPU 使用率 | > 80% | PM2 |
| 内存使用率 | > 500MB | PM2 |
| 错误率 | > 5% | 日志分析 |
| 响应时间 | > 2s | 日志分析 |
| 重启次数 | > 3 次/小时 | PM2 |

### 健康检查接口

```javascript
// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  })
})
```

### 定时检查脚本

```bash
#!/bin/bash
# check-health.sh

RESPONSE=$(curl -s http://localhost:3000/api/health)
STATUS=$(echo $RESPONSE | jq -r '.status')

if [ "$STATUS" != "ok" ]; then
  echo "服务异常！" | mail -s "bbq-shop 告警" admin@example.com
fi
```

```bash
# 每 5 分钟检查一次
*/5 * * * * /path/to/check-health.sh
```

---

## 数据库监控

### MySQL 状态检查

```bash
# 检查连接数
mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected'"

# 检查慢查询
mysql -u root -p -e "SELECT * FROM mysql.slow_log"

# 检查表锁
mysql -u root -p -e "SHOW OPEN TABLES WHERE In_use > 0"
```

### 告警阈值

| 指标 | 阈值 |
|------|------|
| 连接数 | > 100 |
| 慢查询 | > 10 个/分钟 |
| 死锁 | > 0 |

---

## 业务监控

### 关键业务指标

| 指标 | 采集点 | 告警阈值 |
|------|--------|----------|
| 订单创建失败 | orderController.create | > 5 次/小时 |
| 支付失败 | payController | > 3 次/小时 |
| 登录失败 | authController | > 10 次/小时 |
| 库存不足 | productController | > 20 次/小时 |

### 错误日志格式

```javascript
// 统一错误日志格式
logger.error('ORDER_CREATE_FAILED', {
  userId: user.id,
  items: items,
  error: err.message,
  timestamp: new Date().toISOString()
})
```

---

## 告警通知

### 邮件告警

```javascript
// 告警模板
const alertTemplate = (level, message, details) => `
【bbq-shop 告警】

级别：${level}
时间：${new Date().toLocaleString('zh-CN')}
消息：${message}

详情:
${JSON.stringify(details, null, 2)}

---
bbq-shop 监控系统
`
```

### 告警分级

| 级别 | 说明 | 通知方式 | 响应时间 |
|------|------|----------|----------|
| P0 | 服务不可用 | 电话 + 短信 + 邮件 | 5 分钟 |
| P1 | 核心功能异常 | 短信 + 邮件 | 30 分钟 |
| P2 | 非核心功能异常 | 邮件 | 2 小时 |
| P3 | 警告信息 | 邮件 | 24 小时 |

---

## 日志管理

### 日志目录结构

```
logs/
├── app.log              # 应用日志
├── error.log            # 错误日志
├── access.log           # 访问日志
└── operation/           # 操作日志
    └── 2024-01/
        └── 15.log
```

### 日志级别

```javascript
const Logger = require('./utils/logger')

const log = new Logger('Module')

log.debug('调试信息')    // 开发环境
log.info('用户登录成功')  // 正常业务
log.warn('Token 即将过期') // 警告
log.error('数据库连接失败') // 错误
```

### 日志查询

```bash
# 查看错误日志
tail -f logs/error.log

# 搜索特定错误
grep "ORDER_CREATE_FAILED" logs/app.log

# 查看最近 100 行
tail -n 100 logs/app.log

# 按日期查询
grep "2024-01-15" logs/app.log
```

---

## 仪表盘

### PM2 自带仪表盘

```bash
pm2 monit
```

显示：
- CPU 使用率
- 内存使用率
- 请求/分钟
- 日志输出

### 自定义监控页面

创建 `monitor.html`：

```html
<!DOCTYPE html>
<html>
<head>
  <title>bbq-shop 监控</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>服务状态</h1>
  <div id="status">加载中...</div>
  
  <h2>内存使用</h2>
  <canvas id="memoryChart"></canvas>
  
  <script>
    async function fetchStatus() {
      const res = await fetch('/api/health')
      const data = await res.json()
      document.getElementById('status').innerText = 
        `状态：${data.status}, 运行时间：${Math.floor(data.uptime/60)}分钟`
    }
    fetchStatus()
    setInterval(fetchStatus, 30000)
  </script>
</body>
</html>
```

---

## 应急响应流程

### P0 级故障

```
1. 收到告警 (电话/短信)
   ↓
2. 确认故障 (查看监控/日志)
   ↓
3. 紧急处理 (重启/回滚)
   ↓
4. 通知相关人员
   ↓
5. 故障分析 (事后总结)
```

### 联系方式

| 角色 | 姓名 | 电话 | 邮箱 |
|------|------|------|------|
| 负责人 | Mike | - | - |
| 技术负责人 | Leia | - | - |

---

## 定期检查清单

### 每日检查

- [ ] 服务状态正常
- [ ] 错误日志无异常增长
- [ ] 数据库连接正常

### 每周检查

- [ ] 日志文件清理（保留 7 天）
- [ ] 数据库备份验证
- [ ] 磁盘空间检查

### 每月检查

- [ ] 性能指标分析
- [ ] 安全漏洞扫描
- [ ] 监控规则优化

---

*最后更新：2024-01-15*
