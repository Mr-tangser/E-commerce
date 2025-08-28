/**
 * 用户模型 - 电商平台用户数据结构
 * 包含用户基本信息、权限管理、密码加密等功能
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 定义用户数据模式
const userSchema = new mongoose.Schema({
  // 用户名字段
  username: {
    type: String,
    required: [true, '用户名是必需的'],
    unique: true,                    // 确保用户名唯一
    trim: true,                      // 自动去除首尾空格
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名最多20个字符']
  },

  // 邮箱字段
  email: {
    type: String,
    required: [true, '邮箱是必需的'],
    unique: true,                    // 确保邮箱唯一
    lowercase: true,                 // 自动转换为小写
    trim: true,                      // 自动去除首尾空格
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },

  // 密码字段
  password: {
    type: String,
    required: [true, '密码是必需的'],
    minlength: [6, '密码至少6个字符'],
    select: false                    // 查询时不返回密码字段，保护隐私
  },

  // 用户角色
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'], // 限制角色类型
    default: 'user'                  // 默认为普通用户
  },
  // 用户头像
  avatar: {
    type: String,
    default: '/uploads/avatars/5.jpg'  // 默认头像路径
  },

  // 手机号码
  phone: {
    type: String,
    trim: true                       // 自动去除首尾空格
  },

  // 用户地址信息
  address: {
    street: String,                  // 街道地址
    city: String,                    // 城市
    state: String,                   // 省份/州
    zipCode: String,                 // 邮政编码
    country: String                  // 国家
  },

  // 账户状态
  isActive: {
    type: Boolean,
    default: true                    // 默认账户激活状态
  },

  // 最后登录时间
  lastLogin: {
    type: Date
  },
  // 用户偏好设置
  preferences: {
    language: {
      type: String,
      default: 'zh-CN'               // 默认简体中文
    },
    currency: {
      type: String,
      default: 'CNY'                 // 默认人民币
    },
    notifications: {                 // 通知设置
      email: { type: Boolean, default: true },  // 邮件通知开启
      sms: { type: Boolean, default: false }    // 短信通知关闭
    }
  },

  // 密码重置相关字段
  passwordResetToken: {
    type: String,
    select: false                    // 查询时不返回重置令牌
  },
  passwordResetExpires: {
    type: Date,
    select: false                    // 查询时不返回重置过期时间
  }
}, {
  timestamps: true,                  // 自动添加 createdAt 和 updatedAt 时间戳
  toJSON: { virtuals: true },        // JSON 序列化时包含虚拟字段
  toObject: { virtuals: true }       // 对象转换时包含虚拟字段
});

/**
 * 虚拟字段：全名
 * 用于获取用户的显示名称
 */
userSchema.virtual('fullName').get(function () {
  return `${this.username}`;
});

/**
 * 密码加密中间件
 * 在保存用户数据前自动加密密码
 */
userSchema.pre('save', async function (next) {
  // 只有在密码被修改时才加密
  if (!this.isModified('password')) return next();

  try {
    // 生成盐值并加密密码
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * 密码验证方法
 * 比较输入的密码与存储的加密密码
 * @param {string} candidatePassword - 待验证的密码
 * @returns {boolean} 密码是否匹配
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * 检查用户权限
 * 验证用户是否具有指定角色或管理员权限
 * @param {string} role - 要检查的角色
 * @returns {boolean} 是否具有权限
 */
userSchema.methods.hasRole = function (role) {
  return this.role === role || this.role === 'admin';
};

// 数据库索引 - 提高查询性能
userSchema.index({ email: 1 });      // 邮箱索引
userSchema.index({ username: 1 });   // 用户名索引
userSchema.index({ role: 1 });       // 角色索引

// 导出用户模型
module.exports = mongoose.model('User', userSchema); 