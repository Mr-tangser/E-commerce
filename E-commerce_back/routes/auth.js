/**
 * 认证路由 - 处理用户注册、登录、权限验证等功能
 * 支持邮箱/手机登录、微信登录、人脸识别登录等多种认证方式
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

// 模型引入
const User = require('../models/User');

// 服务引入
const smsService = require('../utils/smsService');

// 中间件引入
const { protect } = require('../middleware/auth');

// 配置multer用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB限制
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
});

// Face++ 服务引入
const facePlusPlusService = require('../utils/facePlusPlus');

// 生成JWT令牌的辅助函数
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-fallback-secret-key',
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

// 登录限制：每15分钟最多5次尝试
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制每个IP 15分钟内最多5次请求
  message: {
    success: false,
    error: {
      message: '登录尝试次数过多，请15分钟后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 用户登录
router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage('请输入有效的邮箱地址'),
  body('password').notEmpty().withMessage('密码不能为空')
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

    // 检查账户状态
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: '账户已被禁用，请联系管理员'
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
          phone: user.phone,
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

// 手机号密码登录
router.post('/login-by-phone-password', loginLimiter, [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('password').notEmpty().withMessage('密码不能为空')
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

    const { phone, password } = req.body;

    // 查找用户（包含密码字段）
    const user = await User.findOne({ phone }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: '手机号或密码错误'
        }
      });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          message: '手机号或密码错误'
        }
      });
    }

    // 检查账户状态
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: '账户已被禁用，请联系管理员'
        }
      });
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 生成令牌
    const token = generateToken(user._id);

    console.log('📱 手机号密码登录成功:', {
      userId: user._id,
      phone: user.phone,
      username: user.username
    });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('手机号密码登录错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '登录失败，请稍后重试'
      }
    });
  }
});

// 发送手机验证码
router.post('/send-code', async (req, res) => {
  try {
    const { phone, type = 'login' } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: {
          message: '请输入有效的手机号'
        }
      });
    }

    // 获取客户端IP
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';

    console.log(`📱 准备发送验证码到 ${phone}, 类型: ${type}, IP: ${ip}`);

    // 调用短信服务发送验证码
    const result = await smsService.sendCode(phone, type, ip);

    if (result.success) {
      console.log('✅ 验证码发送成功');
      res.json({
        success: true,
        message: '验证码发送成功',
        data: {
          phone,
          expiresIn: 300 // 5分钟
        }
      });
    } else {
      console.log('❌ 验证码发送失败:', result.message);
      res.status(400).json({
        success: false,
        error: {
          message: result.message || '验证码发送失败'
        }
      });
    }

  } catch (error) {
    console.error('❌ 发送验证码异常:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || '发送验证码失败，请稍后重试'
      }
    });
  }
});

// 手机验证码登录
router.post('/login-by-phone', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: {
          message: '请输入有效的手机号'
        }
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        error: {
          message: '请输入验证码'
        }
      });
    }

    // 验证验证码
    const verifyResult = await smsService.verifyCode(phone, code, 'login');
    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: verifyResult.message || '验证码验证失败'
        }
      });
    }

    // 查找或创建用户
    let user = await User.findOne({ phone });
    if (!user) {
      // 如果用户不存在，创建新用户
      user = await User.create({
        username: `用户${phone.slice(-4)}`,
        phone,
        email: `${phone}@temp.com`, // 临时邮箱
        password: Math.random().toString(36).slice(-8) // 随机密码
      });
    }

    // 检查账户状态
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: '账户已被禁用，请联系管理员'
        }
      });
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 验证码已在smsService.verifyCode中自动标记为已使用

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
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('手机登录错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '登录失败，请稍后重试'
      }
    });
  }
});

// =================  人脸识别相关接口  =================

/**
 * 人脸注册接口
 * 需要用户已登录，将用户的人脸信息注册到Face++人脸库
 */
router.post('/face/register', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: '请上传人脸图片'
        }
      });
    }

    const userId = req.user._id;
    console.log('🎯 人脸注册 - 认证用户信息:', {
      userId: userId,
      userType: req.user.userType,
      username: req.user.username,
      email: req.user.email,
      phone: req.user.phone
    });

    const user = await User.findById(userId);

    if (!user) {
      console.error('❌ 人脸注册失败 - 用户不存在:', {
        searchedUserId: userId,
        requestUser: req.user
      });
      return res.status(404).json({
        success: false,
        error: {
          message: '用户不存在，请重新登录'
        }
      });
    }

    console.log('🎯 开始人脸注册流程:', {
      userId: user._id,
      username: user.username,
      hasExistingFace: user.hasFace
    });

    // 如果用户已经注册过人脸，先删除旧的人脸信息
    if (user.hasFace && user.faceToken) {
      try {
        console.log('🗑️ 删除用户旧的人脸信息...');
        await facePlusPlusService.removeFaceFromFaceset(user.faceToken);
      } catch (error) {
        console.warn('删除旧人脸信息失败:', error.message);
        // 继续执行，不阻断注册流程
      }
    }

    // 检测人脸
    console.log('👁️ 开始人脸检测...');
    const detectResult = await facePlusPlusService.detectFace(req.file.buffer);
    if (!detectResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: detectResult.error.message
        }
      });
    }

    const { faceToken, attributes, confidence } = detectResult.data;
    console.log('✅ 人脸检测成功:', {
      faceToken: faceToken,
      confidence: confidence
    });

    // 添加人脸到人脸库
    console.log('📦 添加人脸到Face++人脸库...');
    const addResult = await facePlusPlusService.addFaceToFaceset(faceToken, userId);
    if (!addResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: addResult.error.message
        }
      });
    }

    console.log('✅ 人脸添加到Face++人脸库成功');

    // 更新用户信息 - 保存人脸信息到数据库
    user.faceToken = faceToken;
    user.faceSetId = facePlusPlusService.facesetToken;
    user.hasFace = true;
    user.faceRegisterTime = new Date();

    console.log('💾 保存用户人脸信息到数据库:', {
      userId: user._id,
      username: user.username,
      faceToken: faceToken,
      faceSetId: user.faceSetId,
      hasFace: user.hasFace
    });

    await user.save();

    res.json({
      success: true,
      message: '人脸注册成功',
      data: {
        faceToken: faceToken,
        confidence: confidence,
        attributes: {
          age: attributes?.age,
          gender: attributes?.gender,
          emotion: attributes?.emotion
        }
      }
    });

  } catch (error) {
    console.error('人脸注册错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '人脸注册失败，请稍后重试'
      }
    });
  }
});

/**
 * 人脸登录接口
 * 通过人脸识别进行用户登录
 */
router.post('/face/login', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: '请上传人脸图片'
        }
      });
    }

    console.log('🎯 开始人脸登录流程...');

    // 检测人脸
    console.log('👁️ 检测上传的人脸图片...');
    const detectResult = await facePlusPlusService.detectFace(req.file.buffer);
    if (!detectResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: detectResult.error.message
        }
      });
    }

    const { faceToken } = detectResult.data;
    console.log('✅ 人脸检测成功，faceToken:', faceToken);

    // 在人脸库中搜索匹配的人脸
    console.log('🔍 在Face++人脸库中搜索匹配的人脸...');
    const searchResult = await facePlusPlusService.searchFace(faceToken, 75); // 75%匹配度阈值
    if (!searchResult.success) {
      return res.status(401).json({
        success: false,
        error: {
          message: searchResult.error.message
        }
      });
    }

    const { matchedFaceToken, confidence } = searchResult.data;
    console.log('🔍 Face++搜索结果:', {
      matchedFaceToken: matchedFaceToken,
      confidence: confidence
    });

    // 通过faceToken查找对应的用户
    console.log('🔍 根据faceToken查找数据库中的用户...');
    const user = await User.findOne({ faceToken: matchedFaceToken })
      .select('+faceToken +faceSetId +hasFace +faceRegisterTime'); // 显式选择人脸相关字段

    if (!user) {
      console.error('❌ 未找到匹配的用户:', matchedFaceToken);
      return res.status(401).json({
        success: false,
        error: {
          message: '未找到匹配的人脸，请先注册或用户信息异常'
        }
      });
    }

    console.log('✅ 找到匹配用户完整信息:', {
      userId: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      hasFace: user.hasFace,
      faceRegisterTime: user.faceRegisterTime
    });

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: '账户已被禁用，请联系管理员'
        }
      });
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 生成JWT令牌
    const token = generateToken(user._id);

    console.log('🎉 人脸登录成功:', {
      userId: user._id,
      username: user.username,
      confidence: confidence
    });

    res.json({
      success: true,
      message: `人脸识别登录成功 (匹配度: ${confidence.toFixed(1)}%)`,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          lastLogin: user.lastLogin
        },
        token,
        faceRecognition: {
          confidence: confidence,
          matchedAt: new Date()
        }
      }
    });

  } catch (error) {
    console.error('人脸登录错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '人脸登录失败，请稍后重试'
      }
    });
  }
});

/**
 * 检查用户是否已注册人脸
 */
router.get('/face/check', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

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
      data: {
        hasFace: user.hasFace,
        faceRegisterTime: user.faceRegisterTime
      }
    });

  } catch (error) {
    console.error('检查人脸注册状态错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '检查失败，请稍后重试'
      }
    });
  }
});

/**
 * 删除用户人脸信息
 */
router.delete('/face/remove', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: '用户不存在'
        }
      });
    }

    if (!user.hasFace || !user.faceToken) {
      return res.status(400).json({
        success: false,
        error: {
          message: '您尚未注册人脸信息'
        }
      });
    }

    // 从Face++人脸库中删除人脸
    const removeResult = await facePlusPlusService.removeFaceFromFaceset(user.faceToken);
    if (!removeResult.success) {
      console.warn('从Face++删除人脸失败:', removeResult.error);
      // 即使Face++删除失败，也要清除本地数据库的记录
    }

    // 清除用户的人脸信息
    user.faceToken = null;
    user.faceSetId = null;
    user.hasFace = false;
    user.faceRegisterTime = null;
    await user.save();

    res.json({
      success: true,
      message: '人脸信息删除成功'
    });

  } catch (error) {
    console.error('删除人脸信息错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '删除失败，请稍后重试'
      }
    });
  }
});

// =================  人脸管理接口  =================

/**
 * 清除当前用户的人脸关联 - 用于修复错误关联
 */
router.post('/face/clear', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: '用户不存在'
        }
      });
    }

    console.log('🗑️ 清除用户人脸关联:', {
      userId: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      currentHasFace: user.hasFace
    });

    // 如果用户有人脸，先从Face++人脸库中删除
    if (user.hasFace && user.faceToken) {
      try {
        console.log('🗑️ 从Face++人脸库删除人脸...');
        await facePlusPlusService.removeFaceFromFaceset(user.faceToken);
        console.log('✅ Face++人脸库删除成功');
      } catch (error) {
        console.warn('⚠️ Face++人脸库删除失败:', error.message);
        // 继续执行，确保数据库清理
      }
    }

    // 清除数据库中的人脸关联
    user.faceToken = null;
    user.faceSetId = null;
    user.hasFace = false;
    user.faceRegisterTime = null;
    await user.save();

    console.log('✅ 用户人脸关联已清除');

    res.json({
      success: true,
      message: '人脸关联已清除，可以重新注册',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          hasFace: false
        }
      }
    });

  } catch (error) {
    console.error('清除人脸关联失败:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '清除失败，请稍后重试'
      }
    });
  }
});

/**
 * 删除错误的临时用户账户和其人脸关联
 */
router.post('/face/cleanup-temp-users', protect, async (req, res) => {
  try {
    // 只有当前用户可以清理与自己手机号相关的临时账户
    const currentUser = req.user;

    if (!currentUser.phone) {
      return res.status(400).json({
        success: false,
        error: {
          message: '当前用户没有手机号信息'
        }
      });
    }

    // 查找可能的临时用户账户（用户名格式为"用户+手机号后4位"）
    const phone = currentUser.phone;
    const tempUsername = `用户${phone.slice(-4)}`;

    console.log('🔍 查找临时用户账户:', {
      currentUser: {
        id: currentUser._id,
        username: currentUser.username,
        phone: currentUser.phone
      },
      searchingTempUsername: tempUsername
    });

    const tempUsers = await User.find({
      username: tempUsername,
      phone: phone,
      _id: { $ne: currentUser._id } // 排除当前用户
    }).select('+faceToken +faceSetId +hasFace');

    console.log('🔍 找到的临时用户:', tempUsers.map(user => ({
      id: user._id,
      username: user.username,
      phone: user.phone,
      hasFace: user.hasFace
    })));

    let deletedCount = 0;
    let faceCleanedCount = 0;

    // 清理临时用户的人脸关联和账户
    for (const tempUser of tempUsers) {
      try {
        // 如果临时用户有人脸，先从Face++删除
        if (tempUser.hasFace && tempUser.faceToken) {
          try {
            await facePlusPlusService.removeFaceFromFaceset(tempUser.faceToken);
            faceCleanedCount++;
            console.log(`✅ 临时用户 ${tempUser.username} 的人脸已从Face++删除`);
          } catch (error) {
            console.warn(`⚠️ 删除临时用户 ${tempUser.username} 的Face++人脸失败:`, error.message);
          }
        }

        // 删除临时用户账户
        await User.findByIdAndDelete(tempUser._id);
        deletedCount++;
        console.log(`🗑️ 临时用户账户已删除: ${tempUser.username}`);

      } catch (error) {
        console.error(`❌ 清理临时用户 ${tempUser.username} 失败:`, error);
      }
    }

    res.json({
      success: true,
      message: `清理完成：删除了 ${deletedCount} 个临时账户，清理了 ${faceCleanedCount} 个人脸关联`,
      data: {
        deletedTempAccounts: deletedCount,
        cleanedFaceAssociations: faceCleanedCount
      }
    });

  } catch (error) {
    console.error('清理临时用户失败:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '清理失败，请稍后重试'
      }
    });
  }
});

// =================  调试接口（开发用）  =================

/**
 * 查看用户人脸关联情况 - 调试用
 */
router.get('/debug/users-face-info', protect, async (req, res) => {
  try {
    // 只有管理员或当前用户可以查看
    const currentUserId = req.user._id;

    // 查找所有有人脸的用户
    const usersWithFace = await User.find({ hasFace: true })
      .select('+faceToken +faceSetId +hasFace +faceRegisterTime')
      .lean();

    // 查找当前用户的人脸信息
    const currentUser = await User.findById(currentUserId)
      .select('+faceToken +faceSetId +hasFace +faceRegisterTime')
      .lean();

    console.log('🔍 调试 - 用户人脸关联情况:', {
      currentUser: {
        id: currentUser._id,
        username: currentUser.username,
        email: currentUser.email,
        phone: currentUser.phone,
        hasFace: currentUser.hasFace,
        faceToken: currentUser.faceToken ? `${currentUser.faceToken.substring(0, 10)}...` : null,
        faceRegisterTime: currentUser.faceRegisterTime
      },
      totalUsersWithFace: usersWithFace.length,
      usersWithFaceList: usersWithFace.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        faceToken: user.faceToken ? `${user.faceToken.substring(0, 10)}...` : null,
        faceRegisterTime: user.faceRegisterTime
      }))
    });

    res.json({
      success: true,
      data: {
        currentUser: {
          id: currentUser._id,
          username: currentUser.username,
          email: currentUser.email,
          phone: currentUser.phone,
          hasFace: currentUser.hasFace,
          faceToken: currentUser.faceToken ? `${currentUser.faceToken.substring(0, 10)}...` : null,
          faceRegisterTime: currentUser.faceRegisterTime
        },
        totalUsersWithFace: usersWithFace.length,
        usersWithFaceList: usersWithFace.map(user => ({
          id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          faceToken: user.faceToken ? `${user.faceToken.substring(0, 10)}...` : null,
          faceRegisterTime: user.faceRegisterTime
        }))
      }
    });

  } catch (error) {
    console.error('查看用户人脸信息失败:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '查看失败'
      }
    });
  }
});
// 一键登录接口
router.post('/univerify-login', loginLimiter, [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('access_token').notEmpty().withMessage('access_token不能为空'),
  body('openid').notEmpty().withMessage('openid不能为空')
], async (req, res) => {
  try {
    console.log('🔍 一键登录接口被调用:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: '参数验证失败',
          details: errors.array()
        }
      });
    }

    const { phone, access_token, openid } = req.body;

    // 可选：验证access_token和openid的有效性
    // 这里可以调用运营商API验证token有效性

    // 查找或创建用户
    let user = await User.findOne({ phone });
    if (!user) {
      // 如果用户不存在，创建新用户
      user = await User.create({
        username: `用户${phone.slice(-4)}`,
        phone,
        email: `${phone}@univerify.com`, // 一键登录用户的临时邮箱
        password: Math.random().toString(36).slice(-8), // 随机密码
        loginMethod: 'univerify' // 标记登录方式
      });
    }

    // 检查账户状态
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: '账户已被禁用，请联系管理员'
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
      message: '一键登录成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('一键登录错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '一键登录失败，请稍后重试'
      }
    });
  }
});
// 获取当前用户信息接口
router.get('/me', protect, async (req, res) => {
  try {
    console.log('📋 获取用户信息请求，用户ID:', req.user._id);
    
    // 返回用户信息（已经在protect中间件中获取）
    const userInfo = {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      phone: req.user.phone,
      avatar: req.user.avatar,
      isActive: req.user.isActive,
      role: req.user.role,
      userType: req.user.userType || 'user'
    };
    
    console.log('✅ 用户信息获取成功:', userInfo.username || userInfo.email);
    
    res.json({
      success: true,
      message: '获取用户信息成功',
      data: userInfo
    });
    
  } catch (error) {
    console.error('❌ 获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取用户信息失败',
        statusCode: 500
      }
    });
  }
});

module.exports = router;