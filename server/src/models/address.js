const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Address = sequelize.define('Address', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(50), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    province: { type: DataTypes.STRING(30), defaultValue: '' },
    city: { type: DataTypes.STRING(30), defaultValue: '' },
    district: { type: DataTypes.STRING(30), defaultValue: '' },
    detail: { type: DataTypes.STRING(200), allowNull: false },
    is_default: { type: DataTypes.TINYINT, defaultValue: 0 },
  }, {
    tableName: 'addresses',
    updatedAt: false,
  });
  return Address;
};
