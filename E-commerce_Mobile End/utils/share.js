/**
 * 分享功能工具类
 */
import shareConfig from '@/config/share.js';

class ShareManager {
  
  /**
   * 显示分享选项
   */
  static showShareOptions(shareContent, context) {
    return new Promise((resolve, reject) => {
      // 根据平台选择不同的分享选项
      let itemList = [];
      
      // #ifdef APP-PLUS
      itemList = shareConfig.shareOptions.app;
      // #endif
      
      // #ifdef H5
      itemList = shareConfig.shareOptions.h5;
      // #endif
      
      // #ifdef MP-WEIXIN
      itemList = shareConfig.shareOptions.mp;
      // #endif
      
      uni.showActionSheet({
        itemList: itemList,
        success: (res) => {
          console.log('🔘 选择分享方式:', res.tapIndex, itemList[res.tapIndex]);
          
          // 根据选择执行相应操作
          this.handleShareAction(res.tapIndex, shareContent, context)
            .then(resolve)
            .catch(reject);
        },
        fail: (err) => {
          console.log('⚠️ 分享选择取消');
          reject(err);
        }
      });
    });
  }
  
  /**
   * 处理分享动作
   */
  static async handleShareAction(index, shareContent, context) {
    // #ifdef APP-PLUS
    const appActions = [
      () => this.shareToWeChat(shareContent, 'WXSceneSession'),  // 分享给微信好友
      () => this.shareToWeChat(shareContent, 'WXSceneTimeline'), // 分享到朋友圈
      () => this.shareToQQ(shareContent),                        // 分享到QQ
      () => this.copyProductLink(shareContent),                  // 复制商品链接
      () => this.saveProductImage(shareContent)                  // 保存商品图片
    ];
    
    if (appActions[index]) {
      return await appActions[index]();
    }
    // #endif
    
    // #ifdef H5
    const h5Actions = [
      () => this.copyProductLink(shareContent),     // 复制商品链接
      () => this.saveProductImage(shareContent)     // 保存商品图片
    ];
    
    if (h5Actions[index]) {
      return await h5Actions[index]();
    }
    // #endif
    
    // #ifdef MP-WEIXIN
    const mpActions = [
      () => this.shareToMiniProgram(shareContent, context), // 转发给好友
      () => this.generateSharePoster(shareContent)          // 生成分享海报
    ];
    
    if (mpActions[index]) {
      return await mpActions[index]();
    }
    // #endif
  }
  
  /**
   * 分享到微信
   */
  static shareToWeChat(shareContent, scene) {
    return new Promise((resolve, reject) => {
      // #ifdef APP-PLUS
      if (!shareConfig.platforms.weixin.enabled) {
        reject(new Error('微信分享未启用'));
        return;
      }
      
      uni.share({
        provider: 'weixin',
        scene: scene,
        type: 0,
        href: `${shareConfig.domain}${shareContent.path}`,
        title: shareContent.title,
        summary: shareContent.summary,
        imageUrl: shareContent.imageUrl,
        success: (res) => {
          console.log('✅ 微信分享成功:', res);
          uni.showToast({
            title: '分享成功',
            icon: 'success'
          });
          
          // 分享统计
          this.trackShareEvent('shareSuccess', 'weixin');
          resolve(res);
        },
        fail: (err) => {
          console.error('❌ 微信分享失败:', err);
          uni.showToast({
            title: '分享失败，请稍后重试',
            icon: 'none'
          });
          
          // 分享统计
          this.trackShareEvent('shareError', 'weixin');
          reject(err);
        }
      });
      // #endif
      
      // #ifndef APP-PLUS
      // 非APP环境降级处理
      this.fallbackShare(shareContent).then(resolve).catch(reject);
      // #endif
    });
  }
  
  /**
   * 分享到QQ
   */
  static shareToQQ(shareContent) {
    return new Promise((resolve, reject) => {
      // #ifdef APP-PLUS
      if (!shareConfig.platforms.qq.enabled) {
        reject(new Error('QQ分享未启用'));
        return;
      }
      
      uni.share({
        provider: 'qq',
        type: 0,
        href: `${shareConfig.domain}${shareContent.path}`,
        title: shareContent.title,
        summary: shareContent.summary,
        imageUrl: shareContent.imageUrl,
        success: (res) => {
          console.log('✅ QQ分享成功:', res);
          uni.showToast({
            title: '分享成功',
            icon: 'success'
          });
          
          this.trackShareEvent('shareSuccess', 'qq');
          resolve(res);
        },
        fail: (err) => {
          console.error('❌ QQ分享失败:', err);
          uni.showToast({
            title: '分享失败，请稍后重试',
            icon: 'none'
          });
          
          this.trackShareEvent('shareError', 'qq');
          reject(err);
        }
      });
      // #endif
      
      // #ifndef APP-PLUS
      this.fallbackShare(shareContent).then(resolve).catch(reject);
      // #endif
    });
  }
  
  /**
   * 复制商品链接
   */
  static copyProductLink(shareContent) {
    return new Promise((resolve, reject) => {
      const fullUrl = `${shareConfig.domain}${shareContent.path}`;
      
      uni.setClipboardData({
        data: fullUrl,
        success: () => {
          uni.showToast({
            title: '链接已复制到剪贴板',
            icon: 'success'
          });
          
          // 显示分享提示
          setTimeout(() => {
            uni.showModal({
              title: '分享提示',
              content: '商品链接已复制，您可以粘贴到微信、QQ等应用与朋友分享',
              showCancel: false
            });
          }, 1500);
          
          this.trackShareEvent('shareSuccess', 'copy_link');
          resolve();
        },
        fail: (err) => {
          console.error('❌ 复制链接失败:', err);
          uni.showToast({
            title: '复制失败，请稍后重试',
            icon: 'none'
          });
          
          this.trackShareEvent('shareError', 'copy_link');
          reject(err);
        }
      });
    });
  }
  
  /**
   * 保存商品图片
   */
  static saveProductImage(shareContent) {
    return new Promise((resolve, reject) => {
      if (!shareContent.imageUrl) {
        uni.showToast({
          title: '暂无商品图片',
          icon: 'none'
        });
        reject(new Error('无图片'));
        return;
      }
      
      // 显示保存进度
      uni.showLoading({
        title: '保存图片中...'
      });
      
      // 下载并保存图片
      uni.downloadFile({
        url: shareContent.imageUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            uni.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                uni.hideLoading();
                uni.showToast({
                  title: '图片已保存到相册',
                  icon: 'success'
                });
                
                this.trackShareEvent('shareSuccess', 'save_image');
                resolve();
              },
              fail: (err) => {
                uni.hideLoading();
                console.error('❌ 保存图片失败:', err);
                uni.showModal({
                  title: '保存失败',
                  content: '保存图片失败，请检查相册权限设置',
                  showCancel: false
                });
                
                this.trackShareEvent('shareError', 'save_image');
                reject(err);
              }
            });
          } else {
            uni.hideLoading();
            uni.showToast({
              title: '图片下载失败',
              icon: 'none'
            });
            reject(new Error('下载失败'));
          }
        },
        fail: (err) => {
          uni.hideLoading();
          console.error('❌ 下载图片失败:', err);
          uni.showToast({
            title: '网络错误，下载失败',
            icon: 'none'
          });
          reject(err);
        }
      });
    });
  }
  
  /**
   * 小程序分享
   */
  static shareToMiniProgram(shareContent, context) {
    // #ifdef MP-WEIXIN
    // 小程序中通过onShareAppMessage实现
    if (context && typeof context.onShareAppMessage === 'function') {
      // 触发小程序的分享
      return Promise.resolve();
    }
    // #endif
    
    return this.fallbackShare(shareContent);
  }
  
  /**
   * 生成分享海报
   */
  static generateSharePoster(shareContent) {
    return new Promise((resolve, reject) => {
      // TODO: 实现海报生成功能
      uni.showToast({
        title: '海报生成功能开发中',
        icon: 'none'
      });
      resolve();
    });
  }
  
  /**
   * 降级分享方案
   */
  static fallbackShare(shareContent) {
    return new Promise((resolve, reject) => {
      uni.showModal({
        title: '分享商品',
        content: '将为您复制商品链接，您可以粘贴到微信等应用分享给朋友',
        confirmText: '复制链接',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.copyProductLink(shareContent).then(resolve).catch(reject);
          } else {
            reject(new Error('用户取消'));
          }
        }
      });
    });
  }
  
  /**
   * 分享统计
   */
  static trackShareEvent(eventType, platform) {
    if (!shareConfig.analytics.enabled) {
      return;
    }
    
    const eventName = shareConfig.analytics.trackingEvents[eventType];
    if (eventName) {
      console.log('📊 分享统计:', eventName, platform);
      
      // TODO: 发送统计数据到分析平台
      // 例如：百度统计、友盟等
      
      try {
        // 示例：发送到自定义统计接口
        uni.request({
          url: `${shareConfig.domain}/api/analytics/track`,
          method: 'POST',
          data: {
            event: eventName,
            platform: platform,
            timestamp: Date.now(),
            userAgent: plus ? plus.navigator.getUserAgent() : navigator.userAgent
          },
          success: (res) => {
            console.log('📈 统计数据发送成功:', res);
          },
          fail: (err) => {
            console.warn('⚠️ 统计数据发送失败:', err);
          }
        });
      } catch (error) {
        console.warn('⚠️ 统计异常:', error);
      }
    }
  }
  
  /**
   * 构建分享内容
   */
  static buildShareContent(productData) {
    return {
      title: productData.name || shareConfig.defaultShare.title,
      summary: `￥${productData.price} | ${productData.description || shareConfig.defaultShare.summary}`,
      imageUrl: (productData.images && productData.images.length > 0) 
        ? productData.images[0] 
        : shareConfig.defaultShare.imageUrl,
      path: `/pages/GoodsDetails/GoodsDetails?id=${productData._id}`
    };
  }
}

export default ShareManager;
