import Vue from "vue";
import router from "@/router";
import axios from "axios";

// 临时测试用户数据 - 用于开发调试
// 注意：生产环境中应该移除此数据，使用 user: null
const testSuperAdmin = {
  _id: "68aee066d310e9a9a6a8b174",
  username: "superadmin",
  email: "admin@jsonapi.com",
  role: "super_admin",
  avatar: "/img/avatars/admin_68aee066d310e9a9a6a8b174_1757149686512-981827745.png",
  firstName: "Super",
  lastName: "Admin",
  department: "technical",
  permissions: {
    users: { view: true, create: true, edit: true, delete: true },
    products: { view: true, create: true, edit: true, delete: true },
    orders: { view: true, create: true, edit: true, delete: true },
    analytics: { view: true, export: true },
    settings: { view: true, edit: true }
  },
  isActive: true,
  loginCount: 36,
  twoFactorEnabled: false,
  sessionTimeout: 8,
  lastLogin: new Date(),
  phone: "16682296593"
};

// 临时admin用户数据 - 基于您提供的后端数据
const testAdminUser = {
  _id: "68aee067d310e9a9a6a8b176",
  username: "admin",
  email: "admin@ecommerce.com",
  role: "admin",
  avatar: "/img/default.jpg",
  firstName: "Admin",
  lastName: "User", 
  department: "sales",
  permissions: {
    users: { view: true, create: false, edit: true, delete: false },
    products: { view: true, create: true, edit: true, delete: false },
    orders: { view: true, create: false, edit: true, delete: false },
    analytics: { view: true, export: false },
    settings: { view: false, edit: false }
  },
  isActive: true,
  loginCount: 0,
  twoFactorEnabled: false,
  sessionTimeout: 8,
  createdAt: "2025-08-27T10:39:35.129Z",
  updatedAt: "2025-08-27T10:39:35.129Z"
};

export default {
  namespaced: true,
  state: {
    isAuthenticated: localStorage.getItem("vue-authenticate.vueauth_access_token") !== null,
    user: testAdminUser, // 临时使用admin测试数据来验证权限系统
    loading: false
  },

  getters: {
    isAuthenticated(state) {
      return state.isAuthenticated;
    },
    currentUser(state) {
      return state.user;
    },
    isLoading(state) {
      return state.loading;
    }
  },

  mutations: {
    SET_AUTHENTICATED(state, isAuthenticated) {
      state.isAuthenticated = isAuthenticated;
    },
    SET_USER(state, user) {
      state.user = user;
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    CLEAR_AUTH(state) {
      state.isAuthenticated = false;
      state.user = null;
    }
  },

  actions: {
    async login(context, payload) {
      context.commit('SET_LOADING', true);
      
      try {
        // 使用Express API进行管理员登录
        const response = await axios.post('http://localhost:3000/api/admin/login', {
          email: payload.user.data.attributes.email,
          password: payload.user.data.attributes.password
        });

        if (response.data.success) {
          // 存储token
          const token = response.data.data.access_token;
          localStorage.setItem('vue-authenticate.vueauth_access_token', token);
          
          // 存储用户信息
          const admin = response.data.data.admin;
          context.commit('SET_USER', admin);
          context.commit('SET_AUTHENTICATED', true);
          
          // 跳转到首页
          router.push({name: "Home"});
          
          return response;
        }
      } catch (error) {
        context.commit('SET_AUTHENTICATED', false);
        context.commit('SET_USER', null);
        throw error;
      } finally {
        context.commit('SET_LOADING', false);
      }
    },

    async register(context, payload) {
      context.commit('SET_LOADING', true);
      
      try {
        // 使用Express API进行管理员注册
        const response = await axios.post('http://localhost:3000/api/admin/register', {
          username: payload.user.data.attributes.username,
          email: payload.user.data.attributes.email,
          password: payload.user.data.attributes.password,
          firstName: payload.user.data.attributes.firstName,
          lastName: payload.user.data.attributes.lastName
        });

        if (response.data.success) {
          // 注册成功后自动登录
          await context.dispatch('login', {
            user: {
              data: {
                attributes: {
                  email: payload.user.data.attributes.email,
                  password: payload.user.data.attributes.password
                }
              }
            }
          });
          
          return response;
        }
      } catch (error) {
        throw error;
      } finally {
        context.commit('SET_LOADING', false);
      }
    },

    async fetchCurrentUser(context) {
      const token = localStorage.getItem('vue-authenticate.vueauth_access_token');
      
      if (!token) {
        context.commit('CLEAR_AUTH');
        return;
      }

      try {
        const response = await axios.get('http://localhost:3000/api/admin/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.success) {
          context.commit('SET_USER', response.data.data.admin);
          context.commit('SET_AUTHENTICATED', true);
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        context.commit('CLEAR_AUTH');
        localStorage.removeItem('vue-authenticate.vueauth_access_token');
        throw error; // 重新抛出错误，让中间件能够处理
      }
    },

    updateUserInfo(context, userInfo) {
      // 更新store中的用户信息
      context.commit('SET_USER', userInfo);
    },

    logout(context) {
      // 清除本地存储
      localStorage.removeItem('vue-authenticate.vueauth_access_token');
      
      // 清除状态
      context.commit('CLEAR_AUTH');
      
      // 跳转到登录页
      router.push({name: "Login"});
      
      return Promise.resolve();
    }
  }
};
