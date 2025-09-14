<template>
  <view class="test-page">
    <view class="header">
      <text>AI浮动按钮测试页面</text>
    </view>
    
    <view class="content">
      <text>这是一个测试页面，用于验证AI浮动按钮是否正常显示</text>
      
      <view class="info-box">
        <text>请查看右下角是否有红色的AI客服浮动按钮</text>
      </view>
      
      <view class="debug-info">
        <text>调试信息：</text>
        <text>- 检查浏览器控制台是否有错误</text>
        <text>- 确认AI浮动按钮组件已正确挂载</text>
        <text>- 验证z-index层级设置</text>
      </view>
    </view>
    
    <!-- AI客服浮动按钮 -->
    <ai-float-button 
      :visible="true"
      position="bottom-right"
      page-id="test"
      @click="onAIServiceClick"
    ></ai-float-button>
  </view>
</template>

<script>
import AIFloatButton from '../components/AIFloatButton/AIFloatButton.vue';

export default {
  name: 'TestAIButton',
  components: {
    AIFloatButton
  },
  data() {
    return {
      testData: 'AI按钮测试'
    };
  },
  onLoad() {
    console.log('🧪 测试页面加载');
  },
  methods: {
    onAIServiceClick(data) {
      console.log('🤖 测试页面AI客服按钮被点击:', data);
      
      uni.showModal({
        title: '测试成功',
        content: 'AI浮动按钮点击事件正常工作！',
        showCancel: false
      });
    }
  }
};
</script>

<style scoped lang="scss">
.test-page {
  min-height: 100vh;
  padding: 40rpx;
  background: #f5f5f5;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
  
  text {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

.content {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
  
  text {
    font-size: 28rpx;
    color: #666;
    line-height: 1.5;
  }
}

.info-box {
  padding: 30rpx;
  background: #e3f2fd;
  border-left: 6rpx solid #2196f3;
  border-radius: 8rpx;
  
  text {
    color: #1976d2;
    font-size: 26rpx;
  }
}

.debug-info {
  padding: 30rpx;
  background: #fff3e0;
  border-left: 6rpx solid #ff9800;
  border-radius: 8rpx;
  
  text {
    display: block;
    margin-bottom: 15rpx;
    color: #f57c00;
    font-size: 24rpx;
    
    &:first-child {
      font-weight: bold;
      margin-bottom: 20rpx;
    }
  }
}
</style>
