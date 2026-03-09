<template>
  <div class="user-page">
    <el-card shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="搜索">
          <el-input v-model="searchForm.keyword" placeholder="昵称/手机号" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="userList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.avatar" :size="40">
              <el-icon><User /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="order_count" label="订单数" width="100" />
        <el-table-column prop="total_spent" label="消费总额" width="120">
          <template #default="{ row }">
            ¥{{ row.total_spent || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="170" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { User } from '@element-plus/icons-vue'
import { userApi } from '../../api'

const loading = ref(false)
const userList = ref([])

const searchForm = reactive({
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

async function fetchList() {
  loading.value = true
  try {
    const res = await userApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined
    })
    const data = res.data || res
    userList.value = data.list || data.rows || []
    pagination.total = data.total || 0
  } catch (e) {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchList()
}

function resetSearch() {
  searchForm.keyword = ''
  handleSearch()
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.search-form {
  margin-bottom: 16px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
