<template>
  <view class="face-recognition-modal" v-if="visible" @touchmove.stop.prevent>
    <view class="modal-content" @click.stop>
      <!-- 顶部标题栏 -->
      <view class="modal-header">
        <text class="modal-title">人脸识别</text>
        <text class="close-btn" @click="closeModal">✕</text>
      </view>
      
      <!-- 人脸识别主体区域 -->
      <view class="face-area">
        <!-- 相机预览区域 -->
        <view class="camera-container">
          <camera 
            v-if="showCamera"
            class="camera"
            :device-position="'front'"
            :flash="'off'"
            @initdone="cameraInitDone"
            @error="cameraError"
          >
            <!-- 人脸识别框 -->
            <cover-view class="face-frame">
              <cover-view class="frame-corner top-left"></cover-view>
              <cover-view class="frame-corner top-right"></cover-view>
              <cover-view class="frame-corner bottom-left"></cover-view>
              <cover-view class="frame-corner bottom-right"></cover-view>
            </cover-view>
            
            <!-- 扫描动画 -->
            <cover-view class="scan-line" v-if="isScanning"></cover-view>
          </camera>
          
          <!-- 人脸识别状态图片 -->
          <view v-if="!showCamera" class="face-placeholder">
            <image 
              :src="statusImage" 
              class="status-image"
              mode="aspectFit"
            ></image>
          </view>
        </view>
        
        <!-- 状态文字 -->
        <view class="status-text">
          <text class="status-title">{{ statusTitle }}</text>
          <text class="status-desc">{{ statusDesc }}</text>
        </view>
        
        <!-- 进度条 -->
        <view class="progress-container" v-if="showProgress">
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: progress + '%' }"></view>
          </view>
          <text class="progress-text">{{ progress }}%</text>
        </view>
      </view>
      
      <!-- 操作按钮区域 -->
      <view class="action-buttons">
        <button 
          class="action-btn capture-btn" 
          @click="capturePhoto"
          :disabled="!canCapture"
          v-if="mode === 'capture'"
        >
          {{ isProcessing ? '识别中...' : '拍照识别' }}
        </button>
        
        <button 
          class="action-btn retry-btn" 
          @click="retryCapture"
          v-if="mode === 'retry'"
        >
          重新拍照
        </button>
        
        <button 
          class="action-btn cancel-btn" 
          @click="closeModal"
        >
          取消
        </button>
      </view>
      
      <!-- 提示信息 -->
      <view class="tips">
        <text class="tip-text">请将面部置于识别框内，保持光线充足</text>
      </view>
    </view>
    
    <!-- 背景遮罩 -->
    <view class="modal-overlay" @click="closeModal"></view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  name: 'FaceRecognition',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'login', // login: 登录, register: 注册
      validator: value => ['login', 'register'].includes(value)
    },
    userId: {
      type: String,
      default: ''
    }
  },
  
  data() {
    return {
      // 相机状态
      showCamera: false,
      cameraReady: false,
      
      // 识别状态
      isScanning: false,
      isProcessing: false,
      canCapture: false,
      
      // 模式：capture(拍照), processing(处理中), retry(重试)
      mode: 'capture',
      
      // 进度相关
      showProgress: false,
      progress: 0,
      
      // 状态信息
      statusTitle: '请将面部置于识别框内',
      statusDesc: '保持面部正对屏幕，确保光线充足',
      statusImage: '/static/img/face_scan.png'
    }
  },
  
  watch: {
    visible(newVal) {
      if (newVal) {
        this.initFaceRecognition()
      } else {
        this.resetComponent()
      }
    }
  },
  
  methods: {
    /**
     * 初始化人脸识别
     */
    async initFaceRecognition() {
      try {
        this.statusTitle = '正在启动相机...'
        this.statusDesc = '请授权相机权限'
        
        // 检查相机权限
        const hasPermission = await this.checkCameraPermission()
        if (!hasPermission) {
          this.statusTitle = '需要相机权限'
          this.statusDesc = '请在设置中开启相机权限'
          return
        }
        
        // 启动相机
        this.showCamera = true
        this.mode = 'capture'
        
      } catch (error) {
        console.error('初始化人脸识别失败:', error)
        this.statusTitle = '启动失败'
        this.statusDesc = '请重试或检查设备兼容性'
      }
    },
    
    /**
     * 检查相机权限
     */
    async checkCameraPermission() {
      return new Promise((resolve) => {
        uni.getSetting({
          success: (res) => {
            if (res.authSetting['scope.camera'] === undefined) {
              // 首次申请权限
              uni.authorize({
                scope: 'scope.camera',
                success: () => resolve(true),
                fail: () => resolve(false)
              })
            } else if (res.authSetting['scope.camera'] === false) {
              // 权限被拒绝，引导用户去设置
              uni.showModal({
                title: '需要相机权限',
                content: '人脸识别需要使用相机，请在设置中开启相机权限',
                showCancel: false,
                confirmText: '去设置',
                success: () => {
                  uni.openSetting()
                }
              })
              resolve(false)
            } else {
              resolve(true)
            }
          },
          fail: () => resolve(false)
        })
      })
    },
    
    /**
     * 相机初始化完成
     */
    cameraInitDone() {
      console.log('相机初始化完成')
      this.cameraReady = true
      this.canCapture = true
      this.statusTitle = '请将面部置于识别框内'
      this.statusDesc = '点击拍照识别按钮开始识别'
      
      // 开始扫描动画
      this.startScanAnimation()
    },
    
    /**
     * 相机错误
     */
    cameraError(error) {
      console.error('相机错误:', error)
      this.statusTitle = '相机启动失败'
      this.statusDesc = '请检查设备或重新授权相机权限'
      this.showCamera = false
    },
    
    /**
     * 开始扫描动画
     */
    startScanAnimation() {
      this.isScanning = true
      
      // 可以添加周期性的扫描效果
      setInterval(() => {
        if (this.isScanning && this.visible) {
          // 扫描线动画效果
        }
      }, 2000)
    },
    
    /**
     * 拍照识别
     */
    async capturePhoto() {
      if (!this.canCapture || this.isProcessing) return
      
      try {
        this.isProcessing = true
        this.mode = 'processing'
        this.statusTitle = '拍照中...'
        this.statusDesc = '请保持不动'
        
        // 创建相机上下文
        const cameraContext = uni.createCameraContext()
        
        // 拍照
        cameraContext.takePhoto({
          quality: 'high',
          success: (res) => {
            console.log('拍照成功:', res.tempImagePath)
            this.processFaceImage(res.tempImagePath)
          },
          fail: (error) => {
            console.error('拍照失败:', error)
            this.handleError('拍照失败，请重试')
          }
        })
        
      } catch (error) {
        console.error('拍照过程出错:', error)
        this.handleError('拍照过程出错')
      }
    },
    
    /**
     * 处理人脸图片
     */
    async processFaceImage(imagePath) {
      try {
        this.showProgress = true
        this.progress = 0
        this.statusTitle = '正在识别...'
        this.statusDesc = '请稍候，正在分析人脸特征'
        
        // 模拟进度
        this.simulateProgress()
        
        // 准备上传数据
        const uploadData = {
          name: 'faceImage',
          filePath: imagePath,
          header: {
            'Content-Type': 'multipart/form-data'
          }
        }
        
        let uploadUrl = ''
        let formData = {}
        
        if (this.type === 'login') {
          // 人脸登录
          uploadUrl = `${api.baseURL}/auth/face-login`
          formData = {
            userId: this.userId
          }
        } else {
          // 人脸注册
          uploadUrl = `${api.baseURL}/auth/register-face`
          const token = uni.getStorageSync('token')
          uploadData.header['Authorization'] = `Bearer ${token}`
        }
        
        // 上传并识别
        uni.uploadFile({
          url: uploadUrl,
          ...uploadData,
          formData: formData,
          success: (res) => {
            this.handleRecognitionResult(res)
          },
          fail: (error) => {
            console.error('上传失败:', error)
            this.handleError('识别失败，网络错误')
          }
        })
        
      } catch (error) {
        console.error('处理人脸图片失败:', error)
        this.handleError('处理失败，请重试')
      }
    },
    
    /**
     * 处理识别结果
     */
    handleRecognitionResult(res) {
      try {
        const data = JSON.parse(res.data)
        
        if (data.success) {
          this.progress = 100
          this.statusTitle = '识别成功！'
          this.statusDesc = this.type === 'login' ? '正在为您登录...' : '人脸注册成功'
          
          // 延迟关闭并触发成功回调
          setTimeout(() => {
            this.showProgress = false
            this.$emit('success', data.data)
            this.closeModal()
          }, 1500)
          
        } else {
          this.handleError(data.error?.message || '识别失败')
        }
        
      } catch (error) {
        console.error('解析识别结果失败:', error)
        this.handleError('识别结果解析失败')
      }
    },
    
    /**
     * 处理错误
     */
    handleError(message) {
      this.isProcessing = false
      this.mode = 'retry'
      this.showProgress = false
      this.statusTitle = '识别失败'
      this.statusDesc = message
      
      uni.showToast({
        title: message,
        icon: 'none',
        duration: 2000
      })
    },
    
    /**
     * 重新拍照
     */
    retryCapture() {
      this.mode = 'capture'
      this.isProcessing = false
      this.canCapture = true
      this.progress = 0
      this.showProgress = false
      this.statusTitle = '请将面部置于识别框内'
      this.statusDesc = '点击拍照识别按钮开始识别'
    },
    
    /**
     * 模拟进度条
     */
    simulateProgress() {
      const timer = setInterval(() => {
        if (this.progress < 90) {
          this.progress += Math.random() * 20
          if (this.progress > 90) this.progress = 90
        } else {
          clearInterval(timer)
        }
      }, 300)
    },
    
    /**
     * 关闭模态框
     */
    closeModal() {
      this.$emit('close')
      this.resetComponent()
    },
    
    /**
     * 重置组件状态
     */
    resetComponent() {
      this.showCamera = false
      this.cameraReady = false
      this.isScanning = false
      this.isProcessing = false
      this.canCapture = false
      this.mode = 'capture'
      this.showProgress = false
      this.progress = 0
      this.statusTitle = '请将面部置于识别框内'
      this.statusDesc = '保持面部正对屏幕，确保光线充足'
    }
  }
}
</script>

<style scoped lang="scss">
.face-recognition-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 400px;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  z-index: 10000;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  
  .modal-title {
    font-size: 18px;
    font-weight: 600;
  }
  
  .close-btn {
    font-size: 24px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
  }
}

.face-area {
  padding: 24px;
}

.camera-container {
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: 16px;
  overflow: hidden;
  background: #f0f0f0;
  margin-bottom: 20px;
}

.camera {
  width: 100%;
  height: 100%;
}

.face-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(45deg, #f0f2f5, #e4e6ea);
  
  .status-image {
    width: 120px;
    height: 120px;
    opacity: 0.6;
  }
}

.face-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 240px;
  
  .frame-corner {
    position: absolute;
    width: 30px;
    height: 30px;
    border: 3px solid #667eea;
    
    &.top-left {
      top: 0;
      left: 0;
      border-right: none;
      border-bottom: none;
    }
    
    &.top-right {
      top: 0;
      right: 0;
      border-left: none;
      border-bottom: none;
    }
    
    &.bottom-left {
      bottom: 0;
      left: 0;
      border-right: none;
      border-top: none;
    }
    
    &.bottom-right {
      bottom: 0;
      right: 0;
      border-left: none;
      border-top: none;
    }
  }
}

.scan-line {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 180px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #667eea, transparent);
  animation: scanning 2s ease-in-out infinite;
}

@keyframes scanning {
  0% { transform: translate(-50%, -120px); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translate(-50%, 120px); opacity: 0; }
}

.status-text {
  text-align: center;
  margin-bottom: 20px;
  
  .status-title {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }
  
  .status-desc {
    display: block;
    font-size: 14px;
    color: #666;
    line-height: 1.4;
  }
}

.progress-container {
  margin-bottom: 20px;
  
  .progress-bar {
    width: 100%;
    height: 6px;
    background: #e4e6ea;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 8px;
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 3px;
      transition: width 0.3s ease;
    }
  }
  
  .progress-text {
    display: block;
    text-align: center;
    font-size: 12px;
    color: #666;
  }
}

.action-buttons {
  padding: 0 24px 24px;
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  height: 44px;
  border-radius: 22px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  
  &.capture-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:disabled {
      background: #ccc;
      color: #999;
    }
  }
  
  &.retry-btn {
    background: linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%);
    color: white;
  }
  
  &.cancel-btn {
    background: #f0f2f5;
    color: #666;
  }
}

.tips {
  padding: 0 24px 24px;
  text-align: center;
  
  .tip-text {
    font-size: 12px;
    color: #999;
    line-height: 1.4;
  }
}
</style>
