/**
 * 管理员认证控制器
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const Response = require('../utils/response');
const { generateToken } = require('../middleware/auth');
const Admin = require('../models/Admin');

class AdminAuthController {
  /**
   * 管理员登录
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json(Response.error('用户名和密码不能为空'));
      }

      const admin = await Admin.findByUsername(username);
      
      if (!admin) {
        return res.status(401).json(Response.error('用户名或密码错误'));
      }

      if (admin.status !== 1) {
        return res.status(403).json(Response.error('账号已被禁用'));
      }

      const isMatch = await Admin.verifyPassword(admin, password);
      
      if (!isMatch) {
        return res.status(401).json(Response.error('用户名或密码错误'));
      }

      // 生成 JWT token
      const token = generateToken(
        { adminId: admin.id, username: admin.username, role: admin.role },
        true
      );

      res.json(Response.success({
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          role: admin.role
        }
      }, '登录成功'));
    } catch (error) {
      console.error('管理员登录错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 获取当前管理员信息
   */
  static async getCurrentAdmin(req, res) {
    try {
      const admin = await Admin.findById(req.admin.adminId);
      
      if (!admin) {
        return res.status(404).json(Response.error('管理员不存在'));
      }

      res.json(Response.success(admin));
    } catch (error) {
      console.error('获取管理员信息错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 修改密码
   */
  static async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json(Response.error('请填写原密码和新密码'));
      }

      const admin = await Admin.findById(req.admin.adminId);
      const isMatch = await Admin.verifyPassword(admin, oldPassword);
      
      if (!isMatch) {
        return res.status(400).json(Response.error('原密码错误'));
      }

      await Admin.updatePassword(req.admin.adminId, newPassword);
      
      res.json(Response.success(null, '密码修改成功'));
    } catch (error) {
      console.error('修改密码错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }
}

module.exports = AdminAuthController;
