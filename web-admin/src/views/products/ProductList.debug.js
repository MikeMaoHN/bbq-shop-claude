const Logger = require('./logger')
const log = new Logger('ProductList')

const loadProducts = async () => {
  log.group('加载商品数据')
  log.debug('开始加载商品列表')
  loading.value = true
  
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    }
    
    log.debug('请求参数:', params)
    log.info('调用 API: getProducts')
    
    const result = await api.getProducts(params)
    
    log.debug('API 返回结果:', result)
    log.debug('商品列表:', result.list)
    log.info(`获取到 ${result.total} 个商品`)
    
    tableData.value = result.list
    pagination.total = result.total
    
    log.debug('tableData 已更新，长度:', tableData.value.length)
    log.debug('pagination.total:', pagination.total)
    log.info('商品加载完成')
    
  } catch (error) {
    log.error('加载商品失败:', error)
    log.error('错误详情:', error.message)
    log.error('错误堆栈:', error.stack)
    ElMessage.error('加载商品失败：' + error.message)
  } finally {
    loading.value = false
    log.groupEnd()
  }
}

const loadCategories = async () => {
  log.group('加载分类数据')
  log.debug('开始加载分类列表')
  
  try {
    const result = await api.getCategories()
    log.debug('分类 API 返回:', result)
    
    categories.value = Array.isArray(result) ? result : (result.list || [])
    log.info(`获取到 ${categories.value.length} 个分类`)
    log.debug('分类列表:', categories.value)
    
  } catch (error) {
    log.error('加载分类失败:', error)
    ElMessage.error('加载分类失败')
  } finally {
    log.groupEnd()
  }
}

onMounted(() => {
  log.info('=== 商品管理页面已挂载 ===')
  log.debug('开始初始化页面')
  loadCategories()
  loadProducts()
})
