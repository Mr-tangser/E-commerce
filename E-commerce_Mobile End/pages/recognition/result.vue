<template>
  <view class="recognition-result-page">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-left" @click="goBack">
        <text class="iconfont icon-arrow-left"></text>
      </view>
      <view class="nav-title">识别结果</view>
      <view class="nav-right" @click="showHistory">
        <text class="iconfont icon-history"></text>
      </view>
    </view>

    <!-- 识别结果内容 -->
    <view class="result-content" v-if="recognitionData">
      <!-- 识别图片展示 -->
      <view class="image-section" v-if="recognitionImage">
        <image :src="recognitionImage" mode="aspectFit" class="recognition-image"></image>
      </view>

      <!-- 主要识别结果 -->
      <view class="main-result">
        <view class="result-header">
          <text class="result-title">{{ recognitionData.topResult.name }}</text>
          <view class="confidence-badge">
            <text class="confidence-text">置信度 {{ (recognitionData.topResult.score * 100).toFixed(1) }}%</text>
          </view>
        </view>

        <!-- 百科信息 -->
        <view class="baike-info" v-if="recognitionData.topResult.baike_info && recognitionData.topResult.baike_info.description">
          <view class="baike-header">
            <text class="baike-title">百科信息</text>
            <button class="baike-detail-btn" @click="viewFullBaike" v-if="recognitionData.topResult.baike_info.baike_url">
              <text class="iconfont icon-link"></text>
              详细信息
            </button>
          </view>
          <view class="baike-content">
            <text class="baike-description">{{ getBaikeDescription() }}</text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="action-buttons">
          <button class="search-btn primary-btn" @click="searchProducts">
            <text class="iconfont icon-search"></text>
            搜索相关商品
          </button>
          <button class="share-btn secondary-btn" @click="shareResult">
            <text class="iconfont icon-share"></text>
            分享结果
          </button>
        </view>
      </view>

      <!-- 物品详细讲解 -->
      <view class="item-description" v-if="getItemDescription()">
        <view class="section-header">
          <text class="section-title">物品讲解</text>
        </view>
        <view class="description-content">
          <text class="description-text">{{ getItemDescription() }}</text>
        </view>
      </view>

      <!-- 物品特征信息 -->
      <view class="item-features" v-if="recognitionData.topResult">
        <view class="section-header">
          <text class="section-title">识别信息</text>
        </view>
        <view class="features-list">
          <view class="feature-item">
            <text class="feature-label">物品类别</text>
            <text class="feature-value">{{ getItemCategory() }}</text>
          </view>
          <view class="feature-item">
            <text class="feature-label">识别置信度</text>
            <text class="feature-value">{{ (recognitionData.topResult.score * 100).toFixed(1) }}%</text>
          </view>
          <view class="feature-item" v-if="recognitionData.results && recognitionData.results.length > 0">
            <text class="feature-label">识别方式</text>
            <text class="feature-value">AI智能识别</text>
          </view>
        </view>
      </view>

      <!-- 重新识别按钮 -->
      <view class="retry-section">
        <button class="retry-btn" @click="retryRecognition">
          <text class="iconfont icon-refresh"></text>
          重新识别
        </button>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-else-if="loading">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">正在识别中...</text>
      </view>
    </view>

    <!-- 错误状态 -->
    <view class="error-state" v-else-if="error">
      <view class="error-content">
        <text class="error-icon">😕</text>
        <text class="error-text">{{ error.message || '识别失败，请重试' }}</text>
        <button class="retry-btn" @click="retryRecognition">重新识别</button>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js';

export default {
  name: 'RecognitionResult',
  data() {
    return {
      recognitionData: null,
      recognitionImage: '',
      loading: false,
      error: null,
      sourceImagePath: ''
    }
  },

  onLoad(options) {
    console.log('🔍 识别结果页面加载，参数:', options);
    
    // 获取传递的参数
    if (options.data) {
      try {
        this.recognitionData = JSON.parse(decodeURIComponent(options.data));
        console.log('📋 解析识别数据:', this.recognitionData);
      } catch (error) {
        console.error('❌ 解析识别数据失败:', error);
        this.error = { message: '数据解析失败' };
      }
    }
    
    if (options.image) {
      this.recognitionImage = decodeURIComponent(options.image);
      this.sourceImagePath = this.recognitionImage;
      console.log('📸 识别图片路径:', this.recognitionImage);
    }
  },

  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },

    // 显示识别历史
    showHistory() {
      uni.navigateTo({
        url: '/pages/recognition/history'
      });
    },

    // 获取百科描述
    getBaikeDescription() {
      if (this.recognitionData?.topResult?.baike_info?.description) {
        const description = this.recognitionData.topResult.baike_info.description;
        return description.length > 300 ? description.slice(0, 300) + '...' : description;
      }
      return '暂无详细描述信息';
    },

    // 查看完整百科信息
    viewFullBaike() {
      const baikeInfo = this.recognitionData?.topResult?.baike_info;
      if (baikeInfo && baikeInfo.baike_url) {
        // 如果有百科链接，打开外部浏览器
        // #ifdef APP-PLUS
        plus.runtime.openURL(baikeInfo.baike_url);
        // #endif
        
        // #ifdef H5
        window.open(baikeInfo.baike_url, '_blank');
        // #endif
        
        // #ifdef MP
        uni.showModal({
          title: '提示',
          content: '小程序中无法直接打开外部链接，请复制链接到浏览器中查看',
          confirmText: '复制链接',
          success: (res) => {
            if (res.confirm) {
              uni.setClipboardData({
                data: baikeInfo.baike_url,
                success: () => {
                  uni.showToast({
                    title: '链接已复制',
                    icon: 'success'
                  });
                }
              });
            }
          }
        });
        // #endif
      } else {
        uni.showToast({
          title: '暂无详细信息',
          icon: 'none'
        });
      }
    },

    // 获取物品详细讲解
    getItemDescription() {
      const topResult = this.recognitionData?.topResult;
      if (!topResult) return '';
      
      // 优先使用百科描述
      if (topResult.baike_info && topResult.baike_info.description) {
        return topResult.baike_info.description;
      }
      
      // 如果没有百科描述，根据物品名称生成通用描述
      const itemName = topResult.name || '未知物品';
      return this.generateItemDescription(itemName);
    },

    // 生成物品通用描述
    generateItemDescription(itemName) {
      const descriptions = {
        '鼠标': '鼠标是计算机的一种输入设备，通过移动鼠标可以控制屏幕上光标的位置，通过点击按键可以进行选择、确认等操作。现代鼠标通常采用光电或激光技术，具有精确定位和流畅操作的特点。',
        '键盘': '键盘是计算机的主要输入设备，用于输入文字、数字和各种指令。标准键盘包含字母键、数字键、功能键和特殊键等，是人机交互的重要工具。',
        '电脑': '电脑，又称计算机，是一种能够按照程序运行，自动、高速处理数据的现代化智能电子设备。它可以进行数值计算、逻辑计算，具有存储记忆功能，是现代信息处理的核心设备。',
        '耳机': '耳机是一对转换单元，它接受媒体播放器或接收器所发出的电讯号，利用贴近耳朵的扬声器将其转化成可以听到的音波。耳机广泛用于音乐欣赏、通话、游戏等场景。',
        '电风扇': '电风扇是一种利用电动机驱动扇叶旋转，来达到使空气加速流通的家用电器。它能够为人们提供凉爽舒适的环境，是夏季常用的降温设备。',
        '手机': '手机是可以在较广范围内使用的便携式电话终端。现代智能手机除了通话功能外，还具备上网、拍照、娱乐、办公等多种功能，是人们日常生活中不可缺少的通讯和娱乐工具。'
      };
      
      // 检查是否有匹配的描述
      for (const [key, description] of Object.entries(descriptions)) {
        if (itemName.includes(key)) {
          return description;
        }
      }
      
      // 默认描述
      return `${itemName}是我们日常生活中常见的物品。通过AI智能识别技术，我们能够快速准确地识别出这类物品，为您提供相关的信息和服务。如需了解更多详细信息，可以点击搜索相关商品查看更多内容。`;
    },

    // 获取物品类别
    getItemCategory() {
      if (!this.recognitionData?.results || this.recognitionData.results.length === 0) {
        return '未知类别';
      }
      
      const firstResult = this.recognitionData.results[0];
      return firstResult.root || '日用品';
    },

    // 搜索相关商品
    searchProducts() {
      const keyword = this.recognitionData?.topResult?.name;
      if (keyword) {
        console.log('🔍 搜索商品关键词:', keyword);
        uni.navigateTo({
          url: `/pages/search/search?keyword=${encodeURIComponent(keyword)}`
        });
      } else {
        uni.showToast({
          title: '无法获取搜索关键词',
          icon: 'none'
        });
      }
    },

    // 分享结果
    shareResult() {
      const itemName = this.recognitionData?.topResult?.name || '未知物品';
      const confidence = (this.recognitionData?.topResult?.score * 100).toFixed(1);
      
      uni.showActionSheet({
        itemList: ['分享到微信好友', '分享到微信朋友圈', '复制分享内容'],
        success: (res) => {
          switch(res.tapIndex) {
            case 0: // 分享到微信好友
              this.shareToWechatFriend(itemName, confidence);
              break;
            case 1: // 分享到微信朋友圈
              this.shareToWechatMoments(itemName, confidence);
              break;
            case 2: // 复制分享内容
              this.copyShareContent(itemName, confidence);
              break;
          }
        },
        fail: (error) => {
          console.log('用户取消分享');
        }
      });
    },

    // 分享到微信好友
    shareToWechatFriend(itemName, confidence) {
      // #ifdef MP-WEIXIN
      // 在微信小程序中分享当前页面
      uni.showShareMenu({
        withShareTicket: true,
        title: `AI识别结果：${itemName}`,
        path: `/pages/recognition/result?data=${encodeURIComponent(JSON.stringify(this.recognitionData))}&image=${encodeURIComponent(this.sourceImagePath)}`,
        imageUrl: this.sourceImagePath, // 分享封面图
        success: () => {
          uni.showToast({
            title: '分享成功',
            icon: 'success'
          });
        },
        fail: (error) => {
          console.error('分享失败:', error);
          this.shareImageWithText(itemName, confidence, 'friend');
        }
      });
      // #endif
      
      // #ifdef APP-PLUS
      // 在APP中分享图片和文字
      this.shareImageWithText(itemName, confidence, 'friend');
      // #endif
      
      // #ifdef H5
      this.fallbackShare(`AI识别结果：${itemName}，置信度${confidence}%`);
      // #endif
    },

    // 分享到微信朋友圈
    shareToWechatMoments(itemName, confidence) {
      // 朋友圈主要分享图片+文字
      this.shareImageWithText(itemName, confidence, 'timeline');
    },

    // 复制分享内容
    copyShareContent(itemName, confidence) {
      const baikeInfo = this.recognitionData?.topResult?.baike_info;
      const category = this.getItemCategory();
      
      let shareContent = `🤖 AI智能识别结果 🤖\n\n`;
      shareContent += `📝 识别物品：${itemName}\n`;
      shareContent += `📊 置信度：${confidence}%\n`;
      
      if (category && category !== itemName) {
        shareContent += `🏷️ 物品类别：${category}\n`;
      }
      
      if (baikeInfo && baikeInfo.description) {
        const description = baikeInfo.description.length > 100 
          ? baikeInfo.description.substring(0, 100) + '...' 
          : baikeInfo.description;
        shareContent += `\n📖 物品介绍：\n${description}\n`;
      }
      
      shareContent += `\n✨ 这是一个超酷的AI物品识别功能，快来试试吧！`;
      
      uni.setClipboardData({
        data: shareContent,
        success: () => {
          uni.showToast({
            title: '完整识别结果已复制',
            icon: 'success',
            duration: 2000
          });
        },
        fail: (error) => {
          console.error('复制失败:', error);
          uni.showToast({
            title: '复制失败',
            icon: 'none'
          });
        }
      });
    },

    // 分享图片和文字
    shareImageWithText(itemName, confidence, scene) {
      const shareText = scene === 'timeline' 
        ? `🤖 AI识别结果：${itemName}\n📊 置信度：${confidence}%\n✨ 智能识别小助手` 
        : `我用AI识别出了：${itemName}，置信度${confidence}%！`;

      // #ifdef APP-PLUS
      const sceneCode = scene === 'timeline' ? 'WXSceneTimeline' : 'WXSceneSession';
      
      if (this.sourceImagePath) {
        // 分享图片+文字
        uni.share({
          provider: 'weixin',
          scene: sceneCode,
          type: 2, // 图片类型
          imageUrl: this.sourceImagePath,
          title: shareText,
          summary: shareText,
          success: () => {
            uni.showToast({
              title: '分享成功',
              icon: 'success'
            });
          },
          fail: (error) => {
            console.error('图片分享失败:', error);
            // 降级为文字分享
            uni.share({
              provider: 'weixin',
              scene: sceneCode,
              type: 1, // 文字类型
              summary: shareText,
              success: () => {
                uni.showToast({
                  title: '分享成功',
                  icon: 'success'
                });
              },
              fail: (error2) => {
                console.error('文字分享失败:', error2);
                this.fallbackShare(shareText);
              }
            });
          }
        });
      } else {
        // 只分享文字
        uni.share({
          provider: 'weixin',
          scene: sceneCode,
          type: 1,
          summary: shareText,
          success: () => {
            uni.showToast({
              title: '分享成功',
              icon: 'success'
            });
          },
          fail: (error) => {
            console.error('分享失败:', error);
            this.fallbackShare(shareText);
          }
        });
      }
      // #endif

      // #ifdef MP-WEIXIN
      // 小程序中保存图片到相册，然后提示用户手动分享
      this.saveImageAndPromptShare(shareText);
      // #endif

      // #ifdef H5
      this.fallbackShare(shareText);
      // #endif
    },

    // 保存图片并提示分享（小程序专用）
    saveImageAndPromptShare(shareText) {
      if (!this.sourceImagePath) {
        this.fallbackShare(shareText);
        return;
      }

      uni.showLoading({
        title: '准备分享内容...'
      });

      // 保存图片到相册
      uni.saveImageToPhotosAlbum({
        filePath: this.sourceImagePath,
        success: () => {
          uni.hideLoading();
          
          // 复制分享文字到剪贴板
          uni.setClipboardData({
            data: shareText,
            success: () => {
              uni.showModal({
                title: '分享准备完成',
                content: '识别图片已保存到相册，分享文字已复制到剪贴板。现在可以打开微信，选择图片并粘贴文字进行分享！',
                showCancel: false,
                confirmText: '知道了'
              });
            },
            fail: () => {
              uni.showModal({
                title: '分享准备完成',
                content: '识别图片已保存到相册，现在可以打开微信选择该图片进行分享！',
                showCancel: false,
                confirmText: '知道了'
              });
            }
          });
        },
        fail: (error) => {
          uni.hideLoading();
          console.error('保存图片失败:', error);
          
          if (error.errMsg && error.errMsg.includes('auth')) {
            uni.showModal({
              title: '需要授权',
              content: '需要获取相册权限才能保存图片，请在设置中开启权限后重试',
              showCancel: true,
              cancelText: '取消',
              confirmText: '去设置',
              success: (res) => {
                if (res.confirm) {
                  uni.openSetting();
                }
              }
            });
          } else {
            this.fallbackShare(shareText);
          }
        }
      });
    },

    // 兜底分享方案
    fallbackShare(content) {
      uni.showModal({
        title: '分享内容',
        content: content,
        showCancel: true,
        cancelText: '关闭',
        confirmText: '复制',
        success: (res) => {
          if (res.confirm) {
            uni.setClipboardData({
              data: content,
              success: () => {
                uni.showToast({
                  title: '内容已复制',
                  icon: 'success'
                });
              }
            });
          }
        }
      });
    },

    // 重新识别
    async retryRecognition() {
      if (!this.sourceImagePath) {
        // 如果没有原图片，重新选择图片
        this.selectNewImage();
        return;
      }

      try {
        this.loading = true;
        this.error = null;
        
        const token = uni.getStorageSync('token');
        if (!token) {
          uni.showModal({
            title: '提示',
            content: '请先登录后再使用识别功能',
            success: (res) => {
              if (res.confirm) {
                uni.navigateTo({
                  url: '/pages/Login'
                });
              }
            }
          });
          return;
        }

        // 重新调用识别API
        const result = await api.recognition.identifyImage(this.sourceImagePath, token);
        
        this.recognitionData = result.data;
        console.log('🔄 重新识别结果:', this.recognitionData);
        
        uni.showToast({
          title: '重新识别成功',
          icon: 'success'
        });
        
      } catch (error) {
        console.error('❌ 重新识别失败:', error);
        this.error = error;
        uni.showToast({
          title: error.message || '重新识别失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },

    // 选择新图片识别
    selectNewImage() {
      uni.showActionSheet({
        itemList: ['拍照识别', '从相册选择'],
        success: async (res) => {
          try {
            const sourceType = res.tapIndex === 0 ? 'camera' : 'album';
            
            // 选择图片
            const imagePath = await this.getImage(sourceType);
            
            this.loading = true;
            this.error = null;
            
            const token = uni.getStorageSync('token');
            if (!token) {
              uni.showModal({
                title: '提示',
                content: '请先登录后再使用识别功能',
                success: (res) => {
                  if (res.confirm) {
                    uni.navigateTo({
                      url: '/pages/Login'
                    });
                  }
                }
              });
              return;
            }

            // 调用识别API
            const result = await api.recognition.identifyImage(imagePath, token);
            
            this.recognitionData = result.data;
            this.recognitionImage = imagePath;
            this.sourceImagePath = imagePath;
            
            uni.showToast({
              title: '识别成功',
              icon: 'success'
            });
            
          } catch (error) {
            console.error('❌ 选择新图片识别失败:', error);
            this.error = error;
            uni.showToast({
              title: error.message || '识别失败',
              icon: 'none'
            });
          } finally {
            this.loading = false;
          }
        }
      });
    },

    // 获取图片
    getImage(sourceType) {
      return new Promise((resolve, reject) => {
        uni.chooseImage({
          count: 1,
          sourceType: [sourceType === 'camera' ? 'camera' : 'album'],
          sizeType: ['compressed'],
          success: (res) => {
            resolve(res.tempFilePaths[0]);
          },
          fail: (error) => {
            reject(new Error('获取图片失败'));
          }
        });
      });
    }
  }
}
</script>

<style scoped lang="scss">
.recognition-result-page {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: #f6f6f6;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 120rpx;
  padding: 20rpx 4%;
  background: #FFFFFF;
  border-radius: 0 0 20rpx 20rpx;
  position: sticky;
  top: 0;
  z-index: 100;

  .nav-left, .nav-right {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .iconfont {
      font-size: 32rpx;
      color: #222222;
    }
  }

  .nav-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #222222;
    margin-top: 38rpx;
  }
}

.result-content {
  padding: 20rpx 4%;
  padding-bottom: 120rpx;
}

.image-section {
  margin-bottom: 20rpx;
  text-align: center;

  .recognition-image {
    width: 100%;
    max-width: 500rpx;
    height: 400rpx;
    border-radius: 20rpx;
    box-shadow: 0 0 10rpx #F1F1F1;
  }
}

.main-result {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 0 4%;
  margin-bottom: 20rpx;
  box-shadow: 0 0 10rpx #F1F1F1;

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100rpx;

    .result-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #222222;
      flex: 1;
    }

    .confidence-badge {
      padding: 10rpx 20rpx;
      background-color: #f6f6f6;
      border-radius: 10rpx;

      .confidence-text {
        color: #959595;
        font-size: 26rpx;
      }
    }
  }

  .baike-info {
    padding-bottom: 30rpx;
    border-bottom: 2rpx solid #f6f6f6;

    .baike-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      height: 80rpx;

      .baike-title {
        font-size: 28rpx;
        color: #222222;
      }

      .baike-detail-btn {
        background-color: #f6f6f6;
        color: #959595;
        border: none;
        border-radius: 10rpx;
        padding: 10rpx 20rpx;
        font-size: 26rpx;
        display: flex;
        align-items: center;
        gap: 8rpx;

        .iconfont {
          font-size: 24rpx;
        }
      }
    }

    .baike-content {
      .baike-description {
        font-size: 28rpx;
        line-height: 1.6;
        color: #959595;
        padding-bottom: 20rpx;
      }
    }
  }

  .action-buttons {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100rpx;
    padding-top: 20rpx;

    button {
      flex: 1;
      height: 70rpx;
      border-radius: 70rpx;
      font-size: 28rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10rpx;
      margin: 0 10rpx;

      .iconfont {
        font-size: 28rpx;
      }

      &.primary-btn {
        background: linear-gradient(to right, #f37b1d, #e54d42);
        color: #FFFFFF;
        border: none;
        box-shadow: 0 10rpx 10rpx rgba(243, 123, 29, 0.3);
      }

      &.secondary-btn {
        background: linear-gradient(to right, #f37b1d, #e54d42);
        color: #FFFFFF;
        border: none;
        box-shadow: 0 10rpx 10rpx rgba(243, 123, 29, 0.3);
      }
    }
  }
}


.retry-section {
  position: fixed;
  left: 0;
  bottom: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100rpx;

  .retry-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 90%;
    height: 70rpx;
    background: linear-gradient(to right, #f37b1d, #e54d42);
    box-shadow: 0 10rpx 10rpx rgba(243, 123, 29, 0.3);
    border-radius: 70rpx;
    border: none;
    font-size: 28rpx;
    color: #FFFFFF;
    gap: 10rpx;

    .iconfont {
      font-size: 28rpx;
    }
  }
}

.loading-state, .error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400rpx;
  padding: 60rpx 4%;

  .loading-content, .error-content {
    text-align: center;

    .loading-spinner {
      width: 60rpx;
      height: 60rpx;
      border: 4rpx solid #f6f6f6;
      border-top: 4rpx solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 30rpx;
    }

    .loading-text, .error-text {
      font-size: 28rpx;
      color: #959595;
      margin-bottom: 30rpx;
    }

    .error-icon {
      font-size: 80rpx;
      margin-bottom: 20rpx;
      display: block;
    }

    .retry-btn {
      background: linear-gradient(to right, #667eea, #764ba2);
      color: #FFFFFF;
      padding: 20rpx 40rpx;
      border-radius: 70rpx;
      font-size: 28rpx;
      border: none;
      box-shadow: 0 10rpx 10rpx rgba(102, 126, 234, 0.3);
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// 物品详细讲解样式
.item-description {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 0 4%;
  margin-bottom: 20rpx;
  box-shadow: 0 0 10rpx #F1F1F1;

  .section-header {
    display: flex;
    align-items: center;
    width: 100%;
    height: 80rpx;

    .section-title {
      font-size: 28rpx;
      color: #222222;
    }
  }

  .description-content {
    .description-text {
      font-size: 28rpx;
      line-height: 1.6;
      color: #959595;
      padding-bottom: 30rpx;
      text-align: justify;
    }
  }
}

// 物品特征信息样式
.item-features {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 0 4%;
  margin-bottom: 20rpx;
  box-shadow: 0 0 10rpx #F1F1F1;

  .section-header {
    display: flex;
    align-items: center;
    width: 100%;
    height: 80rpx;

    .section-title {
      font-size: 28rpx;
      color: #222222;
    }
  }

  .features-list {
    .feature-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      height: 80rpx;
      border-bottom: 2rpx solid #f6f6f6;

      &:last-child {
        border-bottom: none;
      }

      .feature-label {
        font-size: 28rpx;
        color: #222222;
      }

      .feature-value {
        font-size: 28rpx;
        color: #959595;
      }
    }
  }
}
</style>
