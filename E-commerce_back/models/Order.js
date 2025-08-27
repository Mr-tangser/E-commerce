const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, '数量至少为1']
    },
    price: {
      type: Number,
      required: true,
      min: [0, '价格不能为负数']
    },
    total: {
      type: Number,
      required: true,
      min: [0, '总价不能为负数']
    },
    variant: {
      name: String,
      option: String
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, '小计不能为负数']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, '税费不能为负数']
  },
  shipping: {
    cost: {
      type: Number,
      default: 0,
      min: [0, '运费不能为负数']
    },
    method: String,
    trackingNumber: String,
    estimatedDelivery: Date
  },
  discount: {
    amount: {
      type: Number,
      default: 0,
      min: [0, '折扣不能为负数']
    },
    code: String,
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed'
    }
  },
  total: {
    type: Number,
    required: true,
    min: [0, '总价不能为负数']
  },
  payment: {
    method: {
      type: String,
      required: true,
      enum: ['credit_card', 'debit_card', 'paypal', 'alipay', 'wechat', 'bank_transfer']
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  shippingAddress: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    }
  },
  billingAddress: {
    firstName: String,
    lastName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  notes: {
    customer: String,
    internal: String
  },
  timeline: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：订单状态中文
orderSchema.virtual('statusText').get(function() {
  const statusMap = {
    pending: '待确认',
    confirmed: '已确认',
    processing: '处理中',
    shipped: '已发货',
    delivered: '已送达',
    cancelled: '已取消',
    refunded: '已退款'
  };
  return statusMap[this.status] || this.status;
});

// 虚拟字段：支付状态中文
orderSchema.virtual('paymentStatusText').get(function() {
  const statusMap = {
    pending: '待支付',
    paid: '已支付',
    failed: '支付失败',
    refunded: '已退款'
  };
  return statusMap[this.payment.status] || this.payment.status;
});

// 虚拟字段：订单项数量
orderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// 生成订单号
orderSchema.statics.generateOrderNumber = function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${year}${month}${day}${random}`;
};

// 更新订单状态
orderSchema.methods.updateStatus = function(newStatus, note, updatedBy) {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    note,
    updatedBy
  });
  return this.save();
};

// 计算订单总额
orderSchema.methods.calculateTotal = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
  this.total = this.subtotal + this.tax + this.shipping.cost - this.discount.amount;
  return this.total;
};

// 索引
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'shipping.trackingNumber': 1 });

module.exports = mongoose.model('Order', orderSchema); 