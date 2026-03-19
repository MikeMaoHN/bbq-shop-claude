<template>
  <div class="stock-list">
    <el-card>
      <div class="toolbar">
        <div class="toolbar-left">
          <el-alert
            title="库存预警"
            type="warning"
            :closable="false"
            show-icon
          >
            <template #default>
              当前有 <strong>{{ lowStockCount }}</strong> 个商品库存低于预警值（10 件）
            </template>
          </el-alert>
        </div>
        <div class="toolbar-right">
          <el-tag type="success" style="margin-right: 10px;">
            商品总数：{{ pagination.total }}
          </el-tag>
          <el-tag type="warning" style="margin-right: 10px;">
            有库存：{{ inStockCount }}
          </el-tag>
          <el-tag type="danger" style="margin-right: 10px;">
            缺货：{{ outOfStockCount }}
          </el-tag>
          <el-button type="primary" @click="goToProducts">
            <el-icon><ShoppingCart /></el-icon>
            商品管理
          </el-button>
          <el-button type="success" @click="showAddProductDialog">
            <el-icon><Plus /></el-icon>
            新增商品
          </el-button>
        </div>
      </div>

      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="商品名称" min-width="180" />
        <el-table-column prop="category_name" label="分类" width="100" />
        <el-table-column label="价格" width="120" align="right">
          <template #default="{ row }">
            <span style="color: #e74c3c; font-weight: bold;">¥{{ (row.price / 100).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="当前库存" width="150" align="right">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
              <el-tag :type="getStockType(row.stock)" size="large">{{ row.stock }}</el-tag>
              <el-tag v-if="row.stock <= 10 && row.stock > 0" type="warning" size="small">紧张</el-tag>
              <el-tag v-if="row.stock === 0" type="danger" size="small">缺货</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sales" label="销量" width="80" align="right" />
        <el-table-column label="可售状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 && row.stock > 0 ? 'success' : 'info'">
              {{ row.status === 1 && row.stock > 0 ? '可售' : '不可售' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="350" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="showAdjustDialog(row, 'stock')">
              <el-icon><Refresh /></el-icon>
              调整库存
            </el-button>
            <el-button type="warning" size="small" @click="showAdjustDialog(row, 'price')">
              <el-icon><Money /></el-icon>
              修改价格
            </el-button>
            <el-button 
              v-if="row.stock <= 10" 
              type="success" 
              size="small" 
              @click="showAddStock(row)"
            >
              <el-icon><Plus /></el-icon>
              快速补货
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadProducts"
          @current-change="loadProducts"
        />
      </div>
    </el-card>

    <!-- 库存/价格调整对话框 -->
    <el-dialog v-model="adjustDialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="adjustForm" label-width="80px">
        <el-form-item label="商品名称">
          <span style="font-weight: bold;">{{ currentProduct.name }}</span>
        </el-form-item>
        
        <!-- 库存调整表单 -->
        <template v-if="adjustType === 'stock'">
          <el-form-item label="当前库存">
            <el-tag :type="getStockType(currentProduct.stock)">{{ currentProduct.stock }}</el-tag>
            <span style="margin-left: 10px; color: #999;">件</span>
          </el-form-item>
          <el-form-item label="调整方式">
            <el-radio-group v-model="adjustForm.adjustType">
              <el-radio label="set">设为</el-radio>
              <el-radio label="add">增加</el-radio>
              <el-radio label="minus">减少</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="调整数量" prop="changeQty">
            <el-input-number
              v-model="adjustForm.changeQty"
              :min="adjustForm.adjustType === 'set' ? 0 : 1"
              :precision="0"
            />
            <span style="margin-left: 10px; color: #999;">
              {{ adjustForm.adjustType === 'set' ? '直接设置库存数量' : '调整的数量' }}
            </span>
          </el-form-item>
          <el-form-item label="调整原因">
            <el-select v-model="adjustForm.reason" style="width: 100%;">
              <el-option label="手动调整" value="手动调整" />
              <el-option label="库存盘点" value="库存盘点" />
              <el-option label="损耗调整" value="损耗调整" />
              <el-option label="临期处理" value="临期处理" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
        </template>
        
        <!-- 价格调整表单 -->
        <template v-else-if="adjustType === 'price'">
          <el-form-item label="当前价格">
            <span style="color: #e74c3c; font-weight: bold;">¥{{ (currentProduct.price / 100).toFixed(2) }}</span>
          </el-form-item>
          <el-form-item label="新价格" prop="newPrice">
            <el-input-number
              v-model="adjustForm.newPrice"
              :min="0"
              :precision="2"
              :step="0.1"
            />
            <span style="margin-left: 10px; color: #666;">元</span>
          </el-form-item>
          <el-form-item label="调整原因">
            <el-input v-model="adjustForm.reason" placeholder="如：促销活动、成本变化等" />
          </el-form-item>
        </template>
        
        <el-form-item label="备注">
          <el-input v-model="adjustForm.remark" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdjust">确认调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 库存管理页
 * 展示所有商品的库存状态，支持调整库存（设为/增加/减少）和修改价格。
 * 库存 <= 10 件时显示"紧张"标签并支持"快速补货"（默认补 50 件）。
 *
 * 价格字段后端以分存储，前端展示和输入均为元，提交前乘以 100 转分。
 * 库存调整会记录操作流水（通过后端 updateProductStock 接口）。
 */
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const adjustDialogVisible = ref(false)
// 对话框类型：'stock' = 库存调整，'price' = 价格调整
const adjustType = ref('stock')
// 当前正在操作的商品行数据
const currentProduct = ref({})

const pagination = reactive({
  page: 1,
  limit: 50,
  total: 0
})

// 调整表单（库存模式和价格模式共用，通过 adjustType 切换展示字段）
const adjustForm = reactive({
  changeQty: 0,         // 库存调整数量
  adjustType: 'set',    // 库存调整方式：set=设为 / add=增加 / minus=减少
  newPrice: 0,          // 新价格（元）
  reason: '手动调整',
  remark: ''
})

// ===== 工具栏库存统计（computed 实时计算，避免额外请求）=====

/** 库存低于预警线（1~10件）的商品数量 */
const lowStockCount = computed(() => {
  return tableData.value.filter(item => item.stock <= 10 && item.stock > 0).length
})

/** 有库存（stock > 0）的商品数量 */
const inStockCount = computed(() => {
  return tableData.value.filter(item => item.stock > 0).length
})

/** 完全缺货（stock = 0）的商品数量 */
const outOfStockCount = computed(() => {
  return tableData.value.filter(item => item.stock === 0).length
})

/** 对话框标题根据操作类型动态切换 */
const dialogTitle = computed(() => {
  return adjustType.value === 'stock' ? '库存调整' : '价格调整'
})

onMounted(() => {
  loadProducts()
})

/**
 * 根据库存数量返回 Element Plus Tag 类型
 * <= 5 件: danger（红色），6~10 件: warning（黄色），> 10 件: success（绿色）
 */
const getStockType = (stock) => {
  if (stock <= 5) return 'danger'
  if (stock <= 10) return 'warning'
  return 'success'
}

/** 加载商品列表（与商品管理页共用同一接口，此处不传筛选条件，查全部） */
const loadProducts = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit
    }
    const result = await api.getProducts(params)
    tableData.value = result.list
    pagination.total = result.total
  } catch (error) {
    console.error('加载商品失败:', error)
    ElMessage.error('加载商品失败')
  } finally {
    loading.value = false
  }
}

const goToProducts = () => {
  router.push('/products')
}

/** 新增商品跳转到商品管理页操作 */
const showAddProductDialog = () => {
  router.push('/products')
}

/**
 * 打开调整对话框，根据类型初始化表单默认值
 * @param {object} row  - 商品行数据
 * @param {string} type - 'stock' 或 'price'
 */
const showAdjustDialog = (row, type) => {
  currentProduct.value = row
  adjustType.value = type

  if (type === 'stock') {
    adjustForm.changeQty = 0
    adjustForm.adjustType = 'set'   // 默认为"设为"模式
    adjustForm.reason = '手动调整'
  } else {
    // 价格模式：将当前分单位转为元回填
    adjustForm.newPrice = row.price / 100
    adjustForm.reason = ''
  }

  adjustForm.remark = ''
  adjustDialogVisible.value = true
}

/**
 * 快速补货：预设为"增加 50 件"，方便库存紧张时一键操作
 */
const showAddStock = (row) => {
  showAdjustDialog(row, 'stock')
  adjustForm.adjustType = 'add'
  adjustForm.changeQty = 50
  adjustForm.reason = '快速补货'
}

/**
 * 提交调整操作
 * - 库存模式：前端根据调整方式计算最终库存值，传 stock 给后端（后端记录流水）
 * - 价格模式：将元转为分（乘 100 取整）后提交
 */
const handleAdjust = async () => {
  try {
    if (adjustType.value === 'stock') {
      if (adjustForm.changeQty === 0 && adjustForm.adjustType !== 'set') {
        ElMessage.warning('调整数量不能为 0')
        return
      }

      // 计算调整后的库存绝对值
      let newStock
      if (adjustForm.adjustType === 'set') {
        newStock = adjustForm.changeQty
      } else if (adjustForm.adjustType === 'add') {
        newStock = currentProduct.value.stock + adjustForm.changeQty
      } else {
        // minus 模式：防止库存出现负数
        newStock = currentProduct.value.stock - adjustForm.changeQty
        if (newStock < 0) {
          ElMessage.error('库存不能为负数')
          return
        }
      }

      await api.updateProductStock(currentProduct.value.id, {
        stock: newStock,
        reason: adjustForm.reason,
        remark: adjustForm.remark
      })
      ElMessage.success('库存调整成功')

    } else {
      if (adjustForm.newPrice <= 0) {
        ElMessage.warning('价格必须大于 0')
        return
      }

      // 元转分：使用 Math.round 避免浮点精度问题
      await api.updateProduct(currentProduct.value.id, {
        price: Math.round(adjustForm.newPrice * 100)
      })
      ElMessage.success('价格调整成功')
    }

    adjustDialogVisible.value = false
    loadProducts()
  } catch (error) {
    console.error('调整失败:', error)
    ElMessage.error(error.message || '调整失败')
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
