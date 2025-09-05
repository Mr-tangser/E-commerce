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
      <mobile-menu></mobile-menu>
      <template slot="links">
        <sidebar-item
          :link="{ name: '仪表板', icon: 'dashboard', path: '/dashboard' }"
        />

        <sidebar-item opened :link="{ name: '用户管理', image: image }">
          <sidebar-item
            :link="{ name: '个人资料', path: '/examples/user-profile' }"
          />
          <sidebar-item
            :link="{
              name: '用户管理',
              path: '/examples/user-management/list-users',
            }"
          />
        </sidebar-item>


      </template>


    </side-bar>

    <div class="main-panel">
      <top-navbar></top-navbar>

      <fixed-plugin
        :color.sync="sidebarBackground"
        :colorBg.sync="sidebarBackgroundColor"
        :sidebarMini.sync="sidebarMini"
        :sidebarImg.sync="sidebarImg"
        :image.sync="sidebarBackgroundImage"
      >
      </fixed-plugin>

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
    // 注释掉sidebar相关的滚动条，避免不必要的滚动条显示
    // initScrollbar("sidebar");
    // initScrollbar("sidebar-wrapper");
    initScrollbar("main-panel");

    docClasses.add("perfect-scrollbar-on");
  } else {
    docClasses.add("perfect-scrollbar-off");
  }
}

import TopNavbar from "./TopNavbar.vue";
import ContentFooter from "./ContentFooter.vue";
import MobileMenu from "./Extra/MobileMenu.vue";
import FixedPlugin from "../../FixedPlugin.vue";

export default {
  components: {
    TopNavbar,
    ContentFooter,
    FixedPlugin,
    MobileMenu,
  },
  data() {
    return {
      sidebarBackgroundColor: "black",
      sidebarBackground: "green",
      sidebarBackgroundImage: process.env.BASE_URL + "img/back/back_2.jpg",
      sidebarMini: true,
      sidebarImg: true,
      image: process.env.BASE_URL + "img/default.jpg", // 默认头像
    };
  },

  computed: {
    currentUser() {
      return this.$store.getters.currentUser;
    },
    isAuthenticated() {
      return this.$store.getters.isAuthenticated;
    },
    userAvatar() {
      if (this.currentUser?.avatar && this.currentUser.avatar !== '/img/default.jpg') {
        return process.env.BASE_URL + this.currentUser.avatar.replace(/^\//, '');
      }
      return process.env.BASE_URL + "img/default.jpg";
    }
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
  async mounted() {
    reinitScrollbar();
    // 如果已认证但没有用户信息，则获取用户信息
    if (this.isAuthenticated && !this.currentUser) {
      await this.$store.dispatch('fetchCurrentUser');
    }
    // 更新image为用户头像
    this.image = this.userAvatar;
  },
  watch: {
    sidebarMini() {
      this.minimizeSidebar();
    },
    userAvatar() {
      // 当用户头像更新时，同步更新侧边栏头像
      this.image = this.userAvatar;
    }
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
