<template>
    <div>
      <nav>
        <div class="nav-left"></div>
        <div class="nav-buttons">
          <div class="btn secondary" @click="scrollToLogin">
            <a href="javascript:void(0)">Sign Up</a>
          </div>
        </div>
      </nav>
      <section class="hero">
        <canvas ref="canvas"></canvas>
        <div class="hero-content">
          <div class="header" ref="header">
            <h1 class="main-title">
              <span class="title-part bold">全品汇</span>
              <span class="title-part highlight">管理平台</span>
            </h1>
            <p class="subtitle">全球好物汇聚，智慧管理引领</p>
          </div>
        </div>
        <div class="hero-img-container">
          <div class="hero-img" ref="heroImg">
            <div 
              class="login-container" 
              v-show="showLoginForm"
              :class="{ 'show': showLoginForm, 'hide': !showLoginForm }"
              @click.self="hideLoginForm"
            >
              <!-- 左侧背景图 -->
              <div class="login-left">
                <div class="space-bg">
                  <div class="space-quote">愿此行，终抵群星</div>
                </div>
              </div>
              
              <!-- 右侧表单 -->
              <div class="login-right">
                <!-- 登录表单 -->
                <div class="form-container">
                  <div class="login-header">
                    <h2>登录</h2>
                    <p>使用用户名或邮箱登录</p>
                  </div>
                  
                  <form @submit.prevent="handleLogin" class="auth-form">
                    <div class="form-group">
                      <input type="text" v-model="loginForm.identifier" placeholder="用户名或邮箱" required>
                    </div>
                    <div class="form-group password-group">
                      <input 
                        :type="showPassword ? 'text' : 'password'" 
                        v-model="loginForm.password" 
                        placeholder="密码" 
                        required
                      >
                      <button 
                        type="button" 
                        class="password-toggle" 
                        @click="togglePassword"
                        :title="showPassword ? '隐藏密码' : '显示密码'"
                      >
                        <img 
                          :src="showPassword ? '/img/睁眼.svg' : '/img/闭眼 .svg'" 
                          :alt="showPassword ? '隐藏密码' : '显示密码'"
                          class="password-icon"
                        >
                      </button>
                    </div>
                    <div class="form-group captcha-group">
                      <input 
                        type="text" 
                        v-model="loginForm.captchaCode" 
                        placeholder="请输入验证码" 
                        maxlength="4"
                        required
                      >
                      <div class="captcha-container" @click="refreshCaptcha">
                        <div v-if="captchaLoading" class="captcha-loading">加载中...</div>
                        <div v-else-if="captchaSvg" class="captcha-image" v-html="captchaSvg"></div>
                        <div v-else class="captcha-error" @click="loadCaptcha">点击加载验证码</div>
                      </div>
                    </div>
                    <button type="submit" class="submit-btn" :disabled="loginLoading">
                      <span v-if="loginLoading">登录中...</span>
                      <span v-else>登录</span>
                    </button>
                  </form>
                </div>
                
                <!-- 错误提示 -->
                <transition name="error-fade">
                  <div v-if="errorMessage" class="error-message">
                    <i class="error-icon">⚠️</i>
                    {{ errorMessage }}
                  </div>
                </transition>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="outro">
        <h1 class="outro-title">
          <span class="outro-main">全品汇</span>
          <span class="outro-sub">汇聚全球精品</span>
        </h1>
        <p class="outro-description">连接世界好物，创造无限价值，让每一次选择都成就美好生活</p>
      </section>
    </div>
  </template>
  
  <script>
  import './Login_zhao.css'
  import loginScript from './Login_zhao.js'
  
  export default {
    name: 'LoginPage',
    ...loginScript
  }
  </script>