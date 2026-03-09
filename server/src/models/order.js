const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    order_no: { type: DataTypes.STRING(32), unique: true, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    address_snapshot: { type: DataTypes.JSON, allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    delivery_fee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    discount_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    pay_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.TINYINT, defaultValue: 0 },
    pay_time: { type: DataTypes.DATE, defaultValue: null },
    deliver_time: { type: DataTypes.DATE, defaultValue: null },
    receive_time: { type: DataTypes.DATE, defaultValue: null },
    delivery_time_slot: { type: DataTypes.STRING(50), defaultValue: '' },
    remark: { type: DataTypes.STRING(200), defaultValue: '' },
    transaction_id: { type: DataTypes.STRING(64), defaultValue: '' },
  }, {
    tableName: 'orders',
  });
  return Order;
};
