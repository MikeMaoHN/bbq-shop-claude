import request from './request'

// ==================== 认证模块 ====================
export const authApi = {
  login(data) {
    return request.post('/auth/login', data)
  },
  getInfo() {
    return request.get('/auth/info')
  },
  logout() {
    return request.post('/auth/logout')
  }
}

// ==================== 仪表盘模块 ====================
export const dashboardApi = {
  getOverview() {
    return request.get('/dashboard/overview')
  },
  getSalesTrend(params) {
    return request.get('/dashboard/sales-trend', { params })
  },
  getTopProducts(params) {
    return request.get('/dashboard/top-products', { params })
  }
}

// ==================== 商品模块 ====================
export const productApi = {
  getList(params) {
    return request.get('/products', { params })
  },
  create(data) {
    return request.post('/products', data)
  },
  update(id, data) {
    return request.put(`/products/${id}`, data)
  },
  updateStatus(id, status) {
    return request.patch(`/products/${id}/status`, { status })
  },
  remove(id) {
    return request.delete(`/products/${id}`)
  }
}

// ==================== 分类模块 ====================
export const categoryApi = {
  getList(params) {
    return request.get('/categories', { params })
  },
  create(data) {
    return request.post('/categories', data)
  },
  update(id, data) {
    return request.put(`/categories/${id}`, data)
  },
  remove(id) {
    return request.delete(`/categories/${id}`)
  }
}

// ==================== 订单模块 ====================
export const orderApi = {
  getList(params) {
    return request.get('/orders', { params })
  },
  getDetail(id) {
    return request.get(`/orders/${id}`)
  },
  deliver(id, data) {
    return request.post(`/orders/${id}/deliver`, data)
  },
  handleRefund(id, data) {
    return request.post(`/orders/${id}/refund`, data)
  }
}

// ==================== 用户模块 ====================
export const userApi = {
  getList(params) {
    return request.get('/users', { params })
  },
  getDetail(id) {
    return request.get(`/users/${id}`)
  }
}

// ==================== 轮播图模块 ====================
export const bannerApi = {
  getList(params) {
    return request.get('/banners', { params })
  },
  create(data) {
    return request.post('/banners', data)
  },
  update(id, data) {
    return request.put(`/banners/${id}`, data)
  },
  remove(id) {
    return request.delete(`/banners/${id}`)
  }
}

// ==================== 优惠券模块 ====================
export const couponApi = {
  getList(params) {
    return request.get('/coupons', { params })
  },
  create(data) {
    return request.post('/coupons', data)
  },
  update(id, data) {
    return request.put(`/coupons/${id}`, data)
  }
}

// ==================== 管理员模块 ====================
export const adminApi = {
  getList(params) {
    return request.get('/admins', { params })
  },
  create(data) {
    return request.post('/admins', data)
  },
  update(id, data) {
    return request.put(`/admins/${id}`, data)
  }
}

// ==================== 设置模块 ====================
export const settingApi = {
  get() {
    return request.get('/settings')
  },
  update(data) {
    return request.put('/settings', data)
  }
}

// ==================== 支付配置模块 ====================
export const payApi = {
  getMockMode() {
    return request.get('/pay/mock-mode')
  },
  setMockMode(mock) {
    return request.put('/pay/mock-mode', { mock })
  }
}

// ==================== 上传模块 ====================
export const uploadApi = {
  uploadFile(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}
