const { encryptAES, decryptAES, isTimestampValid, generateDynamicKey } = require('./utils/crypto');

// 测试加密解密
const testCrypto = () => {
  console.log('=== 加密解密测试 ===');
  
  const timestamp = Date.now();
  const testPassword = 'admin123';
  
  console.log('原始密码:', testPassword);
  console.log('时间戳:', timestamp);
  
  // 生成密钥
  const key = generateDynamicKey(timestamp);
  console.log('生成的密钥:', key);
  
  try {
    // 加密
    const encrypted = encryptAES(testPassword, timestamp);
    console.log('加密后:', encrypted);
    
    // 解密
    const decrypted = decryptAES(encrypted, timestamp);
    console.log('解密后:', decrypted);
    
    // 验证
    console.log('加密解密是否成功:', testPassword === decrypted);
    
    // 测试时间戳验证
    console.log('时间戳是否有效:', isTimestampValid(timestamp));
    
    // 测试过期时间戳
    const oldTimestamp = timestamp - (11 * 60 * 1000); // 11分钟前
    console.log('过期时间戳是否有效:', isTimestampValid(oldTimestamp));
    
  } catch (error) {
    console.error('测试失败:', error);
  }
};

testCrypto();
