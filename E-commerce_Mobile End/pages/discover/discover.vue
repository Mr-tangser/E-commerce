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
			<swiper 
				class="video-swiper" 
				:vertical="true" 
				:indicator-dots="false" 
				:current="currentIndex"
				:circular="false"
				:duration="300"
				:autoplay="false"
				:display-multiple-items="1"
				:skip-hidden-item-layout="true"
				@change="onSwiperChange"
			>
				<swiper-item v-for="(video, index) in videoList" :key="video.id" class="swiper-item">
					<view class="video-item">
						<!-- 视频切换遮罩 -->
						<view class="video-transition-mask" v-if="isVideoSwitching && index !== currentIndex" :style="{ opacity: isVideoSwitching ? 1 : 0 }"></view>
						
						<!-- 真实视频播放器 -->
						<video 
							class="video-player"
							:id="`video-${video.id}`"
							:src="video.videoUrl"
							:poster="video.poster"
							:controls="false"
							:autoplay="false"
							:loop="true"
							:muted="true"
							:show-center-play-btn="false"
							:show-play-btn="false"
							:enable-play-gesture="true"
							:object-fit="'cover'"
							:style="{ visibility: index === currentIndex ? 'visible' : 'hidden' }"
							@play="onVideoPlay(index)"
							@pause="onVideoPause(index)"
							@ended="onVideoEnded(index)"
							@error="onVideoError(index)"
							@click="togglePlay(index)"
						></video>
						
						<!-- 视频播放控制遮罩 -->
						<view class="video-overlay" v-if="!isPlaying[index]" @click="togglePlay(index)">
							<view class="play-btn-large">
								<text>▶️</text>
							</view>
						</view>
						
						<!-- 右侧操作栏 -->
						<view class="right-controls">
							<!-- 作者头像 -->
							<view class="author-info" @click="handleAuthorClick(video.author)">
								<image class="avatar" :src="video.author.avatar" mode="aspectFill" 
									@error="onAvatarError" :data-index="index"></image>
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
			isPlaying: {},
			currentIndex: 0,
			videoContexts: {}, // 存储视频播放器上下文
			isVideoSwitching: false // 视频切换状态标识
		}
	},
	onLoad() {
		this.initVideoData()
	},
	onReady() {
		this.setStatusBarStyle()
		this.initVideoContexts()
	},
	onShow() {
		// 确保显示底部导航栏
		uni.showTabBar()
		// 恢复当前视频播放
		if (this.currentIndex >= 0) {
			setTimeout(() => {
				this.playVideo(this.currentIndex)
			}, 300)
		}
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
					title: '海边风景',
					description: '美丽的海边风景，蓝天白云，海浪拍打着岸边，让人心旷神怡！',
					videoUrl: 'https://stream7.iqilu.com/10339/upload_transcode/202002/18/20200218114723HDu3hhxqIT.mp4',
					poster: 'https://img.zcool.cn/community/01c0ac5f4e6fd2a8012099c8d2b9b6.jpg',
					author: {
						id: 1,
						nickname: '旅行达人',
						avatar: 'https://img.zcool.cn/community/0117e85e6fd0a10000018c1bd6943d.jpg',
						isFollowed: false,
						isVip: true
					},
					stats: {
						likes: 12340,
						comments: 892,
						shares: 567,
						isLiked: false
					},
					tags: ['风景', '海边', '旅行']
				},
				{
					id: 2,
					title: '城市夜景',
					description: '繁华的城市夜景，霓虹灯闪烁，展现都市的魅力与活力。',
					videoUrl: 'https://stream7.iqilu.com/10339/upload_transcode/202002/18/20200218093206z8V1JuPlpe.mp4',
					poster: 'https://img.zcool.cn/community/01b5cb5f4e6fd3a8012099c8a1f4e9.jpg',
					author: {
						id: 2,
						nickname: '摄影师小王',
						avatar: 'https://img.zcool.cn/community/0122e65e6fd0b00000018c1b45c9b7.jpg',
						isFollowed: true,
						isVip: false
					},
					stats: {
						likes: 23456,
						comments: 1234,
						shares: 890,
						isLiked: true
					},
					tags: ['城市', '夜景', '摄影']
				},
				{
					id: 3,
					title: '自然风光',
					description: '大自然的鬼斧神工，山川河流，绿树成荫，美不胜收的自然风光。',
					videoUrl: 'https://stream7.iqilu.com/10339/upload_transcode/202002/18/20200218025702PSiVKDB5ap.mp4',
					poster: 'https://img.zcool.cn/community/01843b5f4e6fd4a8012099c804d9b8.jpg',
					author: {
						id: 3,
						nickname: '自然爱好者',
						avatar: 'https://img.zcool.cn/community/01e1ef5e6fd0c50000018c1b8a59f5.jpg',
						isFollowed: false,
						isVip: true
					},
					stats: {
						likes: 45678,
						comments: 2345,
						shares: 1234,
						isLiked: false
					},
					tags: ['自然', '风光', '山川']
				},
				{
					id: 4,
					title: '花朵绽放',
					description: '春天来了，各种花朵竞相开放，生机勃勃的春天景象。',
					videoUrl: 'https://stream7.iqilu.com/10339/upload_transcode/202002/18/20200218093206z8V1JuPlpe.mp4',
					poster: 'https://img.zcool.cn/community/01d6b35f4e6fd5a8012099c8f0f5c2.jpg',
					author: {
						id: 4,
						nickname: '花艺师',
						avatar: 'https://img.zcool.cn/community/01b0ce5e6fd0d70000018c1bfb8c6d.jpg',
						isFollowed: false,
						isVip: false
					},
					stats: {
						likes: 18923,
						comments: 567,
						shares: 234,
						isLiked: false
					},
					tags: ['花朵', '春天', '自然']
				}
			]
		},
		
		// 初始化视频播放器上下文
		initVideoContexts() {
			this.$nextTick(() => {
				this.videoList.forEach((video, index) => {
					const videoId = `video-${video.id}`
					this.videoContexts[index] = uni.createVideoContext(videoId, this)
				})
				// 自动播放第一个视频
				setTimeout(() => {
					this.playVideo(0)
				}, 500)
			})
		},
		
		// 播放指定视频
		playVideo(index) {
			if (this.videoContexts[index]) {
				this.videoContexts[index].play()
				this.$set(this.isPlaying, index, true)
			}
		},
		
		// 暂停指定视频
		pauseVideo(index) {
			if (this.videoContexts[index]) {
				this.videoContexts[index].pause()
				// 重置视频到开头，避免显示最后一帧
				this.videoContexts[index].seek(0)
				this.$set(this.isPlaying, index, false)
			}
		},
		
		// 暂停所有视频
		pauseAllVideos() {
			Object.keys(this.videoContexts).forEach(index => {
				this.pauseVideo(parseInt(index))
			})
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
			const newIndex = e.detail.current
			const oldIndex = this.currentIndex
			console.log('视频切换:', oldIndex, '->', newIndex)
			
			// 设置切换状态
			this.isVideoSwitching = true
			
			// 立即暂停上一个视频并重置
			if (oldIndex !== newIndex && this.videoContexts[oldIndex]) {
				this.videoContexts[oldIndex].pause()
				// 立即重置到开头，清除最后一帧
				this.videoContexts[oldIndex].seek(0)
				this.$set(this.isPlaying, oldIndex, false)
			}
			
			// 暂停其他所有视频
			this.pauseAllVideos()
			
			// 更新当前索引
			this.currentIndex = newIndex
			
			// 如果接近最后一个视频，加载更多
			if (newIndex >= this.videoList.length - 2) {
				this.loadMoreVideos()
			}
			
			// 延迟播放新视频，确保切换完成
			setTimeout(() => {
				this.isVideoSwitching = false
				this.playVideo(newIndex)
			}, 150)
		},
		
		// 加载更多视频
		loadMoreVideos() {
			console.log('加载更多视频...')
			const moreVideos = [
				{
					id: this.videoList.length + 1,
					title: '山峰云海',
					description: '云雾缭绕的山峰，宛如仙境一般的美景，让人流连忘返。',
					videoUrl: '/static/videos/抖音2025828-100172.mp4',
					poster: 'https://img.zcool.cn/community/01a5f75f4e6fd6a8012099c8e1e68f.jpg',
					author: {
						id: this.videoList.length + 1,
						nickname: '山景摄影师',
						avatar: 'https://img.zcool.cn/community/01f3af5e6fd0e80000018c1b2b8c93.jpg',
						isFollowed: false,
						isVip: false
					},
					stats: {
						likes: 8765,
						comments: 432,
						shares: 123,
						isLiked: false
					},
					tags: ['山峰', '云海', '自然']
				},
				{
					id: this.videoList.length + 2,
					title: '都市生活',
					description: '快节奏的都市生活，忙碌中也有属于自己的美好时光。',
					videoUrl: '/static/videos/抖音2025913-152354.mp4',
					poster: 'https://img.zcool.cn/community/01b8c95f4e6fd7a8012099c8f6d4b3.jpg',
					author: {
						id: this.videoList.length + 2,
						nickname: '都市达人',
						avatar: 'https://img.zcool.cn/community/01c6e45e6fd0f90000018c1b7a6b84.jpg',
						isFollowed: false,
						isVip: true
					},
					stats: {
						likes: 15432,
						comments: 876,
						shares: 345,
						isLiked: false
					},
					tags: ['都市', '生活', '城市']
				}
			]
			
			this.videoList.push(...moreVideos)
			
			// 为新视频初始化播放器上下文
			this.$nextTick(() => {
				moreVideos.forEach((video, index) => {
					const actualIndex = this.videoList.length - moreVideos.length + index
					const videoId = `video-${video.id}`
					this.videoContexts[actualIndex] = uni.createVideoContext(videoId, this)
				})
			})
		},
		
		togglePlay(index) {
			const isCurrentlyPlaying = this.isPlaying[index]
			if (isCurrentlyPlaying) {
				this.pauseVideo(index)
			} else {
				this.playVideo(index)
			}
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
		},
		
		// 视频事件处理
		onVideoPlay(index) {
			console.log('视频播放:', index)
			this.$set(this.isPlaying, index, true)
		},
		
		onVideoPause(index) {
			console.log('视频暂停:', index)
			this.$set(this.isPlaying, index, false)
		},
		
		onVideoEnded(index) {
			console.log('视频播放结束:', index)
			// 视频结束后重新播放（循环播放）
			setTimeout(() => {
				this.playVideo(index)
			}, 100)
		},
		
		onVideoError(index) {
			console.error('视频播放错误:', index)
			this.$set(this.isPlaying, index, false)
			uni.showToast({
				title: '视频加载失败',
				icon: 'none'
			})
		},
		
		// 头像加载错误处理
		onAvatarError(e) {
			console.log('头像加载失败:', e)
			// 可以设置默认头像
		}
	},
	
	onHide() {
		// 页面隐藏时暂停所有视频
		this.pauseAllVideos()
	},
	
	onUnload() {
		// 页面卸载时清理资源
		this.pauseAllVideos()
		this.videoContexts = {}
	}
}
</script>

<style scoped lang="scss">
@import 'discover.scss';
</style>