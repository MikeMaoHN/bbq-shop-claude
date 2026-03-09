const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductSpec = sequelize.define('ProductSpec', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(50), allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  }, {
    tableName: 'product_specs',
    timestamps: false,
  });
  return ProductSpec;
};
