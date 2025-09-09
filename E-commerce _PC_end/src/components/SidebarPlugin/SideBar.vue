<template>
  <div
    class="sidebar"
    :data-color="activeColor"
    :data-image="backgroundImage"
    :data-background-color="backgroundColor"
    :style="sidebarStyle"
  >
    <div class="logo">
      <a class="logo-mini">
        <div class="logo-img">
          <span style="font-weight: bold; color: white;">全</span>
        </div>
      </a>
      <a class="logo-normal">
        <template v-if="$route.meta.rtlActive">{{ rtlTitle }}</template>
        <template v-else>{{ title }}</template>
      </a>
<!--      <div class="navbar-minimize">-->
<!--        <md-button-->
<!--          id="minimizeSidebar"-->
<!--          class="md-round md-just-icon md-transparent"-->
<!--          @click="minimizeSidebar"-->
<!--        >-->
<!--          <i class="material-icons text_align-center visible-on-sidebar-regular"-->
<!--            >more_vert</i-->
<!--          >-->
<!--          <i-->
<!--            class="material-icons design_bullet-list-67 visible-on-sidebar-mini"-->
<!--            >view_list</i-->
<!--          >-->
<!--        </md-button>-->
<!--      </div>-->
    </div>
    <div class="sidebar-wrapper" ref="sidebarScrollArea">
      <slot></slot>
      <md-list class="nav">
        <slot name="links">
          <sidebar-item
            v-for="(link, index) in sidebarLinks"
            :key="link.name + index"
            :link="link"
          >
            <sidebar-item
              v-for="(subLink, index) in link.children"
              :key="subLink.name + index"
              :link="subLink"
            >
            </sidebar-item>
          </sidebar-item>
        </slot>
      </md-list>
    </div>
  </div>
</template>
<script>
export default {
  name: "sidebar",
  props: {
    title: {
      type: String,
      default: "全品汇管理平台"
    },
    rtlTitle: {
      type: String,
      default: "全品汇管理平台"
    },
    activeColor: {
      type: String,
      default: "green",
      validator: value => {
        let acceptedValues = [
          "",
          "purple",
          "azure",
          "green",
          "orange",
          "danger",
          "rose"
        ];
        return acceptedValues.indexOf(value) !== -1;
      }
    },
    backgroundImage: {
      type: String,
      default: process.env.BASE_URL + "img/back/back_2.jpg"
    },
    backgroundColor: {
      type: String,
      default: "black",
      validator: value => {
        let acceptedValues = ["", "black", "white", "red"];
        return acceptedValues.indexOf(value) !== -1;
      }
    },
    logo: {
      type: String,
      default: `${process.env.VUE_APP_BASE_URL}/img/vue-logo.png`
    },
    sidebarLinks: {
      type: Array,
      default: () => []
    },
    autoClose: {
      type: Boolean,
      default: true
    }
  },
  created() {
    // 移除自动最小化，让侧边栏默认保持展开状态
    // this.$sidebar.toggleMinimize();
  },
  provide() {
    return {
      autoClose: this.autoClose
    };
  },
  methods: {
    minimizeSidebar() {
      if (this.$sidebar) {
        this.$sidebar.toggleMinimize();
      }
    }
  },
  computed: {
    sidebarStyle() {
      return {
        backgroundImage: `url(${this.backgroundImage})`
      };
    }
  },
  beforeDestroy() {
    if (this.$sidebar.showSidebar) {
      this.$sidebar.showSidebar = false;
    }
  }
};
</script>
<style>
@media (min-width: 992px) {
  .navbar-search-form-mobile,
  .nav-mobile-menu {
    display: none;
  }
}

/* 隐藏侧边栏滚动条 */
.sidebar {
  overflow: hidden !important;
}

.sidebar .sidebar-wrapper {
  overflow: hidden !important;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.sidebar .sidebar-wrapper::-webkit-scrollbar {
  display: none !important; /* Chrome, Safari and Opera */
}

/* 确保PerfectScrollbar的滚动条不显示 */
.sidebar .ps-scrollbar-y-rail,
.sidebar .ps-scrollbar-x-rail {
  display: none !important;
  opacity: 0 !important;
}

/* Logo居中样式 */
.sidebar .logo {
  text-align: center;
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
  position: relative;
  min-height: 60px;
}

/* 正常状态下显示logo-normal，隐藏logo-mini */
.sidebar .logo .logo-mini {
  display: none !important;
  opacity: 0;
  visibility: hidden;
}

.sidebar .logo .logo-normal {
  display: block !important;
  text-align: center;
  color: white;
  font-size: 20px;
  font-weight: 400;
  line-height: 1.2;
  text-decoration: none;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  opacity: 1;
  visibility: visible;
}

.sidebar .logo .logo-normal:hover {
  color: rgba(255, 255, 255, 0.8);
}

/* Mini状态下显示logo-mini，隐藏logo-normal */
.sidebar-mini .sidebar .logo .logo-mini {
  display: flex !important;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin: 0;
  position: relative;
  top: 0;
  text-decoration: none;
  opacity: 1;
  visibility: visible;
}

.sidebar-mini .sidebar .logo .logo-mini .logo-img {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.sidebar-mini .sidebar .logo .logo-mini .logo-img:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.sidebar-mini .sidebar .logo .logo-mini .logo-img span {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.sidebar-mini .sidebar .logo .logo-normal {
  display: none !important;
  opacity: 0;
  visibility: hidden;
}
</style>
