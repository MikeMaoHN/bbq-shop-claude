const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ code: 400, message: err.message });
  }

  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message).join(', ');
    return res.status(400).json({ code: 400, message: messages });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ code: 400, message: '数据已存在' });
  }

  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误',
  });
};

module.exports = errorHandler;
