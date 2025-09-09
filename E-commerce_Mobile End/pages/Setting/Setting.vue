<template>
	<view class="page">
		<!-- 用户信息 -->
		<view class="user-info">
			<view class="user-data" @click="onUserInfo">
				<view class="portrait-nickname">
					<view class="portrait">
						<image :src="userInfo.avatar || '/static/default_avatar.png'" mode=""></image>
					</view>
					<view class="nickname">
						<text>{{ userInfo.username || userInfo.email || '用户' }}</text>
					</view>
				</view>
				<view class="more">
					<text class="iconfont icon-more"></text>
				</view>
			</view>
			<view class="address" @click="onAddress">
				<view class="title">
					<text>地址管理</text>
				</view>
				<view class="more">
					<text class="iconfont icon-more"></text>
				</view>
			</view>
		</view>
		<!-- 设置列表 -->
		<view class="setting-list">
			<view class="list" @click="onSetting('account')">
				<view class="title">
					<text>账户安全</text>
				</view>
				<view class="more-content">
					<text class="content">密码/支付等管理</text>
					<text class="iconfont icon-more more"></text>
				</view>
			</view>
			<view class="list" @click="onSetting('pay')">
				<view class="title">
					<text>支付设置</text>
				</view>
				<view class="more-content">
					<text class="iconfont icon-more more"></text>
				</view>
			</view>
			<view class="list" @click="onSetting('invoice')">
				<view class="title">
					<text>发票</text>
				</view>
				<view class="more-content">
					<text class="content">添加发票</text>
					<text class="iconfont icon-more more"></text>
				</view>
			</view>
			<view class="list" @click="onSetting('vip')">
				<view class="title">
					<text>商城会员</text>
				</view>
				<view class="more-content">
					<text class="content">会员专属商品</text>
					<text class="iconfont icon-more more"></text>
				</view>
			</view>
		</view>
		<!-- 设置列表 -->
		<view class="setting-list">
			<!-- #ifndef H5 -->
				<view class="list" @click="onSetting('common')">
					<view class="title">
						<text>通用</text>
					</view>
					<view class="more-content">
						<text class="content">清除本地缓存等</text>
						<text class="iconfont icon-more more"></text>
					</view>
				</view>
			<!-- #endif -->
			<view class="list" @click="onSetting('about')">
				<view class="title">
					<text>关于我们</text>
				</view>
				<view class="more-content">
					<text class="content"></text>
					<text class="iconfont icon-more more"></text>
				</view>
			</view>
		</view>
		<!-- 退出 -->
		<view class="quit-login" @click="onQuitLogin">
			<text>退出登录</text>
		</view>
		<!-- 提示框 -->
		<DialogBox ref="DialogBox"></DialogBox>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				// 用户信息
				userInfo: {
					username: '',
					email: '',
					avatar: ''
				}
			};
		},
		
		mounted() {
			console.log('📱 设置页面已加载');
			// 加载用户信息
			this.loadUserInfo();
			// 监听用户状态变化
			uni.$on('userStatusChange', this.handleUserStatusChange);
		},
		
		onUnload() {
			// 移除事件监听
			uni.$off('userStatusChange', this.handleUserStatusChange);
		},
		
		methods:{
			/**
			 * 加载用户信息
			 */
			loadUserInfo() {
				try {
					const user = uni.getStorageSync('user');
					if (user) {
						this.userInfo = {
							...user,
							username: user.username || user.email?.split('@')[0] || '用户',
							avatar: user.avatar || '/static/default_avatar.png'
						};
						console.log('✅ 设置页面加载用户信息:', this.userInfo);
					}
				} catch (error) {
					console.error('❌ 加载用户信息失败:', error);
				}
			},
			
			/**
			 * 处理用户状态变化
			 */
			handleUserStatusChange(data) {
				console.log('📡 设置页面收到用户状态变化:', data);
				if (data.isLoggedIn && data.user) {
					this.userInfo = {
						...data.user,
						username: data.user.username || data.user.email?.split('@')[0] || '用户',
						avatar: data.user.avatar || '/static/default_avatar.png'
					};
				} else {
					this.userInfo = {
						username: '',
						email: '',
						avatar: ''
					};
				}
			},
			
			/**
			 * 用户信息点击
			 */
			onUserInfo(){
				uni.navigateTo({
					url: '/pages/Information/Information'
				})
			},
			/**
			 * 地址点击
			 */
			onAddress(){
				uni.navigateTo({
					url: '/pages/AddressList/AddressList',
				})
			},
			/**
			 * 设置列表点击
			 * @param {String} type
			 */
			onSetting(type){
				switch(type) {
					case 'account':
						uni.navigateTo({
							url: '/pages/AccountSecurity/AccountSecurity'
						})
						break;
					case 'pay':
						uni.navigateTo({
							url: '/pages/PaymentPassword/PaymentPassword'
						})
						break;
					case 'invoice':
						uni.navigateTo({
							url: '/pages/InvoiceList/InvoiceList'
						})
						break;
					case 'vip':
						uni.navigateTo({
							url: '/pages/MyMemberInterest/MyMemberInterest'
						})
						break;
					case 'common':
						uni.navigateTo({
							url: '/pages/SettingCommon/SettingCommon'
						})
						break;
					case 'about':
						uni.navigateTo({
							url: '/pages/AboutUs/AboutUs'
						})
						break;
				}
			},
			/**
			 * 退出点击
			 */
			onQuitLogin(){
				this.$refs['DialogBox'].confirm({
					title: '提示',
					content: '是否要退出登录?',
					DialogType: 'inquiry',
					animation: 0
				}).then(()=>{
					this.performLogout();
				})
			},
			
			/**
			 * 执行退出登录
			 */
			performLogout() {
				try {
					console.log('🔓 开始执行退出登录');
					
					// 清除本地存储的用户数据
					uni.removeStorageSync('token');
					uni.removeStorageSync('user');
					uni.removeStorageSync('userInfo'); // 兼容旧版本
					uni.removeStorageSync('biometric_user'); // 清除生物识别用户数据
					
					console.log('✅ 用户数据已清除');
					
					// 触发全局用户状态更新事件
					uni.$emit('userStatusChange', {
						isLoggedIn: false,
						user: null
					});
					
					// 显示退出成功提示
					uni.showToast({
						title: '已退出登录',
						icon: 'success',
						duration: 2000
					});
					
					// 延迟跳转，让用户看到提示
					setTimeout(() => {
						// 跳转到登录页面，使用reLaunch清空页面栈
						uni.reLaunch({
							url: '/pages/login/login'
						});
					}, 2000);
					
					console.log('✅ 退出登录成功');
				} catch (error) {
					console.error('❌ 退出登录失败:', error);
					uni.showToast({
						title: '退出失败，请重试',
						icon: 'error'
					});
				}
			}
		}
	}
</script>

<style scoped lang="scss">
	@import 'Setting.scss';
</style>