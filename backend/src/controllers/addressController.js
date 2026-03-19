/**
 * 收货地址控制器
 */
const Response = require('../utils/response');
const Address = require('../models/Address');

class AddressController {
  /**
   * 获取地址列表
   */
  static async list(req, res) {
    try {
      const userId = req.user.userId;
      const addresses = await Address.findByUserId(userId);
      res.json(Response.success(addresses));
    } catch (error) {
      console.error('获取地址列表错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 获取地址详情
   */
  static async detail(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const address = await Address.findById(id);
      
      if (!address || address.user_id !== userId) {
        return res.status(404).json(Response.error('地址不存在'));
      }
      
      res.json(Response.success(address));
    } catch (error) {
      console.error('获取地址详情错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 创建地址
   */
  static async create(req, res) {
    try {
      const userId = req.user.userId;
      const { name, phone, province, city, district, detail, isDefault } = req.body;
      
      if (!name || !phone || !detail) {
        return res.status(400).json(Response.error('请填写必填项'));
      }
      
      // 验证手机号格式
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        return res.status(400).json(Response.error('手机号格式不正确'));
      }

      const id = await Address.create({
        userId,
        name,
        phone,
        province,
        city,
        district,
        detail,
        isDefault
      });
      
      const address = await Address.findById(id);
      res.json(Response.success(address, '创建成功'));
    } catch (error) {
      console.error('创建地址错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 更新地址
   */
  static async update(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const data = req.body;
      
      const address = await Address.findById(id);
      if (!address || address.user_id !== userId) {
        return res.status(404).json(Response.error('地址不存在'));
      }
      
      await Address.update(id, userId, data);
      const updatedAddress = await Address.findById(id);
      
      res.json(Response.success(updatedAddress, '更新成功'));
    } catch (error) {
      console.error('更新地址错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 删除地址
   */
  static async delete(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      
      const address = await Address.findById(id);
      if (!address || address.user_id !== userId) {
        return res.status(404).json(Response.error('地址不存在'));
      }
      
      await Address.delete(id, userId);
      res.json(Response.success(null, '删除成功'));
    } catch (error) {
      console.error('删除地址错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 设置默认地址
   */
  static async setDefault(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      
      const address = await Address.findById(id);
      if (!address || address.user_id !== userId) {
        return res.status(404).json(Response.error('地址不存在'));
      }
      
      await Address.update(id, userId, { isDefault: true });
      res.json(Response.success(null, '设置成功'));
    } catch (error) {
      console.error('设置默认地址错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }
}

module.exports = AddressController;
