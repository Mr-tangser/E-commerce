<template>
  <view class="page">
    <!-- Logo区域 -->
    <view class="logo">
      <image src="../../static/logo.png" mode="aspectFit"></image>
      <text class="app-name">电商平台</text>
    </view>
    
    <!-- 登录方式切换 -->
    <view class="login-type-tabs">
      <view 
        class="tab-item" 
        :class="{ active: loginType === 'phone' }" 
        @click="switchLoginType('phone')"
      >
        手机登录
      </view>
      <view 
        class="tab-item" 
        :class="{ active: loginType === 'email' }" 
        @click="switchLoginType('email')"
      >
        邮箱登录
      </view>
    </view>

    <!-- 表单输入区域 -->
    <view class="form-container">
      <!-- 手机号登录 -->
      <view v-if="loginType === 'phone'" class="form-section">
        <view class="input-group">
          <text class="iconfont icon-phone input-icon"></text>
          <input 
            type="tel" 
            maxlength="11" 
            v-model="form.phone" 
            placeholder="请输入手机号"
            class="form-input"
          >
        </view>
        
        <!-- 手机号验证码登录 -->
        <view v-if="phoneLoginWay === 'code'" class="input-group">
          <text class="iconfont icon-code input-icon"></text>
          <input 
            type="number" 
            maxlength="6" 
            v-model="form.code" 
            placeholder="请输入验证码"
            class="form-input"
          >
          <view class="code-btn" @click="sendCode" :class="{ disabled: codeCountdown > 0 }">
            {{ codeCountdown > 0 ? `${codeCountdown}s后重试` : '获取验证码' }}
          </view>
        </view>
        
        <!-- 手机号密码登录 -->
        <view v-if="phoneLoginWay === 'password'" class="input-group">
          <text class="iconfont icon-lock input-icon"></text>
          <input 
            :password="!showPassword" 
            v-model="form.password" 
            maxlength="26" 
            placeholder="请输入密码"
            class="form-input"
          >
          <text 
            class="iconfont password-toggle" 
            :class="showPassword ? 'icon-eye-on' : 'icon-eye-off'" 
            @click="showPassword = !showPassword"
          ></text>
        </view>
        
        <!-- 手机登录方式切换 -->
        <view class="login-switch">
          <text @click="switchPhoneLoginWay">
            {{ phoneLoginWay === 'code' ? '使用密码登录' : '使用验证码登录' }}
          </text>
        </view>
      </view>

      <!-- 邮箱登录 -->
      <view v-if="loginType === 'email'" class="form-section">
        <view class="input-group">
          <text class="iconfont icon-email input-icon"></text>
          <input 
            type="text" 
            v-model="form.email" 
            placeholder="请输入邮箱地址"
            class="form-input"
          >
        </view>
        
        <view class="input-group">
          <text class="iconfont icon-lock input-icon"></text>
          <input 
            :password="!showPassword" 
            v-model="form.emailPassword" 
            maxlength="26" 
            placeholder="请输入密码"
            class="form-input"
          >
          <text 
            class="iconfont password-toggle" 
            :class="showPassword ? 'icon-eye-on' : 'icon-eye-off'" 
            @click="showPassword = !showPassword"
          ></text>
        </view>
      </view>
    </view>

    <!-- 登录按钮 -->
    <view class="btn-container">
      <button 
        class="login-btn" 
        :class="{ active: canLogin }" 
        @click="handleLogin"
        :disabled="!canLogin"
      >
        登录
      </button>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions">
      <text @click="goToRegister">新用户注册</text>
      <text @click="goToForgetPassword">忘记密码</text>
    </view>

    <!-- 快速登录方式 -->
    <view class="quick-login-section">
      <view class="quick-login-title">快速登录</view>
      <view class="quick-login-buttons">
        <!-- 指纹识别 -->
        <view 
          class="quick-login-btn" 
          @click="fingerprintLogin"
          v-if="supportFingerprint"
        >
          <text class="login-icon fingerprint-icon">🔐</text>
          <text class="btn-text">指纹登录</text>
        </view>
        
        <!-- 人脸识别 -->
        <view 
          class="quick-login-btn" 
          @click="faceLogin"
          v-if="supportFaceID"
        >
          <text class="login-icon face-icon">😊</text>
          <text class="btn-text">人脸登录</text>
        </view>
        
        <!-- 微信登录 -->
        <view class="quick-login-btn" @click="wechatLogin">
          <image src="/static/wx_ico.png" class="quick-login-icon"></image>
          <text class="btn-text">微信登录</text>
        </view>
      </view>
    </view>

    <!-- 加载遮罩 -->
    <view class="loading-mask" v-if="loading">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">{{ loadingText }}</text>
      </view>
    </view>
    
    <!-- 人脸识别组件 -->
    <FaceRecognition 
      :visible="showFaceRecognition"
      :type="faceRecognitionType"
      :userId="selectedUserId"
      @success="handleFaceRecognitionSuccess"
      @close="closeFaceRecognition"
    />
  </view>
</template>

<script>
// 导入工具类
import BiometricAuth from '@/utils/biometricAuth.js'
import WechatAuth from '@/utils/wechatAuth.js'
import api from '@/utils/api.js'
import FaceRecognition from '@/components/FaceRecognition/FaceRecognition.vue'

export default {
  components: {
    FaceRecognition
  },
  
  data() {
    return {
      // 登录类型：phone(手机) / email(邮箱)
      loginType: 'phone',
      // 手机登录方式：code(验证码) / password(密码) - 默认密码登录更常用
      phoneLoginWay: 'password',
      // 是否显示密码
      showPassword: false,
      // 验证码倒计时
      codeCountdown: 0,
      // 加载状态
      loading: false,
      loadingText: '登录中...',
      
      // 生物识别支持状态
      supportBiometric: true,    // 临时设为true，让按钮显示
      supportFingerprint: true,  // 临时设为true，让指纹按钮显示
      supportFaceID: true,       // 临时设为true，让人脸按钮显示
      
      // 表单数据
      form: {
        phone: '',
        code: '',
        password: '',
        email: '',
        emailPassword: ''
      },
      
      // 人脸识别相关
      showFaceRecognition: false,
      faceRecognitionType: 'login',
      selectedUserId: '',
      lastLoginUsers: [] // 保存最近登录过的用户，用于人脸识别选择
    };
  },
  
  computed: {
    /**
     * 是否可以登录
     */
    canLogin() {
      if (this.loginType === 'phone') {
        if (this.phoneLoginWay === 'code') {
          return this.form.phone && this.form.code;
        } else {
          return this.form.phone && this.form.password;
        }
      } else if (this.loginType === 'email') {
        return this.form.email && this.form.emailPassword;
      }
      return false;
    }
  },
  
  async mounted() {
    // 检查生物识别支持
    await this.checkBiometricSupport();
    // 加载最近登录的用户
    this.loadLastLoginUsers();
  },
  
  methods: {
    /**
     * 切换登录类型
     */
    switchLoginType(type) {
      this.loginType = type;
      this.clearForm();
    },
    
    /**
     * 切换手机登录方式
     */
    switchPhoneLoginWay() {
      this.phoneLoginWay = this.phoneLoginWay === 'code' ? 'password' : 'code';
      this.form.code = '';
      this.form.password = '';
    },
    
    /**
     * 清空表单
     */
    clearForm() {
      this.form = {
        phone: '',
        code: '',
        password: '',
        email: '',
        emailPassword: ''
      };
    },
    
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
        const response = await api.user.sendCode(this.form.phone, 'login');
        
        if (response.success) {
          uni.showToast({
            title: '验证码已发送',
            icon: 'success'
          });
          this.startCountdown();
          
          // 开发环境下显示验证码（仅用于测试）
          if (response.data && response.data.code) {
            console.log('验证码:', response.data.code);
            // 可以在开发环境下自动填入验证码进行测试
            // this.form.code = response.data.code;
          }
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
     * 处理登录
     */
    async handleLogin() {
      if (!this.canLogin) return;
      
      try {
        this.loading = true;
        this.loadingText = '登录中...';
        
        let response;
        
        if (this.loginType === 'phone') {
          if (this.phoneLoginWay === 'code') {
            // 手机验证码登录
            response = await api.user.loginByPhone(this.form.phone, this.form.code);
          } else {
            // 手机密码登录
            response = await api.user.loginByPhonePassword(this.form.phone, this.form.password);
          }
        } else {
          // 邮箱登录
          response = await api.user.login(this.form.email, this.form.emailPassword);
        }
        
        if (response.success) {
          // 保存登录信息
          uni.setStorageSync('token', response.data.token);
          uni.setStorageSync('userInfo', response.data.user);
          
          // 更新最近登录用户记录
          this.updateLastLoginUser(response.data.user);
          
          uni.showToast({
            title: '登录成功',
            icon: 'success'
          });
          
          // 登录成功直接跳转到首页
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/home/home'
            });
          }, 1500);
        } else {
          throw new Error(response.error?.message || '登录失败');
        }
      } catch (error) {
        console.error('登录失败:', error);
        api.handleError(error, '登录失败');
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 微信登录
     */
    async wechatLogin() {
      try {
        this.loading = true;
        this.loadingText = '微信授权中...';
        
        const result = await WechatAuth.login();
        
        if (result.success) {
          // 调用后端微信登录接口
          const wechatResponse = await api.user.wechatLogin(
            result.code,
            result.phoneNumber, // 从微信获取的手机号
            result.encryptedData,
            result.iv
          );
          
          if (wechatResponse.success) {
            // 保存登录信息
            uni.setStorageSync('token', wechatResponse.data.token);
            uni.setStorageSync('userInfo', wechatResponse.data.user);
            
            // 更新最近登录用户记录
            this.updateLastLoginUser(wechatResponse.data.user);
          
            uni.showToast({
              title: '登录成功',
              icon: 'success'
            });
          
            // 登录成功直接跳转到首页
            setTimeout(() => {
              uni.switchTab({
                url: '/pages/home/home'
              });
            }, 1500);
          }
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '微信登录失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 指纹登录
     */
    async fingerprintLogin() {
      try {
        this.loading = true;
        this.loadingText = '指纹识别中...';
        
        // 检查是否有生物识别工具类
        if (typeof BiometricAuth === 'undefined') {
          // 演示模式：模拟指纹识别过程
          setTimeout(async () => {
            uni.showToast({
              title: '指纹识别成功（演示模式）',
              icon: 'success'
            });
            this.loading = false;
            // 可以在这里添加演示登录逻辑
          }, 2000);
          return;
        }
        
        const result = await BiometricAuth.authenticateWithFingerprint();
        
        if (result.success) {
          await this.biometricLoginSuccess();
        } else {
          uni.showToast({
            title: result.message || '指纹识别失败',
            icon: 'none'
          });
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '指纹识别失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 人脸识别登录
     */
    async faceLogin() {
      try {
        // 检查是否有最近登录的用户
        if (this.lastLoginUsers.length === 0) {
          uni.showModal({
            title: '提示',
            content: '暂无可用的人脸登录账户，请先使用其他方式登录并注册人脸信息',
            showCancel: false
          });
          return;
        }
        
        // 如果只有一个用户，直接使用
        if (this.lastLoginUsers.length === 1) {
          this.selectedUserId = this.lastLoginUsers[0].userId;
          this.startFaceRecognition();
          return;
        }
        
        // 多个用户时，让用户选择
        const itemList = this.lastLoginUsers.map(user => user.username || user.phone);
        
        uni.showActionSheet({
          itemList: itemList,
          success: (res) => {
            const selectedUser = this.lastLoginUsers[res.tapIndex];
            this.selectedUserId = selectedUser.userId;
            this.startFaceRecognition();
          }
        });
        
      } catch (error) {
        console.error('人脸登录启动失败:', error);
        uni.showToast({
          title: '启动人脸识别失败',
          icon: 'none'
        });
      }
    },
    
    /**
     * 启动人脸识别组件
     */
    startFaceRecognition() {
      this.faceRecognitionType = 'login';
      this.showFaceRecognition = true;
    },
    
    /**
     * 人脸识别成功回调
     */
    handleFaceRecognitionSuccess(result) {
      console.log('人脸识别登录成功:', result);
      
      // 保存登录信息
      uni.setStorageSync('token', result.token);
      uni.setStorageSync('userInfo', result.user);
      
      // 更新最近登录用户记录
      this.updateLastLoginUser(result.user);
      
      uni.showToast({
        title: '人脸登录成功',
        icon: 'success'
      });
      
      // 登录成功直接跳转到首页
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/home/home'
        });
      }, 1500);
    },
    
    /**
     * 关闭人脸识别组件
     */
    closeFaceRecognition() {
      this.showFaceRecognition = false;
      this.selectedUserId = '';
    },
    
    /**
     * 加载最近登录的用户
     */
    loadLastLoginUsers() {
      try {
        const savedUsers = uni.getStorageSync('lastLoginUsers') || [];
        this.lastLoginUsers = savedUsers;
        console.log('加载最近登录用户:', this.lastLoginUsers);
      } catch (error) {
        console.error('加载最近登录用户失败:', error);
        this.lastLoginUsers = [];
      }
    },
    
    /**
     * 更新最近登录用户记录
     */
    updateLastLoginUser(user) {
      try {
        let savedUsers = uni.getStorageSync('lastLoginUsers') || [];
        
        // 移除已存在的用户记录
        savedUsers = savedUsers.filter(u => u.userId !== user.id);
        
        // 添加到最前面
        savedUsers.unshift({
          userId: user.id,
          username: user.username,
          phone: user.phone,
          avatar: user.avatar,
          lastLoginTime: new Date().getTime()
        });
        
        // 最多保存5个用户
        if (savedUsers.length > 5) {
          savedUsers = savedUsers.slice(0, 5);
        }
        
        uni.setStorageSync('lastLoginUsers', savedUsers);
        this.lastLoginUsers = savedUsers;
        
        console.log('更新最近登录用户记录:', savedUsers);
      } catch (error) {
        console.error('更新最近登录用户记录失败:', error);
      }
    },
    
    /**
     * 生物识别登录成功处理
     */
    async biometricLoginSuccess() {
      // 使用本地存储的用户信息进行快速登录
      const savedUserInfo = uni.getStorageSync('biometric_user');
      
      if (savedUserInfo) {
        const res = await uni.request({
          url: 'http://your-api-domain.com/api/auth/biometric-login',
          method: 'POST',
          data: {
            userId: savedUserInfo.userId,
            biometricToken: savedUserInfo.biometricToken
          }
        });
        
        if (res.data.code === 200) {
          uni.setStorageSync('token', res.data.data.token);
          uni.setStorageSync('userInfo', res.data.data.userInfo);
          
          uni.showToast({
            title: '登录成功',
            icon: 'success'
          });
          
          // 登录成功直接跳转到首页
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/home/home'
            });
          }, 1500);
        }
      }
    },
    
    /**
     * 检查生物识别支持
     */
    async checkBiometricSupport() {
      try {
        // 检查是否成功导入BiometricAuth
        if (typeof BiometricAuth === 'undefined') {
          console.log('BiometricAuth 工具类未正确导入');
          // 保持默认的true值，让用户可以看到按钮
          return;
        }
        
        const fingerprintSupport = await BiometricAuth.checkFingerprintSupport();
        const faceSupport = await BiometricAuth.checkFaceSupport();
        
        console.log('指纹识别支持:', fingerprintSupport);
        console.log('人脸识别支持:', faceSupport);
        
        this.supportFingerprint = fingerprintSupport;
        this.supportFaceID = faceSupport;
        this.supportBiometric = fingerprintSupport || faceSupport;
        
        // 如果都不支持，至少显示一个按钮用于演示
        if (!this.supportBiometric) {
          console.log('设备不支持生物识别，启用演示模式');
          this.supportFingerprint = true;
          this.supportBiometric = true;
        }
      } catch (error) {
        console.log('检查生物识别支持失败:', error);
        // 出错时保持按钮显示，让用户可以尝试
        this.supportFingerprint = true;
        this.supportFaceID = true;
        this.supportBiometric = true;
      }
    },
    
    /**
     * 跳转到注册页面
     */
    goToRegister() {
      uni.navigateTo({
        url: '/pages/register/register'
      });
    },
    
    /**
     * 跳转到忘记密码页面
     */
    goToForgetPassword() {
      uni.navigateTo({
        url: '/pages/forget-password/forget-password'
      });
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
    }
  },
  
  watch: {
    // 监听表单变化，实时验证
    'form.phone'(newVal) {
      if (newVal && !this.validatePhone(newVal)) {
        // 可以在这里添加实时提示
      }
    },
    
    'form.email'(newVal) {
      if (newVal && !this.validateEmail(newVal)) {
        // 可以在这里添加实时提示
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import 'login.scss';
</style>
