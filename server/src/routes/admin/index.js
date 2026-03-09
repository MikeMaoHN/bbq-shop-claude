const express = require('express');
const { authAdmin } = require('../../middleware/auth');

const router = express.Router();

// 公开路由
router.use('/auth', require('./auth'));

// 需要登录的路由
router.use('/dashboard', authAdmin, require('./dashboard'));
router.use('/products', authAdmin, require('./product'));
router.use('/categories', authAdmin, require('./category'));
router.use('/orders', authAdmin, require('./order'));
router.use('/users', authAdmin, require('./user'));
router.use('/banners', authAdmin, require('./banner'));
router.use('/coupons', authAdmin, require('./coupon'));
router.use('/admins', authAdmin, require('./adminManager'));
router.use('/settings', authAdmin, require('./setting'));
router.use('/upload', authAdmin, require('./upload'));
router.use('/pay', authAdmin, require('./payConfig'));

module.exports = router;
