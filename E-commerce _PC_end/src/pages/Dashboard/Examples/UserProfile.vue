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
        return this.$store.getters['auth/currentUser'];
      }
    },

    async created() {
      await this.getProfile();
    },

    methods: {
    async getProfile() {
      try {
        console.log('🔍 开始获取个人资料...');
        
        // 检查token状态
        const token = localStorage.getItem('vue-authenticate.vueauth_access_token');
        console.log('Token状态:', !!token);
        
        if (!token) {
          console.log('❌ 没有token，跳转到登录页');
          this.$router.push({name: "Login"});
          return;
        }
        
        // 直接从后端API获取最新的用户信息
        const response = await this.$http.get('http://localhost:3000/api/admin/profile');
        
        console.log('✅ 获取个人资料成功:', response.data);
        
        if (response.data.success) {
          this.user = response.data.data.admin;
          
          // 同时更新store中的用户信息
          this.$store.dispatch('auth/updateUserInfo', this.user);
        }
      } catch (error) {
        console.error('❌ 获取个人资料失败:', error);
        
        // 如果是401错误，说明token无效
        if (error.response?.status === 401) {
          console.log('🔐 认证失败，清除token并跳转到登录页');
          localStorage.removeItem('vue-authenticate.vueauth_access_token');
          this.$store.commit('auth/CLEAR_AUTH');
          this.$router.push({name: "Login"});
          return;
        }
        
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