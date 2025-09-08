/**
 * API配置文件
 * 根据不同环境和需求配置API地址
 */

// 获取当前设备的IP地址（需要用户手动配置）
const getCurrentDeviceIP = () => {
  // 这里用户需要根据实际情况填写电脑的IP地址
  // 可以通过以下方式获取电脑IP：
  // Windows: 打开cmd，输入 ipconfig，查看IPv4地址
  // Mac: 打开终端，输入 ifconfig，查看inet地址
  // 或者在HBuilderX控制台启动时会显示IP地址
  
  return '192.168.107.128'; // 请替换为实际的电脑IP地址
};

// API配置
const API_CONFIG = {
  // 开发环境配置
  development: {
    // 本地开发（HBuilderX内置浏览器）
    local: `http://localhost:3000/api`,
    
    // 真机调试（手机访问电脑）
    mobile: `http://${getCurrentDeviceIP()}:3000/api`,
    
    // 局域网访问
    lan: `http://${getCurrentDeviceIP()}:3000/api`
  },
  
  // 生产环境配置
  production: {
    // 正式服务器地址（需要配置实际的服务器）
    server: 'https://your-api-domain.com/api'
  },
  
  // 测试环境配置
  testing: {
    server: 'https://test-api-domain.com/api'
  }
};

// 自动选择API地址
const getAPIBaseURL = () => {
  // #ifdef H5
  // H5环境：浏览器
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('🌐 H5本地环境，使用localhost');
      return API_CONFIG.development.local;
    } else {
      console.log('🌐 H5生产环境');
      return API_CONFIG.production.server;
    }
  }
  // #endif
  
  // #ifdef APP-PLUS
  // App环境：真机或模拟器
  console.log('📱 App环境，使用移动设备配置');
  return API_CONFIG.development.mobile;
  // #endif
  
  // #ifdef MP-WEIXIN || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO || MP-QQ
  // 小程序环境：只支持https
  console.log('🏪 小程序环境');
  return API_CONFIG.production.server;
  // #endif
  
  // 默认配置
  console.log('🔧 使用默认配置');
  return API_CONFIG.development.mobile;
};

// 连接测试配置
const CONNECTION_CONFIG = {
  // 超时时间（毫秒）
  timeout: 15000,
  
  // 重试次数
  retryCount: 3,
  
  // 重试间隔（毫秒）
  retryDelay: 2000,
  
  // 测试端点
  testEndpoint: '/products?limit=1'
};

// 错误消息配置
const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  API_ERROR: 'API服务器连接失败',
  TIMEOUT_ERROR: '请求超时，请检查网络速度',
  SERVER_ERROR: '服务器内部错误',
  
  // 真机调试常见问题
  MOBILE_DEBUG_TIPS: `真机调试连接失败，请检查：
1. 手机和电脑是否在同一WiFi网络
2. 电脑防火墙是否允许端口3000
3. 后端服务是否已启动 (npm start)
4. IP地址是否正确: ${getCurrentDeviceIP()}
5. 尝试重启HBuilderX和重新运行项目`,
  
  CONFIG_TIPS: `如需修改API地址，请编辑：
E-commerce_Mobile End/config/api-config.js
在getCurrentDeviceIP()函数中填写正确的IP地址`
};

export {
  API_CONFIG,
  CONNECTION_CONFIG,
  ERROR_MESSAGES,
  getAPIBaseURL,
  getCurrentDeviceIP
};

