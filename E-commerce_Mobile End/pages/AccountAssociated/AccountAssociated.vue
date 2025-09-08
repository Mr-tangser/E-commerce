<template>
	<view class="page">
		<view class="relevance-list">
			<view class="list" @click="onRelevance('wx')">
				<view class="title">
					<image src="/static/wx_pay.png" mode=""></image>
					<text>微信</text>
				</view>
				<view class="more">
					<text>已关联</text>
					<text class="iconfont icon-more"></text>
				</view>
			</view>
			
			<!-- 人脸识别关联 -->
			<view class="list" @click="onRelevance('face')">
				<view class="title">
					<image src="/static/face_icon.png" mode="" v-if="faceIconExists"></image>
					<view v-else class="face-icon">👤</view>
					<text>人脸识别</text>
				</view>
				<view class="more">
					<text>{{ faceStatus }}</text>
					<text class="iconfont icon-more"></text>
				</view>
			</view>
		</view>
		<view class="hint">
			<text>账号关联之后，用户可以使用微信账号快速登录。在进行各个渠道进行购物时，均可同步会员账号，享受会员特权，同步订单物流信息。</text>
		</view>
		<!-- 人脸注册弹窗 -->
		<view v-if="showFaceModal" class="face-modal-overlay" @click="closeFaceModal">
			<view class="face-modal" @click.stop>
				<view class="face-modal-header">
					<text class="modal-title">人脸识别注册</text>
					<text class="close-btn" @click="closeFaceModal">×</text>
				</view>
				<view class="face-modal-content">
					<view class="face-camera-container" v-if="showCamera">
						<video 
							ref="videoRef" 
							class="face-video"
							autoplay 
							muted 
							playsinline
							@loadedmetadata="onVideoLoaded"
						></video>
						<canvas ref="canvasRef" style="display: none;"></canvas>
						
						<!-- 人脸检测框 -->
						<view class="face-detection-frame" v-if="faceDetected">
							<text class="detection-text">请保持人脸在框内</text>
						</view>
					</view>
					
					<!-- 备用方案：选择照片 -->
					<view class="face-fallback-container" v-else>
						<view class="fallback-icon">📷</view>
						<text class="fallback-text">摄像头不可用时，可以选择照片进行人脸注册</text>
					</view>
					
					<view class="face-status">
						<text :class="['status-text', statusClass]">{{ statusText }}</text>
					</view>
					
					<view class="face-controls">
						<button 
							class="cancel-btn" 
							@click="closeFaceModal"
						>
							取消
						</button>
						
						<!-- 摄像头模式的按钮 -->
						<button 
							v-if="showCamera"
							class="capture-btn" 
							:class="{ 'disabled': !faceDetected || isProcessing }"
							:disabled="!faceDetected || isProcessing"
							@click="captureAndRegisterFace"
						>
							{{ isProcessing ? '注册中...' : '注册人脸' }}
						</button>
						
						<!-- 备用方案的按钮 -->
						<button 
							v-else
							class="capture-btn" 
							:class="{ 'disabled': isProcessing }"
							:disabled="isProcessing"
							@click="selectImageForRegistration"
						>
							{{ isProcessing ? '注册中...' : '选择照片' }}
						</button>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 提示框 -->
		<DialogBox ref="DialogBox"></DialogBox>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				// 人脸识别相关状态
				showFaceModal: false,
				showCamera: false,
				faceDetected: false,
				isProcessing: false,
				statusText: '请将人脸对准摄像头',
				statusClass: 'normal',
				faceStatus: '未关联',
				faceIconExists: false,
				// 摄像头和视频流
				videoStream: null,
				// API配置
				apiBaseUrl: 'http://192.168.107.128:3000/api' // 根据您的后端地址配置
			};
		},
		async mounted() {
			console.log('📱 账号关联页面已加载');
			console.log('🔧 API配置地址:', this.apiBaseUrl);
			await this.checkFaceStatus();
			
			// 监听用户状态变化
			uni.$on('userStatusChange', this.handleUserStatusChange);
		},
		
		async onShow() {
			// 页面显示时重新检查状态
			console.log('📱 账号关联页面显示，重新检查人脸状态');
			await this.checkFaceStatus();
		},
		
		onUnload() {
			// 移除事件监听
			uni.$off('userStatusChange', this.handleUserStatusChange);
		},
		
		methods:{
			/**
			 * 账号关联点击
			 * @param {String} type
			 */
			onRelevance(type){
				switch (type){
					case 'wx':
						this.$refs['DialogBox'].confirm({
							title: '提示',
							content: '是否要解除关联?',
							DialogType: 'inquiry',
							animation: 0
						}).then(()=>{
							uni.navigateBack();
						})
						break;
					case 'face':
						this.handleFaceRelevance();
						break;
				}
			},
			
			/**
			 * 处理人脸关联
			 */
			async handleFaceRelevance() {
				if (this.faceStatus === '已关联') {
					// 已关联，询问是否解除
					this.$refs['DialogBox'].confirm({
						title: '提示',
						content: '是否要解除人脸识别关联?',
						DialogType: 'inquiry',
						animation: 0
					}).then(async () => {
						await this.removeFaceAssociation();
					});
				} else {
					// 未关联，开始注册
					this.startFaceRegistration();
				}
			},
			
			/**
			 * 处理用户状态变化
			 */
			async handleUserStatusChange(data) {
				console.log('📡 收到用户状态变化:', data);
				if (data.isLoggedIn) {
					// 用户登录，重新检查人脸状态
					await this.checkFaceStatus();
				} else {
					// 用户退出，重置状态
					this.faceStatus = '未关联';
				}
			},
			
			/**
			 * 检查人脸关联状态
			 */
			async checkFaceStatus() {
				try {
					const token = uni.getStorageSync('token');
					const user = uni.getStorageSync('user');
					
					// 验证token格式
					if (!token || typeof token !== 'string' || token.trim() === '') {
						console.log('❌ Token无效或不存在');
						this.faceStatus = '未关联';
						this.handleInvalidToken();
						return;
					}
					
					// 检查token格式（JWT token应该有3个部分，用.分隔）
					const tokenParts = token.split('.');
					if (tokenParts.length !== 3) {
						console.log('❌ Token格式错误，不是有效的JWT token');
						this.faceStatus = '未关联';
						this.handleInvalidToken();
						return;
					}
					
					console.log('🔍 检查人脸关联状态...');
					console.log('📡 API地址:', `${this.apiBaseUrl}/auth/face/check`);
					console.log('👤 当前用户:', user ? `${user.username || user.email}` : '未知');
					console.log('🎫 Token格式验证通过，长度:', token.length);
					
					const response = await uni.request({
						url: `${this.apiBaseUrl}/auth/face/check`,
						method: 'GET',
						timeout: 15000, // 增加超时时间
						header: {
							'Authorization': `Bearer ${token}`,
							'Accept': 'application/json'
						}
					});
					
					console.log('📨 状态检查响应:', response);
					
					if (response.statusCode === 200 && response.data && response.data.success) {
						const hasFace = response.data.data.hasFace;
						this.faceStatus = hasFace ? '已关联' : '未关联';
						console.log('✅ 人脸状态更新:', this.faceStatus, '| hasFace:', hasFace);
						
						// 额外验证：检查本地存储是否有生物识别用户数据
						const biometricUser = uni.getStorageSync('biometric_user');
						if (biometricUser && !hasFace) {
							console.log('⚠️ 发现状态不一致：本地有生物识别数据但服务器显示未关联');
							// 可以在这里添加额外的验证逻辑
						}
					} else {
						console.log('⚠️ 状态检查失败，服务器响应:', response);
						// 检查是否是权限问题
						if (response.statusCode === 401) {
							console.log('🔑 Token验证失败或已过期');
							this.faceStatus = '未关联';
							this.handleInvalidToken();
						} else {
							console.log('⚠️ 其他错误，使用默认状态');
							this.faceStatus = '未关联';
						}
					}
				} catch (error) {
					console.error('❌ 检查人脸状态失败:', error);
					
					// 更详细的错误处理
					let errorMessage = '检查状态失败';
					if (error.errMsg) {
						if (error.errMsg.includes('timeout')) {
							errorMessage = '网络连接超时';
						} else if (error.errMsg.includes('fail')) {
							errorMessage = '网络连接失败';
						} else {
							errorMessage = `连接错误: ${error.errMsg}`;
						}
						
						console.log('🔧 错误详情:', errorMessage);
						
						// 只在超时情况下提示用户，避免过多干扰
						if (error.errMsg.includes('timeout')) {
							uni.showToast({
								title: errorMessage,
								icon: 'none',
								duration: 2000
							});
						}
					}
					
					// 设置默认状态
					this.faceStatus = '未关联';
				}
			},
			
			/**
			 * 开始人脸注册
			 */
			async startFaceRegistration() {
				try {
					this.showFaceModal = true;
					this.statusText = '正在启动摄像头...';
					this.statusClass = 'normal';
					
					// 检查运行环境
					// #ifdef H5
					await this.startH5Camera();
					// #endif
					
					// #ifndef H5
					await this.startMobileCamera();
					// #endif
					
				} catch (error) {
					console.error('启动摄像头失败:', error);
					this.statusText = `无法访问摄像头: ${error.message}`;
					this.statusClass = 'error';
					
					// 提供备用方案
					this.showFallbackOption();
				}
			},
			
			/**
			 * H5环境下启动摄像头
			 */
			async startH5Camera() {
				if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
					throw new Error('浏览器不支持摄像头访问');
				}
				
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						width: { ideal: 640 },
						height: { ideal: 480 },
						facingMode: 'user'
					},
					audio: false
				});
				
				this.videoStream = stream;
				this.showCamera = true;
				
				// 等待DOM更新后设置视频流
				this.$nextTick(() => {
					if (this.$refs.videoRef) {
						this.$refs.videoRef.srcObject = stream;
						this.statusText = '请将人脸对准摄像头';
						this.startFaceDetection();
					}
				});
			},
			
			/**
			 * 移动端环境下使用相册或摄像头
			 */
			async startMobileCamera() {
				this.statusText = '请选择拍照或从相册选择';
				this.statusClass = 'normal';
				
				const result = await new Promise((resolve, reject) => {
					uni.chooseImage({
						count: 1,
						sizeType: ['compressed'],
						sourceType: ['camera', 'album'],
						success: resolve,
						fail: reject
					});
				});
				
				if (result.tempFilePaths && result.tempFilePaths.length > 0) {
					const imagePath = result.tempFilePaths[0];
					await this.processSelectedImage(imagePath);
				}
			},
			
			/**
			 * 处理选择的图片
			 */
			async processSelectedImage(imagePath) {
				this.isProcessing = true;
				this.statusText = '正在注册人脸，请稍候...';
				this.statusClass = 'processing';
				
				try {
					// 调用注册接口 - 使用uni.uploadFile
					const token = uni.getStorageSync('token');
					const user = uni.getStorageSync('user');
					
					console.log('🔧 开始上传人脸图片:');
					console.log('📡 API地址:', `${this.apiBaseUrl}/auth/face/register`);
					console.log('🎫 Token:', token ? `已获取(${token.substring(0, 20)}...)` : '❌ 未获取');
					console.log('👤 用户信息:', user ? `已获取(${user.username || user.phone})` : '❌ 未获取');
					console.log('📄 文件路径:', imagePath);
					
					// 检查登录状态和token格式
					if (!token || typeof token !== 'string' || token.trim() === '') {
						console.log('❌ Token缺失或无效');
						this.handleInvalidToken();
						return;
					}
					
					// 验证JWT token格式
					const tokenParts = token.split('.');
					if (tokenParts.length !== 3) {
						console.log('❌ Token格式错误，不是有效的JWT');
						this.handleInvalidToken();
						return;
					}
					
					if (!user) {
						throw new Error('用户信息缺失，请重新登录');
					}
					
					const response = await new Promise((resolve, reject) => {
						uni.uploadFile({
							url: `${this.apiBaseUrl}/auth/face/register`,
							filePath: imagePath,
							name: 'image',
							formData: {
								// 添加额外的表单数据
							},
							header: {
								'Authorization': `Bearer ${token}`,
								'Accept': 'application/json'
							},
							timeout: 30000, // 30秒超时
							success: (res) => {
								console.log('✅ 上传成功:', res);
								// 检查是否是401错误（token无效）
								if (res.statusCode === 401) {
									console.log('🔑 服务器返回401，Token可能无效');
									reject(new Error('INVALID_TOKEN'));
								} else {
									resolve(res);
								}
							},
							fail: (err) => {
								console.error('❌ 上传失败详情:', err);
								// 提供更详细的错误信息
								if (err.errMsg && err.errMsg.includes('timeout')) {
									reject(new Error('上传超时，请检查网络连接'));
								} else if (err.errMsg && err.errMsg.includes('fail')) {
									reject(new Error('网络连接失败，请检查后端服务是否运行'));
								} else {
									reject(new Error(`上传失败: ${err.errMsg || '未知错误'}`));
								}
							}
						});
					});
					
					console.log('📨 服务器响应:', response);
					
					// 检查响应数据格式
					let result;
					try {
						if (typeof response.data === 'string') {
							result = JSON.parse(response.data);
						} else {
							result = response.data;
						}
					} catch (parseError) {
						console.error('❌ 响应解析失败:', parseError);
						throw new Error('服务器响应格式错误');
					}
					
					console.log('📋 解析结果:', result);
					
					if (result && result.success) {
						this.statusText = '人脸注册成功！';
						this.statusClass = 'success';
						this.faceStatus = '已关联';
						
						// 更新本地存储，确保状态同步
						const user = uni.getStorageSync('user');
						if (user) {
							user.hasFace = true;
							user.faceRegisterTime = new Date().toISOString();
							uni.setStorageSync('user', user);
							
							// 也更新生物识别用户数据
							const biometricUser = uni.getStorageSync('biometric_user');
							if (biometricUser) {
								biometricUser.hasFace = true;
								biometricUser.faceRegisterTime = new Date().toISOString();
								uni.setStorageSync('biometric_user', biometricUser);
							}
						}
						
						// 触发全局状态更新
						uni.$emit('faceStatusChange', {
							hasFace: true,
							faceRegisterTime: new Date()
						});
						
						// 延迟关闭弹窗
						setTimeout(() => {
							this.closeFaceModal();
							uni.showToast({
								title: '人脸注册成功',
								icon: 'success'
							});
						}, 1500);
					} else {
						const errorMsg = result?.error?.message || result?.message || '注册失败';
						
						// 特殊处理：如果是因为用户之前已注册但现在需要重新注册
						if (errorMsg.includes('重新注册') || errorMsg.includes('系统升级')) {
							this.statusText = '正在更新人脸数据，请稍候...';
							this.statusClass = 'processing';
							
							// 给用户一个友好的提示
							setTimeout(() => {
								this.statusText = '人脸数据已更新，请重新注册';
								this.statusClass = 'normal';
							}, 2000);
							return; // 不抛出错误，让用户可以重试
						}
						
						throw new Error(errorMsg);
					}
				} catch (error) {
					console.error('❌ 人脸注册失败:', error);
					
					// 特殊处理：Token无效
					if (error.message === 'INVALID_TOKEN') {
						this.handleInvalidToken();
						return;
					}
					
					// 根据错误类型提供不同的提示
					let errorMessage = '注册失败，请重试';
					if (error.message) {
						if (error.message.includes('网络')) {
							errorMessage = '网络连接失败，请检查网络设置';
						} else if (error.message.includes('超时')) {
							errorMessage = '上传超时，请检查网络速度';
						} else if (error.message.includes('服务')) {
							errorMessage = '服务暂时不可用，请稍后重试';
						} else {
							errorMessage = error.message;
						}
					}
					
					this.statusText = errorMessage;
					this.statusClass = 'error';
					
					uni.showToast({
						title: errorMessage.length > 10 ? '注册失败' : errorMessage,
						icon: 'error',
						duration: 3000
					});
				} finally {
					this.isProcessing = false;
				}
			},
			
			/**
			 * 显示备用选项
			 */
			showFallbackOption() {
				setTimeout(() => {
					this.statusText = '摄像头无法启动，请点击下方按钮选择照片';
					this.statusClass = 'normal';
					// 隐藏摄像头界面，显示选择按钮
					this.showCamera = false;
				}, 2000);
			},
			
			/**
			 * 开始人脸检测
			 */
			startFaceDetection() {
				// 简单的人脸检测模拟（实际项目中可以使用Face API）
				setTimeout(() => {
					if (this.showCamera) {
						this.faceDetected = true;
						this.statusText = '检测到人脸，点击注册按钮完成注册';
						this.statusClass = 'success';
					}
				}, 2000);
			},
			
			/**
			 * 视频加载完成
			 */
			onVideoLoaded() {
				console.log('视频流加载完成');
			},
			
			/**
			 * 选择图片进行注册
			 */
			async selectImageForRegistration() {
				try {
					const result = await new Promise((resolve, reject) => {
						uni.chooseImage({
							count: 1,
							sizeType: ['compressed'],
							sourceType: ['camera', 'album'],
							success: resolve,
							fail: reject
						});
					});
					
					if (result.tempFilePaths && result.tempFilePaths.length > 0) {
						const imagePath = result.tempFilePaths[0];
						await this.processSelectedImage(imagePath);
					}
				} catch (error) {
					console.error('选择图片失败:', error);
					uni.showToast({
						title: '选择图片失败',
						icon: 'error'
					});
				}
			},
			
			/**
			 * 拍照并注册人脸
			 */
			async captureAndRegisterFace() {
				if (!this.faceDetected || this.isProcessing) return;
				
				this.isProcessing = true;
				this.statusText = '正在注册人脸，请稍候...';
				this.statusClass = 'processing';
				
				try {
					// 从视频流中捕获图片
					const canvas = this.$refs.canvasRef;
					const video = this.$refs.videoRef;
					const ctx = canvas.getContext('2d');
					
					canvas.width = video.videoWidth || 640;
					canvas.height = video.videoHeight || 480;
					ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
					
					// 转换为base64
					const base64Data = canvas.toDataURL('image/jpeg', 0.8);
					const base64Image = base64Data.split(',')[1]; // 去掉data:image/jpeg;base64,前缀
					
					// 创建临时文件
					const tempFilePath = await new Promise((resolve, reject) => {
						// 将base64转换为临时文件
						const fsm = uni.getFileSystemManager();
						const tempPath = `${uni.env.USER_DATA_PATH}/temp_face_${Date.now()}.jpg`;
						
						fsm.writeFile({
							filePath: tempPath,
							data: base64Image,
							encoding: 'base64',
							success: () => resolve(tempPath),
							fail: reject
						});
					});
					
					// 调用注册接口 - 使用uni.uploadFile
					const token = uni.getStorageSync('token');
					
					// 验证token格式
					if (!token || typeof token !== 'string' || token.trim() === '' || token.split('.').length !== 3) {
						console.log('❌ Token无效，无法注册人脸');
						this.handleInvalidToken();
						return;
					}
					
					const response = await new Promise((resolve, reject) => {
						uni.uploadFile({
							url: `${this.apiBaseUrl}/auth/face/register`,
							filePath: tempFilePath,
							name: 'image',
							header: {
								'Authorization': `Bearer ${token}`
							},
							success: resolve,
							fail: reject
						});
					});
					
					const result = JSON.parse(response.data);
					if (result && result.success) {
						this.statusText = '人脸注册成功！';
						this.statusClass = 'success';
						this.faceStatus = '已关联';
						
						// 延迟关闭弹窗
						setTimeout(() => {
							this.closeFaceModal();
							uni.showToast({
								title: '人脸注册成功',
								icon: 'success'
							});
						}, 1500);
					} else {
						throw new Error(result?.error?.message || '注册失败');
					}
					
				} catch (error) {
					console.error('人脸注册失败:', error);
					this.statusText = error.message || '注册失败，请重试';
					this.statusClass = 'error';
					
					uni.showToast({
						title: '注册失败',
						icon: 'error'
					});
				} finally {
					this.isProcessing = false;
				}
			},
			
			/**
			 * 关闭人脸注册弹窗
			 */
			closeFaceModal() {
				this.showFaceModal = false;
				this.showCamera = false;
				this.faceDetected = false;
				this.isProcessing = false;
				this.statusText = '请将人脸对准摄像头';
				this.statusClass = 'normal';
				
				// 停止视频流
				if (this.videoStream) {
					this.videoStream.getTracks().forEach(track => {
						track.stop();
					});
					this.videoStream = null;
				}
			},
			
			/**
			 * 处理无效Token
			 */
			handleInvalidToken() {
				console.log('🔄 处理无效Token，清除本地数据');
				
				// 清除本地存储的认证数据
				uni.removeStorageSync('token');
				uni.removeStorageSync('user');
				uni.removeStorageSync('biometric_user');
				
				// 显示友好的提示
				uni.showModal({
					title: '登录已过期',
					content: '您的登录状态已过期，请重新登录',
					showCancel: false,
					confirmText: '去登录',
					success: (res) => {
						if (res.confirm) {
							// 跳转到登录页面
							uni.reLaunch({
								url: '/pages/login/login'
							});
						}
					}
				});
				
				// 触发全局用户状态更新
				uni.$emit('userStatusChange', {
					isLoggedIn: false,
					user: null
				});
			},
			
			/**
			 * 解除人脸关联
			 */
			async removeFaceAssociation() {
				try {
					const token = uni.getStorageSync('token');
					
					// 验证token
					if (!token || typeof token !== 'string' || token.trim() === '' || token.split('.').length !== 3) {
						console.log('❌ Token无效，无法解除关联');
						this.handleInvalidToken();
						return;
					}
					
					const response = await uni.request({
						url: `${this.apiBaseUrl}/auth/face/remove`,
						method: 'DELETE',
						header: {
							'Authorization': `Bearer ${token}`
						}
					});
					
					if (response.statusCode === 401) {
						console.log('🔑 Token验证失败，无法解除关联');
						this.handleInvalidToken();
						return;
					}
					
					if (response.data && response.data.success) {
						this.faceStatus = '未关联';
						
						// 更新本地存储状态
						const user = uni.getStorageSync('user');
						if (user) {
							user.hasFace = false;
							user.faceRegisterTime = null;
							uni.setStorageSync('user', user);
						}
						
						// 清除生物识别用户数据
						uni.removeStorageSync('biometric_user');
						
						// 触发全局状态更新
						uni.$emit('faceStatusChange', {
							hasFace: false,
							faceRegisterTime: null
						});
						
						uni.showToast({
							title: '解除关联成功',
							icon: 'success'
						});
					} else {
						throw new Error(response.data?.error?.message || '操作失败');
					}
				} catch (error) {
					console.error('解除人脸关联失败:', error);
					uni.showToast({
						title: '操作失败',
						icon: 'error'
					});
				}
			}
		}
	}
</script>

<style scoped lang="scss">
	@import 'AccountAssociated.scss';
</style>
