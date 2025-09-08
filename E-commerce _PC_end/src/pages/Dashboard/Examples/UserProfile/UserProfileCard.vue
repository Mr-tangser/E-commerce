<template>
  <div class="profile-card-container">
    <md-card class="md-card-profile">
      <div class="md-card-avatar">
        <div class="avatar-container" @click="triggerFileUpload" title="点击更换头像">
          <img class="img" :src="userAvatar" @error="handleImageError"/>
          <div class="avatar-overlay">
            <div class="overlay-content">
              <md-icon class="camera-icon">photo_camera</md-icon>
              <span class="upload-text">点击更换</span>
            </div>
          </div>
        </div>
        <input 
          ref="avatarInput"
          type="file" 
          accept="image/*" 
          @change="handleAvatarUpload"
          style="display: none;"
        />
      </div>
      <md-card-content>
        <h6 class="category text-gray">{{ safeUser.role | roleText }}</h6>
        <h4 class="card-title">{{ safeUser.fullName }}</h4>
        <p class="card-description">
          <strong>用户名:</strong> {{ safeUser.username }}<br>
          <strong>邮箱:</strong> {{ safeUser.email }}<br>
          <strong>部门:</strong> {{ safeUser.department | departmentText }}<br>
          <strong>手机号:</strong> {{ safeUser.phone }}<br>
          <strong>登录次数:</strong> {{ safeUser.loginCount }} 次<br>
          <strong>账户状态:</strong> {{ safeUser.isActive ? '正常' : '已禁用' }}<br>
          <strong>最后登录:</strong> {{ safeUser.lastLogin | formatDate }}
        </p>
        <div class="action-buttons">
          <md-button 
            class="md-round md-info"
            @click="refreshProfile"
            :disabled="uploading"
          >
            {{ uploading ? '上传中...' : '刷新资料' }}
          </md-button>
          <md-button 
            class="md-round md-danger"
            @click="handleLogout"
            :disabled="uploading"
            title="退出登录"
          >
            <md-icon>exit_to_app</md-icon>
            退出登录
          </md-button>
        </div>
      </md-card-content>
    </md-card>
    
    <!-- 退出登录确认对话框 -->
    <md-dialog :md-active.sync="showLogoutDialog" md-backdrop="false">
      <md-dialog-title>确认退出登录</md-dialog-title>
      <md-dialog-content>
        <div class="logout-dialog-content">
          <md-icon class="logout-icon">exit_to_app</md-icon>
          <p class="logout-message">您确定要退出登录吗？</p>
          <p class="logout-hint">退出后需要重新登录才能访问系统</p>
        </div>
      </md-dialog-content>
      <md-dialog-actions>
        <md-button class="md-primary" @click="cancelLogout">取消</md-button>
        <md-button class="md-accent" @click="confirmLogout">确定退出</md-button>
      </md-dialog-actions>
    </md-dialog>
  </div>
</template>

<script>
  export default {
    name: "user-profile-card",
    props: {
      user: {
        type: Object,
        default: () => ({
          username: '加载中...',
          email: '',
          role: 'staff',
          department: 'technical',
          phone: '',
          loginCount: 0,
          isActive: true,
          lastLogin: null
        })
      }
    },
    data() {
      return {
        uploading: false,
        showLogoutDialog: false,
        defaultAvatar: process.env.BASE_URL + "img/default.jpg"
      };
    },
    
    mounted() {
      console.log('🎯 UserProfileCard 组件已挂载');
      console.log('📁 文件输入元素状态:', this.$refs.avatarInput ? '✅ 已找到' : '❌ 未找到');
    },
    computed: {
      userAvatar() {
        if (!this.user) return this.defaultAvatar;
        
        if (this.user.avatar && this.user.avatar !== '/img/default.jpg') {
          // 如果头像路径已经是完整URL，直接使用
          if (this.user.avatar.startsWith('http')) {
            return this.user.avatar;
          }
          // 否则构建本地路径
          const avatarPath = this.user.avatar.startsWith('/') ? this.user.avatar : '/' + this.user.avatar;
          return process.env.BASE_URL + avatarPath.replace(/^\//, '');
        }
        return this.defaultAvatar;
      },
      
      safeUser() {
        // 确保用户对象的所有属性都有安全的默认值
        return {
          username: this.user?.username || '未知用户',
          email: this.user?.email || '',
          role: this.user?.role || 'staff',
          department: this.user?.department || 'technical',
          phone: this.user?.phone || '未设置',
          loginCount: this.user?.loginCount || 0,
          isActive: this.user?.isActive !== undefined ? this.user.isActive : true,
          lastLogin: this.user?.lastLogin || null,
          fullName: this.user?.fullName || (this.user?.firstName && this.user?.lastName 
            ? `${this.user.firstName} ${this.user.lastName}` 
            : this.user?.username || '未知用户'),
          ...this.user
        };
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
        console.log('🖼️ 触发文件上传...');
        
        if (this.$refs.avatarInput) {
          console.log('✅ 找到文件输入元素，触发点击');
          this.$refs.avatarInput.click();
        } else {
          console.error('❌ 未找到文件输入元素');
          this.$notify({
            message: '文件选择器初始化失败，请刷新页面重试',
            horizontalAlign: 'right',
            verticalAlign: 'top',
            type: 'danger',
            timeout: 5000  // 错误信息显示5秒
          });
        }
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
            type: 'warning',
            timeout: 4000  // 警告信息显示4秒
          });
          return;
        }

        // 检查文件大小 (5MB)
        if (file.size > 5 * 1024 * 1024) {
          this.$notify({
            message: '图片大小不能超过5MB',
            horizontalAlign: 'right',
            verticalAlign: 'top',
            type: 'warning',
            timeout: 4000  // 警告信息显示4秒
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
              type: 'success',
              timeout: 3000  // 成功信息显示3秒
            });
            
            // 更新store中的用户信息，确保全局头像同步
            this.$store.dispatch('auth/updateUserInfo', response.data.data.admin);
            
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
            type: 'danger',
            timeout: 5000  // 错误信息显示5秒
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
      
      handleLogout() {
        // 显示确认对话框
        this.showLogoutDialog = true;
      },
      
      async confirmLogout() {
        try {
          this.showLogoutDialog = false;
          console.log('🚪 用户退出登录...');
          
          // 调用store的logout action
          await this.$store.dispatch('auth/logout');
          
          // 显示退出成功提示
          this.$notify({
            message: '已安全退出登录',
            horizontalAlign: 'right',
            verticalAlign: 'top',
            type: 'success',
            timeout: 3000  // 3秒后自动消失
          });
          
        } catch (error) {
          console.error('❌ 退出登录失败:', error);
          
          // 即使出错也强制清除本地状态并跳转
          localStorage.removeItem('vue-authenticate.vueauth_access_token');
          localStorage.removeItem('admin_info');
          this.$store.commit('auth/CLEAR_AUTH');
          
          this.$notify({
            message: '退出登录时出现错误，但已清除本地数据',
            horizontalAlign: 'right',
            verticalAlign: 'top',
            type: 'warning',
            timeout: 6000  // 重要警告信息显示6秒
          });
          
          // 跳转到登录页
          this.$router.push({ name: "Login" });
        }
      },
      
      cancelLogout() {
        this.showLogoutDialog = false;
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

.avatar-container {
  position: relative;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar-container:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.avatar-container:active {
  transform: scale(0.98);
}

.img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

.avatar-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
  box-sizing: border-box;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.camera-icon {
  color: white !important;
  font-size: 26px !important;
  line-height: 1;
  margin: 0;
  padding: 0;
}

.upload-text {
  color: white;
  font-size: 10px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  line-height: 1;
  margin: 0;
  padding: 0;
  letter-spacing: 0.3px;
}

.card-description {
  line-height: 1.6;
}

.card-description strong {
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 15px;
}

.action-buttons .md-button {
  margin: 0;
  min-width: 120px;
  font-size: 14px;
}

.action-buttons .md-button .md-icon {
  font-size: 16px !important;
  margin-right: 4px;
}

/* 退出登录对话框样式 */
.logout-dialog-content {
  text-align: center;
  padding: 20px 10px;
}

.logout-icon {
  font-size: 48px !important;
  color: #ff5722 !important;
  margin-bottom: 16px;
}

.logout-message {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin: 16px 0 8px 0;
}

.logout-hint {
  font-size: 14px;
  color: #666;
  margin: 8px 0 20px 0;
  line-height: 1.4;
}

.md-dialog .md-dialog-title {
  color: #333;
  font-weight: 600;
}

.md-dialog .md-dialog-actions {
  padding: 16px 24px;
  justify-content: flex-end;
  gap: 12px;
}

.md-dialog .md-dialog-actions .md-button {
  min-width: 80px;
  margin: 0;
}

.md-dialog .md-dialog-actions .md-button.md-accent {
  background-color: #ff5722 !important;
  color: white !important;
}

.md-dialog .md-dialog-actions .md-button.md-accent:hover {
  background-color: #e64a19 !important;
}
</style>
