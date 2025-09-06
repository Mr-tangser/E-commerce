<template>
  <form @submit.prevent="updateProfile">
    <md-card>
      <md-card-header class="md-card-header-icon">
        <div class="card-icon">
          <md-icon>perm_identity</md-icon>
        </div>
        <h4 class="title">
          编辑资料
        </h4>
      </md-card-header>

      <md-card-content>
        <div class="md-layout">
          <label class="md-layout-item md-size-15 md-form-label">
            用户名
          </label>
          <div class="md-layout-item">
            <md-field>
              <md-input v-model="user.username" :readonly="true" placeholder="用户名不可修改" />
            </md-field>
          </div>
        </div>

        <div class="md-layout">
          <label class="md-layout-item md-size-15 md-form-label">
            姓名
          </label>
          <div class="md-layout-item">
            <md-field :class="{'md-invalid': apiValidationErrors.firstName}">
              <md-input v-model="editForm.firstName" placeholder="请输入姓名" />
              <validation-error :errors="apiValidationErrors.firstName" />
            </md-field>
          </div>
        </div>

        <div class="md-layout">
          <label class="md-layout-item md-size-15 md-form-label">
            姓氏
          </label>
          <div class="md-layout-item">
            <md-field :class="{'md-invalid': apiValidationErrors.lastName}">
              <md-input v-model="editForm.lastName" placeholder="请输入姓氏" />
              <validation-error :errors="apiValidationErrors.lastName" />
            </md-field>
          </div>
        </div>

        <div class="md-layout">
          <label class="md-layout-item md-size-15 md-form-label">
            邮箱
          </label>
          <div class="md-layout-item">
            <md-field :class="{'md-invalid': apiValidationErrors.email}">
              <md-input v-model="editForm.email" type="email" placeholder="请输入邮箱" />
              <validation-error :errors="apiValidationErrors.email" />
            </md-field>
            <small class="text-muted">修改邮箱可能影响登录，请谨慎操作</small>
          </div>
        </div>

        <div class="md-layout">
          <label class="md-layout-item md-size-15 md-form-label">
            手机号
          </label>
          <div class="md-layout-item">
            <md-field :class="{'md-invalid': apiValidationErrors.phone}">
              <md-input v-model="editForm.phone" placeholder="请输入手机号" />
              <validation-error :errors="apiValidationErrors.phone" />
            </md-field>
          </div>
        </div>
      </md-card-content>

      <md-card-actions>
        <md-button type="submit" class="md-primary" :disabled="updating">
          {{ updating ? '更新中...' : '更新资料' }}
        </md-button>
      </md-card-actions>
    </md-card>
  </form>
</template>
<script>
import { ValidationError } from "@/components";
import formMixin from "@/mixins/form-mixin";

export default {
  name: "edit-profile-card",

  props: {
    user: {
      type: Object,
      default: () => ({})
    }
  },

  components: { ValidationError },

  mixins: [formMixin],

  data() {
    return {
      updating: false,
      editForm: {
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      }
    };
  },

  watch: {
    user: {
      handler(newUser) {
        if (newUser) {
          this.editForm = {
            firstName: newUser.firstName || '',
            lastName: newUser.lastName || '',
            email: newUser.email || '',
            phone: newUser.phone || ''
          };
        }
      },
      immediate: true,
      deep: true
    }
  },

  methods: {
    async updateProfile() {
      this.updating = true;
      this.clearApiValidation();

      try {
        const response = await this.$http.put('http://localhost:3000/api/admin/profile', this.editForm);
        
        if (response.data.success) {
          this.$notify({
            message: '资料更新成功',
            horizontalAlign: 'right',
            verticalAlign: 'top',
            type: 'success'
          });
          
          // 通知父组件刷新数据
          this.$emit('profile-updated', response.data.data.admin);
          
          // 更新store中的用户信息
          this.$store.dispatch('auth/updateUserInfo', response.data.data.admin);
          
          this.$parent.getProfile();
        }
      } catch (error) {
        console.error('更新资料失败:', error);
        
        if (error.response?.data?.error?.details) {
          // 处理验证错误
          const validationErrors = {};
          error.response.data.error.details.forEach(detail => {
            const field = detail.param;
            if (!validationErrors[field]) {
              validationErrors[field] = [];
            }
            validationErrors[field].push(detail.msg);
          });
          this.setApiValidation(validationErrors);
        } else {
          this.$notify({
            message: error.response?.data?.error?.message || '更新资料失败',
            horizontalAlign: 'right',
            verticalAlign: 'top',
            type: 'danger'
          });
        }
      } finally {
        this.updating = false;
      }
    }
  }
};
</script>

<style></style>
