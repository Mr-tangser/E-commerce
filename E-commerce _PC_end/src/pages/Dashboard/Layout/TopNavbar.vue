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
        <h3 class="md-title">{{ $route.name }}</h3>
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
              v-model="selectedEmployee"
              :md-options="employees"
              :md-open-on-focus="false"
            >
              <label>搜索...</label>
            </md-autocomplete>
          </div>
          <md-list>

            <md-list-item @click="goToProfile" class="user-profile-item" :class="{ 'current-page': isCurrentPage }">
              <div class="user-avatar-container">
                <img 
                  :src="currentUserAvatar" 
                  @error="handleAvatarError"
                  class="user-avatar"
                  :class="{ 'current-page-avatar': isCurrentPage }"
                  alt="用户头像"
                />
              </div>
              <p class="hidden-lg hidden-md">个人资料</p>
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
      selectedEmployee: "",
      employees: [
        "Jim Halpert",
        "Dwight Schrute",
        "Michael Scott",
        "Pam Beesly",
        "Angela Martin",
        "Kelly Kapoor",
        "Ryan Howard",
        "Kevin Malone",
      ],
      defaultAvatar: process.env.BASE_URL + "img/default.jpg"
    };
  },

  computed: {
    currentUser() {
      return this.$store.getters.currentUser;
    },
    isAuthenticated() {
      return this.$store.getters.isAuthenticated;
    },
    currentUserAvatar() {
      if (this.currentUser?.avatar && this.currentUser.avatar !== '/img/default.jpg') {
        return process.env.BASE_URL + this.currentUser.avatar.replace(/^\//, '');
      }
      return this.defaultAvatar;
    },
    isCurrentPage() {
      return this.$route.name === "个人资料";
    }
  },

  async mounted() {
    // 如果已认证但没有用户信息，则获取用户信息
    if (this.isAuthenticated && !this.currentUser) {
      await this.$store.dispatch('fetchCurrentUser');
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
    goToUsers() {
      // 检查当前是否已在个人资料页面
      if (this.$route.name === "个人资料") {
        return; // 如果已在目标页面，直接返回
      }
      
      // 使用 catch 捕获重复导航错误
      this.$router.push({ name: "个人资料" }).catch(err => {
        // 忽略导航重复错误，但记录其他错误
        if (err.name !== 'NavigationDuplicated') {
          console.error('导航错误:', err);
        }
      });
    },
    goToProfile() {
      // 检查当前是否已在个人资料页面
      if (this.$route.name === "个人资料") {
        // 如果已在目标页面，显示友好提示
        this.$notify({
          message: '您已经在个人资料页面了',
          horizontalAlign: 'right',
          verticalAlign: 'top',
          type: 'info'
        });
        return;
      }
      
      // 使用 catch 捕获重复导航错误
      this.$router.push({ name: "个人资料" }).catch(err => {
        // 忽略导航重复错误，但记录其他错误
        if (err.name !== 'NavigationDuplicated') {
          console.error('导航错误:', err);
        }
      });
    },
    handleAvatarError() {
      // 头像加载失败时使用默认头像
      this.$forceUpdate();
    }
  },
};
</script>

<style scoped>
.user-profile-item {
  display: flex;
  align-items: center;
}

.user-avatar-container {
  margin-right: 8px;
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.user-avatar:hover {
  border-color: #4caf50;
  transform: scale(1.05);
}

.current-page-avatar {
  border-color: #4caf50 !important;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
}

.user-profile-item.current-page {
  opacity: 0.8;
}

.user-profile-item.current-page:hover {
  opacity: 1;
}
</style>
