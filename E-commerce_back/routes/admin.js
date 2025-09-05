const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const { protect, authorize, checkOwnership } = require('../middleware/auth');
const { verifyCaptcha } = require('../utils/captcha');
const { decryptAES, isTimestampValid } = require('../utils/crypto');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// 配置头像上传存储
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 存储到前端public/img/avatars目录
    cb(null, path.join(__dirname, '../../E-commerce _PC_end/public/img/avatars'));
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：用户ID_时间戳.扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `admin_${req.user.id}_${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器（只允许图片）
const avatarFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

// 配置multer上传
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  },
  fileFilter: avatarFilter
});

// 生成JWT令牌（Admin专用）
const generateAdminToken = (id) => {
  return jwt.sign(
    { id, userType: 'admin' },
    process.env.JWT_SECRET || 'your-super-secret-admin-jwt-key-change-in-production',
    { expiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '8h' }
  );
};

// 管理员登录
router.post('/login', [
  body('identifier')
    .notEmpty()
    .withMessage('请输入用户名或邮箱'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空'),
  body('captchaId')
    .notEmpty()
    .withMessage('验证码ID不能为空'),
  body('captchaCode')
    .notEmpty()
    .withMessage('请输入验证码')
    .isLength({ min: 4, max: 4 })
    .withMessage('验证码必须为4位'),
  body('timestamp')
    .isNumeric()
    .withMessage('时间戳必须为数字')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: '输入验证失败',
          details: errors.array()
        }
      });
    }

    const { identifier, password, captchaId, captchaCode, timestamp } = req.body;

    // 基本日志记录
    console.log('管理员登录尝试:', { identifier, timestamp });

    // 首先验证验证码
    const captchaResult = await verifyCaptcha(captchaId, captchaCode);
    if (!captchaResult.success) {
      return res.status(400).json({
        success: false,
        error: captchaResult.error
      });
    }

    // 验证时间戳有效性
    if (!isTimestampValid(parseInt(timestamp))) {
      return res.status(400).json({
        success: false,
        error: {
          message: '请求已过期，请重新登录'
        }
      });
    }

    // 解密密码
    let decryptedPassword;
    try {
      decryptedPassword = decryptAES(password, parseInt(timestamp));
    } catch (error) {
      console.error('密码解密失败详细错误:', error);
      console.error('错误堆栈:', error.stack);
      return res.status(400).json({
        success: false,
        error: {
          message: '密码解密失败，请重新输入'
        }
      });
    }

    // 判断输入的是邮箱还是用户名
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(identifier);
    
    // 构建查询条件
    const query = isEmail ? { email: identifier } : { username: identifier };
    
    // 查找管理员（包含密码字段）
    const admin = await Admin.findOne(query).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: {
          message: '用户名/邮箱或密码错误'
        }
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: '账户已被禁用，请联系系统管理员'
        }
      });
    }

    // 验证密码（使用解密后的密码）
    const isPasswordValid = await admin.comparePassword(decryptedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          message: '用户名/邮箱或密码错误'
        }
      });
    }

    // 更新最后登录时间
    admin.lastLogin = new Date();
    await admin.save();

    // 生成令牌
    const token = generateAdminToken(admin._id);

    res.json({
      success: true,
      message: '管理员登录成功',
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          avatar: admin.avatar,
          department: admin.department,
          permissions: admin.getAllowedResources(),
          lastLogin: admin.lastLogin
        },
        access_token: token // 前端期望的token字段名
      }
    });
  } catch (error) {
    console.error('管理员登录错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '登录失败，请稍后重试'
      }
    });
  }
});

// 公开注册接口（用于PC端注册）
router.post('/register', [
  body('username')
    .isLength({ min: 2, max: 20 })
    .withMessage('用户名长度必须在2-20个字符之间')
    .matches(/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含中文、字母、数字和下划线'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少6个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: '输入验证失败',
          details: errors.array()
        }
      });
    }

    const { username, password } = req.body;

    // 检查用户名是否已存在
    const existingAdmin = await Admin.findOne({ username });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: {
          message: '用户名已被使用'
        }
      });
    }

    // 生成临时邮箱（实际应用中可能需要用户提供邮箱）
    const tempEmail = `${username}@temp.local`;

    // 创建新管理员
    const admin = await Admin.create({
      username,
      email: tempEmail,
      password,
      role: 'staff' // 新注册用户默认为staff权限
    });

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          role: admin.role
        }
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '注册失败，请稍后重试'
      }
    });
  }
});

// 管理员注册（仅超级管理员可操作）
router.post('/admin-register', protect, authorize('super_admin'), [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少6个字符'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'staff'])
    .withMessage('无效的角色')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: '输入验证失败',
          details: errors.array()
        }
      });
    }

    const { username, email, password, firstName, lastName, role, department } = req.body;

    // 检查管理员是否已存在
    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }]
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: {
          message: existingAdmin.email === email ? '邮箱已被注册' : '用户名已被使用'
        }
      });
    }

    // 创建新管理员
    const admin = await Admin.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || 'staff',
      department
    });

    res.status(201).json({
      success: true,
      message: '管理员创建成功',
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          department: admin.department
        }
      }
    });
  } catch (error) {
    console.error('管理员注册错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '注册失败，请稍后重试'
      }
    });
  }
});

// 获取当前管理员信息
router.get('/me', protect, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      data: {
        admin: {
          ...admin.toJSON(),
          permissions: admin.getAllowedResources()
        }
      }
    });
  } catch (error) {
    console.error('获取管理员信息错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取管理员信息失败'
      }
    });
  }
});

// 更新当前管理员信息
router.put('/me', protect, [
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('名字长度必须在1-50个字符之间'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('姓氏长度必须在1-50个字符之间'),
  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号码')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: '输入验证失败',
          details: errors.array()
        }
      });
    }

    const { firstName, lastName, phone, avatar } = req.body;
    const updateData = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    const admin = await Admin.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: {
          message: '管理员不存在'
        }
      });
    }

    res.json({
      success: true,
      message: '管理员信息更新成功',
      data: {
        admin
      }
    });
  } catch (error) {
    console.error('更新管理员信息错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '更新管理员信息失败'
      }
    });
  }
});

// 获取所有管理员（仅超级管理员可操作）
router.get('/', protect, authorize('super_admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      filter.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const admins = await Admin.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Admin.countDocuments(filter);

    res.json({
      success: true,
      data: {
        admins,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取管理员列表错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取管理员列表失败'
      }
    });
  }
});

// 管理员忘记密码
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: '输入验证失败',
          details: errors.array()
        }
      });
    }

    const { email } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: {
          message: '管理员不存在'
        }
      });
    }

    // 生成重置密码令牌
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 10 * 60 * 1000; // 10分钟有效期

    // 保存重置令牌到管理员记录
    admin.passwordResetToken = require('crypto')
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    admin.passwordResetExpires = resetTokenExpires;

    await admin.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get('host')}/api/admin/reset-password/${resetToken}`;
    
    res.json({
      success: true,
      message: '密码重置邮件已发送',
      // 仅用于开发测试，生产环境应删除以下字段
      ...(process.env.NODE_ENV === 'development' && { 
        resetToken: resetToken,
        resetURL: resetURL 
      })
    });

  } catch (error) {
    console.error('管理员忘记密码错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '处理忘记密码请求失败'
      }
    });
  }
});

// 上传头像
router.post('/upload-avatar', protect, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: '请选择要上传的头像文件'
        }
      });
    }

    // 构建头像URL（相对于前端public目录）
    const avatarUrl = `/img/avatars/${req.file.filename}`;

    // 更新管理员头像
    const admin = await Admin.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: {
          message: '管理员不存在'
        }
      });
    }

    res.json({
      success: true,
      message: '头像上传成功',
      data: {
        avatar: admin.avatar,
        admin: admin
      }
    });

  } catch (error) {
    console.error('头像上传失败:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '头像上传失败'
      }
    });
  }
});

// 获取当前管理员信息
router.get('/profile', protect, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: {
          message: '管理员不存在'
        }
      });
    }

    res.json({
      success: true,
      data: {
        admin: admin
      }
    });

  } catch (error) {
    console.error('获取管理员资料失败:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取管理员资料失败'
      }
    });
  }
});

// 更新管理员资料
router.put('/profile', protect, [
  body('firstName').optional().trim().isLength({ max: 50 }).withMessage('名字最多50个字符'),
  body('lastName').optional().trim().isLength({ max: 50 }).withMessage('姓氏最多50个字符'),
  body('phone').optional().trim().matches(/^1[3-9]\d{9}$/).withMessage('请输入有效的手机号'),
  body('email').optional().isEmail().withMessage('请输入有效的邮箱地址')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: '输入验证失败',
          details: errors.array()
        }
      });
    }

    const { firstName, lastName, phone, email } = req.body;
    
    // 检查邮箱是否已被其他管理员使用
    if (email) {
      const existingAdmin = await Admin.findOne({ 
        email, 
        _id: { $ne: req.user.id } 
      });
      
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          error: {
            message: '该邮箱已被其他管理员使用'
          }
        });
      }
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;

    const admin = await Admin.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: {
          message: '管理员不存在'
        }
      });
    }

    res.json({
      success: true,
      message: '资料更新成功',
      data: {
        admin: admin
      }
    });

  } catch (error) {
    console.error('更新管理员资料失败:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '更新管理员资料失败'
      }
    });
  }
});

// 修改密码
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('请输入当前密码'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码长度不能少于6位'),
  body('confirmPassword').notEmpty().withMessage('请确认新密码')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: '输入验证失败',
          details: errors.array()
        }
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // 验证新密码和确认密码是否一致
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: {
          message: '新密码和确认密码不一致'
        }
      });
    }

    // 获取当前管理员信息（包含密码）
    const admin = await Admin.findById(req.user.id).select('+password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: {
          message: '管理员不存在'
        }
      });
    }

    // 验证当前密码
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: {
          message: '当前密码不正确'
        }
      });
    }

    // 更新密码
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: '密码修改成功'
    });

  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '修改密码失败'
      }
    });
  }
});

module.exports = router; 
