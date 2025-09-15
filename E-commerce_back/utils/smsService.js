/**
 * 短信服务工具类
 * 集成互亿无线短信API，实现验证码发送和验证功能
 */

const axios = require('axios');
const SmsCode = require('../models/SmsCode');

class SmsService {
  constructor() {
    // 互亿无线短信配置 - 请根据您的账户信息修改
    this.config = {
      // 互亿无线短信接口地址
      url: 'https://106.ihuyi.com/webservice/sms.php?method=Submit',
      // 账户ID - 请替换为您的实际账户ID
      account: process.env.SMS_ACCOUNT || 'C34247721',
      // 密码 - 请替换为您的实际密码
      password: process.env.SMS_PASSWORD || '1206e319b430d51011aecfbe23ec7acd',
      // 短信签名 - 请替换为您的实际签名
      sign: process.env.SMS_SIGN || '【电商平台】',
             // 验证码模板（与互亿无线平台报备的模板完全一致）
       template: '您的验证码是：【变量】。请不要把验证码泄露给其他人。',
      // 请求超时时间
      timeout: 10000
    };

    // 频率限制配置
    this.rateLimit = {
      // 同一手机号发送间隔（秒）
      phoneInterval: 60,
      // 同一IP发送间隔（秒）
      ipInterval: 10,
      // 每日限制次数
      dailyLimit: 10
    };
  }

  /**
   * 发送验证码
   * @param {string} phone - 手机号
   * @param {string} type - 验证码类型 (login/register/reset-password/bind-phone)
   * @param {string} ip - 客户端IP地址
   * @returns {Object} 发送结果
   */
  async sendCode(phone, type = 'login', ip = '') {
    try {
      console.log(`📱 开始发送验证码: ${phone}, 类型: ${type}, IP: ${ip}`);

      // 验证手机号格式
      if (!this.validatePhone(phone)) {
        throw new Error('手机号格式不正确');
      }

      // 检查发送频率限制
      await this.checkRateLimit(phone, ip);

      // 生成验证码
      const code = SmsCode.generateCode(6);
      console.log(`🔑 生成验证码: ${code} (开发环境显示)`);

      // 格式化短信内容
      const content = this.formatSmsContent(code, type);

      // 发送短信
      const smsResult = await this.sendSms(phone, content);

      if (smsResult.success) {
        // 保存验证码到数据库
        await this.saveCode(phone, code, type, ip);

        console.log(`✅ 验证码发送成功: ${phone}`);
        
        // 返回结果
        const result = {
          success: true,
          message: '验证码发送成功，请查收短信',
          data: {
            message: '验证码已通过短信发送到您的手机'
          }
        };

        return result;
      } else {
        throw new Error(smsResult.message || '短信发送失败');
      }

    } catch (error) {
      console.error('❌ 发送验证码失败:', error.message);
      throw error;
    }
  }

  /**
   * 验证验证码
   * @param {string} phone - 手机号
   * @param {string} code - 验证码
   * @param {string} type - 验证码类型
   * @returns {Object} 验证结果
   */
  async verifyCode(phone, code, type = 'login') {
    try {
      console.log(`🔍 验证验证码: ${phone}, 代码: ${code}, 类型: ${type}`);

      // 查找验证码
      const smsCode = await SmsCode.findOne({
        phone,
        code,
        type,
        isUsed: false
      }).sort({ createdAt: -1 });

      if (!smsCode) {
        return {
          success: false,
          message: '验证码不正确或已过期'
        };
      }

      // 检查是否过期
      if (!smsCode.isValid()) {
        return {
          success: false,
          message: '验证码已过期，请重新获取'
        };
      }

      // 标记为已使用
      await smsCode.markAsUsed();

      console.log(`✅ 验证码验证成功: ${phone}`);

      return {
        success: true,
        message: '验证码验证成功'
      };

    } catch (error) {
      console.error('❌ 验证验证码失败:', error.message);
      return {
        success: false,
        message: '验证失败，请稍后重试'
      };
    }
  }

  /**
   * 发送短信到互亿无线
   * @param {string} phone - 手机号
   * @param {string} content - 短信内容
   * @returns {Object} 发送结果
   */
  async sendSms(phone, content) {
    try {
      console.log(`📞 真实发送短信到 ${phone}: ${content}`);

      // 构建请求参数
      const params = new URLSearchParams({
        account: this.config.account,
        password: this.config.password,
        mobile: phone,
        content: content,
        format: 'json'
      });

      console.log(`📡 发送短信请求: ${this.config.url}`);

      // 发送HTTP请求
      const response = await axios.post(this.config.url, params, {
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log(`📨 短信服务响应:`, response.data);

      // 解析响应
      if (response.data && response.data.code === 2) {
        return {
          success: true,
          message: '短信发送成功',
          data: response.data
        };
      } else {
        const errorMsg = this.getErrorMessage(response.data?.code);
        throw new Error(errorMsg);
      }

    } catch (error) {
      console.error('❌ 短信发送失败:', error.message);
      
      if (error.response) {
        // HTTP请求错误
        console.error('HTTP响应错误:', error.response.data);
        throw new Error('短信服务暂时不可用，请稍后重试');
      } else if (error.request) {
        // 网络错误
        console.error('网络请求错误:', error.request);
        throw new Error('网络连接失败，请检查网络设置');
      } else {
        // 其他错误
        throw new Error(error.message || '短信发送失败');
      }
    }
  }

  /**
   * 保存验证码到数据库
   * @param {string} phone - 手机号
   * @param {string} code - 验证码
   * @param {string} type - 验证码类型
   * @param {string} ip - IP地址
   */
  async saveCode(phone, code, type, ip) {
    try {
      // 删除该手机号该类型的旧验证码
      await SmsCode.deleteMany({ phone, type });

      // 创建新验证码记录
      const smsCode = new SmsCode({
        phone,
        code,
        type,
        ip
      });

      await smsCode.save();
      console.log(`💾 验证码已保存: ${phone} - ${type}`);

    } catch (error) {
      console.error('❌ 保存验证码失败:', error.message);
      throw new Error('验证码保存失败');
    }
  }

  /**
   * 检查发送频率限制
   * @param {string} phone - 手机号
   * @param {string} ip - IP地址
   */
  async checkRateLimit(phone, ip) {
    const now = new Date();

    // 检查同一手机号发送间隔
    const lastPhoneCode = await SmsCode.findOne({ phone })
      .sort({ createdAt: -1 });

    if (lastPhoneCode) {
      const timeDiff = (now - lastPhoneCode.createdAt) / 1000;
      if (timeDiff < this.rateLimit.phoneInterval) {
        const waitTime = this.rateLimit.phoneInterval - Math.floor(timeDiff);
        throw new Error(`请等待 ${waitTime} 秒后再试`);
      }
    }

    // 检查同一IP发送间隔
    if (ip) {
      const lastIpCode = await SmsCode.findOne({ ip })
        .sort({ createdAt: -1 });

      if (lastIpCode) {
        const timeDiff = (now - lastIpCode.createdAt) / 1000;
        if (timeDiff < this.rateLimit.ipInterval) {
          const waitTime = this.rateLimit.ipInterval - Math.floor(timeDiff);
          throw new Error(`发送过于频繁，请等待 ${waitTime} 秒后再试`);
        }
      }
    }

    // 检查每日发送次数限制
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayCount = await SmsCode.countDocuments({
      phone,
      createdAt: { $gte: todayStart }
    });

    if (todayCount >= this.rateLimit.dailyLimit) {
      throw new Error('今日发送次数已达上限，请明天再试');
    }
  }

  /**
   * 验证手机号格式
   * @param {string} phone - 手机号
   * @returns {boolean} 是否有效
   */
  validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 格式化短信内容
   * @param {string} code - 验证码
   * @param {string} type - 验证码类型
   * @returns {string} 格式化后的内容
   */
  formatSmsContent(code, type) {
    // 必须与互亿无线平台报备的模板完全一致
    // 您的模板是：您的验证码是：【变量】。请不要把验证码泄露给其他人。
    return `您的验证码是：${code}。请不要把验证码泄露给其他人。`;
  }

  /**
   * 获取错误信息
   * @param {string|number} code - 错误代码
   * @returns {string} 错误信息
   */
  getErrorMessage(code) {
    const errorMessages = {
      '2': '短信发送成功',
      '4': '手机号不正确',
      '41': '余额不足',
      '42': '账户不存在',
      '43': '密码错误',
      '44': '手机号码为空',
      '45': '短信内容为空',
      '46': '无签名或签名格式不正确',
      '47': 'IP限制',
      '48': '手机号码发送太频繁，请稍后再发',
      '49': '提交速度太快',
      '50': '内容含有敏感词汇',
      '51': '手机号码不在发送范围内',
      '52': '内容过长',
      '53': '账户被禁用',
      '54': '指定发送时间不是有效的时间格式',
      '55': '指定发送时间早于当前时间',
      '4072': '短信内容与报备模板不匹配，请检查模板格式',
      '100': '未知错误'
    };

    return errorMessages[code?.toString()] || '短信发送失败，请稍后重试';
  }

  /**
   * 清理过期验证码
   */
  async cleanExpiredCodes() {
    try {
      const result = await SmsCode.cleanExpired();
      console.log(`🧹 清理过期验证码: ${result.deletedCount} 条`);
      return result;
    } catch (error) {
      console.error('❌ 清理过期验证码失败:', error.message);
    }
  }
}

// 创建服务实例
const smsService = new SmsService();

// 定期清理过期验证码（每小时清理一次）
setInterval(() => {
  smsService.cleanExpiredCodes();
}, 60 * 60 * 1000);

module.exports = smsService;
