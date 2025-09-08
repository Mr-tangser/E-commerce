// =========================================================
// * 全品汇电商管理系统 - v1.4.0
// =========================================================
// 基于Vue Material Dashboard开发
// Licensed under MIT

import Vue from "vue";
import axios from "axios";

// Plugins
import App from "./App.vue";
import Chartist from "chartist";
import VueAxios from "vue-axios";
import DashboardPlugin from "./material-dashboard";

// 导入axios配置
import "./axios";

// Vue Material错误修复
import { setupVueMaterialErrorHandling, cleanupOnRouteChange } from "./utils/vueMaterialFix";
import { patchVueMaterialTabs, patchCalculateTabPos } from "./utils/vueMaterialPatch";

// plugin setup
Vue.use(DashboardPlugin);
Vue.use(VueAxios, axios);

// router & store setup
import router from "./router";
import store from "./store";

// global library setup
Vue.prototype.$Chartist = Chartist;

// 🔧 应用Vue Material核心补丁（最优先级）
console.log('🔧 开始应用Vue Material补丁...');
try {
  patchVueMaterialTabs();
  console.log('✅ Vue Material核心补丁已应用');
} catch (error) {
  console.warn('⚠️ Vue Material补丁应用失败:', error);
}

// 设置Vue Material错误处理（双重保险）
try {
  setupVueMaterialErrorHandling();
} catch (error) {
  console.warn('错误处理设置失败:', error);
}

// 路由切换时清理Vue Material
router.afterEach((to, from) => {
  try {
    cleanupOnRouteChange(to, from);
  } catch (error) {
    console.warn('路由清理失败:', error);
  }
});

// 开发环境下加载API测试工具
if (process.env.NODE_ENV === 'development') {
  import('./utils/apiTest.js').then(() => {
    console.log('🛠️ 开发模式：API测试工具已加载');
  }).catch(err => {
    console.warn('API测试工具加载失败:', err);
  });
  
  // 注意：已禁用前端用户切换和权限测试工具
  // 所有用户数据和权限验证必须通过后端API获取，不使用前端模拟数据
  console.log('🔒 生产模式：所有用户数据来源于后端API');
  console.log('💡 请使用真实的登录流程进行用户切换和权限测试');
}

/* eslint-disable no-new */
const app = new Vue({
  router: router,
  store: store,
  el: "#app",
  render: h => h(App)
});

store.$app = app;

// 🔧 Vue实例创建后立即应用动态补丁
console.log('🔧 Vue应用已创建，应用动态补丁...');
try {
  // 延迟执行以确保所有组件都已渲染
  setTimeout(() => {
    patchCalculateTabPos();
    console.log('✅ Vue Material动态补丁已应用');
  }, 1000);
} catch (error) {
  console.warn('⚠️ 动态补丁应用失败:', error);
}
