const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  timezone: config.timezone,
  define: config.define,
  pool: config.pool,
  logging: config.logging !== undefined ? config.logging : console.log,
});

const db = {};

// Import models
db.User = require('./user')(sequelize);
db.Category = require('./category')(sequelize);
db.Product = require('./product')(sequelize);
db.ProductSpec = require('./productSpec')(sequelize);
db.Address = require('./address')(sequelize);
db.Order = require('./order')(sequelize);
db.OrderItem = require('./orderItem')(sequelize);
db.CartItem = require('./cartItem')(sequelize);
db.Coupon = require('./coupon')(sequelize);
db.UserCoupon = require('./userCoupon')(sequelize);
db.Banner = require('./banner')(sequelize);
db.Admin = require('./admin')(sequelize);
db.Setting = require('./setting')(sequelize);

// Define associations
// Category self-reference
db.Category.hasMany(db.Category, { as: 'children', foreignKey: 'parent_id' });
db.Category.belongsTo(db.Category, { as: 'parent', foreignKey: 'parent_id' });

// Category - Product
db.Category.hasMany(db.Product, { foreignKey: 'category_id' });
db.Product.belongsTo(db.Category, { foreignKey: 'category_id' });

// Product - ProductSpec
db.Product.hasMany(db.ProductSpec, { as: 'specs', foreignKey: 'product_id' });
db.ProductSpec.belongsTo(db.Product, { foreignKey: 'product_id' });

// User - Address
db.User.hasMany(db.Address, { foreignKey: 'user_id' });
db.Address.belongsTo(db.User, { foreignKey: 'user_id' });

// User - Order
db.User.hasMany(db.Order, { foreignKey: 'user_id' });
db.Order.belongsTo(db.User, { foreignKey: 'user_id' });

// Order - OrderItem
db.Order.hasMany(db.OrderItem, { as: 'items', foreignKey: 'order_id' });
db.OrderItem.belongsTo(db.Order, { foreignKey: 'order_id' });

// User - CartItem
db.User.hasMany(db.CartItem, { foreignKey: 'user_id' });
db.CartItem.belongsTo(db.User, { foreignKey: 'user_id' });
db.CartItem.belongsTo(db.Product, { foreignKey: 'product_id' });
db.CartItem.belongsTo(db.ProductSpec, { foreignKey: 'spec_id' });

// User - UserCoupon
db.User.hasMany(db.UserCoupon, { foreignKey: 'user_id' });
db.UserCoupon.belongsTo(db.User, { foreignKey: 'user_id' });
db.UserCoupon.belongsTo(db.Coupon, { foreignKey: 'coupon_id' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
