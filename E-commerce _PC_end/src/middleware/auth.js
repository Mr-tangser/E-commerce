import store from "../store";

export default function auth({ next, router, to }) {
  if (!store.getters.isAuthenticated) {
    // 避免在已经在登录页面时重复跳转
    if (to.name !== "Login") {
      return router.push({ name: "Login" });
    }
  }

  return next();
}
