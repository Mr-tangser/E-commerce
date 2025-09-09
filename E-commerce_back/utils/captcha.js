const svgCaptcha = require('svg-captcha');
const { v4: uuidv4 } = require('uuid');
const { getRedisClient, isRedisAvailable } = require('../config/redis');

/**
 * 生成验证码
 * @param {Object} options 验证码配置选项
 * @returns {Object} 包含验证码ID、SVG图片和过期时间的对象
 */
const generateCaptcha = async (options = {}) => {
  try {
    // 默认配置
    const defaultOptions = {
      size: 4,        // 验证码长度
      noise: 2,       // 干扰线数量
      color: true,    // 是否彩色
      background: '#f0f0f0', // 背景色
      width: 120,     // 图片宽度
      height: 40,     // 图片高度
      fontSize: 50,   // 字体大小
      ignoreChars: '0o1iIl', // 忽略容易混淆的字符
    };

    const config = { ...defaultOptions, ...options };
    
    // 生成SVG验证码
    const captcha = svgCaptcha.create({
      size: config.size,
      noise: config.noise,
      color: config.color,
      background: config.background,
      width: config.width,
      height: config.height,
      fontSize: config.fontSize,
      ignoreChars: config.ignoreChars,
    });

    // 生成唯一ID
    const captchaId = uuidv4();
    const captchaText = captcha.text.toLowerCase(); // 转换为小写便于比较
    const expireTime = 5 * 60; // 5分钟过期

    // 如果Redis可用，存储验证码
    if (isRedisAvailable()) {
      const redisClient = getRedisClient();
      const key = `captcha:${captchaId}`;
      
      // 存储验证码文本，设置5分钟过期
      await redisClient.setEx(key, expireTime, captchaText);
      
      console.log(`✅ 验证码已生成并存储: ${captchaId} -> ${captchaText}`);
    } else {
      console.warn('⚠️ Redis不可用，验证码功能将被禁用');
      throw new Error('验证码服务暂时不可用，请稍后重试');
    }

    return {
      success: true,
      data: {
        captchaId,
        captchaSvg: captcha.data,
        expiresIn: expireTime
      }
    };

  } catch (error) {
    console.error('❌ 生成验证码失败:', error);
    return {
      success: false,
      error: {
        message: error.message || '验证码生成失败'
      }
    };
  }
};

/**
 * 验证验证码
 * @param {string} captchaId 验证码ID
 * @param {string} userInput 用户输入的验证码
 * @returns {Object} 验证结果
 */
const verifyCaptcha = async (captchaId, userInput) => {
  try {
    if (!captchaId || !userInput) {
      return {
        success: false,
        error: { message: '验证码ID和验证码不能为空' }
      };
    }

    // 检查Redis是否可用
    if (!isRedisAvailable()) {
      console.warn('⚠️ Redis不可用，跳过验证码验证');
      // 在Redis不可用时，可以选择跳过验证或返回错误
      return {
        success: true,
        message: '验证码服务暂时不可用，已跳过验证'
      };
    }

    const redisClient = getRedisClient();
    const key = `captcha:${captchaId}`;
    
    // 从Redis获取存储的验证码
    const storedCaptcha = await redisClient.get(key);
    
    if (!storedCaptcha) {
      return {
        success: false,
        error: { message: '验证码已过期或不存在，请重新获取' }
      };
    }

    // 比较验证码（不区分大小写）
    const isValid = storedCaptcha === userInput.toLowerCase();
    
    if (isValid) {
      // 验证成功后立即删除验证码（防止重复使用）
      await redisClient.del(key);
      console.log(`✅ 验证码验证成功: ${captchaId}`);
      
      return {
        success: true,
        message: '验证码验证成功'
      };
    } else {
      console.log(`❌ 验证码验证失败: ${captchaId} - 期望: ${storedCaptcha}, 实际: ${userInput.toLowerCase()}`);
      
      return {
        success: false,
        error: { message: '验证码错误，请重新输入' }
      };
    }

  } catch (error) {
    console.error('❌ 验证验证码失败:', error);
    return {
      success: false,
      error: { message: '验证码验证失败，请重试' }
    };
  }
};

/**
 * 清理过期的验证码（可选的定时任务）
 */
const cleanExpiredCaptchas = async () => {
  try {
    if (!isRedisAvailable()) {
      return;
    }

    const redisClient = getRedisClient();
    const keys = await redisClient.keys('captcha:*');
    
    let cleanedCount = 0;
    for (const key of keys) {
      const ttl = await redisClient.ttl(key);
      if (ttl <= 0) {
        await redisClient.del(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 清理了 ${cleanedCount} 个过期验证码`);
    }
  } catch (error) {
    console.error('❌ 清理过期验证码失败:', error);
  }
};

module.exports = {
  generateCaptcha,
  verifyCaptcha,
  cleanExpiredCaptchas
};

