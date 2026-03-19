/**
 * 订单模型 - MySQL 版本
 * 优化：批量加载订单商品，消除 N+1 查询问题
 */
const pool = require('../config/database');

class Order {
  static async create(data) {
    const {
      orderNo, userId, totalAmount, payAmount, freightAmount,
      status, remark, receiverName, receiverPhone, receiverAddress
    } = data;

    const [result] = await pool.query(
      `INSERT INTO orders (order_no, user_id, total_amount, pay_amount, freight_amount,
       status, remark, receiver_name, receiver_phone, receiver_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNo, userId, totalAmount, payAmount, freightAmount, status, remark,
       receiverName, receiverPhone, receiverAddress]
    );
    return result.insertId;
  }

  static async addItems(orderId, items) {
    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.productId, item.productName, item.productImage, item.price, item.quantity]
      );
    }
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!rows[0]) return null;

    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    return { ...rows[0], items };
  }

  static async findByOrderNo(orderNo) {
    const [rows] = await pool.query('SELECT * FROM orders WHERE order_no = ?', [orderNo]);
    if (!rows[0]) return null;

    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [rows[0].id]);
    return { ...rows[0], items };
  }

  static async findByUserId(userId, options = {}) {
    const { status, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    let where = 'WHERE user_id = ?';
    const params = [userId];

    if (status !== undefined && status !== null) {
      where += ' AND status = ?';
      params.push(status);
    }

    const [list] = await pool.query(
      `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM orders ${where}`,
      params
    );

    // 批量加载订单商品，避免 N+1 查询
    if (list.length > 0) {
      const orderIds = list.map(o => o.id);
      const placeholders = orderIds.map(() => '?').join(',');
      const [allItems] = await pool.query(
        `SELECT * FROM order_items WHERE order_id IN (${placeholders})`,
        orderIds
      );
      const itemsByOrderId = {};
      for (const item of allItems) {
        if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
        itemsByOrderId[item.order_id].push(item);
      }
      for (const order of list) {
        order.items = itemsByOrderId[order.id] || [];
      }
    } else {
      for (const order of list) { order.items = []; }
    }

    return { list, total, page, limit };
  }

  static async updateStatus(id, status, extraData = {}) {
    const fields = ['status = ?'];
    const values = [status];

    if (status === 1 && extraData.paidAt) { fields.push('paid_at = ?'); values.push(extraData.paidAt); }
    if (status === 2 && extraData.shippedAt) { fields.push('shipped_at = ?'); values.push(extraData.shippedAt); }
    if (status === 3 && extraData.completedAt) { fields.push('completed_at = ?'); values.push(extraData.completedAt); }
    if (status === 4 && extraData.cancelledAt) { fields.push('cancelled_at = ?'); values.push(extraData.cancelledAt); }
    if (extraData.logisticsNo) { fields.push('logistics_no = ?'); values.push(extraData.logisticsNo); }
    if (extraData.logisticsCompany) { fields.push('logistics_company = ?'); values.push(extraData.logisticsCompany); }
    if (extraData.cancelReason) { fields.push('cancel_reason = ?'); values.push(extraData.cancelReason); }

    values.push(id);
    await pool.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  static async ship(id, logisticsNo, logisticsCompany) {
    await pool.query(
      'UPDATE orders SET status = 2, logistics_no = ?, logistics_company = ?, shipped_at = NOW() WHERE id = ? AND status = 1',
      [logisticsNo, logisticsCompany, id]
    );
  }

  static async cancel(id, reason) {
    await pool.query(
      'UPDATE orders SET status = 4, cancel_reason = ?, cancelled_at = NOW() WHERE id = ? AND status = 0',
      [reason, id]
    );
  }

  static async getAllForAdmin(options = {}) {
    const { status, userId, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];

    if (status !== undefined && status !== null) { where += ' AND o.status = ?'; params.push(status); }
    if (userId) { where += ' AND o.user_id = ?'; params.push(userId); }

    const [list] = await pool.query(
      `SELECT o.*, u.nickname as user_nickname, u.phone as user_phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM orders o ${where}`,
      params
    );

    // 批量加载订单商品，避免 N+1 查询
    if (list.length > 0) {
      const orderIds = list.map(o => o.id);
      const placeholders = orderIds.map(() => '?').join(',');
      const [allItems] = await pool.query(
        `SELECT * FROM order_items WHERE order_id IN (${placeholders})`,
        orderIds
      );
      const itemsByOrderId = {};
      for (const item of allItems) {
        if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
        itemsByOrderId[item.order_id].push(item);
      }
      for (const order of list) {
        order.items = itemsByOrderId[order.id] || [];
      }
    } else {
      for (const order of list) { order.items = []; }
    }

    return { list, total, page, limit };
  }

  static async getStats(days = 7) {
    const [orderStatsRows] = await pool.query(
      `SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as unpaid_orders,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as pending_ship_orders,
        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as pending_recv_orders,
        SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN status = 3 THEN total_amount ELSE 0 END) / 100 as total_revenue
       FROM orders
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    const [productStats] = await pool.query(
      `SELECT p.id, p.name, SUM(oi.quantity) as sales
       FROM order_items oi
       INNER JOIN products p ON oi.product_id = p.id
       INNER JOIN orders o ON oi.order_id = o.id
       WHERE o.status = 3 AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY p.id
       ORDER BY sales DESC
       LIMIT 10`,
      [days]
    );

    return { orderStats: orderStatsRows[0], productStats };
  }
}

module.exports = Order;
