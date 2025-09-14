/**
 * 一键登录工具方法
 * 基于uni-app的univerify一键登录功能
 */

// 导入Vuex store（如果项目使用了Vuex）
// import Vuex from '@/store/index.js'
import api from '@/utils/api.js'


export function univerifyLogin(successCallback, failCallback, cancelCallback) {
	// const commit = Vuex.commit; // 如果使用Vuex
	const PROVIDER = 'univerify';
	
	// 一键登录UI样式配置
	const univerifyStyle = {
		"fullScreen": true, // 全屏模式
		"icon": {
			"path": "static/logo.png" // 自定义显示在授权框中的logo
		},
		"authButton": {
			"normalColor": "#007aff", // 授权按钮正常状态背景颜色
			"highlightColor": "#0056cc", // 授权按钮按下状态背景颜色
			"disabledColor": "#7fd4b0", // 授权按钮不可点击时背景颜色
			"textColor": "#ffffff", // 授权按钮文字颜色
			"title": "本机号码一键登录", // 授权按钮文案
			"borderRadius": "24px" // 授权按钮圆角
		},
		"otherLoginButton": {
			"visible": "true", // 是否显示其他登录方式按钮
			"normalColor": "", // 其他登录方式按钮正常状态背景颜色
			"highlightColor": "", // 其他登录方式按钮按下状态背景颜色
			"textColor": "#656565", // 其他登录方式按钮文字颜色
			"title": "其他登录方式", // 其他登录方式按钮文案
			"borderRadius": "20px" // 其他登录方式按钮圆角
		},
		"privacyTerms": {
			"defaultCheckBoxState": true, // 条款勾选框初始状态
			"textColor": "#BBBBBB", // 文字颜色
			"termsColor": "#007aff", // 协议文字颜色
			"prefix": "我已阅读并同意", // 条款前的文案
			"suffix": "并使用本机号码登录", // 条款后的文案
			"fontSize": 12, // 文字大小
			"privacyItems": [
				{
					"url": "https://example.com/user-agreement", // 用户协议链接
					"title": "《用户协议》"
				},
				{
					"url": "https://example.com/privacy-policy", // 隐私政策链接  
					"title": "《隐私政策》"
				}
			]
		},
		"loginTitle": {
			"text": "电商平台登录", // 登录页标题
			"textColor": "#333333", // 标题颜色
			"fontSize": 18 // 标题字体大小
		},
		"phoneInfo": {
			"textColor": "#333333", // 手机号颜色
			"fontSize": 18 // 手机号字体大小
		},
		"logo": {
			"logoWidth": 80, // logo宽度
			"logoHeight": 80 // logo高度
		}
	}
	
	return new Promise((resolve, reject) => {
		// 检查一键登录服务是否可用
		uni.getProvider({
			service: 'oauth',
			success: (res) => {
				console.log('支持的登录方式:', res.provider);
				
				if (res.provider.indexOf(PROVIDER) !== -1) {
					console.log('✅ 设备支持一键登录');
					
					// 预登录（可选，提高登录速度）
					uni.preLogin({
						provider: PROVIDER,
						success: (preLoginRes) => {
							console.log('预登录成功:', preLoginRes);
						},
						fail: (preLoginErr) => {
							console.log('预登录失败:', preLoginErr);
						}
					});
					
					// 执行一键登录
					uni.login({
						provider: PROVIDER,
						univerifyStyle: univerifyStyle,
						success: async (loginRes) => {
							console.log('一键登录成功:', loginRes);
							
							const loginResult = loginRes.authResult;
							console.log('登录结果详情:', loginResult);
							
							// 调用云函数获取手机号
							if (loginResult && loginResult.access_token && loginResult.openid) {
								// 调用云函数
								uniCloud.callFunction({
									name: 'getPhoneNumber',
									data: {
										access_token: loginResult.access_token,
										openid: loginResult.openid
									},
									success: async (cloudRes) => {
										console.log('云函数调用成功:', cloudRes);
										
										// 检查云函数是否成功返回手机号
										if (cloudRes.result.errCode === 0 && cloudRes.result.phoneNumber) {
											const phoneNumber = cloudRes.result.phoneNumber;
											console.log('✅ 获取到手机号:', phoneNumber);
											
											try {
												// 调用后端一键登录接口
												console.log('�� 正在调用后端一键登录接口...');
												const response = await api.user.loginByUniverify(
													phoneNumber,
													loginResult.access_token,
													loginResult.openid
												);
												
												if (response.success) {
													console.log('✅ 后端一键登录成功:', response.data);
													
													// 保存用户信息到本地存储
													const userData = response.data;
													uni.setStorageSync('token', userData.token);
													uni.setStorageSync('user', userData.user);
													
													// 同时保存一份用户信息供生物识别登录使用
													uni.setStorageSync('biometric_user', {
														...userData.user,
														token: userData.token,
														timestamp: Date.now()
													});
													
													console.log('✅ 一键登录完成，用户数据已保存');
													
													// 触发全局用户状态更新事件
													uni.$emit('userStatusChange', {
														isLoggedIn: true,
														user: userData.user
													});
													
													// 执行成功回调
													if (typeof successCallback === 'function') {
														successCallback(response);
														uni.closeAuthView();
													}
													
													resolve(response);
												} else {
													throw new Error(response.error?.message || '后端登录失败');
												}
											} catch (backendError) {
												console.error('❌ 后端一键登录接口调用失败:', backendError);
												const errorMsg = backendError.message || '登录失败，请稍后重试';
												
												if (typeof failCallback === 'function') {
													failCallback({ code: -1, message: errorMsg });
												}
												reject(new Error(errorMsg));
											}
										} else {
											console.error('❌ 云函数未返回有效手机号:', cloudRes.result);
											const errorMsg = cloudRes.result.message || '获取手机号失败';
											
											if (typeof failCallback === 'function') {
												failCallback({ code: cloudRes.result.code || -1, message: errorMsg });
											}
											reject(new Error(errorMsg));
										}
									},
									fail: (cloudErr) => {
										console.error('云函数调用失败:', cloudErr);
										const errorMsg = cloudErr.message || '服务器处理失败';
										
										if (typeof failCallback === 'function') {
											failCallback({ code: -1, message: errorMsg });
										}
										reject(new Error(errorMsg));
									}
								});
							} else {
								console.error('登录结果缺少必要参数');
								const errorMsg = '登录验证失败，请重试';
								
								if (typeof failCallback === 'function') {
									failCallback({ code: -1, message: errorMsg });
								}
								reject(new Error(errorMsg));
							}
						},
						fail: (loginErr) => {
							console.error('一键登录失败:', loginErr);
							
							// 判断错误类型
							let errorMessage = '一键登录失败';
							if (loginErr.errCode) {
								switch (loginErr.errCode) {
									case 30001:
										errorMessage = '用户取消登录';
										// 用户主动取消，执行取消回调
										if (typeof cancelCallback === 'function') {
											cancelCallback(loginErr);
										}
										break;
									case 30002:
										errorMessage = '网络连接失败，请检查网络';
										break;
									case 30003:
										errorMessage = '用户点击了其他登录方式';
										// 用户选择其他登录方式，可以引导到其他登录页面
										if (typeof cancelCallback === 'function') {
											cancelCallback(loginErr);
										}
										break;
									default:
										errorMessage = loginErr.errMsg || '一键登录失败';
										break;
								}
							}
							
							if (loginErr.errCode !== 30001 && loginErr.errCode !== 30003) {
								// 非用户主动取消的情况才执行失败回调
								if (typeof failCallback === 'function') {
									failCallback({ code: loginErr.errCode || -1, message: errorMessage });
								}
								reject(new Error(errorMessage));
							}
						}
					});
				} else {
					console.error('❌ 设备不支持一键登录');
					const errorMsg = '当前设备不支持一键登录功能';
					
					if (typeof failCallback === 'function') {
						failCallback({ code: -1, message: errorMsg });
					}
					reject(new Error(errorMsg));
				}
			},
			fail: (err) => {
				console.error('获取登录方式失败:', err);
				const errorMsg = '获取登录服务失败';
				
				if (typeof failCallback === 'function') {
					failCallback({ code: -1, message: errorMsg });
				}
				reject(new Error(errorMsg));
			}
		});
	});
}

/**
 * 关闭一键登录页面（用于手动关闭）
 */
export function closeUniverifyLogin() {
	uni.closeAuthView();
}

/**
 * 检查一键登录是否可用
 */
export function checkUniverifySupport() {
	return new Promise((resolve) => {
		uni.getProvider({
			service: 'oauth',
			success: (res) => {
				const isSupported = res.provider.indexOf('univerify') !== -1;
				resolve(isSupported);
			},
			fail: () => {
				resolve(false);
			}
		});
	});
}
