const express = require('express');
const db = require('../../models');
const { success } = require('../../utils/response');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const settings = await db.Setting.findAll();
    const result = {};
    settings.forEach((s) => {
      try {
        result[s.key] = JSON.parse(s.value);
      } catch {
        result[s.key] = s.value;
      }
    });
    success(res, result);
  } catch (err) {
    next(err);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const data = req.body;
    for (const [key, value] of Object.entries(data)) {
      const val = typeof value === 'string' ? value : JSON.stringify(value);
      await db.Setting.upsert({ key, value: val });
    }
    success(res, null, '保存成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
