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
    
    // 超级管理员直接拥有所有权限，无需进一步检查
    if (user.role === 'super_admin') {
      return next();
    }
    
    // 检查普通用户权限
    const userPermissions = user.permissions || {};
    const hasPermission = userPermissions[resource] && userPermissions[resource][action] === true;
    
    if (!hasPermission) {
      // 没有权限，显示错误信息并跳转到首页
      console.warn(`权限不足: 用户 ${user.username} 无法访问 ${resource}:${action}`);
      
      // 跳转到仪表板
      return router.push('/dashboard');
    }
  }
  
  return next();
}
