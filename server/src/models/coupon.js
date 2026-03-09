const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Coupon = sequelize.define('Coupon', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.TINYINT, allowNull: false, comment: '1满减 2折扣' },
    value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    min_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    total_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    used_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    start_time: { type: DataTypes.DATE, allowNull: false },
    end_time: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.TINYINT, defaultValue: 1 },
  }, {
    tableName: 'coupons',
    updatedAt: false,
  });
  return Coupon;
};
