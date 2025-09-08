<template>
  <div v-if="user" class="md-layout md-gutter" key="user-profile-content">
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



    async created() {
      await this.getProfile();
    },
    
  async mounted() {
    // 延迟初始化，确保DOM完全准备就绪
    await this.$nextTick();
  },
  
  beforeDestroy() {
    // 清理组件状态
    this.user = null;
  },

    methods: {
      async getProfile() {
        try {
          console.log('🔄 直接从后端API获取用户资料...');
          
          // 检查token状态
          const token = localStorage.getItem('vue-authenticate.vueauth_access_token');
          if (!token) {
            console.log('❌ 没有token，跳转到登录页');
            this.$router.push('/login');
            return;
          }
          
          // 直接调用后端API获取用户信息
          const response = await this.$http.get('admin/me');
          
          console.log('✅ 从后端获取用户资料成功:', response.data);
          
          if (response.data.success && response.data.data && response.data.data.admin) {
            // 直接使用后端返回的管理员数据
            this.user = response.data.data.admin;
            console.log('👤 管理员信息:', this.user.username, this.user.role);
          } else {
            console.error('❌ 后端返回数据格式错误:', response.data);
            throw new Error('用户数据格式错误');
          }
          
        } catch (error) {
          console.error('❌ 获取个人资料失败:', error);
          
          // 如果是401错误，说明token无效
          if (error.response?.status === 401) {
            console.log('🔐 认证失败，清除token并跳转到登录页');
            localStorage.removeItem('vue-authenticate.vueauth_access_token');
            this.$store.commit('auth/CLEAR_AUTH');
            this.$router.push('/login');
            return;
          }
          
          // 对于其他错误，显示提示
          this.$notify({
            message: `获取用户资料失败: ${error.message}`,
            horizontalAlign: 'right',
            verticalAlign: 'top',
            type: 'danger',
            timeout: 4000
          });
          
          // 如果错误严重，跳转到登录页
          if (error.response?.status >= 400) {
            this.$router.push('/login');
          }
        }
      }
    }
  }
</script>