<template>
  <view class="ai-float-button" v-if="showButton" @click="openAIService">
    <view class="float-btn-content" :class="{ shake: isShaking }">
      <text class="btn-icon">🤖</text>
      <text class="btn-text">AI客服</text>
      <view class="notification-badge" v-if="hasNotification">
        <text class="badge-text">!</text>
      </view>
    </view>
    
    <!-- 提示气泡 -->
    <view class="hint-bubble" v-if="showHint">
      <text class="hint-text">{{ hintText }}</text>
      <view class="bubble-arrow"></view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'AIFloatButton',
  props: {
    // 是否显示按钮
    visible: {
      type: Boolean,
      default: true
    },
    // 按钮位置 bottom-right, bottom-left, top-right, top-left
    position: {
      type: String,
      default: 'bottom-right'
    },
    // 自定义样式
    customStyle: {
      type: Object,
      default: () => ({})
    },
    // 页面标识（用于统计）
    pageId: {
      type: String,
      default: 'unknown'
    }
  },
  data() {
    return {
      showButton: true,
      isShaking: false,
      hasNotification: false,
      showHint: false,
      hintText: '有问题？点我咨询～',
      shakeTimer: null,
      hintTimer: null
    };
  },
  mounted() {
    console.log('🤖 AI浮动按钮组件已挂载', {
      visible: this.visible,
      position: this.position,
      pageId: this.pageId
    });
    this.initButton();
  },
  beforeDestroy() {
    // 清理定时器
    if (this.shakeTimer) clearInterval(this.shakeTimer);
    if (this.hintTimer) clearTimeout(this.hintTimer);
  },
  methods: {
    /**
     * 初始化按钮
     */
    initButton() {
      this.showButton = this.visible;
      console.log('🤖 AI浮动按钮初始化', {
        showButton: this.showButton,
        visible: this.visible
      });
      
      // 延迟显示提示
      this.hintTimer = setTimeout(() => {
        this.showHintBubble();
      }, 3000);
      
      // 定期震动提醒
      this.shakeTimer = setInterval(() => {
        this.shakeButton();
      }, 30000); // 每30秒震动一次
    },

    /**
     * 显示提示气泡
     */
    showHintBubble() {
      this.showHint = true;
      
      // 5秒后自动隐藏
      setTimeout(() => {
        this.showHint = false;
      }, 5000);
    },

    /**
     * 震动按钮
     */
    shakeButton() {
      this.isShaking = true;
      setTimeout(() => {
        this.isShaking = false;
      }, 1000);
    },

    /**
     * 设置通知状态
     */
    setNotification(hasNotification, text = '有新消息') {
      this.hasNotification = hasNotification;
      if (hasNotification) {
        this.hintText = text;
        this.showHintBubble();
        this.shakeButton();
      }
    },

    /**
     * 打开AI客服
     */
    openAIService() {
      // 隐藏提示和通知
      this.showHint = false;
      this.hasNotification = false;
      
      try {
        // 记录点击统计
        this.recordClick();
        
        // 跳转到AI客服页面
        uni.navigateTo({
          url: `/pages/AICustomerService/AICustomerService?from=${this.pageId}`,
          success: () => {
            console.log('✅ 成功跳转到AI客服页面');
            
            // 触发点击事件
            this.$emit('click', {
              pageId: this.pageId,
              timestamp: new Date().toISOString()
            });
          },
          fail: (error) => {
            console.error('❌ 跳转AI客服页面失败:', error);
            
            // 降级处理：显示联系方式
            this.showContactInfo();
          }
        });
      } catch (error) {
        console.error('❌ 打开AI客服失败:', error);
        this.showContactInfo();
      }
    },

    /**
     * 记录点击统计
     */
    recordClick() {
      try {
        const clickData = {
          pageId: this.pageId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent || 'unknown'
        };
        
        // 保存到本地存储用于统计
        const existingClicks = uni.getStorageSync('ai_service_clicks') || [];
        existingClicks.push(clickData);
        
        // 只保留最近100条记录
        if (existingClicks.length > 100) {
          existingClicks.splice(0, existingClicks.length - 100);
        }
        
        uni.setStorageSync('ai_service_clicks', existingClicks);
        
        console.log('📊 AI客服点击已记录:', clickData);
      } catch (error) {
        console.warn('⚠️ 记录点击统计失败:', error);
      }
    },

    /**
     * 显示联系信息（降级处理）
     */
    showContactInfo() {
      uni.showModal({
        title: '联系客服',
        content: '客服热线：400-123-4567\n服务时间：9:00-21:00\n\n或者您可以在商品页面点击客服按钮进行咨询',
        confirmText: '拨打电话',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            uni.makePhoneCall({
              phoneNumber: '400-123-4567'
            });
          }
        }
      });
    },

    /**
     * 隐藏按钮
     */
    hide() {
      this.showButton = false;
    },

    /**
     * 显示按钮  
     */
    show() {
      this.showButton = true;
    }
  }
};
</script>

<style scoped lang="scss">
.ai-float-button {
  position: fixed;
  z-index: 10000;
  
  /* 默认位置：右下角，避开TabBar */
  bottom: 150rpx;
  right: 30rpx;
  
  /* 其他位置样式 */
  &.bottom-left {
    bottom: 150rpx;
    left: 30rpx;
    right: auto;
  }
  
  &.top-right {
    top: 200rpx;
    right: 30rpx;
    bottom: auto;
  }
  
  &.top-left {
    top: 200rpx;
    left: 30rpx;
    right: auto;
    bottom: auto;
  }
}

.float-btn-content {
  width: 130rpx;
  height: 130rpx;
  background: linear-gradient(135deg, #ff4757 0%, #ff3742 100%);
  border-radius: 65rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 40rpx rgba(255, 71, 87, 0.6);
  transition: all 0.3s ease;
  position: relative;
  border: 3rpx solid #fff;
  
  .btn-icon {
    font-size: 36rpx;
    margin-bottom: 4rpx;
  }
  
  .btn-text {
    font-size: 20rpx;
    color: #fff;
    font-weight: 500;
  }
  
  .notification-badge {
    position: absolute;
    top: -5rpx;
    right: -5rpx;
    width: 30rpx;
    height: 30rpx;
    background: #ff4757;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3rpx solid #fff;
    
    .badge-text {
      font-size: 18rpx;
      color: #fff;
      font-weight: bold;
    }
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &.shake {
    animation: shake 0.5s ease-in-out infinite;
  }
}

.hint-bubble {
  position: absolute;
  bottom: 140rpx;
  right: 0;
  width: 200rpx;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 15rpx 20rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  text-align: center;
  animation: bubbleIn 0.3s ease-out;
  
  .hint-text {
    line-height: 1.4;
  }
  
  .bubble-arrow {
    position: absolute;
    bottom: -10rpx;
    right: 20rpx;
    width: 0;
    height: 0;
    border-left: 10rpx solid transparent;
    border-right: 10rpx solid transparent;
    border-top: 10rpx solid rgba(0, 0, 0, 0.8);
  }
}

/* 动画定义 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5rpx); }
  75% { transform: translateX(5rpx); }
}

@keyframes bubbleIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 响应式适配 */
@media screen and (max-width: 375px) {
  .float-btn-content {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50rpx;
    
    .btn-icon {
      font-size: 32rpx;
    }
    
    .btn-text {
      font-size: 18rpx;
    }
  }
  
  .hint-bubble {
    width: 180rpx;
    font-size: 22rpx;
    padding: 12rpx 16rpx;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .hint-bubble {
    background: rgba(255, 255, 255, 0.9);
    color: #333;
    
    .bubble-arrow {
      border-top-color: rgba(255, 255, 255, 0.9);
    }
  }
}
</style>
