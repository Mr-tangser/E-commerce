<template>
  <md-card class="md-card-profile">
    <div class="md-card-avatar">
      <img class="img" :src="userAvatar" @error="handleImageError"/>
      <md-button 
        class="md-fab md-mini md-success avatar-upload-btn"
        @click="triggerFileUpload"
        title="更换头像"
      >
        <md-icon>camera_alt</md-icon>
      </md-button>
      <input 
        ref="avatarInput"
        type="file" 
        accept="image/*" 
        @change="handleAvatarUpload"
        style="display: none;"
      />
    </div>
    <md-card-content>
      <h6 class="category text-gray">{{ user.role | roleText }}</h6>
      <h4 class="card-title">{{ user.fullName || user.username }}</h4>
      <p class="card-description">
        <strong>用户名:</strong> {{ user.username }}<br>
        <strong>邮箱:</strong> {{ user.email }}<br>
        <strong>部门:</strong> {{ user.department | departmentText }}<br>
        <strong>最后登录:</strong> {{ user.lastLogin | formatDate }}
      </p>
      <md-button 
        class="md-round md-info"
        @click="refreshProfile"
        :disabled="uploading"
      >
        {{ uploading ? '上传中...' : '刷新资料' }}
      </md-button>
    </md-card-content>
  </md-card>
</template>

<script>
  export default {
    name: "user-profile-card",
    props: {
      user: {
        type: Object,
        default: () => ({})
      }
    },
    data() {
      return {
        uploading: false,
        defaultAvatar: process.env.BASE_URL + "img/default.jpg"
      };
    },
    computed: {
      userAvatar() {
        if (this.user.avatar && this.user.avatar !== '/img/default.jpg') {
          return process.env.BASE_URL + this.user.avatar.replace(/^\//, '');
        }
        return this.defaultAvatar;
      }
    },
    filters: {
      roleText(role) {
        const roles = {
          'super_admin': '超级管理员',
          'admin': '管理员',
          'manager': '经理',
          'staff': '员工'
        };
        return roles[role] || role;
      },
      departmentText(department) {
        const departments = {
          'sales': '销售部',
          'marketing': '市场部',
          'customer_service': '客服部',
          'inventory': '仓储部',
          'finance': '财务部',
          'technical': '技术部'
        };
        return departments[department] || department;
      },
      formatDate(date) {
        if (!date) return '未知';
        return new Date(date).toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    },
    methods: {
      handleImageError() {
        // 如果头像加载失败，使用默认头像
        this.$forceUpdate();
      },
      triggerFileUpload() {
        this.$refs.avatarInput.click();
      },
      async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 检查文件类型
        if (!file.type.startsWith('image/')) {
          this.$notify({
            message: '请选择图片文件',
            horizontalAlign: 'right',
            verticalAlign: 'top',
            type: 'warning'
          });
          return;
        }

        // 检查文件大小 (5MB)
        if (file.size > 5 * 1024 * 1024) {
          this.$notify({
            message: '图片大小不能超过5MB',
            horizontalAlign: 'right',
            verticalAlign: 'top',
            type: 'warning'
          });
          return;
        }

        this.uploading = true;

        try {
          const formData = new FormData();
          formData.append('avatar', file);

          const response = await this.$http.post('http://localhost:3000/api/admin/upload-avatar', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          if (response.data.success) {
            this.$notify({
              message: '头像上传成功',
              horizontalAlign: 'right',
              verticalAlign: 'top',
              type: 'success'
            });
            
            // 更新用户信息
            this.$emit('profile-updated', response.data.data.admin);
            
            // 刷新页面数据
            this.$parent.getProfile();
          }
        } catch (error) {
          console.error('头像上传失败:', error);
          this.$notify({
            message: error.response?.data?.error?.message || '头像上传失败',
            horizontalAlign: 'right',
            verticalAlign: 'top',
            type: 'danger'
          });
        } finally {
          this.uploading = false;
          // 清空文件输入
          this.$refs.avatarInput.value = '';
        }
      },
      refreshProfile() {
        this.$parent.getProfile();
      },
      goToProfile() {
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
      }
    }
  };
</script>

<style scoped>
.md-card-avatar {
  position: relative;
}

.avatar-upload-btn {
  position: absolute;
  bottom: -10px;
  right: -10px;
  z-index: 2;
}

.img {
  width: 130px;
  height: 130px;
  object-fit: cover;
  cursor: pointer;
  transition: all 0.3s ease;
}

.img:hover {
  opacity: 0.8;
}

.card-description {
  line-height: 1.6;
}

.card-description strong {
  color: #333;
}
</style>
