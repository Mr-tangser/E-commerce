import Vue from "vue";
import VueAxios from "vue-axios";

import axios from "axios";

import {VueAuthenticate} from "vue-authenticate";

Vue.use(VueAxios, axios);

// 配置API基础URL
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000/api';
const ADMIN_BASE_URL = process.env.VUE_APP_ADMIN_BASE_URL || 'http://localhost:3000/api/admin';

// 设置axios默认配置
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 10000;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// 请求拦截器
axios.interceptors.request.use(
  config => {
    // 添加认证token
    const token = localStorage.getItem('vue-authenticate.vueauth_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
axios.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并跳转登录
      localStorage.removeItem('vue-authenticate.vueauth_access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const vueAuth = new VueAuthenticate(Vue.prototype.$http, {
  baseUrl: ADMIN_BASE_URL,
  tokenName: "access_token",
  loginUrl: "/login",
  registerUrl: "/register",
  tokenType: "Bearer"
});

export { API_BASE_URL, ADMIN_BASE_URL };