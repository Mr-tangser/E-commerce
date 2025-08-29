/**
 * 短信服务工具
 * 用于发送手机验证码
 * 当前为模拟实现，实际项目中可集成阿里云SMS、腾讯云SMS等
 */

const SmsCode = require('../models/SmsCode');

class SmsService {
  constructor() {
    // 在真实环境中，这里会包含SMS服务商的配置
    this.config = {
      // 阿里云SMS配置示例
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || 'your-access-key-id',
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || 'your-access-key-secret',
      signName: process.env.SMS_SIGN_NAME || '电商平台',
      templateCode: process.env.SMS_TEMPLATE_CODE || 'SMS_123456789'
    };
  }

  /**
   * 发送验证码
   * @param {string} phone - 手机号码
   * @param {string} type - 验证码类型
   * @param {string} ip - 客户端IP地址
   * @returns {Promise<Object>} 发送结果
   */
  async sendCode(phone, type = 'login', ip = '') {
    try {
      // 1. 验证手机号格式
      if (!this.validatePhone(phone)) {
        throw new Error('手机号格式不正确');
      }

      // 2. 检查发送频率限制（同一手机号1分钟内只能发送一次）
      await this.checkRateLimit(phone);

      // 3. 生成验证码
      const code = SmsCode.generateCode(6);

      // 4. 保存到数据库
      const smsCode = new SmsCode({
        phone,
        code,
        type,
        ip
      });
      await smsCode.save();

      // 5. 发送短信
      const sendResult = await this.sendSMS(phone, code, type);

      if (sendResult.success) {
        console.log(`✅ 验证码发送成功: ${phone} -> ${code} (类型: ${type})`);
        return {
          success: true,
          message: '验证码发送成功',
          data: {
            phone,
            type,
            // 开发环境下返回验证码，生产环境不应返回
            ...(process.env.NODE_ENV === 'development' && { code })
          }
        };
      } else {
        throw new Error(sendResult.message || '短信发送失败');
      }

    } catch (error) {
      console.error('❌ 发送验证码失败:', error.message);
      throw error;
    }
  }

  /**
   * 验证验证码
   * @param {string} phone - 手机号码
   * @param {string} code - 验证码
   * @param {string} type - 验证码类型
   * @returns {Promise<Object>} 验证结果
   */
  async verifyCode(phone, code, type = 'login') {
    try {
      // 1. 查找有效的验证码
      const smsCode = await SmsCode.findOne({
        phone,
        code,
        type,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 }); // 获取最新的验证码

      if (!smsCode) {
        return {
          success: false,
          message: '验证码无效或已过期'
        };
      }

      // 2. 标记验证码为已使用
      await smsCode.markAsUsed();

      console.log(`✅ 验证码验证成功: ${phone}`);
      return {
        success: true,
        message: '验证码验证成功',
        data: {
          phone,
          type
        }
      };

    } catch (error) {
      console.error('❌ 验证码验证失败:', error.message);
      throw error;
    }
  }

  /**
   * 实际发送短信（当前为模拟实现）
   * @param {string} phone - 手机号码
   * @param {string} code - 验证码
   * @param {string} type - 验证码类型
   * @returns {Promise<Object>} 发送结果
   */
  async sendSMS(phone, code, type) {
    // 当前为模拟实现
    console.log(`📱 模拟发送短信: ${phone} -> 验证码: ${code}`);
    
    // 模拟发送延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟99%的成功率
    const success = Math.random() > 0.01;

    if (success) {
      return {
        success: true,
        message: '短信发送成功',
        requestId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } else {
      return {
        success: false,
        message: '短信发送失败，请稍后重试'
      };
    }

    /* 
    // 真实的阿里云SMS发送示例代码：
    try {
      const Core = require('@alicloud/pop-core');
      
      const client = new Core({
        accessKeyId: this.config.accessKeyId,
        accessKeySecret: this.config.accessKeySecret,
        endpoint: 'https://dysmsapi.aliyuncs.com',
        apiVersion: '2017-05-25'
      });

      const params = {
        PhoneNumbers: phone,
        SignName: this.config.signName,
        TemplateCode: this.config.templateCode,
        TemplateParam: JSON.stringify({ code })
      };

      const result = await client.request('SendSms', params, {
        method: 'POST'
      });

      return {
        success: result.Code === 'OK',
        message: result.Message,
        requestId: result.RequestId
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
    */
  }

  /**
   * 验证手机号格式
   * @param {string} phone - 手机号码
   * @returns {boolean} 是否有效
   */
  validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 检查发送频率限制
   * @param {string} phone - 手机号码
   */
  async checkRateLimit(phone) {
    // 检查1分钟内是否已发送过验证码
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCode = await SmsCode.findOne({
      phone,
      createdAt: { $gt: oneMinuteAgo }
    });

    if (recentCode) {
      const remainingTime = Math.ceil((recentCode.createdAt.getTime() + 60 * 1000 - Date.now()) / 1000);
      throw new Error(`请等待 ${remainingTime} 秒后再次发送`);
    }
  }

  /**
   * 清理过期验证码
   */
  async cleanExpiredCodes() {
    try {
      const result = await SmsCode.cleanExpired();
      console.log(`🧹 清理了 ${result.deletedCount} 条过期验证码`);
      return result;
    } catch (error) {
      console.error('❌ 清理过期验证码失败:', error.message);
      throw error;
    }
  }
}

// 导出SMS服务单例
module.exports = new SmsService();
