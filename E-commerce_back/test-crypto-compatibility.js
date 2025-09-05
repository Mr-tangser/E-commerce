// 测试前后端加密解密兼容性

// 模拟前端crypto-js的输出格式
const crypto = require('crypto');

const SECRET_KEY_BASE = 'QinPinHui2024AdminSystem';

const generateDynamicKey = (timestamp) => {
  const minuteTimestamp = Math.floor(timestamp / (5 * 60 * 1000)) * (5 * 60 * 1000);
  const combined = `${SECRET_KEY_BASE}-${minuteTimestamp}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
};

// 模拟前端加密 (crypto-js风格)
const frontendEncryptAES = (text, timestamp) => {
  const key = generateDynamicKey(timestamp);
  const iv = crypto.randomBytes(16);
  const keyBuffer = Buffer.from(key, 'hex');
  
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('base64');
};

// 后端解密
const { decryptAES } = require('./utils/crypto');

const testPassword = 'secret123';
const timestamp = Date.now();

console.log('=== 加密解密兼容性测试 ===');
console.log('测试密码:', testPassword);
console.log('时间戳:', timestamp);

try {
  // 模拟前端加密
  const encrypted = frontendEncryptAES(testPassword, timestamp);
  console.log('前端加密结果:', encrypted);
  console.log('加密数据格式:', encrypted.split(':').length, '部分');
  console.log('IV长度:', encrypted.split(':')[0].length);
  console.log('加密数据长度:', encrypted.split(':')[1].length);
  
  // 后端解密
  const decrypted = decryptAES(encrypted, timestamp);
  console.log('后端解密结果:', decrypted);
  
  console.log('兼容性测试结果:', testPassword === decrypted ? '✅ 成功' : '❌ 失败');
} catch (error) {
  console.error('兼容性测试失败:', error);
}
