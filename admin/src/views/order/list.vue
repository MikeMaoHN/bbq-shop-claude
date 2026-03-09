<template>
  <div class="order-list">
    <!-- 状态标签页 -->
    <el-card shadow="never" class="search-card">
      <el-tabs v-model="activeStatus" @tab-change="handleStatusChange">
        <el-tab-pane label="全部" name="" />
        <el-tab-pane label="待付款" name="0" />
        <el-tab-pane label="待发货" name="1" />
        <el-tab-pane label="待收货" name="2" />
        <el-tab-pane label="已完成" name="3" />
        <el-tab-pane label="已取消" name="4" />
        <el-tab-pane label="退款中" name="5" />
        <el-tab-pane label="已退款" name="6" />
      </el-tabs>

      <el-form :inline="true" :model="searchForm">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.order_no" placeholder="请输入订单号" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单表格 -->
    <el-card shadow="never">
      <el-table :data="orderList" v-loading="loading" stripe>
        <el-table-column prop="order_no" label="订单号" width="200" />
        <el-table-column label="用户" width="120">
          <template #default="{ row }">
            {{ row.user?.nickname || row.user_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="商品信息" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.items && row.items.length">
              {{ row.items.map(i => `${i.name}x${i.quantity}`).join('、') }}
            </span>
            <span v-else>{{ row.items_summary || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="订单金额" width="110">
          <template #default="{ row }">
            ¥{{ row.total_amount || row.total }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">
              {{ statusMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="170" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/order-detail/${row.id}`)">详情</el-button>
            <el-button v-if="row.status === 1" link type="success" @click="handleDeliver(row)">发货</el-button>
            <el-button v-if="row.status === 5" link type="warning" @click="handleRefund(row)">处理退款</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <!-- 发货弹窗 -->
    <el-dialog v-model="deliverDialogVisible" title="确认发货" width="400px">
      <el-form :model="deliverForm" label-width="100px">
        <el-form-item label="物流单号">
          <el-input v-model="deliverForm.tracking_no" placeholder="请输入物流单号（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deliverDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="delivering" @click="confirmDeliver">确认发货</el-button>
      </template>
    </el-dialog>

    <!-- 退款弹窗 -->
    <el-dialog v-model="refundDialogVisible" title="处理退款" width="400px">
      <el-form :model="refundForm" label-width="100px">
        <el-form-item label="处理结果">
          <el-radio-group v-model="refundForm.action">
            <el-radio label="approve">同意退款</el-radio>
            <el-radio label="reject">拒绝退款</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="refundForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="refunding" @click="confirmRefund">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { orderApi } from '../../api'

const statusMap = {
  0: '待付款',
  1: '待发货',
  2: '待收货',
  3: '已完成',
  4: '已取消',
  5: '退款中',
  6: '已退款'
}

function statusTagType(status) {
  const map = { 0: 'info', 1: 'warning', 2: '', 3: 'success', 4: 'info', 5: 'danger', 6: 'info' }
  return map[status] || 'info'
}

const loading = ref(false)
const orderList = ref([])
const activeStatus = ref('')

const searchForm = reactive({
  order_no: '',
  dateRange: null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 发货
const deliverDialogVisible = ref(false)
const delivering = ref(false)
const currentOrder = ref(null)
const deliverForm = reactive({ tracking_no: '' })

// 退款
const refundDialogVisible = ref(false)
const refunding = ref(false)
const refundForm = reactive({ action: 'approve', remark: '' })

async function fetchList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      order_no: searchForm.order_no || undefined,
      status: activeStatus.value !== '' ? Number(activeStatus.value) : undefined
    }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.start_date = searchForm.dateRange[0]
      params.end_date = searchForm.dateRange[1]
    }
    const res = await orderApi.getList(params)
    const data = res.data || res
    orderList.value = data.list || data.rows || []
    pagination.total = data.total || 0
  } catch (e) {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}

function handleStatusChange() {
  pagination.page = 1
  fetchList()
}

function handleSearch() {
  pagination.page = 1
  fetchList()
}

function resetSearch() {
  searchForm.order_no = ''
  searchForm.dateRange = null
  activeStatus.value = ''
  handleSearch()
}

function handleDeliver(order) {
  currentOrder.value = order
  deliverForm.tracking_no = ''
  deliverDialogVisible.value = true
}

async function confirmDeliver() {
  delivering.value = true
  try {
    await orderApi.deliver(currentOrder.value.id, { tracking_no: deliverForm.tracking_no })
    ElMessage.success('发货成功')
    deliverDialogVisible.value = false
    fetchList()
  } catch (e) {
    // handled by interceptor
  } finally {
    delivering.value = false
  }
}

function handleRefund(order) {
  currentOrder.value = order
  refundForm.action = 'approve'
  refundForm.remark = ''
  refundDialogVisible.value = true
}

async function confirmRefund() {
  refunding.value = true
  try {
    await orderApi.handleRefund(currentOrder.value.id, { ...refundForm })
    ElMessage.success('处理成功')
    refundDialogVisible.value = false
    fetchList()
  } catch (e) {
    // handled by interceptor
  } finally {
    refunding.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.order-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-card .el-form {
  margin-top: 10px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
