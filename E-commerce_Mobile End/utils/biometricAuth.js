/**
 * 生物识别认证工具类
 * 支持指纹识别和人脸识别
 */

// 导入环境配置
import ENV_CONFIG from '../config/env.js';

class BiometricAuth {
  
  /**
   * 检查指纹识别支持
   * @returns {Promise<boolean>}
   */
  static async checkFingerprintSupport() {
    return new Promise((resolve) => {
      // #ifdef APP-PLUS
      plus.fingerprint.isSupport((result) => {
        resolve(result.isSupport);
      });
      // #endif
      
      // #ifdef H5
      // H5环境下检查WebAuthn API
      if (window.PublicKeyCredential) {
        resolve(true);
      } else {
        resolve(false);
      }
      // #endif
      
      // #ifdef MP-WEIXIN
      // 微信小程序环境
      wx.checkIsSupportSoterAuthentication({
        success(res) {
          resolve(res.supportMode.includes('fingerPrint'));
        },
        fail() {
          resolve(false);
        }
      });
      // #endif
      
      // #ifndef APP-PLUS || H5 || MP-WEIXIN
      resolve(false);
      // #endif
    });
  }
  
  /**
   * 检查人脸识别支持
   * @returns {Promise<boolean>}
   */
  static async checkFaceSupport() {
    return new Promise((resolve) => {
      // #ifdef APP-PLUS
      // App端人脸识别需要第三方插件或原生模块
      // 这里假设已集成相关插件
      if (plus.navigator.isImmersedStatusbar) {
        // 简单的设备能力检查
        resolve(true);
      } else {
        resolve(false);
      }
      // #endif
      
      // #ifdef H5
      // H5环境检查是否支持摄像头API（不需要立即获取权限）
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        resolve(true); // 支持摄像头API
      } else {
        resolve(false); // 不支持摄像头API
      }
      // #endif
      
      // #ifdef MP-WEIXIN
      // 微信小程序人脸识别
      wx.checkIsSupportSoterAuthentication({
        success(res) {
          resolve(res.supportMode.includes('facial'));
        },
        fail() {
          resolve(false);
        }
      });
      // #endif
      
      // #ifndef APP-PLUS || H5 || MP-WEIXIN
      resolve(false);
      // #endif
    });
  }
  
  /**
   * 指纹识别认证
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  static async authenticateWithFingerprint() {
    return new Promise((resolve) => {
      // #ifdef APP-PLUS
      plus.fingerprint.authenticate(() => {
        resolve({
          success: true,
          message: '指纹识别成功'
        });
      }, (error) => {
        let message = '指纹识别失败';
        switch (error.code) {
          case 1:
            message = '指纹识别硬件不可用';
            break;
          case 2:
            message = '设备未录入指纹';
            break;
          case 3:
            message = '用户取消指纹识别';
            break;
          case 4:
            message = '指纹识别失败';
            break;
          case 5:
            message = '指纹识别被锁定';
            break;
          default:
            message = '指纹识别出现未知错误';
        }
        resolve({
          success: false,
          message: message
        });
      }, {
        message: '请验证指纹'
      });
      // #endif
      
      // #ifdef H5
      // H5环境使用WebAuthn API
      if (window.PublicKeyCredential) {
        navigator.credentials.create({
          publicKey: {
            challenge: new Uint8Array(32),
            rp: {
              name: "电商平台",
            },
            user: {
              id: new Uint8Array(16),
              name: "user@example.com",
              displayName: "用户",
            },
            pubKeyCredParams: [{alg: -7, type: "public-key"}],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required"
            },
            timeout: 60000,
            attestation: "direct"
          }
        }).then(() => {
          resolve({
            success: true,
            message: '生物识别成功'
          });
        }).catch((error) => {
          resolve({
            success: false,
            message: '生物识别失败: ' + error.message
          });
        });
      } else {
        resolve({
          success: false,
          message: '当前环境不支持生物识别'
        });
      }
      // #endif
      
      // #ifdef MP-WEIXIN
      wx.startSoterAuthentication({
        requestAuthModes: ['fingerPrint'],
        challenge: '123456',
        authContent: '请验证指纹',
        success(res) {
          resolve({
            success: true,
            message: '指纹识别成功'
          });
        },
        fail(error) {
          let message = '指纹识别失败';
          if (error.errCode === 90001) {
            message = '本设备不支持生物认证';
          } else if (error.errCode === 90002) {
            message = '用户未开启生物认证';
          } else if (error.errCode === 90003) {
            message = '请求使用的生物认证方式不支持';
          } else if (error.errCode === 90007) {
            message = '内部错误';
          } else if (error.errCode === 90008) {
            message = '用户取消授权';
          } else if (error.errCode === 90009) {
            message = '识别失败';
          }
          resolve({
            success: false,
            message: message
          });
        }
      });
      // #endif
      
      // #ifndef APP-PLUS || H5 || MP-WEIXIN
      resolve({
        success: false,
        message: '当前平台不支持指纹识别'
      });
      // #endif
    });
  }
  
  /**
   * 人脸识别认证
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  static async authenticateWithFace() {
    console.log('🎭 BiometricAuth.authenticateWithFace() 被调用');
    console.log('🔍 检测当前运行环境...');
    console.log('  - typeof plus:', typeof plus);
    console.log('  - typeof wx:', typeof wx);  
    console.log('  - typeof navigator:', typeof navigator);
    
    return new Promise((resolve) => {
      // 强制使用H5实现，跳过条件编译
      console.log('🌐 强制使用H5人脸识别实现');
      try {
        this.startH5FaceLogin().then((result) => {
          console.log('✅ H5人脸识别完成:', result);
          resolve(result);
        }).catch((error) => {
          console.error('❌ H5人脸识别错误:', error);
          resolve({
            success: false,
            message: error.message || '人脸识别失败'
          });
        });
      } catch (error) {
        console.error('❌ H5人脸识别初始化错误:', error);
        resolve({
          success: false,
          message: '人脸识别功能初始化失败: ' + error.message
        });
      }
      return; // 直接返回，跳过后面的条件编译代码
      // #ifdef APP-PLUS
      // App端人脸识别需要调用原生插件
      // 这里提供一个示例框架，具体实现需要根据使用的插件来调整
      
      // 假设使用的是某个人脸识别插件
      try {
        // 示例：调用原生人脸识别
        plus.bridge.callHandler('faceRecognition', {
          timeout: 30000,
          message: '请将面部对准摄像头'
        }, (result) => {
          if (result.success) {
            resolve({
              success: true,
              message: '人脸识别成功'
            });
          } else {
            resolve({
              success: false,
              message: result.message || '人脸识别失败'
            });
          }
        });
      } catch (error) {
        resolve({
          success: false,
          message: '人脸识别功能暂不可用'
        });
      }
      // #endif
      
      // #ifdef H5
      // H5环境的人脸识别实现
      try {
        // 使用新的Face++人脸识别功能
        this.startH5FaceLogin().then((result) => {
          resolve(result);
        }).catch((error) => {
          resolve({
            success: false,
            message: error.message || '人脸识别失败'
          });
        });
      } catch (error) {
        resolve({
          success: false,
          message: '人脸识别功能初始化失败'
        });
      }
      // #endif
      
      // #ifndef APP-PLUS || MP-WEIXIN
      // 默认使用H5实现（适用于网页端）
      try {
        console.log('🌐 使用默认H5人脸识别实现');
        console.log('📱 当前环境: 网页端/H5');
        this.startH5FaceLogin().then((result) => {
        resolve(result);
      }).catch((error) => {
        resolve({
          success: false,
          message: error.message || '人脸识别失败'
        });
      });
      } catch (error) {
        console.error('默认人脸识别实现错误:', error);
        resolve({
          success: false,
          message: '人脸识别功能初始化失败'
        });
      }
      // #endif
      
      // #ifdef MP-WEIXIN
      wx.startSoterAuthentication({
        requestAuthModes: ['facial'],
        challenge: '123456',
        authContent: '请验证人脸',
        success(res) {
          resolve({
            success: true,
            message: '人脸识别成功'
          });
        },
        fail(error) {
          let message = '人脸识别失败';
          if (error.errCode === 90001) {
            message = '本设备不支持生物认证';
          } else if (error.errCode === 90002) {
            message = '用户未开启生物认证';
          } else if (error.errCode === 90003) {
            message = '请求使用的生物认证方式不支持';
          } else if (error.errCode === 90007) {
            message = '内部错误';
          } else if (error.errCode === 90008) {
            message = '用户取消授权';
          } else if (error.errCode === 90009) {
            message = '识别失败';
          }
          resolve({
            success: false,
            message: message
          });
        }
      });
      // #endif
      
      // #ifndef APP-PLUS || H5 || MP-WEIXIN
      resolve({
        success: false,
        message: '当前平台不支持人脸识别'
      });
      // #endif
    });
  }
  
  /**
   * H5环境的人脸识别初始化
   * @returns {Promise}
   */
  /**
   * H5环境下的人脸识别登录
   */
  static async startH5FaceLogin() {
    console.log('🚀 startH5FaceLogin() 开始执行');
    
    // 检查是否在浏览器环境中
    if (typeof document === 'undefined') {
      console.log('📱 检测到移动端环境，使用uni-app原生人脸识别方案');
      return this.startMobileFaceLogin();
    }
    
    return new Promise((resolve, reject) => {
      try {
        // 创建人脸识别弹窗
        console.log('📱 正在创建人脸识别弹窗...');
        const modal = this.createFaceModal();
        document.body.appendChild(modal);
      
        // 初始化摄像头并处理人脸识别
        this.initH5FaceCamera(modal, resolve, reject);
      } catch (error) {
        console.error('❌ 人脸识别弹窗创建失败:', error);
        reject(new Error('人脸识别功能初始化失败: ' + error.message));
      }
    });
  }

  /**
   * 创建人脸识别弹窗
   */
  static createFaceModal() {
    // 再次检查 document 对象
    if (typeof document === 'undefined') {
      throw new Error('document 对象未定义，无法创建DOM元素');
    }
    
    console.log('🛠️ 创建人脸识别弹窗DOM元素...');
    const modal = document.createElement('div');
    modal.className = 'face-recognition-modal';
    modal.innerHTML = `
      <div class="face-modal-overlay">
        <div class="face-modal-content">
          <div class="face-modal-header">
            <h3>人脸识别登录</h3>
            <button class="face-close-btn" type="button">&times;</button>
          </div>
          <div class="face-camera-container">
            <video class="face-video" autoplay muted playsinline></video>
            <canvas class="face-canvas" style="display: none;"></canvas>
            <div class="face-status">正在初始化摄像头...</div>
            <div class="face-controls">
              <button class="face-capture-btn" type="button" disabled>检测中...</button>
              <button class="face-cancel-btn" type="button">取消</button>
            </div>
            <div class="face-loading" style="display: none;">
              <div class="face-spinner"></div>
              <div>识别中，请稍候...</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // 添加样式
    this.addFaceModalStyles();
    
    return modal;
  }

  /**
   * 添加人脸识别弹窗样式
   */
  static addFaceModalStyles() {
    if (document.getElementById('face-modal-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'face-modal-styles';
    style.textContent = `
      .face-recognition-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
      }
      .face-modal-overlay {
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
      }
      .face-modal-content {
        background: white;
        border-radius: 12px;
        width: 100%;
        max-width: 400px;
        max-height: 90vh;
        overflow: hidden;
        position: relative;
      }
      .face-modal-header {
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .face-modal-header h3 {
        margin: 0;
        font-size: 18px;
        color: #333;
      }
      .face-close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .face-camera-container {
        padding: 20px;
        text-align: center;
        position: relative;
      }
      .face-video {
        width: 100%;
        max-width: 300px;
        height: 240px;
        border-radius: 8px;
        background: #000;
        object-fit: cover;
      }
      .face-status {
        margin: 15px 0;
        padding: 10px;
        background: #f0f8ff;
        border-radius: 6px;
        color: #333;
        font-size: 14px;
      }
      .face-status.success {
        background: #f0fff4;
        color: #22c55e;
      }
      .face-status.error {
        background: #fef2f2;
        color: #ef4444;
      }
      .face-controls {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-top: 15px;
      }
      .face-capture-btn, .face-cancel-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s;
        min-width: 80px;
      }
      .face-capture-btn {
        background: #007aff;
        color: white;
      }
      .face-capture-btn:hover:not(:disabled) {
        background: #0056cc;
      }
      .face-capture-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
      .face-cancel-btn {
        background: #f5f5f5;
        color: #333;
      }
      .face-cancel-btn:hover {
        background: #e5e5e5;
      }
      .face-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.95);
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      .face-spinner {
        width: 30px;
        height: 30px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #007aff;
        border-radius: 50%;
        animation: face-spin 1s linear infinite;
        margin: 0 auto 10px;
      }
      @keyframes face-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 初始化H5人脸识别摄像头
   */
  static async initH5FaceCamera(modal, resolve, reject) {
    const video = modal.querySelector('.face-video');
    const canvas = modal.querySelector('.face-canvas');
    const status = modal.querySelector('.face-status');
    const captureBtn = modal.querySelector('.face-capture-btn');
    const cancelBtn = modal.querySelector('.face-cancel-btn');
    const closeBtn = modal.querySelector('.face-close-btn');
    const loading = modal.querySelector('.face-loading');
    
    let stream = null;
    let faceDetected = false;

    // 清理函数
    const cleanup = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    };

    try {
      // 获取摄像头
      stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
        video.srcObject = stream;
      status.textContent = '请将面部对准摄像头';
        
      // 模拟人脸检测（简化版本）
        setTimeout(() => {
        faceDetected = true;
        status.textContent = '检测到人脸，点击按钮进行识别';
        status.className = 'face-status success';
        captureBtn.textContent = '开始识别';
        captureBtn.disabled = false;
      }, 2000);

    } catch (error) {
      status.textContent = '无法访问摄像头，请检查权限设置';
      status.className = 'face-status error';
      cleanup();
      reject(new Error('摄像头访问失败'));
      return;
    }

    // 点击识别按钮
    captureBtn.onclick = async () => {
      if (!faceDetected) return;
      
      // 显示加载状态
      loading.style.display = 'block';
      
      try {
        // 捕获图像
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        // 转换为blob
        const blob = await new Promise(resolve => {
          canvas.toBlob(resolve, 'image/jpeg', 0.8);
        });
        
        // 调用Face++人脸登录API
        const formData = new FormData();
        formData.append('image', blob, 'face.jpg');
        
        // 从配置模块获取API地址
        const apiBaseUrl = ENV_CONFIG.BASE_URL;
        console.log('📱 人脸登录API地址:', apiBaseUrl);
        const response = await fetch(`${apiBaseUrl}/auth/face/login`, {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          // 保存登录信息 - 使用uni.setStorageSync以保持与其他登录方式一致
          if (result.data.token) {
            uni.setStorageSync('token', result.data.token);
          }
          if (result.data.user) {
            uni.setStorageSync('user', result.data.user);
            console.log('✅ H5人脸登录用户信息已保存:', result.data.user);
            
            // 触发全局用户状态更新事件
            uni.$emit('userStatusChange', {
              isLoggedIn: true,
              user: result.data.user
            });
          }
          
          console.log('✅ 人脸登录成功，用户数据已保存:', result.data.user);
          
          cleanup();
          resolve({
            success: true,
            message: result.message || '人脸识别登录成功',
            data: result.data
          });
        } else {
          loading.style.display = 'none';
          
          // 特殊处理需要重新注册的情况
          if (result.error?.code === 'NEED_REREGISTER_FACE') {
            status.textContent = result.error.message;
            status.className = 'face-status warning';
            captureBtn.textContent = '前往注册';
            captureBtn.disabled = false;
            
            // 更新按钮功能为跳转到注册页面
            captureBtn.onclick = () => {
              cleanup();
              // 跳转到账号关联页面进行人脸注册
              uni.navigateTo({
                url: '/pages/AccountAssociated/AccountAssociated'
              });
              resolve({
                success: false,
                message: '请先注册人脸再进行登录',
                needRegister: true
              });
            };
          } else {
            status.textContent = result.error?.message || '人脸识别失败，请重试';
            status.className = 'face-status error';
            captureBtn.textContent = '重新识别';
            captureBtn.disabled = false;
          }
        }
        
      } catch (error) {
        console.error('人脸登录失败:', error);
        loading.style.display = 'none';
        status.textContent = '网络错误，请检查网络连接';
        status.className = 'face-status error';
        captureBtn.textContent = '重新识别';
        captureBtn.disabled = false;
      }
    };

    // 取消和关闭按钮
    const handleClose = () => {
      cleanup();
      reject(new Error('用户取消了人脸识别'));
    };

    cancelBtn.onclick = handleClose;
    closeBtn.onclick = handleClose;
  }

  /**
   * 移动端人脸识别实现
   */
  static async startMobileFaceLogin() {
    console.log('📱 startMobileFaceLogin() 开始执行');
    
    return new Promise((resolve) => {
      // 检查是否在uni-app环境中
      if (typeof uni !== 'undefined') {
        console.log('🦄 检测到uni-app环境');
        
        // 使用uni-app的相机API
        uni.chooseImage({
          count: 1,
          sourceType: ['camera'],
          success: async (res) => {
            console.log('📷 获取到摄像头图片:', res);
            
            try {
              // 将图片上传到后端进行人脸识别
              const result = await this.uploadImageForFaceLogin(res.tempFilePaths[0]);
              resolve(result);
            } catch (error) {
              console.error('❌ 人脸识别失败:', error);
              resolve({
                success: false,
                message: error.message || '人脸识别失败'
              });
            }
          },
          fail: (error) => {
            console.error('❌ 摄像头调用失败:', error);
            resolve({
              success: false,
              message: '无法调用摄像头，请检查权限设置'
            });
          }
        });
      } else {
        // 不是uni-app环境，提供备用方案
        console.log('⚠️ 当前环境不支持移动端人脸识别');
        resolve({
          success: false,
          message: '当前环境不支持人脸识别，请使用账号密码登录'
        });
      }
    });
  }

  /**
   * 上传图片进行人脸识别
   */
  static async uploadImageForFaceLogin(imagePath) {
    console.log('🔄 上传图片进行人脸识别:', imagePath);
    
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        // 从配置模块获取API地址
        url: `${ENV_CONFIG.BASE_URL}/auth/face/login`,
        filePath: imagePath,
        name: 'image',
        header: {
          'Content-Type': 'multipart/form-data'
        },
        success: (uploadRes) => {
          console.log('📤 图片上传成功:', uploadRes);
          
          try {
            const result = JSON.parse(uploadRes.data);
            
            if (result.success) {
              // 保存登录信息
              if (result.data.token) {
                uni.setStorageSync('token', result.data.token);
              }
              if (result.data.user) {
                uni.setStorageSync('user', result.data.user); // 统一格式，不使用JSON.stringify
                console.log('✅ 移动端人脸登录用户信息已保存:', result.data.user);
              }
              
              resolve({
                success: true,
                message: result.message || '人脸识别登录成功',
                data: result.data
              });
            } else {
              resolve({
                success: false,
                message: result.error?.message || '人脸识别失败'
              });
            }
          } catch (error) {
            console.error('❌ 解析响应失败:', error);
            reject(new Error('服务器响应格式错误'));
          }
        },
        fail: (error) => {
          console.error('❌ 图片上传失败:', error);
          reject(new Error('网络错误，请检查网络连接'));
        }
      });
    });
  }

  /**
   * 原有的初始化方法（保持向后兼容）
   */
  static async initFaceRecognition() {
    // 直接调用新的H5人脸识别方法
    return this.startH5FaceLogin();
  }
  
  /**
   * 保存生物识别用户信息
   * @param {Object} userInfo 用户信息
   */
  static saveBiometricUser(userInfo) {
    try {
      uni.setStorageSync('biometric_user', {
        userId: userInfo.userId,
        biometricToken: userInfo.biometricToken,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('保存生物识别用户信息失败:', error);
    }
  }
  
  /**
   * 清除生物识别用户信息
   */
  static clearBiometricUser() {
    try {
      uni.removeStorageSync('biometric_user');
    } catch (error) {
      console.error('清除生物识别用户信息失败:', error);
    }
  }
  
  /**
   * 检查是否有保存的生物识别用户
   * @returns {boolean}
   */
  static hasBiometricUser() {
    try {
      const savedUser = uni.getStorageSync('biometric_user');
      if (savedUser && savedUser.userId) {
        // 检查保存时间是否超过30天
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        return (Date.now() - savedUser.timestamp) < thirtyDays;
      }
      return false;
    } catch (error) {
      console.error('检查生物识别用户失败:', error);
      return false;
    }
  }
}

export default BiometricAuth;
