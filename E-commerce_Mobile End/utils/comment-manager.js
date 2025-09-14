/**
 * 商品评论管理器
 * 负责评论的存储、查询、统计等功能
 */

class CommentManager {
  constructor() {
    this.storagePrefix = 'product_comments_';
  }

  /**
   * 获取商品的所有评论
   * @param {string} productId 商品ID
   * @returns {Array} 评论列表
   */
  getComments(productId) {
    try {
      const storageKey = this.storagePrefix + productId;
      const comments = uni.getStorageSync(storageKey);
      return Array.isArray(comments) ? comments : [];
    } catch (error) {
      console.error('❌ 获取评论失败:', error);
      return [];
    }
  }

  /**
   * 保存商品评论
   * @param {string} productId 商品ID
   * @param {Array} comments 评论列表
   */
  saveComments(productId, comments) {
    try {
      const storageKey = this.storagePrefix + productId;
      uni.setStorageSync(storageKey, comments);
      console.log('💾 评论已保存:', comments.length, '条');
      return true;
    } catch (error) {
      console.error('❌ 保存评论失败:', error);
      return false;
    }
  }

  /**
   * 添加新评论
   * @param {string} productId 商品ID
   * @param {Object} comment 评论对象
   */
  addComment(productId, comment) {
    try {
      const comments = this.getComments(productId);
      
      // 添加唯一ID和时间戳
      const newComment = {
        id: Date.now().toString(),
        ...comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        replies: [],
        videos: comment.videos || [] // 确保视频字段存在
      };

      // 插入到列表开头
      comments.unshift(newComment);
      
      // 保存更新
      const success = this.saveComments(productId, comments);
      
      if (success) {
        console.log('✅ 评论添加成功:', newComment.id);
        return { success: true, comment: newComment };
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('❌ 添加评论失败:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 删除评论
   * @param {string} productId 商品ID
   * @param {string} commentId 评论ID
   */
  deleteComment(productId, commentId) {
    try {
      const comments = this.getComments(productId);
      const index = comments.findIndex(comment => comment.id === commentId);
      
      if (index === -1) {
        throw new Error('评论不存在');
      }

      // 删除评论
      comments.splice(index, 1);
      
      // 保存更新
      const success = this.saveComments(productId, comments);
      
      if (success) {
        console.log('✅ 评论删除成功:', commentId);
        return { success: true };
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('❌ 删除评论失败:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 点赞/取消点赞评论
   * @param {string} productId 商品ID
   * @param {string} commentId 评论ID
   * @param {boolean} isLike 是否点赞
   */
  likeComment(productId, commentId, isLike = true) {
    try {
      const comments = this.getComments(productId);
      const comment = comments.find(c => c.id === commentId);
      
      if (!comment) {
        throw new Error('评论不存在');
      }

      // 更新点赞状态
      const wasLiked = comment.isLiked || false;
      comment.isLiked = isLike;
      comment.likes = (comment.likes || 0) + (isLike ? 1 : -1);
      
      // 确保点赞数不为负数
      if (comment.likes < 0) {
        comment.likes = 0;
      }

      comment.updatedAt = new Date().toISOString();
      
      // 保存更新
      const success = this.saveComments(productId, comments);
      
      if (success) {
        console.log('✅ 评论点赞状态更新:', commentId, isLike ? '点赞' : '取消点赞');
        return { success: true, comment };
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('❌ 更新点赞状态失败:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 删除回复
   * @param {string} productId 商品ID
   * @param {string} commentId 评论ID
   * @param {string} replyId 回复ID
   * @param {string} userId 操作用户ID（权限验证）
   */
  deleteReply(productId, commentId, replyId, userId = null) {
    try {
      const comments = this.getComments(productId);
      const comment = comments.find(c => c.id === commentId);
      
      if (!comment) {
        throw new Error('评论不存在');
      }

      if (!comment.replies || comment.replies.length === 0) {
        throw new Error('回复不存在');
      }

      const replyIndex = comment.replies.findIndex(r => r.id === replyId);
      if (replyIndex === -1) {
        throw new Error('回复不存在');
      }

      const reply = comment.replies[replyIndex];

      // 权限验证：只有回复发布者可以删除自己的回复
      if (userId) {
        const replyUserId = reply.user?.id || reply.user?._id || reply.user?.userId;
        if (replyUserId !== userId) {
          throw new Error('无权限删除此回复');
        }
      }

      // 删除回复
      comment.replies.splice(replyIndex, 1);
      comment.updatedAt = new Date().toISOString();
      
      // 保存更新
      const success = this.saveComments(productId, comments);
      
      if (success) {
        console.log('✅ 回复删除成功:', replyId);
        return { 
          success: true, 
          deletedReply: reply,
          message: '回复删除成功'
        };
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('❌ 删除回复失败:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 添加回复
   * @param {string} productId 商品ID
   * @param {string} commentId 评论ID
   * @param {Object} reply 回复对象
   */
  addReply(productId, commentId, reply) {
    try {
      const comments = this.getComments(productId);
      const comment = comments.find(c => c.id === commentId);
      
      if (!comment) {
        throw new Error('评论不存在');
      }

      // 初始化回复列表
      if (!comment.replies) {
        comment.replies = [];
      }

      // 添加回复
      const newReply = {
        id: Date.now().toString(),
        ...reply,
        createdAt: new Date().toISOString()
      };

      comment.replies.push(newReply);
      comment.updatedAt = new Date().toISOString();
      
      // 保存更新
      const success = this.saveComments(productId, comments);
      
      if (success) {
        console.log('✅ 回复添加成功:', newReply.id);
        return { success: true, reply: newReply };
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('❌ 添加回复失败:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 获取评论统计
   * @param {string} productId 商品ID
   * @returns {Object} 统计信息
   */
  getCommentStats(productId) {
    try {
      const comments = this.getComments(productId);
      
      if (comments.length === 0) {
        return {
          total: 0,
          averageRating: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          goodComments: 0,
          normalComments: 0,
          badComments: 0,
          commentsWithImages: 0
        };
      }

      // 计算平均评分
      const totalRating = comments.reduce((sum, comment) => sum + (comment.rating || 0), 0);
      const averageRating = totalRating / comments.length;

      // 评分分布
      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      comments.forEach(comment => {
        const rating = comment.rating || 0;
        if (rating >= 1 && rating <= 5) {
          ratingDistribution[rating]++;
        }
      });

      // 好中差评统计
      const goodComments = comments.filter(c => (c.rating || 0) >= 4).length;
      const normalComments = comments.filter(c => (c.rating || 0) === 3).length;
      const badComments = comments.filter(c => (c.rating || 0) <= 2).length;
      const commentsWithImages = comments.filter(c => 
        (c.images && c.images.length > 0) || 
        (c.videos && c.videos.length > 0)
      ).length;

      return {
        total: comments.length,
        averageRating: Number(averageRating.toFixed(1)),
        ratingDistribution,
        goodComments,
        normalComments,
        badComments,
        commentsWithImages
      };
    } catch (error) {
      console.error('❌ 获取评论统计失败:', error);
      return {
        total: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        goodComments: 0,
        normalComments: 0,
        badComments: 0,
        commentsWithImages: 0
      };
    }
  }

  /**
   * 筛选评论
   * @param {string} productId 商品ID
   * @param {string} filter 筛选类型 (all, images, 5star, 3star, 1star)
   * @returns {Array} 筛选后的评论列表
   */
  filterComments(productId, filter = 'all') {
    try {
      const comments = this.getComments(productId);
      
      switch (filter) {
        case 'images':
          return comments.filter(comment => 
            (comment.images && comment.images.length > 0) || 
            (comment.videos && comment.videos.length > 0)
          );
        case '5star':
          return comments.filter(comment => (comment.rating || 0) >= 4);
        case '3star':
          return comments.filter(comment => (comment.rating || 0) === 3);
        case '1star':
          return comments.filter(comment => (comment.rating || 0) <= 2);
        default:
          return comments;
      }
    } catch (error) {
      console.error('❌ 筛选评论失败:', error);
      return [];
    }
  }

  /**
   * 搜索评论
   * @param {string} productId 商品ID
   * @param {string} keyword 搜索关键词
   * @returns {Array} 搜索结果
   */
  searchComments(productId, keyword) {
    try {
      if (!keyword || keyword.trim() === '') {
        return this.getComments(productId);
      }

      const comments = this.getComments(productId);
      const lowerKeyword = keyword.toLowerCase().trim();
      
      return comments.filter(comment => {
        const content = (comment.content || '').toLowerCase();
        const nickname = (comment.user?.nickname || '').toLowerCase();
        return content.includes(lowerKeyword) || nickname.includes(lowerKeyword);
      });
    } catch (error) {
      console.error('❌ 搜索评论失败:', error);
      return [];
    }
  }

  /**
   * 清空商品的所有评论
   * @param {string} productId 商品ID
   */
  clearComments(productId) {
    try {
      const storageKey = this.storagePrefix + productId;
      uni.removeStorageSync(storageKey);
      console.log('🗑️ 评论已清空:', productId);
      return true;
    } catch (error) {
      console.error('❌ 清空评论失败:', error);
      return false;
    }
  }

  /**
   * 导出评论数据
   * @param {string} productId 商品ID
   * @returns {Object} 导出的数据
   */
  exportComments(productId) {
    try {
      const comments = this.getComments(productId);
      const stats = this.getCommentStats(productId);
      
      return {
        productId,
        exportTime: new Date().toISOString(),
        stats,
        comments
      };
    } catch (error) {
      console.error('❌ 导出评论失败:', error);
      return null;
    }
  }

  /**
   * 导入评论数据
   * @param {string} productId 商品ID
   * @param {Array} comments 评论数据
   */
  importComments(productId, comments) {
    try {
      if (!Array.isArray(comments)) {
        throw new Error('评论数据格式错误');
      }

      const success = this.saveComments(productId, comments);
      
      if (success) {
        console.log('📥 评论导入成功:', comments.length, '条');
        return { success: true };
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('❌ 导入评论失败:', error);
      return { success: false, message: error.message };
    }
  }
}

// 创建单例实例
const commentManager = new CommentManager();

export default commentManager;
