<template>
  <view class="video-player-page">
    <!-- 视频播放器 -->
    <video
      :src="videoData.url"
      :poster="videoData.poster"
      class="video-player"
      :autoplay="true"
      :controls="true"
      :show-fullscreen-btn="true"
      :show-play-btn="true"
      :show-center-play-btn="true"
      :enable-play-gesture="true"
      :direction="0"
      object-fit="contain"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
      @error="onError"
      @fullscreenchange="onFullscreenChange"
    ></video>
    
    <!-- 视频信息 -->
    <view class="video-info">
      <view class="video-title">
        <text>{{ videoData.title || '评论视频' }}</text>
      </view>
      <view class="video-meta">
        <text class="duration" v-if="videoData.duration">时长: {{ formatDuration(videoData.duration) }}</text>
        <text class="size" v-if="videoData.size">大小: {{ formatSize(videoData.size) }}</text>
      </view>
    </view>
    
    <!-- 控制按钮 -->
    <view class="control-buttons">
      <view class="control-btn" @click="togglePlay">
        <text class="btn-icon">{{ isPlaying ? '⏸️' : '▶️' }}</text>
        <text class="btn-text">{{ isPlaying ? '暂停' : '播放' }}</text>
      </view>
      
      <view class="control-btn" @click="onClose">
        <text class="btn-icon">❌</text>
        <text class="btn-text">关闭</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'VideoPlayer',
  data() {
    return {
      videoData: {
        url: '',
        poster: '',
        title: '',
        duration: 0,
        size: 0
      },
      isPlaying: false,
      videoContext: null
    }
  },
  onLoad() {
    this.loadVideoData();
    this.initVideoContext();
  },
  onReady() {
    // 隐藏导航栏获得更好的观看体验
    uni.hideNavigationBarLoading();
  },
  onUnload() {
    // 清理视频上下文
    if (this.videoContext) {
      this.videoContext.pause();
    }
  },
  methods: {
    /**
     * 加载视频数据
     */
    loadVideoData() {
      try {
        const tempVideoData = uni.getStorageSync('tempVideoData');
        if (tempVideoData) {
          this.videoData = tempVideoData;
          console.log('📹 视频数据加载成功:', this.videoData);
          
          // 设置页面标题
          if (this.videoData.title) {
            uni.setNavigationBarTitle({
              title: this.videoData.title
            });
          }
        } else {
          console.warn('⚠️ 未找到视频数据');
          uni.showToast({
            title: '视频数据加载失败',
            icon: 'none'
          });
          setTimeout(() => {
            uni.navigateBack();
          }, 2000);
        }
      } catch (error) {
        console.error('❌ 加载视频数据失败:', error);
        uni.showToast({
          title: '视频加载失败',
          icon: 'none'
        });
      }
    },

    /**
     * 初始化视频上下文
     */
    initVideoContext() {
      this.$nextTick(() => {
        this.videoContext = uni.createVideoContext('commentVideo', this);
      });
    },

    /**
     * 切换播放状态
     */
    togglePlay() {
      if (!this.videoContext) return;
      
      if (this.isPlaying) {
        this.videoContext.pause();
      } else {
        this.videoContext.play();
      }
    },

    /**
     * 格式化时长
     */
    formatDuration(duration) {
      if (!duration) return '00:00';
      
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    /**
     * 格式化文件大小
     */
    formatSize(size) {
      if (!size) return '';
      
      if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)}KB`;
      } else {
        return `${(size / (1024 * 1024)).toFixed(1)}MB`;
      }
    },

    /**
     * 关闭播放器
     */
    onClose() {
      // 暂停视频
      if (this.videoContext) {
        this.videoContext.pause();
      }
      
      // 清除临时数据
      try {
        uni.removeStorageSync('tempVideoData');
      } catch (error) {
        console.warn('清除临时视频数据失败:', error);
      }
      
      // 返回上一页
      uni.navigateBack();
    },

    /**
     * 视频播放事件
     */
    onPlay() {
      this.isPlaying = true;
      console.log('🎬 视频开始播放');
    },

    /**
     * 视频暂停事件
     */
    onPause() {
      this.isPlaying = false;
      console.log('⏸️ 视频暂停');
    },

    /**
     * 视频播放结束事件
     */
    onEnded() {
      this.isPlaying = false;
      console.log('🔚 视频播放结束');
      
      uni.showToast({
        title: '播放完成',
        icon: 'success'
      });
    },

    /**
     * 视频播放错误事件
     */
    onError(error) {
      console.error('❌ 视频播放错误:', error);
      this.isPlaying = false;
      
      uni.showModal({
        title: '播放错误',
        content: '视频播放出现错误，是否重新尝试？',
        success: (res) => {
          if (res.confirm && this.videoContext) {
            this.videoContext.play();
          } else {
            this.onClose();
          }
        }
      });
    },

    /**
     * 全屏状态变化事件
     */
    onFullscreenChange(event) {
      console.log('📱 全屏状态变化:', event);
      
      if (event.detail.fullScreen) {
        // 进入全屏
        uni.hideNavigationBar();
      } else {
        // 退出全屏
        uni.showNavigationBar();
      }
    }
  }
};
</script>

<style scoped lang="scss">
.video-player-page {
  width: 100%;
  height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
  
  .video-player {
    flex: 1;
    width: 100%;
  }
  
  .video-info {
    padding: 30rpx;
    background: rgba(255, 255, 255, 0.95);
    
    .video-title {
      margin-bottom: 15rpx;
      
      text {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
    }
    
    .video-meta {
      display: flex;
      gap: 30rpx;
      
      .duration, .size {
        font-size: 26rpx;
        color: #666;
      }
    }
  }
  
  .control-buttons {
    display: flex;
    padding: 30rpx;
    gap: 30rpx;
    background: rgba(255, 255, 255, 0.95);
    
    .control-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20rpx;
      background: #f8f8f8;
      border-radius: 16rpx;
      transition: all 0.3s ease;
      
      .btn-icon {
        font-size: 40rpx;
        margin-bottom: 8rpx;
      }
      
      .btn-text {
        font-size: 24rpx;
        color: #333;
      }
      
      &:active {
        background: #e8e8e8;
        transform: scale(0.95);
      }
    }
  }
}

/* 横屏适配 */
@media screen and (orientation: landscape) {
  .video-player-page {
    .video-info,
    .control-buttons {
      display: none;
    }
  }
}
</style>
