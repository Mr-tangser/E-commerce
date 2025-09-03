<template>
  <div class="user">
    <div class="photo">
      <img :src="avatar" alt="avatar" />
    </div>
    <div class="user-info">
      <a
        data-toggle="collapse"
        :aria-expanded="!isClosed"
        @click.stop="toggleMenu"
        @click.capture="clicked"
      >
        <span v-if="$route.meta.rtlActive">
          {{ rtlTitle }}
          <b class="caret"></b>
        </span>
        <span v-else>
          {{ title }}
          <b class="caret"></b>
        </span>
      </a>

      <collapse-transition>
        <div v-show="!isClosed">
          <ul class="nav">
            <slot>
              <li>
                <a v-if="$route.meta.rtlActive" @click="goToProfile">
                  <span class="sidebar-mini">مع</span>
                  <span class="sidebar-normal">ملف</span>
                </a>
                <a @click="goToProfile">
                  <span class="sidebar-mini">我</span>
                  <span class="sidebar-normal">我的资料</span>
                </a>
              </li>
              <li>
                <a v-if="$route.meta.rtlActive" @click="logout">
                  <span class="sidebar-mini">و</span>
                  <span class="sidebar-normal">إعدادات</span>
                </a>
                <a @click="logout">
                  <span class="sidebar-mini">退</span>
                  <span class="sidebar-normal">退出登录</span>
                </a>
              </li>
            </slot>
          </ul>
        </div>
      </collapse-transition>
    </div>
  </div>
</template>
<script>
export default {

  data() {
    return {
      isClosed: true,
      title: '个人资料',
      rtlTitle: "تانيا أندرو",
      avatar: process.env.VUE_APP_BASE_URL + "/img/faces/marc.jpg"
    };
  },

  async created() {
    this.$store.watch(() => this.$store.getters["profile/me"], (me) => {
      this.title = me.name
    })
    await this.$store.dispatch("profile/me")
  },

  methods: {
    clicked: function(e) {
      e.preventDefault();
    },
    toggleMenu: function() {
      this.isClosed = !this.isClosed;
    },
    goToProfile() {
      this.$router.push({name: "用户资料"})
    },
    logout() {
      this.$store.dispatch("logout");
    }
  }
}
</script>
<style>
.collapsed {
  transition: opacity 1s;
}
</style>
