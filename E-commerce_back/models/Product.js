const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '产品名称是必需的'],
    trim: true,
    maxlength: [100, '产品名称最多100个字符']
  },
  description: {
    type: String,
    required: [true, '产品描述是必需的'],
    maxlength: [1000, '产品描述最多1000个字符']
  },
  shortDescription: {
    type: String,
    maxlength: [200, '简短描述最多200个字符']
  },
  price: {
    type: Number,
    required: [true, '产品价格是必需的'],
    min: [0, '价格不能为负数']
  },
  originalPrice: {
    type: Number,
    min: [0, '原价不能为负数']
  },
  images: [{
    type: String,
    required: true
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, '产品分类是必需的']
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    trim: true
  },
  stock: {
    type: Number,
    required: [true, '库存数量是必需的'],
    min: [0, '库存不能为负数'],
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: [0, '低库存阈值不能为负数']
  },
  weight: {
    type: Number,
    min: [0, '重量不能为负数']
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  tags: [String],
  specifications: [{
    name: String,
    value: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  variants: [{
    name: String,
    options: [String],
    price: Number,
    stock: Number
  }],
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingCost: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：折扣百分比
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// 虚拟字段：是否有库存
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// 虚拟字段：是否低库存
productSchema.virtual('lowStock').get(function() {
  return this.stock <= this.lowStockThreshold && this.stock > 0;
});

// 更新评分
productSchema.methods.updateRating = function() {
  if (this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating.average = totalRating / this.reviews.length;
    this.rating.count = this.reviews.length;
  }
};

// 添加评论
productSchema.methods.addReview = function(userId, rating, comment) {
  this.reviews.push({
    user: userId,
    rating,
    comment
  });
  this.updateRating();
  return this.save();
};

// 索引
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema); 