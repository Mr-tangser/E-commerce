// RBAC系统测试工具
export const testRBACSystem = () => {
  console.log('🔐 测试RBAC系统和动态路由功能');
  
  // 模拟不同权限的用户
  const testUsers = {
    superAdmin: {
      username: 'superadmin',
      role: 'super_admin',
      permissions: {
        users: { view: true, create: true, edit: true, delete: true },
        products: { view: true, create: true, edit: true, delete: true },
        orders: { view: true, create: true, edit: true, delete: true },
        analytics: { view: true, export: true },
        settings: { view: true, edit: true }
      }
    },
    
    admin: {
      username: 'admin',
      role: 'admin',
      permissions: {
        users: { view: true, create: false, edit: true, delete: false },
        products: { view: true, create: true, edit: true, delete: false },
        orders: { view: true, create: false, edit: true, delete: false },
        analytics: { view: true, export: false },
        settings: { view: false, edit: false }
      }
    },
    
    manager: {
      username: 'manager',
      role: 'manager',
      permissions: {
        users: { view: true, create: false, edit: false, delete: false },
        products: { view: true, create: true, edit: true, delete: false },
        orders: { view: true, create: false, edit: true, delete: false },
        analytics: { view: true, export: false },
        settings: { view: false, edit: false }
      }
    },
    
    staff: {
      username: 'staff',
      role: 'staff',
      permissions: {
        users: { view: false, create: false, edit: false, delete: false },
        products: { view: true, create: false, edit: false, delete: false },
        orders: { view: true, create: false, edit: false, delete: false },
        analytics: { view: false, export: false },
        settings: { view: false, edit: false }
      }
    }
  };
  
  // 测试侧边栏生成
  Object.entries(testUsers).forEach(([userType, user]) => {
    console.log(`\n👤 ${userType} (${user.role}) 的侧边栏菜单:`);
    const sidebarLinks = generateSidebarForUser(user);
    sidebarLinks.forEach(link => {
      console.log(`  📂 ${link.name}`);
      if (link.children) {
        link.children.forEach(child => {
          console.log(`    📄 ${child.name}`);
        });
      }
    });
  });
  
  return testUsers;
};

// 生成用户侧边栏的模拟函数
const generateSidebarForUser = (user) => {
  const links = [];
  
  // 仪表板（所有用户都能看到）
  links.push({
    name: '仪表板',
    icon: 'dashboard',
    path: '/dashboard'
  });
  
  // 用户管理模块
  if (hasPermission(user, 'users', 'view')) {
    const userManagementChildren = [];
    
    userManagementChildren.push({
      name: '个人资料',
      path: '/examples/user-profile'
    });
    
    userManagementChildren.push({
      name: '用户管理',
      path: '/examples/user-management/list-users'
    });
    
    links.push({
      name: '用户管理',
      icon: 'people',
      children: userManagementChildren
    });
  }
  
  // 商品管理模块
  if (hasPermission(user, 'products', 'view')) {
    const productChildren = [];
    
    productChildren.push({
      name: '商品列表',
      path: '/products/list'
    });
    
    if (hasPermission(user, 'products', 'create')) {
      productChildren.push({
        name: '添加商品',
        path: '/products/create'
      });
    }
    
    productChildren.push({
      name: '分类管理',
      path: '/products/categories'
    });
    
    links.push({
      name: '商品管理',
      icon: 'store',
      children: productChildren
    });
  }
  
  // 订单管理模块
  if (hasPermission(user, 'orders', 'view')) {
    const orderChildren = [];
    
    orderChildren.push({
      name: '订单列表',
      path: '/orders/list'
    });
    
    orderChildren.push({
      name: '订单状态',
      path: '/orders/status'
    });
    
    if (hasPermission(user, 'orders', 'edit')) {
      orderChildren.push({
        name: '退款管理',
        path: '/orders/refunds'
      });
    }
    
    links.push({
      name: '订单管理',
      icon: 'receipt',
      children: orderChildren
    });
  }
  
  // 数据分析模块
  if (hasPermission(user, 'analytics', 'view')) {
    const analyticsChildren = [];
    
    analyticsChildren.push({
      name: '销售统计',
      path: '/analytics/sales'
    });
    
    analyticsChildren.push({
      name: '用户分析',
      path: '/analytics/users'
    });
    
    if (hasPermission(user, 'analytics', 'export')) {
      analyticsChildren.push({
        name: '数据导出',
        path: '/analytics/export'
      });
    }
    
    links.push({
      name: '数据分析',
      icon: 'analytics',
      children: analyticsChildren
    });
  }
  
  // 系统设置模块
  if (hasPermission(user, 'settings', 'view')) {
    const settingsChildren = [];
    
    settingsChildren.push({
      name: '基础设置',
      path: '/settings/basic'
    });
    
    if (hasPermission(user, 'settings', 'edit')) {
      settingsChildren.push({
        name: '系统配置',
        path: '/settings/system'
      });
      
      settingsChildren.push({
        name: '权限管理',
        path: '/settings/permissions'
      });
    }
    
    links.push({
      name: '系统设置',
      icon: 'settings',
      children: settingsChildren
    });
  }
  
  return links;
};

// 权限检查辅助函数
const hasPermission = (user, resource, action) => {
  const userPermissions = user.permissions || {};
  if (!userPermissions[resource]) {
    return false;
  }
  return userPermissions[resource][action] === true;
};

// 导出测试函数
export default {
  testRBACSystem,
  generateSidebarForUser
};
