const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    category_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, defaultValue: '' },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    original_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: null },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    sales: { type: DataTypes.INTEGER, defaultValue: 0 },
    images: { type: DataTypes.JSON, defaultValue: [] },
    status: { type: DataTypes.TINYINT, defaultValue: 1 },
    is_hot: { type: DataTypes.TINYINT, defaultValue: 0 },
  }, {
    tableName: 'products',
  });
  return Product;
};
