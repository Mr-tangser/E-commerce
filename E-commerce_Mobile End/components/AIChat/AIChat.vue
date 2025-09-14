<template>
  <view class="ai-chat-container" :class="{ 'full-screen-mode': fullScreen }">
    
    <!-- 聊天触发按钮 - 非全屏模式才显示 -->
    <view class="chat-trigger" @click="toggleChat" v-if="!showChat && !fullScreen">
      <text class="chat-icon">💬</text>
      <text class="chat-text">AI客服</text>
      <view class="notification-dot" v-if="hasNewMessage"></view>
    </view>

    <!-- 聊天窗口 -->
    <view class="chat-window" v-show="showChat" :class="{ 'full-screen': fullScreen }">

      <!-- 聊天消息区域 -->
      <scroll-view 
        class="chat-messages" 
        scroll-y 
        :scroll-top="scrollTop"
        scroll-with-animation
        @scroll="onScroll"
      >
        <view class="message-list">
          
          <!-- 聊天消息 -->
          <view 
            class="message-item" 
            :class="{ 'user-message': msg.role === 'user', 'bot-message': msg.role === 'bot' }"
            v-for="(msg, index) in messages" 
            :key="index"
          >
            <image 
              v-if="msg.role === 'bot'" 
              class="message-avatar" 
              src="/static/img/ai-avatar.png" 
              mode="aspectFill"
            ></image>
            
            <view class="message-content">
              <view 
                class="message-bubble" 
                :class="{ 'user-bubble': msg.role === 'user', 'bot-bubble': msg.role === 'bot' }"
              >
                <text class="message-text">{{ msg.content }}</text>
                <view class="confidence-indicator" v-if="msg.role === 'bot' && msg.confidence">
                  <text class="confidence-text">置信度: {{ (msg.confidence * 100).toFixed(0) }}%</text>
                </view>
              </view>
              <view class="message-time">
                <text>{{ formatTime(msg.timestamp) }}</text>
                <text v-if="msg.fallback" class="fallback-indicator">备用回复</text>
              </view>
            </view>

            <image 
              v-if="msg.role === 'user'" 
              class="message-avatar user-avatar" 
              :src="userAvatar" 
              mode="aspectFill"
            ></image>
          </view>

          <!-- 输入中指示器 -->
          <view class="message-item bot-message" v-if="isTyping">
            <image class="message-avatar" src="/static/img/ai-avatar.png" mode="aspectFill"></image>
            <view class="message-content">
              <view class="message-bubble bot-bubble typing-bubble">
                <view class="typing-dots">
                  <view class="dot"></view>
                  <view class="dot"></view>
                  <view class="dot"></view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 快捷回复按钮 -->
      <view class="quick-replies" v-if="showQuickReplies && quickReplies.length > 0">
        <scroll-view class="quick-scroll" scroll-x>
          <view 
            class="quick-reply-btn" 
            v-for="(reply, index) in quickReplies" 
            :key="index"
            @click="sendQuickReply(reply)"
          >
            <text>{{ reply }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 输入区域 -->
      <view class="chat-input-area">
        <view class="input-container">
          <textarea 
            class="chat-input"
            v-model="inputMessage"
            placeholder="请输入您的问题..."
            :maxlength="500"
            :auto-height="true"
            :show-confirm-bar="false"
            @focus="onInputFocus"
            @blur="onInputBlur"
            @confirm="sendMessage"
          ></textarea>
          <view class="input-actions">
            <view class="char-count">{{ inputMessage.length }}/500</view>
            <view 
              class="send-btn" 
              :class="{ disabled: !canSend }"
              @click="sendMessage"
            >
              <text class="send-icon">📤</text>
            </view>
          </view>
        </view>
        
      </view>
    </view>

    <!-- 加载遮罩 -->
    <view class="loading-overlay" v-if="isInitializing">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text>AI客服初始化中...</text>
      </view>
    </view>
  </view>
</template>

<script>
import ENV_CONFIG from '../../config/env.js';

export default {
  name: 'AIChat',
  props: {
    // 用户信息
    userInfo: {
      type: Object,
      default: () => ({})
    },
    // 是否自动打开
    autoOpen: {
      type: Boolean,
      default: false
    },
    // 是否全屏模式
    fullScreen: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showChat: false,
      isConnected: false,
      isInitializing: false,
      isTyping: false,
      hasNewMessage: false,
      
      sessionId: null,
      messages: [],
      inputMessage: '',
      scrollTop: 0,
      
      // 滚动相关
      scrollViewHeight: 0,
      contentHeight: 0,
      isUserScrolling: false,
      lastScrollTime: 0,
      
      // 快捷回复
      showQuickReplies: true,
      quickReplies: [
        '查询订单状态',
        '退换货政策', 
        '物流配送',
        '支付问题',
        '100+200',
        '现在几点',
        '今天几号',
        '联系人工客服'
      ],
      
      // 用户头像
      userAvatar: '/static/img/default_avatar.png'
    };
  },
  computed: {
    canSend() {
      return this.inputMessage.trim().length > 0 && this.isConnected && !this.isTyping;
    }
  },
  async mounted() {
    // 从用户信息设置头像
    if (this.userInfo.avatar) {
      this.userAvatar = this.userInfo.avatar;
    }
    
    // 全屏模式下立即显示聊天并初始化
    if (this.fullScreen) {
      this.showChat = true;
      
      // 确保DOM更新后再初始化
      await this.$nextTick();
      await this.initializeChat();
    } else if (this.autoOpen) {
      await this.toggleChat();
    } else {
      // 即使不自动打开，也可以静默检查连接状态
      this.silentConnectionCheck();
    }
  },
  
  beforeDestroy() {
    // 清理定时器
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
  },
  methods: {
    /**
     * 切换聊天窗口显示
     */
    async toggleChat() {
      if (!this.showChat) {
        this.showChat = true;
        this.hasNewMessage = false;
        
        if (!this.sessionId) {
          await this.initializeChat();
        }
      } else {
        this.showChat = false;
      }
    },


    /**
     * 静默连接检查（不显示任何UI）
     */
    async silentConnectionCheck() {
      try {
        
        // 只检查健康状态，不创建会话
        const response = await uni.request({
          url: `${ENV_CONFIG.AI_SERVICE_URL}/api/chat/health`,
          method: 'GET',
          timeout: 3000
        });
        
        if (response[1].statusCode === 200) {
          // 不立即连接，只是确认服务可用性
          // 真正的连接会在用户开始聊天时进行
          this.$emit('connection-change', true);
          this.$emit('chat-ready');
        } else {
          this.$emit('connection-change', false);
        }
        
      } catch (error) {
        this.$emit('connection-change', false);
      }
    },

    /**
     * 初始化聊天会话
     */
    async initializeChat(retryCount = 0) {
      const maxRetries = 3;
      
      try {
        this.isInitializing = true;
        
        const response = await uni.request({
          url: `${ENV_CONFIG.AI_SERVICE_URL}/api/chat/session`,
          method: 'POST',
          data: {
            userInfo: this.userInfo
          },
          timeout: 8000
        });

        if (response[1].data.sessionId) {
          this.sessionId = response[1].data.sessionId;
          this.isConnected = true;
          
          // 显示成功提示（仅在重试后）
          if (retryCount > 0) {
            uni.showToast({
              title: '连接成功！',
              icon: 'success',
              duration: 1500
            });
          }
          
          // 触发连接状态变化事件
          this.$emit('connection-change', true);
          this.$emit('chat-ready');
          
          // AI主动发送欢迎消息 - 确保在下一个tick和适当延迟后执行
          this.$nextTick(() => {
            setTimeout(() => {
              this.sendWelcomeMessage();
            }, 1000);
          });
        } else {
          throw new Error('获取会话ID失败');
        }

      } catch (error) {
        console.error(`❌ AI聊天初始化失败 (尝试 ${retryCount + 1}/${maxRetries + 1}):`, error);
        
        // 如果还有重试机会且不是手动调用，则自动重试
        if (retryCount < maxRetries) {
          const delaySeconds = 2 + retryCount;
          
          // 只在第二次重试时才显示loading提示，第一次失败静默重试
          if (retryCount === 1) {
            uni.showToast({
              title: `正在重试连接...`,
              icon: 'loading',
              duration: 2000
            });
          }
          
          this.isInitializing = false;
          
          setTimeout(() => {
            this.initializeChat(retryCount + 1);
          }, delaySeconds * 1000); // 递增延迟: 2s, 3s, 4s
          
          return; // 不触发失败事件，等待重试结果
        }
        
        // 所有重试都失败了
        this.isConnected = false;
        this.$emit('connection-change', false);
        
        // 延迟显示错误提示，提供明确的解决方案
        setTimeout(() => {
          if (!this.isConnected) {
            // 不弹出错误提示，让父组件处理状态显示
            // 用户可以通过页面状态看到离线状态，系统会自动重新检查连接
          }
        }, 1000);
      } finally {
        this.isInitializing = false;
      }
    },

    /**
     * 发送消息
     */
    async sendMessage() {
      if (!this.inputMessage.trim()) return;

      const message = this.inputMessage.trim();
      this.inputMessage = '';

      // 添加用户消息到界面
      this.addMessage('user', message);

      // 智能连接检查：如果没有会话ID，先尝试建立连接
      if (!this.sessionId && !this.isInitializing) {
        try {
          await this.initializeChat();
          if (!this.sessionId) {
            throw new Error('无法建立连接');
          }
        } catch (error) {
          console.error('❌ 自动连接失败:', error);
          this.addMessage('bot', '抱歉，无法连接到AI服务，请稍后重试，或联系人工客服：400-123-4567', {
            confidence: 0.1,
            fallback: true
          });
          return;
        }
      }

      // 检查连接状态
      if (!this.sessionId) {
        this.addMessage('bot', '连接尚未建立，请稍后重试', {
          confidence: 0.1,
          fallback: true
        });
        return;
      }

      try {
        this.isTyping = true;
        this.smoothScrollToBottom();

        const response = await uni.request({
          url: `${ENV_CONFIG.AI_SERVICE_URL}/api/chat/message`,
          method: 'POST',
          data: {
            sessionId: this.sessionId,
            message: message,
            userInfo: this.userInfo
          },
          timeout: 15000
        });

        this.isTyping = false;

        if (response[1].data.message) {
          // 添加AI回复
          this.addMessage('bot', response[1].data.message, {
            confidence: response[1].data.confidence,
            intent: response[1].data.intent,
            fallback: response[1].data.fallback
          });

          // 根据回复调整快捷回复
          this.updateQuickReplies(response[1].data.intent);
        } else {
          throw new Error('AI服务返回空响应');
        }

      } catch (error) {
        console.error('❌ 发送消息失败:', error);
        this.isTyping = false;
        
        // 显示错误消息
        this.addMessage('bot', '抱歉，服务暂时不可用，请稍后重试或联系人工客服：400-123-4567', {
          confidence: 0.1,
          fallback: true
        });
      }
    },

    /**
     * 发送快捷回复
     */
    sendQuickReply(reply) {
      this.inputMessage = reply;
      this.sendMessage();
    },

    /**
     * 发送AI欢迎消息
     */
    sendWelcomeMessage() {
      
      // 只要消息数为0，就发送欢迎消息
      if (this.messages.length === 0) {
        const welcomeMessages = [
            `您好！我是AI智能客服小助手，很高兴为您服务！😊`,
            `我可以帮您解决以下问题：\n📦 订单查询与管理\n🛍️ 商品咨询\n💳 支付问题\n🔄 退换货服务\n🚚 物流跟踪\n👑 会员服务`,
            `有什么可以帮到您的吗？您也可以点击下方的快捷功能哦！`
        ];
        
        // 分别发送每条欢迎消息，模拟真实AI回复
        welcomeMessages.forEach((message, index) => {
          setTimeout(() => {
            this.addMessage('bot', message, {
              confidence: 1.0,
              intent: 'welcome',
              fallback: false
            });
            
            
            // 最后一条消息后滚动到底部
            if (index === welcomeMessages.length - 1) {
              setTimeout(() => {
                this.smoothScrollToBottom();
              }, 200);
            }
          }, (index + 1) * 800); // 每条消息间隔800ms
        });
      } else {
      }
    },

    /**
     * 添加消息
     */
    addMessage(role, content, meta = {}) {
      
      const message = {
        role,
        content,
        timestamp: new Date().toISOString(),
        confidence: meta.confidence,
        intent: meta.intent,
        fallback: meta.fallback
      };

      this.messages.push(message);

      // 如果聊天窗口未打开，显示新消息提示
      if (!this.showChat && role === 'bot') {
        this.hasNewMessage = true;
      }

      // 限制消息历史长度
      if (this.messages.length > 100) {
        this.messages = this.messages.slice(-50);
      }
      
      // 强制更新视图
      this.$forceUpdate();
      
      // 智能滚动
      this.smoothScrollToBottom();
    },

    /**
     * 更新快捷回复
     */
    updateQuickReplies(intent) {
      // 根据识别的意图调整快捷回复选项
      const intentReplies = {
        'ask_order_status': ['修改订单', '取消订单', '物流查询'],
        'ask_product_info': ['查看库存', '价格咨询', '规格参数'],
        'ask_return_policy': ['申请退货', '申请换货', '退货进度'],
        'complaint': ['联系经理', '查看处理进度', '提交证据'],
        'arithmetic': ['50*2', '100/5', '88+12', '(25+75)*2'],
        '问候': ['今天几号', '现在几点', '查询订单', '商品咨询'],
        '时间': ['123*4', '今天星期几', '查询订单', '其他问题'],
        '日期': ['456/8', '现在几点', '查询订单', '其他问题']
      };

      if (intentReplies[intent]) {
        this.quickReplies = [...intentReplies[intent], '其他问题'];
      }
    },



    /**
     * 智能滚动到合适位置
     */
    scrollToBottom(force = false) {
      // 如果用户正在滚动，不要强制滚动（除非强制要求）
      if (!force && this.isUserScrolling && (Date.now() - this.lastScrollTime < 1000)) {
        return;
      }
      
      this.$nextTick(() => {
        // 获取scroll-view节点信息
        const query = uni.createSelectorQuery().in(this);
        query.select('.chat-messages').boundingClientRect();
        query.select('.message-list').boundingClientRect();
        query.exec((res) => {
          if (res && res[0] && res[1]) {
            const scrollViewInfo = res[0];
            const contentInfo = res[1];
            
            // 计算合适的滚动位置
            // 留出一些空间，避免完全贴底
            const buffer = 100; // 100rpx缓冲区
            const maxScroll = Math.max(0, contentInfo.height - scrollViewInfo.height + buffer);
            
            // 平滑滚动到计算位置
            this.scrollTop = maxScroll;
            
            console.log(`📜 智能滚动: scrollTop=${maxScroll}, 内容高度=${contentInfo.height}, 视口高度=${scrollViewInfo.height}`);
          } else {
            // 如果获取不到信息，使用备用方案
            this.scrollTop = 999999;
          }
        });
      });
    },
    
    /**
     * 渐进式滚动到底部（用于连续消息）
     */
    smoothScrollToBottom() {
      this.$nextTick(() => {
        // 延迟执行，让DOM更新完成
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
      });
    },

    /**
     * 输入框获得焦点
     */
    onInputFocus() {
      this.showQuickReplies = false;
      // 输入框获得焦点时，确保滚动到合适位置
      setTimeout(() => {
        this.scrollToBottom(true); // 强制滚动
      }, 300);
    },

    /**
     * 输入框失去焦点
     */
    onInputBlur() {
      setTimeout(() => {
        this.showQuickReplies = true;
      }, 100);
    },

    /**
     * 滚动事件处理
     */
    onScroll(e) {
      // 标记用户正在滚动
      this.isUserScrolling = true;
      this.lastScrollTime = Date.now();
      
      // 1秒后重置滚动状态
      clearTimeout(this.scrollTimer);
      this.scrollTimer = setTimeout(() => {
        this.isUserScrolling = false;
      }, 1000);
      
      // 可以在这里处理滚动加载历史消息等
    },

    /**
     * 获取当前时间
     */
    getCurrentTime() {
      return new Date().toLocaleTimeString('zh-CN', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    },

    /**
     * 格式化时间
     */
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('zh-CN', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    },

    /**
     * 外部调用发送消息（用于快捷功能）
     */
    sendQuickMessage(message) {
      
      if (message && message.trim()) {
        this.inputMessage = message.trim();
        this.sendMessage();
      } else {
        console.error('❌ 快捷消息为空或无效');
      }
    },

    /**
     * 清空聊天记录（外部调用）
     */
    clearHistory() {
      this.messages = [];
      
      // 触发清空事件
      this.$emit('history-cleared');
    },

    /**
     * 获取聊天状态（外部调用）
     */
    getChatStatus() {
      return {
        isConnected: this.isConnected,
        isTyping: this.isTyping,
        messageCount: this.messages.length,
        sessionId: this.sessionId
      };
    },

    /**
     * 设置连接状态（外部调用）
     */
    setConnectionStatus(status) {
      this.isConnected = status;
      this.$emit('connection-change', status);
    },

    /**
     * 手动重新连接（外部调用）
     */
    async reconnect() {
      this.sessionId = null;
      this.isConnected = false;
      await this.initializeChat(0); // 重置重试计数
    }
  }
};
</script>

<style scoped lang="scss">
@import './AIChat.scss';
</style>
