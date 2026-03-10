import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '../api'
import router from '../router'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const adminInfo = ref({})
  const loading = ref(false)
  const loginError = ref('')

  async function login(loginData) {
    loading.value = true
    loginError.value = ''
    try {
      const res = await authApi.login(loginData)
      const data = res.data
      token.value = data.token
      localStorage.setItem('admin_token', data.token)
      return data
    } catch (e) {
      loginError.value = e.message || '登录失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function getInfo() {
    const res = await authApi.getInfo()
    adminInfo.value = res.data
    return res.data
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch (e) {
      // ignore
    }
    token.value = ''
    adminInfo.value = {}
    loginError.value = ''
    localStorage.removeItem('admin_token')
    router.push('/login')
  }

  return {
    token,
    adminInfo,
    loading,
    loginError,
    login,
    getInfo,
    logout
  }
})
