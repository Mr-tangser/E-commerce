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
					<text class="time">{{hour}}</text>
					<text class="dot">:</text>
					<text class="time">{{min}}</text>
					<text class="dot">:</text>
					<text class="time">{{sec}}</text>
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
				CountDown: 1000,
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
		onLoad(options){
			// 获取订单信息
			if (options.orderId) {
				this.orderInfo.orderId = options.orderId;
			}
			if (options.amount) {
				this.orderInfo.amount = parseFloat(options.amount);
				this.updatePayPrice();
			}
			if (options.subject) {
				this.orderInfo.subject = decodeURIComponent(options.subject);
			}
			
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
			 * 倒计时
			 */
			CountDownData(){
				setTimeout(() =>{
					this.CountDown--;
					this.day = parseInt(this.CountDown / (24*60*60))
					this.hour = parseInt(this.CountDown / (60 * 60) % 24);
					this.min = parseInt(this.CountDown / 60 % 60);
					this.sec = parseInt(this.CountDown % 60);
					if(this.CountDown <= 0){
						this.onPaymentTimeout();
						return
					}
					this.CountDownData();
				},1000)
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
					// 调用后端创建支付宝支付订单
								const response = await uni.request({
				url: 'http://192.168.92.58:3000/api/payment/alipay/create',
				method: 'POST',
				header: {
							'Authorization': `Bearer ${uni.getStorageSync('token')}`,
							'Content-Type': 'application/json'
						},
						data: {
							orderId: this.orderInfo.orderId,
							amount: this.orderInfo.amount,
							subject: this.orderInfo.subject
						}
					});
					
					uni.hideLoading();
					
					console.log('后端响应：', response);
					
					// 处理uni.request可能返回数组的情况
					let actualResponse = response;
					if (Array.isArray(response) && response.length > 1) {
						actualResponse = response[1];
					}
					
					if (actualResponse.statusCode !== 200) {
						uni.showToast({
							title: `请求失败: ${actualResponse.statusCode}`,
							icon: 'none'
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
			 * 检查支付结果
			 */
			async checkPaymentResult(){
				const checkInterval = setInterval(async () => {
					try {
						// 使用实际的订单号查询状态
						const queryOrderNumber = this.actualOrderNumber || this.orderInfo.orderId;
						console.log('查询订单号:', queryOrderNumber);
						
									const response = await uni.request({
				url: `http://192.168.134.128:3000/api/payment/alipay/query/${queryOrderNumber}`,
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
								// 支付成功，跳转到结果页
								uni.redirectTo({
									url: `/pages/PayResult/PayResult?status=success&orderNumber=${order.orderNumber}&amount=${order.total}`
								});
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
