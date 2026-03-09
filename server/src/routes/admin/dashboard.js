const express = require('express');
const { Op } = require('sequelize');
const db = require('../../models');
const { success } = require('../../utils/response');

const router = express.Router();

// 数据概览
router.get('/overview', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayOrders, todayRevenue, pendingOrders, totalProducts] = await Promise.all([
      db.Order.count({ where: { created_at: { [Op.gte]: today, [Op.lt]: tomorrow } } }),
      db.Order.sum('pay_amount', {
        where: { created_at: { [Op.gte]: today, [Op.lt]: tomorrow }, status: { [Op.gte]: 1 } },
      }),
      db.Order.count({ where: { status: 1 } }),
      db.Product.count({ where: { status: 1 } }),
    ]);

    success(res, {
      todayOrders,
      todayRevenue: todayRevenue || 0,
      pendingOrders,
      totalProducts,
    });
  } catch (err) {
    next(err);
  }
});

// 销售趋势
router.get('/sales-trend', async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days, 10));
    startDate.setHours(0, 0, 0, 0);

    const orders = await db.Order.findAll({
      attributes: [
        [db.sequelize.fn('DATE', db.sequelize.col('created_at')), 'date'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('pay_amount')), 'amount'],
      ],
      where: {
        created_at: { [Op.gte]: startDate },
        status: { [Op.gte]: 1 },
      },
      group: [db.sequelize.fn('DATE', db.sequelize.col('created_at'))],
      order: [[db.sequelize.fn('DATE', db.sequelize.col('created_at')), 'ASC']],
      raw: true,
    });

    success(res, orders);
  } catch (err) {
    next(err);
  }
});

// 热销排行
router.get('/top-products', async (req, res, next) => {
  try {
    const products = await db.Product.findAll({
      attributes: ['id', 'name', 'price', 'sales', 'images'],
      order: [['sales', 'DESC']],
      limit: 10,
    });
    success(res, products);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
