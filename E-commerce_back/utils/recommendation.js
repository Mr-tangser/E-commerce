/**
 * 商品推荐算法工具
 * 基于用户浏览历史、商品相似性、协同过滤等算法实现推荐
 */

const Product = require('../models/Product');
const Category = require('../models/Category');

class RecommendationEngine {
  
  /**
   * 基于浏览历史的推荐算法（增强版，支持实时上下文）
   * @param {Object} browsingData 浏览历史数据
   * @param {Array} browsingData.recentProductIds 最近浏览的商品ID
   * @param {Array} browsingData.preferredCategories 偏好分类
   * @param {Object} browsingData.realtimeClick 实时点击上下文
   * @param {Number} limit 推荐数量限制
   * @returns {Array} 推荐商品列表
   */
  static async getRecommendationsByHistory(browsingData, limit = 10) {
    try {
      const { recentProductIds = [], preferredCategories = [], realtimeClick = null } = browsingData;
      console.log('📊 开始基于浏览历史推荐:', { recentProductIds, preferredCategories, realtimeClick, limit });
      
      const recommendations = [];
      const excludeIds = new Set(recentProductIds);
      
      // 如果有实时点击，排除该商品
      if (realtimeClick) {
        excludeIds.add(realtimeClick.productId);
        console.log('⚡ 实时推荐增强模式，基于:', realtimeClick);
      }
      
      // 调整权重分配，实时上下文时增强相关性推荐
      const weights = realtimeClick ? {
        realtime: 0.5,    // 实时相关商品 (50%)
        similar: 0.2,     // 相似商品 (20%)
        category: 0.2,    // 分类推荐 (20%)
        hot: 0.1         // 热销商品 (10%)
      } : {
        similar: 0.4,     // 相似商品 (40%)
        category: 0.3,    // 分类推荐 (30%)
        hot: 0.2,         // 热销商品 (20%)
        topRated: 0.1     // 高评分商品 (10%)
      };
      
      // 1. 实时上下文推荐 (仅在有实时点击时)
      if (realtimeClick) {
        console.log('🔥 执行实时上下文推荐...');
        const realtimeProducts = await this.getRealtimeRecommendations(realtimeClick, Math.ceil(limit * weights.realtime), excludeIds);
        recommendations.push(...realtimeProducts.map(p => ({ 
          ...p, 
          reason: `实时推荐：${realtimeClick.category || '相关商品'}`, 
          weight: weights.realtime + 0.1, // 额外加权
          isRealtimeRecommendation: true
        })));
        realtimeProducts.forEach(p => excludeIds.add(p._id.toString()));
      }
      
      // 2. 相似商品推荐
      if (recentProductIds.length > 0) {
        const similarLimit = Math.ceil(limit * weights.similar);
        const similarProducts = await this.getSimilarProductsByIds(recentProductIds, similarLimit);
        recommendations.push(...similarProducts.map(p => ({ 
          ...p, 
          reason: '与您浏览的商品相似', 
          weight: weights.similar 
        })));
        similarProducts.forEach(p => excludeIds.add(p._id.toString()));
      }
      
      // 3. 分类推荐
      if (preferredCategories.length > 0) {
        const categoryLimit = Math.ceil(limit * weights.category);
        const categoryProducts = await this.getProductsByCategories(preferredCategories, categoryLimit, excludeIds);
        recommendations.push(...categoryProducts.map(p => ({ 
          ...p, 
          reason: '您感兴趣的分类商品', 
          weight: weights.category 
        })));
        categoryProducts.forEach(p => excludeIds.add(p._id.toString()));
      }
      
      // 4. 热销商品推荐
      const hotLimit = Math.ceil(limit * weights.hot);
      const hotProducts = await this.getHotProducts(hotLimit, excludeIds);
      recommendations.push(...hotProducts.map(p => ({ 
        ...p, 
        reason: '热销推荐', 
        weight: weights.hot 
      })));
      hotProducts.forEach(p => excludeIds.add(p._id.toString()));
      
      // 5. 高评分商品填充 (仅非实时模式)
      if (!realtimeClick) {
        const remaining = limit - recommendations.length;
        if (remaining > 0) {
          const topRatedProducts = await this.getTopRatedProducts(remaining, excludeIds);
          recommendations.push(...topRatedProducts.map(p => ({ 
            ...p, 
            reason: '好评推荐', 
            weight: weights.topRated || 0.1 
          })));
        }
      }
      
      // 智能排序：实时推荐优先，然后按权重和评分
      const sortedRecommendations = recommendations
        .sort((a, b) => {
          // 实时推荐优先
          if (a.isRealtimeRecommendation && !b.isRealtimeRecommendation) return -1;
          if (!a.isRealtimeRecommendation && b.isRealtimeRecommendation) return 1;
          
          // 按综合分数排序
          const scoreA = (a.weight || 0) * 10 + (a.rating?.average || 0);
          const scoreB = (b.weight || 0) * 10 + (b.rating?.average || 0);
          return scoreB - scoreA;
        })
        .slice(0, limit);
      
      console.log('✅ 推荐算法完成，推荐', sortedRecommendations.length, '个商品');
      if (realtimeClick) {
        console.log('⚡ 实时推荐商品数:', sortedRecommendations.filter(p => p.isRealtimeRecommendation).length);
      }
      
      return sortedRecommendations;
      
    } catch (error) {
      console.error('❌ 基于浏览历史推荐失败:', error);
      // 降级到通用推荐
      return await this.getFallbackRecommendations(limit);
    }
  }
  
  /**
   * 获取实时上下文推荐
   * @param {Object} realtimeClick 实时点击数据
   * @param {Number} limit 推荐数量限制
   * @param {Set} excludeIds 要排除的商品ID集合
   * @returns {Array} 实时推荐商品列表
   */
  static async getRealtimeRecommendations(realtimeClick, limit = 10, excludeIds = new Set()) {
    try {
      console.log('⚡ 生成实时推荐，基于:', realtimeClick);
      
      const { productId, category, subcategory, tags = [] } = realtimeClick;
      const realtimeRecommendations = [];
      
      // 构建实时推荐查询条件
      const query = {
        _id: { $nin: Array.from(excludeIds) },
        isActive: true
      };
      
      // 多层次匹配策略
      const matchStrategies = [];
      
      // 1. 相同分类 + 标签匹配 (最高优先级)
      if (category && tags.length > 0) {
        matchStrategies.push({
          query: { ...query, category, tags: { $in: tags } },
          weight: 0.9,
          reason: `${category} · ${tags[0]}`
        });
      }
      
      // 2. 相同子分类 (高优先级)
      if (subcategory) {
        matchStrategies.push({
          query: { ...query, subcategory },
          weight: 0.8,
          reason: `${subcategory || category}`
        });
      }
      
      // 3. 相同分类 (中等优先级)
      if (category) {
        matchStrategies.push({
          query: { ...query, category },
          weight: 0.7,
          reason: `${category}`
        });
      }
      
      // 4. 相同标签 (中等优先级)
      if (tags.length > 0) {
        matchStrategies.push({
          query: { ...query, tags: { $in: tags } },
          weight: 0.6,
          reason: `相关：${tags[0]}`
        });
      }
      
      // 按优先级执行匹配策略
      for (const strategy of matchStrategies) {
        if (realtimeRecommendations.length >= limit) break;
        
        const needed = limit - realtimeRecommendations.length;
        console.log(`🎯 执行匹配策略，权重:${strategy.weight}, 需要:${needed}个`);
        
        const products = await Product.find(strategy.query)
          .populate('category subcategory')
          .sort({ 
            salesCount: -1,           // 销量优先
            'rating.average': -1,     // 评分次之
            createdAt: -1            // 最新产品
          })
          .limit(needed * 2)         // 获取更多候选，后续筛选
          .lean();
        
        // 过滤已存在的商品并添加权重
        const filteredProducts = products
          .filter(p => !realtimeRecommendations.some(r => r._id.toString() === p._id.toString()))
          .slice(0, needed)
          .map(p => ({
            ...p,
            realtimeWeight: strategy.weight,
            realtimeReason: strategy.reason
          }));
        
        realtimeRecommendations.push(...filteredProducts);
        console.log(`✅ 匹配到 ${filteredProducts.length} 个商品`);
      }
      
      // 如果还不够，补充热销商品
      if (realtimeRecommendations.length < limit) {
        const remaining = limit - realtimeRecommendations.length;
        console.log(`🔄 补充热销商品 ${remaining} 个`);
        
        const hotProducts = await this.getHotProducts(remaining * 2, new Set([
          ...excludeIds, 
          ...realtimeRecommendations.map(p => p._id.toString())
        ]));
        
        const hotFiltered = hotProducts
          .slice(0, remaining)
          .map(p => ({
            ...p,
            realtimeWeight: 0.4,
            realtimeReason: '热销商品'
          }));
        
        realtimeRecommendations.push(...hotFiltered);
      }
      
      // 按实时权重排序
      const sortedRecommendations = realtimeRecommendations
        .sort((a, b) => (b.realtimeWeight || 0) - (a.realtimeWeight || 0))
        .slice(0, limit);
      
      console.log('⚡ 实时推荐完成:', sortedRecommendations.length, '个商品');
      return sortedRecommendations;
      
    } catch (error) {
      console.error('❌ 实时推荐失败:', error);
      return [];
    }
  }
  
  /**
   * 获取相似商品
   * @param {Array} productIds 参考商品ID列表
   * @param {Number} limit 数量限制
   * @returns {Array} 相似商品列表
   */
  static async getSimilarProductsByIds(productIds, limit = 5) {
    try {
      // 获取参考商品信息
      const referenceProducts = await Product.find({ 
        _id: { $in: productIds },
        isActive: true 
      }).populate('category subcategory');
      
      if (referenceProducts.length === 0) return [];
      
      // 收集参考商品的分类、标签、价格区间
      const categories = [...new Set(referenceProducts.map(p => p.category?._id).filter(Boolean))];
      const subcategories = [...new Set(referenceProducts.map(p => p.subcategory?._id).filter(Boolean))];
      const tags = [...new Set(referenceProducts.flatMap(p => p.tags || []))];
      const prices = referenceProducts.map(p => p.price);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const priceRange = {
        min: avgPrice * 0.5,
        max: avgPrice * 2
      };
      
      // 构建相似性查询
      const similarityQuery = {
        _id: { $nin: productIds },
        isActive: true,
        $or: [
          { category: { $in: categories } },
          { subcategory: { $in: subcategories } },
          { tags: { $in: tags } },
          { 
            price: { 
              $gte: priceRange.min, 
              $lte: priceRange.max 
            } 
          }
        ]
      };
      
      const similarProducts = await Product.find(similarityQuery)
        .populate('category', 'name')
        .populate('subcategory', 'name')
        .sort({ 'rating.average': -1, 'sales.totalSold': -1 })
        .limit(limit);
      
      console.log('🔍 找到', similarProducts.length, '个相似商品');
      return similarProducts;
      
    } catch (error) {
      console.error('❌ 获取相似商品失败:', error);
      return [];
    }
  }
  
  /**
   * 根据分类获取商品
   * @param {Array} categories 分类名称数组
   * @param {Number} limit 数量限制
   * @param {Set} excludeIds 排除的商品ID集合
   * @returns {Array} 分类商品列表
   */
  static async getProductsByCategories(categories, limit = 5, excludeIds = new Set()) {
    try {
      // 查找分类
      const categoryDocs = await Category.find({ 
        name: { $in: categories },
        isActive: true 
      });
      
      if (categoryDocs.length === 0) return [];
      
      const categoryIds = categoryDocs.map(c => c._id);
      
      const products = await Product.find({
        $or: [
          { category: { $in: categoryIds } },
          { subcategory: { $in: categoryIds } }
        ],
        _id: { $nin: Array.from(excludeIds) },
        isActive: true
      })
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .sort({ 'rating.average': -1, 'sales.totalSold': -1 })
      .limit(limit);
      
      console.log('🏷️ 分类推荐找到', products.length, '个商品');
      return products;
      
    } catch (error) {
      console.error('❌ 获取分类商品失败:', error);
      return [];
    }
  }
  
  /**
   * 获取热销商品
   * @param {Number} limit 数量限制
   * @param {Set} excludeIds 排除的商品ID集合
   * @returns {Array} 热销商品列表
   */
  static async getHotProducts(limit = 5, excludeIds = new Set()) {
    try {
      const products = await Product.find({
        _id: { $nin: Array.from(excludeIds) },
        isActive: true,
        'sales.totalSold': { $gt: 0 }
      })
      .populate('category', 'name')
      .sort({ 'sales.totalSold': -1, 'rating.average': -1 })
      .limit(limit);
      
      console.log('🔥 热销推荐找到', products.length, '个商品');
      return products;
      
    } catch (error) {
      console.error('❌ 获取热销商品失败:', error);
      return [];
    }
  }
  
  /**
   * 获取高评分商品
   * @param {Number} limit 数量限制
   * @param {Set} excludeIds 排除的商品ID集合
   * @returns {Array} 高评分商品列表
   */
  static async getTopRatedProducts(limit = 5, excludeIds = new Set()) {
    try {
      const products = await Product.find({
        _id: { $nin: Array.from(excludeIds) },
        isActive: true,
        'rating.count': { $gte: 5 }, // 至少5个评价
        'rating.average': { $gte: 4.0 } // 评分4.0以上
      })
      .populate('category', 'name')
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(limit);
      
      console.log('⭐ 高评分推荐找到', products.length, '个商品');
      return products;
      
    } catch (error) {
      console.error('❌ 获取高评分商品失败:', error);
      return [];
    }
  }
  
  /**
   * 降级推荐方案
   * @param {Number} limit 数量限制
   * @returns {Array} 推荐商品列表
   */
  static async getFallbackRecommendations(limit = 10) {
    try {
      console.log('🔄 启用降级推荐方案');
      
      const products = await Product.find({ isActive: true })
        .populate('category', 'name')
        .sort({ 
          isFeatured: -1, 
          'rating.average': -1, 
          'sales.totalSold': -1,
          createdAt: -1
        })
        .limit(limit);
      
      return products.map(p => ({
        ...p.toObject(),
        reason: '精选推荐',
        weight: 0.5
      }));
      
    } catch (error) {
      console.error('❌ 降级推荐失败:', error);
      return [];
    }
  }
  
  /**
   * 获取用户可能感兴趣的新品
   * @param {Array} preferredCategories 偏好分类
   * @param {Number} limit 数量限制
   * @returns {Array} 新品推荐列表
   */
  static async getNewProductRecommendations(preferredCategories = [], limit = 5) {
    try {
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      let query = {
        isActive: true,
        createdAt: { $gte: oneMonthAgo }
      };
      
      // 如果有偏好分类，优先推荐偏好分类的新品
      if (preferredCategories.length > 0) {
        const categoryDocs = await Category.find({ 
          name: { $in: preferredCategories },
          isActive: true 
        });
        const categoryIds = categoryDocs.map(c => c._id);
        
        query.$or = [
          { category: { $in: categoryIds } },
          { subcategory: { $in: categoryIds } }
        ];
      }
      
      const newProducts = await Product.find(query)
        .populate('category', 'name')
        .sort({ createdAt: -1, 'rating.average': -1 })
        .limit(limit);
      
      console.log('🆕 新品推荐找到', newProducts.length, '个商品');
      return newProducts.map(p => ({
        ...p.toObject(),
        reason: '新品推荐',
        weight: 0.3
      }));
      
    } catch (error) {
      console.error('❌ 获取新品推荐失败:', error);
      return [];
    }
  }
}

module.exports = RecommendationEngine;
