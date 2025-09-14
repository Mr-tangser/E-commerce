/**
 * 商品收藏模型 - 用户收藏商品数据结构
 * 支持商品收藏、取消收藏、收藏列表查询等功能
 */

const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  // 用户ID
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, '用户ID是必需的']
  },
  
  // 商品ID
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: [true, '商品ID是必需的']
  },
  
  // 收藏时的商品价格（用于降价通知）
  favoritePrice: {
    type: Number,
    required: [true, '收藏时的价格是必需的']
  },
  
  // 收藏类型
  type: {
    type: String,
    enum: ['product', 'content'], // product: 商品收藏, content: 内容收藏
    default: 'product'
  },
  
  // 是否开启降价通知
  priceNotification: {
    type: Boolean,
    default: true
  },
  
  // 收藏状态
  isActive: {
    type: Boolean,
    default: true
  },
  
  // 备注信息
  note: {
    type: String,
    maxlength: [200, '备注最多200个字符']
  }
}, {
  timestamps: true, // 自动添加 createdAt 和 updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * 复合唯一索引 - 防止用户重复收藏同一商品
 */
favoriteSchema.index({ user: 1, product: 1 }, { unique: true });

/**
 * 其他索引 - 提高查询性能
 */
favoriteSchema.index({ user: 1, createdAt: -1 }); // 用户收藏列表按时间排序
favoriteSchema.index({ product: 1 }); // 商品收藏统计
favoriteSchema.index({ isActive: 1 }); // 活跃状态筛选

/**
 * 虚拟字段：计算降价金额
 */
favoriteSchema.virtual('priceDecrease').get(function() {
  if (this.populated('product') && this.product.price < this.favoritePrice) {
    return this.favoritePrice - this.product.price;
  }
  return 0;
});

/**
 * 静态方法：检查用户是否收藏了某商品
 * @param {ObjectId} userId - 用户ID
 * @param {ObjectId} productId - 商品ID
 * @returns {boolean} 是否已收藏
 */
favoriteSchema.statics.isUserFavorited = async function(userId, productId) {
  const favorite = await this.findOne({
    user: userId,
    product: productId,
    isActive: true
  });
  return !!favorite;
};

/**
 * 静态方法：获取商品的收藏数量
 * @param {ObjectId} productId - 商品ID
 * @returns {number} 收藏数量
 */
favoriteSchema.statics.getProductFavoriteCount = async function(productId) {
  return await this.countDocuments({
    product: productId,
    isActive: true
  });
};

/**
 * 静态方法：获取用户收藏统计
 * @param {ObjectId} userId - 用户ID
 * @returns {Object} 收藏统计
 */
favoriteSchema.statics.getUserFavoriteStats = async function(userId) {
  const productCount = await this.countDocuments({
    user: userId,
    type: 'product',
    isActive: true
  });
  
  const contentCount = await this.countDocuments({
    user: userId,
    type: 'content',
    isActive: true
  });
  
  return {
    productCount,
    contentCount,
    totalCount: productCount + contentCount
  };
};

/**
 * 实例方法：检查是否有降价
 * @returns {boolean} 是否降价
 */
favoriteSchema.methods.hasDiscount = function() {
  if (this.populated('product')) {
    return this.product.price < this.favoritePrice;
  }
  return false;
};

/**
 * 中间件：删除时更新相关统计
 */
favoriteSchema.post('remove', async function() {
  // 这里可以添加删除收藏后的后续处理逻辑
  // 比如更新商品收藏数量、用户统计等
});

/**
 * 中间件：保存前验证
 */
favoriteSchema.pre('save', async function(next) {
  // 确保收藏的商品存在且处于激活状态
  if (this.isNew && this.type === 'product') {
    const Product = mongoose.model('Product');
    const product = await Product.findById(this.product);
    
    if (!product || !product.isActive) {
      const error = new Error('商品不存在或已下架');
      error.statusCode = 400;
      return next(error);
    }
    
    // 设置收藏时的价格
    if (!this.favoritePrice) {
      this.favoritePrice = product.price;
    }
  }
  
  next();
});

module.exports = mongoose.model('Favorite', favoriteSchema);
