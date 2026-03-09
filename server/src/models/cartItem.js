const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CartItem = sequelize.define('CartItem', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    spec_id: { type: DataTypes.INTEGER, defaultValue: null },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  }, {
    tableName: 'cart_items',
  });
  return CartItem;
};
