/**
 * 商品浏览记录管理工具
 * 用于记录用户浏览过的商品，支持推荐算法
 */

const STORAGE_KEY = 'browsing_history';
const MAX_HISTORY_SIZE = 50; // 最多保存50条浏览记录

class BrowsingHistory {
  
  /**
   * 获取浏览记录
   * @returns {Array} 浏览记录数组
   */
  static getHistory() {
    try {
      const history = uni.getStorageSync(STORAGE_KEY);
      return Array.isArray(history) ? history : [];
    } catch (error) {
      console.error('获取浏览记录失败:', error);
      return [];
    }
  }

  /**
   * 添加商品到浏览记录
   * @param {Object} product 商品信息
   * @param {String} product.id 商品ID
   * @param {String} product.name 商品名称
   * @param {Number} product.price 商品价格
   * @param {String} product.img 商品图片
   * @param {String} product.category 商品分类
   */
  static addProduct(product) {
    try {
      if (!product || !product.id) {
        console.warn('无效的商品信息:', product);
        return;
      }

      const history = this.getHistory();
      const now = Date.now();
      
      // 创建浏览记录条目
      const historyItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        img: product.img,
        category: product.category,
        subcategory: product.subcategory,
        browsedAt: now,
        viewCount: 1, // 浏览次数
        tags: product.tags || [] // 商品标签
      };

      // 检查是否已存在该商品
      const existingIndex = history.findIndex(item => item.id === product.id);
      
      if (existingIndex > -1) {
        // 如果已存在，更新浏览时间和次数，并移到最前面
        const existingItem = history[existingIndex];
        historyItem.viewCount = existingItem.viewCount + 1;
        history.splice(existingIndex, 1);
      }
      
      // 添加到开头
      history.unshift(historyItem);
      
      // 限制记录数量
      if (history.length > MAX_HISTORY_SIZE) {
        history.splice(MAX_HISTORY_SIZE);
      }
      
      // 保存到本地存储
      uni.setStorageSync(STORAGE_KEY, history);
      console.log('✅ 商品浏览记录已保存:', product.name);
      
    } catch (error) {
      console.error('❌ 保存浏览记录失败:', error);
    }
  }

  /**
   * 获取最近浏览的商品（用于推荐）
   * @param {Number} limit 返回数量限制
   * @returns {Array} 最近浏览的商品列表
   */
  static getRecentProducts(limit = 10) {
    const history = this.getHistory();
    return history.slice(0, limit);
  }

  /**
   * 根据浏览记录获取用户偏好的分类
   * @param {Number} limit 返回分类数量限制
   * @returns {Array} 偏好分类列表
   */
  static getPreferredCategories(limit = 5) {
    const history = this.getHistory();
    const categoryCount = {};
    
    // 统计分类浏览频次
    history.forEach(item => {
      if (item.category) {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + item.viewCount;
      }
      if (item.subcategory) {
        categoryCount[item.subcategory] = (categoryCount[item.subcategory] || 0) + (item.viewCount * 0.5);
      }
    });
    
    // 按频次排序
    const sortedCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([category, count]) => ({ category, count }));
    
    console.log('🎯 用户偏好分类:', sortedCategories);
    return sortedCategories;
  }

  /**
   * 获取推荐参数（用于API调用）
   * @returns {Object} 推荐参数对象
   */
  static getRecommendationParams() {
    const recentProducts = this.getRecentProducts(5);
    const preferredCategories = this.getPreferredCategories(3);
    
    return {
      recentProductIds: recentProducts.map(p => p.id),
      preferredCategories: preferredCategories.map(c => c.category),
      historySize: this.getHistory().length
    };
  }

  /**
   * 获取浏览记录统计信息
   * @returns {Object} 统计信息
   */
  static getStatistics() {
    const history = this.getHistory();
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    
    return {
      total: history.length,
      todayCount: history.filter(item => item.browsedAt > oneDayAgo).length,
      weekCount: history.filter(item => item.browsedAt > oneWeekAgo).length,
      totalViewCount: history.reduce((sum, item) => sum + item.viewCount, 0),
      mostViewedProduct: history.length > 0 ? history.reduce((max, item) => 
        item.viewCount > max.viewCount ? item : max, history[0]) : null
    };
  }

  /**
   * 清空浏览记录
   */
  static clearHistory() {
    try {
      uni.removeStorageSync(STORAGE_KEY);
      console.log('🗑️ 浏览记录已清空');
    } catch (error) {
      console.error('❌ 清空浏览记录失败:', error);
    }
  }

  /**
   * 删除指定商品的浏览记录
   * @param {String} productId 商品ID
   */
  static removeProduct(productId) {
    try {
      const history = this.getHistory();
      const filteredHistory = history.filter(item => item.id !== productId);
      uni.setStorageSync(STORAGE_KEY, filteredHistory);
      console.log('🗑️ 已删除商品浏览记录:', productId);
    } catch (error) {
      console.error('❌ 删除商品浏览记录失败:', error);
    }
  }

  /**
   * 导出浏览记录（用于备份或分析）
   * @returns {String} JSON格式的浏览记录
   */
  static exportHistory() {
    const history = this.getHistory();
    const stats = this.getStatistics();
    
    return JSON.stringify({
      exportTime: new Date().toISOString(),
      statistics: stats,
      history: history
    }, null, 2);
  }
}

export default BrowsingHistory;
