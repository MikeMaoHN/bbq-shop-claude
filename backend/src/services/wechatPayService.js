/**
 * 微信支付服务
 * 基于微信支付 V3 API 实现
 * 文档：https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml
 */
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const config = require('../config');
const Logger = require('../utils/logger');
const log = new Logger('WeChatPayService');

class WeChatPayService {
  constructor() {
    this.mchid = config.wxPay.mchid;
    this.serialNo = config.wxPay.serialNo; // 商户证书序列号
    this.privateKeyPath = config.wxPay.privateKeyPath; // 商户私钥路径
    this.privateKey = fs.readFileSync(this.privateKeyPath, 'utf8');
    this.notifyUrl = config.wxPay.notifyUrl;
    this.baseURL = 'https://api.mch.weixin.qq.com/v3';
  }

  /**
   * 生成签名
   */
  sign(message) {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(message);
    return sign.sign(this.privateKey, 'base64');
  }

  /**
   * 生成随机字符串
   */
  generateNonceStr() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * 生成签名时间戳
   */
  getTimestamp() {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * 构建微信支付请求头
   */
  buildAuthorization(method, url, body = '') {
    const nonceStr = this.generateNonceStr();
    const timestamp = this.getTimestamp();
    const bodyStr = body ? JSON.stringify(body) : '';
    
    // 构建签名原文
    const signMessage = [
      method.toUpperCase(),
      url.replace('https://api.mch.weixin.qq.com', ''),
      timestamp,
      nonceStr,
      bodyStr
    ].join('\n');

    const signature = this.sign(signMessage);

    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `WECHATPAY2-SHA256-RSA2048 mchid="${this.mchid}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.serialNo}"`,
      'Wechatpay-Serial': this.serialNo
    };
  }

  /**
   * 创建 JSAPI 支付订单（小程序支付）
   * @param {Object} params - 订单参数
   * @param {string} params.outTradeNo - 商户订单号
   * @param {number} params.totalAmount - 订单金额（分）
   * @param {string} params.openid - 用户 openid
   * @param {string} params.description - 商品描述
   * @returns {Object} 支付参数
   */
  async createJSAPIOrder(params) {
    const { outTradeNo, totalAmount, openid, description } = params;

    const requestBody = {
      mchid: this.mchid,
      out_trade_no: outTradeNo,
      appid: config.wx.appid,
      description,
      notify_url: this.notifyUrl,
      amount: {
        total: totalAmount,
        currency: 'CNY'
      },
      payer: {
        openid
      }
    };

    const url = `${this.baseURL}/pay/transactions/jsapi`;
    const headers = this.buildAuthorization('POST', url, requestBody);

    try {
      const response = await axios.post(url, requestBody, { headers });
      
      if (response.data && response.data.prepay_id) {
        // 返回小程序支付所需参数
        return this.buildWechatPayParams(response.data.prepay_id);
      }

      throw new Error('创建支付订单失败');
    } catch (error) {
      log.error('创建支付订单错误:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 构建小程序支付参数
   */
  buildWechatPayParams(prepayId) {
    const nonceStr = this.generateNonceStr();
    const timestamp = this.getTimestamp();
    const pkg = `prepay_id=${prepayId}`;

    // 生成支付签名
    const signMessage = [
      config.wx.appid,
      timestamp,
      nonceStr,
      pkg
    ].join('\n');

    const paySign = this.sign(signMessage);

    return {
      appId: config.wx.appid,
      timeStamp: timestamp.toString(),
      nonceStr,
      package: pkg,
      signType: 'RSA',
      paySign
    };
  }

  /**
   * 查询订单状态
   */
  async queryOrder(outTradeNo) {
    const url = `${this.baseURL}/pay/transactions/out-trade-no/${outTradeNo}?mchid=${this.mchid}`;
    const headers = this.buildAuthorization('GET', url);

    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      log.error('查询订单错误:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 关闭订单
   */
  async closeOrder(outTradeNo) {
    const url = `${this.baseURL}/pay/transactions/out-trade-no/${outTradeNo}/close`;
    const requestBody = { mchid: this.mchid };
    const headers = this.buildAuthorization('POST', url, requestBody);

    try {
      await axios.post(url, requestBody, { headers });
      return { success: true };
    } catch (error) {
      log.error('关闭订单错误:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 验证支付回调签名
   */
  verifyCallback(headers, body) {
    const signature = headers['wechatpay-signature'];
    const nonce = headers['wechatpay-nonce'];
    const timestamp = headers['wechatpay-timestamp'];
    const serialNo = headers['wechatpay-serial'];
    
    // 验证证书序列号
    if (serialNo !== this.serialNo) {
      log.error('证书序列号不匹配');
      return false;
    }

    // 构建签名原文
    const signMessage = [
      timestamp,
      nonce,
      body
    ].join('\n');

    // 验证签名
    const publicKey = this.privateKey.replace('RSA PRIVATE KEY', 'PUBLIC KEY');
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(signMessage);
    
    try {
      const result = verify.verify(
        Buffer.from(publicKey, 'utf8'),
        signature,
        'base64'
      );
      
      if (!result) {
        log.error('签名验证失败');
      }
      
      return result;
    } catch (error) {
      log.error('验证回调签名错误:', error.message);
      return false;
    }
  }

  /**
   * 处理支付回调
   */
  async handleCallback(req) {
    const headers = req.headers;
    const body = JSON.stringify(req.body);

    // 验证签名
    if (!this.verifyCallback(headers, body)) {
      throw new Error('签名验证失败');
    }

    const { resource } = req.body;
    
    // 解密回调数据
    const algorithm = 'aes-256-gcm';
    const decipher = crypto.createDecipheriv(
      algorithm,
      config.wxPay.apiKey,
      Buffer.from(resource.nonce, 'base64'),
      Buffer.from(resource.associated_data, 'base64')
    );
    
    let decrypted = decipher.update(resource.ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    const data = JSON.parse(decrypted);

    return {
      transactionId: data.transaction_id,
      outTradeNo: data.out_trade_no,
      tradeState: data.trade_state,
      amount: data.amount,
      successTime: data.success_time
    };
  }

  /**
   * 构建回调响应
   */
  buildCallbackResponse() {
    return {
      code: 'SUCCESS',
      message: 'OK'
    };
  }

  /**
   * 申请退款
   */
  async createRefund(params) {
    const { outTradeNo, outRefundNo, totalAmount, refundAmount, reason } = params;

    const requestBody = {
      out_trade_no: outTradeNo,
      out_refund_no: outRefundNo,
      amount: {
        refund: refundAmount,
        total: totalAmount,
        currency: 'CNY'
      },
      reason
    };

    const url = `${this.baseURL}/refund/domestic/refunds`;
    const headers = this.buildAuthorization('POST', url, requestBody);

    try {
      const response = await axios.post(url, requestBody, { headers });
      return response.data;
    } catch (error) {
      log.error('申请退款错误:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = WeChatPayService;
