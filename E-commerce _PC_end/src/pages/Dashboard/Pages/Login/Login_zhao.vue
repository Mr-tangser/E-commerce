<template>
    <div>
      <nav>
        <div class="nav-links">
          <a href="#">Overview</a>
          <a href="#">Solutions</a>
          <a href="#">Resources</a>
        </div>
        <div class="logo">
          <a class="#"><img src="/windows.svg" />Byewind</a>
        </div>
        <div class="nav-buttons">
          <div class="btn primary"><a href="#">Live Demo</a></div>
          <div class="btn secondary"><a href="#">Get Started</a></div>
        </div>
      </nav>
      <section class="hero">
        <canvas ref="canvas"></canvas>
        <div class="hero-content">
          <div class="header" ref="header">
            <h1>One unified workspace to build, test , and ship AI faster</h1>
            <p>Trusted by</p>
            <div class="client-logos">
              <div class="client-logo">
                <img src="/apple-11.svg" alt="" />
              </div>
              <div class="client-logo">
                <img src="/tiktok-plain-1.svg" alt="" />
              </div>
              <div class="client-logo">
                <img src="/github-2.svg" alt="" />
              </div>
    <div class="client-logo">
                <img src="/xiaomi-4.svg" alt="" />
              </div>
            </div>
          </div>
        </div>
        <div class="hero-img-container">
          <div class="hero-img" ref="heroImg">
            <div class="login-container" v-show="showLoginForm">
              <div class="login-tabs">
                <button @click="switchTab('login')" :class="{active: activeTab==='login'}">登录</button>
                <button @click="switchTab('register')" :class="{active: activeTab==='register'}">注册</button>
              </div>
              
              <!-- 登录表单 -->
              <form v-if="activeTab==='login'" @submit.prevent="handleLogin" class="auth-form">
                <div class="form-group">
                  <input type="email" v-model="loginForm.email" placeholder="邮箱地址" required>
                </div>
                <div class="form-group">
                  <input type="password" v-model="loginForm.password" placeholder="密码" required>
                </div>
                <button type="submit" class="submit-btn" :disabled="loginLoading">
                  {{ loginLoading ? '登录中...' : '登录' }}
                </button>
                <div class="form-footer">
                  <a href="#" class="forgot-password">忘记密码？</a>
                </div>
              </form>
              
              <!-- 注册表单 -->  
              <form v-if="activeTab==='register'" @submit.prevent="handleRegister" class="auth-form">
                <div class="form-group">
                  <input type="text" v-model="registerForm.username" placeholder="用户名" required>
                </div>
                <div class="form-group">
                  <input type="email" v-model="registerForm.email" placeholder="邮箱地址" required>
                </div>
                <div class="form-group">
                  <input type="password" v-model="registerForm.password" placeholder="密码" required>
                </div>
                <div class="form-group">
                  <input type="password" v-model="registerForm.confirmPassword" placeholder="确认密码" required>
                </div>
                <button type="submit" class="submit-btn" :disabled="registerLoading">
                  {{ registerLoading ? '注册中...' : '注册' }}
                </button>
              </form>
              
              <!-- 错误提示 -->
              <div v-if="errorMessage" class="error-message">
                {{ errorMessage }}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="outro">
        <h1>愿此行，终抵群星.</h1>
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