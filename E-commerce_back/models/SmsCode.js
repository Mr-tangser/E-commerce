/**
 * 短信验证码模型
 * 用于存储和管理手机验证码
 */

const mongoose = require('mongoose');

// 定义短信验证码数据模式
const smsCodeSchema = new mongoose.Schema({
  // 手机号码
  phone: {
    type: String,
    required: [true, '手机号码是必需的'],
    match: [/^1[3-9]\d{9}$/, '请输入有效的手机号码'],
    trim: true
  },

  // 验证码
  code: {
    type: String,
    required: [true, '验证码是必需的'],
    minlength: [4, '验证码至少4位'],
    maxlength: [6, '验证码最多6位']
  },

  // 验证码类型（登录、注册、重置密码等）
  type: {
    type: String,
    required: [true, '验证码类型是必需的'],
    enum: ['login', 'register', 'reset-password', 'bind-phone'],
    default: 'login'
  },

  // 是否已使用
  isUsed: {
    type: Boolean,
    default: false
  },

  // 过期时间
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000), // 5分钟后过期
    index: { expires: 0 } // MongoDB会自动删除过期文档
  },

  // IP地址（用于安全记录）
  ip: {
    type: String
  }
}, {
  timestamps: true // 自动添加 createdAt 和 updatedAt 时间戳
});

/**
 * 静态方法：生成随机验证码
 * @param {number} length - 验证码长度，默认6位
 * @returns {string} 生成的验证码
 */
smsCodeSchema.statics.generateCode = function(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
};

/**
 * 实例方法：检查验证码是否有效
 * @returns {boolean} 验证码是否有效
 */
smsCodeSchema.methods.isValid = function() {
  return !this.isUsed && this.expiresAt > new Date();
};

/**
 * 实例方法：标记验证码为已使用
 */
smsCodeSchema.methods.markAsUsed = async function() {
  this.isUsed = true;
  return await this.save();
};

/**
 * 静态方法：清理已过期的验证码
 */
smsCodeSchema.statics.cleanExpired = async function() {
  return await this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isUsed: true }
    ]
  });
};

// 创建复合索引以提高查询性能
smsCodeSchema.index({ phone: 1, type: 1 });
smsCodeSchema.index({ code: 1 });
smsCodeSchema.index({ createdAt: 1 });

// 导出短信验证码模型
module.exports = mongoose.model('SmsCode', smsCodeSchema);
