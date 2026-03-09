<template>
  <div class="admin-page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="openDialog()">添加管理员</el-button>
      </div>

      <el-table :data="adminList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'super' ? 'danger' : ''">
              {{ row.role === 'super' ? '超级管理员' : '普通管理员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
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
      :title="editingItem ? '编辑管理员' : '添加管理员'"
      width="500px"
      destroy-on-close
    >
      <el-form ref="dialogFormRef" :model="dialogForm" :rules="dialogRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="dialogForm.username" placeholder="请输入用户名" :disabled="!!editingItem" />
        </el-form-item>
        <el-form-item label="密码" :prop="editingItem ? '' : 'password'">
          <el-input v-model="dialogForm.password" type="password" :placeholder="editingItem ? '不修改请留空' : '请输入密码'" show-password />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="dialogForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="dialogForm.role" placeholder="请选择角色">
            <el-option label="超级管理员" value="super" />
            <el-option label="普通管理员" value="admin" />
          </el-select>
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
import { adminApi } from '../../api'

const loading = ref(false)
const saving = ref(false)
const adminList = ref([])
const dialogVisible = ref(false)
const editingItem = ref(null)
const dialogFormRef = ref()

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const dialogForm = reactive({
  username: '',
  password: '',
  name: '',
  role: 'admin',
  status: 1
})

const dialogRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

function openDialog(item = null) {
  editingItem.value = item
  if (item) {
    Object.assign(dialogForm, {
      username: item.username,
      password: '',
      name: item.name,
      role: item.role || 'admin',
      status: item.status ?? 1
    })
  } else {
    Object.assign(dialogForm, {
      username: '',
      password: '',
      name: '',
      role: 'admin',
      status: 1
    })
  }
  dialogVisible.value = true
}

async function fetchList() {
  loading.value = true
  try {
    const res = await adminApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    const data = res.data || res
    adminList.value = data.list || data.rows || []
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
    const payload = { ...dialogForm }
    if (editingItem.value && !payload.password) {
      delete payload.password
    }
    if (editingItem.value) {
      await adminApi.update(editingItem.value.id, payload)
      ElMessage.success('更新成功')
    } else {
      await adminApi.create(payload)
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
</style>
