/**
 * 统一 API 响应格式工具
 * 所有接口返回结构均为 { code, message, data, timestamp }，
 * 前端通过 code 判断业务成功/失败，timestamp 便于日志排查。
 */
class Response {
  /**
   * 成功响应
   * @param {*}      data    - 返回给前端的业务数据
   * @param {string} message - 提示文字，默认 'success'
   * @param {number} code    - 业务状态码，默认 200
   */
  static success(data = null, message = 'success', code = 200) {
    return {
      code,
      message,
      data,
      timestamp: Date.now()
    };
  }

  /**
   * 错误响应
   * @param {string} message - 错误描述（展示给用户/前端）
   * @param {number} code    - 业务错误码，默认 400
   * @param {*}      data    - 附加的错误详情，通常为 null
   */
  static error(message = 'error', code = 400, data = null) {
    return {
      code,
      message,
      data,
      timestamp: Date.now()
    };
  }
}

module.exports = Response;
