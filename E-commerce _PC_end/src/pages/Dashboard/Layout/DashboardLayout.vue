<template>
  <div
    class="wrapper"
    :class="[
      { 'nav-open': $sidebar.showSidebar },
      { rtl: $route.meta.rtlActive },
    ]"
  >
    <notifications></notifications>
    <side-bar
      :active-color="sidebarBackground"
      :background-image="sidebarBackgroundImage"
      :data-background-color="sidebarBackgroundColor"
    >
      <user-menu></user-menu>
      <mobile-menu></mobile-menu>
      <template slot="links">
        <!-- 全品汇管理系统主页 -->
        <sidebar-item
          :link="{ name: '仪表板', icon: 'dashboard', path: '/dashboard' }"
        />
        
        <!-- 商品管理 -->
        <sidebar-item
          :link="{ name: '商品管理', icon: 'inventory_2' }"
          opened
        >
          <sidebar-item
            :link="{ name: '商品列表', path: '/products' }"
          />
          <sidebar-item
            :link="{ name: '添加商品', path: '/products/add' }"
          />
          <sidebar-item
            :link="{ name: '商品分类', path: '/categories' }"
          />
        </sidebar-item>

        <!-- 订单管理 -->
        <sidebar-item
          :link="{ name: '订单管理', icon: 'receipt_long' }"
          opened
        >
          <sidebar-item
            :link="{ name: '订单列表', path: '/orders' }"
          />
          <sidebar-item
            :link="{ name: '订单统计', path: '/orders/statistics' }"
          />
        </sidebar-item>

        <!-- 用户管理 -->
        <sidebar-item
          :link="{ name: '用户管理', icon: 'people' }"
          opened
        >
          <sidebar-item
            :link="{ name: '用户列表', path: '/users' }"
          />
          <sidebar-item
            :link="{ name: '管理员管理', path: '/admins' }"
          />
        </sidebar-item>

        <!-- 数据统计 -->
        <sidebar-item
          :link="{ name: '数据统计', icon: 'analytics', path: '/analytics' }"
        />

        <!-- 系统设置 -->
        <sidebar-item
          :link="{ name: '系统设置', icon: 'settings', path: '/settings' }"
        />
      </template>

      <!-- 全品汇管理系统 - 无需升级按钮 -->
    </side-bar>

    <div class="main-panel">
      <top-navbar></top-navbar>

      <!-- 全品汇管理系统 - 移除主题配置插件 -->

      <div :class="{ content: !$route.meta.hideContent }">
        <zoom-center-transition :duration="200" mode="out-in">
          <!-- your content here -->
          <router-view />
        </zoom-center-transition>
      </div>
      <content-footer v-if="!$route.meta.hideFooter"></content-footer>
    </div>
  </div>
</template>
<script>
/* eslint-disable no-new */
import PerfectScrollbar from "perfect-scrollbar";
import "perfect-scrollbar/css/perfect-scrollbar.css";

function hasElement(className) {
  return document.getElementsByClassName(className).length > 0;
}

function initScrollbar(className) {
  if (hasElement(className)) {
    new PerfectScrollbar(`.${className}`);
    document.getElementsByClassName(className)[0].scrollTop = 0;
  } else {
    // try to init it later in case this component is loaded async
    setTimeout(() => {
      initScrollbar(className);
    }, 100);
  }
}

function reinitScrollbar() {
  let docClasses = document.body.classList;
  let isWindows = navigator.platform.startsWith("Win");
  if (isWindows) {
    // if we are on windows OS we activate the perfectScrollbar function
    initScrollbar("sidebar");
    initScrollbar("sidebar-wrapper");
    initScrollbar("main-panel");

    docClasses.add("perfect-scrollbar-on");
  } else {
    docClasses.add("perfect-scrollbar-off");
  }
}

import TopNavbar from "./TopNavbar.vue";
import ContentFooter from "./ContentFooter.vue";
import MobileMenu from "./Extra/MobileMenu.vue";
import UserMenu from "./Extra/UserMenu.vue";

export default {
  components: {
    TopNavbar,
    ContentFooter,
    MobileMenu,
    UserMenu,
  },
  data() {
    return {
      sidebarBackgroundColor: "black",
      sidebarBackground: "green",
      sidebarBackgroundImage:
        process.env.VUE_APP_BASE_URL + "/img/sidebar-2.jpg",
      sidebarMini: true,
      sidebarImg: true,
      image: process.env.VUE_APP_BASE_URL + "/img/laravel-vue.svg",
    };
  },
  methods: {
    toggleSidebar() {
      if (this.$sidebar.showSidebar) {
        this.$sidebar.displaySidebar(false);
      }
    },
    minimizeSidebar() {
      if (this.$sidebar) {
        this.$sidebar.toggleMinimize();
      }
    },
  },
  updated() {
    reinitScrollbar();
  },
  mounted() {
    reinitScrollbar();
  },
  watch: {
    sidebarMini() {
      this.minimizeSidebar();
    },
  },
};
</script>
<style lang="scss">
$scaleSize: 0.95;
@keyframes zoomIn95 {
  from {
    opacity: 0;
    transform: scale3d($scaleSize, $scaleSize, $scaleSize);
  }
  to {
    opacity: 1;
  }
}
.main-panel .zoomIn {
  animation-name: zoomIn95;
}
@keyframes zoomOut95 {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
    transform: scale3d($scaleSize, $scaleSize, $scaleSize);
  }
}
.main-panel .zoomOut {
  animation-name: zoomOut95;
}
</style>
