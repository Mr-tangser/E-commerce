import DashboardLayout from "@/pages/Dashboard/Layout/DashboardLayout.vue";

// Dashboard pages
import Dashboard from "@/pages/Dashboard/Dashboard.vue";
import Login from "@/pages/Dashboard/Pages/Login/Login_zhao.vue";

//import middleware
import auth from "@/middleware/auth";
import guest from "@/middleware/guest";

// 全品汇管理系统专用路由

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
        name: "Dashboard",
        components: { default: Dashboard },
        meta: { middleware: auth }
      }
    ]
  },
  loginPage
];

export default routes;
