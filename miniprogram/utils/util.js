/**
 * 格式化时间
 * @param {Date|string|number} date
 * @param {string} fmt - 格式模板，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns {string}
 */
function formatTime(date, fmt = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  if (typeof date === 'string' || typeof date === 'number') {
    date = new Date(date)
  }

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  const pad = n => (n < 10 ? '0' + n : '' + n)

  return fmt
    .replace('YYYY', year)
    .replace('MM', pad(month))
    .replace('DD', pad(day))
    .replace('HH', pad(hour))
    .replace('mm', pad(minute))
    .replace('ss', pad(second))
}

/**
 * 格式化价格
 * @param {number|string} price - 价格（单位：元或分）
 * @param {boolean} inCents - 是否以分为单位，默认false（元）
 * @returns {string} 如 ¥12.50
 */
function formatPrice(price, inCents = false) {
  if (price === undefined || price === null) return '¥0.00'
  let num = Number(price)
  if (isNaN(num)) return '¥0.00'
  if (inCents) num = num / 100
  return '¥' + num.toFixed(2)
}

/**
 * 节流函数
 * @param {Function} fn
 * @param {number} delay - 毫秒
 * @returns {Function}
 */
function throttle(fn, delay = 500) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      return fn.apply(this, args)
    }
  }
}

module.exports = {
  formatTime,
  formatPrice,
  throttle
}
