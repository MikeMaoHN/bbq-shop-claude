const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const homeRoutes = require('./home');
const productRoutes = require('./product');
const cartRoutes = require('./cart');
const addressRoutes = require('./address');
const orderRoutes = require('./order');
const couponRoutes = require('./coupon');
const userRoutes = require('./user');
const payRoutes = require('./pay');

router.use('/auth', authRoutes);
router.use('/home', homeRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/addresses', addressRoutes);
router.use('/orders', orderRoutes);
router.use('/coupons', couponRoutes);
router.use('/user', userRoutes);
router.use('/pay', payRoutes);

module.exports = router;
