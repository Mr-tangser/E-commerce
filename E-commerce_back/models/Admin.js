const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '管理员用户名是必需的'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名最多20个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱是必需的'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码是必需的'],
    minlength: [6, '密码至少6个字符'],
    select: false // 查询时不返回密码
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'manager', 'staff'],
    default: 'admin'
  },
  avatar: {
    type: String,
    default: ''
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    enum: ['sales', 'marketing', 'customer_service', 'inventory', 'finance', 'technical'],
    default: 'sales'
  },
  permissions: {
    users: {
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    products: {
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    orders: {
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: true },
      delete: { type: Boolean, default: false }
    },
    analytics: {
      view: { type: Boolean, default: true },
      export: { type: Boolean, default: false }
    },
    settings: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  sessionTimeout: {
    type: Number,
    default: 8 // 8小时
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：全名
adminSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
});

// 虚拟字段：显示名称
adminSchema.virtual('displayName').get(function() {
  return this.fullName !== this.username ? `${this.fullName} (${this.username})` : this.username;
});

// 密码加密中间件
adminSchema.pre('save', async function(next) {
  // 只有在密码被修改时才加密
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 登录计数中间件
adminSchema.pre('save', function(next) {
  if (this.isModified('lastLogin')) {
    this.loginCount = (this.loginCount || 0) + 1;
  }
  next();
});

// 密码验证方法
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 检查用户权限
adminSchema.methods.hasRole = function(role) {
  const roleHierarchy = {
    'staff': 1,
    'manager': 2,
    'admin': 3,
    'super_admin': 4
  };
  
  return roleHierarchy[this.role] >= roleHierarchy[role];
};

// 检查具体权限
adminSchema.methods.hasPermission = function(resource, action) {
  return this.permissions[resource] && this.permissions[resource][action];
};

// 获取允许的资源列表
adminSchema.methods.getAllowedResources = function() {
  const allowed = {};
  for (const [resource, actions] of Object.entries(this.permissions)) {
    allowed[resource] = [];
    for (const [action, permitted] of Object.entries(actions)) {
      if (permitted) allowed[resource].push(action);
    }
  }
  return allowed;
};

// 索引
adminSchema.index({ email: 1 });
adminSchema.index({ username: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ department: 1 });

module.exports = mongoose.model('Admin', adminSchema, 'admins'); 
