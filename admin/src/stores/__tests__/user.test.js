/**
 * 单元测试 — user store (Pinia)
 *
 * TC-STORE-01  login — 登录成功
 * TC-STORE-02  login — 登录失败
 * TC-STORE-03  getInfo — 成功获取管理员信息
 * TC-STORE-04  getInfo — 接口失败时抛出异常
 * TC-STORE-05  logout — 清空状态并跳转 /login
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '../user'

// ── Mock: ../api ──────────────────────────────────────────────────────────────
vi.mock('../../api', () => ({
  authApi: {
    login: vi.fn(),
    getInfo: vi.fn(),
    logout: vi.fn(),
  },
}))

// ── Mock: ../router ───────────────────────────────────────────────────────────
// vi.mock is hoisted to top-of-file, so we must use vi.hoisted for variables
// that need to be accessible both inside the factory and in the test body.
const mockRouterPush = vi.hoisted(() => vi.fn())
vi.mock('../../router', () => ({
  default: { push: mockRouterPush },
}))

import { authApi } from '../../api'

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

// ── TC-STORE-01: login 成功 ───────────────────────────────────────────────────

describe('TC-STORE-01: login — 成功', () => {
  it('调用 authApi.login 并将 adminInfo 写入 store', async () => {
    const adminData = { id: 1, username: 'admin', name: '超级管理员', role: 'super' }
    authApi.login.mockResolvedValue({ code: 0, data: { admin: adminData } })

    const store = useUserStore()
    await store.login({ username: 'admin', password: '123456' })

    expect(authApi.login).toHaveBeenCalledWith({ username: 'admin', password: '123456' })
    expect(store.adminInfo).toEqual(adminData)
    expect(store.loading).toBe(false)
    expect(store.loginError).toBe('')
  })

  it('login 期间 loading 为 true，结束后恢复 false', async () => {
    let resolveLogin
    authApi.login.mockReturnValue(new Promise(r => { resolveLogin = r }))

    const store = useUserStore()
    const p = store.login({ username: 'admin', password: '123456' })
    expect(store.loading).toBe(true)

    resolveLogin({ code: 0, data: { admin: { id: 1 } } })
    await p
    expect(store.loading).toBe(false)
  })
})

// ── TC-STORE-02: login 失败 ───────────────────────────────────────────────────

describe('TC-STORE-02: login — 失败', () => {
  it('接口抛出错误时写入 loginError 并重新抛出', async () => {
    authApi.login.mockRejectedValue(new Error('用户名或密码错误'))

    const store = useUserStore()
    await expect(store.login({ username: 'admin', password: 'wrong' }))
      .rejects.toThrow('用户名或密码错误')

    expect(store.loginError).toBe('用户名或密码错误')
    expect(store.adminInfo).toEqual({})
    expect(store.loading).toBe(false)
  })
})

// ── TC-STORE-03: getInfo 成功 ─────────────────────────────────────────────────

describe('TC-STORE-03: getInfo — 成功', () => {
  it('将返回的管理员信息写入 adminInfo', async () => {
    const info = { id: 1, username: 'admin', role: 'super' }
    authApi.getInfo.mockResolvedValue({ code: 0, data: info })

    const store = useUserStore()
    const result = await store.getInfo()

    expect(result).toEqual(info)
    expect(store.adminInfo).toEqual(info)
  })
})

// ── TC-STORE-04: getInfo 失败 ─────────────────────────────────────────────────

describe('TC-STORE-04: getInfo — 失败', () => {
  it('接口抛出错误时透传异常', async () => {
    authApi.getInfo.mockRejectedValue(new Error('未登录'))

    const store = useUserStore()
    await expect(store.getInfo()).rejects.toThrow('未登录')
  })
})

// ── TC-STORE-05: logout ───────────────────────────────────────────────────────

describe('TC-STORE-05: logout', () => {
  it('调用 authApi.logout 并清空 adminInfo，跳转到 /login', async () => {
    authApi.logout.mockResolvedValue({ code: 0, data: null })
    authApi.getInfo.mockResolvedValue({ code: 0, data: { id: 1, username: 'admin' } })

    const store = useUserStore()
    await store.getInfo()  // 先写入 adminInfo
    expect(store.adminInfo.id).toBe(1)

    await store.logout()

    expect(authApi.logout).toHaveBeenCalled()
    expect(store.adminInfo).toEqual({})
    expect(mockRouterPush).toHaveBeenCalledWith('/login')
  })

  it('即使 authApi.logout 失败也会清空 adminInfo 并跳转', async () => {
    authApi.logout.mockRejectedValue(new Error('network error'))

    const store = useUserStore()
    store.adminInfo = { id: 1 }

    await store.logout()

    expect(store.adminInfo).toEqual({})
    expect(mockRouterPush).toHaveBeenCalledWith('/login')
  })
})
