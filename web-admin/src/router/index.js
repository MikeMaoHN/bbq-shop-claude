/**
 * 路由配置
 * 采用懒加载（动态 import）减小初始包体积，各页面按需加载。
 * meta.title 用于导航守卫更新浏览器标签页标题。
 *
 * 路由结构：
 *   /login          - 登录页（无需认证）
 *   /               - 主布局（需认证），子路由渲染在 Layout 的 <router-view> 中
 *     dashboard     - 数据概览
 *     products      - 商品管理
 *     categories    - 分类管理
 *     orders        - 订单列表
 *     orders/:id    - 订单详情
 *     stock         - 库存管理
 *     notifications - 站内信通知中心
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',  // 访问根路径自动跳转到数据概览
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据概览' }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/products/ProductList.vue'),
        meta: { title: '商品管理' }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/categories/CategoryList.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/OrderList.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/orders/OrderDetail.vue'),
        meta: { title: '订单详情' }
      },
      {
        path: 'stock',
        name: 'Stock',
        component: () => import('@/views/stock/StockList.vue'),
        meta: { title: '库存管理' }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/notifications/NotificationList.vue'),
        meta: { title: '消息通知' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * 全局前置守卫：未登录时重定向到 /login
 * token 由 Pinia auth store 持久化管理，刷新页面后从 localStorage 恢复
 */
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.path !== '/login' && !authStore.token) {
    next('/login')
  } else {
    next()
  }
})

// 根据路由 meta.title 更新浏览器标签页标题
router.afterEach((to) => {
  document.title = to.meta?.title
    ? `${to.meta.title} - 烧烤食材管理系统`
    : '烧烤食材管理系统'
})

export default router
