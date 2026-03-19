# 前端测试

## 测试框架

本项目使用 **Vitest** 作为前端测试框架，配合 **@vue/test-utils** 进行组件测试。

## 安装依赖

```bash
cd web-admin
npm install --save-dev vitest @vue/test-utils jsdom
```

## 配置 Vitest

在 `vite.config.js` 中添加测试配置：

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/__tests__/**/*.test.{js,ts,vue}'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/mock/']
    }
  }
})
```

## 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 查看覆盖率
npm run test:coverage
```

## 测试文件

- `__tests__/Login.test.js` - 登录页面组件测试
- `__tests__/utils.test.js` - 工具函数测试

## 编写测试

### 组件测试示例

```javascript
import { mount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  it('渲染正确', () => {
    const wrapper = mount(MyComponent, {
      props: { title: '测试' }
    })
    
    expect(wrapper.text()).toContain('测试')
  })
})
```

### 工具函数测试示例

```javascript
import { formatPrice } from '@/utils/format'

describe('formatPrice', () => {
  it('转换分为元', () => {
    expect(formatPrice(100)).toBe('1.00')
  })
})
```

## 最佳实践

1. **测试命名**：使用 `应该...` 的格式描述测试目的
2. **AAA 模式**：Arrange（准备）- Act（执行）- Assert（断言）
3. **独立测试**：每个测试应该独立运行，不依赖其他测试
4. **Mock 外部依赖**：使用 vi.mock() 模拟 API 调用
