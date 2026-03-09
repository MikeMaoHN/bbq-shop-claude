const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    openid: { type: DataTypes.STRING(64), unique: true, allowNull: false },
    nickname: { type: DataTypes.STRING(64), defaultValue: '' },
    avatar: { type: DataTypes.STRING(255), defaultValue: '' },
    phone: { type: DataTypes.STRING(20), defaultValue: '' },
  }, {
    tableName: 'users',
  });
  return User;
};
