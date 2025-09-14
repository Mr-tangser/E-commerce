<template>
  <view class="history-page">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-left" @click="goBack">
        <text class="back-text">←</text>
      </view>
      <view class="nav-title">识别历史</view>
    </view>

    <!-- 历史记录列表 -->
    <scroll-view scroll-y class="history-list">
      <view v-if="historyList.length > 0">
        <view 
          v-for="item in historyList" 
          :key="item.id"
          class="history-item"
          @click="viewDetail(item)"
        >
          <view class="item-left">
            <image 
              v-if="item.imageUrl" 
              :src="item.imageUrl" 
              class="item-image"
              mode="aspectFill"
            ></image>
            <view v-else class="item-image placeholder"></view>
          </view>
          
          <view class="item-content">
            <view class="item-result">{{ item.topResult || '识别结果' }}</view>
            <view class="item-type">{{ getTypeText(item.recognitionType) }}</view>
            <view class="item-time">{{ formatTime(item.createdAt) }}</view>
          </view>
          
          <view class="item-right">
            <view class="confidence">{{ Math.round(item.confidence || 0) }}%</view>
            <text class="arrow">></text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-else>
        <view class="empty-text">还没有识别记录</view>
        <button class="goto-home-btn" @click="gotoHome">去首页识别</button>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  data() {
    return {
      historyList: [],
      loading: false
    }
  },
  
  onLoad() {
    this.loadHistory()
  },
  
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack()
    },
    
    // 加载历史记录
    async loadHistory() {
      try {
        this.loading = true
        const token = uni.getStorageSync('token')
        
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          })
          return
        }
        
        const result = await api.recognition.getHistory(token)
        
        if (result.success) {
          this.historyList = result.data || []
        } else {
          uni.showToast({
            title: result.message || '加载失败',
            icon: 'none'
          })
        }
        
      } catch (error) {
        console.error('加载历史记录失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 查看详情
    viewDetail(item) {
      uni.navigateTo({
        url: `/pages/recognition/result?id=${item.id}`
      })
    },
    
    // 去首页
    gotoHome() {
      uni.switchTab({
        url: '/pages/home/home'
      })
    },
    
    // 获取类型文本
    getTypeText(type) {
      const typeMap = {
        'multi-object': '看图识万物',
        'general': '通用识别',
        'url': 'URL识别'
      }
      return typeMap[type] || '未知类型'
    },
    
    // 格式化时间
    formatTime(timeStr) {
      try {
        const time = new Date(timeStr)
        const now = new Date()
        const diff = now.getTime() - time.getTime()
        
        if (diff < 60000) { // 1分钟内
          return '刚刚'
        } else if (diff < 3600000) { // 1小时内
          return `${Math.floor(diff / 60000)}分钟前`
        } else if (diff < 86400000) { // 1天内
          return `${Math.floor(diff / 3600000)}小时前`
        } else {
          return `${time.getMonth() + 1}-${time.getDate()}`
        }
      } catch (error) {
        return '未知时间'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.history-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.nav-left {
  width: 60px;
}

.back-text {
  font-size: 18px;
  font-weight: bold;
}

.nav-title {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  flex: 1;
}

.history-list {
  height: calc(100vh - 44px);
  padding: 10px;
}

.history-item {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.item-left {
  margin-right: 15px;
}

.item-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
}

.placeholder {
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-content {
  flex: 1;
}

.item-result {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.item-type {
  font-size: 14px;
  color: #666;
  margin-bottom: 3px;
}

.item-time {
  font-size: 12px;
  color: #999;
}

.item-right {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.confidence {
  font-size: 14px;
  color: #667eea;
  margin-bottom: 5px;
}

.arrow {
  font-size: 16px;
  color: #ccc;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  text-align: center;
}

.empty-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
}

.goto-home-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 12px 30px;
  font-size: 16px;
}
</style>
