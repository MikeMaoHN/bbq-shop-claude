<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo">烧烤食材管理</div>
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><ShoppingCart /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/products">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/categories">
          <el-icon><Menu /></el-icon>
          <span>分类管理</span>
        </el-menu-item>
        <el-menu-item index="/stock">
          <el-icon><Box /></el-icon>
          <span>库存管理</span>
        </el-menu-item>
        <el-menu-item index="/notifications">
          <el-icon><Bell /></el-icon>
          <span>
            消息通知
            <el-badge v-if="unreadCount > 0" :value="unreadCount" :max="99" class="menu-badge" />
          </span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="page-title">{{ pageTitle }}</span>
        </div>
        <div class="header-right">
          <!-- 通知铃铛 -->
          <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0" class="bell-badge">
            <el-button circle plain @click="$router.push('/notifications')">
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>
          <el-dropdown @command="handleCommand" style="margin-left: 16px;">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="username">{{ authStore.admin?.username || '管理员' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
/**
 * 主布局组件
 * 提供左侧导航菜单 + 顶部 Header + 内容区三栏结构。
 * 登录后每隔 60 秒轮询一次未读通知数量，在铃铛和菜单项上展示角标。
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)
const pageTitle = computed(() => route.meta.title || '')

// 未读通知数（0 时隐藏角标）
const unreadCount = ref(0)

const fetchUnreadCount = async () => {
  try {
    const data = await api.getUnreadCount()
    unreadCount.value = data.count || 0
  } catch {
    // 静默失败，不影响主界面
  }
}

let pollTimer = null

onMounted(() => {
  fetchUnreadCount()
  // 每 60 秒轮询一次
  pollTimer = setInterval(fetchUnreadCount, 60000)
})

onUnmounted(() => {
  clearInterval(pollTimer)
})

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      authStore.logout()
      router.push('/login')
    })
  }
}
</script>

<style scoped>
.layout {
  height: 100vh;
}

.aside {
  background-color: #304156;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background-color: #2b3a4b;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin-left: 10px;
  color: #666;
}

.main {
  background: #f0f2f5;
  padding: 20px;
}

.bell-badge {
  vertical-align: middle;
}

.menu-badge {
  margin-left: 6px;
  vertical-align: middle;
}
</style>
