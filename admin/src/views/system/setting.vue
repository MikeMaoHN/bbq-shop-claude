<template>
  <div class="setting-page">
    <el-card shadow="never" v-loading="loading">
      <template #header>
        <span>系统设置</span>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="140px"
        style="max-width: 600px"
      >
        <el-form-item label="店铺名称" prop="shop_name">
          <el-input v-model="form.shop_name" placeholder="请输入店铺名称" />
        </el-form-item>
        <el-form-item label="联系电话" prop="shop_phone">
          <el-input v-model="form.shop_phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="配送费" prop="delivery_fee">
          <el-input-number v-model="form.delivery_fee" :min="0" :precision="2" />
          <span class="form-tip">元</span>
        </el-form-item>
        <el-form-item label="免配送费金额" prop="free_delivery_amount">
          <el-input-number v-model="form.free_delivery_amount" :min="0" :precision="2" />
          <span class="form-tip">元（满此金额免配送费）</span>
        </el-form-item>
        <el-form-item label="最低起送金额" prop="min_order_amount">
          <el-input-number v-model="form.min_order_amount" :min="0" :precision="2" />
          <span class="form-tip">元</span>
        </el-form-item>
        <el-form-item label="营业时间" prop="business_hours">
          <el-input v-model="form.business_hours" placeholder="例如：10:00-22:00" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { settingApi } from '../../api'

const formRef = ref()
const loading = ref(false)
const saving = ref(false)

const form = reactive({
  shop_name: '',
  shop_phone: '',
  delivery_fee: 0,
  free_delivery_amount: 0,
  min_order_amount: 0,
  business_hours: ''
})

const rules = {
  shop_name: [{ required: true, message: '请输入店铺名称', trigger: 'blur' }],
  shop_phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
}

async function fetchSettings() {
  loading.value = true
  try {
    const res = await settingApi.get()
    const data = res.data || res
    if (data) {
      Object.assign(form, {
        shop_name: data.shop_name || '',
        shop_phone: data.shop_phone || '',
        delivery_fee: data.delivery_fee || 0,
        free_delivery_amount: data.free_delivery_amount || 0,
        min_order_amount: data.min_order_amount || 0,
        business_hours: data.business_hours || ''
      })
    }
  } catch (e) {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    await settingApi.update({ ...form })
    ElMessage.success('保存成功')
  } catch (e) {
    // handled by interceptor
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<style scoped>
.form-tip {
  margin-left: 8px;
  color: #909399;
  font-size: 13px;
}
</style>
