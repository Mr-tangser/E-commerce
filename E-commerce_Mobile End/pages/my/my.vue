<template>
	<view class="page">
		<view class="my-top">
			<!-- head -->
			<view class="head" :style="'background-color: rgba(255,255,255,'+(scrollTop/50)+');'">
				<view class="portrait">
					<image v-show="scrollTop>20" src="//img11.360buyimg.com/jdphoto/s40x40_jfs/t1/25255/18/10701/1678/5c89f892E78c04688/684d63c0d68e39b1.png"></image>
				</view>
				<view class="title">
					<text v-show="scrollTop>20">我的</text>
				</view>
				<view class="setting-mess">
					<view class="setting" @click="onSetting">
						<text class="iconfont icon-setting" :style="scrollTop>20?'color:#333333':''"></text>
					</view>
					<view class="mess" @click="onMessage">
						<text class="iconfont icon-xiaoxi" :style="scrollTop>20?'color:#333333':''"></text>
					</view>
					<!-- 快速退出登录按钮（仅已登录时显示） -->
					<view v-if="isLoggedIn" class="logout-quick" @click="onLogout">
						<text class="iconfont icon-tuichu" :style="scrollTop>20?'color:#333333':'color:white'"></text>
					</view>
				</view>
			</view>
			
			<!-- 用户信息 - 已登录状态 -->
			<view class="user-info" v-if="isLoggedIn" @click="onUserInfo">
				<view class="portrait">
					<image :src="userInfo.avatar || '/static/default_avatar.png'" @error="onAvatarError"></image>
				</view>
				<view class="info">
					<view class="nickname">
						<text>{{ userInfo.username || userInfo.email || '用户' }}</text>
					</view>
					<view class="rank" v-if="userInfo.role">
						<image src="/static/rank.png"></image>
						<text>{{ userInfo.role === 'vip' ? 'VIP' : 'V1' }}</text>
					</view>
					<view class="user-details">
						<text class="phone" v-if="userInfo.phone">{{ formatPhone(userInfo.phone) }}</text>
						
					</view>
				</view>
				
			</view>
			
			<!-- 用户信息 - 未登录状态 -->
      <view class="user-info guest-info" v-else @click="onUserInfo">
        <view class="portrait">
          <image src="/static/default_avatar.png"></image>
        </view>
        <view class="info">
          <view class="nickname">
            <text>登录/注册</text>
          </view>
          <view class="login-tip">
            <text>登录后享受更多服务</text>
          </view>
        </view>
      </view>
			
			<!-- 关注区 -->
			<view class="focus-area">
				<view class="list" @click="onCollect('goods')">
					<view class="num">
						<text>{{ isLoggedIn ? userStats.goodsCount : '0' }}</text>
					</view>
					<view class="title">
						<text>商品关注</text>
					</view>
				</view>
				<view class="list" @click="onCollect('content')">
					<view class="num">
						<text>{{ isLoggedIn ? userStats.contentCount : '0' }}</text>
					</view>
					<view class="title">
						<text>喜欢的内容</text>
					</view>
				</view>
				<view class="list" @click="onCollect('record')">
					<view class="num">
						<text>{{ isLoggedIn ? userStats.recordCount : '0' }}</text>
					</view>
					<view class="title">
						<text>浏览记录</text>
					</view>
				</view>
			</view>
			
			<!-- 会员 -->
			<view class="vip-info" @click="onMmeberVip" v-if="isLoggedIn">
				<view class="vip">
					<text>{{ userInfo.role === 'vip' ? '超级会员' : '普通会员' }}</text>
					<text class="line"></text>
				</view>
				<view class="vip-explain">
					<text>{{ userInfo.role === 'vip' ? '享受会员专属特权' : '升级会员享受更多特权' }}</text>
				</view>
				<view class="vip-btn">
					<text>{{ userInfo.role === 'vip' ? '会员中心' : '立即升级' }}</text>
				</view>
			</view>
		</view>
		
		<!-- 订单信息 -->
		<view class="order-info">
			<view class="list" @click="onSkipOrder(1)">
				<view class="icon">
					<text class="iconfont icon-daifukuan"></text>
					<text class="num" v-if="isLoggedIn && orderStats.unpaid > 0">{{ orderStats.unpaid }}</text>
				</view>
				<view class="title">
					<text>待付款</text>
				</view>
			</view>
			<view class="list" @click="onSkipOrder(2)">
				<view class="icon">
					<text class="iconfont icon-daifahuo"></text>
					<text class="num" v-if="isLoggedIn && orderStats.unshipped > 0">{{ orderStats.unshipped }}</text>
				</view>
				<view class="title">
					<text>待发货</text>
				</view>
			</view>
			<view class="list" @click="onSkipOrder(3)">
				<view class="icon">
					<text class="iconfont icon-daishouhuo"></text>
					<text class="num" v-if="isLoggedIn && orderStats.shipped > 0">{{ orderStats.shipped }}</text>
				</view>
				<view class="title">
					<text>待收货</text>
				</view>
			</view>
			<view class="list" @click="onSkipOrder(4)">
				<view class="icon">
					<text class="iconfont icon-daipingjia"></text>
					<text class="num" v-if="isLoggedIn && orderStats.unreviewed > 0">{{ orderStats.unreviewed }}</text>
				</view>
				<view class="title">
					<text>待评价</text>
				</view>
			</view>
			<view class="list" @click="onSkipOrder(5)">
				<view class="icon">
					<text class="iconfont icon-tuikuan"></text>
					<text class="num" v-if="isLoggedIn && orderStats.refund > 0">{{ orderStats.refund }}</text>
				</view>
				<view class="title">
					<text>退换</text>
				</view>
			</view>
		</view>
		
		<!-- 钱包 -->
		<view class="wallet-info" v-if="isLoggedIn">
			<view class="list" @click="onWallet('integral')">
				<view class="icon">
					<text class="number">{{ userWallet.points || 0 }}</text>
				</view>
				<view class="title">
					<text>积分</text>
				</view>
			</view>
			<view class="list" @click="onWallet('coupon')">
				<view class="icon">
					<text class="number">{{ userWallet.coupons || 0 }}</text>
				</view>
				<view class="title">
					<text>优惠券</text>
				</view>
			</view>
			<view class="list" @click="onWallet('wallet')">
				<view class="icon">
					<text class="number">{{ userWallet.balance || '0.00' }}</text>
				</view>
				<view class="title">
					<text>余额</text>
				</view>
			</view>
			<view class="list">
				<view class="icon">
					<text class="iconfont icon-qianbao"></text>
				</view>
				<view class="title">
					<text class="action">我的钱包</text>
				</view>
			</view>
		</view>
		
		<!-- 积分，付款码 -->
		<view class="integral-payment">
			<view class="list" @click="onWallet('SignIn')">
				<view class="title">
					<text class="iconfont icon-qiandao" style="font-weight: bold;"></text>
					<text>签到</text>
				</view>
				<view class="mess">
					<text>{{ isLoggedIn ? '每日签到 领取积分' : '登录后可签到' }}</text>
				</view>
			</view>
			<view class="list" @click="onWallet('payment')">
				<view class="title">
					<text class="iconfont icon-fukuanma"></text>
					<text>付款码</text>
				</view>
				<view class="mess">
					<text>到店扫码 快捷支付</text>
				</view>
			</view>
		</view>
		
		<!-- 我的服务 -->
		<view class="my-service">
			<view class="title">
				<text>我的服务</text>
			</view>
			<view class="service-list">
				<view class="list" @click="onServer('feedback')">
					<view class="thumb">
						<image src="/static/yjfk.png"></image>
					</view>
					<view class="name">
						<text>意见反馈</text>
					</view>
				</view>
				<view class="list" @click="onServer('serve')">
					<view class="thumb">
						<image src="/static/kfrx.png"></image>
					</view>
					<view class="name">
						<text>客服热线</text>
					</view>
				</view>
				<!-- 新增：账号关联入口 -->
				<view class="list" @click="onServer('account')" v-if="isLoggedIn">
					<view class="thumb">
						<text class="iconfont icon-guanlian" style="font-size: 32rpx; color: #667eea;"></text>
					</view>
					<view class="name">
						<text>账号关联</text>
					</view>
				</view>
			</view>
		</view>
		
    <!-- 为你推荐 -->
    <view class="recommend-info">
      <view class="recommend-title">
        <view class="title">
          <image src="/static/wntj_title.png" mode=""></image>
        </view>
      </view>
      <view class="goods-list">
        <view class="list" v-for="(item,index) in goodsList" @click="onSkip('goods')" :key="index">
          <view class="pictrue">
            <image :src="item.img" mode="heightFix"></image>
          </view>
          <view class="title-tag">
            <view class="tag">
              <text v-if="item.is_goods === 1">特价</text>
              {{item.name}}
            </view>
          </view>
          <view class="price-info">
            <view class="user-price">
              <text class="min">￥</text>
              <text class="max">{{item.price}}</text>
            </view>
            <view class="vip-price">
              <image src="/static/vip_ico.png"></image>
              <text>￥{{item.vip_price}}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
		<!-- 客服热线 -->
		<view class="serve-hotline" @click="isHotline = false">
			<view class="cu-modal bottom-modal" :class="{'show':isHotline}">
			  <view class="cu-dialog">
					<view class="contact-list">
						<view class="list">
							<text>呼叫客服</text>
						</view>
						<view class="list">
							<text style="color: #959595;">400-800-900</text>
						</view>
						<view class="list">
							<text>取消</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- tabbar -->
		<TabBar :tabBarShow="4"></TabBar>
	</view>
</template>

<script>
	import TabBar from '../../components/TabBar/TabBar.vue';
	
	export default {
		components:{
			TabBar,
		},
		data() {
			return {
				scrollTop: 0,
				isHotline: false,
				
				// 用户登录状态管理
				isLoggedIn: false,
				userInfo: {
					username: '',
					email: '',
					phone: '',
					avatar: '',
					role: '',
					lastLogin: null
				},
				
				// 用户统计数据
				userStats: {
					goodsCount: 0,
					contentCount: 0,
					recordCount: 0
				},
				
				// 订单统计
				orderStats: {
					unpaid: 0,
					unshipped: 0,
					shipped: 0,
					unreviewed: 0,
					refund: 0
				},
				
				// 用户钱包
				userWallet: {
					points: 0,
					coupons: 0,
					balance: '0.00'
				},
				
				// 推荐商品列表
        goodsList:[
          {
            id: 1,
            name: 'BANDALY 2020夏季女装连衣裙韩版大码宽松显瘦套装裙子两件套 JX19301 上豆绿下米白 M ',
            price: '219.00',
            vip_price: '129.00',
            img: '/static/img/goods_thumb_01.png',
            is_goods: 0,
          },{
            id: 2,
            name: '花花公子 卫衣男秋季圆领薄款休闲体恤男士时尚长袖T恤外套上衣男生情侣装套头衣服秋天男装 白色 XL',
            price: '139.00',
            vip_price: '99.00',
            img: '/static/img/goods_thumb_02.png',
            is_goods: 1,
          },{
            id: 3,
            name: '【两件套】花花公子PLAYBOY短袖T恤男套装夏季新款卫衣男士韩版修身冰丝宽松运动休闲上衣服裤子男装 CYFS903卡其色 XL',
            price: '168.00',
            vip_price: '158.00',
            img: '/static/img/goods_thumb_03.png',
            is_goods: 1,
          },{
            id: 4,
            name: '雪域森林短袖T恤男装2020夏季潮流时尚衣服男潮牌圆领印花宽松T恤半袖男 20855橙色 XL',
            price: '68.00',
            vip_price: '36.00',
            img: '/static/img/goods_thumb_04.png',
            is_goods: 0,
          },{
            id: 5,
            name: '短袖男夏季T恤男装韩版潮流印花套头衣服男士圆领宽松五分袖学生休闲夏天运动时尚情侣装大码 D119白色 XL',
            price: '68.00',
            vip_price: '59.00',
            img: '/static/img/goods_thumb_05.png',
            is_goods: 0,
          },{
            id: 6,
            name: '时尚休闲套装女夏季热天宽松女孩中学生高中初中生女生短袖套装衣服夏天少女学生韩版原宿风T恤潮流裤子一套 绿字母上衣+绿色裤两件套 均码',
            price: '83.00',
            vip_price: '78.00',
            img: '/static/img/goods_thumb_06.png',
            is_goods: 1,
          }
        ],
			};
		},
		
		mounted() {
			console.log('📱 我的页面已加载');
			// 检查用户登录状态
			this.checkLoginStatus();
			// 监听用户状态变化
			uni.$on('userStatusChange', this.handleUserStatusChange);
		},
		
		onReady() {
			uni.hideTabBar();
		},
		
		onShow() {
			// 每次显示页面时更新浏览记录数量
			if (this.isLoggedIn) {
				this.updateBrowsingHistoryCount();
			}
		},
		
		onPageScroll(e) {
			this.scrollTop = e.scrollTop;
		},
		
		onUnload() {
			// 移除事件监听
			uni.$off('userStatusChange', this.handleUserStatusChange);
		},
		
		methods:{
			/**
			 * 检查用户登录状态
			 */
			checkLoginStatus() {
				try {
					const token = uni.getStorageSync('token');
					const user = uni.getStorageSync('user');
					
					console.log('🔍 检查登录状态:', { hasToken: !!token, hasUser: !!user });
					
					if (token && user) {
						this.isLoggedIn = true;
						this.userInfo = {
							...user,
							// 确保有默认值
							username: user.username || user.email?.split('@')[0] || '用户',
							avatar: user.avatar || '/static/default_avatar.png'
						};
						console.log('✅ 用户已登录:', this.userInfo);
						
						// 加载用户相关数据
						this.loadUserData();
					} else {
						this.isLoggedIn = false;
						this.userInfo = {};
						console.log('❌ 用户未登录');
					}
				} catch (error) {
					console.error('检查登录状态失败:', error);
					this.isLoggedIn = false;
					this.userInfo = {};
				}
			},
			
			/**
			 * 加载用户数据
			 */
			async loadUserData() {
				try {
					// 获取真实的浏览记录数量
					const BrowsingHistory = require('@/utils/browsing-history.js').default;
					const historyStats = BrowsingHistory.getStatistics();
					
					// 这里可以调用API获取用户的统计数据
					// 目前使用模拟数据（除了浏览记录）
					this.userStats = {
						goodsCount: 28,
						contentCount: 15,
						recordCount: historyStats.total
					};
					
					this.orderStats = {
						unpaid: 2,
						unshipped: 1,
						shipped: 3,
						unreviewed: 1,
						refund: 0
					};
					
					this.userWallet = {
						points: 1580,
						coupons: 3,
						balance: '268.50'
					};
					
				console.log('✅ 用户数据加载完成');
			} catch (error) {
				console.error('加载用户数据失败:', error);
			}
		},
		
		/**
		 * 更新浏览记录数量
		 */
		updateBrowsingHistoryCount() {
			try {
				const BrowsingHistory = require('@/utils/browsing-history.js').default;
				const historyStats = BrowsingHistory.getStatistics();
				this.userStats.recordCount = historyStats.total;
				console.log('🔄 浏览记录数量已更新:', historyStats.total);
			} catch (error) {
				console.error('❌ 更新浏览记录数量失败:', error);
			}
		},
			
			/**
			 * 处理用户状态变化
			 */
			handleUserStatusChange(data) {
				console.log('📡 收到用户状态变化:', data);
				if (data.isLoggedIn) {
					this.isLoggedIn = true;
					this.userInfo = {
						...data.user,
						username: data.user.username || data.user.email?.split('@')[0] || '用户',
						avatar: data.user.avatar || '/static/default_avatar.png'
					};
					this.loadUserData();
				} else {
					this.isLoggedIn = false;
					this.userInfo = {};
					this.userStats = { goodsCount: 0, contentCount: 0, recordCount: 0 };
					this.orderStats = { unpaid: 0, unshipped: 0, shipped: 0, unreviewed: 0, refund: 0 };
					this.userWallet = { points: 0, coupons: 0, balance: '0.00' };
				}
			},
			
			/**
			 * 退出登录
			 */
			onLogout() {
				uni.showModal({
					title: '确认退出',
					content: '确定要退出登录吗？',
					success: (res) => {
						if (res.confirm) {
							this.performLogout();
						}
					}
				});
			},
			
			/**
			 * 执行退出登录
			 */
			performLogout() {
				try {
					console.log('🔓 开始执行退出登录');
					
					// 清除本地存储的所有用户相关数据
					uni.removeStorageSync('token');
					uni.removeStorageSync('user');
					uni.removeStorageSync('userInfo'); // 兼容旧版本
					uni.removeStorageSync('biometric_user'); // 清除生物识别用户数据
					
					console.log('✅ 用户数据已清除');
					
					// 更新本页面状态
					this.isLoggedIn = false;
					this.userInfo = {};
					this.userStats = { goodsCount: 0, contentCount: 0, recordCount: 0 };
					this.orderStats = { unpaid: 0, unshipped: 0, shipped: 0, unreviewed: 0, refund: 0 };
					this.userWallet = { points: 0, coupons: 0, balance: '0.00' };
					
					// 触发全局状态更新
					uni.$emit('userStatusChange', {
						isLoggedIn: false,
						user: null
					});
					
					// 显示提示
					uni.showToast({
						title: '已退出登录',
						icon: 'success',
						duration: 2000
					});
					
					// 延迟跳转到登录页面
					setTimeout(() => {
						uni.reLaunch({
							url: '/pages/login/login'
						});
					}, 2000);
					
					console.log('✅ 用户已退出登录');
				} catch (error) {
					console.error('❌ 退出登录失败:', error);
					uni.showToast({
						title: '退出失败，请重试',
						icon: 'error'
					});
				}
			},
			
			/**
			 * 头像加载失败处理
			 */
			onAvatarError() {
				this.userInfo.avatar = '/static/default_avatar.png';
			},
			
			/**
			 * 格式化手机号
			 */
			formatPhone(phone) {
				if (!phone) return '';
				return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
			},
			
			/**
			 * 格式化时间
			 */
			formatTime(time) {
				if (!time) return '';
				const date = new Date(time);
				const now = new Date();
				const diff = now - date;
				const days = Math.floor(diff / (1000 * 60 * 60 * 24));
				
				if (days === 0) {
					return '今天';
				} else if (days === 1) {
					return '昨天';
				} else if (days < 7) {
					return `${days}天前`;
				} else {
					return date.toLocaleDateString();
				}
			},
			
			/**
			 * 关注跳转
			 */
			onCollect(type){
				if (!this.isLoggedIn) {
					this.showLoginRequired();
					return;
				}
				
				switch (type){
					case 'goods':
						uni.navigateTo({
							url: '/pages/GoodsOn/GoodsOn'
						})
						break;
					case 'content':
						uni.navigateTo({
							url: '/pages/ContentCollection/ContentCollection'
						})
						break;
					case 'record':
						uni.navigateTo({
							url: '/pages/BrowsingHistory/BrowsingHistory'
						})
						break;
				}
			},
			
			/**
			 * 订单
			 */
			onSkipOrder(type){
				if (!this.isLoggedIn) {
					this.showLoginRequired();
					return;
				}
				
				if(type === 5){
					uni.navigateTo({
						url: '/pages/AfterSalesOrder/AfterSalesOrder',
					})
					return;
				}
				uni.navigateTo({
					url: '/pages/MyOrderList/MyOrderList?type=' + type,
				})
			},
			
			/**
			 * 钱包跳转点击
			 */
			onWallet(type){
				if (!this.isLoggedIn && type !== 'payment') {
					this.showLoginRequired();
					return;
				}
				
				switch (type){
					case 'integral':
						uni.navigateTo({
							url: '/pages/IntegralDetails/IntegralDetails',
						})
						break;
					case 'coupon':
						uni.navigateTo({
							url: '/pages/MyCoupon/MyCoupon',
						})
						break;
					case 'wallet':
						uni.navigateTo({
							url: '/pages/MyWallet/MyWallet',
						})
						break;
					case 'SignIn':
						if (!this.isLoggedIn) {
							this.showLoginRequired();
							return;
						}
						uni.navigateTo({
							url: '/pages/SignIn/SignIn',
						})
						break;
					case 'payment':
						uni.navigateTo({
							url: '/pages/PaymentCode/PaymentCode',
						})
						break;
				}
			},
			
			/**
			 * 我的服务点击
			 */
			onServer(type){
				switch (type){
					case 'feedback':
						uni.navigateTo({
							url: '/pages/Feedback/Feedback'
						})
						break;
					case 'serve':
						this.isHotline = true;
						break;
					case 'account':
						if (!this.isLoggedIn) {
							this.showLoginRequired();
							return;
						}
						uni.navigateTo({
							url: '/pages/AccountAssociated/AccountAssociated'
						})
						break;
				}
			},
			
			/**
			 * 设置点击
			 */
			onSetting(){
				uni.navigateTo({
					url: '/pages/Setting/Setting'
				})
			},
			
			/**
			 * 消息点击
			 */
			onMessage(){
				uni.navigateTo({
					url: '/pages/Message/Message'
				})
			},
			
			/**
			 * 会员点击
			 */
			onMmeberVip(){
				if (!this.isLoggedIn) {
					this.showLoginRequired();
					return;
				}
				uni.navigateTo({
					url: '/pages/MembersOpened/MembersOpened',
				})
			},
			
      /**
       * 跳转点击
       * @param {String} type 跳转类型
       */
      onSkip(type){
        switch (type){
          case 'goods':
            uni.navigateTo({
              url: '/pages/GoodsDetails/GoodsDetails',
              animationType: 'zoom-fade-out',
              animationDuration: 200
            })
            break;
        }
      },
      
      /**
       * 用户信息点击
       */
      onUserInfo(){
        if (this.isLoggedIn) {
          // 已登录，跳转到用户资料页面
          uni.navigateTo({
            url: '/pages/UserProfile/UserProfile'
          })
        } else {
          // 未登录，跳转到登录页面
          console.log('🔗 跳转到登录页面');
          uni.navigateTo({
            url: '/pages/login/login'
          })
        }
      },
      
      /**
       * 显示登录提示
       */
      showLoginRequired() {
        uni.showModal({
          title: '需要登录',
          content: '请先登录后再使用此功能',
          success: (res) => {
            if (res.confirm) {
              console.log('🔗 从提示跳转到登录页面');
              uni.navigateTo({
                url: '/pages/login/login'
              })
            }
          }
        });
      }
		}
	}
</script>

<style scoped lang="scss">
	@import 'my.scss';
	
	/* 新增样式 */
	.user-details {
		margin-top: 8rpx;
		.phone, .last-login {
			display: block;
			font-size: 24rpx;
			color: rgba(255, 255, 255, 0.8);
			margin: 4rpx 0;
		}
	}
	
	.logout-btn {
		position: absolute;
		right: 30rpx;
		top: 50%;
		transform: translateY(-50%);
		padding: 8rpx 16rpx;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 20rpx;
		border: 1px solid rgba(255, 255, 255, 0.3);
		.logout-text {
			color: white;
			font-size: 24rpx;
		}
	}
	
	.guest-info .login-tip {
		margin-top: 8rpx;
		.text {
			font-size: 24rpx;
			color: rgba(255, 255, 255, 0.7);
		}
	}
	
	.service-list .list:nth-child(3) {
		.thumb {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 64rpx;
			height: 64rpx;
			background: rgba(102, 126, 234, 0.1);
			border-radius: 12rpx;
		}
	}
	
	/* 快速退出登录按钮样式 */
	.logout-quick {
		margin-left: 20rpx;
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		transition: all 0.3s ease;
		
		&:active {
			background: rgba(255, 255, 255, 0.2);
			transform: scale(0.95);
		}
		
		.iconfont {
			font-size: 36rpx;
		}
	}
</style>