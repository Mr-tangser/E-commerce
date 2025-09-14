<template>
  <view class="comment-system">
    <!-- 评论统计头部 -->
    <view class="comment-header">
      <view class="comment-title">
        <text class="title">商品评价</text>
        <text class="count">({{ comments.length }})</text>
      </view>
      <view class="comment-stats">
        <view class="rating-summary">
          <view class="overall-rating">
            <text class="rating-number">{{ averageRating.toFixed(1) }}</text>
            <view class="stars">
              <text 
                v-for="i in 5" 
                :key="i" 
                class="star"
                :class="{ filled: i <= Math.round(averageRating) }"
              >★</text>
            </view>
          </view>
          <text class="rating-text">综合评分</text>
        </view>
      </view>
    </view>

    <!-- 评论筛选 -->
    <view class="comment-filter">
      <scroll-view class="filter-scroll" scroll-x>
        <view class="filter-item" 
          :class="{ active: currentFilter === 'all' }" 
          @click="setFilter('all')">
          <text>全部({{ comments.length }})</text>
        </view>
        <view class="filter-item" 
          :class="{ active: currentFilter === 'images' }" 
          @click="setFilter('images')">
          <text>有图/视频({{ commentsWithImages.length }})</text>
        </view>
        <view class="filter-item" 
          :class="{ active: currentFilter === '5star' }" 
          @click="setFilter('5star')">
          <text>好评({{ goodComments.length }})</text>
        </view>
        <view class="filter-item" 
          :class="{ active: currentFilter === '3star' }" 
          @click="setFilter('3star')">
          <text>中评({{ normalComments.length }})</text>
        </view>
        <view class="filter-item" 
          :class="{ active: currentFilter === '1star' }" 
          @click="setFilter('1star')">
          <text>差评({{ badComments.length }})</text>
        </view>
      </scroll-view>
    </view>

    <!-- 评论列表 -->
    <view class="comment-list">
      <view 
        v-for="comment in filteredComments" 
        :key="comment.id" 
        class="comment-item"
      >
        <!-- 用户信息 -->
        <view class="user-info">
          <image class="avatar" :src="comment.user.avatar" mode="aspectFill"></image>
          <view class="user-details">
            <view class="username">{{ comment.user.nickname }}</view>
            <view class="comment-meta">
              <view class="rating">
                <text 
                  v-for="i in 5" 
                  :key="i" 
                  class="star"
                  :class="{ filled: i <= comment.rating }"
                >★</text>
              </view>
              <text class="date">{{ formatDate(comment.createdAt) }}</text>
            </view>
          </view>
          <!-- 删除按钮 - 只有发布者本人可见 -->
          <view 
            v-if="canDeleteComment(comment)" 
            class="delete-btn"
            @click="confirmDeleteComment(comment)"
          >
            <text class="delete-icon">🗑️</text>
          </view>
        </view>

        <!-- 评论内容 -->
        <view class="comment-content">
          <text class="comment-text">{{ comment.content }}</text>
          
          <!-- 商品规格信息 -->
          <view class="product-variant" v-if="comment.variant">
            <text>已购买：{{ comment.variant }}</text>
          </view>

          <!-- 评论媒体（图片和视频） -->
          <view class="comment-media" v-if="(comment.images && comment.images.length > 0) || (comment.videos && comment.videos.length > 0)">
            <!-- 图片列表 -->
            <image 
              v-for="(img, index) in comment.images || []" 
              :key="'img_' + index"
              class="comment-image" 
              :src="img" 
              mode="aspectFill"
              @click="previewImage(comment.images, index)"
            ></image>
            
            <!-- 视频列表 -->
            <view 
              v-for="(video, index) in comment.videos || []" 
              :key="'video_' + index"
              class="comment-video"
              @click="playVideo(video, index)"
            >
              <video 
                :src="video.url"
                :poster="video.poster"
                class="video-player"
                :show-center-play-btn="true"
                :show-play-btn="false"
                :show-fullscreen-btn="false"
                :show-progress="false"
                :controls="false"
                :autoplay="false"
                object-fit="cover"
              ></video>
              <view class="video-overlay">
                <view class="play-icon">▶</view>
                <view class="video-duration" v-if="video.duration">
                  {{ formatDuration(video.duration) }}
                </view>
              </view>
            </view>
          </view>

          <!-- 评论操作 -->
          <view class="comment-actions">
            <view class="action-item" @click="likeComment(comment)">
              <text class="action-icon" :class="{ liked: comment.isLiked }">👍</text>
              <text class="action-text">{{ comment.likes || 0 }}</text>
            </view>
            <view class="action-item" @click="replyComment(comment)">
              <text class="action-icon">💬</text>
              <text class="action-text">回复</text>
            </view>
          </view>

          <!-- 回复列表 -->
          <view class="replies" v-if="comment.replies && comment.replies.length > 0">
            <view 
              v-for="reply in comment.replies" 
              :key="reply.id" 
              class="reply-item"
            >
              <view class="reply-main">
                <text class="reply-user">{{ reply.user.nickname }}：</text>
                <text class="reply-content">{{ reply.content }}</text>
                <text class="reply-date">{{ formatDate(reply.createdAt) }}</text>
              </view>
              <!-- 删除回复按钮 - 只有发布者本人可见 -->
              <view 
                v-if="canDeleteReply(reply)" 
                class="delete-reply-btn"
                @click="confirmDeleteReply(comment, reply)"
              >
                <text class="delete-reply-icon">❌</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="filteredComments.length === 0">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无评价</text>
        <text class="empty-desc">快来发表第一条评价吧</text>
      </view>
    </view>

    <!-- 写评价按钮 -->
    <view class="write-comment-btn" @click="showCommentModal = true">
      <text class="btn-text">写评价</text>
    </view>

    <!-- 评论发布弹窗 -->
    <view class="comment-modal" v-if="showCommentModal" @click="closeModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">发表评价</text>
          <view class="close-btn" @click="closeModal">
            <text>✕</text>
          </view>
        </view>

        <view class="modal-body">
          <!-- 评分选择 -->
          <view class="rating-section">
            <text class="section-title">商品评分</text>
            <view class="rating-stars">
              <text 
                v-for="i in 5" 
                :key="i" 
                class="rating-star"
                :class="{ active: i <= newComment.rating }"
                @click="setRating(i)"
              >★</text>
            </view>
            <text class="rating-desc">{{ getRatingDesc(newComment.rating) }}</text>
          </view>

          <!-- 评价内容 -->
          <view class="content-section">
            <text class="section-title">评价内容</text>
            <textarea 
              class="comment-textarea"
              v-model="newComment.content"
              placeholder="分享一下您的使用体验吧~"
              maxlength="500"
            ></textarea>
            <text class="char-count">{{ newComment.content.length }}/500</text>
          </view>

          <!-- 媒体上传（图片和视频） -->
          <view class="media-section">
            <text class="section-title">上传图片/视频</text>
            <view class="media-upload">
              <!-- 已上传的图片 -->
              <view 
                v-for="(img, index) in newComment.images" 
                :key="'img_' + index" 
                class="uploaded-media uploaded-image"
              >
                <image :src="img" mode="aspectFill"></image>
                <view class="media-type-badge">图片</view>
                <view class="remove-media" @click="removeImage(index)">
                  <text>✕</text>
                </view>
              </view>
              
              <!-- 已上传的视频 -->
              <view 
                v-for="(video, index) in newComment.videos" 
                :key="'video_' + index" 
                class="uploaded-media uploaded-video"
                @click="previewUploadedVideo(video, index)"
              >
                <video 
                  :src="video.url"
                  :poster="video.poster"
                  class="video-preview"
                  :show-center-play-btn="false"
                  :show-play-btn="false"
                  :show-fullscreen-btn="false"
                  :show-progress="false"
                  :controls="false"
                  :autoplay="false"
                  object-fit="cover"
                ></video>
                <view class="video-preview-overlay">
                  <view class="play-icon-small">▶</view>
                  <view class="video-duration-small" v-if="video.duration">
                    {{ formatDuration(video.duration) }}
                  </view>
                  <view class="preview-hint">点击预览</view>
                </view>
                <view class="media-type-badge">视频</view>
                <view class="remove-media" @click.stop="removeVideo(index)">
                  <text>✕</text>
                </view>
              </view>
              
              <!-- 添加图片按钮 -->
              <view 
                class="upload-btn" 
                v-if="getTotalMediaCount() < 6"
                @click="chooseImage"
              >
                <text class="upload-icon">📷</text>
                <text class="upload-text">添加图片</text>
              </view>
              
              <!-- 添加视频按钮 -->
              <view 
                class="upload-btn" 
                v-if="getTotalMediaCount() < 6 && newComment.videos.length < 3"
                @click="chooseVideo"
              >
                <text class="upload-icon">🎬</text>
                <text class="upload-text">添加视频</text>
              </view>
            </view>
            <text class="upload-tips">最多上传6个文件（图片+视频），视频最多3个，单个视频不超过30秒</text>
          </view>
        </view>

        <view class="modal-footer">
          <view class="cancel-btn" @click="closeModal">
            <text>取消</text>
          </view>
          <view class="submit-btn" :class="{ disabled: !canSubmit }" @click="submitComment">
            <text>发布评价</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 回复弹窗 -->
    <view class="reply-modal" v-if="showReplyModal" @click="closeReplyModal">
      <view class="reply-content" @click.stop>
        <view class="reply-header">
          <text class="reply-title">回复评价</text>
          <view class="close-btn" @click="closeReplyModal">
            <text>✕</text>
          </view>
        </view>
        <textarea 
          class="reply-textarea"
          v-model="replyContent"
          placeholder="说点什么..."
          maxlength="200"
        ></textarea>
        <view class="reply-footer">
          <text class="char-count">{{ replyContent.length }}/200</text>
          <view class="reply-submit" @click="submitReply">
            <text>发布</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 删除确认弹窗 -->
    <view class="delete-confirmation-modal" v-if="showDeleteConfirmModal" @click="closeDeleteConfirm">
      <view class="delete-modal-content" @click.stop>
        <view class="delete-modal-header">
          <view class="delete-icon-wrapper">
            <text class="delete-warning-icon">⚠️</text>
          </view>
          <text class="delete-modal-title">确认删除</text>
          <view class="close-delete-btn" @click="closeDeleteConfirm">
            <text>✕</text>
          </view>
        </view>
        
        <view class="delete-modal-body">
          <view class="delete-content-preview" v-if="pendingDeleteComment">
            <view class="preview-user">
              <image class="preview-avatar" :src="pendingDeleteComment.user.avatar" mode="aspectFill"></image>
              <text class="preview-name">{{ pendingDeleteComment.user.nickname }}</text>
            </view>
            <view class="preview-text">
              <text>"{{ pendingDeleteComment.content.length > 50 ? pendingDeleteComment.content.substring(0, 50) + '...' : pendingDeleteComment.content }}"</text>
            </view>
          </view>
          <view class="delete-warning-text">
            <text class="warning-main">此操作将永久删除该评论</text>
            <text class="warning-sub">删除后无法恢复，请谨慎操作</text>
          </view>
        </view>
        
        <view class="delete-modal-footer">
          <view class="delete-cancel-btn" @click="closeDeleteConfirm">
            <text>取消</text>
          </view>
          <view class="delete-confirm-btn" @click="executeDelete">
            <text class="delete-btn-icon">🗑️</text>
            <text>确认删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 视频预览弹窗 -->
    <view class="video-preview-modal" v-if="showVideoPreviewModal" @click="closeVideoPreview">
      <view class="video-preview-container" @click.stop>
        <view class="video-preview-header">
          <text class="preview-title">视频预览</text>
          <view class="close-preview-btn" @click="closeVideoPreview">
            <text>✕</text>
          </view>
        </view>
        
        <view class="video-preview-content">
          <video
            v-if="previewVideoData"
            id="previewVideoPlayer"
            :src="previewVideoData.url"
            :poster="previewVideoData.poster"
            class="preview-video-player"
            :controls="true"
            :autoplay="true"
            :show-fullscreen-btn="true"
            :show-play-btn="true"
            :show-center-play-btn="true"
            :enable-play-gesture="true"
            object-fit="contain"
            @play="onPreviewVideoPlay"
            @pause="onPreviewVideoPause"
            @ended="onPreviewVideoEnded"
            @error="onPreviewVideoError"
          ></video>
        </view>
        
        <view class="video-preview-info" v-if="previewVideoData">
          <view class="video-info-item">
            <text class="info-label">时长：</text>
            <text class="info-value">{{ formatDuration(previewVideoData.duration) }}</text>
          </view>
          <view class="video-info-item" v-if="previewVideoData.size">
            <text class="info-label">大小：</text>
            <text class="info-value">{{ formatFileSize(previewVideoData.size) }}</text>
          </view>
          <view class="video-info-item">
            <text class="info-label">格式：</text>
            <text class="info-value">{{ getVideoFormat(previewVideoData.url) }}</text>
          </view>
        </view>
        
        <view class="video-preview-actions">
          <view class="preview-action-btn" @click="playPreviewVideo">
            <text>播放</text>
          </view>
          <view class="preview-action-btn" @click="pausePreviewVideo">
            <text>暂停</text>
          </view>
          <!-- 只有在编辑模式（上传视频时）才显示删除按钮 -->
          <view 
            v-if="previewVideoIndex >= 0" 
            class="preview-action-btn danger" 
            @click="removeCurrentPreviewVideo"
          >
            <text>删除此视频</text>
          </view>
          <!-- 查看模式（已发布的评论视频）显示全屏播放按钮 -->
          <view 
            v-else 
            class="preview-action-btn fullscreen" 
            @click="openFullscreenFromPreview"
          >
            <text>全屏播放</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'GoodsComment',
  props: {
    productId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      comments: [],
      currentFilter: 'all',
      showCommentModal: false,
      showReplyModal: false,
      currentReplyComment: null,
      replyContent: '',
      currentUser: null, // 当前登录用户信息
      showVideoPreviewModal: false, // 视频预览弹窗显示状态
      previewVideoData: null, // 当前预览的视频数据
      previewVideoIndex: -1, // 当前预览视频的索引
      previewVideoContext: null, // 预览视频播放器上下文
      showDeleteConfirmModal: false, // 删除确认弹窗显示状态
      pendingDeleteComment: null, // 待删除的评论对象
      newComment: {
        rating: 5,
        content: '',
        images: [],
        videos: []
      }
    }
  },
  computed: {
    // 平均评分
    averageRating() {
      if (this.comments.length === 0) return 0;
      const total = this.comments.reduce((sum, comment) => sum + comment.rating, 0);
      return total / this.comments.length;
    },

    // 有图/视频评论
    commentsWithImages() {
      return this.comments.filter(comment => 
        (comment.images && comment.images.length > 0) || 
        (comment.videos && comment.videos.length > 0)
      );
    },

    // 好评
    goodComments() {
      return this.comments.filter(comment => comment.rating >= 4);
    },

    // 中评
    normalComments() {
      return this.comments.filter(comment => comment.rating === 3);
    },

    // 差评
    badComments() {
      return this.comments.filter(comment => comment.rating <= 2);
    },

    // 筛选后的评论
    filteredComments() {
      switch (this.currentFilter) {
        case 'images':
          return this.commentsWithImages;
        case '5star':
          return this.goodComments;
        case '3star':
          return this.normalComments;
        case '1star':
          return this.badComments;
        default:
          return this.comments;
      }
    },

    // 是否可以提交评论
    canSubmit() {
      return this.newComment.content.trim().length > 0;
    }
  },
  mounted() {
    this.loadComments();
    this.loadCurrentUser();
  },
  methods: {
    /**
     * 加载评论数据
     */
    loadComments() {
      try {
        // 从本地存储获取评论数据
        const storageKey = `product_comments_${this.productId}`;
        const savedComments = uni.getStorageSync(storageKey);
        
        if (savedComments && Array.isArray(savedComments)) {
          this.comments = savedComments;
        } else {
          // 初始化一些模拟数据
          this.comments = this.getInitialComments();
          this.saveComments();
        }
        
        console.log('📝 评论数据加载完成:', this.comments.length, '条评论');
      } catch (error) {
        console.error('❌ 加载评论数据失败:', error);
        this.comments = this.getInitialComments();
      }
    },

    /**
     * 保存评论数据
     */
    saveComments() {
      try {
        const storageKey = `product_comments_${this.productId}`;
        uni.setStorageSync(storageKey, this.comments);
        console.log('💾 评论数据已保存');
      } catch (error) {
        console.error('❌ 保存评论数据失败:', error);
      }
    },

    /**
     * 获取初始评论数据
     */
    getInitialComments() {
      return [
        {
          id: '1',
          user: {
            id: 'current_user_123', // 模拟当前用户的评论，便于测试删除功能
            _id: 'current_user_123',
            userId: 'current_user_123',
            nickname: '我的测试账号',
            avatar: '/static/img/user_pic.jpg'
          },
          rating: 5,
          content: '商品质量非常好，包装精美，物流很快，非常满意的一次购物体验！',
          variant: '蓝色 M码',
          images: [
            '/static/img/goods_banner_01.webp',
            '/static/img/goods_banner_02.webp'
          ],
          videos: [
            {
              url: '/static/videos/抖音2025828-100172.mp4',
              poster: '/static/img/goods_banner_01.webp',
              duration: 15
            }
          ],
          likes: 8,
          isLiked: false,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          replies: [
            {
              id: 'reply1',
              user: {
                id: 'current_user_123', // 模拟当前用户的回复，便于测试删除功能
                _id: 'current_user_123',
                userId: 'current_user_123',
                nickname: '我的测试账号'
              },
              content: '感谢您的好评，祝您生活愉快！',
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        },
        {
          id: '2',
          user: {
            id: 'user2',
            nickname: '购物达人小李',
            avatar: '/static/morentouxiang/5.jpg'
          },
          rating: 4,
          content: '整体还不错，性价比挺高的，就是颜色比图片稍微深一点，不过也能接受。',
          variant: '红色 L码',
          images: [],
          videos: [],
          likes: 3,
          isLiked: false,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          replies: []
        }
      ];
    },

    /**
     * 设置筛选条件
     */
    setFilter(filter) {
      this.currentFilter = filter;
    },

    /**
     * 设置评分
     */
    setRating(rating) {
      this.newComment.rating = rating;
    },

    /**
     * 获取评分描述
     */
    getRatingDesc(rating) {
      const descs = {
        1: '非常不满意',
        2: '不满意', 
        3: '一般',
        4: '满意',
        5: '非常满意'
      };
      return descs[rating] || '';
    },

    /**
     * 选择图片
     */
    chooseImage() {
      const remainingCount = 6 - this.getTotalMediaCount();
      
      if (remainingCount <= 0) {
        uni.showToast({
          title: '最多上传6个文件',
          icon: 'none'
        });
        return;
      }
      
      uni.chooseImage({
        count: remainingCount,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album'],
        success: (res) => {
          this.newComment.images.push(...res.tempFilePaths);
        },
        fail: (error) => {
          console.error('选择图片失败:', error);
          uni.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
        }
      });
    },

    /**
     * 选择视频
     */
    chooseVideo() {
      const remainingCount = 6 - this.getTotalMediaCount();
      const remainingVideoCount = 3 - this.newComment.videos.length;
      
      if (remainingCount <= 0) {
        uni.showToast({
          title: '最多上传6个文件',
          icon: 'none'
        });
        return;
      }
      
      if (remainingVideoCount <= 0) {
        uni.showToast({
          title: '最多上传3个视频',
          icon: 'none'
        });
        return;
      }
      
      uni.chooseVideo({
        sourceType: ['camera', 'album'],
        maxDuration: 30, // 最长30秒
        camera: 'back',
        success: (res) => {
          console.log('选择视频成功:', res);
          
          // 构建视频对象
          const video = {
            url: res.tempFilePath,
            poster: res.thumbTempFilePath || '', // 视频封面
            duration: res.duration || 0,
            size: res.size || 0
          };
          
          // 检查视频大小（限制50MB）
          if (video.size > 50 * 1024 * 1024) {
            uni.showToast({
              title: '视频文件过大，请选择小于50MB的视频',
              icon: 'none'
            });
            return;
          }
          
          this.newComment.videos.push(video);
          
          uni.showToast({
            title: '视频添加成功',
            icon: 'success'
          });
        },
        fail: (error) => {
          console.error('选择视频失败:', error);
          if (error.errMsg && !error.errMsg.includes('cancel')) {
            uni.showToast({
              title: '选择视频失败',
              icon: 'none'
            });
          }
        }
      });
    },

    /**
     * 获取总媒体文件数量
     */
    getTotalMediaCount() {
      return this.newComment.images.length + this.newComment.videos.length;
    },

    /**
     * 移除图片
     */
    removeImage(index) {
      this.newComment.images.splice(index, 1);
    },

    /**
     * 移除视频
     */
    removeVideo(index) {
      this.newComment.videos.splice(index, 1);
    },

    /**
     * 提交评论
     */
    async submitComment() {
      if (!this.canSubmit) return;

      try {
        // 检查用户登录状态
        const token = uni.getStorageSync('token');
        const user = uni.getStorageSync('user');
        
        if (!token || !user) {
          uni.showModal({
            title: '需要登录',
            content: '请先登录后再发表评价',
            success: (res) => {
              if (res.confirm) {
                uni.navigateTo({
                  url: '/pages/login/login'
                });
              }
            }
          });
          return;
        }

        // 构建评论数据
        const newComment = {
          id: Date.now().toString(),
          user: {
            id: user.id || user._id,
            nickname: user.username || user.nickname || '匿名用户',
            avatar: user.avatar || '/static/default_avatar.png'
          },
          rating: this.newComment.rating,
          content: this.newComment.content.trim(),
          variant: '默认规格', // 这里可以从商品详情页传入当前选择的规格
          images: [...this.newComment.images],
          videos: [...this.newComment.videos],
          likes: 0,
          isLiked: false,
          createdAt: new Date().toISOString(),
          replies: []
        };

        // 添加到评论列表
        this.comments.unshift(newComment);
        
        // 保存到本地存储
        this.saveComments();

        // 重置表单
        this.resetCommentForm();

        // 关闭弹窗
        this.showCommentModal = false;

        // 显示成功提示
        uni.showToast({
          title: '评价发布成功',
          icon: 'success'
        });

        console.log('✅ 评论发布成功:', newComment);

        // 触发评论数量更新事件
        this.$emit('commentAdded', newComment);

      } catch (error) {
        console.error('❌ 发布评论失败:', error);
        uni.showToast({
          title: '发布失败，请重试',
          icon: 'none'
        });
      }
    },

    /**
     * 重置评论表单
     */
    resetCommentForm() {
      this.newComment = {
        rating: 5,
        content: '',
        images: [],
        videos: []
      };
    },

    /**
     * 点赞评论
     */
    likeComment(comment) {
      comment.isLiked = !comment.isLiked;
      comment.likes = (comment.likes || 0) + (comment.isLiked ? 1 : -1);
      
      // 保存更新
      this.saveComments();

      // 触觉反馈
      uni.vibrateShort();
    },

    /**
     * 回复评论
     */
    replyComment(comment) {
      // 检查登录状态
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      this.currentReplyComment = comment;
      this.replyContent = '';
      this.showReplyModal = true;
    },

    /**
     * 提交回复
     */
    submitReply() {
      if (!this.replyContent.trim()) {
        uni.showToast({
          title: '请输入回复内容',
          icon: 'none'
        });
        return;
      }

      try {
        const user = uni.getStorageSync('user');
        
        const reply = {
          id: Date.now().toString(),
          user: {
            id: user.id || user._id,
            nickname: user.username || user.nickname || '匿名用户'
          },
          content: this.replyContent.trim(),
          createdAt: new Date().toISOString()
        };

        // 添加回复
        if (!this.currentReplyComment.replies) {
          this.currentReplyComment.replies = [];
        }
        this.currentReplyComment.replies.push(reply);

        // 保存更新
        this.saveComments();

        // 关闭弹窗
        this.closeReplyModal();

        uni.showToast({
          title: '回复成功',
          icon: 'success'
        });

      } catch (error) {
        console.error('❌ 回复失败:', error);
        uni.showToast({
          title: '回复失败',
          icon: 'none'
        });
      }
    },

    /**
     * 预览图片
     */
    previewImage(images, current) {
      uni.previewImage({
        urls: images,
        current: current
      });
    },

    /**
     * 播放视频 - 优化版本，提供多种播放选项
     */
    playVideo(video, index) {
      console.log('🎬 播放评论视频:', video);
      
      // 显示播放选项菜单
      uni.showActionSheet({
        itemList: [
          '在当前页面播放',
          '全屏播放模式',
          '查看视频信息'
        ],
        success: (res) => {
          const tapIndex = res.tapIndex;
          
          switch (tapIndex) {
            case 0:
              // 在当前页面播放（弹窗模式）
              this.playVideoInModal(video);
              break;
            case 1:
              // 全屏播放模式
              this.playVideoFullscreen(video);
              break;
            case 2:
              // 查看视频信息
              this.showVideoInfo(video);
              break;
          }
        },
        fail: (error) => {
          console.log('❌ 用户取消选择:', error);
          // 如果用户取消选择，默认使用弹窗播放
          this.playVideoInModal(video);
        }
      });
    },

    /**
     * 在弹窗中播放视频
     */
    playVideoInModal(video) {
      console.log('🎬 在弹窗中播放视频:', video);
      
      // 复用预览弹窗功能
      this.previewVideoData = {
        url: video.url,
        poster: video.poster,
        duration: video.duration,
        size: video.size || 0
      };
      this.previewVideoIndex = -1; // 标记为查看模式，非编辑模式
      this.showVideoPreviewModal = true;
      
      // 初始化视频播放器上下文
      this.$nextTick(() => {
        this.previewVideoContext = uni.createVideoContext('previewVideoPlayer', this);
      });
    },

    /**
     * 全屏播放视频
     */
    playVideoFullscreen(video) {
      console.log('🎬 全屏播放视频:', video);
      
      // 创建视频播放页面数据
      const videoData = {
        url: video.url,
        poster: video.poster,
        title: '评论视频',
        duration: video.duration,
        size: video.size || 0
      };
      
      // 保存视频数据到临时存储
      uni.setStorageSync('tempVideoData', videoData);
      
      // 跳转到视频播放页面
      uni.navigateTo({
        url: '/pages/VideoPlayer/VideoPlayer',
        success: () => {
          console.log('✅ 成功跳转到全屏播放页面');
        },
        fail: (error) => {
          console.error('❌ 跳转全屏播放页面失败:', error);
          // fallback: 使用弹窗播放
          this.playVideoInModal(video);
        }
      });
    },

    /**
     * 显示视频信息
     */
    showVideoInfo(video) {
      console.log('📋 显示视频信息:', video);
      
      const duration = this.formatDuration(video.duration);
      const size = video.size ? this.formatFileSize(video.size) : '未知';
      const format = this.getVideoFormat(video.url);
      
      const content = `视频时长：${duration}\n文件大小：${size}\n视频格式：${format}`;
      
      uni.showModal({
        title: '视频信息',
        content: content,
        showCancel: true,
        cancelText: '关闭',
        confirmText: '播放视频',
        success: (res) => {
          if (res.confirm) {
            // 用户选择播放视频
            this.playVideoInModal(video);
          }
        }
      });
    },

    /**
     * 格式化视频时长
     */
    formatDuration(duration) {
      if (!duration) return '00:00';
      
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    /**
     * 格式化文件大小
     */
    formatFileSize(size) {
      if (!size) return '未知';
      
      if (size < 1024) {
        return `${size}B`;
      } else if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)}KB`;
      } else if (size < 1024 * 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(1)}MB`;
      } else {
        return `${(size / (1024 * 1024 * 1024)).toFixed(1)}GB`;
      }
    },

    /**
     * 获取视频格式
     */
    getVideoFormat(url) {
      if (!url) return '未知';
      
      const extension = url.split('.').pop().toLowerCase();
      const formats = {
        'mp4': 'MP4',
        'mov': 'MOV', 
        'avi': 'AVI',
        'mkv': 'MKV',
        'webm': 'WebM',
        '3gp': '3GP'
      };
      
      return formats[extension] || extension.toUpperCase();
    },

    /**
     * 预览上传的视频
     */
    previewUploadedVideo(video, index) {
      console.log('🎬 预览上传的视频:', video);
      
      this.previewVideoData = video;
      this.previewVideoIndex = index;
      this.showVideoPreviewModal = true;
      
      // 初始化视频播放器上下文
      this.$nextTick(() => {
        this.previewVideoContext = uni.createVideoContext('previewVideoPlayer', this);
      });
    },

    /**
     * 关闭视频预览
     */
    closeVideoPreview() {
      // 暂停视频播放
      if (this.previewVideoContext) {
        this.previewVideoContext.pause();
      }
      
      this.showVideoPreviewModal = false;
      this.previewVideoData = null;
      this.previewVideoIndex = -1;
      this.previewVideoContext = null;
    },

    /**
     * 播放预览视频
     */
    playPreviewVideo() {
      if (this.previewVideoContext) {
        this.previewVideoContext.play();
      }
    },

    /**
     * 暂停预览视频
     */
    pausePreviewVideo() {
      if (this.previewVideoContext) {
        this.previewVideoContext.pause();
      }
    },

    /**
     * 删除当前预览的视频
     */
    removeCurrentPreviewVideo() {
      // 检查是否为查看模式（已发布的评论视频）
      if (this.previewVideoIndex < 0) {
        uni.showToast({
          title: '无法删除已发布的评论视频',
          icon: 'none'
        });
        return;
      }
      
      uni.showModal({
        title: '删除视频',
        content: '确定要删除这个视频吗？',
        success: (res) => {
          if (res.confirm && this.previewVideoIndex >= 0) {
            // 从视频列表中删除
            this.newComment.videos.splice(this.previewVideoIndex, 1);
            
            // 关闭预览弹窗
            this.closeVideoPreview();
            
            // 显示删除成功提示
            uni.showToast({
              title: '视频已删除',
              icon: 'success'
            });
          }
        }
      });
    },

    /**
     * 预览视频播放事件
     */
    onPreviewVideoPlay() {
      console.log('🎬 预览视频开始播放');
    },

    /**
     * 预览视频暂停事件
     */
    onPreviewVideoPause() {
      console.log('⏸️ 预览视频暂停');
    },

    /**
     * 预览视频播放结束事件
     */
    onPreviewVideoEnded() {
      console.log('🔚 预览视频播放结束');
    },

    /**
     * 预览视频错误事件
     */
    onPreviewVideoError(error) {
      console.error('❌ 预览视频播放错误:', error);
      uni.showToast({
        title: '视频播放出错',
        icon: 'none'
      });
    },

    /**
     * 从预览弹窗打开全屏播放
     */
    openFullscreenFromPreview() {
      if (this.previewVideoData) {
        // 暂停当前预览
        if (this.previewVideoContext) {
          this.previewVideoContext.pause();
        }
        
        // 打开全屏播放
        this.playVideoFullscreen(this.previewVideoData);
        
        // 关闭预览弹窗
        this.closeVideoPreview();
      }
    },

    /**
     * 加载当前用户信息
     */
    loadCurrentUser() {
      try {
        const user = uni.getStorageSync('user');
        if (user) {
          this.currentUser = user;
          console.log('👤 当前用户信息:', this.currentUser);
        } else {
          // 如果没有登录用户，创建一个模拟用户便于测试删除功能
          this.currentUser = {
            id: 'current_user_123',
            _id: 'current_user_123',
            userId: 'current_user_123',
            nickname: '我的测试账号',
            avatar: '/static/default_avatar.png'
          };
          console.log('🧪 使用模拟用户信息进行测试:', this.currentUser);
        }
      } catch (error) {
        console.error('❌ 获取当前用户信息失败:', error);
      }
    },

    /**
     * 判断是否可以删除评论
     */
    canDeleteComment(comment) {
      if (!this.currentUser || !comment.user) return false;
      
      // 比较用户ID，支持不同的ID字段名
      const currentUserId = this.currentUser.id || this.currentUser._id || this.currentUser.userId;
      const commentUserId = comment.user.id || comment.user._id || comment.user.userId;
      
      return currentUserId === commentUserId;
    },

    /**
     * 判断是否可以删除回复
     */
    canDeleteReply(reply) {
      if (!this.currentUser || !reply.user) return false;
      
      // 比较用户ID
      const currentUserId = this.currentUser.id || this.currentUser._id || this.currentUser.userId;
      const replyUserId = reply.user.id || reply.user._id || reply.user.userId;
      
      return currentUserId === replyUserId;
    },

    /**
     * 确认删除评论
     */
    confirmDeleteComment(comment) {
      this.pendingDeleteComment = comment;
      this.showDeleteConfirmModal = true;
    },

    /**
     * 关闭删除确认弹窗
     */
    closeDeleteConfirm() {
      this.showDeleteConfirmModal = false;
      this.pendingDeleteComment = null;
    },

    /**
     * 执行删除操作
     */
    executeDelete() {
      if (this.pendingDeleteComment) {
        this.deleteComment(this.pendingDeleteComment);
        this.closeDeleteConfirm();
      }
    },

    /**
     * 删除评论
     */
    deleteComment(comment) {
      try {
        // 从评论列表中移除
        const index = this.comments.findIndex(c => c.id === comment.id);
        if (index !== -1) {
          this.comments.splice(index, 1);
          
          // 保存更新
          this.saveComments();
          
          // 显示成功提示
          uni.showToast({
            title: '评论已删除',
            icon: 'success'
          });
          
          // 触觉反馈
          uni.vibrateShort();
          
          console.log('✅ 评论删除成功:', comment.id);
          
          // 触发评论删除事件
          this.$emit('commentDeleted', comment);
        } else {
          throw new Error('评论不存在');
        }
      } catch (error) {
        console.error('❌ 删除评论失败:', error);
        uni.showToast({
          title: '删除失败，请重试',
          icon: 'none'
        });
      }
    },

    /**
     * 确认删除回复
     */
    confirmDeleteReply(comment, reply) {
      uni.showModal({
        title: '删除回复',
        content: '确定要删除这条回复吗？',
        success: (res) => {
          if (res.confirm) {
            this.deleteReply(comment, reply);
          }
        }
      });
    },

    /**
     * 删除回复
     */
    deleteReply(comment, reply) {
      try {
        // 从回复列表中移除
        const replyIndex = comment.replies.findIndex(r => r.id === reply.id);
        if (replyIndex !== -1) {
          comment.replies.splice(replyIndex, 1);
          
          // 保存更新
          this.saveComments();
          
          // 显示成功提示
          uni.showToast({
            title: '回复已删除',
            icon: 'success'
          });
          
          // 触觉反馈
          uni.vibrateShort();
          
          console.log('✅ 回复删除成功:', reply.id);
        } else {
          throw new Error('回复不存在');
        }
      } catch (error) {
        console.error('❌ 删除回复失败:', error);
        uni.showToast({
          title: '删除回复失败',
          icon: 'none'
        });
      }
    },

    /**
     * 格式化日期
     */
    formatDate(dateString) {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;
      
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (minutes < 1) return '刚刚';
      if (minutes < 60) return `${minutes}分钟前`;
      if (hours < 24) return `${hours}小时前`;
      if (days < 7) return `${days}天前`;
      
      return date.toLocaleDateString();
    },

    /**
     * 关闭评论弹窗
     */
    closeModal() {
      this.showCommentModal = false;
      this.resetCommentForm();
    },

    /**
     * 关闭回复弹窗
     */
    closeReplyModal() {
      this.showReplyModal = false;
      this.currentReplyComment = null;
      this.replyContent = '';
    }
  }
};
</script>

<style scoped lang="scss">
@import './GoodsComment.scss';
</style>
