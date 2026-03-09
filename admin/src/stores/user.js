import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '../api'
import router from '../router'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const adminInfo = ref({})

  async function login(loginData) {
    const res = await authApi.login(loginData)
    const data = res.data || res
    token.value = data.token
    localStorage.setItem('admin_token', data.token)
    return data
  }

  async function getInfo() {
    const res = await authApi.getInfo()
    const data = res.data || res
    adminInfo.value = data
    return data
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch (e) {
      // ignore
    }
    token.value = ''
    adminInfo.value = {}
    localStorage.removeItem('admin_token')
    router.push('/login')
  }

  return {
    token,
    adminInfo,
    login,
    getInfo,
    logout
  }
})
