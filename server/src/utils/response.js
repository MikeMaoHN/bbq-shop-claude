const success = (res, data = null, message = 'success') => {
  res.json({ code: 0, message, data });
};

const paginate = (res, { rows, count, page, pageSize }) => {
  res.json({
    code: 0,
    message: 'success',
    data: {
      list: rows,
      pagination: {
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
      },
    },
  });
};

const fail = (res, message = '操作失败', code = 400) => {
  res.status(code).json({ code, message });
};

module.exports = { success, paginate, fail };
