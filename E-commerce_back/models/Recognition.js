const mongoose = require('mongoose');

const recognitionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  recognitionType: {
    type: String,
    enum: ['multi-object', 'general', 'url'],
    default: 'general'
  },
  results: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  confidence: {
    type: Number,
    default: 0
  },
  topResult: {
    name: {
      type: String,
      default: ''
    },
    score: {
      type: Number,
      default: 0
    },
    baike_info: {
      type: Object,
      default: null
    }
  },
  baiduLogId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'processing'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时间中间件
recognitionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 索引
recognitionSchema.index({ userId: 1, createdAt: -1 });
recognitionSchema.index({ baiduLogId: 1 });
recognitionSchema.index({ 'topResult.name': 'text' });

module.exports = mongoose.model('Recognition', recognitionSchema);
