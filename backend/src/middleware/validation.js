/**
 * 输入验证中间件
 * 使用 express-validator 对请求参数进行验证
 */
const { body, param, query, validationResult } = require('express-validator');
const Logger = require('../utils/logger');
const log = new Logger('ValidationMiddleware');

// 验证结果处理
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    log.warn(`验证失败：${JSON.stringify(errorMessages)}`);
    return res.status(400).json({
      code: 400,
      message: '参数验证失败',
      errors: errorMessages,
      timestamp: Date.now()
    });
  }
  next();
};

// 管理员登录验证
const adminLoginValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('用户名不能为空')
    .isLength({ min: 3, max: 64 }).withMessage('用户名长度 3-64 个字符'),
  body('password')
    .notEmpty().withMessage('密码不能为空')
    .isLength({ min: 6, max: 32 }).withMessage('密码长度 6-32 个字符'),
  handleValidationErrors
];

// 密码修改验证
const passwordChangeValidation = [
  body('oldPassword')
    .notEmpty().withMessage('原密码不能为空'),
  body('newPassword')
    .notEmpty().withMessage('新密码不能为空')
    .isLength({ min: 6, max: 32 }).withMessage('密码长度 6-32 个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/)
    .withMessage('密码必须包含大小写字母和数字'),
  handleValidationErrors
];

// 商品创建/更新验证
const productValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('商品名称不能为空')
    .isLength({ max: 128 }).withMessage('商品名称不超过 128 个字符'),
  body('price')
    .isInt({ min: 0 }).withMessage('价格必须为正整数（分）'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('库存必须为非负整数'),
  body('category_id')
    .isInt({ min: 1 }).withMessage('分类 ID 必须为正整数'),
  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('描述不超过 1000 个字符'),
  handleValidationErrors
];

// 订单创建验证
const orderCreateValidation = [
  body('addressId')
    .isInt({ min: 1 }).withMessage('地址 ID 必须为正整数'),
  body('items')
    .isArray({ min: 1 }).withMessage('购物车不能为空'),
  body('items.*.productId')
    .isInt({ min: 1 }).withMessage('商品 ID 必须为正整数'),
  body('items.*.quantity')
    .isInt({ min: 1, max: 99 }).withMessage('商品数量必须在 1-99 之间'),
  body('remark')
    .optional()
    .isLength({ max: 255 }).withMessage('备注不超过 255 个字符'),
  handleValidationErrors
];

// 分页参数验证
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('页码必须为正整数'),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('每页数量必须在 1-100 之间'),
  handleValidationErrors
];

// ID 参数验证
const idParamValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID 必须为正整数'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  adminLoginValidation,
  passwordChangeValidation,
  productValidation,
  orderCreateValidation,
  paginationValidation,
  idParamValidation
};
