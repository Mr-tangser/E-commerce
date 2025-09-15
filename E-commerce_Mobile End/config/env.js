/**
 * 环境配置模块
 * 兼容处理环境变量和配置文件
 */

// 尝试从环境变量获取配置
let API_Global = null;

// 检查是否在支持process.env的环境中
if (typeof process !== 'undefined' && process.env) {
  API_Global = process.env.API_Global;
}

// 如果环境变量不可用，使用配置文件
if (!API_Global) {
  // 您可以在这里直接配置API地址
  // 这是一个备用方案，确保应用能够运行




  API_Global = '192.168.0.198:3000'; // 请根据实际情况修改


  
  console.log('📝 使用配置文件中的API地址:', API_Global);
  console.log('💡 提示: 如需修改API地址，请编辑 config/env.js 文件');
} else {
  console.log('🔧 使用环境变量API_Global:', API_Global);
}

// 验证配置
if (!API_Global || API_Global === 'your_server_ip:port') {
  console.error('❌ API地址未正确配置！');
  console.error('请在 config/env.js 文件中设置正确的API_Global值');
  console.error('或者确保.env文件中配置了API_Global环境变量');
}

// 解析IP和端口
const [SERVER_IP, SERVER_PORT] = API_Global ? API_Global.split(':') : ['localhost', '3000'];

// 导出配置
const ENV_CONFIG = {
  // 原始配置值
  API_Global: API_Global,
  
  // 解析后的值
  SERVER_IP: SERVER_IP,
  SERVER_PORT: SERVER_PORT || '3000',
  
  // 常用的URL
  BASE_URL: `http://${API_Global}/api`,
  SERVER_URL: `http://${API_Global}`,
  HEALTH_URL: `http://${API_Global}/health`,
  
  // AI客服服务配置（真机调试）
  AI_SERVICE_URL: `http://${SERVER_IP}:3001`, // AI客服独立服务
  
  // 配置验证
  isValid() {
    return API_Global && API_Global !== 'your_server_ip:port' && SERVER_IP && SERVER_PORT;
  },
  
  // 获取配置信息
  getInfo() {
    return {
      apiGlobal: API_Global,
      serverIP: SERVER_IP,
      serverPort: SERVER_PORT,
      baseURL: this.BASE_URL,
      serverURL: this.SERVER_URL,
      isValid: this.isValid()
    };
  }
};

// 启动时验证配置
if (!ENV_CONFIG.isValid()) {
  const errorMsg = `
🚨 API配置错误！

当前配置: ${API_Global}

解决方案：
1. 编辑 config/env.js 文件，修改 API_Global 的值
2. 或者确保 .env 文件存在且包含正确的 API_Global 配置

示例配置：
API_Global = '192.168.107.128:3000'
`;
  console.error(errorMsg);
  // 抛出错误以阻止应用启动
  throw new Error('API配置未正确设置，请检查 config/env.js 或 .env 文件');
}

export default ENV_CONFIG;
