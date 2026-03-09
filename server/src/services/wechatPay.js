/**
 * 微信支付服务
 * 支持真实支付和模拟测试两种模式
 * 模式优先级：DB 设置（运行时） > 环境变量（启动默认）
 */
const crypto = require('crypto');
const https = require('https');
const db = require('../models');

// ──────────────────────────────────────────────
// 辅助函数
// ──────────────────────────────────────────────

function randomStr(len = 16) {
  return crypto.randomBytes(len).toString('hex').slice(0, len);
}

function timestamp() {
  return String(Math.floor(Date.now() / 1000));
}

/** 微信支付 v2 签名（MD5） */
function signV2(params, key) {
  const str =
    Object.keys(params)
      .filter((k) => params[k] !== undefined && params[k] !== '')
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&') + `&key=${key}`;
  return crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
}

/** 拼装 XML */
function toXml(obj) {
  const body = Object.entries(obj)
    .map(([k, v]) => `<${k}><![CDATA[${v}]]></${k}>`)
    .join('');
  return `<xml>${body}</xml>`;
}

/** 解析 XML（支持 CDATA 包裹和普通文本，避免引入 xml2js 依赖） */
function parseXml(xml) {
  const result = {};
  // 匹配 CDATA 包裹：<key><![CDATA[value]]></key>
  const cdataRe = /<(\w+)><!\[CDATA\[([\s\S]*?)\]\]><\/\1>/g;
  // 匹配纯文本：<key>value</key>
  const plainRe = /<(\w+)>([^<]*)<\/\1>/g;
  let m;
  while ((m = cdataRe.exec(xml)) !== null) result[m[1]] = m[2];
  while ((m = plainRe.exec(xml)) !== null) {
    if (!(m[1] in result)) result[m[1]] = m[2];
  }
  return result;
}

/** HTTPS POST（用于微信统一下单） */
function httpsPost(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ──────────────────────────────────────────────
// 模式检测（每次请求动态读取 DB）
// ──────────────────────────────────────────────

const config = require('../config');

async function isMockMode() {
  try {
    const row = await db.Setting.findOne({ where: { key: 'pay_mock_mode' } });
    if (row) return row.value === 'true' || row.value === '1';
  } catch (_) {}
  // 回退到环境变量
  return config.wx.payMock === true;
}

// ──────────────────────────────────────────────
// 真实支付 – 微信统一下单 v2
// ──────────────────────────────────────────────

async function realUnifiedOrder({ orderId, orderNo, body, totalFen, openid, ip }) {
  const { appId, mchId, mchKey, notifyUrl } = config.wx;
  const nonceStr = randomStr(32);
  const params = {
    appid: appId,
    mch_id: mchId,
    nonce_str: nonceStr,
    body,
    out_trade_no: orderNo,
    total_fee: String(totalFen),
    spbill_create_ip: ip || '127.0.0.1',
    notify_url: notifyUrl,
    trade_type: 'JSAPI',
    openid,
  };
  params.sign = signV2(params, mchKey);

  const xml = toXml(params);
  const respXml = await httpsPost(
    {
      hostname: 'api.mch.weixin.qq.com',
      path: '/pay/unifiedorder',
      method: 'POST',
      headers: { 'Content-Type': 'text/xml', 'Content-Length': Buffer.byteLength(xml) },
    },
    xml,
  );

  const resp = parseXml(respXml);
  if (resp.return_code !== 'SUCCESS') throw new Error(resp.return_msg || '统一下单失败');
  if (resp.result_code !== 'SUCCESS') throw new Error(resp.err_code_des || resp.err_code || '统一下单业务失败');

  return buildJsapiParams(resp.prepay_id, appId, mchKey);
}

/** 根据 prepay_id 生成小程序调起支付的参数包 */
function buildJsapiParams(prepayId, appId, mchKey) {
  const nonceStr = randomStr(16);
  const ts = timestamp();
  const pkg = `prepay_id=${prepayId}`;
  const signParams = { appId, timeStamp: ts, nonceStr, package: pkg, signType: 'MD5' };
  const paySign = signV2(signParams, mchKey);
  return { prepayId, appId, timeStamp: ts, nonceStr, package: pkg, signType: 'MD5', paySign };
}

// ──────────────────────────────────────────────
// 真实退款 – 微信退款 v2
// ──────────────────────────────────────────────

async function realRefund({ orderNo, transactionId, totalFen, refundFen, refundNo }) {
  const { appId, mchId, mchKey } = config.wx;
  const nonceStr = randomStr(32);
  const params = {
    appid: appId,
    mch_id: mchId,
    nonce_str: nonceStr,
    out_trade_no: orderNo,
    out_refund_no: refundNo,
    total_fee: String(totalFen),
    refund_fee: String(refundFen),
  };
  if (transactionId) params.transaction_id = transactionId;
  params.sign = signV2(params, mchKey);

  const xml = toXml(params);
  // 退款接口要求双向证书，此处仅做接口调用结构；真实环境需传 pfx 证书
  const respXml = await httpsPost(
    {
      hostname: 'api.mch.weixin.qq.com',
      path: '/secapi/pay/refund',
      method: 'POST',
      headers: { 'Content-Type': 'text/xml', 'Content-Length': Buffer.byteLength(xml) },
    },
    xml,
  );

  const resp = parseXml(respXml);
  if (resp.return_code !== 'SUCCESS') throw new Error(resp.return_msg || '退款请求失败');
  if (resp.result_code !== 'SUCCESS') throw new Error(resp.err_code_des || '退款失败');
  return resp;
}

// ──────────────────────────────────────────────
// 回调签名验证
// ──────────────────────────────────────────────

function verifyNotify(params) {
  const { sign, ...rest } = params;
  const expected = signV2(rest, config.wx.mchKey);
  return expected === sign;
}

// ──────────────────────────────────────────────
// 模拟支付参数（Mock）
// ──────────────────────────────────────────────

function mockPayParams(orderId, orderNo) {
  return {
    mock: true,
    prepayId: `MOCK_PREPAY_${orderNo}`,
    appId: config.wx.appId || 'wx_mock_appid',
    timeStamp: timestamp(),
    nonceStr: randomStr(16),
    package: `prepay_id=MOCK_PREPAY_${orderNo}`,
    signType: 'MD5',
    paySign: 'MOCK_SIGN',
    orderId,
    orderNo,
  };
}

// ──────────────────────────────────────────────
// 对外暴露的统一接口
// ──────────────────────────────────────────────

async function createPrepay({ orderId, orderNo, body, totalFen, openid, ip }) {
  const mock = await isMockMode();
  if (mock) return mockPayParams(orderId, orderNo);
  return realUnifiedOrder({ orderId, orderNo, body, totalFen, openid, ip });
}

async function processRefund({ orderNo, transactionId, totalFen, refundFen, refundNo }) {
  const mock = await isMockMode();
  if (mock) {
    // 模拟模式直接返回成功
    return { mock: true, result_code: 'SUCCESS', refund_no: refundNo };
  }
  return realRefund({ orderNo, transactionId, totalFen, refundFen, refundNo });
}

module.exports = { isMockMode, createPrepay, processRefund, verifyNotify, parseXml, toXml };
