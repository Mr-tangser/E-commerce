import Vue from "vue";
import VueAxios from "vue-axios";

import axios from "axios";

import {VueAuthenticate} from "vue-authenticate";

// 配置API基础URL
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000/api';
const ADMIN_BASE_URL = process.env.VUE_APP_ADMIN_BASE_URL || 'http://localhost:3000/api/admin';

// 设置axios默认配置
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 10000;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// 初始化时设置Authorization头（如果token存在）
const initialToken = localStorage.getItem('vue-authenticate.vueauth_access_token');
if (initialToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}


Vue.use(VueAxios, axios);

// 请求拦截器
axios.interceptors.request.use(
  config => {
    // 添加认证token
    const token = localStorage.getItem('vue-authenticate.vueauth_access_token');
    
    if (token) {
      const bearerToken = `Bearer ${token}`;
      config.headers.Authorization = bearerToken;
      // 同时更新默认headers
      axios.defaults.headers.common['Authorization'] = bearerToken;
    } else {
      // 如果没有token，移除默认headers中的Authorization
      delete axios.defaults.headers.common['Authorization'];
    }
    
    return config;
  },
  error => {
    console.error('请求拦截器错误:', error);
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
      // Token过期或无效，清除本地存储
      localStorage.removeItem('vue-authenticate.vueauth_access_token');
      localStorage.removeItem('admin_info');
      
      // 只有不在登录页面时才跳转
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
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