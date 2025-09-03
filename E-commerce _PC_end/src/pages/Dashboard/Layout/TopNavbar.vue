<template>
  <md-toolbar
    md-elevation="0"
    class="md-transparent"
    :class="{
      'md-toolbar-absolute md-white md-fixed-top': $route.meta.navbarAbsolute,
    }"
  >
    <div class="md-toolbar-row">
      <div class="md-toolbar-section-start">
        <h3 class="md-title">{{ getPageTitle() }}</h3>
      </div>
      <div class="md-toolbar-section-end">
        <md-button
          class="md-just-icon md-round md-simple md-toolbar-toggle"
          :class="{ toggled: $sidebar.showSidebar }"
          @click="toggleSidebar"
        >
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </md-button>

        <div class="md-collapse">
          <div class="md-autocomplete">
            <md-autocomplete
              class="search"
              v-model="searchQuery"
              :md-options="[]"
              :md-open-on-focus="false"
            >
              <label>搜索...</label>
            </md-autocomplete>
          </div>
          <md-list>
            <md-list-item href="#/dashboard">
              <i class="material-icons">dashboard</i>
              <p class="hidden-lg hidden-md">仪表板</p>
            </md-list-item>

            <li class="md-list-item">
              <a
                class="md-list-item-router md-list-item-container md-button-clean dropdown"
              >
                <div class="md-list-item-content">
                  <drop-down direction="down">
                    <md-button
                      slot="title"
                      class="md-button md-just-icon md-simple"
                      data-toggle="dropdown"
                    >
                      <md-icon>notifications</md-icon>
                      <span class="notification" v-if="notificationCount > 0">{{ notificationCount }}</span>
                      <p class="hidden-lg hidden-md">通知</p>
                    </md-button>
                    <ul class="dropdown-menu dropdown-menu-right">
                      <li v-if="notifications.length === 0"><a href="#">暂无新通知</a></li>
                      <li v-for="notification in notifications" :key="notification.id">
                        <a href="#" @click="markAsRead(notification.id)">{{ notification.message }}</a>
                      </li>
                    </ul>
                  </drop-down>
                </div>
              </a>
            </li>

            <md-list-item @click="goToProfile">
              <i class="material-icons">person</i>
              <p class="hidden-lg hidden-md">个人资料</p>
            </md-list-item>

            <md-list-item @click="logout">
              <i class="material-icons">exit_to_app</i>
              <p class="hidden-lg hidden-md">退出登录</p>
            </md-list-item>
          </md-list>
        </div>
      </div>
    </div>
  </md-toolbar>
</template>

<script>
export default {
  data() {
    return {
      searchQuery: "",
      notifications: [
        // 示例通知数据，实际应从后端获取
      ]
    };
  },
  computed: {
    notificationCount() {
      return this.notifications.filter(n => !n.read).length;
    }
  },
  methods: {
    toggleSidebar() {
      this.$sidebar.displaySidebar(!this.$sidebar.showSidebar);
    },
    minimizeSidebar() {
      if (this.$sidebar) {
        this.$sidebar.toggleMinimize();
      }
    },
    getPageTitle() {
      const routeNameMap = {
        'Dashboard': '仪表板',
        'Login': '登录'
      };
      return routeNameMap[this.$route.name] || this.$route.name || '全品汇管理系统';
    },
    markAsRead(notificationId) {
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
    },
    goToProfile() {
      // 跳转到个人资料页面（待实现）
      this.$notify({
        message: '个人资料页面开发中...',
        horizontalAlign: 'right',
        verticalAlign: 'top',
        type: 'info'
      });
    },
    logout() {
      // 调用Vuex的logout action
      this.$store.dispatch('logout').then(() => {
        this.$notify({
          message: '已安全退出系统',
          horizontalAlign: 'right',
          verticalAlign: 'top',
          type: 'success'
        });
      });
    }
  },
};
</script>
