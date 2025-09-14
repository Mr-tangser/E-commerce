<template>
  <view class="ai-service-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <view class="navbar-left" @click="goBack">
          <text class="back-icon">◀</text>
        </view>
        <view class="navbar-title">
          <text>智能客服</text>
        </view>
        <view class="navbar-right">
          <view class="status-indicator" :class="{ online: isOnline }">
            <view class="status-dot"></view>
            <text class="status-text">{{ isOnline ? '在线' : '离线' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- AI聊天组件 - 全屏模式 -->
    <view class="chat-container">
      <!-- AI聊天组件 -->
      <AIChat 
        ref="aiChatComponent"
        :user-info="userInfo"
        :auto-open="true"
        :full-screen="true"
        @connection-change="onConnectionChange"
        @chat-ready="onChatReady"
      ></AIChat>
    </view>



    <!-- 加载提示 -->
    <view class="loading-overlay" v-if="isInitializing">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text>正在连接智能客服...</text>
      </view>
    </view>
  </view>
</template>

<script>
import AIChat from '../../components/AIChat/AIChat.vue';

export default {
  name: 'AICustomerService',
  components: {
    AIChat
  },
  data() {
    return {
      isOnline: false,
      isInitializing: true,
      userInfo: {},
      fromPage: '', // 来源页面
      hasBeenHidden: false, // 页面是否曾经被隐藏过
      lastCheckTime: 0, // 上次检查的时间戳
    };
  },
  onLoad(options) {
    
    // 记录来源页面
    this.fromPage = options.from || 'unknown';
    
    // 获取用户信息
    this.loadUserInfo();
    
    // 设置页面标题
    uni.setNavigationBarTitle({
      title: 'AI智能客服'
    });
    
    // 自动检查连接状态
    this.autoCheckConnection();
  },
  onShow() {
    
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastCheckTime;
    
    // 页面重新显示时的智能检查策略
    if (!this.isInitializing) {
      if (this.hasBeenHidden || timeSinceLastCheck > 30000) {
        // 如果页面曾经被隐藏过，或者距离上次检查超过30秒，强制实时检查
        this.forceConnectionCheck();
      } else {
      }
    }
    
    // 重置隐藏标志
    this.hasBeenHidden = false;
  },
  onHide() {
    
    // 标记页面已经被隐藏过
    this.hasBeenHidden = true;
    
    // 记录隐藏时间
    this.lastHideTime = Date.now();
  },
  onUnload() {
    // 页面卸载时的清理
  },
  methods: {
    /**
     * 自动检查连接状态（智能缓存策略）
     */
    async autoCheckConnection() {
      try {
        this.isInitializing = true;
        
        // 记录检查时间
        this.lastCheckTime = Date.now();
        
        // 检查缓存的连接状态
        const cachedStatus = this.getCachedConnectionStatus();
        
        // 缓存策略：只有新鲜的在线状态才使用缓存，其他情况都实时检查
        if (cachedStatus.isValid && cachedStatus.isOnline && cachedStatus.ageMinutes < 1) {
          this.isOnline = cachedStatus.isOnline;
          
          // 即使使用缓存，也在后台验证一下
          setTimeout(() => {
            this.backgroundConnectionCheck();
          }, 1000);
          
          this.isInitializing = false;
          return;
        }
        
        // 其他情况都进行实时检查
        
        // 导入ENV_CONFIG
        const ENV_CONFIG = require('../../config/env.js').default || require('../../config/env.js');
        
        // 实时检查连接状态
        const response = await uni.request({
          url: `${ENV_CONFIG.AI_SERVICE_URL}/api/chat/health`,
          method: 'GET',
          timeout: 4000
        });
        
        if (response[1].statusCode === 200) {
          this.setConnectionStatus(true);
          
          // 通知AI聊天组件准备初始化
          this.$nextTick(() => {
            const chatComponent = this.$refs.aiChatComponent;
            if (chatComponent && !chatComponent.isConnected) {
              // AI聊天组件会在mounted时自动初始化，我们只需要确保状态同步
            }
          });
        } else {
          throw new Error(`HTTP ${response[1].statusCode}`);
        }
        
      } catch (error) {
        this.setConnectionStatus(false);
        
        // 不显示错误提示，只是静默设置为离线状态
        // 系统会在页面重新显示或用户发送消息时自动重新检查连接
      } finally {
        // 完成初始化
        setTimeout(() => {
          this.isInitializing = false;
        }, 500);
      }
    },

    /**
     * 获取缓存的连接状态
     */
    getCachedConnectionStatus() {
      try {
        const cached = uni.getStorageSync('ai_connection_status');
        if (!cached) {
          return { isValid: false };
        }
        
        const data = JSON.parse(cached);
        const now = new Date().getTime();
        const ageMinutes = (now - data.timestamp) / (1000 * 60);
        
        // 缓存有效期：在线状态3分钟，离线状态30秒
        const maxAge = data.isOnline ? 3 : 0.5;
        
        return {
          isValid: ageMinutes < maxAge,
          isOnline: data.isOnline,
          timestamp: data.timestamp,
          ageMinutes: ageMinutes
        };
      } catch (error) {
        return { isValid: false };
      }
    },

    /**
     * 设置连接状态并保存到缓存
     */
    setConnectionStatus(isOnline) {
      this.isOnline = isOnline;
      
      try {
        const statusData = {
          isOnline: isOnline,
          timestamp: new Date().getTime()
        };
        
        uni.setStorageSync('ai_connection_status', JSON.stringify(statusData));
      } catch (error) {
        console.error('❌ 保存连接状态失败:', error);
      }
    },

    /**
     * 强制连接检查（跳过缓存，用于页面重新显示时）
     */
    async forceConnectionCheck() {
      try {
        
        // 记录检查时间
        this.lastCheckTime = Date.now();
        
        // 导入ENV_CONFIG
        const ENV_CONFIG = require('../../config/env.js').default || require('../../config/env.js');
        
        // 显示一个很短的检查提示
        uni.showToast({
          title: '检查连接状态...',
          icon: 'loading',
          duration: 800,
          mask: false
        });
        
        const response = await uni.request({
          url: `${ENV_CONFIG.AI_SERVICE_URL}/api/chat/health`,
          method: 'GET',
          timeout: 5000
        });
        
        const newStatus = response[1].statusCode === 200;
        const previousStatus = this.isOnline;
        
        // 更新状态和缓存
        this.setConnectionStatus(newStatus);
        
        // 如果状态发生变化，给用户提示
        if (newStatus !== previousStatus) {
          const statusText = newStatus ? '已连接' : '已断开';
          const icon = newStatus ? 'success' : 'none';
          
          
          uni.hideToast();
          setTimeout(() => {
            uni.showToast({
              title: `AI客服${statusText}`,
              icon: icon,
              duration: 1500
            });
          }, 100);
          
          // 如果从离线变为在线，触发AI聊天组件重新连接
          if (newStatus && !previousStatus) {
            this.$nextTick(() => {
              const chatComponent = this.$refs.aiChatComponent;
              if (chatComponent) {
                chatComponent.reconnect();
              }
            });
          }
        } else {
          // 状态没变，简单提示当前状态
          uni.hideToast();
        }
        
      } catch (error) {
        const previousStatus = this.isOnline;
        
        // 连接失败，设为离线
        this.setConnectionStatus(false);
        
        uni.hideToast();
        
        // 如果之前是在线状态，现在检查失败，提示用户
        if (previousStatus) {
          setTimeout(() => {
            uni.showToast({
              title: 'AI客服已断开',
              icon: 'none',
              duration: 1500
            });
          }, 100);
        }
      }
    },

    /**
     * 后台验证连接状态（不影响UI）
     */
    async backgroundConnectionCheck() {
      try {
        const ENV_CONFIG = require('../../config/env.js').default || require('../../config/env.js');
        
        const response = await uni.request({
          url: `${ENV_CONFIG.AI_SERVICE_URL}/api/chat/health`,
          method: 'GET',
          timeout: 3000
        });
        
        const newStatus = response[1].statusCode === 200;
        if (newStatus !== this.isOnline) {
          this.setConnectionStatus(newStatus);
        } else {
          // 状态没变，只更新缓存时间戳
          this.setConnectionStatus(this.isOnline);
        }
      } catch (error) {
        // 后台检查失败，如果之前是在线状态，设为离线
        if (this.isOnline) {
          this.setConnectionStatus(false);
        }
      }
    },

    /**
     * 加载用户信息
     */
    loadUserInfo() {
      try {
        const user = uni.getStorageSync('user') || {};
        this.userInfo = {
          id: user.id || user._id || `guest_${Date.now()}`,
          nickname: user.username || user.nickname || '游客',
          avatar: user.avatar || '/static/img/default_avatar.png',
          phone: user.phone || '',
          email: user.email || '',
          // 添加当前页面上下文
          context: {
            fromPage: this.fromPage,
            timestamp: new Date().toISOString(),
            platform: 'mobile'
          }
        };
        
      } catch (error) {
        console.error('❌ 加载用户信息失败:', error);
        this.userInfo = {
          id: `guest_${Date.now()}`,
          nickname: '游客',
          avatar: '/static/img/default_avatar.png'
        };
      }
    },

    /**
     * 返回上一页
     */
    goBack() {
      // 尝试返回上一页，如果没有上一页则跳转到首页
      const pages = getCurrentPages();
      if (pages.length > 1) {
        uni.navigateBack();
      } else {
        uni.switchTab({
          url: '/pages/home/home'
        });
      }
    },

    /**
     * 连接状态变化
     */
    onConnectionChange(isConnected) {
      const previousState = this.isOnline;
      
      // 使用统一的状态设置方法（包含缓存）
      this.setConnectionStatus(isConnected);
      
      // 只在状态确实发生变化时处理
      if (previousState !== isConnected) {
        if (isConnected) {
          // 连接成功
          // 可以在这里添加连接成功的提示，但通常不需要打扰用户
        } else {
          // 连接断开
          // 只在用户正在使用时才显示断开提示
          if (!this.isInitializing) {
            uni.showToast({
              title: '连接已断开',
              icon: 'none',
              duration: 2000
            });
          }
        }
      }
    },

    /**
     * 聊天准备就绪
     */
    onChatReady() {
      this.isOnline = true;
    },





    /**
     * 显示聊天记录
     */
    showHistory() {
      uni.showModal({
        title: '聊天记录',
        content: '聊天记录功能开发中，敬请期待！',
        showCancel: false
      });
    },





  }
};
</script>

<style scoped lang="scss">
.ai-service-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

/* 自定义导航栏 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  padding-top: var(--status-bar-height);
  box-shadow: 0 2rpx 10rpx rgba(255, 107, 53, 0.3);
}

.navbar-content {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
}

.navbar-left {
  width: 80rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .back-icon {
    font-size: 32rpx;
    color: #fff;
    font-weight: bold;
  }
}

.navbar-title {
  flex: 1;
  text-align: center;
  
  text {
    font-size: 36rpx;
    font-weight: bold;
    color: #fff;
  }
}

.navbar-right {
  width: 120rpx;
  display: flex;
  justify-content: flex-end;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 12rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  
  .status-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: #ccc;
  }
  
  .status-text {
    font-size: 22rpx;
    color: #fff;
  }
  
  &.online {
    .status-dot {
      background: #52c41a;
      animation: pulse 2s infinite;
    }
  }
}

/* 聊天容器 */
.chat-container {
  flex: 1;
  margin-top: calc(88rpx + var(--status-bar-height));
  overflow: hidden;
}



/* 加载提示 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(248, 249, 250, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30rpx;
  
  text {
    font-size: 28rpx;
    color: #666;
  }
}

.loading-spinner {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid #f3f3f3;
  border-top: 6rpx solid #ff6b35;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 动画定义 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(50rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式适配 */
@media screen and (max-width: 375px) {
  .menu-items {
    grid-template-columns: repeat(2, 1fr);
    gap: 15rpx;
  }
  
  .menu-item {
    padding: 25rpx 15rpx;
    
    .item-icon {
      font-size: 40rpx;
    }
    
    .item-text {
      font-size: 24rpx;
    }
  }
}
</style>
