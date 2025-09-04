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
            <div class="login-container" v-show="showLoginForm">
              <!-- 左侧背景图 -->
              <div class="login-left">
                <div class="space-bg"></div>
              </div>
              
              <!-- 右侧表单 -->
              <div class="login-right">
                <!-- 登录表单 -->
                <transition name="form-slide" mode="out-in">
                  <div v-if="!showRegister" key="login" class="form-container">
                    <div class="login-header">
                      <h2>登录</h2>
                      <p>使用用户名或邮箱登录</p>
                    </div>
                    
                    <form @submit.prevent="handleLogin" class="auth-form">
                      <div class="form-group">
                        <input type="text" v-model="loginForm.identifier" placeholder="用户名或邮箱" required>
                      </div>
                      <div class="form-group">
                        <input type="password" v-model="loginForm.password" placeholder="密码" required>
                      </div>
                      <button type="submit" class="submit-btn" :disabled="loginLoading">
                        <span v-if="loginLoading">登录中...</span>
                        <span v-else>登录</span>
                      </button>
                      <div class="form-footer">
                        <a href="#" @click.prevent="switchToRegister" class="switch-link">还没有账号？立即注册</a>
                      </div>
                    </form>
                  </div>

                  <!-- 注册表单 -->
                  <div v-else key="register" class="form-container">
                    <div class="login-header">
                      <h2>注册</h2>
                      <p>创建您的新账户</p>
                    </div>
                    
                    <form @submit.prevent="handleRegister" class="auth-form">
                      <div class="form-group">
                        <input type="text" v-model="registerForm.username" placeholder="用户名" required minlength="2" maxlength="20">
                      </div>
                      <div class="form-group">
                        <input type="password" v-model="registerForm.password" placeholder="密码 (至少6位)" required minlength="6">
                      </div>
                      <div class="form-group">
                        <input type="password" v-model="registerForm.confirmPassword" placeholder="确认密码" required minlength="6">
                      </div>
                      <button type="submit" class="submit-btn" :disabled="registerLoading">
                        <span v-if="registerLoading">注册中...</span>
                        <span v-else>注册</span>
                      </button>
                      <div class="form-footer">
                        <a href="#" @click.prevent="switchToLogin" class="switch-link">已有账号？立即登录</a>
                      </div>
                    </form>
                  </div>
                </transition>
                
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