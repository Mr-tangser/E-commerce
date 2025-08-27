const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 生成JWT令牌
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 用户注册
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
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

    const { username, email, password, phone, address } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          message: existingUser.email === email ? '邮箱已被注册' : '用户名已被使用'
        }
      });
    }

    // 创建新用户
    const user = await User.create({
      username,
      email,
      password,
      phone,
      address
    });

    // 生成令牌
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: '用户注册成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        },
        token
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

// 用户登录
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

    // 查找用户（包含密码字段）
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: '邮箱或密码错误'
        }
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: '账户已被禁用，请联系管理员'
        }
      });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          message: '邮箱或密码错误'
        }
      });
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 生成令牌
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '登录失败，请稍后重试'
      }
    });
  }
});

// 获取当前用户信息
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取用户信息失败'
      }
    });
  }
});

// 忘记密码
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
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: '用户不存在'
        }
      });
    }

    // 生成重置密码令牌
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 10 * 60 * 1000; // 10分钟有效期

    // 保存重置令牌到用户记录
    user.passwordResetToken = require('crypto')
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.passwordResetExpires = resetTokenExpires;

    await user.save({ validateBeforeSave: false });

    // 在实际应用中，这里应该发送邮件
    // 目前返回令牌用于测试（生产环境中绝对不要这样做）
    const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    
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
    console.error('忘记密码错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '处理忘记密码请求失败'
      }
    });
  }
});

// 重置密码
router.post('/reset-password/:token', [
  body('password')
    .isLength({ min: 6 })
    .withMessage('新密码至少6个字符'),
  body('passwordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('密码确认不匹配');
      }
      return true;
    })
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

    // 哈希化传入的令牌以匹配数据库中的令牌
    const hashedToken = require('crypto')
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // 查找具有该令牌且未过期的用户
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          message: '令牌无效或已过期'
        }
      });
    }

    // 设置新密码
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // 生成新的JWT令牌
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: '密码重置成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        },
        token
      }
    });

  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '重置密码失败'
      }
    });
  }
});

module.exports = router; 