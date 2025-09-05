import store from "../store";

export default async function auth({ next, router, to }) {
  // 检查是否有存储的token
  const token = localStorage.getItem('vue-authenticate.vueauth_access_token');
  
  if (token && !store.getters.currentUser) {
    // 如果有token但没有用户信息，尝试获取用户信息
    try {
      await store.dispatch('fetchCurrentUser');
    } catch (error) {
      console.error('获取用户信息失败:', error);
      // 如果获取失败，清除认证状态
      store.commit('CLEAR_AUTH');
      localStorage.removeItem('vue-authenticate.vueauth_access_token');
      localStorage.removeItem('admin_info');
    }
  }

  if (!store.getters.isAuthenticated) {
    // 避免在已经在登录页面时重复跳转
    if (to.name !== "Login") {
      return router.push({ name: "Login" });
    }
  }

  return next();
}
