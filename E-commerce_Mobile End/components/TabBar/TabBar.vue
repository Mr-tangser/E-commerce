<template>
	<view class="page-total">
		<view class="tab-list">
			<view class="list" v-for="(item,index) in TabBarList" 
			@click="onTabBar(item,index)"
			:key="index">
				<view class="icon-container">
					<image :src="item.acImg" mode="widthFix" v-show="tabBarShow === index"></image>
					<image :src="item.img" mode="widthFix" v-show="tabBarShow != index"></image>
					<!-- 购物车数量徽章 -->
					<view class="cart-badge" v-if="index === 3 && cartItemCount > 0">
						<text class="badge-text">{{cartItemCount > 99 ? '99+' : cartItemCount}}</text>
					</view>
				</view>
				<text :class="{'action':tabBarShow===index}">{{item.name}}</text>
			</view>
		</view>
	</view>
</template>

<script>
	import CartManager from '@/utils/cart.js';
	
	export default {
		data() {
			return {
				TabBarList:[
					{
						index: 0,
						name: '首页',
						img: '/static/tabBar/tab_01.png',
						acImg: '/static/tabBar/tab_02.png'
					},
					{
						index: 1,
						name: '分类',
						img: '/static/tabBar/tab_03.png',
						acImg: '/static/tabBar/tab_04.png'
					},
					{
						index: 2,
						name: '发现',
						img: '/static/tabBar/tab_05.png',
						acImg: '/static/tabBar/tab_06.png'
					},
					{
						index: 3,
						name: '购物车',
						img: '/static/tabBar/tab_07.png',
						acImg: '/static/tabBar/tab_08.png'
					},
					{
						index: 4,
						name: '我的',
						img: '/static/tabBar/tab_09.png',
						acImg: '/static/tabBar/tab_10.png'
					},
				],
				codeheight: 0,
				isOverall: 0,
				phoneModel: '',
				cartItemCount: 0, // 购物车商品数量
			};
		},
		props:{
			tabBarShow: {
				type: Number,
				default: 0,
			}
		},
		mounted() {
			try {
			    const res = uni.getSystemInfoSync();
					let that = this;
			    // 获取系统信息
			    uni.getSystemInfo({
			    	success(res) {
			    		console.log(res.brand) //手机牌子
			    		console.log(res.model) //手机型号
			    		console.log(res.screenWidth) //屏幕宽度
			    		console.log(res.screenHeight) //屏幕高度
							that.codeheight = Math.round(res.screenHeight);
							that.phoneModel =res.model
							if(res.model.search('iPhone')){
								that.isOverall = 0;
							}else if(Math.round(res.screenHeight)>740){
							 that.isOverall = 1;
							}
							console.log(that.isOverall);
			    	}
			    });
			} catch (e) {
			    // error
			}
			
			// 初始化购物车数量
			this.updateCartCount();
			
			// 监听页面显示事件，更新购物车数量
			uni.$on('updateCartCount', () => {
				this.updateCartCount();
			});
		},
		beforeDestroy() {
			// 移除事件监听
			uni.$off('updateCartCount');
		},
		methods:{
			/**
			 * 更新购物车数量
			 */
			updateCartCount() {
				try {
					this.cartItemCount = CartManager.getCartItemCount();
					console.log('🛒 TabBar购物车数量更新:', this.cartItemCount);
				} catch (error) {
					console.error('❌ 更新购物车数量失败:', error);
					this.cartItemCount = 0;
				}
			},
			/**
			 * @param {Object} item
			 * @param {Number} index
			 */
			onTabBar(item,index){
				// this.tabBarShow = index;
				switch (index){
					case 0:
						uni.reLaunch({
							url:'/pages/home/home'
						})
						break;
					case 1:
						uni.reLaunch({
							url:'/pages/classify/classify'
						})
						break;
					case 2:
						uni.reLaunch({
							url:'/pages/discover/discover'
						})
						break;
					case 3:
						uni.reLaunch({
							url:'/pages/cart/cart'
						})
						break;
					case 4:
						uni.reLaunch({
							url:'/pages/my/my'
						})
						break;
				}
			}
		}
	}
</script>

<style scoped lang="scss">
	@import 'TabBar.scss';
</style>
