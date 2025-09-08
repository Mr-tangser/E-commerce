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

    computed: {
      currentUser() {
        return this.$store.getters['auth/currentUser'];
      }
    },

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
        console.log('🔍 开始获取个人资料...');
        
        // 首先检查store中是否有用户信息
        const currentUser = this.$store.getters['auth/currentUser'];
        if (currentUser) {
          console.log('📋 使用store中的用户信息');
          this.user = currentUser;
          return;
        }
        
        // 检查token状态
        const token = localStorage.getItem('vue-authenticate.vueauth_access_token');
        console.log('Token状态:', !!token);
        
        if (!token) {
          console.log('❌ 没有token，跳转到登录页');
          this.$router.push({name: "Login"});
          return;
        }
        
        // 尝试从后端API获取最新的用户信息
        try {
          const response = await this.$http.get('http://localhost:3000/api/admin/profile');
          
          console.log('✅ 获取个人资料成功:', response.data);
          
          if (response.data.success) {
            this.user = response.data.data.admin;
            
            // 同时更新store中的用户信息
            this.$store.dispatch('auth/updateUserInfo', this.user);
          }
        } catch (apiError) {
          console.log('🔧 API不可用，使用默认测试数据');
          
          // 如果API不可用，使用默认用户数据
          const defaultUser = {
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
            isActive: true,
            loginCount: 36,
            twoFactorEnabled: false,
            sessionTimeout: 8,
            lastLogin: new Date(),
            phone: "16682296593"
          };
          
          this.user = defaultUser;
          this.$store.dispatch('auth/updateUserInfo', defaultUser);
          
          // 抛出API错误让外层catch处理
          throw apiError;
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
        
        // 对于其他错误（如网络错误），显示提示但不跳转
        this.$notify({
          message: 'API服务暂时不可用，正在使用本地数据',
          horizontalAlign: 'right',
          verticalAlign: 'top',
          type: 'warning',
          timeout: 3000
        });
      }
    }
    }
  }
</script>