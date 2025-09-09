<template>
  <div class="face-recognition">
    <!-- 摄像头预览区域 -->
    <div class="camera-container" v-if="showCamera">
      <video 
        ref="videoRef" 
        class="camera-video"
        :class="{ 'recording': isRecording }"
        autoplay 
        muted 
        playsinline
      ></video>
      <canvas ref="canvasRef" class="capture-canvas" style="display: none;"></canvas>
      
      <!-- 人脸检测框 -->
      <div 
        v-if="faceDetected" 
        class="face-frame"
        :style="faceFrameStyle"
      ></div>
      
      <!-- 拍照按钮和状态 -->
      <div class="camera-controls">
        <div class="status-text" :class="statusClass">
          {{ statusText }}
        </div>
        <div class="control-buttons">
          <button 
            class="capture-btn"
            :class="{ 'disabled': !faceDetected || isProcessing }"
            @click="capturePhoto"
            :disabled="!faceDetected || isProcessing"
          >
            {{ isProcessing ? '处理中...' : (mode === 'register' ? '注册人脸' : '人脸登录') }}
          </button>
          <button class="cancel-btn" @click="closeCamera">
            取消
          </button>
        </div>
      </div>
    </div>
    
    <!-- 结果显示区域 -->
    <div class="result-container" v-if="showResult && !showCamera">
      <div class="result-content" :class="resultType">
        <div class="result-icon">
          <i :class="resultIcon"></i>
        </div>
        <h3>{{ resultTitle }}</h3>
        <p>{{ resultMessage }}</p>
        <div class="result-actions">
          <button 
            v-if="resultType === 'success'" 
            class="primary-btn"
            @click="handleSuccess"
          >
            确定
          </button>
          <button 
            v-if="resultType === 'error' && mode === 'login'" 
            class="secondary-btn"
            @click="switchToRegister"
          >
            注册人脸
          </button>
          <button 
            class="secondary-btn"
            @click="retry"
          >
            重试
          </button>
        </div>
      </div>
    </div>
    
    <!-- 加载遮罩 -->
    <div class="loading-overlay" v-if="isProcessing">
      <div class="loading-spinner"></div>
      <p>{{ loadingText }}</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'FaceRecognition',
  props: {
    mode: {
      type: String,
      default: 'login', // 'login' 或 'register'
      validator: value => ['login', 'register'].includes(value)
    },
    apiBaseUrl: {
      type: String,
      default: '/api'
    }
  },
  data() {
    return {
      // 摄像头相关
      videoStream: null,
      showCamera: false,
      isRecording: false,
      
      // 人脸检测相关
      faceDetected: false,
      faceFrameStyle: {},
      detectionTimer: null,
      
      // 处理状态
      isProcessing: false,
      loadingText: '正在处理...',
      
      // 结果显示
      showResult: false,
      resultType: 'success', // 'success', 'error', 'warning'
      resultTitle: '',
      resultMessage: '',
      resultIcon: '',
      
      // 状态文本
      statusText: '请将脸部对准摄像头',
      statusClass: 'info'
    }
  },
  computed: {
    resultIcon() {
      switch(this.resultType) {
        case 'success': return 'fas fa-check-circle'
        case 'error': return 'fas fa-times-circle'
        case 'warning': return 'fas fa-exclamation-triangle'
        default: return 'fas fa-info-circle'
      }
    }
  },
  mounted() {
    this.initCamera()
  },
  beforeDestroy() {
    this.cleanup()
  },
  methods: {
    // 初始化摄像头
    async initCamera() {
      try {
        this.showCamera = true
        this.isRecording = true
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user' // 前置摄像头
          } 
        })
        
        this.videoStream = stream
        this.$refs.videoRef.srcObject = stream
        
        // 开始人脸检测
        this.startFaceDetection()
        
      } catch (error) {
        console.error('摄像头初始化失败:', error)
        this.showError('摄像头访问失败', '请确保已允许摄像头权限')
      }
    },
    
    // 开始人脸检测
    startFaceDetection() {
      this.detectionTimer = setInterval(() => {
        this.detectFace()
      }, 500)
    },
    
    // 人脸检测（这里是模拟，实际项目中可以使用Face++或其他人脸检测库）
    detectFace() {
      if (!this.$refs.videoRef || this.isProcessing) return
      
      // 模拟人脸检测结果
      const mockDetection = Math.random() > 0.3 // 70% 概率检测到人脸
      
      if (mockDetection) {
        this.faceDetected = true
        this.statusText = '检测到人脸，请点击按钮继续'
        this.statusClass = 'success'
        
        // 模拟人脸框位置（实际应该从检测结果获取）
        this.faceFrameStyle = {
          left: '25%',
          top: '20%',
          width: '50%',
          height: '60%'
        }
      } else {
        this.faceDetected = false
        this.statusText = '请将脸部对准摄像头'
        this.statusClass = 'info'
        this.faceFrameStyle = {}
      }
    },
    
    // 拍照并处理
    async capturePhoto() {
      if (!this.faceDetected || this.isProcessing) return
      
      this.isProcessing = true
      this.loadingText = this.mode === 'register' ? '正在注册人脸...' : '正在验证人脸...'
      
      try {
        // 停止人脸检测
        if (this.detectionTimer) {
          clearInterval(this.detectionTimer)
          this.detectionTimer = null
        }
        
        // 从视频捕获图像
        const canvas = this.$refs.canvasRef
        const video = this.$refs.videoRef
        const ctx = canvas.getContext('2d')
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        
        // 转换为blob
        const imageBlob = await new Promise(resolve => {
          canvas.toBlob(resolve, 'image/jpeg', 0.8)
        })
        
        // 创建FormData
        const formData = new FormData()
        formData.append('image', imageBlob, 'face.jpg')
        
        let result
        if (this.mode === 'register') {
          result = await this.registerFace(formData)
        } else {
          result = await this.loginWithFace(formData)
        }
        
        this.handleResult(result)
        
      } catch (error) {
        console.error('人脸处理失败:', error)
        this.showError('处理失败', error.message || '请重试')
      } finally {
        this.isProcessing = false
      }
    },
    
    // 注册人脸
    async registerFace(formData) {
      const response = await axios.post(`${this.apiBaseUrl}/auth/face/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${this.$store.getters.token || localStorage.getItem('token')}`
        }
      })
      return response.data
    },
    
    // 人脸登录
    async loginWithFace(formData) {
      const response = await axios.post(`${this.apiBaseUrl}/auth/face/login`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    },
    
    // 处理结果
    handleResult(result) {
      this.showCamera = false
      this.showResult = true
      
      if (result.success) {
        this.resultType = 'success'
        this.resultTitle = this.mode === 'register' ? '人脸注册成功' : '登录成功'
        this.resultMessage = result.message || '操作完成'
        
        // 如果是登录成功，保存用户信息和token
        if (this.mode === 'login' && result.data) {
          this.saveLoginData(result.data)
        }
      } else {
        this.resultType = 'error'
        this.resultTitle = this.mode === 'register' ? '人脸注册失败' : '登录失败'
        this.resultMessage = result.error?.message || '操作失败，请重试'
      }
    },
    
    // 保存登录数据
    saveLoginData(data) {
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      if (data.user && this.$store) {
        this.$store.dispatch('setUser', data.user)
      }
    },
    
    // 显示错误
    showError(title, message) {
      this.showCamera = false
      this.showResult = true
      this.resultType = 'error'
      this.resultTitle = title
      this.resultMessage = message
    },
    
    // 关闭摄像头
    closeCamera() {
      this.cleanup()
      this.$emit('close')
    },
    
    // 成功后的处理
    handleSuccess() {
      if (this.mode === 'login') {
        // 登录成功，跳转到主页或返回上一页
        this.$router.push('/')
      } else {
        // 注册成功，可以继续其他操作或关闭
        this.$emit('register-success')
      }
      this.closeCamera()
    },
    
    // 切换到注册模式
    switchToRegister() {
      this.$emit('switch-mode', 'register')
      this.showResult = false
      this.initCamera()
    },
    
    // 重试
    retry() {
      this.showResult = false
      this.initCamera()
    },
    
    // 清理资源
    cleanup() {
      if (this.detectionTimer) {
        clearInterval(this.detectionTimer)
        this.detectionTimer = null
      }
      
      if (this.videoStream) {
        this.videoStream.getTracks().forEach(track => track.stop())
        this.videoStream = null
      }
      
      this.showCamera = false
      this.isRecording = false
      this.faceDetected = false
    }
  }
}
</script>

<style scoped>
.face-recognition {
  width: 100%;
  height: 100vh;
  background: #000;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-container {
  position: relative;
  width: 100%;
  max-width: 640px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.camera-video {
  width: 100%;
  flex: 1;
  object-fit: cover;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.camera-video.recording {
  border: 2px solid #00ff00;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
}

.face-frame {
  position: absolute;
  border: 3px solid #00ff00;
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.camera-controls {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  padding: 0 20px;
}

.status-text {
  text-align: center;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 500;
  padding: 12px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.status-text.info {
  background: rgba(59, 130, 246, 0.8);
  color: white;
}

.status-text.success {
  background: rgba(16, 185, 129, 0.8);
  color: white;
}

.status-text.error {
  background: rgba(239, 68, 68, 0.8);
  color: white;
}

.control-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.capture-btn, .cancel-btn {
  padding: 14px 24px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.capture-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex: 1;
  max-width: 200px;
}

.capture-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.capture-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.result-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.result-content {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 400px;
  margin: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.result-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.result-content.success .result-icon {
  color: #10b981;
}

.result-content.error .result-icon {
  color: #ef4444;
}

.result-content.warning .result-icon {
  color: #f59e0b;
}

.result-content h3 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #1f2937;
}

.result-content p {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 30px;
  line-height: 1.5;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.primary-btn, .secondary-btn {
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.secondary-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.secondary-btn:hover {
  background: #e5e7eb;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 10;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay p {
  font-size: 16px;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .camera-controls {
    bottom: 60px;
  }
  
  .result-content {
    margin: 10px;
    padding: 30px 20px;
  }
  
  .result-actions {
    flex-direction: column;
  }
}
</style>


