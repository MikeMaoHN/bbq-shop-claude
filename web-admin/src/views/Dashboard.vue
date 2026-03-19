<template>
  <div class="dashboard">
    <!-- 时间范围选择器 -->
    <el-card class="time-range-card">
      <div class="time-range-bar">
        <el-radio-group v-model="quickDays" @change="onQuickDaysChange">
          <el-radio-button :value="7">近7天</el-radio-button>
          <el-radio-button :value="30">近30天</el-radio-button>
          <el-radio-button :value="90">近90天</el-radio-button>
          <el-radio-button :value="180">近180天</el-radio-button>
          <el-radio-button :value="0">自定义</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-if="quickDays === 0"
          v-model="customRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="margin-left: 16px;"
          @change="onCustomRangeChange"
        />
      </div>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px;">
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
              <div class="stat-value">¥{{ Number(stats.orderStats?.total_revenue || 0).toFixed(2) }}</div>
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
 * 支持快捷时间段（近7/30/90/180天）和自定义日期区间两种查询模式。
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

// quickDays=0 表示切换到自定义日期模式
const quickDays = ref(7)
// 自定义日期区间 [startDate, endDate]，格式 YYYY-MM-DD
const customRange = ref(null)

onMounted(() => {
  // 并发加载两个独立数据源，不互相等待
  loadStats()
  loadLowStock()
})

/** 切换快捷时间段时重新拉取统计数据 */
const onQuickDaysChange = (val) => {
  if (val !== 0) {
    customRange.value = null
    loadStats()
  }
}

/** 自定义区间选定后拉取统计数据 */
const onCustomRangeChange = (val) => {
  if (val && val.length === 2) {
    loadStats()
  }
}

/** 加载订单和销量统计，根据当前选中的时间范围传参 */
const loadStats = async () => {
  try {
    let params
    if (quickDays.value === 0 && customRange.value?.length === 2) {
      // 自定义区间：传 startDate/endDate
      params = { startDate: customRange.value[0], endDate: customRange.value[1] }
    } else {
      // 快捷时间段：传 days
      params = { days: quickDays.value }
    }
    stats.value = await api.getStats(params)
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
.time-range-card {
  margin-bottom: 0;
}

.time-range-bar {
  display: flex;
  align-items: center;
}

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
