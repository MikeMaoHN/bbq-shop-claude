<template>
  <div class="category-page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="openDialog()">添加分类</el-button>
      </div>

      <el-table
        :data="categoryList"
        v-loading="loading"
        row-key="id"
        :tree-props="{ children: 'children' }"
        stripe
        default-expand-all
      >
        <el-table-column prop="name" label="分类名称" min-width="200" />
        <el-table-column prop="icon" label="图标" width="100">
          <template #default="{ row }">
            <el-image v-if="row.icon" :src="row.icon" style="width: 30px; height: 30px" fit="cover" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="100" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm
              title="确定删除该分类吗？"
              @confirm="handleDelete(row.id)"
            >
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
      :title="editingCategory ? '编辑分类' : '添加分类'"
      width="500px"
      destroy-on-close
    >
      <el-form ref="dialogFormRef" :model="dialogForm" :rules="dialogRules" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="dialogForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="上级分类">
          <el-select v-model="dialogForm.parent_id" placeholder="无（顶级分类）" clearable>
            <el-option
              v-for="cat in topCategories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="dialogForm.icon" placeholder="图标URL" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="dialogForm.sort_order" :min="0" :max="999" />
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
import { categoryApi } from '../../api'

const loading = ref(false)
const saving = ref(false)
const categoryList = ref([])
const dialogVisible = ref(false)
const editingCategory = ref(null)
const dialogFormRef = ref()

const topCategories = computed(() => {
  return categoryList.value.filter(c => !c.parent_id)
})

const dialogForm = reactive({
  name: '',
  parent_id: '',
  icon: '',
  sort_order: 0
})

const dialogRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

function openDialog(category = null) {
  editingCategory.value = category
  if (category) {
    Object.assign(dialogForm, {
      name: category.name,
      parent_id: category.parent_id || '',
      icon: category.icon || '',
      sort_order: category.sort_order || 0
    })
  } else {
    Object.assign(dialogForm, {
      name: '',
      parent_id: '',
      icon: '',
      sort_order: 0
    })
  }
  dialogVisible.value = true
}

async function fetchList() {
  loading.value = true
  try {
    const res = await categoryApi.getList()
    const data = res.data || res
    categoryList.value = data.list || data || []
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
    if (editingCategory.value) {
      await categoryApi.update(editingCategory.value.id, { ...dialogForm })
      ElMessage.success('更新成功')
    } else {
      await categoryApi.create({ ...dialogForm })
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
    await categoryApi.remove(id)
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
