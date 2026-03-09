const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Setting = sequelize.define('Setting', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    key: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    value: { type: DataTypes.TEXT, defaultValue: '' },
    description: { type: DataTypes.STRING(100), defaultValue: '' },
  }, {
    tableName: 'settings',
    timestamps: false,
  });
  return Setting;
};
