<template>
  <div class="order-detail" v-loading="loading">
    <el-page-header @back="$router.back()" content="订单详情" style="margin-bottom: 20px" />

    <!-- 订单信息 -->
    <el-card shadow="never" class="detail-card">
      <template #header><span>订单信息</span></template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="订单号">{{ order.order_no }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="statusTagType(order.status)">{{ statusMap[order.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ order.created_at }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ order.paid_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发货时间">{{ order.delivered_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ order.completed_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">¥{{ order.total_amount || order.total }}</el-descriptions-item>
        <el-descriptions-item label="运费">¥{{ order.delivery_fee || '0.00' }}</el-descriptions-item>
        <el-descriptions-item label="优惠金额">¥{{ order.discount_amount || '0.00' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 收货信息 -->
    <el-card shadow="never" class="detail-card">
      <template #header><span>收货信息</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="收货人">{{ order.address?.name || order.receiver_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ order.address?.phone || order.receiver_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="2">{{ order.address?.full_address || order.receiver_address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ order.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 商品列表 -->
    <el-card shadow="never" class="detail-card">
      <template #header><span>商品明细</span></template>
      <el-table :data="order.items || []" stripe>
        <el-table-column label="商品图片" width="80">
          <template #default="{ row }">
            <el-image :src="row.image" style="width: 50px; height: 50px" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="200" />
        <el-table-column prop="spec_name" label="规格" width="120">
          <template #default="{ row }">{{ row.spec_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="price" label="单价" width="100">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column label="小计" width="100">
          <template #default="{ row }">¥{{ (row.price * row.quantity).toFixed(2) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 操作按钮 -->
    <el-card shadow="never" class="detail-card" v-if="order.status === 1 || order.status === 5">
      <template #header><span>订单操作</span></template>
      <el-button v-if="order.status === 1" type="primary" @click="handleDeliver">确认发货</el-button>
      <el-button v-if="order.status === 5" type="warning" @click="handleRefund('approve')">同意退款</el-button>
      <el-button v-if="order.status === 5" type="danger" @click="handleRefund('reject')">拒绝退款</el-button>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { orderApi } from '../../api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const order = ref({})

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

async function fetchDetail() {
  loading.value = true
  try {
    const res = await orderApi.getDetail(route.params.id)
    order.value = res.data || res
  } catch (e) {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}

async function handleDeliver() {
  try {
    await ElMessageBox.confirm('确认发货吗？', '提示', { type: 'warning' })
    await orderApi.deliver(route.params.id, {})
    ElMessage.success('发货成功')
    fetchDetail()
  } catch (e) {
    if (e !== 'cancel') {
      // handled by interceptor
    }
  }
}

async function handleRefund(action) {
  const actionText = action === 'approve' ? '同意退款' : '拒绝退款'
  try {
    await ElMessageBox.confirm(`确认${actionText}吗？`, '提示', { type: 'warning' })
    await orderApi.handleRefund(route.params.id, { action })
    ElMessage.success('操作成功')
    fetchDetail()
  } catch (e) {
    if (e !== 'cancel') {
      // handled by interceptor
    }
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.detail-card {
  margin-bottom: 16px;
}
</style>
