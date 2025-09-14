<template>
	<view class="page">
		<view class="head">
			<!-- #ifdef APP-PLUS -->
			<view class="title">购物车</view>
			<!-- #endif -->
			<view class="edit" v-if="cartItems.length > 0" @click="isEdit = !isEdit">
				<text>{{isEdit?'完成':'编辑'}}</text>
			</view>
		</view>
		
		<!-- 购物车列表 -->
		<mescroll-body ref="mescrollRef"
			@down="downCallback"
			@up="upCallback"
			:down="downOption"
			:up="upOption"
			:top="0">
			
			<!-- 购物车为空的状态 -->
			<view class="empty-cart" v-if="cartItems.length === 0">
				<image src="/static/img/goods_01.png" mode="aspectFit"></image>
				<text class="empty-text">购物车还是空的</text>
				<text class="empty-desc">快去选购您喜欢的商品吧~</text>
				<view class="empty-actions">
					<view class="go-shopping" @click="goShopping">
						<text>去购物</text>
					</view>
					<view class="ask-ai" @click="askAIForShopping">
						<text>🤖 咨询AI</text>
					</view>
				</view>
			</view>
			
			<!-- 购物车商品列表 -->
			<view class="cart-list" v-else>
				<view class="list" v-for="item in cartItems" :key="item.id">
					<view class="check" @click="toggleItemSelection(item.id)">
						<text class="iconfont" :class="item.selected ? 'icon-checked' : 'icon-check'"></text>
					</view>
					<view class="goods">
						<view class="thumb" @click="goToProductDetail(item.productId)">
							<image :src="item.image" mode="aspectFill"></image>
						</view>
						<view class="item">
							<view class="title" @click="goToProductDetail(item.productId)">
								<text class="two-omit">{{item.name}}</text>
							</view>
							<view class="attribute" v-if="item.variantText !== '默认规格'">
								<view class="attr">
									<text>{{item.variantText}}</text>
								</view>
							</view>
							<view class="price-num">
								<view class="price">
									<text class="min">￥</text>
									<text class="max">{{item.price}}</text>
								</view>
								<view class="num">
									<view class="add" :class="{ disabled: item.quantity <= 1 }" @click="updateQuantity(item.id, item.quantity - 1)">
										<text class="iconfont icon-jian"></text>
									</view>
									<view class="number">
										<text>{{item.quantity}}</text>
									</view>
									<view class="add" @click="updateQuantity(item.id, item.quantity + 1)">
										<text class="iconfont icon-jia"></text>
									</view>
								</view>
							</view>
						</view>
						<!-- 编辑模式下的删除按钮 -->
						<view class="delete-btn" v-if="isEdit" @click="removeItem(item.id)">
							<text class="iconfont icon-shanchu"></text>
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
					<view class="list" v-for="(item,index) in recommendList" @click="goToProductDetail(item.id)" :key="index">
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
		</mescroll-body>

		<!-- 结算栏 -->
		<view class="close-account" v-if="cartItems.length > 0">
			<view class="check-total">
				<view class="check" @click="toggleSelectAll">
					<text class="iconfont" :class="statistics.allSelected ? 'icon-checked' : 'icon-check'"></text>
					<text class="all">全选</text>
				</view>
				<view class="total">
					<text>合计：</text>
					<text class="price">￥{{statistics.totalAmount.toFixed(2)}}</text>
				</view>
			</view>
			<view class="account">
				<view class="btn-calculate" v-if="!isEdit" @click="goToCheckout">
					<text>去结算({{statistics.selectedItemsCount}})</text>
				</view>
				<view class="btn-del" v-else @click="deleteSelectedItems">
					<text class="del">删除({{statistics.selectedItemsCount}})</text>
				</view>
			</view>
		</view>
		
		<!-- tabbar -->
		<TabBar :tabBarShow="3"></TabBar>
		
		<!-- AI客服浮动按钮 -->
		<ai-float-button 
			:visible="true"
			position="bottom-right"
			page-id="cart"
			@click="onAIServiceClick"
		></ai-float-button>
	</view>
</template>

<script>
import TabBar from '../../components/TabBar/TabBar.vue';
import MescrollMixin from "@/components/mescroll-uni/mescroll-mixins.js";
import CartManager from '@/utils/cart.js';
import AIFloatButton from '../../components/AIFloatButton/AIFloatButton.vue';

	export default {
		mixins: [MescrollMixin],
		components: {
			TabBar,
			AIFloatButton,
		},
		data() {
			return {
				mescroll: null,
				downOption: {},
				upOption: {
					use: false,
					toTop: {
						src: '',
					}
				},
				isEdit: false,
				cartItems: [], // 购物车商品列表
				statistics: { // 购物车统计信息
					totalItems: 0,
					selectedItemsCount: 0,
					totalQuantity: 0,
					totalAmount: 0,
					allSelected: false
				},
				recommendList: [ // 推荐商品列表
					{
						id: 1,
						name: 'BANDALY 2020夏季女装连衣裙韩版大码宽松显瘦套装裙子两件套 JX19301 上豆绿下米白 M ',
						price: '219.00',
						vip_price: '129.00',
						img: '/static/img/goods_thumb_01.png',
						is_goods: 0,
					}, {
						id: 2,
						name: '花花公子 卫衣男秋季圆领薄款休闲体恤男士时尚长袖T恤外套上衣男生情侣装套头衣服秋天男装 白色 XL',
						price: '139.00',
						vip_price: '99.00',
						img: '/static/img/goods_thumb_02.png',
						is_goods: 1,
					}, {
						id: 3,
						name: '【两件套】花花公子PLAYBOY短袖T恤男套装夏季新款卫衣男士韩版修身冰丝宽松运动休闲上衣服裤子男装 CYFS903卡其色 XL',
						price: '168.00',
						vip_price: '158.00',
						img: '/static/img/goods_thumb_03.png',
						is_goods: 1,
					}, {
						id: 4,
						name: '雪域森林短袖T恤男装2020夏季潮流时尚衣服男潮牌圆领印花宽松T恤半袖男 20855橙色 XL',
						price: '68.00',
						vip_price: '36.00',
						img: '/static/img/goods_thumb_04.png',
						is_goods: 0,
					}
				]
			};
		},
		onLoad() {
			this.loadCartData();
		},
		onShow() {
			// 每次显示页面时重新加载购物车数据
			this.loadCartData();
			// 触发TabBar购物车数量更新
			uni.$emit('updateCartCount');
		},
		onReady() {
			uni.hideTabBar();
		},
		methods: {
			/**
			 * 加载购物车数据
			 */
			loadCartData() {
				try {
					this.cartItems = CartManager.getCartItems();
					this.updateStatistics();
					console.log('🛒 购物车数据加载完成:', this.cartItems.length, '个商品');
				} catch (error) {
					console.error('❌ 加载购物车数据失败:', error);
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					});
				}
			},

			/**
			 * 更新购物车统计信息
			 */
			updateStatistics() {
				this.statistics = CartManager.getCartStatistics();
				console.log('📊 购物车统计:', this.statistics);
				
				// 如果购物车为空，自动退出编辑模式
				if (this.cartItems.length === 0 && this.isEdit) {
					this.isEdit = false;
					console.log('🔄 购物车为空，自动退出编辑模式');
				}
			},

			/**
			 * 切换商品选中状态
			 */
			toggleItemSelection(itemId) {
				const result = CartManager.toggleSelection(itemId);
				if (result.success) {
					this.cartItems = result.cartItems;
					this.updateStatistics();
				}
			},

			/**
			 * 全选/取消全选
			 */
			toggleSelectAll() {
				const selectAll = !this.statistics.allSelected;
				const result = CartManager.toggleSelectAll(selectAll);
				if (result.success) {
					this.cartItems = result.cartItems;
					this.updateStatistics();
					console.log(selectAll ? '✅ 已全选' : '❌ 已取消全选');
				}
			},

			/**
			 * 更新商品数量
			 */
			updateQuantity(itemId, newQuantity) {
				if (newQuantity <= 0) {
					// 数量为0时删除商品
					this.removeItem(itemId);
					return;
				}

				const result = CartManager.updateQuantity(itemId, newQuantity);
					if (result.success) {
						this.cartItems = result.cartItems;
						this.updateStatistics();
						// 触发TabBar购物车数量更新
						uni.$emit('updateCartCount');
						console.log('🔢 数量已更新');
					} else {
						uni.showToast({
							title: result.message,
							icon: 'none'
						});
					}
			},

			/**
			 * 删除单个商品
			 */
			removeItem(itemId) {
				uni.showModal({
					title: '确认删除',
					content: '确定要从购物车中删除这个商品吗？',
					success: (res) => {
						if (res.confirm) {
							const result = CartManager.removeFromCart(itemId);
							if (result.success) {
								this.cartItems = result.cartItems;
								this.updateStatistics();
								// 触发TabBar购物车数量更新
								uni.$emit('updateCartCount');
								uni.showToast({
									title: '已删除',
									icon: 'success'
								});
							} else {
								uni.showToast({
									title: result.message,
									icon: 'none'
								});
							}
						}
					}
				});
			},

			/**
			 * 删除选中商品
			 */
			deleteSelectedItems() {
				if (this.statistics.selectedItemsCount === 0) {
					uni.showToast({
						title: '请选择要删除的商品',
						icon: 'none'
					});
					return;
				}

				uni.showModal({
					title: '确认删除',
					content: `确定要删除选中的 ${this.statistics.selectedItemsCount} 个商品吗？`,
					success: (res) => {
						if (res.confirm) {
							const result = CartManager.removeSelectedItems();
							if (result.success) {
								this.cartItems = result.cartItems;
								this.updateStatistics();
								this.isEdit = false; // 删除后退出编辑模式
								// 触发TabBar购物车数量更新
								uni.$emit('updateCartCount');
								uni.showToast({
									title: result.message,
									icon: 'success'
								});
							} else {
								uni.showToast({
									title: result.message,
									icon: 'none'
								});
							}
						}
					}
				});
			},

			/**
			 * 去结算
			 */
			goToCheckout() {
				if (this.statistics.selectedItemsCount === 0) {
					uni.showToast({
						title: '请选择要结算的商品',
						icon: 'none'
					});
					return;
				}

				try {
					// 获取选中的商品
					const selectedItems = CartManager.getSelectedItems();
					console.log('💳 准备结算商品:', selectedItems);

					// 将选中商品数据转换为订单数据格式
					const orderData = {
						orderType: 'cart_checkout',
						orderItems: selectedItems.map(item => ({
							id: item.productId,
							name: item.name,
							price: item.price,
							quantity: item.quantity,
							attributes: item.variantText,
							image: item.image,
							subtotal: item.price * item.quantity
						})),
						productAmount: this.statistics.totalAmount,
						totalAmount: this.statistics.totalAmount,
						createdAt: new Date().toISOString()
					};

					// 保存订单数据到本地存储
					uni.setStorageSync('tempOrderData', orderData);
					console.log('💾 结算数据已保存:', orderData);

					// 跳转到订单确认页面
					uni.navigateTo({
						url: '/pages/ConfirmOrder/ConfirmOrder'
					});

				} catch (error) {
					console.error('❌ 结算失败:', error);
					uni.showToast({
						title: '结算失败',
						icon: 'none'
					});
				}
			},

			/**
			 * 去购物（购物车为空时）
			 */
			goShopping() {
				uni.switchTab({
					url: '/pages/home/home'
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

			/* 下拉刷新的回调 */
			downCallback() {
				// 重新加载购物车数据
				this.loadCartData();
				this.mescroll.endSuccess();
			},

			/* 上拉加载的回调 */
			upCallback(page) {
				// 购物车页面不需要分页加载
				this.mescroll.endByPage(10, 20);
			},

			/**
			 * 购物车为空时咨询AI
			 */
			askAIForShopping() {
				console.log('🤖 用户在空购物车时咨询AI');
				
				uni.navigateTo({
					url: '/pages/AICustomerService/AICustomerService?from=empty-cart&context=shopping-advice',
					success: () => {
						console.log('✅ 成功跳转到AI客服页面');
						
						// 可以预设一些购物咨询的快捷问题
						// 这里可以通过URL参数传递上下文
					},
					fail: (error) => {
						console.error('❌ 跳转AI客服页面失败:', error);
						
						// 降级处理：显示购物建议
						uni.showModal({
							title: '购物建议',
							content: '需要购物建议吗？\n\n• 查看热门商品推荐\n• 咨询客服获取个性化建议\n• 浏览分类找到心仪商品',
							confirmText: '联系客服',
							cancelText: '去购物',
							success: (res) => {
								if (res.confirm) {
									uni.makePhoneCall({
										phoneNumber: '400-123-4567'
									});
								} else {
									this.goShopping();
								}
							}
						});
					}
				});
			},

			/**
			 * AI客服按钮点击事件
			 */
			onAIServiceClick(data) {
				console.log('🤖 购物车AI客服按钮被点击:', data);
				
				// 可以在这里添加购物车特有的逻辑
				try {
					// 记录用户在购物车使用AI客服的行为
					const clickInfo = {
						page: 'cart',
						timestamp: new Date().toISOString(),
						cartItemsCount: this.cartItems.length,
						selectedItemsCount: this.statistics.selectedItemsCount,
						totalPrice: this.statistics.totalPrice,
						userAgent: navigator.userAgent || 'unknown'
					};
					
					// 保存到本地存储用于分析
					const existingClicks = uni.getStorageSync('ai_service_analytics') || [];
					existingClicks.push(clickInfo);
					
					// 只保留最近50条记录
					if (existingClicks.length > 50) {
						existingClicks.splice(0, existingClicks.length - 50);
					}
					
					uni.setStorageSync('ai_service_analytics', existingClicks);
					
					console.log('📊 购物车AI客服使用统计已记录');
				} catch (error) {
					console.warn('⚠️ 统计记录失败:', error);
				}
			}
		}
	}
</script>

<style scoped lang="scss">
	@import 'cart.scss';

	/* 购物车为空的样式 */
	.empty-cart {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 200rpx 40rpx 80rpx;
		text-align: center;

		image {
			width: 160rpx;
			height: 160rpx;
			margin-bottom: 30rpx;
		}

		.empty-text {
			font-size: 30rpx;
			color: #666;
			margin-bottom: 15rpx;
		}

		.empty-desc {
			font-size: 26rpx;
			color: #999;
			margin-bottom: 40rpx;
		}

		/* 空购物车按钮容器 */
		.empty-actions {
			display: flex;
			gap: 30rpx;
			width: 100%;
			justify-content: center;
			max-width: 500rpx;
		}

		.go-shopping {
			background: #ff6b35;
			color: white;
			padding: 18rpx 40rpx;
			border-radius: 50rpx;
			font-size: 26rpx;
			flex: 1;
			text-align: center;
			
			&:active {
				background: #e85a2f;
			}
		}
		
		.ask-ai {
			background: linear-gradient(45deg, #ff4757, #ff3742);
			color: white;
			padding: 18rpx 40rpx;
			border-radius: 50rpx;
			font-size: 24rpx;
			flex: 1;
			text-align: center;
			border: 2rpx solid rgba(255, 255, 255, 0.3);
			
			&:active {
				background: linear-gradient(45deg, #e84058, #e8303e);
			}
		}
	}

	/* 编辑模式下的删除按钮 */
	.delete-btn {
		position: absolute;
		right: 20rpx;
		top: 50%;
		transform: translateY(-50%);
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #ff4757;
		border-radius: 50%;
		
		.iconfont {
			color: white;
			font-size: 32rpx;
		}
	}

	/* 禁用状态样式 */
	.disabled {
		opacity: 0.3;
		pointer-events: none;
	}
</style>