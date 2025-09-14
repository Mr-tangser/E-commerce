/**
 * 商品收藏管理工具类
 * 提供收藏、取消收藏、收藏状态查询等功能
 */

import ENV_CONFIG from '../config/env.js';

class FavoriteManager {
  constructor() {
    this.baseUrl = ENV_CONFIG.BASE_URL;
    this.favoritesCache = new Map(); // 本地缓存收藏状态
  }

  /**
   * 获取请求头
   * @returns {Object} 包含认证信息的请求头
   */
  getHeaders() {
    const token = uni.getStorageSync('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  /**
   * 检查用户登录状态
   * @returns {boolean} 是否已登录
   */
  isLoggedIn() {
    const token = uni.getStorageSync('token');
    return !!token;
  }

  /**
   * 构建查询字符串（兼容性更好）
   * @param {Object} params - 参数对象
   * @returns {string} 查询字符串
   */
  buildQueryString(params) {
    const parts = [];
    for (const key in params) {
      if (params.hasOwnProperty(key) && params[key] !== null && params[key] !== undefined) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
      }
    }
    return parts.join('&');
  }

  /**
   * 添加商品到收藏
   * @param {string} productId - 商品ID
   * @param {Object} options - 收藏选项
   * @returns {Promise<Object>} API响应
   */
  async addFavorite(productId, options = {}) {
    try {
      if (!this.isLoggedIn()) {
        throw new Error('请先登录后再收藏商品');
      }

      console.log('📌 添加收藏:', productId);

      const response = await new Promise((resolve, reject) => {
        uni.request({
          url: `${this.baseUrl}/favorites`,
          method: 'POST',
          header: this.getHeaders(),
          data: {
            productId: productId,
            type: options.type || 'product',
            priceNotification: options.priceNotification !== false,
            note: options.note || ''
          },
          timeout: 10000,
          success: resolve,
          fail: reject
        });
      });

      if (response.statusCode === 201 && response.data?.success) {
        // 更新本地缓存
        this.favoritesCache.set(productId, true);
        
        console.log('✅ 收藏成功:', response.data.message);
        return {
          success: true,
          message: response.data.message || '收藏成功',
          data: response.data.data
        };
      } else {
        throw new Error(response.data?.error?.message || '收藏失败');
      }

    } catch (error) {
      console.error('❌ 添加收藏失败:', error);
      return {
        success: false,
        message: error.message || '收藏失败，请重试'
      };
    }
  }

  /**
   * 取消商品收藏
   * @param {string} productId - 商品ID
   * @returns {Promise<Object>} API响应
   */
  async removeFavorite(productId) {
    try {
      if (!this.isLoggedIn()) {
        throw new Error('请先登录');
      }

      console.log('❌ 取消收藏:', productId);

      const response = await new Promise((resolve, reject) => {
        uni.request({
          url: `${this.baseUrl}/favorites/${productId}`,
          method: 'DELETE',
          header: this.getHeaders(),
          timeout: 10000,
          success: resolve,
          fail: reject
        });
      });

      if (response.statusCode === 200 && response.data?.success) {
        // 更新本地缓存
        this.favoritesCache.set(productId, false);
        
        console.log('✅ 取消收藏成功:', response.data.message);
        return {
          success: true,
          message: response.data.message || '取消收藏成功'
        };
      } else {
        throw new Error(response.data?.error?.message || '取消收藏失败');
      }

    } catch (error) {
      console.error('❌ 取消收藏失败:', error);
      return {
        success: false,
        message: error.message || '取消收藏失败，请重试'
      };
    }
  }

  /**
   * 切换商品收藏状态
   * @param {string} productId - 商品ID
   * @param {Object} options - 收藏选项
   * @returns {Promise<Object>} 操作结果
   */
  async toggleFavorite(productId, options = {}) {
    try {
      const isFavorited = await this.checkFavoriteStatus(productId);
      
      if (isFavorited) {
        return await this.removeFavorite(productId);
      } else {
        return await this.addFavorite(productId, options);
      }
    } catch (error) {
      console.error('❌ 切换收藏状态失败:', error);
      return {
        success: false,
        message: error.message || '操作失败，请重试'
      };
    }
  }

  /**
   * 检查商品收藏状态
   * @param {string} productId - 商品ID
   * @returns {Promise<boolean>} 是否已收藏
   */
  async checkFavoriteStatus(productId) {
    try {
      if (!this.isLoggedIn()) {
        return false;
      }

      // 优先从缓存中获取
      if (this.favoritesCache.has(productId)) {
        return this.favoritesCache.get(productId);
      }

      console.log('🔍 检查收藏状态:', productId);

      const response = await new Promise((resolve, reject) => {
        uni.request({
          url: `${this.baseUrl}/favorites/check/${productId}`,
          method: 'GET',
          header: this.getHeaders(),
          timeout: 8000,
          success: resolve,
          fail: reject
        });
      });

      if (response.statusCode === 200 && response.data?.success) {
        const isFavorited = response.data.data?.isFavorited || false;
        
        // 更新缓存
        this.favoritesCache.set(productId, isFavorited);
        
        return isFavorited;
      }

      return false;

    } catch (error) {
      console.error('❌ 检查收藏状态失败:', error);
      return false;
    }
  }

  /**
   * 批量检查商品收藏状态
   * @param {string[]} productIds - 商品ID列表
   * @returns {Promise<Object>} 收藏状态映射
   */
  async checkBatchFavoriteStatus(productIds) {
    try {
      if (!this.isLoggedIn() || !Array.isArray(productIds) || productIds.length === 0) {
        return {};
      }

      // 过滤掉已缓存的商品ID
      const uncachedIds = productIds.filter(id => !this.favoritesCache.has(id));
      
      let result = {};
      
      // 先从缓存中获取已知状态
      productIds.forEach(id => {
        if (this.favoritesCache.has(id)) {
          result[id] = this.favoritesCache.get(id);
        }
      });

      // 如果有未缓存的商品，批量查询
      if (uncachedIds.length > 0) {
        console.log('🔍 批量检查收藏状态:', uncachedIds);

        const response = await new Promise((resolve, reject) => {
          uni.request({
            url: `${this.baseUrl}/favorites/check-batch`,
            method: 'POST',
            header: this.getHeaders(),
            data: {
              productIds: uncachedIds
            },
            timeout: 10000,
            success: resolve,
            fail: reject
          });
        });

        if (response.statusCode === 200 && response.data?.success) {
          const batchResult = response.data.data || {};
          
          // 更新缓存和结果
          Object.entries(batchResult).forEach(([id, isFavorited]) => {
            this.favoritesCache.set(id, isFavorited);
            result[id] = isFavorited;
          });
        }
      }

      return result;

    } catch (error) {
      console.error('❌ 批量检查收藏状态失败:', error);
      return {};
    }
  }

  /**
   * 获取用户收藏列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 收藏列表
   */
  async getFavoriteList(params = {}) {
    try {
      if (!this.isLoggedIn()) {
        throw new Error('请先登录');
      }

      // 手动构建查询参数，兼容性更好
      const queryString = this.buildQueryString({
        page: params.page || 1,
        limit: params.limit || 12,
        type: params.type || 'product'
      });

      console.log('📋 获取收藏列表:', params);

      const response = await new Promise((resolve, reject) => {
        uni.request({
          url: `${this.baseUrl}/favorites?${queryString}`,
          method: 'GET',
          header: this.getHeaders(),
          timeout: 10000,
          success: resolve,
          fail: reject
        });
      });

      if (response.statusCode === 200 && response.data?.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data?.error?.message || '获取收藏列表失败');
      }

    } catch (error) {
      console.error('❌ 获取收藏列表失败:', error);
      return {
        success: false,
        message: error.message || '获取收藏列表失败'
      };
    }
  }

  /**
   * 获取用户收藏统计
   * @returns {Promise<Object>} 收藏统计
   */
  async getFavoriteStats() {
    try {
      if (!this.isLoggedIn()) {
        return {
          productCount: 0,
          contentCount: 0,
          totalCount: 0
        };
      }

      const response = await new Promise((resolve, reject) => {
        uni.request({
          url: `${this.baseUrl}/favorites/stats`,
          method: 'GET',
          header: this.getHeaders(),
          timeout: 8000,
          success: resolve,
          fail: reject
        });
      });

      if (response.statusCode === 200 && response.data?.success) {
        return response.data.data;
      }

      return {
        productCount: 0,
        contentCount: 0,
        totalCount: 0
      };

    } catch (error) {
      console.error('❌ 获取收藏统计失败:', error);
      return {
        productCount: 0,
        contentCount: 0,
        totalCount: 0
      };
    }
  }

  /**
   * 批量取消收藏
   * @param {string[]} productIds - 商品ID列表
   * @returns {Promise<Object>} 操作结果
   */
  async batchRemoveFavorites(productIds) {
    try {
      if (!this.isLoggedIn()) {
        throw new Error('请先登录');
      }

      if (!Array.isArray(productIds) || productIds.length === 0) {
        throw new Error('请选择要取消收藏的商品');
      }

      console.log('❌ 批量取消收藏:', productIds);

      const response = await new Promise((resolve, reject) => {
        uni.request({
          url: `${this.baseUrl}/favorites/batch`,
          method: 'DELETE',
          header: this.getHeaders(),
          data: {
            productIds: productIds
          },
          timeout: 10000,
          success: resolve,
          fail: reject
        });
      });

      if (response.statusCode === 200 && response.data?.success) {
        // 更新本地缓存
        productIds.forEach(id => {
          this.favoritesCache.set(id, false);
        });
        
        console.log('✅ 批量取消收藏成功');
        return {
          success: true,
          message: response.data.message || '批量取消收藏成功',
          modifiedCount: response.data.data?.modifiedCount || 0
        };
      } else {
        throw new Error(response.data?.error?.message || '批量取消收藏失败');
      }

    } catch (error) {
      console.error('❌ 批量取消收藏失败:', error);
      return {
        success: false,
        message: error.message || '批量取消收藏失败'
      };
    }
  }

  /**
   * 获取降价商品列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 降价商品列表
   */
  async getPriceDrops(params = {}) {
    try {
      if (!this.isLoggedIn()) {
        throw new Error('请先登录');
      }

      const queryString = this.buildQueryString({
        page: params.page || 1,
        limit: params.limit || 12
      });

      const response = await new Promise((resolve, reject) => {
        uni.request({
          url: `${this.baseUrl}/favorites/price-drops?${queryString}`,
          method: 'GET',
          header: this.getHeaders(),
          timeout: 10000,
          success: resolve,
          fail: reject
        });
      });

      if (response.statusCode === 200 && response.data?.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data?.error?.message || '获取降价商品失败');
      }

    } catch (error) {
      console.error('❌ 获取降价商品失败:', error);
      return {
        success: false,
        message: error.message || '获取降价商品失败'
      };
    }
  }

  /**
   * 清除本地缓存
   */
  clearCache() {
    this.favoritesCache.clear();
    console.log('🧹 收藏缓存已清除');
  }

  /**
   * 更新本地缓存
   * @param {string} productId - 商品ID
   * @param {boolean} isFavorited - 是否收藏
   */
  updateCache(productId, isFavorited) {
    this.favoritesCache.set(productId, isFavorited);
  }

  /**
   * 获取缓存大小
   * @returns {number} 缓存条目数
   */
  getCacheSize() {
    return this.favoritesCache.size;
  }
}

// 创建单例实例
const favoriteManager = new FavoriteManager();

export default favoriteManager;
