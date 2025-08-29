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
  memberPrice: {
    type: Number,
    min: [0, '会员价不能为负数']
  },
  points: {
    type: Number,
    default: 0,
    min: [0, '积分不能为负数']
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
    },
    // 评价分布统计
    distribution: {
      excellent: { type: Number, default: 0 }, // 5星好评
      good: { type: Number, default: 0 },      // 4星好评
      fair: { type: Number, default: 0 },      // 3星中评
      poor: { type: Number, default: 0 },      // 2星中评
      terrible: { type: Number, default: 0 }   // 1星差评
    },
    // 统计数据
    stats: {
      goodRate: { type: Number, default: 0 },    // 好评率 (4-5星)
      mediumRate: { type: Number, default: 0 },  // 中评率 (3星)
      badRate: { type: Number, default: 0 }      // 差评率 (1-2星)
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String, // 用户昵称
    userAvatar: String, // 用户头像
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true
    },
    images: [String], // 评价图片
    videos: [String], // 评价视频
    variant: {
      color: String, // 购买的颜色
      size: String,  // 购买的尺码
      quantity: Number // 购买数量
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    likes: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  variants: [{
    name: {
      type: String,
      required: true // 如：颜色、尺码
    },
    options: [{
      value: String, // 选项值：如白底红点、蓝色、M、L
      price: Number, // 该选项的价格差异
      stock: Number, // 该选项的库存
      image: String, // 该选项的展示图片
      isDefault: Boolean // 是否为默认选项
    }]
  }],
  
  // 服务保障
  services: [{
    name: String, // 服务名称：如退款保证、物流配送
    description: String, // 服务描述
    icon: String // 服务图标
  }],
  
  // 优惠券配置
  coupons: [{
    couponType: { type: String }, // 优惠券类型：满减、折扣
    condition: { type: Number }, // 使用条件：如满19元
    discount: { type: Number }, // 优惠金额：如减5元
    description: { type: String } // 优惠描述
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
    },
    // 配送区域限制
    deliveryAreas: [String], // 支持配送的地区
    estimatedDeliveryTime: String // 预计配送时间
  },
  
  // 详情页面配置
  detailImages: [String], // 商品详情图片
  videoUrl: String, // 商品视频
  
  // 销售数据
  sales: {
    totalSold: { type: Number, default: 0 }, // 总销量
    monthlySold: { type: Number, default: 0 }, // 月销量
    weeklySold: { type: Number, default: 0 }  // 周销量
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
    this.rating.average = Number((totalRating / this.reviews.length).toFixed(1));
    this.rating.count = this.reviews.length;
    
    // 重置分布统计
    this.rating.distribution = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      terrible: 0
    };
    
    // 统计各星级分布
    this.reviews.forEach(review => {
      switch(review.rating) {
        case 5:
          this.rating.distribution.excellent++;
          break;
        case 4:
          this.rating.distribution.good++;
          break;
        case 3:
          this.rating.distribution.fair++;
          break;
        case 2:
          this.rating.distribution.poor++;
          break;
        case 1:
          this.rating.distribution.terrible++;
          break;
      }
    });
    
    // 计算好评率、中评率、差评率
    const totalCount = this.rating.count;
    const goodCount = this.rating.distribution.excellent + this.rating.distribution.good;
    const mediumCount = this.rating.distribution.fair;
    const badCount = this.rating.distribution.poor + this.rating.distribution.terrible;
    
    this.rating.stats.goodRate = Number(((goodCount / totalCount) * 100).toFixed(1));
    this.rating.stats.mediumRate = Number(((mediumCount / totalCount) * 100).toFixed(1));
    this.rating.stats.badRate = Number(((badCount / totalCount) * 100).toFixed(1));
  }
};

// 添加评论
productSchema.methods.addReview = function(reviewData) {
  this.reviews.push({
    user: reviewData.userId,
    username: reviewData.username,
    userAvatar: reviewData.userAvatar,
    rating: reviewData.rating,
    comment: reviewData.comment,
    images: reviewData.images || [],
    videos: reviewData.videos || [],
    variant: reviewData.variant || {},
    isAnonymous: reviewData.isAnonymous || false
  });
  this.updateRating();
  return this.save();
};

// 获取评价统计
productSchema.methods.getReviewStats = function() {
  return {
    total: this.rating.count,
    average: this.rating.average,
    distribution: this.rating.distribution,
    stats: this.rating.stats
  };
};

// 虚拟字段：会员折扣率
productSchema.virtual('memberDiscountRate').get(function() {
  if (this.memberPrice && this.price > this.memberPrice) {
    return Math.round(((this.price - this.memberPrice) / this.price) * 100);
  }
  return 0;
});

// 虚拟字段：是否有会员价
productSchema.virtual('hasMemberPrice').get(function() {
  return this.memberPrice && this.memberPrice < this.price;
});

// 虚拟字段：获取默认变体选项
productSchema.virtual('defaultVariants').get(function() {
  const defaults = {};
  if (this.variants && Array.isArray(this.variants)) {
    this.variants.forEach(variant => {
      if (variant && variant.options && Array.isArray(variant.options)) {
        const defaultOption = variant.options.find(option => option && option.isDefault);
        if (defaultOption) {
          defaults[variant.name] = defaultOption;
        }
      }
    });
  }
  return defaults;
});

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