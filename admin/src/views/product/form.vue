<template>
  <div class="product-form">
    <el-card shadow="never">
      <template #header>
        <span>{{ isEdit ? '编辑商品' : '添加商品' }}</span>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        style="max-width: 800px"
      >
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称" />
        </el-form-item>

        <el-form-item label="商品分类" prop="category_id">
          <el-cascader
            v-model="form.category_id"
            :options="categoryOptions"
            :props="{ value: 'id', label: 'name', checkStrictly: true, emitPath: false }"
            placeholder="请选择分类"
            clearable
          />
        </el-form-item>

        <el-form-item label="售价" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" />
        </el-form-item>

        <el-form-item label="原价" prop="original_price">
          <el-input-number v-model="form.original_price" :min="0" :precision="2" :step="1" />
        </el-form-item>

        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" :step="1" />
        </el-form-item>

        <el-form-item label="商品图片" prop="images">
          <el-upload
            v-model:file-list="fileList"
            :action="uploadAction"
            :headers="uploadHeaders"
            list-type="picture-card"
            :on-success="handleUploadSuccess"
            :on-remove="handleUploadRemove"
            :before-upload="beforeUpload"
            accept="image/*"
            :limit="6"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入商品描述"
          />
        </el-form-item>

        <el-form-item label="商品规格">
          <div class="specs-container">
            <div v-for="(spec, index) in form.specs" :key="index" class="spec-row">
              <el-input v-model="spec.name" placeholder="规格名称" style="width: 150px" />
              <el-input-number v-model="spec.price" :min="0" :precision="2" placeholder="价格" style="width: 140px" />
              <el-input-number v-model="spec.stock" :min="0" placeholder="库存" style="width: 120px" />
              <el-button type="danger" :icon="Delete" circle @click="removeSpec(index)" />
            </div>
            <el-button type="primary" plain :icon="Plus" @click="addSpec">添加规格</el-button>
          </div>
        </el-form-item>

        <el-form-item label="热门推荐">
          <el-switch v-model="form.is_hot" :active-value="1" :inactive-value="0" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { productApi, categoryApi } from '../../api'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const submitting = ref(false)
const fileList = ref([])
const categoryOptions = ref([])

const isEdit = computed(() => !!route.params.id)

const uploadAction = '/api/admin/upload'
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('admin_token')}`
}))

const form = reactive({
  name: '',
  category_id: '',
  price: 0,
  original_price: 0,
  stock: 0,
  images: [],
  description: '',
  specs: [],
  is_hot: 0
})

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入售价', trigger: 'blur' }]
}

function addSpec() {
  form.specs.push({ name: '', price: 0, stock: 0 })
}

function removeSpec(index) {
  form.specs.splice(index, 1)
}

function handleUploadSuccess(response) {
  const url = response.data?.url || response.url
  if (url) {
    form.images.push(url)
  }
}

function handleUploadRemove(file) {
  const url = file.response?.data?.url || file.response?.url || file.url
  const index = form.images.indexOf(url)
  if (index > -1) {
    form.images.splice(index, 1)
  }
}

function beforeUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB')
    return false
  }
  return true
}

async function fetchCategories() {
  try {
    const res = await categoryApi.getList()
    const data = res.data || res
    categoryOptions.value = data.list || data || []
  } catch (e) {
    // handled by interceptor
  }
}

async function fetchProduct() {
  if (!isEdit.value) return
  try {
    const res = await productApi.getList({ id: route.params.id })
    const data = res.data || res
    const product = Array.isArray(data) ? data[0] : (data.list?.[0] || data)
    if (product) {
      Object.assign(form, {
        name: product.name || '',
        category_id: product.category_id || '',
        price: product.price || 0,
        original_price: product.original_price || 0,
        stock: product.stock || 0,
        images: product.images || [],
        description: product.description || '',
        specs: product.specs || [],
        is_hot: product.is_hot || 0
      })
      fileList.value = (product.images || []).map((url, i) => ({
        name: `image-${i}`,
        url
      }))
    }
  } catch (e) {
    // handled by interceptor
  }
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value) {
      await productApi.update(route.params.id, { ...form })
      ElMessage.success('更新成功')
    } else {
      await productApi.create({ ...form })
      ElMessage.success('添加成功')
    }
    router.push('/products')
  } catch (e) {
    // handled by interceptor
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchCategories()
  fetchProduct()
})
</script>

<style scoped>
.specs-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.spec-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
