<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409EFF;">
              <el-icon><ShoppingCart /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.orderStats?.total_orders || 0 }}</div>
              <div class="stat-label">总订单数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67C23A;">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.orderStats?.completed_orders || 0 }}</div>
              <div class="stat-label">已完成订单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6A23C;">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.orderStats?.pending_ship_orders || 0 }}</div>
              <div class="stat-label">待发货订单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #F56C6C;">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ stats.orderStats?.total_revenue || 0 }}</div>
              <div class="stat-label">销售收入</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>订单状态分布</span>
            </div>
          </template>
          <div class="chart-container">
            <div class="order-status-list">
              <div class="status-item">
                <span class="status-label">待付款</span>
                <span class="status-value">{{ stats.orderStats?.unpaid_orders || 0 }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">待发货</span>
                <span class="status-value">{{ stats.orderStats?.pending_ship_orders || 0 }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">待收货</span>
                <span class="status-value">{{ stats.orderStats?.pending_recv_orders || 0 }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">已完成</span>
                <span class="status-value">{{ stats.orderStats?.completed_orders || 0 }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">已取消</span>
                <span class="status-value">{{ stats.orderStats?.cancelled_orders || 0 }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>商品销量 TOP 10</span>
            </div>
          </template>
          <el-table :data="stats.productStats" style="width: 100%" :show-header="false">
            <el-table-column type="index" width="50" />
            <el-table-column prop="name" label="商品名称" />
            <el-table-column prop="sales" label="销量" width="100" align="right" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>库存预警</span>
          <el-button type="primary" size="small" @click="goStock">查看库存</el-button>
        </div>
      </template>
      <el-table :data="lowStockProducts" style="width: 100%">
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="category_name" label="分类" width="100" />
        <el-table-column prop="stock" label="当前库存" width="100" align="right">
          <template #default="{ row }">
            <el-tag :type="row.stock <= 5 ? 'danger' : 'warning'">{{ row.stock }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sales" label="销量" width="100" align="right" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
/**
 * 数据概览页（Dashboard）
 * 展示近 7 天的订单统计、商品销量 TOP10 和库存预警（阈值 20 件）。
 * 页面挂载时并发加载统计数据和库存预警，互不依赖可同时请求。
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()
// stats 包含 orderStats（订单汇总）和 productStats（商品销量排行）
const stats = ref({ orderStats: {}, productStats: [] })
// 库存低于预警值（20件）的商品列表
const lowStockProducts = ref([])

onMounted(() => {
  // 并发加载两个独立数据源，不互相等待
  loadStats()
  loadLowStock()
})

/** 加载近 7 天订单和销量统计 */
const loadStats = async () => {
  try {
    stats.value = await api.getStats({ days: 7 })
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

/** 加载库存预警商品（库存 <= 20 件） */
const loadLowStock = async () => {
  try {
    lowStockProducts.value = await api.getLowStockProducts({ threshold: 20 })
  } catch (error) {
    console.error('加载库存预警失败:', error)
  }
}

/** 跳转到库存管理页 */
const goStock = () => {
  router.push('/stock')
}
</script>

<style scoped>
.stat-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
}

.stat-icon .el-icon {
  font-size: 30px;
  color: #fff;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-status-list {
  padding: 20px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  color: #666;
}

.status-value {
  font-weight: bold;
  color: #333;
}
</style>
