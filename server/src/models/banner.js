const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Banner = sequelize.define('Banner', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    image: { type: DataTypes.STRING(255), allowNull: false },
    link_type: { type: DataTypes.TINYINT, defaultValue: 0, comment: '0无跳转 1商品 2分类 3外链' },
    link_value: { type: DataTypes.STRING(255), defaultValue: '' },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.TINYINT, defaultValue: 1 },
  }, {
    tableName: 'banners',
    updatedAt: false,
  });
  return Banner;
};
