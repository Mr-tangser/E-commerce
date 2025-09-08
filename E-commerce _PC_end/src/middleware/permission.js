// 权限检查中间件
import store from "../store";

export default function permission({ next, router, to }) {
  // 检查路由是否需要权限验证
  if (to.meta && to.meta.requiredPermission) {
    const { resource, action } = to.meta.requiredPermission;
    const user = store.getters['auth/currentUser'];
    
    // 检查用户是否已登录
    if (!user) {
      console.warn('用户未登录，跳转到登录页');
      return router.push({ name: 'Login' });
    }
    
    // 检查用户是否有所需权限
    const userPermissions = user.permissions || {};
    const hasPermission = userPermissions[resource] && userPermissions[resource][action];
    
    if (!hasPermission) {
      // 没有权限，显示错误信息并跳转到首页
      console.warn(`用户没有权限访问 ${resource}:${action}`);
      
      // 使用Vue的全局通知系统显示错误
      try {
        if (store._vm && store._vm.$store) {
          store._vm.$store.dispatch('alerts/error', `您没有权限访问此页面`);
        } else {
          // 备用方案：直接使用store
          store.dispatch('alerts/error', `您没有权限访问此页面`);
        }
      } catch (error) {
        console.error('显示权限错误提示失败:', error);
      }
      
      return router.push('/dashboard');
    }
  }
  
  return next();
}
