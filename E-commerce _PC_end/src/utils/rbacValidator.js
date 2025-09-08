// RBAC系统验证器
import { testRBACSystem } from './rbacTest';

export const validateRBACSystem = () => {
  console.log('🔍 开始验证RBAC系统完整性...\n');
  
  // 1. 验证权限mixin是否正确加载
  console.log('1️⃣ 验证权限管理组件...');
  try {
    import('@/mixins/permissions').then(module => {
      const permissionsMixin = module.default;
      console.log('✅ 权限mixin加载成功');
      console.log('   - hasPermission方法:', typeof permissionsMixin.methods?.hasPermission === 'function');
      console.log('   - hasRole方法:', typeof permissionsMixin.methods?.hasRole === 'function');
      console.log('   - dynamicSidebarLinks计算属性:', typeof permissionsMixin.computed?.dynamicSidebarLinks === 'function');
    }).catch(error => {
      console.error('❌ 权限mixin加载失败:', error.message);
    });
  } catch (error) {
    console.error('❌ 权限mixin加载失败:', error.message);
  }
  
  // 2. 验证页面组件
  console.log('\n2️⃣ 验证页面组件...');
  const pages = [
    { name: '商品管理', path: '@/pages/Dashboard/Products/ProductList.vue' },
    { name: '订单管理', path: '@/pages/Dashboard/Orders/OrderList.vue' },
    { name: '数据分析', path: '@/pages/Dashboard/Analytics/SalesAnalytics.vue' },
    { name: '系统设置', path: '@/pages/Dashboard/Settings/SystemSettings.vue' }
  ];
  
  pages.forEach(page => {
    try {
      import(page.path).then(() => {
        console.log(`✅ ${page.name}页面加载成功`);
      }).catch(error => {
        console.error(`❌ ${page.name}页面加载失败:`, error.message);
      });
    } catch (error) {
      console.error(`❌ ${page.name}页面加载失败:`, error.message);
    }
  });
  
  // 3. 验证路由配置
  console.log('\n3️⃣ 验证路由配置...');
  try {
    import('@/router/routes').then(module => {
      const routes = module.default;
      const protectedRoutes = routes.filter(route => 
        route.children?.some(child => child.meta?.requiredPermission)
      );
      console.log(`✅ 找到 ${protectedRoutes.length} 个受保护的路由组`);
      
      protectedRoutes.forEach(routeGroup => {
        console.log(`   📂 ${routeGroup.name}:`);
        routeGroup.children
          .filter(child => child.meta?.requiredPermission)
          .forEach(child => {
            const { resource, action } = child.meta.requiredPermission;
            console.log(`     📄 ${child.name} - 需要权限: ${resource}:${action}`);
          });
      });
    }).catch(error => {
      console.error('❌ 路由配置验证失败:', error.message);
    });
  } catch (error) {
    console.error('❌ 路由配置验证失败:', error.message);
  }
  
  // 4. 验证中间件
  console.log('\n4️⃣ 验证权限中间件...');
  try {
    import('@/middleware/permission').then(module => {
      const permissionMiddleware = module.default;
      console.log('✅ 权限中间件加载成功');
      console.log('   - 中间件类型:', typeof permissionMiddleware === 'function');
    }).catch(error => {
      console.error('❌ 权限中间件加载失败:', error.message);
    });
  } catch (error) {
    console.error('❌ 权限中间件加载失败:', error.message);
  }
  
  // 5. 运行RBAC测试
  console.log('\n5️⃣ 运行RBAC功能测试...');
  try {
    testRBACSystem();
    console.log('✅ RBAC测试完成');
  } catch (error) {
    console.error('❌ RBAC测试失败:', error.message);
  }
  
  console.log('\n🎉 RBAC系统验证完成！');
  return true;
};

// 验证用户权限级别
export const validateUserPermissions = (user) => {
  if (!user || !user.permissions) {
    console.warn('⚠️ 用户或权限信息不完整');
    return false;
  }
  
  console.log(`🔍 验证用户 ${user.username} (${user.role}) 的权限:`);
  
  const resources = ['users', 'products', 'orders', 'analytics', 'settings'];
  const actions = ['view', 'create', 'edit', 'delete', 'export'];
  
  resources.forEach(resource => {
    console.log(`\n📂 ${resource}:`);
    if (user.permissions[resource]) {
      actions.forEach(action => {
        if (user.permissions[resource][action] !== undefined) {
          const status = user.permissions[resource][action] ? '✅' : '❌';
          console.log(`   ${status} ${action}`);
        }
      });
    } else {
      console.log('   ❌ 无此模块权限');
    }
  });
  
  return true;
};

// 检查页面权限访问
export const checkPageAccess = (user, resource, action) => {
  if (!user?.permissions?.[resource]?.[action]) {
    console.warn(`⚠️ 用户 ${user?.username || '未知'} 没有 ${resource}:${action} 权限`);
    return false;
  }
  
  console.log(`✅ 用户 ${user.username} 有权限访问 ${resource}:${action}`);
  return true;
};

export default {
  validateRBACSystem,
  validateUserPermissions,
  checkPageAccess
};
