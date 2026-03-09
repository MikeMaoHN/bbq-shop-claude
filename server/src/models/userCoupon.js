const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserCoupon = sequelize.define('UserCoupon', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    coupon_id: { type: DataTypes.INTEGER, allowNull: false },
    order_id: { type: DataTypes.INTEGER, defaultValue: null },
    status: { type: DataTypes.TINYINT, defaultValue: 0, comment: '0未使用 1已使用 2已过期' },
    used_at: { type: DataTypes.DATE, defaultValue: null },
  }, {
    tableName: 'user_coupons',
    updatedAt: false,
  });
  return UserCoupon;
};
