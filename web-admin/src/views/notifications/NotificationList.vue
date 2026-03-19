<template>
  <div class="notification-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>消息通知</span>
          <el-button
            v-if="pagination.total > 0"
            type="primary"
            size="small"
            @click="handleMarkAllRead"
          >全部已读</el-button>
        </div>
      </template>

      <el-table
        :data="tableData"
        style="width: 100%"
        v-loading="loading"
        row-class-name="notification-row"
      >
        <el-table-column label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-badge is-dot :type="row.is_read ? '' : 'danger'" />
          </template>
        </el-table-column>
        <el-table-column label="通知内容" min-width="400">
          <template #default="{ row }">
            <div :class="['notification-content', { unread: !row.is_read }]">
              <div class="notification-title">{{ row.title }}</div>
              <div class="notification-body">{{ row.content }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="180" />
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.ref_type === 'order' && row.ref_id"
              type="primary"
              size="small"
              @click="viewOrder(row.ref_id)"
            >查看订单</el-button>
            <el-button
              v-if="!row.is_read"
              size="small"
              @click="handleMarkRead(row)"
            >标为已读</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadNotifications"
          @current-change="loadNotifications"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
/**
 * 站内信通知列表页
 * 展示所有通知，未读优先高亮。支持单条已读、全部已读，
 * 点击「查看订单」可跳转到对应订单详情页。
 */
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

onMounted(() => {
  loadNotifications()
})

/** 加载通知列表 */
const loadNotifications = async () => {
  loading.value = true
  try {
    const result = await api.getNotifications({
      page: pagination.page,
      limit: pagination.limit
    })
    tableData.value = result.list
    pagination.total = result.total
  } catch (error) {
    console.error('加载通知失败:', error)
  } finally {
    loading.value = false
  }
}

/** 单条标为已读 */
const handleMarkRead = async (row) => {
  try {
    await api.markNotificationRead(row.id)
    row.is_read = 1
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

/** 全部标为已读后刷新列表 */
const handleMarkAllRead = async () => {
  try {
    await api.markAllNotificationsRead()
    ElMessage.success('已全部标记为已读')
    loadNotifications()
  } catch (error) {
    console.error('全部已读失败:', error)
  }
}

/** 跳转到关联订单详情 */
const viewOrder = (orderId) => {
  router.push(`/orders/${orderId}`)
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-content {
  padding: 4px 0;
}

.notification-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.notification-body {
  font-size: 13px;
  color: #606266;
}

.notification-content.unread .notification-title {
  font-weight: bold;
  color: #303133;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
