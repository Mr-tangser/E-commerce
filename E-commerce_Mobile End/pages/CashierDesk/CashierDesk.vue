<template>
	<view class="page">
		<view class="price-count-down">
			<view class="price">
				<text class="min">￥</text>
				<text class="max">{{Math.floor(orderInfo.amount)}}</text>
				<text class="min">.{{(orderInfo.amount % 1).toFixed(2).substring(2)}}</text>
			</view>
			<view class="count-down">
				<view class="title">支付剩余时间</view>
				<view class="count">
					<text class="time">{{formatTime(hour)}}</text>
					<text class="dot">:</text>
					<text class="time">{{formatTime(min)}}</text>
					<text class="dot">:</text>
					<text class="time">{{formatTime(sec)}}</text>
				</view>
			</view>
		</view> 
		<!-- 支付方式列表 -->
		<view class="pay-way">
			<view class="pay-list">
				<view class="list" v-for="(item,index) in PayList" 
				@click="onPayWay(item,index)"
				:key="index">
					<view class="pay-type">
						<image :src="item.icon" mode=""></image>
						<text>{{item.name}}</text>
					</view>
					<view class="check">
						<text class="iconfont" :class="PayWay === index ? 'icon-checked action':'icon-check'"></text>
					</view>
				</view>
			</view>
		</view>
		<view class="pay-submit">
			<view class="submit" @click="onSubmit">{{PayPirce}}</view>
		</view>
	</view>
</template>

<script>
	// 导入环境配置
	import ENV_CONFIG from '../../config/env.js';
	
	export default {
		data() {
			return {
				PayList: [
					{
						icon: '/static/zfb_pay.png',
						name: '支付宝支付',
						code: 'alipay'
					},{
						icon: '/static/ye_pay.png',
						name: '余额支付',
						code: 'balance'
					},
				],
				PayWay: 0,
				PayPirce: `支付宝支付￥299.00`,
				CountDown: 900, // 15分钟倒计时
				day: 0,
				hour: 0,
				min: 0,
				sec: 0,
				// 订单信息
				orderInfo: {
					orderId: '',
					amount: 299.00,
					subject: '商城订单支付'
				},
				// 实际创建的订单号（用于查询状态）
				actualOrderNumber: '',
				isLoading: false
			};
		},
		async onShow() {
			// 页面显示时测试API连通性
			this.testAPIConnection();
		},
		
		onLoad(options){
			console.log('💰 收银台页面参数:', options);
			
			// 获取URL参数中的订单信息
			if (options.orderId) {
				this.orderInfo.orderId = options.orderId;
			}
			if (options.amount) {
				this.orderInfo.amount = parseFloat(options.amount);
			}
			if (options.subject) {
				this.orderInfo.subject = decodeURIComponent(options.subject);
			}
			
			// 从本地存储获取完整的订单信息
			try {
				const savedOrderInfo = uni.getStorageSync('currentOrderInfo');
				if (savedOrderInfo) {
					console.log('📦 从本地存储获取订单信息:', savedOrderInfo);
					
					// 更新订单信息，优先使用本地存储的完整数据
					this.orderInfo = {
						...this.orderInfo,
						...savedOrderInfo
					};
					
					console.log('✅ 订单信息更新完成:', this.orderInfo);
				}
			} catch (error) {
				console.error('❌ 获取本地订单信息失败:', error);
			}
			
			// 更新支付价格显示
			this.updatePayPrice();
			
			// 启动倒计时
			this.CountDownData();
		},
		methods:{
			/**
			 * 支付方式切换点击
			 */
			onPayWay(item,index){
				this.PayWay = index;
				this.PayPirce = `${item.name}￥${this.orderInfo.amount.toFixed(2)}`
			},
			
			/**
			 * 更新支付价格显示
			 */
			updatePayPrice(){
				const selectedPayment = this.PayList[this.PayWay];
				this.PayPirce = `${selectedPayment.name}￥${this.orderInfo.amount.toFixed(2)}`;
			},
			
			/**
			 * 时间格式化 - 补零
			 */
			formatTime(time) {
				return time.toString().padStart(2, '0');
			},
			
			/**
			 * 倒计时
			 */
			CountDownData(){
				if (this.CountDown <= 0) {
					this.onPaymentTimeout();
					return;
				}
				
				// 计算时分秒
				this.day = parseInt(this.CountDown / (24*60*60));
				this.hour = parseInt(this.CountDown / (60 * 60) % 24);
				this.min = parseInt(this.CountDown / 60 % 60);
				this.sec = parseInt(this.CountDown % 60);
				
				// 减少1秒
				this.CountDown--;
				
				// 1秒后继续倒计时
				setTimeout(() => {
					this.CountDownData();
				}, 1000);
			},
			
			/**
			 * 支付超时处理
			 */
			onPaymentTimeout(){
				uni.showModal({
					title: '支付超时',
					content: '支付时间已过期，请重新下单',
					showCancel: false,
					success: () => {
						uni.navigateBack();
					}
				});
			},
			
			/**
			 * 支付点击
			 */
			async onSubmit(){
				if (this.isLoading) return;
				
				const selectedPayment = this.PayList[this.PayWay];
				
				if (selectedPayment.code === 'alipay') {
					await this.handleAlipayPayment();
				} else if (selectedPayment.code === 'balance') {
					await this.handleBalancePayment();
				}
			},
			
			/**
			 * 处理支付宝支付
			 */
			async handleAlipayPayment(){
				this.isLoading = true;
				
				// 检查订单ID
				if (!this.orderInfo.orderId) {
					uni.showModal({
						title: '提示',
						content: '缺少订单信息，是否使用测试订单？',
						success: (res) => {
							if (res.confirm) {
								// 创建临时测试订单ID
								this.orderInfo.orderId = 'TEST_' + Date.now();
								this.processAlipayPayment();
							}
						}
					});
					this.isLoading = false;
					return;
				}
				
				this.processAlipayPayment();
			},
			
			/**
			 * 处理支付宝支付请求
			 */
			async processAlipayPayment(){
				uni.showLoading({
					title: '正在创建支付订单...',
					mask: true
				});
				
			console.log('发送支付请求，参数：', {
				orderId: this.orderInfo.orderId,
				amount: this.orderInfo.amount,
				subject: this.orderInfo.subject
			});
			
		try {
		// 从配置模块获取API地址
		const apiBaseUrl = ENV_CONFIG.BASE_URL;
		console.log('💰 支付API地址:', apiBaseUrl);
		
		const token = uni.getStorageSync('token');
		console.log('🔑 Token信息:', token ? `已获取token(长度: ${token.length})` : '未获取到token');
		
		const requestData = {
			orderId: this.orderInfo.orderId,
			amount: this.orderInfo.amount,
			subject: this.orderInfo.subject,
			originalOrderInfo: this.orderInfo // 传递完整的原始订单信息
		};
		
		console.log('📤 发送到后端的完整请求数据:', {
			url: `${apiBaseUrl}/payment/zf`,
			headers: {
				'Authorization': token ? `Bearer ${token.substring(0, 20)}...` : 'None',
				'Content-Type': 'application/json'
			},
			data: requestData
		});
				
			// 调用后端创建支付宝支付订单
						const response = await uni.request({
		url: `${apiBaseUrl}/payment/zf`,
			method: 'POST',
			header: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					data: requestData
				});
					
					uni.hideLoading();
					
					console.log('后端响应：', response);
					
					// 处理uni.request可能返回数组的情况
					let actualResponse = response;
					if (Array.isArray(response) && response.length > 1) {
						actualResponse = response[1];
					}
					
				if (actualResponse.statusCode !== 200) {
					console.error('❌ 请求失败详情:', {
						statusCode: actualResponse.statusCode,
						data: actualResponse.data,
						header: actualResponse.header
					});
					
					let errorMessage = `请求失败: ${actualResponse.statusCode}`;
					if (actualResponse.data && actualResponse.data.error && actualResponse.data.error.message) {
						errorMessage = actualResponse.data.error.message;
					} else if (actualResponse.data && actualResponse.data.message) {
						errorMessage = actualResponse.data.message;
					}
					
					uni.showModal({
						title: '支付创建失败',
						content: errorMessage,
						showCancel: false
					});
					return;
				}
					
					if (actualResponse.data && actualResponse.data.success) {
						// 获取支付URL和订单号
						const paymentUrl = actualResponse.data.data.paymentUrl;
						const orderNumber = actualResponse.data.data.orderNumber;
						
						// 保存实际的订单号用于查询状态
						this.actualOrderNumber = orderNumber;
						
						console.log('支付URL：', paymentUrl);
						console.log('订单号：', orderNumber);
						
						// 唤起支付宝支付
						// #ifdef APP-PLUS
						plus.runtime.openURL(paymentUrl);
						// #endif
						
						// #ifdef H5
						window.location.href = paymentUrl;
						// #endif
						
						// #ifdef MP-WEIXIN || MP-ALIPAY
						uni.navigateTo({
							url: `/pages/PaymentWebview/PaymentWebview?url=${encodeURIComponent(paymentUrl)}`
						});
						// #endif
						
						// 监听支付结果
						this.checkPaymentResult();
						
					} else {
						const errorMsg = actualResponse.data && actualResponse.data.error ? actualResponse.data.error.message : '创建支付订单失败';
						uni.showToast({
							title: errorMsg,
							icon: 'none',
							duration: 3000
						});
						console.error('支付失败：', actualResponse.data);
					}
					
				} catch (error) {
					uni.hideLoading();
					console.error('支付宝支付错误:', error);
					
					let errorMessage = '网络错误，请重试';
					if (error.errMsg) {
						errorMessage = error.errMsg;
					}
					
					uni.showToast({
						title: errorMessage,
						icon: 'none',
						duration: 3000
					});
				}
				
				this.isLoading = false;
			},
			
			/**
			 * 处理余额支付
			 */
			async handleBalancePayment(){
				uni.showToast({
					title: '余额支付功能开发中',
					icon: 'none'
				});
			},
			
			/**
			 * 测试API连通性
			 */
			async testAPIConnection() {
				try {
					const apiBaseUrl = ENV_CONFIG.BASE_URL;
					console.log('🔗 测试API连通性:', apiBaseUrl);
					
					const response = await uni.request({
						url: `${apiBaseUrl}/payment/test`,
						method: 'GET',
						timeout: 5000
					});
					
					console.log('✅ API连通性测试结果:', response);
					
					if (response.statusCode === 200) {
						console.log('✅ 支付API连接正常');
					} else {
						console.warn('⚠️ 支付API连接异常:', response.statusCode);
					}
				} catch (error) {
					console.error('❌ API连通性测试失败:', error);
				}
			},
			
			/**
			 * 检查支付结果
			 */
			async checkPaymentResult(){
				const checkInterval = setInterval(async () => {
					try {
						// 使用实际的订单号查询状态
						const queryOrderNumber = this.actualOrderNumber || this.orderInfo.orderId;
						console.log('查询订单号:', queryOrderNumber);
						
					// 从配置模块获取API地址
					const apiBaseUrl = ENV_CONFIG.BASE_URL;
					console.log('🔍 查询支付状态API地址:', apiBaseUrl);
									
					const response = await uni.request({
						url: `${apiBaseUrl}/payment/alipay/query/${queryOrderNumber}`,
				method: 'GET',
				header: {
								'Authorization': `Bearer ${uni.getStorageSync('token')}`
							}
						});
						
						console.log('查询支付状态响应:', response);
						
						// 处理uni.request可能返回数组的情况
						let actualResponse = response;
						if (Array.isArray(response) && response.length > 1) {
							actualResponse = response[1];
						}
						
						if (actualResponse && actualResponse.data && actualResponse.data.success) {
							const order = actualResponse.data.data.order;
							if (order.payment.status === 'paid') {
								clearInterval(checkInterval);
								
								// 获取本地存储的真实订单信息
								let realOrderInfo = null;
								try {
									realOrderInfo = uni.getStorageSync('currentOrderInfo');
									console.log('🎯 获取真实订单信息用于支付成功页面:', realOrderInfo);
								} catch (error) {
									console.warn('⚠️ 获取本地订单信息失败:', error);
								}
								
								// 支付成功，跳转到结果页面，使用真实订单数据
								const paymentMethod = encodeURIComponent('支付宝支付');
								
								// 优先使用真实订单信息，否则使用后端返回的信息
								const displayAmount = realOrderInfo?.amount || order.total;
								const displayOrderNumber = order.orderNumber; // 使用真实订单号
								const displaySubject = realOrderInfo?.subject || '商城订单';
								
								// 构建跳转参数，包含完整的订单信息
								const jumpParams = [
									`status=success`,
									`orderNumber=${displayOrderNumber}`,
									`amount=${displayAmount}`,
									`paymentMethod=${paymentMethod}`,
									`subject=${encodeURIComponent(displaySubject)}`
								];
								
								// 如果有商品信息，也传递过去
								if (realOrderInfo && realOrderInfo.orderItems && realOrderInfo.orderItems.length > 0) {
									const item = realOrderInfo.orderItems[0];
									jumpParams.push(`productName=${encodeURIComponent(item.name)}`);
									jumpParams.push(`quantity=${item.quantity}`);
								}
								
								const jumpUrl = `/pages/PayResult/PayResult?${jumpParams.join('&')}`;
								console.log('🎉 支付成功，跳转到结果页:', jumpUrl);
								
								uni.redirectTo({
									url: jumpUrl
								});
								
								// 清理本地存储的订单信息
								try {
									uni.removeStorageSync('currentOrderInfo');
								} catch (error) {
									console.warn('⚠️ 清理本地订单信息失败:', error);
								}
								
							} else if (order.payment.status === 'failed') {
								clearInterval(checkInterval);
								// 支付失败
								uni.showModal({
									title: '支付失败',
									content: '支付未完成，请重试',
									showCancel: false
								});
							}
						} else {
							console.warn('查询支付状态失败:', actualResponse);
						}
					} catch (error) {
						console.error('查询支付状态错误:', error);
					}
				}, 3000); // 每3秒检查一次
				
				// 30秒后停止检查
				setTimeout(() => {
					clearInterval(checkInterval);
				}, 30000);
			}
		}
	}
</script>

<style scoped lang="scss">
	@import 'CashierDesk.scss';
</style>
