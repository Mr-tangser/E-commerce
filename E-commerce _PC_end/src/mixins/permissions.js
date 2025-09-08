// 权限管理mixin
export default {
  computed: {
    currentUser() {
      return this.$store.getters['auth/currentUser'];
    },
    
    userPermissions() {
      return this.currentUser?.permissions || {};
    },
    
    // 获取动态侧边栏菜单
    dynamicSidebarLinks() {
      console.log('🔍 计算动态侧边栏链接');
      
      if (!this.currentUser) {
        console.log('❌ 没有当前用户，返回空数组');
        return [];
      }
      
      console.log(`👤 当前用户: ${this.currentUser.username} (${this.currentUser.role})`);
      
      const links = [];
      
      // 仪表板（所有用户都能看到）
      links.push({
        name: '仪表板',
        icon: 'dashboard',
        path: '/dashboard'
      });
      
      // 用户管理模块
      if (this.hasPermission('users', 'view')) {
        const userManagementChildren = [];
        
        // 个人资料
        userManagementChildren.push({
          name: '个人资料',
          path: '/examples/user-profile'
        });
        
        // 用户管理（查看权限）
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
      if (this.hasPermission('products', 'view')) {
        const productChildren = [];
        
        productChildren.push({
          name: '商品列表',
          path: '/products/list'
        });
        
        if (this.hasPermission('products', 'create')) {
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
      if (this.hasPermission('orders', 'view')) {
        const orderChildren = [];
        
        orderChildren.push({
          name: '订单列表',
          path: '/orders/list'
        });
        
        orderChildren.push({
          name: '订单状态',
          path: '/orders/status'
        });
        
        if (this.hasPermission('orders', 'edit')) {
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
      if (this.hasPermission('analytics', 'view')) {
        const analyticsChildren = [];
        
        analyticsChildren.push({
          name: '销售统计',
          path: '/analytics/sales'
        });
        
        analyticsChildren.push({
          name: '用户分析',
          path: '/analytics/users'
        });
        
        if (this.hasPermission('analytics', 'export')) {
          analyticsChildren.push({
            name: '数据导出',
            path: '/analytics/export'
          });
        }
        
        links.push({
          name: '数据分析',
          icon: 'bar_chart',
          children: analyticsChildren
        });
      }
      
      // 系统设置模块（通常只有高级管理员可见）
      if (this.hasPermission('settings', 'view')) {
        const settingsChildren = [];
        
        settingsChildren.push({
          name: '基础设置',
          path: '/settings/basic'
        });
        
        if (this.hasPermission('settings', 'edit')) {
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
      
      console.log(`🎯 生成了 ${links.length} 个侧边栏菜单项`);
      return links;
    }
  },
  
  methods: {
    // 检查是否有特定权限
    hasPermission(resource, action) {
      // 超级管理员直接拥有所有权限
      if (this.currentUser?.role === 'super_admin') {
        console.log(`✅ ${resource}:${action} - 超级管理员拥有所有权限`);
        return true;
      }
      
      console.log(`🔐 检查权限: ${resource}:${action}`);
      console.log('🔍 当前用户权限对象:', this.userPermissions);
      
      if (!this.userPermissions || !this.userPermissions[resource]) {
        console.log(`❌ 没有 ${resource} 权限模块`);
        console.log('可用权限模块:', Object.keys(this.userPermissions || {}));
        return false;
      }
      
      const resourcePermissions = this.userPermissions[resource];
      console.log(`🔑 ${resource} 模块权限:`, resourcePermissions);
      const hasAccess = resourcePermissions[action] === true;
      console.log(`${hasAccess ? '✅' : '❌'} ${resource}:${action} = ${hasAccess} (类型: ${typeof resourcePermissions[action]})`);
      return hasAccess;
    },
    
    // 检查是否有任何权限
    hasAnyPermission(resource) {
      // 超级管理员直接拥有所有权限
      if (this.currentUser?.role === 'super_admin') {
        return true;
      }
      
      if (!this.userPermissions || !this.userPermissions[resource]) {
        return false;
      }
      return Object.values(this.userPermissions[resource]).some(permission => permission === true);
    },
    
    // 检查角色权限（基于角色层级）
    hasRole(role) {
      const roleHierarchy = {
        'staff': 1,
        'manager': 2,
        'admin': 3,
        'super_admin': 4
      };
      
      const userRole = this.currentUser?.role;
      return roleHierarchy[userRole] >= roleHierarchy[role];
    },
    
    // 权限不足时的处理
    handleUnauthorized(message = '您没有权限访问此功能') {
      this.$store.dispatch('alerts/error', message);
    }
  }
};
