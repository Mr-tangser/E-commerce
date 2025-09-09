/**
 * 前端推荐服务
 * 用于获取个性化推荐商品
 */

import api from './api.js';
import BrowsingHistory from './browsing-history.js';

class RecommendationService {
  
  /**
   * 获取个性化推荐商品
   * @param {Number} limit 推荐商品数量限制
   * @param {Object} realtimeContext 实时上下文（如刚点击的商品）
   * @returns {Array} 推荐商品列表
   */
  static async getPersonalizedRecommendations(limit = 10, realtimeContext = null) {
    try {
      console.log('🎯 开始获取个性化推荐...');
      if (realtimeContext) {
        console.log('⚡ 实时推荐上下文:', realtimeContext.name);
      }
      
      // 获取用户浏览历史参数
      const browsingParams = BrowsingHistory.getRecommendationParams();
      
      // 融入实时上下文
      if (realtimeContext) {
        // 将刚点击的商品信息加入推荐参数
        browsingParams.realtimeClick = {
          productId: realtimeContext.id,
          category: realtimeContext.category,
          subcategory: realtimeContext.subcategory,
          tags: realtimeContext.tags || [],
          timestamp: Date.now(),
          weight: 2.0 // 实时点击权重更高
        };
        
        // 更新偏好分类（临时性增强）
        if (realtimeContext.category) {
          const tempCategory = { category: realtimeContext.category, count: 5 }; // 临时高权重
          browsingParams.preferredCategories = [tempCategory, ...browsingParams.preferredCategories.slice(0, 2)];
        }
      }
      
      console.log('📊 增强的浏览历史参数:', browsingParams);
      
      let recommendations = [];
      
      if (browsingParams.recentProductIds.length > 0 || browsingParams.preferredCategories.length > 0 || realtimeContext) {
        // 有浏览历史或实时上下文，获取个性化推荐
        console.log('👤 获取个性化推荐（含实时增强）');
        const response = await api.product.getRecommendationsByHistory(browsingParams);
        
        if (response && response.success && response.data && response.data.products) {
          recommendations = response.data.products.map(product => {
            // 保持推荐算法的原始产品数据，同时添加前端需要的字段
            let reason = product.reason || '为您推荐';
            
            // 根据实时上下文调整推荐理由
            if (realtimeContext && product.category === realtimeContext.category) {
              reason = `同类推荐：${realtimeContext.category}`;
            } else if (realtimeContext && product.tags && realtimeContext.tags) {
              const commonTags = product.tags.filter(tag => realtimeContext.tags.includes(tag));
              if (commonTags.length > 0) {
                reason = `相关推荐：${commonTags[0]}`;
              }
            }
            
            return {
              ...api.transformers.productToFrontend(product),
              reason: reason,
              weight: product.weight || 0.5,
              isRealtimeRecommendation: !!realtimeContext
            };
          });
          console.log('✅ 个性化推荐获取成功:', recommendations.length, '个商品');
        }
      }
      
      // 如果个性化推荐商品不足，补充通用推荐
      if (recommendations.length < limit) {
        console.log('🔄 补充通用推荐商品');
        const remaining = limit - recommendations.length;
        const generalRecommendations = await this.getGeneralRecommendations(remaining);
        
        // 过滤掉已推荐的商品和实时点击的商品
        const existingIds = new Set(recommendations.map(p => p.id));
        if (realtimeContext) {
          existingIds.add(realtimeContext.id);
        }
        const filteredGeneral = generalRecommendations.filter(p => !existingIds.has(p.id));
        
        recommendations.push(...filteredGeneral);
      }
      
      // 优化排序：实时推荐的商品优先
      if (realtimeContext) {
        recommendations.sort((a, b) => {
          if (a.isRealtimeRecommendation && !b.isRealtimeRecommendation) return -1;
          if (!a.isRealtimeRecommendation && b.isRealtimeRecommendation) return 1;
          return (b.weight || 0) - (a.weight || 0);
        });
      }
      
      return recommendations.slice(0, limit);
      
    } catch (error) {
      console.error('❌ 获取个性化推荐失败:', error);
      // 降级到通用推荐
      return await this.getGeneralRecommendations(limit);
    }
  }
  
  /**
   * 获取通用推荐商品
   * @param {Number} limit 推荐商品数量限制
   * @returns {Array} 推荐商品列表
   */
  static async getGeneralRecommendations(limit = 10) {
    try {
      console.log('🏪 获取通用推荐商品');
      
      const response = await api.product.getRecommendedProducts({ limit });
      
      if (response && response.success && response.data && response.data.products) {
        const recommendations = response.data.products.map(product => ({
          ...api.transformers.productToFrontend(product),
          reason: product.reason || '精选推荐',
          weight: product.weight || 0.5
        }));
        
        console.log('✅ 通用推荐获取成功:', recommendations.length, '个商品');
        return recommendations;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ 获取通用推荐失败:', error);
      return [];
    }
  }
  
  /**
   * 获取相似商品推荐
   * @param {String} productId 商品ID
   * @param {Number} limit 推荐商品数量限制
   * @returns {Array} 相似商品列表
   */
  static async getSimilarProducts(productId, limit = 6) {
    try {
      console.log('🔍 获取相似商品:', productId);
      
      const response = await api.product.getSimilarProducts(productId, { limit });
      
      if (response && response.success && response.data && response.data.products) {
        const similarProducts = response.data.products.map(product => ({
          ...api.transformers.productToFrontend(product),
          reason: '相似商品',
          weight: 0.8
        }));
        
        console.log('✅ 相似商品获取成功:', similarProducts.length, '个商品');
        return similarProducts;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ 获取相似商品失败:', error);
      return [];
    }
  }
  
  /**
   * 获取新品推荐
   * @param {Number} limit 推荐商品数量限制
   * @returns {Array} 新品推荐列表
   */
  static async getNewProductRecommendations(limit = 8) {
    try {
      console.log('🆕 获取新品推荐');
      
      // 获取用户偏好分类
      const preferredCategories = BrowsingHistory.getPreferredCategories(3);
      const categoryNames = preferredCategories.map(c => c.category);
      
      const response = await api.product.getNewProductRecommendations({ 
        preferredCategories: categoryNames, 
        limit 
      });
      
      if (response && response.success && response.data && response.data.products) {
        const newProducts = response.data.products.map(product => ({
          ...api.transformers.productToFrontend(product),
          reason: product.reason || '新品推荐',
          weight: product.weight || 0.3
        }));
        
        console.log('✅ 新品推荐获取成功:', newProducts.length, '个商品');
        return newProducts;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ 获取新品推荐失败:', error);
      return [];
    }
  }
  
  /**
   * 获取用户浏览统计信息
   * @returns {Object} 浏览统计信息
   */
  static getBrowsingStatistics() {
    return BrowsingHistory.getStatistics();
  }
  
  /**
   * 获取用户偏好分析
   * @returns {Object} 用户偏好信息
   */
  static getUserPreferences() {
    const stats = BrowsingHistory.getStatistics();
    const preferredCategories = BrowsingHistory.getPreferredCategories(5);
    const recentProducts = BrowsingHistory.getRecentProducts(10);
    
    return {
      totalBrowsed: stats.total,
      todayBrowsed: stats.todayCount,
      weekBrowsed: stats.weekCount,
      mostViewedProduct: stats.mostViewedProduct,
      preferredCategories,
      recentProducts,
      hasPreferences: preferredCategories.length > 0 || recentProducts.length > 0
    };
  }
  
  /**
   * 清除推荐缓存（当用户清除浏览记录时调用）
   */
  static clearRecommendationCache() {
    console.log('🗑️ 清除推荐缓存');
    // 可以在这里清除相关缓存
  }
}

export default RecommendationService;
