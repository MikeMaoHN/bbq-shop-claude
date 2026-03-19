/**
 * 前端组件测试：登录页面
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Login from '../../src/views/Login.vue';

// Mock Vue Router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

// Mock Element Plus
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus');
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn()
    }
  };
});

describe('Login Component', () => {
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  it('应该渲染登录表单', () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [pinia]
      }
    });

    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('应该显示表单验证错误', async () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [pinia]
      }
    });

    // 尝试提交空表单
    await wrapper.find('button[type="submit"]').trigger('click');

    // 应该显示验证错误
    expect(wrapper.text()).toContain('用户名');
  });

  it('应该允许输入用户名和密码', async () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [pinia]
      }
    });

    const usernameInput = wrapper.find('input[type="text"]');
    const passwordInput = wrapper.find('input[type="password"]');

    await usernameInput.setValue('admin');
    await passwordInput.setValue('admin123');

    expect(usernameInput.element.value).toBe('admin');
    expect(passwordInput.element.value).toBe('admin123');
  });
});
