<template>
  <div class="banner-page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="openDialog()">添加轮播图</el-button>
      </div>

      <el-table :data="bannerList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="图片" width="200">
          <template #default="{ row }">
            <el-image
              :src="row.image"
              style="width: 160px; height: 80px"
              fit="cover"
              :preview-src-list="[row.image]"
            />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="150" />
        <el-table-column prop="link" label="链接" min-width="150" show-overflow-tooltip />
        <el-table-column prop="sort_order" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm title="确定删除吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingItem ? '编辑轮播图' : '添加轮播图'"
      width="550px"
      destroy-on-close
    >
      <el-form ref="dialogFormRef" :model="dialogForm" :rules="dialogRules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="dialogForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="图片" prop="image">
          <el-upload
            :action="uploadAction"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            accept="image/*"
          >
            <el-image v-if="dialogForm.image" :src="dialogForm.image" style="width: 200px; height: 100px" fit="cover" />
            <el-button v-else type="primary" plain>上传图片</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="dialogForm.link" placeholder="跳转链接（可选）" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="dialogForm.sort_order" :min="0" :max="999" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { bannerApi } from '../../api'

const loading = ref(false)
const saving = ref(false)
const bannerList = ref([])
const dialogVisible = ref(false)
const editingItem = ref(null)
const dialogFormRef = ref()

const uploadAction = '/api/admin/upload'
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('admin_token')}`
}))

const dialogForm = reactive({
  title: '',
  image: '',
  link: '',
  sort_order: 0,
  status: 1
})

const dialogRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  image: [{ required: true, message: '请上传图片', trigger: 'change' }]
}

function openDialog(item = null) {
  editingItem.value = item
  if (item) {
    Object.assign(dialogForm, {
      title: item.title,
      image: item.image,
      link: item.link || '',
      sort_order: item.sort_order || 0,
      status: item.status ?? 1
    })
  } else {
    Object.assign(dialogForm, {
      title: '',
      image: '',
      link: '',
      sort_order: 0,
      status: 1
    })
  }
  dialogVisible.value = true
}

function handleUploadSuccess(response) {
  dialogForm.image = response.data?.url || response.url
}

async function fetchList() {
  loading.value = true
  try {
    const res = await bannerApi.getList()
    const data = res.data || res
    bannerList.value = data.list || data || []
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
    if (editingItem.value) {
      await bannerApi.update(editingItem.value.id, { ...dialogForm })
      ElMessage.success('更新成功')
    } else {
      await bannerApi.create({ ...dialogForm })
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

async function handleDelete(id) {
  try {
    await bannerApi.remove(id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (e) {
    // handled by interceptor
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
</style>
