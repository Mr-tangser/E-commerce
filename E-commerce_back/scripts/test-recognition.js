const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 测试百度AI API连接
async function testBaiduAPI() {
  console.log('🧪 开始测试百度AI API...');
  
  const API_KEY = process.env.BAIDU_API_KEY;
  const SECRET_KEY = process.env.BAIDU_SECRET_KEY;
  
  if (!API_KEY || !SECRET_KEY) {
    console.error('❌ 请在.env文件中配置BAIDU_API_KEY和BAIDU_SECRET_KEY');
    return false;
  }
  
  try {
    // 1. 获取访问令牌
    console.log('📋 获取访问令牌...');
    const tokenResponse = await axios.post(
      `https://aip.baidubce.com/oauth/2.0/token`,
      null,
      {
        params: {
          grant_type: 'client_credentials',
          client_id: API_KEY,
          client_secret: SECRET_KEY
        }
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    console.log('✅ 访问令牌获取成功');
    
    // 2. 测试图片识别 (使用一个简单的测试图片URL)
    console.log('🖼️ 测试图片识别...');
    const testImageUrl = 'https://pic1.zhimg.com/v2-5c5be1fd12c8e5c5c4a9e3f8b2e2c2b0_r.jpg'; // 一个苹果的图片
    
    const recognitionResponse = await axios.post(
      `https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general`,
      {
        url: testImageUrl,
        baike_num: 5
      },
      {
        params: {
          access_token: accessToken
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (recognitionResponse.data.result && recognitionResponse.data.result.length > 0) {
      console.log('✅ 图片识别测试成功');
      console.log('📊 识别结果:', recognitionResponse.data.result[0]);
      return true;
    } else {
      console.log('⚠️ 识别结果为空，但API调用成功');
      return true;
    }
    
  } catch (error) {
    console.error('❌ 百度AI API测试失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试本地API接口
async function testLocalAPI() {
  console.log('\n🌐 开始测试本地API接口...');
  
  const baseURL = 'http://localhost:3000';
  
  try {
    // 测试健康检查
    console.log('💓 测试健康检查接口...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ 健康检查通过:', healthResponse.data.message);
    
    // 测试识别接口（需要先登录获取token）
    console.log('🔐 注意：识别接口需要登录令牌，请确保有有效的用户账号');
    console.log('📝 可以使用以下curl命令测试识别接口:');
    console.log(`
curl -X POST "${baseURL}/api/recognition/identify" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: multipart/form-data" \\
  -F "image=@/path/to/your/image.jpg"
    `);
    
  } catch (error) {
    console.error('❌ 本地API测试失败:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 请确保本地服务器正在运行 (npm run dev)');
    }
  }
}

// 主函数
async function main() {
  console.log('🚀 物品识别功能测试');
  console.log('=' .repeat(50));
  
  // 加载环境变量
  require('dotenv').config();
  
  // 测试百度API
  const baiduResult = await testBaiduAPI();
  
  if (baiduResult) {
    console.log('\n🎉 百度AI API配置正确，可以正常使用识别功能');
  } else {
    console.log('\n❌ 百度AI API配置有问题，请检查配置');
  }
  
  // 测试本地API
  await testLocalAPI();
  
  console.log('\n📚 更多信息请查看: 物品识别配置说明.md');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testBaiduAPI, testLocalAPI };
