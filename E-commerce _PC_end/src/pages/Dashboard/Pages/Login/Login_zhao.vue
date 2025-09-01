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
              <span class="title-part">智能商城</span>
              <span class="title-part highlight">管理平台</span>
            </h1>
            <p class="subtitle">让商业管理更简单，让数据决策更智能</p>
          </div>
        </div>
        <div class="hero-img-container">
          <div class="hero-img" ref="heroImg">
            <div class="login-container" v-show="showLoginForm">
              <div class="login-header">
                <h2>管理员入口</h2>
                <p>欢迎使用E-Mall智能商城管理系统</p>
              </div>
              
              <div class="login-tabs">
                <button @click="switchTab('login')" :class="{active: activeTab==='login'}">管理员登录</button>
                <button @click="switchTab('register')" :class="{active: activeTab==='register'}">申请权限</button>
              </div>
              
              <!-- 登录表单 -->
              <form v-if="activeTab==='login'" @submit.prevent="handleLogin" class="auth-form">
                <div class="form-group">
                  <i class="input-icon">👤</i>
                  <input type="email" v-model="loginForm.email" placeholder="管理员邮箱" required>
                </div>
                <div class="form-group">
                  <i class="input-icon">🔒</i>
                  <input type="password" v-model="loginForm.password" placeholder="管理密码" required>
                </div>
                <button type="submit" class="submit-btn" :disabled="loginLoading">
                  <span v-if="loginLoading">正在登录...</span>
                  <span v-else>进入管理后台</span>
                </button>
                <div class="form-footer">
                  <a href="#" class="forgot-password">忘记密码？</a>
                  <span class="divider">|</span>
                  <a href="#" class="help-link">联系技术支持</a>
                </div>
              </form>
              
              <!-- 权限申请表单 -->  
              <form v-if="activeTab==='register'" @submit.prevent="handleRegister" class="auth-form">
                <div class="form-group">
                  <i class="input-icon">👤</i>
                  <input type="text" v-model="registerForm.username" placeholder="申请人姓名" required>
                </div>
                <div class="form-group">
                  <i class="input-icon">📧</i>
                  <input type="email" v-model="registerForm.email" placeholder="企业邮箱" required>
                </div>
                <div class="form-group">
                  <i class="input-icon">🔐</i>
                  <input type="password" v-model="registerForm.password" placeholder="设置密码" required>
                </div>
                <div class="form-group">
                  <i class="input-icon">✅</i>
                  <input type="password" v-model="registerForm.confirmPassword" placeholder="确认密码" required>
                </div>
                <button type="submit" class="submit-btn" :disabled="registerLoading">
                  <span v-if="registerLoading">提交申请中...</span>
                  <span v-else>提交权限申请</span>
                </button>
                <div class="form-footer">
                  <small>申请提交后，管理员将在24小时内审核</small>
                </div>
              </form>
              
              <!-- 错误提示 -->
              <div v-if="errorMessage" class="error-message">
                <i class="error-icon">⚠️</i>
                {{ errorMessage }}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="outro">
        <h1 class="outro-title">
          <span class="outro-main">智慧商业</span>
          <span class="outro-sub">始于此刻</span>
        </h1>
        <p class="outro-description">让每一个商业决策都有数据支撑，让每一次创新都充满可能</p>
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