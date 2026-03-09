const express = require('express');
const upload = require('../../middleware/upload');
const { success, fail } = require('../../utils/response');

const router = express.Router();

// 单文件上传
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return fail(res, '请选择文件');
  }
  const url = `/uploads/${req.file.filename}`;
  success(res, { url, filename: req.file.filename }, '上传成功');
});

// 多文件上传
router.post('/multiple', upload.array('files', 9), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return fail(res, '请选择文件');
  }
  const urls = req.files.map((f) => ({ url: `/uploads/${f.filename}`, filename: f.filename }));
  success(res, urls, '上传成功');
});

module.exports = router;
