const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define('Category', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    parent_id: { type: DataTypes.INTEGER, defaultValue: 0 },
    name: { type: DataTypes.STRING(50), allowNull: false },
    icon: { type: DataTypes.STRING(255), defaultValue: '' },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.TINYINT, defaultValue: 1 },
  }, {
    tableName: 'categories',
    updatedAt: false,
  });
  return Category;
};
