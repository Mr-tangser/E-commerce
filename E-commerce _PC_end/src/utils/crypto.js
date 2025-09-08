import CryptoJS from 'crypto-js';

// 固定的密钥基础（与后端保持一致）
const SECRET_KEY_BASE = 'QinPinHui2024AdminSystem';

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
  return CryptoJS.SHA256(combined).toString();
};

/**
 * AES加密
 * @param {string} text - 要加密的文本
 * @param {number} timestamp - 时间戳
 * @returns {string} 加密后的数据
 */
const encryptAES = (text, timestamp) => {
  try {
    const key = generateDynamicKey(timestamp);
    const iv = CryptoJS.lib.WordArray.random(128/8);
    
    // 使用hex解析密钥
    const keyWords = CryptoJS.enc.Hex.parse(key);
    
    const encrypted = CryptoJS.AES.encrypt(text, keyWords, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // 返回 IV(hex):加密数据(base64) 的格式，与后端兼容
    return iv.toString(CryptoJS.enc.Hex) + ':' + encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  } catch (error) {
    console.error('加密失败:', error);
    throw new Error('数据加密失败');
  }
};

/**
 * AES解密（测试用）
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
    
    const iv = CryptoJS.enc.Hex.parse(parts[0]);
    const encrypted = parts[1];
    
    // 解密
    const decrypted = CryptoJS.AES.decrypt(encrypted, CryptoJS.enc.Utf8.parse(key), {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('解密失败:', error);
    throw new Error('数据解密失败');
  }
};

/**
 * 获取当前时间戳
 * @returns {number} 当前时间戳
 */
const getCurrentTimestamp = () => {
  return Date.now();
};

export {
  encryptAES,
  decryptAES,
  getCurrentTimestamp,
  generateDynamicKey
};
