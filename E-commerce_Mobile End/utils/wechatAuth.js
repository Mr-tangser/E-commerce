/**
 * 微信登录认证工具类
 * 支持微信小程序登录和App微信登录
 */

class WechatAuth {
  
  /**
   * 微信登录
   * @returns {Promise<{success: boolean, data?: any, message?: string}>}
   */
  static async login() {
    return new Promise((resolve) => {
      // #ifdef MP-WEIXIN
      // 微信小程序登录
      this.miniProgramLogin().then(resolve).catch((error) => {
        resolve({
          success: false,
          message: error.message || '微信登录失败'
        });
      });
      // #endif
      
      // #ifdef APP-PLUS
      // App端微信登录
      this.appWechatLogin().then(resolve).catch((error) => {
        resolve({
          success: false,
          message: error.message || '微信登录失败'
        });
      });
      // #endif
      
      // #ifdef H5
      // H5端微信登录（需要微信公众号授权）
      this.h5WechatLogin().then(resolve).catch((error) => {
        resolve({
          success: false,
          message: error.message || '微信登录失败'
        });
      });
      // #endif
      
      // #ifndef MP-WEIXIN || APP-PLUS || H5
      resolve({
        success: false,
        message: '当前平台不支持微信登录'
      });
      // #endif
    });
  }
  
  /**
   * 微信小程序登录
   * @returns {Promise}
   */
  static async miniProgramLogin() {
    return new Promise((resolve, reject) => {
      // 先获取登录凭证
      wx.login({
        success: (loginRes) => {
          if (loginRes.code) {
            // 获取用户信息
            wx.getUserProfile({
              desc: '用于完善用户资料',
              success: async (userRes) => {
                try {
                  // 发送code和用户信息到后端
                  const response = await this.sendToServer({
                    code: loginRes.code,
                    userInfo: userRes.userInfo,
                    encryptedData: userRes.encryptedData,
                    iv: userRes.iv,
                    signature: userRes.signature,
                    rawData: userRes.rawData
                  });
                  
                  if (response.success) {
                    resolve({
                      success: true,
                      data: response.data,
                      message: '微信登录成功'
                    });
                  } else {
                    reject(new Error(response.message || '服务器处理失败'));
                  }
                } catch (error) {
                  reject(error);
                }
              },
              fail: (error) => {
                if (error.errMsg.indexOf('getUserProfile:fail auth deny') !== -1) {
                  reject(new Error('用户拒绝授权'));
                } else {
                  reject(new Error('获取用户信息失败'));
                }
              }
            });
          } else {
            reject(new Error('获取微信登录凭证失败'));
          }
        },
        fail: (error) => {
          reject(new Error('微信登录失败: ' + error.errMsg));
        }
      });
    });
  }
  
  /**
   * App端微信登录
   * @returns {Promise}
   */
  static async appWechatLogin() {
    return new Promise((resolve, reject) => {
      // 检查微信是否安装
      plus.oauth.getServices((services) => {
        const weixinService = services.find(service => service.id === 'weixin');
        
        if (!weixinService) {
          reject(new Error('设备未安装微信应用'));
          return;
        }
        
        // 进行微信登录
        weixinService.authorize((event) => {
          // 登录成功，获取用户信息
          weixinService.getUserInfo((userInfo) => {
            // 发送到服务器进行验证
            this.sendToServer({
              openid: userInfo.openid,
              unionid: userInfo.unionid,
              nickname: userInfo.nickname,
              headimgurl: userInfo.headimgurl,
              sex: userInfo.sex,
              province: userInfo.province,
              city: userInfo.city,
              country: userInfo.country,
              access_token: event.access_token
            }).then((response) => {
              if (response.success) {
                resolve({
                  success: true,
                  data: response.data,
                  message: '微信登录成功'
                });
              } else {
                reject(new Error(response.message || '服务器处理失败'));
              }
            }).catch(reject);
          }, (error) => {
            reject(new Error('获取微信用户信息失败: ' + error.message));
          });
        }, (error) => {
          if (error.code === '4') {
            reject(new Error('用户取消微信授权'));
          } else {
            reject(new Error('微信登录失败: ' + error.message));
          }
        });
      }, (error) => {
        reject(new Error('获取登录服务失败: ' + error.message));
      });
    });
  }
  
  /**
   * H5端微信登录
   * @returns {Promise}
   */
  static async h5WechatLogin() {
    return new Promise((resolve, reject) => {
      // 检查是否在微信浏览器中
      if (!this.isWechatBrowser()) {
        reject(new Error('请在微信中打开'));
        return;
      }
      
      // 构造微信授权URL
      const appId = 'YOUR_WECHAT_APPID'; // 需要配置微信公众号AppID
      const redirectUri = encodeURIComponent(window.location.href);
      const scope = 'snsapi_userinfo';
      const state = 'wechat_login_' + Date.now();
      
      const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;
      
      // 检查URL中是否有授权返回的code
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const returnedState = urlParams.get('state');
      
      if (code && returnedState && returnedState.startsWith('wechat_login_')) {
        // 有授权码，发送到服务器
        this.sendToServer({
          code: code,
          state: returnedState,
          type: 'h5_wechat'
        }).then((response) => {
          if (response.success) {
            resolve({
              success: true,
              data: response.data,
              message: '微信登录成功'
            });
          } else {
            reject(new Error(response.message || '服务器处理失败'));
          }
        }).catch(reject);
      } else {
        // 跳转到微信授权页面
        window.location.href = authUrl;
      }
    });
  }
  
  /**
   * 发送数据到服务器
   * @param {Object} data 要发送的数据
   * @returns {Promise}
   */
  static async sendToServer(data) {
    return new Promise((resolve, reject) => {
      uni.request({
        url: 'http://your-api-domain.com/api/auth/wechat-login',
        method: 'POST',
        data: data,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error('网络请求失败'));
          }
        },
        fail: (error) => {
          reject(new Error('网络连接失败: ' + error.errMsg));
        }
      });
    });
  }
  
  /**
   * 检查是否在微信浏览器中
   * @returns {boolean}
   */
  static isWechatBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    return ua.indexOf('micromessenger') !== -1;
  }
  
  /**
   * 获取微信小程序场景值
   * @returns {Promise<number>}
   */
  static async getMiniProgramScene() {
    return new Promise((resolve) => {
      // #ifdef MP-WEIXIN
      wx.getLaunchOptionsSync ? 
        resolve(wx.getLaunchOptionsSync().scene) : 
        resolve(0);
      // #endif
      
      // #ifndef MP-WEIXIN
      resolve(0);
      // #endif
    });
  }
  
  /**
   * 微信分享
   * @param {Object} shareData 分享数据
   * @returns {Promise}
   */
  static async share(shareData) {
    return new Promise((resolve, reject) => {
      // #ifdef MP-WEIXIN
      wx.updateShareAppMessage({
        title: shareData.title || '电商平台',
        desc: shareData.desc || '优质商品，优惠价格',
        path: shareData.path || '/pages/index/index',
        imageUrl: shareData.imageUrl || '/static/share-logo.png',
        success: () => {
          resolve({ success: true });
        },
        fail: (error) => {
          reject(new Error('分享失败: ' + error.errMsg));
        }
      });
      // #endif
      
      // #ifdef APP-PLUS
      plus.oauth.getServices((services) => {
        const weixinService = services.find(service => service.id === 'weixin');
        if (weixinService) {
          weixinService.share({
            type: 'web',
            title: shareData.title || '电商平台',
            content: shareData.desc || '优质商品，优惠价格',
            href: shareData.url || 'https://your-domain.com',
            thumbs: [shareData.imageUrl || '/static/share-logo.png']
          }, () => {
            resolve({ success: true });
          }, (error) => {
            reject(new Error('分享失败: ' + error.message));
          });
        } else {
          reject(new Error('微信未安装'));
        }
      });
      // #endif
      
      // #ifdef H5
      if (this.isWechatBrowser()) {
        // H5在微信中的分享需要通过JSSDK
        // 这里简化处理
        resolve({ success: true, message: '请点击右上角分享' });
      } else {
        reject(new Error('请在微信中分享'));
      }
      // #endif
      
      // #ifndef MP-WEIXIN || APP-PLUS || H5
      reject(new Error('当前平台不支持微信分享'));
      // #endif
    });
  }
  
  /**
   * 检查微信登录状态
   * @returns {boolean}
   */
  static checkLoginStatus() {
    try {
      const token = uni.getStorageSync('token');
      const userInfo = uni.getStorageSync('userInfo');
      return !!(token && userInfo && userInfo.loginType === 'wechat');
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 微信支付
   * @param {Object} paymentData 支付数据
   * @returns {Promise}
   */
  static async pay(paymentData) {
    return new Promise((resolve, reject) => {
      // #ifdef MP-WEIXIN
      wx.requestPayment({
        timeStamp: paymentData.timeStamp,
        nonceStr: paymentData.nonceStr,
        package: paymentData.package,
        signType: paymentData.signType || 'MD5',
        paySign: paymentData.paySign,
        success: (res) => {
          resolve({ success: true, data: res });
        },
        fail: (error) => {
          if (error.errMsg === 'requestPayment:fail cancel') {
            reject(new Error('用户取消支付'));
          } else {
            reject(new Error('支付失败: ' + error.errMsg));
          }
        }
      });
      // #endif
      
      // #ifdef APP-PLUS
      plus.payment.request('wxpay', {
        appid: paymentData.appid,
        partnerid: paymentData.partnerid,
        prepayid: paymentData.prepayid,
        package: paymentData.package,
        noncestr: paymentData.noncestr,
        timestamp: paymentData.timestamp,
        sign: paymentData.sign
      }, (result) => {
        resolve({ success: true, data: result });
      }, (error) => {
        if (error.code === -2) {
          reject(new Error('用户取消支付'));
        } else {
          reject(new Error('支付失败: ' + error.message));
        }
      });
      // #endif
      
      // #ifndef MP-WEIXIN || APP-PLUS
      reject(new Error('当前平台不支持微信支付'));
      // #endif
    });
  }
}

export default WechatAuth;
