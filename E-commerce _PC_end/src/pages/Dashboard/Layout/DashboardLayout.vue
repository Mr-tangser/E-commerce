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
      :sidebar-links="sidebarLinks"
    >
      <mobile-menu></mobile-menu>
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
  
  // 检查是否开启了主背景图片
  const mainPanel = document.querySelector('.main-panel');
  const hasMainBackground = mainPanel && mainPanel.classList.contains('main-background-enabled');
  
  if (isWindows && !hasMainBackground) {
    // 只有在没有主背景图片时才启用PerfectScrollbar
    // 注释掉sidebar相关的滚动条，避免不必要的滚动条显示
    // initScrollbar("sidebar");
    // initScrollbar("sidebar-wrapper");
    initScrollbar("main-panel");

    docClasses.add("perfect-scrollbar-on");
  } else {
    docClasses.add("perfect-scrollbar-off");
    // 清理可能存在的PerfectScrollbar实例
    const existingScrollbar = document.querySelector('.main-panel .ps-container');
    if (existingScrollbar) {
      // 移除PerfectScrollbar的类名，恢复原生滚动
      existingScrollbar.classList.remove('ps-container', 'ps-active-y', 'ps-active-x');
    }
  }
}

import TopNavbar from "./TopNavbar.vue";
import MobileMenu from "./Extra/MobileMenu.vue";
import FixedPlugin from "../../FixedPlugin.vue";
import permissionsMixin from "@/mixins/permissions";

export default {
  components: {
    TopNavbar,
    FixedPlugin,
    MobileMenu,
  },
  mixins: [permissionsMixin],
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
      return this.$store.getters['auth/currentUser'];
    },
    isAuthenticated() {
      return this.$store.getters['auth/isAuthenticated'];
    },
    userAvatar() {
      if (this.currentUser?.avatar && this.currentUser.avatar !== '/img/default.jpg') {
        return process.env.BASE_URL + this.currentUser.avatar.replace(/^\//, '');
      }
      return process.env.BASE_URL + "img/default.jpg";
    },
    
    // 从mixin继承dynamicSidebarLinks，这里确保它能正确工作
    sidebarLinks() {
      const links = this.dynamicSidebarLinks || [];
      return links;
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
    // 手动展开侧边栏
    expandSidebar() {
      if (this.$sidebar && this.$sidebar.isMinimized) {
        this.$sidebar.toggleMinimize();
      }
    }
  },
  updated() {
    reinitScrollbar();
  },
  async mounted() {
    reinitScrollbar();
    
    // 如果已认证但没有用户信息，则获取用户信息
    if (this.isAuthenticated && !this.currentUser) {
      try {
        await this.$store.dispatch('auth/fetchCurrentUser');
// console.log('✅ 用户信息获取成功:', this.currentUser);
      } catch (error) {
        console.error('❌ 获取用户信息失败:', error);
        // 如果获取失败，临时使用测试数据（仅开发环境）
        if (process.env.NODE_ENV === 'development') {
          // console.log('🔧 开发环境：使用测试数据');
          this.$store.commit('auth/SET_USER', {
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
            isActive: true
          });
          this.$store.commit('auth/SET_AUTHENTICATED', true);
        }
      }
    }
    
    // 更新image为用户头像
    this.image = this.userAvatar;
  },
  watch: {
    sidebarMini() {
      this.minimizeSidebar();
    },
    userAvatar: {
      handler(newAvatar) {
        // 当用户头像更新时，同步更新侧边栏头像
        // console.log('🖼️ 用户头像更新:', newAvatar);
        this.image = newAvatar;
      },
      immediate: true
    },
    // 监听用户数据变化，确保侧边栏响应更新
    currentUser: {
      handler(newUser) {
        if (newUser) {
          // console.log('👤 用户数据更新:', newUser.username);
          // console.log('🔗 侧边栏链接数量:', this.sidebarLinks.length);
          // 如果侧边栏是最小化状态且有用户数据，可以考虑展开
          // 注释掉自动展开，让用户手动控制
          // if (this.$sidebar.isMinimized) {
          //   this.$sidebar.toggleMinimize();
          // }
        }
      },
      immediate: true
    },
    mainBgImg() {
      // 当主背景图片状态改变时，重新初始化滚动条
      this.$nextTick(() => {
        reinitScrollbar();
      });
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
  background-attachment: scroll; // 改为scroll，避免fixed导致的滚动性能问题
  transition: background-image 0.8s ease-in-out;
  height: 100vh; // 固定高度为视口高度，避免无限滚动
  overflow: hidden; // main-panel本身不滚动，由内容区域处理滚动
  
  // 简化背景效果，避免复杂的伪元素影响滚动性能
  &::before {
    content: '';
    position: fixed; // 使用fixed让遮罩层不受滚动影响
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.15);
    z-index: 0;
    pointer-events: none; // 确保不阻止鼠标事件
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

// 滚动性能优化
.main-panel.main-background-enabled {
  // 启用硬件加速
  transform: translateZ(0);
  
  // 优化滚动性能
  -webkit-overflow-scrolling: touch;
  
  // 确保内容区域可以正常滚动
  .content {
    position: relative;
    z-index: 2;
    height: calc(100vh - 70px); // 设置固定高度，减去导航栏高度
    min-height: auto !important; // 覆盖默认的min-height设置，防止无限滚动
    max-height: calc(100vh - 70px); // 确保不会超出视口高度
    overflow-y: auto; // 内容区域自己处理滚动
    overflow-x: hidden; // 防止水平滚动
    padding: 20px; // 正常的内边距
    box-sizing: border-box; // 确保padding不会增加总高度
  }
  
  // 禁用PerfectScrollbar的样式，使用原生滚动
  &.ps-container {
    overflow: hidden !important; // 保持hidden，让content区域处理滚动
    
    .ps-scrollbar-y-rail,
    .ps-scrollbar-x-rail {
      display: none !important;
    }
  }
}

// 修复可能的滚动冲突
body.perfect-scrollbar-on .main-panel.main-background-enabled {
  overflow: hidden !important; // 保持hidden
  
  // 强制禁用PerfectScrollbar
  &.ps-container {
    overflow: hidden !important;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .main-panel.main-background-enabled {
    background-attachment: scroll;
    background-size: cover;
    
    // 移动设备上简化效果
    &::before {
      display: none;
    }
  }
}
</style>
