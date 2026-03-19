/**
 * 文件上传控制器
 */
const path = require('path');
const fs = require('fs');
const Response = require('../utils/response');
const config = require('../config');

class UploadController {
  /**
   * 上传图片
   */
  static async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json(Response.error('请选择要上传的文件'));
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      res.json(Response.success({ url: imageUrl }, '上传成功'));
    } catch (error) {
      console.error('上传图片错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 批量上传图片
   */
  static async uploadImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json(Response.error('请选择要上传的文件'));
      }

      const urls = req.files.map(file => `/uploads/${file.filename}`);
      res.json(Response.success({ urls }, '上传成功'));
    } catch (error) {
      console.error('批量上传图片错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }
}

module.exports = UploadController;
