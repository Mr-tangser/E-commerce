/**
 * 生物识别认证工具类
 * 支持指纹识别和人脸识别
 */

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
      // H5环境检查摄像头权限
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => resolve(true))
        .catch(() => resolve(false));
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
    return new Promise((resolve) => {
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
      this.initFaceRecognition().then((result) => {
        resolve(result);
      }).catch((error) => {
        resolve({
          success: false,
          message: error.message || '人脸识别失败'
        });
      });
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
  static async initFaceRecognition() {
    return new Promise(async (resolve, reject) => {
      try {
        // 获取摄像头权限
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user' // 前置摄像头
          } 
        });
        
        // 创建video元素用于人脸检测
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        
        // 这里可以集成人脸识别库如 face-api.js
        // 简化示例：模拟人脸识别过程
        setTimeout(() => {
          // 停止摄像头
          stream.getTracks().forEach(track => track.stop());
          
          // 模拟识别结果
          const success = Math.random() > 0.3; // 70%成功率模拟
          if (success) {
            resolve({
              success: true,
              message: '人脸识别成功'
            });
          } else {
            resolve({
              success: false,
              message: '人脸识别失败，请重试'
            });
          }
        }, 3000);
        
      } catch (error) {
        reject({
          success: false,
          message: '无法访问摄像头: ' + error.message
        });
      }
    });
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
