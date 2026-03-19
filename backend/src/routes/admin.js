// 在 admin.js 路由文件中添加库存管理路由

const express = require('express');
const router = express.Router();
const { adminMiddleware } = require('../middleware/auth');
const { loginLimiter, sensitiveLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const { 
  adminLoginValidation, 
  passwordChangeValidation, 
  productValidation,
  idParamValidation,
  paginationValidation 
} = require('../middleware/validation');
const operationLogMiddleware = require('../middleware/operationLog');
const multer = require('multer');
const path = require('path');
const config = require('../config');

const AdminAuthController = require('../controllers/adminAuthController');
const CategoryController = require('../controllers/categoryController');
const ProductController = require('../controllers/productController');
const AdminOrderController = require('../controllers/adminOrderController');
const AdminStockController = require('../controllers/adminStockController');
const UploadController = require('../controllers/uploadController');

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.path);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxSize },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件'));
    }
  }
});

// 确保上传目录存在
const fs = require('fs');
if (!fs.existsSync(config.upload.path)) {
  fs.mkdirSync(config.upload.path, { recursive: true });
}

// 管理员认证（限流）
router.post('/login', loginLimiter, adminLoginValidation, AdminAuthController.login);

// 需要管理员权限的路由
router.use(adminMiddleware);
router.use(operationLogMiddleware); // 操作日志中间件

// 管理员信息
router.get('/admin/info', AdminAuthController.getCurrentAdmin);
router.put('/admin/password', sensitiveLimiter, passwordChangeValidation, AdminAuthController.changePassword);

// 分类管理
router.get('/categories', paginationValidation, CategoryController.listForAdmin);
router.get('/categories/:id', idParamValidation, CategoryController.detail);
router.post('/categories', CategoryController.create);
router.put('/categories/:id', idParamValidation, CategoryController.update);
router.delete('/categories/:id', idParamValidation, CategoryController.delete);

// 商品管理
router.get('/products', paginationValidation, ProductController.listForAdmin);
router.get('/products/:id', idParamValidation, ProductController.detail);
router.post('/products', productValidation, ProductController.create);
router.put('/products/:id', idParamValidation, productValidation, ProductController.update);
router.delete('/products/:id', idParamValidation, ProductController.delete);
router.put('/products/batch-status', ProductController.batchUpdateStatus);
router.put('/products/:id/stock', idParamValidation, AdminStockController.updateStock);

// 库存管理
router.get('/stock/products', paginationValidation, AdminStockController.getProducts);
router.get('/stock/logs', paginationValidation, AdminStockController.getStockLogs);
router.get('/stock/low-stock', paginationValidation, AdminStockController.getLowStockProducts);

// 订单管理
router.get('/orders', paginationValidation, AdminOrderController.list);
router.get('/orders/:id', idParamValidation, AdminOrderController.detail);
router.put('/orders/:id/ship', idParamValidation, AdminOrderController.ship);
router.put('/orders/:id/remark', idParamValidation, AdminOrderController.remark);

// 统计数据
router.get('/stats', AdminOrderController.stats);
router.get('/stats/low-stock', AdminOrderController.getLowStockProducts);

// 文件上传（限流）
router.post('/upload/image', uploadLimiter, upload.single('file'), UploadController.uploadImage);
router.post('/upload/images', uploadLimiter, upload.array('files', 10), UploadController.uploadImages);

module.exports = router;
