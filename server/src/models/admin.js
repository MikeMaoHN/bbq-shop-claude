const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const Admin = sequelize.define('Admin', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    password: { type: DataTypes.STRING(255), allowNull: false },
    name: { type: DataTypes.STRING(50), defaultValue: '' },
    role: { type: DataTypes.STRING(20), defaultValue: 'admin' },
    status: { type: DataTypes.TINYINT, defaultValue: 1 },
    last_login_at: { type: DataTypes.DATE, defaultValue: null },
  }, {
    tableName: 'admins',
    updatedAt: false,
    hooks: {
      beforeCreate: async (admin) => {
        if (admin.password) {
          admin.password = await bcrypt.hash(admin.password, 10);
        }
      },
      beforeUpdate: async (admin) => {
        if (admin.changed('password')) {
          admin.password = await bcrypt.hash(admin.password, 10);
        }
      },
    },
  });

  Admin.prototype.validatePassword = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  return Admin;
};
