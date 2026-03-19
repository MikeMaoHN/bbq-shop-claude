# 编码规范

## JavaScript 规范

### 代码风格

```javascript
// ✅ 使用 const/let，禁用 var
const MAX_COUNT = 100
let count = 0

// ✅ 使用模板字符串
const message = `Hello, ${name}!`

// ✅ 箭头函数
const add = (a, b) => a + b

// ✅ 对象简写
const name = 'John'
const user = { name }

// ✅ 使用解构
const { name, age } = user
const [first, ...rest] = list

// ❌ 避免
var count = 0
const message = 'Hello, ' + name + '!'
function add(a, b) { return a + b }
```

### 命名规范

```javascript
// 变量/函数：小驼峰
const userName = 'John'
function getUserInfo() {}

// 类/组件：大驼峰
class UserInfo {}
const UserProfile = () => {}

// 常量：大写 + 下划线
const MAX_RETRY_COUNT = 3
const API_BASE_URL = '/api'

// 私有变量：下划线前缀
const _privateData = {}

// 布尔值：is/has/can 前缀
const isLoading = true
const hasPermission = false
```

### 注释规范

```javascript
/**
 * 创建订单
 * @param {Object} data - 订单数据
 * @param {number} data.addressId - 地址 ID
 * @param {Array} data.items - 商品列表
 * @param {string} [data.remark] - 备注
 * @returns {Promise<Object>} 订单信息
 */
async function createOrder(data) {
  // 实现代码
}

// 单行注释使用 //
// TODO: 优化性能
// FIXME: 修复边界情况
```

---

## 小程序规范

### 页面结构

```javascript
// pages/index/index.js
const api = require('../../utils/api')
const config = require('../../config')

Page({
  data: {
    banners: [],
    categories: [],
    loading: false
  },

  onLoad(options) {
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadData() {
    try {
      this.setData({ loading: true })
      const [categories, products] = await Promise.all([
        api.getCategories(),
        api.getProducts({ limit: 8 })
      ])
      this.setData({ categories, hotProducts: products.list })
    } catch (error) {
      console.error('加载失败:', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
```

### WXML 规范

```xml
<!-- ✅ 使用语义化类名 -->
<view class="product-list">
  <view class="product-item" wx:for="{{products}}" wx:key="id">
    <image class="product-image" src="{{item.image}}" />
    <text class="product-name">{{item.name}}</text>
  </view>
</view>

<!-- ✅ 使用 block 包裹 -->
<block wx:if="{{items.length > 0}}">
  <view class="list">...</view>
</block>

<!-- ❌ 避免 -->
<view wx:if="{{items.length > 0}}" class="list">...</view>
```

### WXSS 规范

```css
/* ✅ 使用 rpx 单位 */
.container {
  padding: 20rpx;
}

/* ✅ 使用 Flex 布局 */
.product-list {
  display: flex;
  flex-wrap: wrap;
}

/* ✅ 使用 BEM 命名 */
.product-item {}
.product-item__image {}
.product-item__name {}

/* ❌ 避免 */
.product .image {} /* 嵌套过深 */
.red { color: red } /* 语义化不足 */
```

---

## 错误处理

### 统一错误处理

```javascript
// utils/request.js
class Request {
  async request(options) {
    try {
      const res = await wx.request({
        ...options,
        header: {
          ...options.header,
          'Authorization': `Bearer ${this.getToken()}`
        }
      })

      if (res.statusCode === 200 && res.data.code === 200) {
        return res.data.data
      } else if (res.statusCode === 401) {
        this.clearToken()
        wx.reLaunch({ url: '/pages/profile/profile' })
        throw new Error('未授权')
      } else {
        wx.showToast({ title: res.data.message || '请求失败', icon: 'none' })
        throw new Error(res.data.message)
      }
    } catch (error) {
      console.error('Request error:', error)
      throw error
    }
  }
}
```

### 异常捕获

```javascript
// ✅ 正确示范
try {
  const images = JSON.parse(product.images)
  if (images.length > 0) firstImage = config.imageBase + images[0]
} catch (e) {
  console.error('parse images error:', e)
  firstImage = config.imageBase + '/images/default-product.png'
}

// ❌ 错误示范
const images = JSON.parse(product.images) // 可能抛出异常
```

---

## 性能优化

### 图片优化

```javascript
// ✅ 使用 CDN 加速
const imageBase = config.imageBase

// ✅ 懒加载
<image lazy-load="true" src="{{item.image}}" />

// ✅ 使用 mode 适配
<image src="{{item.image}}" mode="aspectFill" />
```

### 数据优化

```javascript
// ✅ 使用 setData 批量更新
this.setData({
  name: 'John',
  age: 25,
  loading: false
})

// ❌ 避免频繁 setData
this.setData({ name: 'John' })
this.setData({ age: 25 })
this.setData({ loading: false })
```

### 列表优化

```javascript
// ✅ 使用 wx:key
<view wx:for="{{list}}" wx:key="id">
  {{item.name}}
</view>

// ❌ 避免
<view wx:for="{{list}}" wx:key="*this">
  {{item.name}}
</view>
```

---

## 安全规范

### 输入验证

```javascript
// ✅ 验证手机号
if (!/^1[3-9]\d{9}$/.test(phone)) {
  wx.showToast({ title: '手机号格式不正确', icon: 'none' })
  return
}

// ✅ 验证价格
if (price <= 0) {
  wx.showToast({ title: '价格必须为正整数', icon: 'none' })
  return
}

// ✅ 验证数量
if (quantity > 99 || quantity < 1) {
  wx.showToast({ title: '购买数量限制 1-99', icon: 'none' })
  return
}
```

### 敏感信息

```javascript
// ✅ 配置文件管理
const config = {
  HOST: 'https://api.example.com',
 客服电话：'13800138000'
}

// ❌ 避免硬编码
const HOST = 'http://47.113.189.235:3000'
const PHONE = '13800138000'
```

---

## 测试规范

### 单元测试

```javascript
// __tests__/utils/request.test.js
describe('Request', () => {
  test('should set token correctly', () => {
    const request = new Request()
    request.setToken('test-token')
    expect(request.getToken()).toBe('test-token')
  })

  test('should handle 401 error', async () => {
    // mock 401 response
    // expect token cleared and redirect
  })
})
```

### 测试覆盖率要求

| 模块 | 覆盖率要求 |
|------|------------|
| utils/ | ≥ 95% |
| pages/ | ≥ 85% |
| 整体 | ≥ 90% |

---

## 文档规范

### 函数文档

```javascript
/**
 * 获取商品列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @param {string} [params.keyword] - 搜索关键词
 * @returns {Promise<Object>} 商品列表和总数
 */
async function getProducts(params) {
  // ...
}
```

### 变更日志

```markdown
## [1.2.0] - 2024-01-15

### 新增
- 订单退款功能 (#123)

### 修复
- 购物车数量显示异常 (#130)

### 优化
- 商品列表加载性能提升 50%
```

---

## 代码审查清单

提交前自检：

- [ ] 代码符合 ESLint 规范
- [ ] 无 console.log 调试代码（生产环境）
- [ ] 无硬编码敏感信息
- [ ] 关键逻辑有注释
- [ ] 错误处理完整
- [ ] 变量命名清晰
- [ ] 函数职责单一
- [ ] 有对应测试用例

---

*最后更新：2024-01-15*
