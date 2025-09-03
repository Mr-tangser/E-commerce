<template>
  <view class="page">
    <!-- Logo区域 -->
    <view class="logo">
      <image src="../../static/logo.png" mode="aspectFit"></image>
      <text class="app-name">用户注册</text>
    </view>

    <!-- 表单输入区域 -->
    <view class="form-container">
      <!-- 用户名输入 -->
      <view class="input-group">
        <text class="iconfont icon-user input-icon"></text>
        <input 
          type="text" 
          v-model="form.username" 
          maxlength="20" 
          placeholder="请输入用户名（3-20个字符）"
          class="form-input"
        >
      </view>

      <!-- 邮箱输入 -->
      <view class="input-group">
        <text class="iconfont icon-email input-icon"></text>
        <input 
          type="text" 
          v-model="form.email" 
          placeholder="请输入邮箱地址"
          class="form-input"
        >
      </view>

      <!-- 手机号输入 -->
      <view class="input-group">
        <text class="iconfont icon-phone input-icon"></text>
        <input 
          type="tel" 
          v-model="form.phone" 
          maxlength="11" 
          placeholder="请输入手机号"
          class="form-input"
        >
      </view>

      <!-- 验证码输入 -->
      <view class="input-group">
        <text class="iconfont icon-code input-icon"></text>
        <input 
          type="number" 
          v-model="form.code" 
          maxlength="6" 
          placeholder="请输入验证码"
          class="form-input"
        >
        <view class="code-btn" @click="sendCode" :class="{ disabled: codeCountdown > 0 }">
          {{ codeCountdown > 0 ? `${codeCountdown}s后重试` : '获取验证码' }}
        </view>
      </view>

      <!-- 密码输入 -->
      <view class="input-group">
        <text class="iconfont icon-lock input-icon"></text>
        <input 
          :password="!showPassword" 
          v-model="form.password" 
          maxlength="26" 
          placeholder="请输入密码（至少6个字符）"
          class="form-input"
        >
        <text 
          class="iconfont password-toggle" 
          :class="showPassword ? 'icon-eye-on' : 'icon-eye-off'" 
          @click="showPassword = !showPassword"
        ></text>
      </view>

      <!-- 确认密码输入 -->
      <view class="input-group">
        <text class="iconfont icon-lock input-icon"></text>
        <input 
          :password="!showConfirmPassword" 
          v-model="form.confirmPassword" 
          maxlength="26" 
          placeholder="请再次输入密码"
          class="form-input"
        >
        <text 
          class="iconfont password-toggle" 
          :class="showConfirmPassword ? 'icon-eye-on' : 'icon-eye-off'" 
          @click="showConfirmPassword = !showConfirmPassword"
        ></text>
      </view>
    </view>

    <!-- 协议条款 -->
    <view class="agreement">
      <view class="agreement-check" @click="agreeTerms = !agreeTerms">
        <text class="checkbox" :class="{ checked: agreeTerms }">{{ agreeTerms ? '✓' : '' }}</text>
        <text class="agreement-text">
          我已阅读并同意
          <text class="link-text" @click="showPrivacy">《用户协议》</text>
          和
          <text class="link-text" @click="showTerms">《隐私政策》</text>
        </text>
      </view>
    </view>

    <!-- 注册按钮 -->
    <view class="btn-container">
      <button 
        class="register-btn" 
        :class="{ active: canRegister }" 
        @click="handleRegister"
        :disabled="!canRegister"
      >
        注册
      </button>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions">
      <text @click="goToLogin">已有账号？立即登录</text>
    </view>

    <!-- 加载遮罩 -->
    <view class="loading-mask" v-if="loading">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">{{ loadingText }}</text>
      </view>
    </view>
  </view>
</template>

<script>
// 导入API工具
import api from '@/utils/api.js'

export default {
  data() {
    return {
      // 是否显示密码
      showPassword: false,
      showConfirmPassword: false,
      // 验证码倒计时
      codeCountdown: 0,
      // 是否同意协议
      agreeTerms: false,
      // 加载状态
      loading: false,
      loadingText: '注册中...',
      
      // 表单数据
      form: {
        username: '',
        email: '',
        phone: '',
        code: '',
        password: '',
        confirmPassword: ''
      }
    };
  },
  
  computed: {
    /**
     * 是否可以注册
     */
    canRegister() {
      return (
        this.form.username && 
        this.form.email && 
        this.form.phone && 
        this.form.code && 
        this.form.password && 
        this.form.confirmPassword &&
        this.form.password === this.form.confirmPassword &&
        this.agreeTerms
      );
    }
  },
  
  methods: {
    /**
     * 发送验证码
     */
    async sendCode() {
      if (this.codeCountdown > 0 || !this.form.phone) return;
      
      if (!this.validatePhone(this.form.phone)) {
        uni.showToast({
          title: '请输入正确的手机号',
          icon: 'none'
        });
        return;
      }
      
      try {
        this.loading = true;
        this.loadingText = '发送验证码中...';
        
        // 调用发送验证码API
        const response = await api.user.sendCode(this.form.phone, 'register');
        
        if (response.success) {
          uni.showToast({
            title: '验证码已发送',
            icon: 'success'
          });
          this.startCountdown();
        } else {
          throw new Error(response.error?.message || '发送失败');
        }
      } catch (error) {
        console.error('发送验证码失败:', error);
        api.handleError(error, '发送验证码失败');
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 开始倒计时
     */
    startCountdown() {
      this.codeCountdown = 60;
      const timer = setInterval(() => {
        this.codeCountdown--;
        if (this.codeCountdown <= 0) {
          clearInterval(timer);
        }
      }, 1000);
    },
    
    /**
     * 处理注册
     */
    async handleRegister() {
      if (!this.canRegister) return;
      
      try {
        // 验证表单
        if (!this.validateForm()) {
          return;
        }
        
        this.loading = true;
        this.loadingText = '注册中...';
        
        // 构建注册数据
        const registerData = {
          username: this.form.username.trim(),
          email: this.form.email.trim().toLowerCase(),
          phone: this.form.phone.trim(),
          password: this.form.password
        };
        
        // 调用注册API
        const response = await api.user.register(registerData);
        
        if (response.success) {
          uni.showToast({
            title: '注册成功',
            icon: 'success'
          });
          
          // 延迟跳转到登录页面
          setTimeout(() => {
            uni.redirectTo({
              url: '/pages/login/login?fromRegister=true'
            });
          }, 1500);
        } else {
          throw new Error(response.error?.message || '注册失败');
        }
        
      } catch (error) {
        console.error('注册失败:', error);
        api.handleError(error, '注册失败');
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 验证表单
     */
    validateForm() {
      // 验证用户名
      if (!this.form.username.trim()) {
        uni.showToast({
          title: '请输入用户名',
          icon: 'none'
        });
        return false;
      }
      
      if (this.form.username.trim().length < 3 || this.form.username.trim().length > 20) {
        uni.showToast({
          title: '用户名长度必须在3-20个字符之间',
          icon: 'none'
        });
        return false;
      }
      
      // 验证邮箱
      if (!this.validateEmail(this.form.email)) {
        uni.showToast({
          title: '请输入正确的邮箱地址',
          icon: 'none'
        });
        return false;
      }
      
      // 验证手机号
      if (!this.validatePhone(this.form.phone)) {
        uni.showToast({
          title: '请输入正确的手机号',
          icon: 'none'
        });
        return false;
      }
      
      // 验证验证码
      if (!this.form.code || this.form.code.length < 4) {
        uni.showToast({
          title: '请输入正确的验证码',
          icon: 'none'
        });
        return false;
      }
      
      // 验证密码
      if (!this.form.password || this.form.password.length < 6) {
        uni.showToast({
          title: '密码至少6个字符',
          icon: 'none'
        });
        return false;
      }
      
      // 验证确认密码
      if (this.form.password !== this.form.confirmPassword) {
        uni.showToast({
          title: '两次输入的密码不一致',
          icon: 'none'
        });
        return false;
      }
      
      // 验证协议同意
      if (!this.agreeTerms) {
        uni.showToast({
          title: '请阅读并同意用户协议',
          icon: 'none'
        });
        return false;
      }
      
      return true;
    },
    
    /**
     * 验证手机号格式
     */
    validatePhone(phone) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      return phoneRegex.test(phone);
    },
    
    /**
     * 验证邮箱格式
     */
    validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    
    /**
     * 跳转到登录页面
     */
    goToLogin() {
      uni.redirectTo({
        url: '/pages/login/login'
      });
    },
    
    /**
     * 显示用户协议
     */
    showTerms() {
      uni.showModal({
        title: '用户协议',
        content: '这里是用户协议的内容...',
        showCancel: false
      });
    },
    
    /**
     * 显示隐私政策
     */
    showPrivacy() {
      uni.showModal({
        title: '隐私政策',
        content: '这里是隐私政策的内容...',
        showCancel: false
      });
    }
  }
}
</script>

<style scoped lang="scss">
@import 'register.scss';
</style>