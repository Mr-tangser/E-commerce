<template>
	<view class="page">
		<!-- 地址 -->
		<view class="address-data">
			<view class="address-list" @click="onSkip('address')">
				<view class="list">
					<text>{{ deliveryAddress.province }}{{ deliveryAddress.city }}{{ deliveryAddress.district }}</text>
				</view>
				<view class="list">
					<text class="address">{{ deliveryAddress.detail || deliveryAddress.address }}</text>
				</view>
				<view class="list">
					<text>{{ deliveryAddress.name }}</text>
					<text>{{ deliveryAddress.phone }}</text>
				</view>
				<view class="list">
					<text class="tips">(如果快递不方便接收，您可以选择暂时寄存服务)</text>
				</view>
			</view>
			<view class="bar">

			</view>
		</view>
		<!-- 商品 -->
		<view class="goods-data">
			<view class="goods-title">
				<text>商品信息</text>
			</view>
			<view class="goods-list">
				<view class="list" v-for="(item, index) in orderItems" :key="index">
					<view class="thumb">
						<image :src="item.image" mode="aspectFill"></image>
					</view>
					<view class="item">
						<view class="title">
							<text class="name one-omit">{{ item.name }}</text>
							<text class="attr" v-if="item.attributes">{{ item.attributes }}</text>
						</view>
						<view class="price-number">
							<view class="price">
								<text class="min">￥</text>
								<text class="max">{{ Math.floor(item.price) }}</text>
								<text class="min">.{{ String((item.price % 1).toFixed(2)).split('.')[1] }}</text>
							</view>
							<view class="number">
								<text>x {{ item.quantity }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
			<view class="delivery">
				<div class="list">
					<view class="title">配送</view>
					<view class="content">
						<text>快递运输</text>
						<text class="iconfont icon-more"></text>
					</view>
				</div>
				<div class="list">
					<view class="title">运费险</view>
					<view class="content">
						<text>￥10.00</text>
						<text class="iconfont icon-check"></text>
					</view>
				</div>
				<div class="list">
					<view class="title">留言</view>
					<view class="content">
						<input type="text" placeholder="选填,建议先和商家沟通确认">
					</view>
				</div>
			</view>
		</view>
		<!-- 优惠 -->
		<view class="discounts-data">
			<view class="discounts">
				<div class="list" @click="$refs['InvoiceInfo'].show()">
					<view class="title">发票</view>
					<view class="content">
						<text>不开发票</text>
						<text class="iconfont icon-more"></text>
					</view>
				</div>
				<div class="list" @click="$refs['UseCoupon'].show()">
					<view class="title">优惠券</view>
					<view class="content">
						<text>无可用</text>
						<text class="iconfont icon-more"></text>
					</view>
				</div>
				<div class="list">
					<view class="title">积分</view>
					<view class="content">
						<text>共300，满1000可用</text>
						<!-- <text class="iconfont icon-more"></text> -->
					</view>
				</div>
			</view>
		</view>
		<!-- 订单金额 -->
		<view class="order-price">
			<view class="price-list">
				<view class="list">
					<view class="title">
						<text>商品金额</text>
					</view>
					<view class="price">
						<text>￥299.00</text>
					</view>
				</view>
				<view class="list">
					<view class="title">
						<text>会员折扣</text>
					</view>
					<view class="price">
						<text>-￥19.00</text>
					</view>
				</view>
				<view class="list">
					<view class="title">
						<text>运费</text>
					</view>
					<view class="price">
						<text class="highlight">+￥0.00</text>
					</view>
				</view>
				<view class="list">
					<view class="title">
						<text>运费险</text>
					</view>
					<view class="price">
						<text class="highlight">+￥0.00</text>
					</view>
				</view>
			</view>
		</view>
		<!-- 地址提示 -->
		<view class="address-tips" :style="scrollTop >= 100 ? '':'display:none'">
			<text>{{ deliveryAddress.address }}</text>
		</view>
		<!-- 底部合计提交 -->
		<view class="footer-submit">
			<view class="price">
				<text class="min">￥</text>
				<text class="max">{{ Math.floor(totalAmount) }}</text>
				<text class="min">.{{ String((totalAmount % 1).toFixed(2)).split('.')[1] }}</text>
			</view>
			<view class="submit" @click="onSubmit">
				<text>提交订单</text>
			</view>
		</view>
		<!-- 发票 -->
		<invoice-info ref="InvoiceInfo"></invoice-info>
		<!-- 优惠券 -->
		<use-coupon ref="UseCoupon"></use-coupon>
	</view>
</template>

<script>
	import InvoiceInfo from '../../components/InvoiceInfo/InvoiceInfo.vue';
	import UseCoupon from '../../components/UseCoupon/UseCoupon.vue';
	import api from '@/utils/api.js';
	export default {
		components:{
			// 发票
			InvoiceInfo,
			// 优惠券
			UseCoupon,
		},
		data() {
			return {
				scrollTop: 0,
				// 订单数据
				orderData: null,
			// 收货地址 - 将由loadDeliveryAddress动态加载
			deliveryAddress: {
				name: '请设置收货人',
				phone: '请设置收货电话',
				address: '请选择收货地址',
				detail: '',
				province: '',
				city: '',
				district: ''
			}
			};
		},
		onLoad() {
			// 页面加载时获取订单数据
			this.loadOrderData();
			// 加载收货地址
			this.loadDeliveryAddress();
		},
		onPageScroll(e){
			this.scrollTop = e.scrollTop;
		},
		computed: {
			// 订单商品列表
			orderItems() {
				if (!this.orderData) return [];
				
				// 构建商品信息，包含选择的属性
				const product = this.orderData.product;
				const variants = this.orderData.selectedVariants;
				const quantity = this.orderData.quantity;
				
				// 格式化选择的属性文本
				let attributeText = '';
				if (variants && Object.keys(variants).length > 0) {
					const variantTexts = [];
					for (let variantId in variants) {
						const variant = variants[variantId];
						if (variant && (variant.size || variant.value)) {
							variantTexts.push(variant.size || variant.value);
						}
					}
					attributeText = variantTexts.join('，');
				}
				
				return [{
					id: product.id,
					name: product.name,
					image: product.images && product.images.length > 0 ? product.images[0] : '/static/img/default_product.png',
					price: product.price,
					quantity: quantity,
					attributes: attributeText,
					subtotal: (product.price * quantity).toFixed(2)
				}];
			},
			
			// 订单总价
			totalAmount() {
				if (!this.orderData) return '0.00';
				return this.orderData.totalPrice.toFixed(2);
			}
		},
		
		methods:{
			/**
			 * 加载订单数据
			 */
			loadOrderData() {
				try {
					console.log('📦 开始加载订单数据');
					
					// 从存储中读取订单数据
					const tempOrderData = uni.getStorageSync('tempOrderData');
					
					if (tempOrderData) {
						this.orderData = tempOrderData;
						console.log('✅ 订单数据加载成功:', this.orderData);
						
						// 清除临时数据
						uni.removeStorageSync('tempOrderData');
					} else {
						console.warn('⚠️ 未找到订单数据');
						// 返回上一页或显示错误
						uni.showModal({
							title: '提示',
							content: '订单数据丢失，请重新下单',
							success: (res) => {
								if (res.confirm) {
									uni.navigateBack();
								}
							}
						});
					}
				} catch (error) {
					console.error('❌ 加载订单数据失败:', error);
					uni.showToast({
						title: '加载订单数据失败',
						icon: 'none'
					});
				}
			},
			
			/**
			 * 加载收货地址
			 */
			async loadDeliveryAddress() {
				try {
					console.log('📍 开始加载收货地址和用户信息');
					
					// 1. 先尝试从用户信息获取收货人信息
					let userInfo = null;
					try {
						const token = uni.getStorageSync('token');
						if (token) {
							console.log('🔑 找到用户token，尝试获取用户信息');
							const response = await api.user.getCurrentUserInfo(token);
							if (response.success && response.data && response.data.user) {
								userInfo = response.data.user;
								console.log('👤 用户信息获取成功:', userInfo);
							}
						}
					} catch (error) {
						console.warn('⚠️ 获取用户信息失败，将使用默认值:', error);
						console.warn('错误详情:', error.message || error);
					}
					
					// 2. 从GoodsDetails页面读取用户选择的地址
					const savedAddress = uni.getStorageSync('lastDeliveryAddress');
					
					// 3. 构建收货地址信息
					this.deliveryAddress = {
						// 使用用户基本信息作为收货人信息
						name: (userInfo && userInfo.username) 
							? userInfo.username 
							: '请设置收货人',
						phone: (userInfo && userInfo.phone) 
							? userInfo.phone 
							: '请设置收货电话',
						
						// 地址信息：优先使用用户信息，其次使用选择的地址
						address: '',
						detail: '',
						province: '',
						city: '',
						district: ''
					};
					
					// 4. 设置地址信息 (优先级：选择的地址 > 默认提示)
					// 注意：当前User模型的address只有country字段，详细地址主要来源于用户选择
					if (savedAddress && savedAddress.address) {
						// 使用商品详情页选择的地址
						this.deliveryAddress.address = savedAddress.address;
						this.deliveryAddress.detail = savedAddress.name || '';
						this.deliveryAddress.province = savedAddress.province || '';
						this.deliveryAddress.city = savedAddress.city || '';
						this.deliveryAddress.district = savedAddress.district || '';
						console.log('🗺️ 使用商品详情页选择的地址:', savedAddress.address);
						
					} else {
						// 默认提示
						this.deliveryAddress.address = '请选择收货地址';
						console.log('❓ 未找到收货地址，显示默认提示');
					}
					
					// 5. 检查是否需要提示用户完善信息
					if (this.deliveryAddress.name === '请设置收货人' || this.deliveryAddress.phone === '请设置收货电话') {
						console.log('⚠️ 收货人信息不完整，用户需要完善个人资料');
					}
					
					console.log('✅ 收货地址加载完成:', this.deliveryAddress);
					
				} catch (error) {
					console.error('❌ 加载收货地址失败:', error);
					// 设置默认值
					this.deliveryAddress = {
						name: '请设置收货人',
						phone: '请设置收货电话',
						address: '请选择收货地址',
						detail: '',
						province: '',
						city: '',
						district: ''
					};
				}
			},

			/**
			 * 提交订单
			 */
			onSubmit(){
				if (!this.orderData) {
					uni.showToast({
						title: '订单数据异常',
						icon: 'none'
					});
					return;
				}
				
				// 验证收货人信息
				if (this.deliveryAddress.name === '请设置收货人' || 
					this.deliveryAddress.phone === '请设置收货电话') {
					uni.showModal({
						title: '完善收货信息',
						content: '请先完善收货人信息才能下单',
						confirmText: '去完善',
						cancelText: '取消',
						success: (res) => {
							if (res.confirm) {
								// 跳转到个人资料页面
								uni.navigateTo({
									url: '/pages/UserProfile/UserProfile'
								});
							}
						}
					});
					return;
				}
				
				// 验证收货地址
				if (this.deliveryAddress.address === '请选择收货地址') {
					uni.showModal({
						title: '选择收货地址',
						content: '请先选择收货地址才能下单',
						confirmText: '去选择',
						cancelText: '取消',
						success: (res) => {
							if (res.confirm) {
								// 返回商品详情页选择地址
								uni.navigateBack();
							}
						}
					});
					return;
				}
				
				// 验证手机号格式
				if (!this.validatePhone(this.deliveryAddress.phone)) {
					uni.showToast({
						title: '请检查收货人手机号',
						icon: 'none'
					});
					return;
				}
				
				console.log('🎯 提交订单:', {
					orderData: this.orderData,
					deliveryAddress: this.deliveryAddress
				});
				
				// 跳转到收银台
				uni.redirectTo({
					url: '/pages/CashierDesk/CashierDesk',
				})
			},
      /**
       * 跳转点击
       * @param {String} type 跳转类型
       */
      onSkip(type){
        switch (type){
          case 'address':
            // 如果用户信息不完整，提示完善资料
            if (this.deliveryAddress.name === '请设置收货人' || 
                this.deliveryAddress.phone === '请设置收货电话') {
              uni.showModal({
                title: '提示',
                content: '请先完善个人资料中的收货信息',
                confirmText: '去完善',
                success: (res) => {
                  if (res.confirm) {
                    uni.navigateTo({
                      url: '/pages/UserProfile/UserProfile'
                    });
                  }
                }
              });
            } else {
              uni.navigateTo({
                url: '/pages/AddressList/AddressList',
              })
            }
            break;
        }
      },
      
      /**
       * 验证手机号格式
       */
      validatePhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
      }
		}
	}
</script>

<style scoped lang="scss">
	@import 'ConfirmOrder.scss';
</style>
