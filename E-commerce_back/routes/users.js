const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, authorize, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// 获取所有用户（管理员）
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      filter.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取用户列表失败'
      }
    });
  }
});

// 获取单个用户
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: '用户不存在'
        }
      });
    }

    // 检查权限：只能查看自己的信息或管理员可以查看所有
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: {
          message: '无权访问此用户信息'
        }
      });
    }

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

// 更新用户信息
router.put('/:id', protect, [
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间'),
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

    // 检查权限
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: {
          message: '无权修改此用户信息'
        }
      });
    }

    const { username, phone, address, preferences, isActive, role } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (preferences) updateData.preferences = preferences;
    
    // 只有管理员可以修改这些字段
    if (req.user.role === 'admin') {
      if (isActive !== undefined) updateData.isActive = isActive;
      if (role) updateData.role = role;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: '用户不存在'
        }
      });
    }

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '更新用户信息失败'
      }
    });
  }
});

// 删除用户（管理员）
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: '用户不存在'
        }
      });
    }

    // 不能删除自己
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: {
          message: '不能删除自己的账户'
        }
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '删除用户失败'
      }
    });
  }
});

// 禁用/启用用户（管理员）
router.patch('/:id/toggle-status', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: '用户不存在'
        }
      });
    }

    // 不能禁用自己
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: {
          message: '不能禁用自己的账户'
        }
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `用户已${user.isActive ? '启用' : '禁用'}`,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    console.error('切换用户状态错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '切换用户状态失败'
      }
    });
  }
});

module.exports = router; 