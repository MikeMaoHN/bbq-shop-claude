<template>
  <div class="coupon-page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="openDialog()">添加优惠券</el-button>
      </div>

      <el-table :data="couponList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? '' : 'success'">
              {{ row.type === 1 ? '满减' : '折扣' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优惠值" width="100">
          <template #default="{ row }">
            {{ row.type === 1 ? `¥${row.value}` : `${row.value}折` }}
          </template>
        </el-table-column>
        <el-table-column prop="min_amount" label="最低消费" width="100">
          <template #default="{ row }">¥{{ row.min_amount || '0' }}</template>
        </el-table-column>
        <el-table-column prop="start_date" label="开始时间" width="120" />
        <el-table-column prop="end_date" label="结束时间" width="120" />
        <el-table-column label="已领/总量" width="110">
          <template #default="{ row }">
            {{ row.received_count || 0 }}/{{ row.total_count || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 添加/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingItem ? '编辑优惠券' : '添加优惠券'"
      width="550px"
      destroy-on-close
    >
      <el-form ref="dialogFormRef" :model="dialogForm" :rules="dialogRules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="dialogForm.name" placeholder="请输入优惠券名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="dialogForm.type">
            <el-radio :value="1">满减</el-radio>
            <el-radio :value="2">折扣</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="优惠值" prop="value">
          <el-input-number v-model="dialogForm.value" :min="0" :precision="dialogForm.type === 1 ? 2 : 1" />
          <span class="form-tip">{{ dialogForm.type === 1 ? '元' : '折' }}</span>
        </el-form-item>
        <el-form-item label="最低消费" prop="min_amount">
          <el-input-number v-model="dialogForm.min_amount" :min="0" :precision="2" />
          <span class="form-tip">元</span>
        </el-form-item>
        <el-form-item label="有效期" prop="dateRange">
          <el-date-picker
            v-model="dialogForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="发放总量" prop="total_count">
          <el-input-number v-model="dialogForm.total_count" :min="1" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="dialogForm.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { couponApi } from '../../api'

const loading = ref(false)
const saving = ref(false)
const couponList = ref([])
const dialogVisible = ref(false)
const editingItem = ref(null)
const dialogFormRef = ref()

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const dialogForm = reactive({
  name: '',
  type: 1,
  value: 0,
  min_amount: 0,
  dateRange: null,
  total_count: 100,
  status: 1
})

const dialogRules = {
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  value: [{ required: true, message: '请输入优惠值', trigger: 'blur' }]
}

function openDialog(item = null) {
  editingItem.value = item
  if (item) {
    Object.assign(dialogForm, {
      name: item.name,
      type: item.type,
      value: item.value,
      min_amount: item.min_amount || 0,
      dateRange: item.start_date && item.end_date ? [item.start_date, item.end_date] : null,
      total_count: item.total_count || 100,
      status: item.status ?? 1
    })
  } else {
    Object.assign(dialogForm, {
      name: '',
      type: 1,
      value: 0,
      min_amount: 0,
      dateRange: null,
      total_count: 100,
      status: 1
    })
  }
  dialogVisible.value = true
}

async function fetchList() {
  loading.value = true
  try {
    const res = await couponApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    const data = res.data || res
    couponList.value = data.list || data.rows || []
    pagination.total = data.total || 0
  } catch (e) {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  const valid = await dialogFormRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const payload = {
      name: dialogForm.name,
      type: dialogForm.type,
      value: dialogForm.value,
      min_amount: dialogForm.min_amount,
      total_count: dialogForm.total_count,
      status: dialogForm.status,
      start_date: dialogForm.dateRange?.[0] || '',
      end_date: dialogForm.dateRange?.[1] || ''
    }
    if (editingItem.value) {
      await couponApi.update(editingItem.value.id, payload)
      ElMessage.success('更新成功')
    } else {
      await couponApi.create(payload)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (e) {
    // handled by interceptor
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.form-tip {
  margin-left: 8px;
  color: #909399;
}
</style>
