// 用户角色切换工具 - 仅开发环境使用
import store from '@/store';

// 测试用户数据
const testUsers = {
  superadmin: {
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
  },
  
  admin: {
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
  },
  
  manager: {
    _id: "68aee067d310e9a9a6a8b177",
    username: "manager",
    email: "manager@ecommerce.com",
    role: "manager",
    avatar: "/img/default.jpg",
    firstName: "Manager",
    lastName: "User", 
    department: "operations",
    permissions: {
      users: { view: true, create: false, edit: false, delete: false },
      products: { view: true, create: true, edit: true, delete: true },
      orders: { view: true, create: false, edit: true, delete: false },
      analytics: { view: true, export: true },
      settings: { view: false, edit: false }
    },
    isActive: true,
    loginCount: 5,
    twoFactorEnabled: false,
    sessionTimeout: 8
  }
};

// 切换用户角色
export const switchUser = (userRole) => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('🚫 用户切换仅在开发环境中可用');
    return;
  }
  
  const userData = testUsers[userRole];
  if (!userData) {
    console.error('❌ 无效的用户角色:', userRole);
    console.log('可用角色:', Object.keys(testUsers));
    return;
  }
  
  store.commit('auth/SET_USER', userData);
  console.log(`🔄 已切换到用户: ${userData.username} (${userData.role})`);
  console.log('用户权限:', userData.permissions);
  
  // 刷新页面以重新计算权限
  setTimeout(() => {
    window.location.reload();
  }, 500);
};

// 在控制台中暴露切换方法
if (process.env.NODE_ENV === 'development') {
  window.switchUser = switchUser;
  console.log('🛠️ 开发工具已加载：');
  console.log('使用 switchUser("admin") 切换到管理员');
  console.log('使用 switchUser("superadmin") 切换到超级管理员');
  console.log('使用 switchUser("manager") 切换到经理');
}
