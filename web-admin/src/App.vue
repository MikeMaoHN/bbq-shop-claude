<!--
  根组件
  仅作为路由视图的挂载容器，页面布局由各路由组件自行负责。
  全局样式（reset + 字体）在此统一定义。
-->
<template>
  <router-view />
</template>

<script setup>
// 根组件无逻辑，状态和路由由子组件各自管理
</script>

<style>
/* 全局样式重置：消除浏览器默认 margin/padding，统一盒模型 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  /* 优先使用系统中文字体，确保各平台渲染一致 */
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
}
</style>
