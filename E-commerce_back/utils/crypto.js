const crypto = require('crypto');

// 固定的密钥基础（实际项目中应该放在环境变量中）
const SECRET_KEY_BASE = process.env.CRYPTO_SECRET_KEY || 'QinPinHui2024AdminSystem';

/**
 * 生成基于时间戳的动态密钥
 * @param {number} timestamp - 时间戳（分钟级别）
 * @returns {string} 64位密钥 (32字节)
 */
const generateDynamicKey = (timestamp) => {
  // 将时间戳转换为分钟级别（忽略秒数，提供5分钟容错）
  const minuteTimestamp = Math.floor(timestamp / (5 * 60 * 1000)) * (5 * 60 * 1000);
  
  // 组合固定密钥和时间戳
  const combined = `${SECRET_KEY_BASE}-${minuteTimestamp}`;
  
  // 生成64位SHA256密钥 (32字节)
  return crypto.createHash('sha256').update(combined).digest('hex');
};

/**
 * AES解密 (兼容crypto-js格式)
 * @param {string} encryptedData - 加密的数据
 * @param {number} timestamp - 时间戳
 * @returns {string} 解密后的数据
 */
const decryptAES = (encryptedData, timestamp) => {
  try {
    const key = generateDynamicKey(timestamp);
    
    // 分离IV和加密数据
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    // crypto-js输出的是hex格式，需要转换为Buffer
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedBuffer = Buffer.from(parts[1], 'base64'); // crypto-js使用base64编码加密数据
    
    // 创建32字节的密钥Buffer
    const keyBuffer = Buffer.from(key, 'hex');
    
    // 解密
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
    decipher.setAutoPadding(true); // 确保自动填充
    
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('解密失败:', error);
    throw new Error('数据解密失败');
  }
};

/**
 * 验证时间戳是否在有效范围内（10分钟内）
 * @param {number} timestamp - 客户端时间戳
 * @returns {boolean} 是否有效
 */
const isTimestampValid = (timestamp) => {
  const now = Date.now();
  const diff = Math.abs(now - timestamp);
  
  // 允许10分钟的时间差（考虑客户端时间可能不准确）
  return diff <= 10 * 60 * 1000;
};

/**
 * AES加密（测试用，兼容crypto-js格式）
 * @param {string} text - 要加密的文本
 * @param {number} timestamp - 时间戳
 * @returns {string} 加密后的数据
 */
const encryptAES = (text, timestamp) => {
  try {
    const key = generateDynamicKey(timestamp);
    const iv = crypto.randomBytes(16);
    
    // 创建32字节的密钥Buffer
    const keyBuffer = Buffer.from(key, 'hex');
    
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    cipher.setAutoPadding(true);
    
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // 返回格式：IV(hex):加密数据(base64) - 与crypto-js兼容
    return iv.toString('hex') + ':' + encrypted.toString('base64');
  } catch (error) {
    console.error('加密失败:', error);
    throw new Error('数据加密失败');
  }
};

module.exports = {
  decryptAES,
  encryptAES,
  isTimestampValid,
  generateDynamicKey
};
