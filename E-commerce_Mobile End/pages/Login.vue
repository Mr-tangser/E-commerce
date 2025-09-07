<template>
  <div class="login-page">
    <!-- 顶部logo区域 -->
    <div class="logo-section">
      <div class="logo">
        <i class="fas fa-shopping-cart"></i>
      </div>
      <h1>电商平台</h1>
      <p>欢迎回来</p>
    </div>

    <!-- 登录表单区域 -->
    <div class="form-section">
      <div class="login-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: loginMode === 'email' }"
          @click="loginMode = 'email'"
        >
          邮箱登录
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: loginMode === 'phone' }"
          @click="loginMode = 'phone'"
        >
          手机登录
        </button>
      </div>

      <!-- 邮箱登录表单 -->
      <form v-if="loginMode === 'email'" @submit.prevent="emailLogin" class="login-form">
        <div class="input-group">
          <i class="fas fa-envelope"></i>
          <input 
            type="email" 
            v-model="emailForm.email" 
            placeholder="请输入邮箱"
            required
          >
        </div>
        <div class="input-group">
          <i class="fas fa-lock"></i>
          <input 
            :type="showPassword ? 'text' : 'password'" 
            v-model="emailForm.password" 
            placeholder="请输入密码"
            required
          >
          <button 
            type="button" 
            class="toggle-password"
            @click="showPassword = !showPassword"
          >
            <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
          </button>
        </div>
        <button type="submit" class="login-btn" :disabled="emailLoading">
          <span v-if="emailLoading" class="loading"></span>
          {{ emailLoading ? '登录中...' : '登录' }}
        </button>
      </form>

      <!-- 手机登录表单 -->
      <form v-if="loginMode === 'phone'" @submit.prevent="phoneLogin" class="login-form">
        <div class="input-group">
          <i class="fas fa-phone"></i>
          <input 
            type="tel" 
            v-model="phoneForm.phone" 
            placeholder="请输入手机号"
            maxlength="11"
            required
          >
        </div>
        <div class="input-group code-group">
          <i class="fas fa-key"></i>
          <input 
            type="text" 
            v-model="phoneForm.code" 
            placeholder="请输入验证码"
            maxlength="6"
            required
          >
          <button 
            type="button" 
            class="send-code-btn"
            :disabled="codeCooldown > 0"
            @click="sendCode"
          >
            {{ codeCooldown > 0 ? `${codeCooldown}s` : '发送验证码' }}
          </button>
        </div>
        <button type="submit" class="login-btn" :disabled="phoneLoading">
          <span v-if="phoneLoading" class="loading"></span>
          {{ phoneLoading ? '登录中...' : '登录' }}
        </button>
      </form>

      <!-- 人脸登录按钮 -->
      <div class="face-login-section">
        <div class="divider">
          <span>或</span>
        </div>
        <button 
          class="face-login-btn"
          @click="openFaceLogin"
          :disabled="faceLoading"
        >
          <i class="fas fa-user-circle"></i>
          <span>人脸识别登录</span>
          <span v-if="faceLoading" class="loading"></span>
        </button>
        <p class="face-login-tip">
          没有注册人脸？
          <a href="#" @click.prevent="openFaceRegister">立即注册</a>
        </p>
      </div>

      <!-- 其他登录选项 -->
      <div class="other-options">
        <div class="links">
          <router-link to="/register">没有账号？立即注册</router-link>
          <router-link to="/forgot-password">忘记密码？</router-link>
        </div>
        
        <!-- 第三方登录 -->
        <div class="third-party-login">
          <p>快速登录</p>
          <div class="third-party-buttons">
            <button class="wechat-login" @click="wechatLogin">
              <i class="fab fa-weixin"></i>
              微信
            </button>
            <button class="qq-login" @click="qqLogin">
              <i class="fab fa-qq"></i>
              QQ
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 人脸识别弹窗 -->
    <div 
      v-if="showFaceModal" 
      class="face-modal-overlay"
      @click.self="closeFaceModal"
    >
      <div class="face-modal">
        <div class="modal-header">
          <h3>{{ faceMode === 'login' ? '人脸识别登录' : '人脸识别注册' }}</h3>
          <button class="close-btn" @click="closeFaceModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <FaceRecognition
            :mode="faceMode"
            :api-base-url="apiBaseUrl"
            @close="closeFaceModal"
            @register-success="handleFaceRegisterSuccess"
            @switch-mode="handleSwitchMode"
          />
        </div>
      </div>
    </div>

    <!-- 消息提示 -->
    <div 
      v-if="message.show" 
      class="message-toast"
      :class="message.type"
    >
      <i :class="message.icon"></i>
      <span>{{ message.text }}</span>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import FaceRecognition from '@/components/FaceRecognition/FaceRecognition.vue'
import { authenticateWithFace } from '@/utils/biometricAuth.js'

export default {
  name: 'LoginPage',
  components: {
    FaceRecognition
  },
  data() {
    return {
      // 登录模式
      loginMode: 'email', // 'email' 或 'phone'
      
      // 邮箱登录表单
      emailForm: {
        email: '',
        password: ''
      },
      
      // 手机登录表单
      phoneForm: {
        phone: '',
        code: ''
      },
      
      // 状态
      emailLoading: false,
      phoneLoading: false,
      faceLoading: false,
      showPassword: false,
      codeCooldown: 0,
      
      // 人脸识别相关
      showFaceModal: false,
      faceMode: 'login', // 'login' 或 'register'
      
      // 消息提示
      message: {
        show: false,
        type: 'info', // 'success', 'error', 'warning', 'info'
        text: '',
        icon: ''
      },
      
      // API配置
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || '/api'
    }
  },
  methods: {
    // 邮箱登录
    async emailLogin() {
      if (!this.validateEmailForm()) return
      
      this.emailLoading = true
      try {
        const response = await axios.post(`${this.apiBaseUrl}/auth/login`, {
          email: this.emailForm.email,
          password: this.emailForm.password
        })
        
        if (response.data.success) {
          this.handleLoginSuccess(response.data)
        } else {
          this.showMessage('error', response.data.error.message)
        }
      } catch (error) {
        this.handleLoginError(error)
      } finally {
        this.emailLoading = false
      }
    },
    
    // 手机登录
    async phoneLogin() {
      if (!this.validatePhoneForm()) return
      
      this.phoneLoading = true
      try {
        const response = await axios.post(`${this.apiBaseUrl}/auth/login-by-phone`, {
          phone: this.phoneForm.phone,
          code: this.phoneForm.code
        })
        
        if (response.data.success) {
          this.handleLoginSuccess(response.data)
        } else {
          this.showMessage('error', response.data.error.message)
        }
      } catch (error) {
        this.handleLoginError(error)
      } finally {
        this.phoneLoading = false
      }
    },
    
    // 发送验证码
    async sendCode() {
      if (!this.phoneForm.phone) {
        this.showMessage('warning', '请输入手机号')
        return
      }
      
      if (!/^1[3-9]\d{9}$/.test(this.phoneForm.phone)) {
        this.showMessage('warning', '请输入有效的手机号')
        return
      }
      
      try {
        const response = await axios.post(`${this.apiBaseUrl}/auth/send-code`, {
          phone: this.phoneForm.phone,
          type: 'login'
        })
        
        if (response.data.success) {
          this.showMessage('success', '验证码发送成功')
          this.startCooldown()
        } else {
          this.showMessage('error', response.data.error.message)
        }
      } catch (error) {
        this.showMessage('error', error.response?.data?.error?.message || '发送验证码失败')
      }
    },
    
    // 开始验证码倒计时
    startCooldown() {
      this.codeCooldown = 60
      const timer = setInterval(() => {
        this.codeCooldown--
        if (this.codeCooldown <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    },
    
    // 打开人脸登录
    async openFaceLogin() {
      console.log('🎯 开始人脸登录');
      this.faceLoading = true;
      
      try {
        // 使用biometricAuth工具进行人脸识别
        const result = await authenticateWithFace();
        console.log('👤 人脸识别结果:', result);
        
        if (result.success) {
          // 人脸识别成功，直接登录
          this.handleLoginSuccess({
            message: result.message,
            data: result.data
          });
        } else {
          // 特殊处理需要重新注册人脸的情况
          if (result.needRegister) {
            this.showMessage('warning', result.message || '请先注册人脸');
            
            // 提供跳转到注册的选项
            setTimeout(() => {
              uni.showModal({
                title: '需要注册人脸',
                content: '由于系统升级，需要重新注册人脸。是否现在前往注册？',
                success: (res) => {
                  if (res.confirm) {
                    // 先跳转到登录（这样用户可以先登录账户）
                    this.showMessage('info', '请先使用其他方式登录，然后在"我的"页面进行人脸注册');
                  }
                }
              });
            }, 1000);
          } else {
            this.showMessage('error', result.message || '人脸识别失败');
          }
        }
      } catch (error) {
        console.error('人脸识别错误:', error);
        this.showMessage('error', error.message || '人脸识别失败，请重试');
      } finally {
        this.faceLoading = false;
      }
    },
    
    // 打开人脸注册
    openFaceRegister() {
      this.faceMode = 'register'
      this.showFaceModal = true
    },
    
    // 关闭人脸识别弹窗
    closeFaceModal() {
      this.showFaceModal = false
    },
    
    // 处理人脸注册成功
    handleFaceRegisterSuccess() {
      this.showMessage('success', '人脸注册成功！您现在可以使用人脸识别登录了')
      this.closeFaceModal()
    },
    
    // 处理模式切换
    handleSwitchMode(mode) {
      this.faceMode = mode
    },
    
    // 微信登录
    wechatLogin() {
      this.showMessage('info', '微信登录功能开发中...')
    },
    
    // QQ登录
    qqLogin() {
      this.showMessage('info', 'QQ登录功能开发中...')
    },
    
    // 表单验证
    validateEmailForm() {
      if (!this.emailForm.email) {
        this.showMessage('warning', '请输入邮箱')
        return false
      }
      if (!this.emailForm.password) {
        this.showMessage('warning', '请输入密码')
        return false
      }
      return true
    },
    
    validatePhoneForm() {
      if (!this.phoneForm.phone) {
        this.showMessage('warning', '请输入手机号')
        return false
      }
      if (!/^1[3-9]\d{9}$/.test(this.phoneForm.phone)) {
        this.showMessage('warning', '请输入有效的手机号')
        return false
      }
      if (!this.phoneForm.code) {
        this.showMessage('warning', '请输入验证码')
        return false
      }
      return true
    },
    
    // 处理登录成功
    handleLoginSuccess(data) {
      // 保存token和用户信息
      if (data.data.token) {
        // 对于uni-app项目，使用uni.setStorageSync
        uni.setStorageSync('token', data.data.token)
        console.log('✅ Token已保存:', data.data.token.substring(0, 20) + '...')
      }
      if (data.data.user) {
        uni.setStorageSync('user', data.data.user)
        console.log('✅ 用户信息已保存:', data.data.user)
        
        // 触发全局用户状态更新事件
        uni.$emit('userStatusChange', {
          isLoggedIn: true,
          user: data.data.user
        })
      }
      
      this.showMessage('success', data.message || '登录成功')
      
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        console.log('🚀 开始执行登录成功后的跳转逻辑')
        this.navigateToHomeForMobile()
      }, 2000) // 给足够时间显示成功提示
      },
      
      // 优化的跳转方法 - 专为自定义tabBar设计
      navigateToHomeForMobile() {
        console.log('🏠 登录成功，准备跳转到首页...')
        console.log('📱 当前环境:', process.env.NODE_ENV)
        
        // 延迟跳转，确保登录状态完全保存
        setTimeout(() => {
          console.log('🚀 开始执行跳转逻辑')
          
          // 获取系统信息
          const systemInfo = uni.getSystemInfoSync()
          console.log('📱 系统信息:', {
            platform: systemInfo.platform,
            system: systemInfo.system,
            version: systemInfo.version
          })
          
          // 对于自定义tabBar页面，优先使用 switchTab
          console.log('🔄 策略1: 使用 switchTab 跳转到首页 (适用于自定义tabBar)')
          uni.switchTab({
            url: '/pages/home/home',
            success: (res) => {
              console.log('✅ switchTab 跳转首页成功:', res)
            },
            fail: (err) => {
              console.error('❌ switchTab 失败:', err)
              
              // 备选策略: 使用 reLaunch 重新启动应用
              console.log('🔄 策略2: 使用 reLaunch 重新启动应用')
              setTimeout(() => {
                uni.reLaunch({
                  url: '/pages/home/home',
                  success: (res) => {
                    console.log('✅ reLaunch 成功:', res)
                  },
                  fail: (err) => {
                    console.error('❌ reLaunch 也失败:', err)
                    
                    // 最后提示用户手动操作
                    console.log('🔄 显示手动提示')
                    uni.showModal({
                      title: '跳转提示',
                      content: '登录成功！请手动点击底部"首页"按钮查看',
                      showCancel: false,
                      confirmText: '知道了'
                    })
                  }
                })
              }, 800)
            }
          })
        }, 500) // 减少延迟，因为外层已有延迟
      },
    
    // 处理登录错误
    handleLoginError(error) {
      const message = error.response?.data?.error?.message || '登录失败，请重试'
      this.showMessage('error', message)
    },
    
    // 显示消息提示
    showMessage(type, text) {
      const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
      }
      
      this.message = {
        show: true,
        type,
        text,
        icon: icons[type]
      }
      
      // 3秒后自动隐藏
      setTimeout(() => {
        this.message.show = false
      }, 3000)
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  padding: 20px;
}

/* Logo 区域 */
.logo-section {
  text-align: center;
  color: white;
  margin: 40px 0;
}

.logo {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  backdrop-filter: blur(10px);
}

.logo i {
  font-size: 40px;
  color: white;
}

.logo-section h1 {
  font-size: 32px;
  margin: 0 0 10px;
  font-weight: 600;
}

.logo-section p {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

/* 表单区域 */
.form-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  margin: 0 auto;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

/* 登录标签 */
.login-tabs {
  display: flex;
  margin-bottom: 30px;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 4px;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 表单样式 */
.login-form {
  margin-bottom: 30px;
}

.input-group {
  position: relative;
  margin-bottom: 20px;
}

.input-group i {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 18px;
}

.input-group input {
  width: 100%;
  padding: 16px 50px;
  border: 2px solid #f3f4f6;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.input-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.toggle-password {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 18px;
}

.toggle-password:hover {
  color: #667eea;
}

/* 验证码组 */
.code-group input {
  padding-right: 120px;
}

.send-code-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  padding: 8px 16px;
  border: 1px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.send-code-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.send-code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* 人脸登录区域 */
.face-login-section {
  text-align: center;
}

.divider {
  position: relative;
  margin: 20px 0;
  text-align: center;
  color: #9ca3af;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e5e7eb;
}

.divider span {
  background: white;
  padding: 0 20px;
  position: relative;
  z-index: 1;
}

.face-login-btn {
  width: 100%;
  padding: 16px;
  border: 2px solid #667eea;
  border-radius: 12px;
  background: white;
  color: #667eea;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 10px;
}

.face-login-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.face-login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.face-login-btn i {
  font-size: 20px;
}

.face-login-tip {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.face-login-tip a {
  color: #667eea;
  text-decoration: none;
}

.face-login-tip a:hover {
  text-decoration: underline;
}

/* 其他选项 */
.other-options {
  margin-top: 30px;
}

.links {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.links a {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
}

.links a:hover {
  text-decoration: underline;
}

/* 第三方登录 */
.third-party-login {
  text-align: center;
}

.third-party-login p {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 15px;
}

.third-party-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.wechat-login,
.qq-login {
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.wechat-login {
  background: #09bb07;
  color: white;
}

.qq-login {
  background: #12b7f5;
  color: white;
}

.wechat-login:hover,
.qq-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* 人脸识别弹窗 */
.face-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.face-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
}

.close-btn {
  border: none;
  background: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.modal-body {
  height: 600px;
  overflow: hidden;
}

/* 消息提示 */
.message-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 2000;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.message-toast.success {
  background: rgba(16, 185, 129, 0.9);
}

.message-toast.error {
  background: rgba(239, 68, 68, 0.9);
}

.message-toast.warning {
  background: rgba(245, 158, 11, 0.9);
}

.message-toast.info {
  background: rgba(59, 130, 246, 0.9);
}

/* 加载动画 */
.loading {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-page {
    padding: 10px;
  }
  
  .logo-section {
    margin: 20px 0;
  }
  
  .logo-section h1 {
    font-size: 28px;
  }
  
  .form-section {
    padding: 20px;
  }
  
  .face-modal {
    height: 90vh;
  }
  
  .modal-body {
    height: calc(90vh - 80px);
  }
}

@media (max-width: 480px) {
  .third-party-buttons {
    flex-direction: column;
  }
  
  .wechat-login,
  .qq-login {
    width: 100%;
    justify-content: center;
  }
}
</style>


