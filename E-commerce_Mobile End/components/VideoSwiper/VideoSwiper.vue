<template>
  <view class="video-swiper-container">
    <swiper 
      class="video-swiper"
      :current="currentIndex"
      :circular="false"
      :vertical="true"
      :indicator-dots="false"
      :autoplay="false"
      :duration="300"
      @change="onSwiperChange"
      @transition="onSwiperTransition"
      @animationfinish="onAnimationFinish"
    >
      <swiper-item 
        v-for="(video, index) in videoList" 
        :key="video.id"
        class="swiper-item"
      >
        <VideoItem 
          :video="video"
          :isActive="index === currentIndex"
          :isPreload="Math.abs(index - currentIndex) <= 1"
          @videoClick="onVideoClick"
          @likeClick="onLikeClick"
          @commentClick="onCommentClick"
          @shareClick="onShareClick"
          @authorClick="onAuthorClick"
          @followClick="onFollowClick"
        />
      </swiper-item>
    </swiper>
    
    <!-- 加载更多指示器 -->
    <view class="loading-indicator" v-if="isLoading">
      <view class="loading-text">加载中...</view>
    </view>
  </view>
</template>

<script>
import VideoItem from './VideoItem.vue'

export default {
  name: 'VideoSwiper',
  components: {
    VideoItem
  },
  props: {
    // 初始视频列表
    initialVideoList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      currentIndex: 0,
      videoList: [],
      isLoading: false,
      preloadedVideos: new Set(), // 预加载的视频ID集合
      playingVideos: new Set(), // 正在播放的视频ID集合
      touchStartY: 0,
      touchEndY: 0,
      isPageVisible: true, // 页面是否可见
      preloadCount: 2, // 预加载视频数量
      maxCacheCount: 10 // 最大缓存视频数量
    }
  },
  mounted() {
    this.initVideoList()
    this.setupPageVisibility()
    this.setupIntersectionObserver()
  },
  beforeDestroy() {
    this.cleanupPageVisibility()
    this.cleanupIntersectionObserver()
    this.pauseAllVideos()
  },
  methods: {
    // 初始化视频列表
    initVideoList() {
      if (this.initialVideoList.length > 0) {
        this.videoList = [...this.initialVideoList]
      } else {
        this.loadMoreVideos()
      }
    },
    
    // Swiper 切换事件
    onSwiperChange(e) {
      const newIndex = e.detail.current
      const oldIndex = this.currentIndex
      this.currentIndex = newIndex
      
      // 暂停上一个视频
      this.pauseVideo(oldIndex)
      
      // 播放当前视频
      this.playVideo(newIndex)
      
      // 预加载相邻视频
      this.preloadAdjacentVideos(newIndex)
      
      // 清理远程缓存
      this.cleanupDistantVideos(newIndex)
      
      // 接近列表末尾时加载更多
      if (newIndex >= this.videoList.length - 2) {
        this.loadMoreVideos()
      }
      
      this.$emit('videoChange', {
        currentVideo: this.videoList[newIndex],
        currentIndex: newIndex,
        oldIndex: oldIndex
      })
    },
    
    // Swiper 过渡动画
    onSwiperTransition(e) {
      // 可以在这里添加过渡动画效果
    },
    
    // 动画完成
    onAnimationFinish(e) {
      // 动画完成后的处理
    },
    
    // 预加载相邻视频
    preloadAdjacentVideos(index) {
      const preloadIndexes = []
      
      // 预加载当前和相邻视频
      for (let i = index - this.preloadCount; i <= index + this.preloadCount; i++) {
        if (i >= 0 && i < this.videoList.length) {
          preloadIndexes.push(i)
        }
      }
      
      preloadIndexes.forEach(i => {
        const video = this.videoList[i]
        if (video && !this.preloadedVideos.has(video.id)) {
          this.preloadVideo(video, i)
          this.preloadedVideos.add(video.id)
        }
      })
    },
    
    // 预加载视频
    preloadVideo(video, index) {
      try {
        // 创建视频元素进行预加载
        const videoContext = uni.createVideoContext(`video_${video.id}`, this)
        if (videoContext) {
          // 预加载但不播放
          videoContext.seek(0)
          
          // 如果是当前视频，则立即播放
          if (index === this.currentIndex) {
            this.$nextTick(() => {
              this.playVideo(index)
            })
          }
        }
      } catch (error) {
        console.warn(`预加载视频失败: ${video.id}`, error)
      }
    },
    
    // 加载更多视频
    async loadMoreVideos() {
      if (this.isLoading) return
      
      this.isLoading = true
      
      try {
        // 模拟API调用 - 这里替换为实际的API请求
        const newVideos = await this.fetchVideos()
        this.videoList = [...this.videoList, ...newVideos]
      } catch (error) {
        console.error('加载视频失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.isLoading = false
      }
    },
    
    // 模拟获取视频数据 - 替换为实际API
    async fetchVideos() {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockVideos = []
          for (let i = 0; i < 5; i++) {
            mockVideos.push({
              id: Date.now() + i,
              url: `/static/videos/video${(i % 3) + 1}.mp4`,
              poster: `/static/img/video_poster_${(i % 3) + 1}.jpg`,
              title: `精彩视频 ${this.videoList.length + i + 1}`,
              description: '这是一个非常有趣的短视频内容描述...',
              author: {
                id: i + 1,
                nickname: `用户${this.videoList.length + i + 1}`,
                avatar: `/static/img/avatar_${(i % 5) + 1}.jpg`,
                isFollowed: false
              },
              stats: {
                likes: Math.floor(Math.random() * 10000),
                comments: Math.floor(Math.random() * 1000),
                shares: Math.floor(Math.random() * 500),
                isLiked: false
              }
            })
          }
          resolve(mockVideos)
        }, 1000)
      })
    },
    
    // 视频点击事件（播放/暂停）
    onVideoClick(video) {
      this.$emit('videoClick', video)
    },
    
    // 点赞事件
    onLikeClick(video) {
      const targetVideo = this.videoList.find(v => v.id === video.id)
      if (targetVideo) {
        targetVideo.stats.isLiked = !targetVideo.stats.isLiked
        targetVideo.stats.likes += targetVideo.stats.isLiked ? 1 : -1
      }
      this.$emit('likeClick', video)
    },
    
    // 评论事件
    onCommentClick(video) {
      this.$emit('commentClick', video)
    },
    
    // 分享事件
    onShareClick(video) {
      this.$emit('shareClick', video)
    },
    
    // 作者点击事件
    onAuthorClick(author) {
      this.$emit('authorClick', author)
    },
    
    // 关注点击事件
    onFollowClick(author) {
      this.$emit('followClick', author)
    },
    
    // 设置页面可见性监听
    setupPageVisibility() {
      uni.onAppShow(() => {
        this.isPageVisible = true
        // 应用恢复时恢复当前视频播放
        this.$nextTick(() => {
          this.resumeCurrentVideo()
        })
      })
      
      uni.onAppHide(() => {
        this.isPageVisible = false
        // 应用隐藏时暂停所有视频
        this.pauseAllVideos()
      })
      
      // H5环境下的页面可见性监听
      // #ifdef H5
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.isPageVisible = false
          this.pauseAllVideos()
        } else {
          this.isPageVisible = true
          this.resumeCurrentVideo()
        }
      })
      // #endif
    },
    
    // 清理页面可见性监听
    cleanupPageVisibility() {
      // uni-app 会自动清理
    },
    
    // 恢复当前视频播放
    resumeCurrentVideo() {
      if (!this.isPageVisible) return
      
      const currentVideo = this.videoList[this.currentIndex]
      if (currentVideo) {
        this.playVideo(this.currentIndex)
      }
    },
    
    // 暂停所有视频
    pauseAllVideos() {
      this.videoList.forEach((video, index) => {
        this.pauseVideo(index)
      })
      this.playingVideos.clear()
    },
    
    // 播放指定视频
    playVideo(index) {
      if (!this.isPageVisible || index < 0 || index >= this.videoList.length) return
      
      const video = this.videoList[index]
      if (!video) return
      
      try {
        const videoContext = uni.createVideoContext(`video_${video.id}`, this)
        if (videoContext) {
          videoContext.play()
          this.playingVideos.add(video.id)
        }
      } catch (error) {
        console.warn(`播放视频失败: ${video.id}`, error)
      }
    },
    
    // 暂停指定视频
    pauseVideo(index) {
      if (index < 0 || index >= this.videoList.length) return
      
      const video = this.videoList[index]
      if (!video) return
      
      try {
        const videoContext = uni.createVideoContext(`video_${video.id}`, this)
        if (videoContext) {
          videoContext.pause()
          this.playingVideos.delete(video.id)
        }
      } catch (error) {
        console.warn(`暂停视频失败: ${video.id}`, error)
      }
    },
    
    // 清理远程缓存
    cleanupDistantVideos(currentIndex) {
      const videosToCleanup = []
      
      this.preloadedVideos.forEach(videoId => {
        const videoIndex = this.videoList.findIndex(v => v.id === videoId)
        if (videoIndex !== -1 && Math.abs(videoIndex - currentIndex) > this.maxCacheCount) {
          videosToCleanup.push(videoId)
        }
      })
      
      videosToCleanup.forEach(videoId => {
        this.preloadedVideos.delete(videoId)
        // 这里可以添加更多清理逻辑，比如释放内存
      })
    },
    
    // 设置交叉观察器（用于更精确的可见性检测）
    setupIntersectionObserver() {
      // #ifdef H5
      if (typeof IntersectionObserver !== 'undefined') {
        this.intersectionObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              const videoId = entry.target.dataset.videoId
              if (entry.isIntersecting) {
                // 视频进入可视区域
                this.onVideoEnterViewport(videoId)
              } else {
                // 视频离开可视区域
                this.onVideoLeaveViewport(videoId)
              }
            })
          },
          {
            threshold: 0.5 // 视频显示50%以上时触发
          }
        )
      }
      // #endif
    },
    
    // 清理交叉观察器
    cleanupIntersectionObserver() {
      // #ifdef H5
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect()
        this.intersectionObserver = null
      }
      // #endif
    },
    
    // 视频进入可视区域
    onVideoEnterViewport(videoId) {
      const videoIndex = this.videoList.findIndex(v => v.id === videoId)
      if (videoIndex !== -1 && videoIndex === this.currentIndex) {
        this.playVideo(videoIndex)
      }
    },
    
    // 视频离开可视区域
    onVideoLeaveViewport(videoId) {
      const videoIndex = this.videoList.findIndex(v => v.id === videoId)
      if (videoIndex !== -1) {
        this.pauseVideo(videoIndex)
      }
    },
    
    // 跳转到指定视频
    goToVideo(index) {
      if (index >= 0 && index < this.videoList.length) {
        const oldIndex = this.currentIndex
        this.currentIndex = index
        
        // 暂停原视频，播放新视频
        this.pauseVideo(oldIndex)
        this.playVideo(index)
        
        // 预加载相邻视频
        this.preloadAdjacentVideos(index)
      }
    },
    
    // 获取视频播放状态
    getVideoPlayState(videoId) {
      return this.playingVideos.has(videoId)
    },
    
    // 强制刷新当前视频
    refreshCurrentVideo() {
      const currentVideo = this.videoList[this.currentIndex]
      if (currentVideo) {
        this.pauseVideo(this.currentIndex)
        this.$nextTick(() => {
          this.playVideo(this.currentIndex)
        })
      }
    },
    
    // 获取缓存状态
    getCacheStatus() {
      return {
        preloadedCount: this.preloadedVideos.size,
        playingCount: this.playingVideos.size,
        totalVideos: this.videoList.length,
        currentIndex: this.currentIndex
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import './VideoSwiper.scss';
</style>
