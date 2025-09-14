<template>
  <view class="video-item">
    <!-- 视频容器 -->
    <view class="video-container" @click="handleVideoClick">
      <video
        :id="`video_${video.id}`"
        :src="video.url"
        :poster="video.poster"
        :autoplay="isActive"
        :loop="true"
        :muted="false"
        :show-center-play-btn="false"
        :show-play-btn="false"
        :show-fullscreen-btn="false"
        :show-progress="false"
        :show-loading="true"
        :enable-progress-gesture="false"
        :object-fit="'cover'"
        class="video-player"
        @play="onVideoPlay"
        @pause="onVideoPause"
        @ended="onVideoEnded"
        @error="onVideoError"
        @loadstart="onVideoLoadStart"
        @loadeddata="onVideoLoaded"
      ></video>
      
      <!-- 播放按钮遮罩 -->
      <view class="play-mask" v-if="showPlayButton" @click.stop="togglePlay">
        <view class="play-btn">
          <text>▶</text>
        </view>
      </view>
      
      <!-- 加载指示器 -->
      <view class="loading-mask" v-if="isLoading">
        <view class="loading-spinner"></view>
      </view>
    </view>
    
    <!-- 右侧操作栏 -->
    <view class="right-controls">
      <!-- 作者头像 -->
      <view class="author-info" @click="handleAuthorClick">
        <image class="avatar" :src="video.author.avatar" mode="aspectFill"></image>
        <view class="vip-badge" v-if="video.author.isVip">
          <text class="vip-icon">V</text>
        </view>
        <view class="follow-btn" :class="{ followed: video.author.isFollowed }" v-if="!video.author.isFollowed" @click.stop="handleFollowClick">
          <text>+</text>
        </view>
      </view>
      
      <!-- 点赞 -->
      <view class="control-item" @click="handleLikeClick">
        <view class="control-icon" :class="{ active: video.stats.isLiked }">
          <text class="cuIcon-like" :class="video.stats.isLiked ? 'cuIcon-likefill' : 'cuIcon-like'">{{ video.stats.isLiked ? '❤️' : '🤍' }}</text>
        </view>
        <text class="control-text">{{ formatCount(video.stats.likes) }}</text>
      </view>
      
      <!-- 评论 -->
      <view class="control-item" @click="handleCommentClick">
        <view class="control-icon">
          <text>💬</text>
        </view>
        <text class="control-text">{{ formatCount(video.stats.comments) }}</text>
      </view>
      
      <!-- 分享 -->
      <view class="control-item" @click="handleShareClick">
        <view class="control-icon">
          <text>📤</text>
        </view>
        <text class="control-text">{{ formatCount(video.stats.shares) }}</text>
      </view>
      
      <!-- 更多操作 -->
      <view class="control-item" @click="handleMoreClick">
        <view class="control-icon">
          <text>⋯</text>
        </view>
      </view>
      
      <!-- 音乐转盘 -->
      <view class="control-item music-disc" @click="handleMusicClick" v-if="video.music">
        <view class="music-icon">
          <image class="disc-image" :src="video.author.avatar" mode="aspectFill" :class="{ spinning: isPlaying }"></image>
          <text class="music-note">♫</text>
        </view>
      </view>
    </view>
    
    <!-- 底部信息区域 -->
    <view class="bottom-info">
      <!-- 作者昵称 -->
      <view class="author-name" @click="handleAuthorClick">
        <text>@{{ video.author.nickname }}</text>
      </view>
      
      <!-- 视频描述 -->
      <view class="video-description">
        <text class="description-text" :class="{ expanded: isDescExpanded }">
          {{ video.description }}
        </text>
        <text class="expand-btn" v-if="isLongDescription" @click="toggleDescription">
          {{ isDescExpanded ? '收起' : '展开' }}
        </text>
      </view>
      
      <!-- 标签（如果有） -->
      <view class="video-tags" v-if="video.tags && video.tags.length">
        <text class="tag" v-for="tag in video.tags" :key="tag">
          #{{ tag }}
        </text>
      </view>
      
      <!-- 音乐信息（如果有） -->
      <view class="music-info" v-if="video.music" @click="handleMusicClick">
        <text class="music-icon spinning">🎵</text>
        <text class="music-name marquee">{{ video.music.name }} - {{ video.music.author }}</text>
      </view>
      
      <!-- 位置信息（如果有） -->
      <view class="location-info" v-if="video.location" @click="handleLocationClick">
        <text>📍</text>
        <text class="location-name">{{ video.location }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'VideoItem',
  props: {
    video: {
      type: Object,
      required: true
    },
    isActive: {
      type: Boolean,
      default: false
    },
    isPreload: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isPlaying: false,
      showPlayButton: false,
      isLoading: false,
      isDescExpanded: false,
      videoContext: null
    }
  },
  computed: {
    isLongDescription() {
      return this.video.description && this.video.description.length > 50
    }
  },
  watch: {
    isActive: {
      handler(newVal) {
        this.$nextTick(() => {
          if (newVal) {
            this.playVideo()
          } else {
            this.pauseVideo()
          }
        })
      },
      immediate: true
    }
  },
  mounted() {
    this.initVideoContext()
  },
  beforeDestroy() {
    this.cleanupVideo()
  },
  methods: {
    // 初始化视频上下文
    initVideoContext() {
      this.videoContext = uni.createVideoContext(`video_${this.video.id}`, this)
    },
    
    // 播放视频
    playVideo() {
      if (this.videoContext && this.isActive) {
        this.videoContext.play()
        this.isPlaying = true
        this.showPlayButton = false
      }
    },
    
    // 暂停视频
    pauseVideo() {
      if (this.videoContext) {
        this.videoContext.pause()
        this.isPlaying = false
        this.showPlayButton = true
      }
    },
    
    // 切换播放状态
    togglePlay() {
      if (this.isPlaying) {
        this.pauseVideo()
      } else {
        this.playVideo()
      }
    },
    
    // 视频点击处理
    handleVideoClick() {
      this.togglePlay()
      this.$emit('videoClick', this.video)
    },
    
    // 点赞点击处理
    handleLikeClick() {
      this.$emit('likeClick', this.video)
      
      // 添加点赞动画效果
      this.showLikeAnimation()
    },
    
    // 评论点击处理
    handleCommentClick() {
      this.$emit('commentClick', this.video)
    },
    
    // 分享点击处理
    handleShareClick() {
      this.$emit('shareClick', this.video)
    },
    
    // 作者点击处理
    handleAuthorClick() {
      this.$emit('authorClick', this.video.author)
    },
    
    // 关注点击处理
    handleFollowClick() {
      this.$emit('followClick', this.video.author)
      // 添加关注动画效果
      this.showFollowAnimation()
    },
    
    // 更多操作
    handleMoreClick() {
      uni.showActionSheet({
        itemList: ['举报', '不感兴趣', '保存到相册', '复制链接'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.reportVideo()
          } else if (res.tapIndex === 1) {
            this.hideVideo()
          } else if (res.tapIndex === 2) {
            this.saveToAlbum()
          } else if (res.tapIndex === 3) {
            this.copyLink()
          }
        }
      })
    },
    
    // 音乐点击处理
    handleMusicClick() {
      uni.showToast({
        title: '音乐功能开发中',
        icon: 'none'
      })
    },
    
    // 位置点击处理
    handleLocationClick() {
      uni.showToast({
        title: '查看位置',
        icon: 'none'
      })
    },
    
    // 切换描述展开状态
    toggleDescription() {
      this.isDescExpanded = !this.isDescExpanded
    },
    
    // 显示点赞动画
    showLikeAnimation() {
      // 创建点赞动画元素
      const animation = uni.createAnimation({
        duration: 800,
        timingFunction: 'ease-out'
      })
      
      // 这里可以添加具体的动画实现
      console.log('点赞动画')
    },
    
    // 显示关注动画
    showFollowAnimation() {
      // 添加关注成功的视觉反馈
      uni.showToast({
        title: '关注成功',
        icon: 'success',
        duration: 1000
      })
    },
    
    // 举报视频
    reportVideo() {
      uni.showToast({
        title: '举报成功',
        icon: 'success'
      })
    },
    
    // 隐藏视频
    hideVideo() {
      uni.showToast({
        title: '已设为不感兴趣',
        icon: 'success'
      })
    },
    
    // 保存到相册
    saveToAlbum() {
      uni.showToast({
        title: '保存功能开发中',
        icon: 'none'
      })
    },
    
    // 复制链接
    copyLink() {
      uni.setClipboardData({
        data: `https://example.com/video/${this.video.id}`,
        success: () => {
          uni.showToast({
            title: '链接已复制',
            icon: 'success'
          })
        }
      })
    },
    
    // 格式化数字显示
    formatCount(count) {
      if (count < 1000) return count.toString()
      if (count < 10000) return (count / 1000).toFixed(1) + 'k'
      if (count < 100000) return (count / 10000).toFixed(1) + 'w'
      return (count / 10000).toFixed(0) + 'w'
    },
    
    // 视频事件处理
    onVideoPlay() {
      this.isPlaying = true
      this.showPlayButton = false
      this.isLoading = false
    },
    
    onVideoPause() {
      this.isPlaying = false
      this.showPlayButton = true
    },
    
    onVideoEnded() {
      // 视频结束时重新播放（循环）
      if (this.isActive) {
        this.videoContext.seek(0)
        this.videoContext.play()
      }
    },
    
    onVideoError(e) {
      console.error('视频播放错误:', e)
      this.isLoading = false
      uni.showToast({
        title: '视频加载失败',
        icon: 'none'
      })
    },
    
    onVideoLoadStart() {
      this.isLoading = true
    },
    
    onVideoLoaded() {
      this.isLoading = false
    },
    
    // 清理视频资源
    cleanupVideo() {
      if (this.videoContext) {
        this.videoContext.pause()
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import './VideoItem.scss';
</style>
