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
      if (!this.currentUser) {
        return [];
      }
      
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
        
        // 用户管理
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
      
      // 商家管理模块
      if (this.hasPermission('merchants', 'view')) {
        const merchantChildren = [];
        
        // 商家管理（内含商品管理）
        const merchantManagementItem = {
          name: '商家管理',
          path: '/merchants/management'
        };
        
        // 如果有商品管理权限，添加商品管理子菜单
        if (this.hasPermission('merchant_products', 'view')) {
          merchantManagementItem.children = [
            {
              name: '商品管理',
              path: '/products/list'  // 暂时指向现有的商品列表页面
            }
          ];
        }
        
        merchantChildren.push(merchantManagementItem);
        
        // 商家审核
        if (this.hasPermission('merchant_audit', 'view')) {
          merchantChildren.push({
            name: '商家审核',
            path: '/merchants/audit'
          });
        }
        
        links.push({
          name: '商家管理',
          icon: 'store',
          children: merchantChildren
        });
      }
      
      // 订单管理（独立菜单项）
      if (this.hasPermission('orders', 'view')) {
        links.push({
          name: '订单管理',
          icon: 'shopping_cart',
          path: '/orders/list'
        });
      }
      
      return links;
    }
  },
  
  methods: {
    // 检查是否有特定权限
    hasPermission(resource, action) {
      // 如果没有当前用户，直接返回false
      if (!this.currentUser) {
        return false;
      }
      
      // 超级管理员直接拥有所有权限
      if (this.currentUser.role === 'super_admin') {
        return true;
      }
      
      // 检查普通用户权限
      if (!this.userPermissions || !this.userPermissions[resource]) {
        return false;
      }
      
      const resourcePermissions = this.userPermissions[resource];
      return resourcePermissions[action] === true;
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
