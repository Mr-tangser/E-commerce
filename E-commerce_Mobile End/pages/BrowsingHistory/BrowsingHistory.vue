<template>
	<view class="page">
		<!-- 编辑 -->
		<view class="article-edit">
			<view class="edit" @click="clearAllHistory" v-if="!isEdit && historyGroups.length > 0">
				<text>清空</text>
			</view>
			<view class="edit" @click="toggleEditMode" v-if="historyGroups.length > 0">
				<text>{{isEdit?'完成':'编辑'}}</text>
			</view>
		</view>
		
		<!-- 空状态 -->
		<view class="empty-history" v-if="historyGroups.length === 0">
			<view class="empty-icon">
				<text class="iconfont icon-browse" style="font-size: 120rpx; color: #ddd;"></text>
			</view>
			<view class="empty-text">暂无浏览记录</view>
			<view class="empty-desc">去商城看看有什么好物吧~</view>
			<view class="go-shopping" @click="goShopping">
				<text>去逛逛</text>
			</view>
		</view>
		
		<!-- 记录列表 -->
		<view class="record-data" v-if="historyGroups.length > 0">
			<view class="record-list" v-for="(group, index) in historyGroups" :key="index">
				<view class="record-date">
					<text>{{group.dateText}}</text>
					<text class="count">({{group.items.length}}件商品)</text>
				</view>
				<view class="goods-list">
					<view class="list" 
						v-for="item in group.items" 
						:key="item.id"
						@click="!isEdit && goToProductDetail(item.id)">
						<view class="check" 
							:style="isEdit ? 'display: flex' : 'display: none'"
							@click.stop="toggleItemSelection(item.id)">
							<text class="iconfont" 
								:class="selectedItems.includes(item.id) ? 'icon-checked' : 'icon-check'"></text>
						</view>
						<view class="thumb">
							<image :src="item.img || '/static/img/default_product.png'" mode="aspectFill"></image>
						</view>
						<view class="item">
							<view class="title">
								<text class="two-omit">{{item.name}}</text>
							</view>
							<view class="browse-info">
								<text class="browse-time">{{formatBrowseTime(item.browsedAt)}}</text>
								<text class="view-count" v-if="item.viewCount > 1">浏览{{item.viewCount}}次</text>
							</view>
							<view class="price-more">
								<view class="price">￥{{item.price}}</view>
							</view>
							<view class="goods-btn" v-if="!isEdit">
								<view class="btn" @click.stop="findSimilar(item)">
									<text>看相似</text>
								</view>
								<view class="cart" @click.stop="addToCart(item)">
									<text class="iconfont icon-cart"></text>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 编辑模式底部按钮 -->
		<view class="footer-btn" v-if="isEdit && historyGroups.length > 0">
			<view class="select-all" @click="toggleSelectAll">
				<text class="iconfont" :class="isAllSelected ? 'icon-checked' : 'icon-check'"></text>
				<text>全选</text>
			</view>
			<view class="btn" @click="deleteSelected" :class="{ disabled: selectedItems.length === 0 }">
				删除({{selectedItems.length}})
			</view>
		</view>
	</view>
</template>

<script>
import BrowsingHistory from '@/utils/browsing-history.js';

	export default {
		data() {
			return {
				isEdit: false,
			historyGroups: [], // 按日期分组的浏览记录
			selectedItems: [], // 选中的商品ID列表
		};
	},
	computed: {
		// 是否全选
		isAllSelected() {
			if (this.historyGroups.length === 0) return false;
			const allItemIds = this.getAllItemIds();
			return allItemIds.length > 0 && allItemIds.every(id => this.selectedItems.includes(id));
		}
	},
	onLoad() {
		this.loadBrowsingHistory();
	},
	onShow() {
		// 每次显示页面时重新加载数据
		this.loadBrowsingHistory();
	},
	methods: {
		/**
		 * 加载浏览记录
		 */
		loadBrowsingHistory() {
			try {
				const history = BrowsingHistory.getHistory();
				this.historyGroups = this.groupHistoryByDate(history);
				console.log('📖 浏览记录加载完成:', this.historyGroups.length, '个分组');
			} catch (error) {
				console.error('❌ 加载浏览记录失败:', error);
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				});
			}
		},
		
		/**
		 * 按日期分组浏览记录
		 */
		groupHistoryByDate(history) {
			const groups = [];
			const groupMap = new Map();
			
			history.forEach(item => {
				const date = new Date(item.browsedAt);
				const dateKey = this.getDateKey(date);
				
				if (!groupMap.has(dateKey)) {
					const group = {
						dateKey: dateKey,
						dateText: this.formatDate(date),
						items: []
					};
					groups.push(group);
					groupMap.set(dateKey, group);
				}
				
				groupMap.get(dateKey).items.push(item);
			});
			
			return groups;
		},
		
		/**
		 * 获取日期键值（用于分组）
		 */
		getDateKey(date) {
			const year = date.getFullYear();
			const month = date.getMonth() + 1;
			const day = date.getDate();
			return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
		},
		
		/**
		 * 格式化日期显示
		 */
		formatDate(date) {
			const now = new Date();
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
			const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
			
			if (itemDate.getTime() === today.getTime()) {
				return '今天';
			} else if (itemDate.getTime() === yesterday.getTime()) {
				return '昨天';
			} else {
				const month = date.getMonth() + 1;
				const day = date.getDate();
				return `${month}月${day}日`;
			}
		},
		
		/**
		 * 格式化浏览时间
		 */
		formatBrowseTime(timestamp) {
			const date = new Date(timestamp);
			const hours = date.getHours().toString().padStart(2, '0');
			const minutes = date.getMinutes().toString().padStart(2, '0');
			return `${hours}:${minutes}`;
		},
		
		/**
		 * 切换编辑模式
		 */
		toggleEditMode() {
			this.isEdit = !this.isEdit;
			if (!this.isEdit) {
				// 退出编辑模式时清空选择
				this.selectedItems = [];
			}
		},
		
		/**
		 * 切换商品选中状态
		 */
		toggleItemSelection(itemId) {
			const index = this.selectedItems.indexOf(itemId);
			if (index > -1) {
				this.selectedItems.splice(index, 1);
			} else {
				this.selectedItems.push(itemId);
			}
		},
		
		/**
		 * 全选/取消全选
		 */
		toggleSelectAll() {
			if (this.isAllSelected) {
				// 取消全选
				this.selectedItems = [];
			} else {
				// 全选
				this.selectedItems = this.getAllItemIds();
			}
		},
		
		/**
		 * 获取所有商品ID
		 */
		getAllItemIds() {
			const allIds = [];
			this.historyGroups.forEach(group => {
				group.items.forEach(item => {
					allIds.push(item.id);
				});
			});
			return allIds;
		},
		
		/**
		 * 删除选中商品
		 */
		deleteSelected() {
			if (this.selectedItems.length === 0) {
				uni.showToast({
					title: '请选择要删除的商品',
					icon: 'none'
				});
				return;
			}
			
			uni.showModal({
				title: '确认删除',
				content: `确定要删除选中的 ${this.selectedItems.length} 个浏览记录吗？`,
				success: (res) => {
					if (res.confirm) {
						// 批量删除
						this.selectedItems.forEach(itemId => {
							BrowsingHistory.removeProduct(itemId);
						});
						
						// 重新加载数据
						this.loadBrowsingHistory();
						
						// 退出编辑模式
						this.isEdit = false;
						this.selectedItems = [];
						
						uni.showToast({
							title: '删除成功',
							icon: 'success'
						});
					}
				}
			});
		},
		
		/**
		 * 清空所有浏览记录
		 */
		clearAllHistory() {
			uni.showModal({
				title: '确认清空',
				content: '确定要清空所有浏览记录吗？此操作不可恢复',
				success: (res) => {
					if (res.confirm) {
						BrowsingHistory.clearHistory();
						this.loadBrowsingHistory();
						
						uni.showToast({
							title: '已清空',
							icon: 'success'
						});
					}
				}
			});
		},
		
		/**
		 * 跳转到商品详情页
		 */
		goToProductDetail(productId) {
			uni.navigateTo({
				url: `/pages/GoodsDetails/GoodsDetails?id=${productId}`,
				animationType: 'zoom-fade-out',
				animationDuration: 200
			});
		},
		
		/**
		 * 看相似商品
		 */
		findSimilar(item) {
			// TODO: 实现相似商品推荐页面
			uni.showToast({
				title: '相似商品功能开发中',
				icon: 'none'
			});
		},
		
		/**
		 * 加入购物车
		 */
		addToCart(item) {
			try {
				const CartManager = require('@/utils/cart.js').default;
				
				// 构建购物车商品数据
				const cartItemData = {
					productId: item.id,
					name: item.name,
					price: item.price,
					image: item.img,
					variants: {}, // 浏览记录中没有属性信息，使用默认
					quantity: 1
				};
				
				const result = CartManager.addToCart(cartItemData);
				
				if (result.success) {
					uni.showToast({
						title: '已添加到购物车',
						icon: 'success'
					});
					
					// 触发TabBar购物车数量更新
					uni.$emit('updateCartCount');
				}
				
			} catch (error) {
				console.error('❌ 添加购物车失败:', error);
				uni.showToast({
					title: '添加失败',
					icon: 'none'
				});
			}
		},
		
		/**
		 * 去逛逛（空状态）
		 */
		goShopping() {
			uni.switchTab({
				url: '/pages/home/home'
			});
		}
		}
	}
</script>

<style scoped lang="scss">
	@import 'BrowsingHistory.scss';
	
	// 空状态样式
	.empty-history {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 200rpx 40rpx;
		text-align: center;
		
		.empty-icon {
			margin-bottom: 40rpx;
		}
		
		.empty-text {
			font-size: 32rpx;
			color: #666;
			margin-bottom: 20rpx;
		}
		
		.empty-desc {
			font-size: 28rpx;
			color: #999;
			margin-bottom: 60rpx;
		}
		
		.go-shopping {
			background: #ff6b35;
			color: white;
			padding: 20rpx 60rpx;
			border-radius: 60rpx;
			font-size: 28rpx;
		}
	}
	
	// 记录日期样式增强
	.record-date {
		display: flex;
		align-items: center;
		gap: 20rpx;
		
		.count {
			font-size: 24rpx;
			color: #999;
		}
	}
	
	// 浏览信息样式
	.browse-info {
		display: flex;
		align-items: center;
		gap: 20rpx;
		margin-bottom: 10rpx;
		
		.browse-time {
			font-size: 24rpx;
			color: #999;
		}
		
		.view-count {
			font-size: 24rpx;
			color: #666;
			background: #f5f5f5;
			padding: 4rpx 8rpx;
			border-radius: 8rpx;
		}
	}
	
	// 选中状态样式
	.icon-checked {
		color: #ff6b35;
	}
	
	// 底部按钮样式增强
	.footer-btn {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: white;
		padding: 20rpx 30rpx;
		box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.1);
		display: flex;
		align-items: center;
		justify-content: space-between;
		
		.select-all {
			display: flex;
			align-items: center;
			gap: 10rpx;
			font-size: 28rpx;
			
			.iconfont {
				font-size: 32rpx;
			}
		}
		
		.btn {
			background: #ff6b35;
			color: white;
			padding: 16rpx 40rpx;
			border-radius: 8rpx;
			font-size: 28rpx;
			
			&.disabled {
				background: #ccc;
				color: #999;
			}
		}
	}
</style>