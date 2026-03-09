<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-info">
              <p class="stat-label">今日订单</p>
              <h3 class="stat-value">{{ overview.todayOrders || 0 }}</h3>
            </div>
            <el-icon class="stat-icon" style="color: #409eff"><ShoppingCart /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-info">
              <p class="stat-label">今日收入</p>
              <h3 class="stat-value">¥{{ overview.todayRevenue || '0.00' }}</h3>
            </div>
            <el-icon class="stat-icon" style="color: #67c23a"><Money /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-info">
              <p class="stat-label">待发货订单</p>
              <h3 class="stat-value">{{ overview.pendingOrders || 0 }}</h3>
            </div>
            <el-icon class="stat-icon" style="color: #e6a23c"><Bell /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-info">
              <p class="stat-label">商品总数</p>
              <h3 class="stat-value">{{ overview.totalProducts || 0 }}</h3>
            </div>
            <el-icon class="stat-icon" style="color: #f56c6c"><Goods /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 销售趋势 -->
    <el-card shadow="hover" class="chart-card">
      <template #header>
        <div class="card-header">
          <span>销售趋势（近7天）</span>
        </div>
      </template>
      <v-chart :option="chartOption" style="height: 350px" autoresize />
    </el-card>

    <!-- 热销商品 -->
    <el-card shadow="hover" class="chart-card">
      <template #header>
        <div class="card-header">
          <span>热销商品 TOP 10</span>
        </div>
      </template>
      <el-table :data="topProducts" stripe style="width: 100%">
        <el-table-column type="index" label="排名" width="80" />
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="sales" label="销量" width="120" sortable />
        <el-table-column prop="revenue" label="销售额" width="150">
          <template #default="{ row }">
            ¥{{ row.revenue || '0.00' }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { dashboardApi } from '../../api'

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent])

const overview = ref({})
const topProducts = ref([])

const chartOption = reactive({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['订单数', '销售额']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: []
  },
  yAxis: [
    {
      type: 'value',
      name: '订单数'
    },
    {
      type: 'value',
      name: '销售额(元)'
    }
  ],
  series: [
    {
      name: '订单数',
      type: 'line',
      smooth: true,
      data: [],
      itemStyle: { color: '#409eff' }
    },
    {
      name: '销售额',
      type: 'line',
      smooth: true,
      yAxisIndex: 1,
      data: [],
      itemStyle: { color: '#67c23a' }
    }
  ]
})

async function fetchOverview() {
  try {
    const res = await dashboardApi.getOverview()
    overview.value = res.data || res
  } catch (e) {
    // handled by interceptor
  }
}

async function fetchSalesTrend() {
  try {
    const res = await dashboardApi.getSalesTrend({ days: 7 })
    const data = res.data || res
    if (data && data.dates) {
      chartOption.xAxis.data = data.dates
      chartOption.series[0].data = data.orders
      chartOption.series[1].data = data.revenues
    }
  } catch (e) {
    // handled by interceptor
  }
}

async function fetchTopProducts() {
  try {
    const res = await dashboardApi.getTopProducts({ limit: 10 })
    topProducts.value = res.data || res || []
  } catch (e) {
    // handled by interceptor
  }
}

onMounted(() => {
  fetchOverview()
  fetchSalesTrend()
  fetchTopProducts()
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-label {
  margin: 0 0 8px;
  font-size: 14px;
  color: #909399;
}

.stat-value {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-icon {
  font-size: 48px;
  opacity: 0.6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
</style>
