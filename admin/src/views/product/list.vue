<template>
  <div class="product-list">
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="商品名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.category_id" placeholder="全部分类" clearable>
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <el-card shadow="never">
      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="$router.push('/product-add')">添加商品</el-button>
      </div>

      <el-table :data="productList" v-loading="loading" stripe>
        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <el-image
              :src="row.image || row.images?.[0]"
              style="width: 50px; height: 50px"
              fit="cover"
              :preview-src-list="row.images || [row.image]"
            />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            ¥{{ row.price }}
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column prop="sales" label="销量" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              @change="handleStatusChange(row)"
              active-text="上架"
              inactive-text="下架"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/product-edit/${row.id}`)">编辑</el-button>
            <el-popconfirm
              title="确定删除该商品吗？"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { productApi, categoryApi } from '../../api'

const loading = ref(false)
const productList = ref([])
const categories = ref([])

const searchForm = reactive({
  keyword: '',
  category_id: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

async function fetchList() {
  loading.value = true
  try {
    const res = await productApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    })
    const data = res.data || res
    productList.value = data.list || data.rows || []
    pagination.total = data.total || 0
  } catch (e) {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  try {
    const res = await categoryApi.getList()
    const data = res.data || res
    categories.value = data.list || data || []
  } catch (e) {
    // handled by interceptor
  }
}

function handleSearch() {
  pagination.page = 1
  fetchList()
}

function resetSearch() {
  searchForm.keyword = ''
  searchForm.category_id = ''
  searchForm.status = ''
  handleSearch()
}

async function handleStatusChange(row) {
  try {
    const newStatus = row.status === 1 ? 0 : 1
    await productApi.updateStatus(row.id, newStatus)
    ElMessage.success(newStatus === 1 ? '已上架' : '已下架')
    fetchList()
  } catch (e) {
    // handled by interceptor
  }
}

async function handleDelete(id) {
  try {
    await productApi.remove(id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (e) {
    // handled by interceptor
  }
}

onMounted(() => {
  fetchList()
  fetchCategories()
})
</script>

<style scoped>
.product-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  margin-bottom: 16px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
