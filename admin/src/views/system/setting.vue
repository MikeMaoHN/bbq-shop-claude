<template>
  <div class="setting-page">
    <!-- 基础设置 -->
    <el-card shadow="never" v-loading="loading" style="margin-bottom: 20px">
      <template #header>
        <span>基础设置</span>
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

    <!-- 支付设置 -->
    <el-card shadow="never" v-loading="payLoading">
      <template #header>
        <span>支付设置</span>
      </template>

      <el-form label-width="140px" style="max-width: 600px">
        <el-form-item label="支付模式">
          <el-switch
            v-model="isMockPay"
            :loading="payToggling"
            active-text="模拟支付（测试）"
            inactive-text="真实支付（生产）"
            active-color="#e6a23c"
            inactive-color="#67c23a"
            @change="handlePayModeChange"
          />
        </el-form-item>
        <el-form-item>
          <el-alert
            v-if="isMockPay"
            title="当前为【模拟支付】模式"
            type="warning"
            :closable="false"
            show-icon
          >
            <template #default>
              用户下单后将自动模拟支付成功，无需真实微信支付流程。适用于开发测试和生产环境验收。
              切换后<strong>立即生效</strong>，无需重启服务。
            </template>
          </el-alert>
          <el-alert
            v-else
            title="当前为【真实支付】模式"
            type="success"
            :closable="false"
            show-icon
          >
            <template #default>
              用户下单后将调起真实微信收银台，需配置 <code>WX_MCH_ID</code> / <code>WX_MCH_KEY</code> 等商户参数。
            </template>
          </el-alert>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { settingApi, payApi } from '../../api'

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

// ── 支付模式 ──
const payLoading = ref(false)
const payToggling = ref(false)
const isMockPay = ref(false)

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

async function fetchPayMode() {
  payLoading.value = true
  try {
    const res = await payApi.getMockMode()
    isMockPay.value = (res.data || res).mock === true
  } catch (e) {
    // handled by interceptor
  } finally {
    payLoading.value = false
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

async function handlePayModeChange(val) {
  payToggling.value = true
  try {
    await payApi.setMockMode(val)
    ElMessage.success(val ? '已切换为模拟支付模式' : '已切换为真实支付模式')
  } catch (e) {
    isMockPay.value = !val // 切换失败回滚
  } finally {
    payToggling.value = false
  }
}

onMounted(() => {
  fetchSettings()
  fetchPayMode()
})
</script>

<style scoped>
.form-tip {
  margin-left: 8px;
  color: #909399;
  font-size: 13px;
}
code {
  background: #f5f7fa;
  padding: 0 4px;
  border-radius: 3px;
  font-size: 12px;
}
</style>
