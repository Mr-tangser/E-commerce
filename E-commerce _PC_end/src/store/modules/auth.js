import Vue from "vue";
import router from "@/router";
import axios from "axios";

export default {
  state: {
    isAuthenticated: localStorage.getItem("vue-authenticate.vueauth_access_token") !== null,
    user: null,
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
        const response = await axios.get('http://localhost:3000/api/admin/me');
        
        if (response.data.success) {
          context.commit('SET_USER', response.data.data.admin);
          context.commit('SET_AUTHENTICATED', true);
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        context.commit('CLEAR_AUTH');
        localStorage.removeItem('vue-authenticate.vueauth_access_token');
      }
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
