/**
 * 百度AI API配置文件
 * 物品识别相关配置
 */

const baiduApiConfig = {
  // 百度AI API密钥配置
  credentials: {
    // 替换为你的百度AI API Key
    apiKey: '9gvvzsd0mWEahkfaPSvtf9V2',
    // 替换为你的百度AI Secret Key  
    secretKey: 'rX1wYmxxhOOvgy6ifUXbDcOSJjQFFKsJ'
  },

  // API端点配置
  endpoints: {
    // 获取访问令牌的端点
    tokenUrl: 'https://aip.baidubce.com/oauth/2.0/token',
    // 通用物体识别API端点 (主要使用这个)
    advancedGeneral: 'https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general',
    // 通用物体识别基础版
    generalBasic: 'https://aip.baidubce.com/rest/2.0/image-classify/v1/object_detect'
  },

  // API请求配置
  requestConfig: {
    // 超时时间 (毫秒)
    timeout: 30000,
    // 最大重试次数
    maxRetries: 3,
    // 重试间隔 (毫秒)
    retryDelay: 1000
  },

  // 识别参数配置
  recognitionParams: {
    // 百科词条数量
    baikeNum: 10,
    // 是否返回百科信息
    includeBaike: true
  }
};

/**
 * 获取百度API密钥
 * @returns {Object} 包含apiKey和secretKey的对象
 */
function getCredentials() {
  const { apiKey, secretKey } = baiduApiConfig.credentials;
  
  if (!apiKey || !secretKey || apiKey === 'your_baidu_api_key_here') {
    throw new Error('百度AI API密钥未配置，请在 config/baiduApi.js 中设置正确的 apiKey 和 secretKey');
  }
  
  return { apiKey, secretKey };
}

/**
 * 获取API端点URL
 * @param {string} endpointName 端点名称
 * @returns {string} API端点URL
 */
function getEndpoint(endpointName) {
  const endpoint = baiduApiConfig.endpoints[endpointName];
  if (!endpoint) {
    throw new Error(`未找到端点配置: ${endpointName}`);
  }
  return endpoint;
}

/**
 * 获取请求配置
 * @returns {Object} 请求配置对象
 */
function getRequestConfig() {
  return { ...baiduApiConfig.requestConfig };
}

/**
 * 获取识别参数配置
 * @returns {Object} 识别参数配置对象
 */
function getRecognitionParams() {
  return { ...baiduApiConfig.recognitionParams };
}

/**
 * 验证配置是否完整
 * @returns {boolean} 配置是否有效
 */
function validateConfig() {
  try {
    getCredentials();
    return true;
  } catch (error) {
    console.error('百度API配置验证失败:', error.message);
    return false;
  }
}

module.exports = {
  getCredentials,
  getEndpoint,
  getRequestConfig,
  getRecognitionParams,
  validateConfig,
  config: baiduApiConfig
};
