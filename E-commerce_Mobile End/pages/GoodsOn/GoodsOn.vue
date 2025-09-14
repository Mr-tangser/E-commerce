<template>
	<view class="page">
		<!-- 简化的头部操作栏 -->
		<view class="header-bar">
			<view class="title">
				<text>我的收藏</text>
				<text class="count" v-if="favoriteList.length > 0">({{ favoriteList.length }})</text>
			</view>
			<view class="action-btn" @click="toggleEditMode" v-if="favoriteList.length > 0">
				<text>{{ isEdit ? '完成' : '编辑' }}</text>
			</view>
		</view>
		
		<view class="goods-list" v-if="!loading">
			<!-- 有收藏商品时 -->
			<view class="list" v-for="item in favoriteList" :key="item._id" @click="!isEdit && goToGoodsDetail(item.product)">
				<view class="check" :style="isEdit?'display: flex':'display: none'" @click.stop="toggleSelect(item._id)">
					<text class="iconfont" :class="selectedItems.includes(item._id) ? 'icon-check action' : 'icon-check'"></text>
				</view>
				<view class="thumb">
					<image :src="item.product.images && item.product.images.length > 0 ? item.product.images[0] : '/static/img/default_product.png'" mode="aspectFill" @error="onImageError"></image>
				</view>
				<view class="item">
					<view class="title">
						<text class="two-omit">{{ item.product.name }}</text>
					</view>
					<view class="price-more">
						<view class="price">￥{{ item.product.price.toFixed(2) }}</view>
						<view class="depreciate" :style="!isEdit?'display: flex':'display: none'" v-if="item.favoritePrice > item.product.price">
							<text>比关注时降价{{ (item.favoritePrice - item.product.price).toFixed(2) }}元</text>
						</view>
					</view>
					<view class="goods-btn">
						<view class="btn">
							<text @click.stop="viewSimilar(item.product._id)">看相似</text>
							<text @click.stop="togglePriceNotification(item)">{{ item.priceNotification ? '降价通知' : '开启通知' }}</text>
						</view>
						<view class="cart" @click.stop="addToCart(item.product)">
							<text class="iconfont icon-cart"></text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 没有收藏商品时 -->
			<view class="empty-state" v-if="favoriteList.length === 0">
				<image src="/static/img/empty_favorite.png" mode="aspectFit"></image>
				<text class="empty-text">暂无收藏商品</text>
				<text class="empty-hint">快去收藏喜欢的商品吧~</text>
				<view class="empty-btn" @click="goToHome">
					<text>去逛逛</text>
				</view>
			</view>
		</view>
		
		<!-- 加载状态 -->
		<view class="loading-container" v-if="loading">
			<view class="loading-item" v-for="n in 6" :key="n">
				<view class="loading-thumb"></view>
				<view class="loading-content">
					<view class="loading-title"></view>
					<view class="loading-price"></view>
				</view>
			</view>
		</view>
		
		<!-- 底部操作栏 -->
		<view class="footer-btn" :style="isEdit?'display: flex':'display: none'">
			<view class="select-all" @click="toggleSelectAll">
				<text class="iconfont" :class="isAllSelected ? 'icon-check action' : 'icon-check'"></text>
				<text>全选</text>
			</view>
			<view class="btn" @click="batchRemoveFavorites" :class="{ 'disabled': selectedItems.length === 0 }">
				取消关注({{ selectedItems.length }})
			</view>
		</view>
	</view>
</template>

<script>
	import FavoriteManager from '@/utils/favorites.js';
	
	export default {
		data() {
			return {
				isEdit: false,
				loading: true,
				favoriteList: [], // 收藏列表
				selectedItems: [], // 选中的商品ID列表
				currentPage: 1,
				totalPages: 1,
				pageSize: 12,
			};
		},
		
		computed: {
			// 是否全选
			isAllSelected() {
				return this.favoriteList.length > 0 && this.selectedItems.length === this.favoriteList.length;
			}
		},
		
		onLoad() {
			console.log('📋 商品收藏页面加载');
			this.loadFavoriteList();
		},
		
		onShow() {
			// 每次显示页面时刷新收藏列表
			this.refreshFavoriteList();
		},
		
		// 监听收藏状态变化事件
		onReady() {
			uni.$on('favoriteStatusChanged', this.handleFavoriteStatusChanged);
		},
		
		onUnload() {
			uni.$off('favoriteStatusChanged', this.handleFavoriteStatusChanged);
		},
		
		methods: {
			/**
			 * 切换编辑模式
			 */
			toggleEditMode() {
				this.isEdit = !this.isEdit;
				// 退出编辑模式时清空选择
				if (!this.isEdit) {
					this.selectedItems = [];
				}
			},
			
			/**
			 * 加载收藏商品列表
			 */
			async loadFavoriteList() {
				try {
					this.loading = true;
					console.log('🔄 开始加载收藏列表');
					
					const result = await FavoriteManager.getFavoriteList({
						page: this.currentPage,
						limit: this.pageSize,
						type: 'product'
					});
					
					if (result.success) {
						this.favoriteList = result.data.favorites || [];
						this.currentPage = result.data.pagination?.page || 1;
						this.totalPages = result.data.pagination?.pages || 1;
						
						console.log('✅ 收藏列表加载成功:', this.favoriteList.length, '个商品');
					} else {
						throw new Error(result.message || '加载收藏列表失败');
					}
				} catch (error) {
					console.error('❌ 加载收藏列表失败:', error);
					uni.showToast({
						title: '加载失败，请重试',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},
			
			/**
			 * 刷新收藏列表
			 */
			async refreshFavoriteList() {
				this.currentPage = 1;
				await this.loadFavoriteList();
			},
			
			/**
			 * 处理收藏状态变化事件
			 */
			handleFavoriteStatusChanged(data) {
				console.log('📡 收到收藏状态变化事件:', data);
				// 刷新列表以反映最新状态
				this.refreshFavoriteList();
			},
			
			/**
			 * 切换选中状态
			 */
			toggleSelect(itemId) {
				const index = this.selectedItems.indexOf(itemId);
				if (index > -1) {
					this.selectedItems.splice(index, 1);
				} else {
					this.selectedItems.push(itemId);
				}
			},
			
			/**
			 * 切换全选状态
			 */
			toggleSelectAll() {
				if (this.isAllSelected) {
					this.selectedItems = [];
				} else {
					this.selectedItems = this.favoriteList.map(item => item._id);
				}
			},
			
			/**
			 * 批量取消收藏
			 */
			async batchRemoveFavorites() {
				if (this.selectedItems.length === 0) {
					uni.showToast({
						title: '请先选择要取消收藏的商品',
						icon: 'none'
					});
					return;
				}
				
				uni.showModal({
					title: '确认操作',
					content: `确定要取消收藏这${this.selectedItems.length}个商品吗？`,
					success: async (res) => {
						if (res.confirm) {
							try {
								// 提取商品ID列表
								const productIds = this.selectedItems.map(id => {
									const item = this.favoriteList.find(fav => fav._id === id);
									return item ? item.product._id : null;
								}).filter(id => id !== null);
								
								console.log('❌ 批量取消收藏:', productIds);
								
								const result = await FavoriteManager.batchRemoveFavorites(productIds);
								
								if (result.success) {
									uni.showToast({
										title: result.message,
										icon: 'success'
									});
									
									// 重置选中状态并刷新列表
									this.selectedItems = [];
									this.isEdit = false;
									await this.refreshFavoriteList();
								} else {
									throw new Error(result.message);
								}
							} catch (error) {
								console.error('❌ 批量取消收藏失败:', error);
								uni.showToast({
									title: error.message || '操作失败，请重试',
									icon: 'none'
								});
							}
						}
					}
				});
			},
			
			/**
			 * 跳转到商品详情页
			 */
			goToGoodsDetail(product) {
				console.log('🔗 跳转到商品详情页:', product._id);
				uni.navigateTo({
					url: `/pages/GoodsDetails/GoodsDetails?id=${product._id}`
				});
			},
			
			/**
			 * 查看相似商品
			 */
			viewSimilar(productId) {
				console.log('👀 查看相似商品:', productId);
				// 这里可以跳转到相似商品页面或弹窗展示
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				});
			},
			
			/**
			 * 切换降价通知
			 */
			async togglePriceNotification(item) {
				try {
					console.log('🔔 切换降价通知:', item.product.name);
					
					// 这里可以调用API更新降价通知设置
					// 目前只显示提示
					const newStatus = !item.priceNotification;
					uni.showToast({
						title: newStatus ? '已开启降价通知' : '已关闭降价通知',
						icon: 'success'
					});
					
					// 更新本地状态
					item.priceNotification = newStatus;
					
				} catch (error) {
					console.error('❌ 切换降价通知失败:', error);
					uni.showToast({
						title: '操作失败，请重试',
						icon: 'none'
					});
				}
			},
			
			/**
			 * 添加到购物车
			 */
			async addToCart(product) {
				try {
					console.log('🛒 添加到购物车:', product.name);
					
					// 构建购物车商品数据
					const cartItemData = {
						productId: product._id,
						name: product.name,
						price: product.price,
						image: product.images && product.images.length > 0 
							? product.images[0] 
							: '/static/img/default_product.png',
						variants: {}, // 默认规格
						quantity: 1
					};
					
					// 使用购物车管理器添加商品
					const CartManager = require('@/utils/cart.js').default;
					const result = CartManager.addToCart(cartItemData);
					
					if (result.success) {
						uni.showToast({
							title: result.message,
							icon: 'success'
						});
						
						// 触发TabBar购物车数量更新
						uni.$emit('updateCartCount');
					} else {
						throw new Error(result.message);
					}
					
				} catch (error) {
					console.error('❌ 添加购物车失败:', error);
					uni.showToast({
						title: error.message || '添加购物车失败',
						icon: 'none'
					});
				}
			},
			
			/**
			 * 跳转到首页
			 */
			goToHome() {
				uni.switchTab({
					url: '/pages/index/index'
				});
			},
			
			/**
			 * 图片加载失败处理
			 */
			onImageError(e) {
				console.warn('图片加载失败:', e);
				// 可以设置默认图片
			}
		}
	}
</script>

<style scoped lang="scss">
	@import 'GoodsOn.scss';
</style>
