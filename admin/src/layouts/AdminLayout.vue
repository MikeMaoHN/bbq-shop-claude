<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
      <div class="logo">
        <img src="" alt="" class="logo-img" v-if="!isCollapse" />
        <span v-if="!isCollapse" class="logo-text">烤乐汇管理后台</span>
        <span v-else class="logo-text-mini">烤</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>

        <el-sub-menu index="product-menu">
          <template #title>
            <el-icon><Goods /></el-icon>
            <span>商品管理</span>
          </template>
          <el-menu-item index="/products">商品列表</el-menu-item>
          <el-menu-item index="/categories">分类管理</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/orders">
          <el-icon><List /></el-icon>
          <template #title>订单管理</template>
        </el-menu-item>

        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>

        <el-menu-item index="/banners">
          <el-icon><Picture /></el-icon>
          <template #title>轮播图管理</template>
        </el-menu-item>

        <el-menu-item index="/coupons">
          <el-icon><Ticket /></el-icon>
          <template #title>优惠券管理</template>
        </el-menu-item>

        <el-sub-menu index="system-menu">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/admins">管理员管理</el-menu-item>
          <el-menu-item index="/settings">系统设置</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <!-- 右侧区域 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ currentRoute.meta?.title || '首页' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="admin-info">
              <el-icon><UserFilled /></el-icon>
              <span class="admin-name">{{ userStore.adminInfo.name || '管理员' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'

const route = useRoute()
const userStore = useUserStore()

const isCollapse = ref(false)

const activeMenu = computed(() => route.path)
const currentRoute = computed(() => route)

function toggleCollapse() {
  isCollapse.value = !isCollapse.value
}

function handleCommand(command) {
  if (command === 'logout') {
    userStore.logout()
  }
}

// Fetch admin info on mount
userStore.getInfo().catch(() => {})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.aside {
  background-color: #304156;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #263445;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
}

.logo-text {
  font-size: 16px;
}

.logo-text-mini {
  font-size: 20px;
  font-weight: bold;
}

.logo-img {
  width: 32px;
  height: 32px;
  margin-right: 8px;
}

.sidebar-menu {
  border-right: none;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #333;
}

.collapse-btn:hover {
  color: #409eff;
}

.header-right {
  display: flex;
  align-items: center;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #333;
  font-size: 14px;
}

.admin-name {
  margin: 0 4px;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
