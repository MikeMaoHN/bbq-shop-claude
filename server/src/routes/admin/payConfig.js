/**
 * 管理端 — 支付配置路由 /api/admin/pay
 *
 * GET  /mock-mode   查询当前模式
 * PUT  /mock-mode   切换 mock 模式（写入 settings 表，运行时即生效）
 */
const express = require('express');
const db = require('../../models');
const { success } = require('../../utils/response');
const wxPay = require('../../services/wechatPay');

const router = express.Router();

router.get('/mock-mode', async (req, res, next) => {
  try {
    const mock = await wxPay.isMockMode();
    success(res, { mock });
  } catch (err) {
    next(err);
  }
});

router.put('/mock-mode', async (req, res, next) => {
  try {
    const { mock } = req.body;
    const value = mock ? 'true' : 'false';
    await db.Setting.upsert({ key: 'pay_mock_mode', value, description: '支付模拟模式开关' });
    success(res, { mock: mock === true || mock === 'true' }, `已切换为${mock ? '模拟' : '真实'}支付模式`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
