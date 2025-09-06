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

    <div 
      class="main-panel"
      :class="{ 'main-background-enabled': mainBgImg && mainBackgroundImage }"
      :style="mainBgImg && mainBackgroundImage ? { backgroundImage: `url(${mainBackgroundImage})` } : {}"
    >
      <top-navbar></top-navbar>

      <div :class="{ content: !$route.meta.hideContent }">
        <zoom-center-transition :duration="200" mode="out-in">
          <!-- your content here -->
          <router-view />
        </zoom-center-transition>
      </div>
    </div>

    <!-- Fixed Plugin should be at wrapper level for proper positioning -->
    <fixed-plugin
      :color.sync="sidebarBackground"
      :colorBg.sync="sidebarBackgroundColor"
      :sidebarMini.sync="sidebarMini"
      :sidebarImg.sync="sidebarImg"
      :image.sync="sidebarBackgroundImage"
      :mainBgImg.sync="mainBgImg"
      :mainImage.sync="mainBackgroundImage"
    >
    </fixed-plugin>
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
import MobileMenu from "./Extra/MobileMenu.vue";
import FixedPlugin from "../../FixedPlugin.vue";

export default {
  components: {
    TopNavbar,
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
      mainBgImg: true,
      mainBackgroundImage: process.env.BASE_URL + "img/background_img_1.png",
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

// 主页面背景图片样式
.main-panel.main-background-enabled {
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  transition: background-image 0.8s ease-in-out;
  min-height: 100vh;
  
  // 增强背景图片效果
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: inherit;
    filter: contrast(1.1) saturate(1.1) brightness(1.05);
    z-index: -1;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.2);
    z-index: 0;
    transition: background 0.3s ease;
  }
  
  // 确保所有直接子元素在背景之上
  > * {
    position: relative;
    z-index: 1;
  }
  
  // 为导航栏添加半透明背景
  .navbar {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  // 为内容区域添加更好的可读性
  .content {
    // 重置content区域的背景，因为背景已经应用到main-panel
    background: transparent;
  }
  
  .card, .panel, .box {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
  
  // 文字阴影增强可读性
  h1, h2, h3, h4, h5, h6, p, span {
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  }
}

// 背景图片切换动画
@keyframes backgroundFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes backgroundSlideIn {
  from {
    transform: scale(1.1);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.main-panel.main-background-enabled {
  animation: backgroundSlideIn 0.8s ease-out;
}

// 深色主题适配
body.main-background-image .main-panel.main-background-enabled::before {
  background: rgba(0, 0, 0, 0.2);
}

// 确保FixedPlugin在背景图片下仍然可见
.wrapper .fixed-plugin {
  z-index: 1050 !important; // 确保在背景图片之上
  
  .fa-cog {
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(0, 0, 0, 0.8);
      transform: rotate(90deg);
    }
  }
  
  .dropdown-menu {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.95) !important;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .main-panel.main-background-enabled {
    background-attachment: scroll;
    background-size: cover;
  }
}
</style>
