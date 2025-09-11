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
        <!-- 一键登录 -->
        <view 
          class="quick-login-btn univerify-login-btn" 
          @click="univerifyLogin"
          v-if="supportUniverify"
        >
          <text class="login-icon univerify-icon">📱</text>
          <text class="btn-text">一键登录</text>
        </view>
        
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
        
      </view>
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
// 导入工具类
import BiometricAuth from '@/utils/biometricAuth.js'
import api from '@/utils/api.js'
import { univerifyLogin as doUniverifyLogin, checkUniverifySupport } from '@/utils/univerifyLogin.js'

export default {
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
      supportUniverify: true,    // 一键登录支持状态 - 默认显示，允许用户尝试
      
      // 表单数据
      form: {
        phone: '',
        code: '',
        password: '',
        email: '',
        emailPassword: ''
      }
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
    // 检查一键登录支持
    await this.checkUniverifySupport();
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
          // 保存登录信息 - 与"我的"页面保持一致
          uni.setStorageSync('token', response.data.token);
          uni.setStorageSync('user', response.data.user); // 改为'user'以保持一致
          
          // 同时保存一份用户信息供生物识别登录使用
          uni.setStorageSync('biometric_user', {
            ...response.data.user,
            token: response.data.token,
            timestamp: Date.now()
          });
          
          console.log('✅ 登录成功，用户数据已保存:', response.data.user);
          
          // 触发全局用户状态更新事件
          uni.$emit('userStatusChange', {
            isLoggedIn: true,
            user: response.data.user
          });
          
          uni.showToast({
            title: '登录成功',
            icon: 'success'
          });
          
          // 检查是否需要完善个人信息
          const user = response.data.user;
          const needProfile = !user.address || !user.address.receiverName || !user.address.province;
          
          console.log('🔍 用户信息检查:', {
            user: user,
            hasAddress: !!user.address,
            hasReceiverName: !!(user.address && user.address.receiverName),
            hasProvince: !!(user.address && user.address.province),
            needProfile: needProfile
          });
          
          // 跳转逻辑：如果用户信息不完整，跳转到完善信息页面，否则跳转到首页
           setTimeout(() => {
             if (needProfile) {
               console.log('🔄 用户信息不完整，但强制跳转到首页 (调试模式)')
               // 临时跳过个人信息检查，直接跳转首页
               this.navigateToHomeForMobile();
               
               // 如果需要跳转到个人资料页面，请取消上面的注释并启用下面的代码
               // uni.navigateTo({
               //   url: '/pages/UserProfile/UserProfile'
               // });
             } else {
               console.log('🏠 登录成功，准备跳转到首页...')
               console.log('🔍 用户信息完整，开始执行跳转逻辑')
               // 调用真机调试专用跳转方法
               this.navigateToHomeForMobile();
             }
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
        this.loading = true;
        this.loadingText = '人脸识别中...';
        
        console.log('🎭 开始人脸识别登录...');
        console.log('BiometricAuth类型:', typeof BiometricAuth);
        console.log('BiometricAuth对象:', BiometricAuth);
        
        // 检查是否有生物识别工具类
        if (typeof BiometricAuth === 'undefined') {
          console.log('⚠️ BiometricAuth 未定义，进入演示模式');
          // 演示模式：模拟人脸识别过程
          setTimeout(async () => {
            uni.showToast({
              title: '人脸识别成功（演示模式）',
              icon: 'success'
            });
            this.loading = false;
            // 可以在这里添加演示登录逻辑
          }, 3000);
          return;
        }
        
        console.log('✅ BiometricAuth 已加载，调用 authenticateWithFace...');
        
        const result = await BiometricAuth.authenticateWithFace();
        
        console.log('🔍 人脸识别结果:', result);
        
        if (result.success) {
          console.log('✅ 人脸识别成功，执行登录成功逻辑');
          await this.biometricLoginSuccess();
        } else {
          console.log('❌ 人脸识别失败:', result.message);
          uni.showToast({
            title: result.message || '人脸识别失败',
            icon: 'none',
            duration: 3000
          });
          
          // 如果是未注册人脸的错误，提供注册选项
          if (result.message && result.message.includes('未找到匹配的人脸')) {
            setTimeout(() => {
              uni.showModal({
                title: '人脸未注册',
                content: '您还没有注册人脸信息，是否前往注册？',
                success: (res) => {
                  if (res.confirm) {
                    // 这里可以跳转到人脸注册页面
                    console.log('用户选择前往注册人脸');
                  }
                }
              });
            }, 3500);
          }
        }
      } catch (error) {
        console.error('❌ 人脸识别异常:', error);
        uni.showToast({
          title: error.message || '人脸识别失败',
          icon: 'none',
          duration: 3000
        });
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 生物识别登录成功处理
     */
    async biometricLoginSuccess() {
      try {
        console.log('🎭 执行生物识别登录成功处理...');
        
        // 从本地存储获取用户信息（优先使用 biometric_user，备选 user）
        const savedUserInfo = uni.getStorageSync('biometric_user') || uni.getStorageSync('user');
        
        if (savedUserInfo) {
          // 保存登录信息 - 与账户密码登录保持一致的格式
          const token = savedUserInfo.token || 'biometric_token_' + Date.now();
          uni.setStorageSync('token', token);
          uni.setStorageSync('user', savedUserInfo);
          
          // 触发全局用户状态更新事件
          uni.$emit('userStatusChange', {
            isLoggedIn: true,
            user: savedUserInfo
          });
          
          console.log('✅ 生物识别登录成功，用户数据已保存:', savedUserInfo);
          
          uni.showToast({
            title: '人脸登录成功',
            icon: 'success'
          });
          
          // 检查是否需要完善个人信息
          const needProfile = !savedUserInfo.address || !savedUserInfo.address?.receiverName || !savedUserInfo.address?.province;
          
          console.log('🔍 生物识别用户信息检查:', {
            user: savedUserInfo,
            hasAddress: !!savedUserInfo.address,
            hasReceiverName: !!(savedUserInfo.address && savedUserInfo.address.receiverName),
            hasProvince: !!(savedUserInfo.address && savedUserInfo.address.province),
            needProfile: needProfile
          });
          
          // 跳转逻辑：如果用户信息不完整，跳转到完善信息页面，否则跳转到首页
          setTimeout(() => {
            if (needProfile) {
              console.log('🔄 生物识别用户信息不完整，但强制跳转到首页 (调试模式)')
              // 临时跳过个人信息检查，直接跳转首页
              this.navigateToHomeForMobile();
              
              // 如果需要跳转到个人资料页面，请取消上面的注释并启用下面的代码
              // uni.navigateTo({
              //   url: '/pages/UserProfile/UserProfile'
              // });
            } else {
              console.log('🏠 生物识别登录成功，准备跳转到首页...')
              console.log('🔍 生物识别用户信息完整，开始执行跳转逻辑')
              // 调用真机调试专用跳转方法
              this.navigateToHomeForMobile();
            }
          }, 1500);
        } else {
          // 如果没有保存的用户信息，提示用户先进行普通登录
          console.log('❌ 未找到本地用户信息，提示用户先进行普通登录');
          uni.showModal({
            title: '提示',
            content: '请先使用账户密码登录一次，以便保存您的登录信息',
            showCancel: false
          });
        }
      } catch (error) {
        console.error('❌ 生物识别登录处理异常:', error);
        uni.showToast({
          title: error.message || '登录处理失败',
          icon: 'none',
          duration: 3000
        });
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
     * 检查一键登录支持
     */
    async checkUniverifySupport() {
      try {
        console.log('🔍 检查一键登录支持...');
        const isSupported = await checkUniverifySupport();
        console.log('一键登录支持状态:', isSupported);
        
        // 只有当明确不支持时才隐藏按钮，其他情况保持显示
        if (isSupported === false) {
          console.log('❌ 设备明确不支持一键登录，隐藏按钮');
          this.supportUniverify = false;
        } else {
          console.log('✅ 保持一键登录按钮显示');
          this.supportUniverify = true;
        }
        
        // 在APP环境下，强制开启一键登录功能（用于测试）
        // #ifdef APP-PLUS
        console.log('📱 APP环境下强制启用一键登录');
        this.supportUniverify = true;
        // #endif
      } catch (error) {
        console.log('检查一键登录支持失败:', error);
        // 检查失败时默认显示按钮，让用户可以尝试
        console.log('🔧 检查失败，默认显示一键登录按钮');
        this.supportUniverify = true;
        
        // #ifdef APP-PLUS
        this.supportUniverify = true;
        // #endif
      }
    },
    /**
     * 一键登录
     */
    async univerifyLogin() {
      try {
        console.log('🚀 开始一键登录...');
        this.loading = true;
        this.loadingText = '正在启动一键登录...';
        
        await doUniverifyLogin(
          // 成功回调
          (result) => {
            console.log('✅ 一键登录成功:', result);
            uni.showToast({
              title: '登录成功',
              icon: 'success',
              duration: 2000
            });
            
            // 延迟跳转，让用户看到成功提示
            setTimeout(() => {
              this.navigateToHomeForMobile();
            }, 2000);
          },
          // 失败回调
          (error) => {
            console.error('❌ 一键登录失败:', error);
            uni.showToast({
              title: error.message || '一键登录失败',
              icon: 'none',
              duration: 3000
            });
            
            // 如果是设备不支持的错误，隐藏一键登录按钮
            if (error.message && error.message.includes('不支持一键登录')) {
              this.supportUniverify = false;
            }
          },
          // 取消回调
          (cancel) => {
            console.log('ℹ️ 用户取消一键登录或选择其他方式:', cancel);
            // 用户取消，不需要特殊处理
            if (cancel.errCode === 30003) {
              // 用户点击了其他登录方式
              uni.showToast({
                title: '请选择其他登录方式',
                icon: 'none'
              });
            }
          }
        );
      } catch (error) {
        console.error('❌ 一键登录异常:', error);
        uni.showToast({
          title: error.message || '一键登录服务异常',
          icon: 'none',
          duration: 3000
        });
      } finally {
        this.loading = false;
      }
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
      }, 1500) // 适当减少延迟时间
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
