/**
 * 应用入口
 */
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const https = require('https')
const config = require('./config')
const Logger = require('./utils/logger')
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler')
const { apiLimiter } = require('./middleware/rateLimiter')
const { tokenRefreshMiddleware } = require('./middleware/auth')
const log = new Logger('Server')

const apiRoutes = require('./routes/index')
const adminRoutes = require('./routes/admin')

// HTTPS 配置（仅当证书文件存在时启用，测试/开发环境可不配置证书）
const certPath = path.join(__dirname, '../../certs/server.crt');
const keyPath = path.join(__dirname, '../../certs/server.key');
const httpsEnabled = fs.existsSync(certPath) && fs.existsSync(keyPath);
const httpsOptions = httpsEnabled
  ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
  : null;

const app = express()

// CORS 配置：生产环境通过 CORS_ORIGIN 环境变量指定允许的域名（逗号分隔），开发环境设置 CORS_ORIGIN=* 允许所有
const allowedOrigins = config.cors.origin === '*'
  ? null
  : config.cors.origin.split(',').map(s => s.trim())

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true) // 服务端对服务端请求
    if (!allowedOrigins) return callback(null, true) // 允许所有
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS policy: origin ${origin} not allowed`))
  },
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Token 自动刷新中间件（在认证路由之前）
app.use(tokenRefreshMiddleware)

// API 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    log.info(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`)
  })
  next()
})

// 静态文件服务（上传的图片）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/images', express.static(path.join(__dirname, '../../miniprogram/images')))

// API 限流
app.use('/api', apiLimiter)
app.use('/admin/api', apiLimiter)

// API 路由
app.use('/api', apiRoutes)
app.use('/admin/api', adminRoutes)

// 健康检查（不限流）
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 处理
app.use(notFoundHandler)

// 全局错误处理
app.use(errorHandler)

// 测试环境下不启动 HTTP 服务，避免端口冲突（supertest 会自行管理端口）
if (process.env.NODE_ENV !== 'test') {
  const httpServer = app.listen(config.port, () => {
    log.info('╔════════════════════════════════════════════╗')
    log.info('║         烧烤食材售卖系统 - 后端服务          ║')
    log.info('╠════════════════════════════════════════════╣')
    log.info(`║  运行环境：${config.nodeEnv.padEnd(20)}║`)
    log.info(`║  HTTP 端口：${String(config.port).padEnd(17)}║`)
    log.info(`║  HTTPS 端口：${httpsEnabled ? String(config.port + 1) : '未启用（无证书）'}`)
    log.info(`║  启动时间：${new Date().toLocaleString('zh-CN').padEnd(14)}║`)
    log.info('╚════════════════════════════════════════════╝')
    log.info('服务已启动，等待请求...')
    log.info('日志文件：logs/app.log')
  })

  let httpsServer = null;
  if (httpsEnabled) {
    httpsServer = https.createServer(httpsOptions, app).listen(config.port + 1, () => {
      log.info(`HTTPS 服务已启动，端口：${config.port + 1}`)
    })
  }

  const gracefulShutdown = (signal) => {
    log.info(`收到 ${signal} 信号，正在关闭服务...`)
    const closeHttp = () => httpServer.close(() => {
      log.info('服务已关闭')
      process.exit(0)
    })
    if (httpsServer) {
      httpsServer.close(closeHttp)
    } else {
      closeHttp()
    }
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
}

module.exports = app
