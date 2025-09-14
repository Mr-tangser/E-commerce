<template>
	<view class="short-video-page">
		<!-- 顶部状态栏 -->
		<view class="status-bar"></view>
		
		<!-- 顶部工具栏 -->
		<view class="top-toolbar">
			<view class="toolbar-left">
				<view class="live-badge" @click="onLiveClick">
					<text class="live-dot"></text>
					<text class="live-text">直播</text>
				</view>
			</view>
			<view class="toolbar-center">
				<view class="nav-tabs">
					<text class="nav-tab" :class="{ active: currentTab === 'recommend' }" @click="switchTab('recommend')">推荐</text>
					<text class="nav-tab" :class="{ active: currentTab === 'follow' }" @click="switchTab('follow')">关注</text>
				</view>
			</view>
			<view class="toolbar-right">
				<view class="search-btn" @click="onSearchClick">
					<text>🔍</text>
				</view>
			</view>
		</view>

		<!-- 简化的视频容器 -->
		<view class="video-container">
			<swiper class="video-swiper" :vertical="true" :indicator-dots="false" @change="onSwiperChange">
				<swiper-item v-for="(video, index) in videoList" :key="video.id" class="swiper-item">
					<view class="video-item">
						<!-- 视频区域（暂时用色块代替） -->
						<view class="video-placeholder" :style="{ backgroundColor: video.bgColor }">
							<text class="video-title">{{ video.title }}</text>
							<view class="play-btn" @click="togglePlay(index)">
								<text>{{ isPlaying[index] ? '⏸️' : '▶️' }}</text>
							</view>
						</view>
						
						<!-- 右侧操作栏 -->
						<view class="right-controls">
							<!-- 作者头像 -->
							<view class="author-info" @click="handleAuthorClick(video.author)">
								<view class="avatar" :style="{ backgroundColor: video.author.avatarColor }">
									<text>{{ video.author.nickname.charAt(0) }}</text>
								</view>
								<view class="follow-btn" v-if="!video.author.isFollowed" @click.stop="handleFollowClick(video.author)">
									<text>+</text>
								</view>
							</view>
							
							<!-- 点赞 -->
							<view class="control-item" @click="handleLikeClick(video)">
								<view class="control-icon" :class="{ active: video.stats.isLiked }">
									<text>{{ video.stats.isLiked ? '❤️' : '🤍' }}</text>
								</view>
								<text class="control-text">{{ formatCount(video.stats.likes) }}</text>
							</view>
							
							<!-- 评论 -->
							<view class="control-item" @click="handleCommentClick(video)">
								<view class="control-icon">
									<text>💬</text>
								</view>
								<text class="control-text">{{ formatCount(video.stats.comments) }}</text>
							</view>
							
							<!-- 分享 -->
							<view class="control-item" @click="handleShareClick(video)">
								<view class="control-icon">
									<text>📤</text>
								</view>
								<text class="control-text">{{ formatCount(video.stats.shares) }}</text>
							</view>
						</view>
						
						<!-- 底部信息区域 -->
						<view class="bottom-info">
							<view class="author-name">
								<text>@{{ video.author.nickname }}</text>
							</view>
							<view class="video-description">
								<text>{{ video.description }}</text>
							</view>
							<view class="video-tags" v-if="video.tags && video.tags.length">
								<text class="tag" v-for="tag in video.tags" :key="tag">#{{ tag }}</text>
							</view>
						</view>
					</view>
				</swiper-item>
			</swiper>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			currentTab: 'recommend',
			videoList: [],
			isPlaying: {}
		}
	},
	onLoad() {
		this.initVideoData()
	},
	onReady() {
		uni.hideTabBar()
		this.setStatusBarStyle()
	},
	methods: {
		setStatusBarStyle() {
			uni.setNavigationBarColor({
				frontColor: '#ffffff',
				backgroundColor: '#000000',
				animation: {
					duration: 400,
					timingFunc: 'easeIn'
				}
			})
		},
		
		initVideoData() {
			this.videoList = [
				{
					id: 1,
					title: '时尚穿搭分享',
					description: '今天给大家分享一套超级好看的秋季穿搭，简约又不失时尚感！',
					bgColor: '#ff6b6b',
					author: {
						id: 1,
						nickname: '时尚小仙女',
						avatarColor: '#007aff',
						isFollowed: false,
						isVip: true
					},
					stats: {
						likes: 12340,
						comments: 892,
						shares: 567,
						isLiked: false
					},
					tags: ['穿搭', '时尚', '秋季']
				},
				{
					id: 2,
					title: '美食制作过程',
					description: '详细展示美食制作的每一个步骤，让你在家也能做出美味佳肴。',
					bgColor: '#4ecdc4',
					author: {
						id: 2,
						nickname: '美食小当家',
						avatarColor: '#ff9f43',
						isFollowed: true,
						isVip: false
					},
					stats: {
						likes: 23456,
						comments: 1234,
						shares: 890,
						isLiked: true
					},
					tags: ['美食', '治愈', '甜品']
				},
				{
					id: 3,
					title: '绝美风景大片',
					description: '西藏的天空真的太美了！蓝天白云，纯净如洗，仿佛能洗涤心灵的净土。',
					bgColor: '#45b7d1',
					author: {
						id: 3,
						nickname: '行走的摄影师',
						avatarColor: '#6c5ce7',
						isFollowed: false,
						isVip: true
					},
					stats: {
						likes: 45678,
						comments: 2345,
						shares: 1234,
						isLiked: false
					},
					tags: ['旅行', '风景', '西藏', '摄影']
				}
			]
		},
		
		switchTab(tab) {
			this.currentTab = tab
			console.log('切换到:', tab)
		},
		
		onSearchClick() {
			uni.showToast({
				title: '搜索功能',
				icon: 'none'
			})
		},
		
		onLiveClick() {
			uni.showToast({
				title: '直播功能开发中',
				icon: 'none'
			})
		},
		
		onSwiperChange(e) {
			console.log('视频切换:', e.detail.current)
		},
		
		togglePlay(index) {
			this.$set(this.isPlaying, index, !this.isPlaying[index])
			console.log('播放/暂停:', index, this.isPlaying[index])
		},
		
		handleLikeClick(video) {
			video.stats.isLiked = !video.stats.isLiked
			video.stats.likes += video.stats.isLiked ? 1 : -1
			uni.vibrateShort()
			uni.showToast({
				title: video.stats.isLiked ? '❤️' : '取消点赞',
				icon: 'none',
				duration: 800
			})
		},
		
		handleCommentClick(video) {
			uni.showToast({
				title: '评论功能',
				icon: 'none'
			})
		},
		
		handleShareClick(video) {
			uni.showToast({
				title: '分享功能',
				icon: 'none'
			})
		},
		
		handleAuthorClick(author) {
			console.log('作者点击:', author)
			uni.showToast({
				title: `查看 ${author.nickname} 的主页`,
				icon: 'none'
			})
		},
		
		handleFollowClick(author) {
			author.isFollowed = !author.isFollowed
			uni.showToast({
				title: author.isFollowed ? '关注成功' : '取消关注',
				icon: 'success'
			})
		},
		
		formatCount(count) {
			if (count < 1000) return count.toString()
			if (count < 10000) return (count / 1000).toFixed(1) + 'k'
			if (count < 100000) return (count / 10000).toFixed(1) + 'w'
			return (count / 10000).toFixed(0) + 'w'
		}
	}
}
</script>

<style scoped lang="scss">
/* 短视频页面基础样式 */
.short-video-page {
  width: 100vw;
  height: 100vh;
  background: #000;
  position: relative;
  overflow: hidden;
}

/* 状态栏占位 */
.status-bar {
  /* #ifdef MP-WEIXIN */
  height: var(--status-bar-height);
  /* #endif */
  background: transparent;
}

/* 顶部工具栏 */
.top-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  /* #ifdef MP-WEIXIN */
  padding-top: var(--status-bar-height);
  /* #endif */
  height: calc(88rpx + var(--status-bar-height, 0));
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, transparent 100%);
  backdrop-filter: blur(10rpx);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 24rpx 20rpx;
  z-index: 1000;
  
  .toolbar-left {
    flex: 1;
    display: flex;
    align-items: center;
    
    .live-badge {
      display: flex;
      align-items: center;
      gap: 8rpx;
      padding: 8rpx 16rpx;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20rpx;
      backdrop-filter: blur(10rpx);
      
      .live-dot {
        width: 12rpx;
        height: 12rpx;
        border-radius: 50%;
        background: #ff4757;
        animation: pulse 2s infinite;
      }
      
      .live-text {
        font-size: 24rpx;
        color: #fff;
        font-weight: 500;
      }
    }
  }
  
  .toolbar-center {
    flex: 2;
    display: flex;
    justify-content: center;
    
    .nav-tabs {
      display: flex;
      align-items: center;
      gap: 32rpx;
      
      .nav-tab {
        font-size: 32rpx;
        color: rgba(255, 255, 255, 0.7);
        font-weight: 400;
        transition: all 0.3s ease;
        position: relative;
        
        &.active {
          color: #fff;
          font-weight: 600;
          font-size: 36rpx;
          
          &::after {
            content: '';
            position: absolute;
            bottom: -8rpx;
            left: 50%;
            transform: translateX(-50%);
            width: 24rpx;
            height: 4rpx;
            border-radius: 2rpx;
            background: #fff;
          }
        }
      }
    }
  }
  
  .toolbar-right {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    
    .search-btn {
      width: 60rpx;
      height: 60rpx;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10rpx);
      
      text {
        font-size: 24rpx;
      }
    }
  }
}

/* 视频容器 */
.video-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #000;
}

.video-swiper {
  width: 100%;
  height: 100%;
  
  .swiper-item {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }
}

.video-item {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  background: #000;
}

/* 视频占位区域 */
.video-placeholder {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  .video-title {
    font-size: 48rpx;
    color: #fff;
    font-weight: bold;
    text-align: center;
    margin-bottom: 40rpx;
    text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.5);
  }
  
  .play-btn {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10rpx);
    
    text {
      font-size: 48rpx;
    }
  }
}

/* 右侧控制栏 */
.right-controls {
  position: absolute;
  right: 24rpx;
  bottom: 200rpx;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40rpx;
}

/* 作者信息 */
.author-info {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .avatar {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    border: 4rpx solid #fff;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    
    text {
      font-size: 36rpx;
      color: #fff;
      font-weight: bold;
    }
  }
  
  .follow-btn {
    position: absolute;
    bottom: -8rpx;
    right: -8rpx;
    width: 32rpx;
    height: 32rpx;
    border-radius: 50%;
    background: #ff4757;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid #fff;
    
    text {
      font-size: 20rpx;
      color: #fff;
      font-weight: bold;
    }
  }
}

/* 控制项 */
.control-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  cursor: pointer;
  
  .control-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10rpx);
    transition: all 0.3s ease;
    
    text {
      font-size: 36rpx;
    }
    
    &.active {
      background: rgba(255, 71, 87, 0.8);
    }
    
    &:active {
      transform: scale(0.9);
      background: rgba(255, 255, 255, 0.4);
    }
  }
  
  .control-text {
    font-size: 24rpx;
    color: #fff;
    text-align: center;
    text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
    min-width: 60rpx;
  }
}

/* 底部信息区域 */
.bottom-info {
  position: absolute;
  left: 24rpx;
  right: 160rpx;
  bottom: 120rpx;
  z-index: 200;
  color: #fff;
}

/* 作者昵称 */
.author-name {
  margin-bottom: 16rpx;
  
  text {
    font-size: 28rpx;
    font-weight: 600;
    text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
  }
}

/* 视频描述 */
.video-description {
  margin-bottom: 16rpx;
  
  text {
    font-size: 26rpx;
    line-height: 1.5;
    text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
  }
}

/* 标签 */
.video-tags {
  margin-bottom: 16rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  
  .tag {
    font-size: 24rpx;
    color: #fff;
    background: rgba(255, 255, 255, 0.2);
    padding: 6rpx 12rpx;
    border-radius: 16rpx;
    backdrop-filter: blur(10rpx);
  }
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}
</style>

