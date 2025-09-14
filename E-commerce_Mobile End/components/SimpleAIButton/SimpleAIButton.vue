<template>
  <!-- 简化版AI客服浮动按钮 -->
  <view 
    class="simple-ai-button" 
    @click="goToAIService"
    :style="buttonStyle">
    <text class="ai-icon">🤖</text>
    <text class="ai-text">客服</text>
  </view>
</template>

<script>
export default {
  name: 'SimpleAIButton',
  props: {
    // 页面标识
    pageId: {
      type: String,
      default: 'unknown'
    }
  },
  computed: {
    buttonStyle() {
      return {
        position: 'fixed',
        bottom: '150px',
        right: '15px',
        width: '60px',
        height: '60px',
        backgroundColor: '#ff4757',
        borderRadius: '30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(255, 71, 87, 0.4)',
        zIndex: '9999',
        cursor: 'pointer',
        border: '2px solid #fff'
      };
    }
  },
  mounted() {
    console.log('✅ 简化版AI按钮已挂载，页面:', this.pageId);
  },
  methods: {
    goToAIService() {
      console.log('🤖 简化版AI按钮被点击，页面:', this.pageId);
      
      try {
        // 跳转到AI客服页面
        uni.navigateTo({
          url: `/pages/AICustomerService/AICustomerService?from=${this.pageId}`,
          success: () => {
            console.log('✅ 成功跳转到AI客服页面');
          },
          fail: (error) => {
            console.error('❌ 跳转失败:', error);
            
            // 降级处理
            uni.showModal({
              title: '联系客服',
              content: '客服热线：400-123-4567\n服务时间：9:00-21:00',
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
          }
        });
      } catch (error) {
        console.error('❌ AI客服功能异常:', error);
        
        uni.showToast({
          title: '客服功能暂时不可用',
          icon: 'none',
          duration: 2000
        });
      }
    }
  }
};
</script>

<style scoped>
.simple-ai-button {
  /* 样式通过computed属性内联设置，确保最高优先级 */
}

.ai-icon {
  font-size: 24px;
  line-height: 1;
  margin-bottom: 2px;
}

.ai-text {
  font-size: 10px;
  color: white;
  font-weight: bold;
  line-height: 1;
}

/* 响应式处理 */
@media screen and (max-width: 375px) {
  .ai-icon {
    font-size: 20px;
  }
  
  .ai-text {
    font-size: 9px;
  }
}
</style>
