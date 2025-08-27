const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const { protect, authorize, checkOwnership } = require('../middleware/auth');

const router = express.Router();

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
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
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

    const { email, password } = req.body;

    // 查找管理员（包含密码字段）
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: {
          message: '邮箱或密码错误'
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

    // 验证密码
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          message: '邮箱或密码错误'
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

// 管理员注册（仅超级管理员可操作）
router.post('/register', protect, authorize('super_admin'), [
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

module.exports = router; 
