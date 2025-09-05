<template>
  <form ref="password_form" @submit.prevent="changePassword">

    <md-card>

      <md-card-header class="md-card-header-icon">
        <div class="card-icon">
          <md-icon>lock</md-icon>
        </div>
        <h4 class="title">
          修改密码
        </h4>
      </md-card-header>

      <md-card-content>
        <div class="md-layout">
          <div class="md-layout-item md-size-100">
            <md-field :class="{'md-invalid': apiValidationErrors.currentPassword}">
              <label>当前密码</label>
              <md-input v-model="currentPassword" type="password" placeholder="请输入当前密码"/>
              <validation-error :errors="apiValidationErrors.currentPassword"/>
            </md-field>
            <md-field :class="{'md-invalid': apiValidationErrors.newPassword}">
              <label>新密码</label>
              <md-input v-model="newPassword" type="password" placeholder="请输入新密码"/>
              <validation-error :errors="apiValidationErrors.newPassword"/>
            </md-field>
            <md-field :class="{'md-invalid': apiValidationErrors.confirmPassword}">
              <label>确认新密码</label>
              <md-input v-model="confirmPassword" type="password" placeholder="请再次输入新密码"/>
              <validation-error :errors="apiValidationErrors.confirmPassword"/>
            </md-field>
          </div>
        </div>
      </md-card-content>

      <md-card-actions>
        <md-button type="submit" class="md-primary" :disabled="updating">
          {{ updating ? '更新中...' : '修改密码' }}
        </md-button>
      </md-card-actions>
    </md-card>

  </form>
</template>

<script>
  import {ValidationError} from "@/components";
  import formMixin from "@/mixins/form-mixin";
  export default {
    name: "edit-password-card",

    props: {
      user: {
        type: Object,
        default: () => ({})
      }
    },

    components: {ValidationError},

    mixins: [formMixin],

    data() {
      return {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        updating: false
      };
    },

    methods: {
      async changePassword() {
        this.updating = true;
        this.clearApiValidation();

        // 前端验证
        if (!this.validateForm()) {
          this.updating = false;
          return;
        }

        try {
          const response = await this.$http.put('http://localhost:3000/api/admin/change-password', {
            currentPassword: this.currentPassword,
            newPassword: this.newPassword,
            confirmPassword: this.confirmPassword
          });

          if (response.data.success) {
            this.$notify({
              message: '密码修改成功',
              horizontalAlign: 'right',
              verticalAlign: 'top',
              type: 'success'
            });

            // 清空表单
            this.currentPassword = '';
            this.newPassword = '';
            this.confirmPassword = '';
          }
        } catch (error) {
          console.error('密码修改失败:', error);
          
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
              message: error.response?.data?.error?.message || '密码修改失败',
              horizontalAlign: 'right',
              verticalAlign: 'top',
              type: 'danger'
            });
          }
        } finally {
          this.updating = false;
        }
      },

      validateForm() {
        if (!this.currentPassword) {
          this.$notify({
            message: '请输入当前密码',
            horizontalAlign: 'right',
            verticalAlign: 'top',
            type: 'warning'
          });
          return false;
        }

        if (!this.newPassword) {
          this.$notify({
            message: '请输入新密码',
            horizontalAlign: 'right',
            verticalAlign: 'top',
            type: 'warning'
          });
          return false;
        }

        if (this.newPassword.length < 6) {
          this.$notify({
            message: '新密码长度不能少于6位',
            horizontalAlign: 'right',
            verticalAlign: 'top',
            type: 'warning'
          });
          return false;
        }

        if (this.newPassword !== this.confirmPassword) {
          this.$notify({
            message: '两次输入的密码不一致',
            horizontalAlign: 'right',
            verticalAlign: 'top',
            type: 'warning'
          });
          return false;
        }

        return true;
      }
    }
  };
</script>
