import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: AdminLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/index.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('../views/product/list.vue'),
        meta: { title: '商品管理' }
      },
      {
        path: 'product-add',
        name: 'ProductAdd',
        component: () => import('../views/product/form.vue'),
        meta: { title: '添加商品' }
      },
      {
        path: 'product-edit/:id',
        name: 'ProductEdit',
        component: () => import('../views/product/form.vue'),
        meta: { title: '编辑商品' }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('../views/category/index.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('../views/order/list.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'order-detail/:id',
        name: 'OrderDetail',
        component: () => import('../views/order/detail.vue'),
        meta: { title: '订单详情' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/user/index.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'banners',
        name: 'Banners',
        component: () => import('../views/banner/index.vue'),
        meta: { title: '轮播图管理' }
      },
      {
        path: 'coupons',
        name: 'Coupons',
        component: () => import('../views/coupon/index.vue'),
        meta: { title: '优惠券管理' }
      },
      {
        path: 'admins',
        name: 'Admins',
        component: () => import('../views/system/admin.vue'),
        meta: { title: '管理员管理' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/system/setting.vue'),
        meta: { title: '系统设置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.path === '/login') {
    if (token) {
      next('/')
    } else {
      next()
    }
  } else {
    if (token) {
      next()
    } else {
      next('/login')
    }
  }
})

export default router
