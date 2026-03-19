/**
 * 认证状态管理 Store（Pinia）
 * 管理管理员登录状态，token 持久化到 localStorage 以支持刷新保持登录。
 * request 工具会读取此 store 的 token 注入到每个请求的 Authorization 头。
 */
import { defineStore } from 'pinia'
import api from '@/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // 初始化时从 localStorage 恢复 token，避免刷新后登录态丢失
    token: localStorage.getItem('token') || '',
    admin: null   // 当前管理员信息，页面刷新后通过 getInfo() 重新获取
  }),

  getters: {
    /** 是否已登录（token 非空即视为有效，过期由后端返回 401 处理） */
    isLoggedIn: (state) => !!state.token
  },

  actions: {
    /**
     * 登录：调用接口获取 token，同步写入 state 和 localStorage
     * @param {object} credentials - { username, password }
     */
    async login(credentials) {
      const data = await api.login(credentials)
      this.token = data.token
      this.admin = data.admin
      localStorage.setItem('token', data.token)
    },

    /**
     * 获取当前管理员信息（登录成功后调用以初始化 admin 对象）
     * 失败时静默处理，不影响页面正常使用
     */
    async getInfo() {
      try {
        const admin = await api.getInfo()
        this.admin = admin
      } catch (error) {
        console.error('获取管理员信息失败:', error)
      }
    },

    /** 退出登录：清空 state 和 localStorage 中的 token */
    logout() {
      this.token = ''
      this.admin = null
      localStorage.removeItem('token')
    }
  }
})
