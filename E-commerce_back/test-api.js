// 快速API测试脚本
require('dotenv').config();
const axios = require('axios');

async function testAPI() {
  console.log('🚀 开始测试API接口...');
  
  const serverUrl = 'http://localhost:3000';
  
  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查接口...');
    const healthResponse = await axios.get(`${serverUrl}/health`);
    console.log('✅ 健康检查通过:', healthResponse.data);
    
    // 2. 测试识别接口路由存在性
    console.log('2. 测试识别接口路由...');
    try {
      const recognitionResponse = await axios.post(`${serverUrl}/api/recognition/identify`, 
        {}, 
        { validateStatus: () => true }
      );
      console.log(`识别接口响应状态: ${recognitionResponse.status}`);
      console.log('响应数据:', recognitionResponse.data);
    } catch (error) {
      console.error('识别接口测试失败:', error.message);
    }
    
    // 3. 检查百度API配置
    console.log('3. 检查百度API配置...');
    const apiKey = process.env.BAIDU_API_KEY;
    const secretKey = process.env.BAIDU_SECRET_KEY;
    
    console.log('BAIDU_API_KEY:', apiKey ? '已配置' : '❌ 未配置');
    console.log('BAIDU_SECRET_KEY:', secretKey ? '已配置' : '❌ 未配置');
    
    if (!apiKey || !secretKey) {
      console.error('❌ 百度API密钥未配置！请在.env文件中添加：');
      console.error('BAIDU_API_KEY=你的API密钥');
      console.error('BAIDU_SECRET_KEY=你的密钥');
    }
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 解决方案：');
      console.error('1. 确保后端服务器正在运行: npm start 或 npm run dev');
      console.error('2. 检查端口3000是否被占用');
      console.error('3. 检查防火墙设置');
    }
  }
}

testAPI().catch(console.error);
