const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    product_name: { type: DataTypes.STRING(100), allowNull: false },
    product_image: { type: DataTypes.STRING(255), defaultValue: '' },
    spec_name: { type: DataTypes.STRING(50), defaultValue: '' },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'order_items',
    timestamps: false,
  });
  return OrderItem;
};
