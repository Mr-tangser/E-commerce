// =========================================================
// * Vue Material Dashboard Laravel - v1.1.0
// =========================================================
//
// * Product Page: https://www.creative-tim.com/product/vue-material-dashboard-laravel
// * Copyright Creative Tim (https://www.creative-tim.com) & UPDIVISION (https://www.updivision.com)
//
// * Coded by www.creative-tim.com & www.updivision.com
//
// =========================================================
//
// * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

import Vue from "vue";
import axios from "axios";

// Plugins
import App from "./App.vue";
import Chartist from "chartist";
import VueAxios from "vue-axios";
import DashboardPlugin from "./material-dashboard";

// plugin setup
Vue.use(DashboardPlugin);
Vue.use(VueAxios, axios);

// router & store setup
import router from "./router";
import store from "./store";

// global library setup
Vue.prototype.$Chartist = Chartist;

// 开发环境下加载API测试工具
if (process.env.NODE_ENV === 'development') {
  import('./utils/apiTest.js').then(() => {
    console.log('🛠️ 开发模式：API测试工具已加载');
  }).catch(err => {
    console.warn('API测试工具加载失败:', err);
  });
}

/* eslint-disable no-new */
const app = new Vue({
  router: router,
  store: store,
  el: "#app",
  render: h => h(App)
});

store.$app = app;
