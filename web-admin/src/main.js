/**
 * 应用入口文件
 * 完成 Vue 实例创建、全局插件注册和 Element Plus 图标批量注册
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// 使用中文语言包，确保日期选择器、分页等组件文案为中文
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

// 将 Element Plus 全部图标组件注册为全局组件，模板中可直接 <el-icon><IconName /></el-icon> 使用
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)          // 状态管理
app.use(router)         // 路由
app.use(ElementPlus, { locale: zhCn })  // UI 组件库（中文）

app.mount('#app')
