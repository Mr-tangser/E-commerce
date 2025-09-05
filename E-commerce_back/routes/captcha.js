const express = require('express');
const router = express.Router();
const { generateCaptcha, verifyCaptcha } = require('../utils/captcha');

/**
 * @route   GET /api/captcha/generate
 * @desc    生成验证码
 * @access  Public
 */
router.get('/generate', async (req, res) => {
  try {
    const result = await generateCaptcha();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: '验证码生成成功',
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('生成验证码API错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '服务器内部错误'
      }
    });
  }
});

/**
 * @route   POST /api/captcha/verify
 * @desc    验证验证码（仅用于测试）
 * @access  Public
 */
router.post('/verify', async (req, res) => {
  try {
    const { captchaId, captchaCode } = req.body;
    
    if (!captchaId || !captchaCode) {
      return res.status(400).json({
        success: false,
        error: {
          message: '验证码ID和验证码不能为空'
        }
      });
    }
    
    const result = await verifyCaptcha(captchaId, captchaCode);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('验证验证码API错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '服务器内部错误'
      }
    });
  }
});

/**
 * @route   GET /api/captcha/refresh/:captchaId
 * @desc    刷新验证码（生成新的验证码并替换旧的）
 * @access  Public
 */
router.get('/refresh/:captchaId?', async (req, res) => {
  try {
    // 直接生成新的验证码，旧的会自动过期
    const result = await generateCaptcha();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: '验证码刷新成功',
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('刷新验证码API错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '服务器内部错误'
      }
    });
  }
});

module.exports = router;

