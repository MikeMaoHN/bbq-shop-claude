<template>
  <div class="order-list">
    <el-card>
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select v-model="searchForm.status" placeholder="订单状态" clearable style="width: 150px; margin-right: 10px;">
            <el-option label="待付款" :value="0" />
            <el-option label="待发货" :value="1" />
            <el-option label="待收货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
          <el-button type="primary" @click="loadOrders">搜索</el-button>
        </div>
      </div>

      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="user_nickname" label="用户" width="100" />
        <el-table-column prop="receiver_name" label="收货人" width="100" />
        <el-table-column prop="receiver_phone" label="电话" width="120" />
        <el-table-column label="商品信息" min-width="250">
          <template #default="{ row }">
            <div class="goods-info">
              <div v-for="item in row.items" :key="item.id" class="goods-item">
                <span>{{ item.product_name }} x{{ item.quantity }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="订单金额" width="100" align="right">
          <template #default="{ row }">¥{{ (row.total_amount / 100).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="170" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row.id)">详情</el-button>
            <el-button
              v-if="row.status === 1"
              type="success"
              size="small"
              @click="showShipDialog(row)"
            >
              发货
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadOrders"
          @current-change="loadOrders"
        />
      </div>
    </el-card>

    <!-- 发货对话框 -->
    <el-dialog v-model="shipDialogVisible" title="发货" width="500px">
      <el-form :model="shipForm" label-width="100px">
        <el-form-item label="物流公司">
          <el-input v-model="shipForm.logisticsCompany" placeholder="请输入物流公司名称" />
        </el-form-item>
        <el-form-item label="物流单号">
          <el-input v-model="shipForm.logisticsNo" placeholder="请输入物流单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleShip">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 订单列表页
 * 支持按订单状态筛选和分页浏览，状态为 1（待发货）的订单可直接在列表发货。
 *
 * 订单状态枚举：0=待付款 1=待发货 2=待收货 3=已完成 4=已取消
 */
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const shipDialogVisible = ref(false)
// 记录当前准备发货的订单行数据
const currentOrder = ref(null)

// 搜索条件（空字符串表示不筛选状态）
const searchForm = reactive({
  status: ''
})

// 分页参数，每次翻页/切换条数后重新请求
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 发货表单（物流公司 + 运单号）
const shipForm = reactive({
  logisticsCompany: '',
  logisticsNo: ''
})

// 状态码 → 文字映射
const statusMap = {
  0: '待付款',
  1: '待发货',
  2: '待收货',
  3: '已完成',
  4: '已取消'
}

// 状态码 → Element Plus Tag 类型映射
const statusTypeMap = {
  0: 'warning',
  1: 'primary',
  2: 'success',
  3: 'success',
  4: 'info'
}

onMounted(() => {
  loadOrders()
})

const statusText = (status) => statusMap[status] || '未知'
const statusType = (status) => statusTypeMap[status] || 'info'

/** 加载订单列表，status 为空时不传该参数（查全部状态） */
const loadOrders = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      // status 为空字符串时不传，避免后端将空字符串误解析为状态值
      status: searchForm.status !== '' ? searchForm.status : undefined
    }
    const result = await api.getOrders(params)
    tableData.value = result.list
    pagination.total = result.total
  } catch (error) {
    console.error('加载订单失败:', error)
  } finally {
    loading.value = false
  }
}

/** 跳转到订单详情页 */
const viewDetail = (id) => {
  router.push(`/orders/${id}`)
}

/** 打开发货对话框，清空上次填写的物流信息 */
const showShipDialog = (row) => {
  currentOrder.value = row
  shipForm.logisticsCompany = ''
  shipForm.logisticsNo = ''
  shipDialogVisible.value = true
}

/** 提交发货，将订单状态从待发货（1）改为待收货（2） */
const handleShip = async () => {
  if (!shipForm.logisticsCompany || !shipForm.logisticsNo) {
    ElMessage.warning('请填写完整的物流信息')
    return
  }

  try {
    await api.shipOrder(currentOrder.value.id, shipForm)
    ElMessage.success('发货成功')
    shipDialogVisible.value = false
    loadOrders()
  } catch (error) {
    console.error('发货失败:', error)
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.goods-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.goods-item {
  font-size: 13px;
  color: #666;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
