<template>
  <div v-if="user" class="md-layout md-gutter">
    <div class="md-layout-item md-size-66 md-small-size-100">
      <div class="md-layout-item md-size-100">
        <user-edit-card :user="user"/>
      </div>
      <div class="md-layout-item md-size-100">
        <user-password-card :user="user"/>
      </div>
    </div>
    <div class="md-layout-item md-size-33 md-small-size-100">
      <user-profile-card :user="user"/>
    </div>
  </div>
</template>

<script>
  import UserEditCard from "@/pages/Dashboard/Examples/UserProfile/EditProfileCard.vue";
  import UserPasswordCard from "@/pages/Dashboard/Examples/UserProfile/EditPasswordCard.vue";
  import UserProfileCard from "@/pages/Dashboard/Examples/UserProfile/UserProfileCard.vue";

  export default {
    name: "user-profile-example",

    components: {
      "user-profile-card": UserProfileCard,
      "user-edit-card": UserEditCard,
      "user-password-card": UserPasswordCard
    },

    data: () => ({
      user: null
    }),

    computed: {
      currentUser() {
        return this.$store.getters.currentUser;
      }
    },

    async created() {
      await this.getProfile();
    },

    methods: {
      async getProfile() {
        try {
          // 使用 Vuex store 获取用户信息
          if (!this.currentUser) {
            await this.$store.dispatch('fetchCurrentUser');
          }
          this.user = this.$store.getters.currentUser;
        } catch (error) {
          console.error('获取个人资料失败:', error);
          this.$notify({
            message: '获取个人资料失败，请重试',
            horizontalAlign: 'right',
            verticalAlign: 'top',
            type: 'danger'
          });
        }
      }
    }
  }
</script>