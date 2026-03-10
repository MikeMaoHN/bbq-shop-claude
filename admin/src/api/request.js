import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const MAX_RETRIES = 3

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/admin',
  timeout: Number(import.meta.env.VITE_REQUEST_TIMEOUT) || 15000
})

// Request interceptor
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config._startTime = Date.now()
    if (import.meta.env.DEV) {
      console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data || '')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (import.meta.env.DEV) {
      const duration = Date.now() - (response.config._startTime || 0)
      console.debug(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} ${response.status} (${duration}ms)`)
    }
    if (res.code !== undefined && res.code !== 0 && res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  async (error) => {
    const config = error.config
    // Retry on network errors (no response received)
    if (!error.response && config) {
      config._retryCount = (config._retryCount || 0) + 1
      if (config._retryCount <= MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, config._retryCount * 1000))
        return request(config)
      }
    }
    if (error.response) {
      if (import.meta.env.DEV) {
        const duration = Date.now() - (error.config?._startTime || 0)
        console.warn(`[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} ${error.response.status} (${duration}ms)`, error.response.data)
      }
      if (error.response.status === 401) {
        localStorage.removeItem('admin_token')
        ElMessage.error('登录已过期，请重新登录')
        router.push('/login')
      } else {
        ElMessage.error(error.response.data?.message || '请求失败')
      }
    } else {
      if (import.meta.env.DEV) {
        console.error(`[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} 网络错误`, error.message)
      }
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export default request
