// 全局API配置
import ENV_CONFIG from '../config/env.js'

// 从配置模块获取API地址配置
const SERVER_IP = ENV_CONFIG.SERVER_IP
const SERVER_PORT = ENV_CONFIG.SERVER_PORT

const API_CONFIG = {
  // 服务器IP地址
  SERVER_IP: SERVER_IP,
  // 服务器端口
  SERVER_PORT: SERVER_PORT || '3000',
  // API基础路径
  API_BASE_PATH: '/api',
  
  // 完整的API基础URL
  get BASE_URL() {
    return `http://${this.SERVER_IP}:${this.SERVER_PORT}${this.API_BASE_PATH}`;
  },
  
  // 获取服务器根URL（不包含/api路径）
  get SERVER_URL() {
    return `http://${this.SERVER_IP}:${this.SERVER_PORT}`;
  },
  
  // 获取WebSocket连接地址
  get WS_URL() {
    return `ws://${this.SERVER_IP}:${this.SERVER_PORT}`;
  },
  
  // 图片上传地址
  get UPLOAD_URL() {
    return `${this.BASE_URL}/upload`;
  },
  
  // 静态资源地址
  get STATIC_URL() {
    return `${this.SERVER_URL}/static`;
  }
};

// 环境配置
const ENV_CONFIG = {
  // 当前环境（development/production）
  NODE_ENV: 'development',
  
  // 是否启用调试模式
  DEBUG: true,
  
  // 请求超时时间（毫秒）
  REQUEST_TIMEOUT: 30000,
  
  // 重试次数
  MAX_RETRIES: 3
};

// 全局配置对象
const GlobalConfig = {
  // API相关配置
  API: API_CONFIG,
  
  // 环境配置
  ENV: ENV_CONFIG,
  
  // 快速获取常用URL的方法
  getApiUrl: () => API_CONFIG.BASE_URL,
  getServerUrl: () => API_CONFIG.SERVER_URL,
  getUploadUrl: () => API_CONFIG.UPLOAD_URL,
  getStaticUrl: () => API_CONFIG.STATIC_URL,
  
  // 更新服务器IP的方法
  updateServerIP: (newIP) => {
    API_CONFIG.SERVER_IP = newIP;
    console.log('服务器IP已更新为:', newIP);
  },
  
  // 更新服务器端口的方法
  updateServerPort: (newPort) => {
    API_CONFIG.SERVER_PORT = newPort;
    console.log('服务器端口已更新为:', newPort);
  }
};

// 导出配置
export default GlobalConfig;

// 也可以直接导出各个配置对象
export { API_CONFIG, ENV_CONFIG };