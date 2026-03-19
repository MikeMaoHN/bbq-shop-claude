/**
 * 订单控制器 - MySQL 版本
 * 使用 mysql2/promise 连接池事务，保证订单操作的原子性
 */
const Response = require('../utils/response');
const Order = require('../models/Order');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const StockLog = require('../models/StockLog');
const WeChatPayService = require('../services/wechatPayService');
const pool = require('../config/database');
const config = require('../config');
const Logger = require('../utils/logger');
const log = new Logger('OrderController');

// 支付模式常量
const PAYMENT_MODE = {
  MOCK: 'MOCK',
  REAL: 'REAL'
};

/**
 * 检查是否启用真实支付
 */
function isRealPayment() {
  return config.wxPay.mode === PAYMENT_MODE.REAL && 
         config.wxPay.mchid && 
         config.wxPay.mchid !== 'your_merchant_id' &&
         config.wxPay.serialNo;
}

// 订单状态常量
const ORDER_STATUS = {
  UNPAID: 0,       // 待付款
  PENDING_SHIP: 1, // 待发货
  PENDING_RECV: 2, // 待收货
  COMPLETED: 3,    // 已完成
  CANCELLED: 4     // 已取消
};

class OrderController {
  /**
   * 生成订单号（时间戳 + 4位随机数）
   */
  static generateOrderNo() {
    const now = new Date();
    const dateStr = now.toISOString().replace(/[-:T.]/g, '').substring(0, 14);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD${dateStr}${random}`;
  }

  /**
   * 创建订单并获取支付参数
   * 事务保证：地址验证、库存校验、订单插入、支付参数生成均在同一事务内完成
   */
  static async create(req, res) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const userId = req.user.userId;
      const { addressId, remark, items } = req.body;

      if (!items || items.length === 0) {
        await conn.rollback();
        return res.status(400).json(Response.error('请选择商品'));
      }

      // 验证收货地址
      const [addressRows] = await conn.execute(
        'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
        [addressId, userId]
      );

      if (!addressRows.length) {
        await conn.rollback();
        return res.status(400).json(Response.error('请选择收货地址'));
      }

      const address = addressRows[0];
      const receiverAddress = `${address.province || ''}${address.city || ''}${address.district || ''}${address.detail}`;

      // 验证商品库存并计算总价（FOR UPDATE 防止并发超卖）
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const [productRows] = await conn.execute(
          'SELECT * FROM products WHERE id = ? AND status = 1 FOR UPDATE',
          [item.productId]
        );

        if (!productRows.length) {
          await conn.rollback();
          return res.status(400).json(Response.error(`商品 ${item.productId} 不存在或已下架`));
        }

        const product = productRows[0];

        if (product.stock < item.quantity) {
          await conn.rollback();
          return res.status(400).json(Response.error(`商品 ${product.name} 库存不足`));
        }

        totalAmount += product.price * item.quantity;

        let productImage = '';
        try {
          productImage = product.images ? JSON.parse(product.images)[0] : '';
        } catch (e) {
          productImage = '';
        }

        orderItems.push({
          productId: product.id,
          productName: product.name,
          productImage,
          price: product.price,
          quantity: item.quantity
        });
      }

      // 创建订单
      const orderNo = OrderController.generateOrderNo();
      const [orderResult] = await conn.execute(
        `INSERT INTO orders (order_no, user_id, total_amount, pay_amount, freight_amount,
         status, remark, receiver_name, receiver_phone, receiver_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderNo, userId, totalAmount, totalAmount, 0, ORDER_STATUS.UNPAID,
         remark, address.name, address.phone, receiverAddress]
      );

      const orderId = orderResult.insertId;

      // 插入订单商品
      for (const item of orderItems) {
        await conn.execute(
          'INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
          [orderId, item.productId, item.productName, item.productImage, item.price, item.quantity]
        );
      }

      await conn.commit();

      const order = await Order.findById(orderId);
      
      // 根据支付模式返回不同结果
      let payParams = null;
      let paymentMode = config.wxPay.mode;
      
      if (isRealPayment()) {
        try {
          const payService = new WeChatPayService();
          const user = await Order._getUserOpenid(userId);
          payParams = await payService.createJSAPIOrder({
            outTradeNo: orderNo,
            totalAmount,
            openid: user.openid,
            description: `烧烤食材订单 ${orderNo}`
          });
          log.info(`订单 ${orderNo} 已生成真实支付参数`);
        } catch (error) {
          log.error('生成真实支付参数失败，降级为模拟支付:', error.message);
          paymentMode = PAYMENT_MODE.MOCK;
        }
      } else {
        log.info(`订单 ${orderNo} 使用模拟支付模式`);
      }

      res.json(Response.success({
        order,
        payParams,
        paymentMode
      }, `订单创建成功，${isRealPayment() ? '请调用支付' : '模拟支付已开启'}`));
    } catch (error) {
      await conn.rollback();
      console.error('创建订单错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    } finally {
      conn.release();
    }
  }

    /**
   * 发起支付（支持模拟/真实模式）
   */
  static async pay(req, res) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const userId = req.user.userId;
      const { orderId } = req.body;

      const order = await Order.findById(orderId);

      if (!order) {
        await conn.rollback();
        return res.status(404).json(Response.error('订单不存在'));
      }

      if (order.user_id !== userId) {
        await conn.rollback();
        return res.status(403).json(Response.error('无权操作此订单'));
      }

      if (order.status !== ORDER_STATUS.UNPAID) {
        await conn.rollback();
        return res.status(400).json(Response.error('订单状态不正确'));
      }

      // 根据支付模式处理
      if (!isRealPayment()) {
        // ========== 模拟支付模式 ==========
        log.warn(`订单 ${order.order_no} 使用模拟支付（开发模式）`);
        
        for (const item of order.items) {
          const [productRows] = await conn.execute(
            'SELECT * FROM products WHERE id = ? FOR UPDATE',
            [item.product_id]
          );

          if (!productRows.length || productRows[0].stock < item.quantity) {
            await conn.rollback();
            return res.status(400).json(Response.error(`商品库存不足，支付失败`));
          }

          const beforeStock = productRows[0].stock;
          const afterStock = beforeStock - item.quantity;

          await conn.execute(
            'UPDATE products SET stock = ? WHERE id = ?',
            [afterStock, item.product_id]
          );

          await StockLog.create({
            productId: item.product_id,
            changeQty: -item.quantity,
            beforeStock,
            afterStock,
            reason: '模拟支付',
            referenceType: 'order',
            referenceId: orderId
          });
        }

        await conn.execute(
          'UPDATE orders SET status = ?, paid_at = NOW() WHERE id = ?',
          [ORDER_STATUS.PENDING_SHIP, orderId]
        );

        for (const item of order.items) {
          await CartItem.deleteByUserAndProduct(userId, item.product_id);
        }

        await conn.commit();

        const updatedOrder = await Order.findById(orderId);
        return res.json(Response.success({
          order: updatedOrder,
          paymentMode: 'MOCK'
        }, '支付成功（模拟支付）'));
      }

      // ========== 真实支付模式 ==========
      await conn.rollback();
      
      try {
        const payService = new WeChatPayService();
        const user = await Order._getUserOpenid(userId);
        
        const payParams = await payService.createJSAPIOrder({
          outTradeNo: order.order_no,
          totalAmount: order.pay_amount,
          openid: user.openid,
          description: `烧烤食材订单 ${order.order_no}`
        });

        log.info(`订单 ${order.order_no} 已生成真实支付参数`);

        res.json(Response.success({
          payParams,
          order,
          paymentMode: 'REAL'
        }, '请调用 wx.requestPayment 完成支付'));
      } catch (error) {
        log.error('生成真实支付参数失败:', error.message);
        return res.status(500).json(Response.error(`支付服务错误：${error.message}`));
      }
    } catch (error) {
      await conn.rollback();
      console.error('支付错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    } finally {
      conn.release();
    }
  }

  /**
   * 微信支付回调
   */
  static async payCallback(req, res) {
    try {
      const payService = new WeChatPayService();
      const data = await payService.handleCallback(req);

      log.info('支付回调:', data);

      if (data.tradeState === 'SUCCESS') {
        const conn = await pool.getConnection();
        try {
          await conn.beginTransaction();

          const order = await Order.findByOrderNo(data.outTradeNo);
          if (order && order.status === ORDER_STATUS.UNPAID) {
            // 扣减库存
            for (const item of order.items) {
              const [productRows] = await conn.execute(
                'SELECT * FROM products WHERE id = ? FOR UPDATE',
                [item.product_id]
              );

              const beforeStock = productRows[0].stock;
              const afterStock = beforeStock - item.quantity;

              await conn.execute(
                'UPDATE products SET stock = ? WHERE id = ?',
                [afterStock, item.product_id]
              );

              await StockLog.create({
                productId: item.product_id,
                changeQty: -item.quantity,
                beforeStock,
                afterStock,
                reason: '支付成功',
                referenceType: 'order',
                referenceId: order.id
              });
            }

            // 更新订单状态
            await conn.execute(
              'UPDATE orders SET status = ?, paid_at = NOW(), transaction_id = ? WHERE id = ?',
              [ORDER_STATUS.PENDING_SHIP, data.transactionId, order.id]
            );

            // 清空购物车
            for (const item of order.items) {
              await CartItem.deleteByUserAndProduct(order.user_id, item.product_id);
            }

            await conn.commit();
            log.info(`订单 ${order.order_no} 支付成功`);
          }

          const response = payService.buildCallbackResponse();
          res.json(response);
        } catch (error) {
          await conn.rollback();
          throw error;
        } finally {
          conn.release();
        }
      } else {
        res.json(payService.buildCallbackResponse());
      }
    } catch (error) {
      log.error('处理支付回调错误:', error.message);
      res.status(400).json({ code: 'FAIL', message: error.message });
    }
  }

  /**
   * 获取用户 OpenID（内部方法）
   */
  static async _getUserOpenid(userId) {
    const [rows] = await pool.query('SELECT openid FROM users WHERE id = ?', [userId]);
    if (!rows.length) throw new Error('用户不存在');
    return rows[0];
  }

  /**
   * 取消订单
   * 事务保证：库存恢复和订单状态更新的原子性
   */
  static async cancel(req, res) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const userId = req.user.userId;
      const { orderId, reason = '用户取消' } = req.body;

      const order = await Order.findById(orderId);

      if (!order) {
        await conn.rollback();
        return res.status(404).json(Response.error('订单不存在'));
      }

      if (order.user_id !== userId) {
        await conn.rollback();
        return res.status(403).json(Response.error('无权操作此订单'));
      }

      if (order.status !== ORDER_STATUS.UNPAID) {
        await conn.rollback();
        return res.status(400).json(Response.error('只能取消待付款订单'));
      }

      // 恢复库存并记录流水
      for (const item of order.items) {
        const product = await Product.findById(item.product_id);
        const beforeStock = product ? product.stock : 0;
        const afterStock = beforeStock + item.quantity;

        await conn.execute(
          'UPDATE products SET stock = ? WHERE id = ?',
          [afterStock, item.product_id]
        );

        await StockLog.create({
          productId: item.product_id,
          changeQty: item.quantity,
          beforeStock,
          afterStock,
          reason: '取消订单',
          referenceType: 'order',
          referenceId: orderId
        });
      }

      // 更新订单状态为已取消
      await conn.execute(
        'UPDATE orders SET status = ?, cancel_reason = ?, cancelled_at = NOW() WHERE id = ?',
        [ORDER_STATUS.CANCELLED, reason, orderId]
      );

      await conn.commit();
      res.json(Response.success(null, '订单已取消'));
    } catch (error) {
      await conn.rollback();
      console.error('取消订单错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    } finally {
      conn.release();
    }
  }

  /**
   * 确认收货
   */
  static async confirmReceipt(req, res) {
    try {
      const userId = req.user.userId;
      const { orderId } = req.body;

      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json(Response.error('订单不存在'));
      }

      if (order.user_id !== userId) {
        return res.status(403).json(Response.error('无权操作此订单'));
      }

      if (order.status !== ORDER_STATUS.PENDING_RECV) {
        return res.status(400).json(Response.error('订单状态不正确'));
      }

      await Order.updateStatus(orderId, ORDER_STATUS.COMPLETED, { completedAt: new Date() });
      res.json(Response.success(null, '确认收货成功'));
    } catch (error) {
      console.error('确认收货错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 获取订单列表
   */
  static async list(req, res) {
    try {
      const userId = req.user.userId;
      const { status, page = 1, limit = 20 } = req.query;

      const result = await Order.findByUserId(userId, {
        status: status !== undefined ? parseInt(status) : undefined,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json(Response.success(result));
    } catch (error) {
      console.error('获取订单列表错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 获取订单详情
   */
  static async detail(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const order = await Order.findById(id);

      if (!order) {
        return res.status(404).json(Response.error('订单不存在'));
      }

      if (order.user_id !== userId) {
        return res.status(403).json(Response.error('无权查看此订单'));
      }

      res.json(Response.success(order));
    } catch (error) {
      console.error('获取订单详情错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }
}

module.exports = OrderController;
