/**
 * 支付路由 /api/v1/pay
 *
 * POST /prepay          —— 发起预支付（返回调起微信支付所需参数）
 * POST /notify          —— 微信支付异步回调（无需鉴权）
 * POST /mock-confirm    —— 模拟支付成功（仅限 mock 模式）
 * GET  /mock-mode       —— 查询当前是否为 mock 模式
 */
const express = require('express');
const db = require('../../models');
const { authUser } = require('../../middleware/auth');
const { success, fail } = require('../../utils/response');
const wxPay = require('../../services/wechatPay');

const router = express.Router();

// ──────────────────────────────────────────────
// POST /prepay  发起预支付
// ──────────────────────────────────────────────
router.post('/prepay', authUser, async (req, res, next) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return fail(res, '缺少 order_id');

    const order = await db.Order.findOne({ where: { id: order_id, user_id: req.user.id } });
    if (!order) return fail(res, '订单不存在', 404);
    if (order.status !== 0) return fail(res, '订单已支付或已关闭');

    const totalFen = Math.round(parseFloat(order.pay_amount) * 100);
    const openid = req.user.openid;

    const params = await wxPay.createPrepay({
      orderId: order.id,
      orderNo: order.order_no,
      body: '烤乐汇订单',
      totalFen,
      openid,
      ip: req.ip,
    });

    success(res, params);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// POST /notify  微信支付异步回调（不需要鉴权）
// ──────────────────────────────────────────────
router.post('/notify', express.text({ type: 'text/xml' }), async (req, res) => {
  try {
    const params = wxPay.parseXml(req.body || '');

    // 验签
    if (!wxPay.verifyNotify(params)) {
      return res.send(wxPay.toXml({ return_code: 'FAIL', return_msg: 'Sign failed' }));
    }

    if (params.result_code === 'SUCCESS') {
      const order = await db.Order.findOne({ where: { order_no: params.out_trade_no } });
      if (order && order.status === 0) {
        await order.update({
          status: 1,
          pay_time: new Date(),
          transaction_id: params.transaction_id || '',
        });
      }
    }

    res.send(wxPay.toXml({ return_code: 'SUCCESS', return_msg: 'OK' }));
  } catch (err) {
    console.error('[pay/notify error]', err);
    res.send(wxPay.toXml({ return_code: 'FAIL', return_msg: 'System error' }));
  }
});

// ──────────────────────────────────────────────
// POST /mock-confirm  模拟支付成功（仅 mock 模式可用）
// ──────────────────────────────────────────────
router.post('/mock-confirm', authUser, async (req, res, next) => {
  try {
    const mock = await wxPay.isMockMode();
    if (!mock) return fail(res, '当前非模拟支付模式，禁止调用', 403);

    const { order_id } = req.body;
    if (!order_id) return fail(res, '缺少 order_id');

    const order = await db.Order.findOne({ where: { id: order_id, user_id: req.user.id } });
    if (!order) return fail(res, '订单不存在', 404);
    if (order.status !== 0) return fail(res, '订单已支付或已关闭');

    await order.update({
      status: 1,
      pay_time: new Date(),
      transaction_id: `MOCK_TXN_${order.order_no}`,
    });

    success(res, null, '模拟支付成功');
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// GET /mock-mode  查询当前支付模式（无需鉴权）
// ──────────────────────────────────────────────
router.get('/mock-mode', async (req, res, next) => {
  try {
    const mock = await wxPay.isMockMode();
    success(res, { mock });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
