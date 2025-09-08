import DashboardLayout from "@/pages/Dashboard/Layout/DashboardLayout.vue";
import AuthLayout from "@/pages/Dashboard/Pages/AuthLayout.vue";

// Dashboard pages
import Dashboard from "@/pages/Dashboard/Dashboard.vue";
// Profile
import UserProfile from "@/pages/Dashboard/Examples/UserProfile.vue";

// User Management
import ListUserPage from "@/pages/Dashboard/Examples/UserManagement/ListUserPage.vue";

// Products Management
import ProductList from "@/pages/Dashboard/Products/ProductList.vue";

// Orders Management
import OrderList from "@/pages/Dashboard/Orders/OrderList.vue";

// Analytics
import SalesAnalytics from "@/pages/Dashboard/Analytics/SalesAnalytics.vue";

// Settings
import SystemSettings from "@/pages/Dashboard/Settings/SystemSettings.vue";

// Pages
import RtlSupport from "@/pages/Dashboard/Pages/RtlSupport.vue";
import Login from "@/pages/Dashboard/Pages/Login/Login_zhao.vue";
import Register from "@/pages/Dashboard/Pages/Register.vue";

// Components pages
import Notifications from "@/pages/Dashboard/Components/Notifications.vue";
import Icons from "@/pages/Dashboard/Components/Icons.vue";
import Typography from "@/pages/Dashboard/Components/Typography.vue";

// TableList pages
import RegularTables from "@/pages/Dashboard/Tables/RegularTables.vue";

// Maps pages
import FullScreenMap from "@/pages/Dashboard/Maps/FullScreenMap.vue";

//import middleware
import auth from "@/middleware/auth";
import guest from "@/middleware/guest";
import permission from "@/middleware/permission";

let componentsMenu = {
  path: "/components",
  component: DashboardLayout,
  redirect: "/components/notification",
  name: "Components",
  children: [
    {
      path: "table",
      name: "Table",
      components: { default: RegularTables },
      meta: { middleware: auth }
    },
    {
      path: "typography",
      name: "Typography",
      components: { default: Typography },
      meta: { middleware: auth }
    },
    {
      path: "icons",
      name: "Icons",
      components: { default: Icons },
      meta: { middleware: auth }
    },
    {
      path: "maps",
      name: "Maps",
      meta: {
        hideContent: true,
        hideFooter: true,
        navbarAbsolute: true,
        middleware: auth
      },
      components: { default: FullScreenMap }
    },
    {
      path: "notifications",
      name: "Notifications",
      components: { default: Notifications },
      meta: { middleware: auth }
    },
    {
      path: "rtl",
      name: "وحة القيادة",
      meta: {
        rtlActive: true,
        middleware: auth
      },
      components: { default: RtlSupport }
    }
  ]
};

let examplesMenu = {
  path: "/examples",
  component: DashboardLayout,
  name: "Examples",
  children: [
    {
      path: "user-profile",
      name: "个人资料",
      components: { default: UserProfile },
      meta: { middleware: auth }
    },
    {
      path: "user-management/list-users",
      name: "用户列表",
      components: { default: ListUserPage },
      meta: { 
        middleware: [auth, permission],
        requiredPermission: { resource: 'users', action: 'view' }
      }
    }
  ]
};

// 商品管理路由
let productsMenu = {
  path: "/products",
  component: DashboardLayout,
  name: "Products",
  children: [
    {
      path: "list",
      name: "商品列表",
      components: { default: ProductList },
      meta: { 
        middleware: [auth, permission],
        requiredPermission: { resource: 'products', action: 'view' }
      }
    }
  ]
};

// 订单管理路由
let ordersMenu = {
  path: "/orders",
  component: DashboardLayout,
  name: "Orders",
  children: [
    {
      path: "list",
      name: "订单列表",
      components: { default: OrderList },
      meta: { 
        middleware: [auth, permission],
        requiredPermission: { resource: 'orders', action: 'view' }
      }
    }
  ]
};

// 数据分析路由
let analyticsMenu = {
  path: "/analytics",
  component: DashboardLayout,
  name: "Analytics",
  children: [
    {
      path: "sales",
      name: "销售统计",
      components: { default: SalesAnalytics },
      meta: { 
        middleware: [auth, permission],
        requiredPermission: { resource: 'analytics', action: 'view' }
      }
    }
  ]
};

// 系统设置路由
let settingsMenu = {
  path: "/settings",
  component: DashboardLayout,
  name: "Settings",
  children: [
    {
      path: "system",
      name: "系统配置",
      components: { default: SystemSettings },
      meta: { 
        middleware: [auth, permission],
        requiredPermission: { resource: 'settings', action: 'view' }
      }
    }
  ]
};

let authPages = {
  path: "/",
  component: AuthLayout,
  name: "Authentication",
  children: [
    {
      path: "/register",
      name: "Register",
      component: Register,
      meta: { middleware: guest }
    }
  ]
};

// 独立的登录页面，不使用AuthLayout
let loginPage = {
  path: "/login",
  name: "Login",
  component: Login,
  meta: { middleware: guest }
};

const routes = [
  {
    path: "/",
    redirect: "/dashboard",
    name: "Home"
  },
  {
    path: "/",
    component: DashboardLayout,
    meta: { middleware: auth },
    children: [
      {
        path: "dashboard",
        name: "仪表板",
        components: { default: Dashboard },
        meta: { middleware: auth }
      }
    ]
  },
  componentsMenu,
  examplesMenu,
  productsMenu,
  ordersMenu,
  analyticsMenu,
  settingsMenu,
  loginPage,
  authPages
];

export default routes;
