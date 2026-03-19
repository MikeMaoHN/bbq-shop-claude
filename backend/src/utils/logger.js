/**
 * 后端日志工具
 */
const fs = require('fs')
const path = require('path')

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

class Logger {
  constructor(module, level = LogLevel.ERROR) {
    this.module = module
    this.level = level
    this.enabled = true
    this.logFile = path.join(__dirname, '../../logs/app.log')
    
    // 确保日志目录存在
    const logDir = path.dirname(this.logFile)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
  }

  _formatLevel(level) {
    const levels = {
      0: 'DEBUG',
      1: 'INFO',
      2: 'WARN',
      3: 'ERROR'
    }
    return levels[level] || 'DEBUG'
  }

  _getTime() {
    return new Date().toLocaleString('zh-CN', { hour12: false })
  }

  _writeToLog(message) {
    try {
      fs.appendFileSync(this.logFile, message + '\n')
    } catch (e) {
      // 忽略写入错误
    }
  }

  _log(level, message, ...args) {
    if (!this.enabled || level < this.level) return

    const timestamp = this._getTime()
    const levelStr = this._formatLevel(level)
    const prefix = `[${timestamp}] [${this.module}] [${levelStr}]`
    const logMessage = `${prefix} ${message}`
    
    // 控制台输出
    const consoleArgs = [prefix, message, ...args]
    switch (level) {
      case LogLevel.ERROR:
        console.error(...consoleArgs)
        break
      case LogLevel.WARN:
        console.warn(...consoleArgs)
        break
      default:
        console.log(...consoleArgs)
    }
    
    // 文件记录
    this._writeToLog(logMessage)
    
    // 记录额外参数到文件
    if (args.length > 0) {
      const argsStr = args.map(arg => {
        try {
          return typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        } catch (e) {
          return String(arg)
        }
      }).join(' ')
      this._writeToLog(`  ${argsStr}`)
    }
  }

  debug(message, ...args) {
    this._log(LogLevel.DEBUG, message, ...args)
  }

  info(message, ...args) {
    this._log(LogLevel.INFO, message, ...args)
  }

  warn(message, ...args) {
    this._log(LogLevel.WARN, message, ...args)
  }

  error(message, ...args) {
    this._log(LogLevel.ERROR, message, ...args)
  }
}

module.exports = Logger
