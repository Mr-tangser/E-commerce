// API连接测试工具
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export const testApiConnection = async () => {
  try {
    console.log('🔍 测试API连接...');
    
    // 测试健康检查端点
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ 健康检查成功:', healthResponse.data);
    
    // 测试管理员登录
    const loginResponse = await axios.post(`${API_BASE_URL}/admin/login`, {
      email: 'admin@jsonapi.com',
      password: 'secret'
    });
    
    console.log('✅ 管理员登录测试成功:', loginResponse.data);
    
    return {
      success: true,
      message: '所有API测试通过',
      token: loginResponse.data.data.access_token
    };
    
  } catch (error) {
    console.error('❌ API测试失败:', error);
    
    let errorMessage = '未知错误';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Express服务器未运行或端口不匹配';
    } else if (error.response) {
      errorMessage = `HTTP ${error.response.status}: ${error.response.data?.error?.message || error.response.statusText}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: errorMessage,
      error: error
    };
  }
};

export const testAdminApi = async (token) => {
  try {
    console.log('🔍 测试管理员API...');
    
    const response = await axios.get(`${API_BASE_URL}/admin/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 管理员信息获取成功:', response.data);
    return { success: true, data: response.data };
    
  } catch (error) {
    console.error('❌ 管理员API测试失败:', error);
    return { success: false, error: error };
  }
};

// 在浏览器控制台中使用的快速测试函数
window.testAPI = async () => {
  const result = await testApiConnection();
  console.log('测试结果:', result);
  
  if (result.success && result.token) {
    const adminResult = await testAdminApi(result.token);
    console.log('管理员API测试结果:', adminResult);
  }
  
  return result;
};

console.log('📝 API测试工具已加载！在控制台运行 testAPI() 进行测试'); 
