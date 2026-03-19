/**
 * 前端日志工具
 */
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
    return new Date().toLocaleTimeString('zh-CN', { hour12: false })
  }

  _log(level, message, ...args) {
    if (!this.enabled || level < this.level) return

    const prefix = `[${this._getTime()}] [${this.module}] [${this._formatLevel(level)}]`
    const logArgs = [prefix, message, ...args]

    switch (level) {
      case LogLevel.ERROR:
        console.error(...logArgs)
        break
      case LogLevel.WARN:
        console.warn(...logArgs)
        break
      default:
        console.log(...logArgs)
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

  group(label) {
    console.group(`[${this.module}] ${label}`)
  }

  groupEnd() {
    console.groupEnd()
  }
}

// 创建全局日志实例
const loggers = {}

export function createLogger(module) {
  if (!loggers[module]) {
    loggers[module] = new Logger(module)
  }
  return loggers[module]
}

export default Logger
