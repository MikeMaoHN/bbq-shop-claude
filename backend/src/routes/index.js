/**
 * 小程序端路由
 */
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { loginLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');
const { 
  orderCreateValidation, 
  paginationValidation, 
  idParamValidation 
} = require('../middleware/validation');
const operationLogMiddleware = require('../middleware/operationLog');

const AuthController = require('../controllers/authController');
const CategoryController = require('../controllers/categoryController');
const ProductController = require('../controllers/productController');
const CartController = require('../controllers/cartController');
const AddressController = require('../controllers/addressController');
const OrderController = require('../controllers/orderController');

// 认证（限流）
router.post('/auth/wx-login', loginLimiter, AuthController.wxLogin);

// 用户
router.get('/user/info', authMiddleware, AuthController.getCurrentUser);
router.put('/user/info', authMiddleware, AuthController.updateCurrentUser);

// 分类
router.get('/categories', CategoryController.list);

// 商品
router.get('/products', paginationValidation, ProductController.list);
router.get('/products/:id', idParamValidation, ProductController.detail);

// 购物车
router.get('/cart', authMiddleware, CartController.list);
router.post('/cart/items', authMiddleware, CartController.add);
router.put('/cart/items/:id', authMiddleware, idParamValidation, CartController.updateQuantity);
router.put('/cart/items/:id/checked', authMiddleware, idParamValidation, CartController.updateChecked);
router.put('/cart/checked', authMiddleware, CartController.updateAllChecked);
router.delete('/cart/items/:id', authMiddleware, idParamValidation, CartController.delete);
router.delete('/cart', authMiddleware, CartController.clear);

// 地址
router.get('/addresses', authMiddleware, paginationValidation, AddressController.list);
router.get('/addresses/:id', authMiddleware, idParamValidation, AddressController.detail);
router.post('/addresses', authMiddleware, AddressController.create);
router.put('/addresses/:id', authMiddleware, idParamValidation, AddressController.update);
router.delete('/addresses/:id', authMiddleware, idParamValidation, AddressController.delete);
router.put('/addresses/:id/default', authMiddleware, idParamValidation, AddressController.setDefault);

// 订单
router.post('/orders', authMiddleware, sensitiveLimiter, orderCreateValidation, OrderController.create);
router.post('/orders/pay', authMiddleware, sensitiveLimiter, OrderController.pay);
router.post('/orders/cancel', authMiddleware, sensitiveLimiter, OrderController.cancel);
router.post('/orders/confirm', authMiddleware, sensitiveLimiter, OrderController.confirmReceipt);
router.get('/orders', authMiddleware, paginationValidation, OrderController.list);
router.get('/orders/:id', authMiddleware, idParamValidation, OrderController.detail);

// 微信支付回调（无需认证）
router.post('/pay/notify', OrderController.payCallback);

module.exports = router;
