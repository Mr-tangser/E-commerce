const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '分类名称是必需的'],
    trim: true,
    maxlength: [50, '分类名称最多50个字符']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, '分类描述最多500个字符']
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0,
    min: [0, '层级不能为负数']
  },
  path: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  image: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  meta: {
    title: String,
    description: String,
    keywords: [String]
  },
  attributes: [{
    name: String,
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'select', 'multiselect']
    },
    required: Boolean,
    options: [String],
    defaultValue: mongoose.Schema.Types.Mixed
  }],
  
  // 首页展示配置
  homeDisplay: {
    showOnHome: {
      type: Boolean,
      default: false
    },
    homeOrder: {
      type: Number,
      default: 0
    },
    homeTitle: String, // 首页显示的标题，如"手机专区"
    homeSubtitle: String, // 副标题
    homeIcon: String, // 首页显示的图标
    homeColor: String // 主题颜色
  },
  
  // 推荐商品（用于首页等特殊展示）
  recommendedProducts: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    order: {
      type: Number,
      default: 0
    },
    reason: String // 推荐理由，如"热销"、"新品"
  }],
  
  // 分类统计信息
  stats: {
    productCount: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：子分类
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// 虚拟字段：产品数量
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// 虚拟字段：完整路径名称
categorySchema.virtual('fullPath').get(function() {
  if (this.path && this.path.length > 0) {
    return this.path.map(p => p.name).join(' > ') + ' > ' + this.name;
  }
  return this.name;
});

// 生成slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  // 计算层级
  if (this.parent) {
    this.level = 1;
  } else {
    this.level = 0;
  }
  
  next();
});

// 更新路径
categorySchema.pre('save', async function(next) {
  if (this.isModified('parent')) {
    if (this.parent) {
      const parent = await this.constructor.findById(this.parent);
      if (parent) {
        this.path = [...parent.path, parent._id];
        this.level = parent.level + 1;
      }
    } else {
      this.path = [];
      this.level = 0;
    }
  }
  next();
});

// 获取所有子分类
categorySchema.methods.getAllChildren = async function() {
  const children = await this.constructor.find({ parent: this._id });
  let allChildren = [...children];
  
  for (const child of children) {
    const grandChildren = await child.getAllChildren();
    allChildren = [...allChildren, ...grandChildren];
  }
  
  return allChildren;
};

// 获取分类树
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true }).sort('sortOrder');
  const buildTree = (items, parentId = null) => {
    return items
      .filter(item => String(item.parent) === String(parentId))
      .map(item => ({
        ...item.toObject(),
        children: buildTree(items, item._id)
      }));
  };
  
  return buildTree(categories);
};

// 获取首页分类（带推荐商品）
categorySchema.statics.getHomepageCategories = async function() {
  const categories = await this.find({ 
    'homeDisplay.showOnHome': true,
    isActive: true 
  })
  .populate({
    path: 'recommendedProducts.product',
    match: { isActive: true },
    select: 'name price originalPrice memberPrice images rating sales'
  })
  .sort({ 'homeDisplay.homeOrder': 1 });
  
  return categories;
};

// 添加推荐商品
categorySchema.methods.addRecommendedProduct = function(productId, reason = '', order = 0) {
  // 检查商品是否已存在
  const existingIndex = this.recommendedProducts.findIndex(
    item => item.product.toString() === productId.toString()
  );
  
  if (existingIndex > -1) {
    // 更新现有推荐
    this.recommendedProducts[existingIndex].reason = reason;
    this.recommendedProducts[existingIndex].order = order;
  } else {
    // 添加新推荐
    this.recommendedProducts.push({
      product: productId,
      reason,
      order
    });
  }
  
  // 按order排序
  this.recommendedProducts.sort((a, b) => a.order - b.order);
  
  return this.save();
};

// 移除推荐商品
categorySchema.methods.removeRecommendedProduct = function(productId) {
  this.recommendedProducts = this.recommendedProducts.filter(
    item => item.product.toString() !== productId.toString()
  );
  return this.save();
};

// 更新商品统计
categorySchema.methods.updateProductCount = async function() {
  const Product = require('./Product');
  const count = await Product.countDocuments({ 
    category: this._id, 
    isActive: true 
  });
  
  this.stats.productCount = count;
  this.stats.lastUpdated = new Date();
  return this.save();
};

// 索引
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ isFeatured: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ path: 1 });
categorySchema.index({ 'homeDisplay.showOnHome': 1, 'homeDisplay.homeOrder': 1 });

module.exports = mongoose.model('Category', categorySchema); 