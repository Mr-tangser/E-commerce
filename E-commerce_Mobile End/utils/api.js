// API工具函数
import ENV_CONFIG from '../config/env.js'

// 从配置模块获取API地址
const BASE_URL = ENV_CONFIG.BASE_URL

console.log('🔧 API配置信息:', ENV_CONFIG.getInfo());

// 构建查询字符串的兼容性函数
function buildQuery(params = {}) {
  const query = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  return query;
}

// 通用请求方法
function request(url, options = {}) {
  const fullUrl = `${BASE_URL}${url}`;
  console.log(`发起API请求: ${options.method || 'GET'} ${fullUrl}`);

  return new Promise((resolve, reject) => {
    uni.request({
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': options.token ? `Bearer ${options.token}` : '',
        ...options.header
      },
      timeout: 30000, // 30秒超时
      success: (res) => {
        console.log(`API请求成功 ${url}:`, res);

        // 处理uni.request可能返回数组的情况
        let actualResponse = res;
        if (Array.isArray(res) && res.length > 1) {
          actualResponse = res[1];
        }

        // 检查成功状态码范围（200-299）
        if (actualResponse.statusCode >= 200 && actualResponse.statusCode < 300) {
          console.log(`API响应数据:`, actualResponse.data);
          resolve(actualResponse.data);
        } else {
          console.error(`API请求失败 ${url}:`, actualResponse);
          reject(new Error(`请求失败: ${actualResponse.statusCode} - ${actualResponse.data?.error?.message || '未知错误'}`));
        }
      },
      fail: (err) => {
        console.error(`API请求异常 ${url}:`, err);
        if (err.errMsg && err.errMsg.includes('timeout')) {
          reject(new Error('请求超时，请检查网络连接'));
        } else if (err.errMsg && err.errMsg.includes('fail')) {
          reject(new Error('网络连接失败，请检查服务器是否运行'));
        } else {
          reject(new Error(`网络错误: ${err.errMsg || '未知错误'}`));
        }
      }
    });
  });
}

// API方法
const api = {
  // 分类相关
  category: {
    // 获取首页分类（带推荐商品）
    getHomepageCategories() {
      return request('/categories/homepage');
    },

    // 获取所有分类（树形结构）
    getAllCategories() {
      return request('/categories');
    },

    // 获取分类商品
    getCategoryProducts(categoryId, params = {}) {
      const query = buildQuery({
        category: categoryId,
        ...params
      });
      return request(`/products?${query}`);
    }
  },

  // 商品相关
  product: {
    // 获取商品列表
    getProducts(params = {}) {
      try {
        const query = buildQuery(params);
        console.log('构建商品API查询:', query);
        const url = `/products${query ? '?' + query : ''}`;
        console.log('商品API请求URL:', url);
        return request(url);
      } catch (error) {
        console.error('构建商品API请求失败:', error);
        throw error;
      }
    },

    // 获取商品详情
    getProductById(id) {
      return request(`/products/${id}`);
    },

    // 搜索商品
    searchProducts(keyword, params = {}) {
      const query = buildQuery({
        search: keyword,
        ...params
      });
      return request(`/products/search?${query}`);
    }
  },

  // 用户相关
  user: {
    // 用户登录（邮箱密码）
    login(email, password) {
      return request('/auth/login', {
        method: 'POST',
        data: { email, password }
      });
    },
    // 用户登录（一键登录）
    loginByUniverify(phone, access_token, openid) {
      return request('/auth/univerify-login', {
        method: 'POST',
        data: { phone, access_token, openid }
      });
    },

    // 手机验证码登录
    loginByPhone(phone, code) {
      return request('/auth/login-by-phone', {
        method: 'POST',
        data: { phone, code }
      });
    },

    // 手机密码登录
    loginByPhonePassword(phone, password) {
      return request('/auth/login-by-phone-password', {
        method: 'POST',
        data: { phone, password }
      });
    },


    // 发送手机验证码
    sendCode(phone, type = 'login') {
      return request('/auth/send-code', {
        method: 'POST',
        data: { phone, type }
      });
    },

    // 用户注册
    register(userData) {
      return request('/auth/register', {
        method: 'POST',
        data: userData
      });
    },

    // 更新用户信息
    updateUserInfo(userInfo, token) {
      return request('/users/profile', {
        method: 'PUT',
        data: userInfo,
        token
      });
    },

    // 获取用户信息
    getUserInfo(token) {
      return request('/auth/me', {
        token
      });
    },

    // 获取用户人脸注册状态
    getFaceStatus(token) {
      return request('/auth/face-status', {
        token
      });
    },

    // 删除用户人脸信息
    deleteFaceData(token) {
      return request('/auth/face-data', {
        method: 'DELETE',
        token
      });
    }
  },

  // 订单相关
  order: {
    // 创建订单
    createOrder(orderData, token) {
      return request('/orders', {
        method: 'POST',
        data: orderData,
        token
      });
    },

    // 获取用户订单列表
    getUserOrders(token, params = {}) {
      const query = buildQuery(params);
      return request(`/orders?${query}`, {
        token
      });
    },

    // 获取订单详情
    getOrderById(id, token) {
      return request(`/orders/${id}`, {
        token
      });
    }
  },

  // 支付相关
  payment: {
    // 创建支付宝支付订单
    createAlipayPayment(paymentData, token) {
      return request('/payment/alipay/create', {
        method: 'POST',
        data: paymentData,
        token
      });
    },

    // 查询支付状态
    queryPaymentStatus(orderNumber, token) {
      return request(`/payment/alipay/query/${orderNumber}`, {
        token
      });
    },

    // 测试支付接口连通性
    testPayment() {
      return request('/payment/test');
    }
  },

  // 物品识别相关
  recognition: {
    // 图片识别 - 看图识万物
    identifyImage(imageFile, token) {
      return new Promise((resolve, reject) => {
        const fullUrl = `${BASE_URL}/recognition/identify`;
        
        console.log('🔍 发起图片识别请求:', fullUrl);
        console.log('📝 请求参数:', { imageFile, token: token ? '已提供' : '未提供' });
        
        uni.uploadFile({
          url: fullUrl,
          filePath: imageFile,
          name: 'image',
          header: {
            'Authorization': `Bearer ${token}`
          },
          success: (res) => {
            console.log('📸 图片识别原始响应:', res);
            
            // 检查响应状态
            if (res.statusCode !== 200) {
              console.error('❌ API响应状态异常:', res.statusCode, res.data);
              reject(new Error(`服务器响应异常: ${res.statusCode}`));
              return;
            }
            
            // 检查响应数据类型
            if (typeof res.data !== 'string') {
              console.error('❌ API响应数据类型异常:', typeof res.data, res.data);
              reject(new Error('服务器响应格式异常'));
              return;
            }
            
            // 检查是否是HTML错误页面
            if (res.data.trim().toLowerCase().startsWith('<html') || 
                res.data.trim().toLowerCase().startsWith('<!doctype')) {
              console.error('❌ 服务器返回HTML错误页面:', res.data.substring(0, 100));
              reject(new Error('服务器错误，请确保后端服务正常运行'));
              return;
            }
            
            try {
              const result = JSON.parse(res.data);
              console.log('✅ 解析识别结果成功:', result);
              
              if (result.success) {
                resolve(result);
              } else {
                reject(new Error(result.message || '识别失败'));
              }
            } catch (error) {
              console.error('❌ JSON解析失败:', error);
              console.error('原始响应数据:', res.data);
              reject(new Error(`识别结果解析失败: ${error.message}`));
            }
          },
          fail: (error) => {
            console.error('📸 图片识别失败详细信息:', error);
            console.error('📸 错误对象属性:', Object.keys(error));
            console.error('📸 错误消息:', error.errMsg);
            console.error('📸 错误代码:', error.errCode);
            
            let errorMessage = '图片上传失败';
            if (error.errMsg) {
              if (error.errMsg.includes('timeout')) {
                errorMessage = '网络超时，请检查网络连接';
              } else if (error.errMsg.includes('network')) {
                errorMessage = '网络连接失败，请检查服务器地址';
              } else if (error.errMsg.includes('file not found')) {
                errorMessage = '文件不存在或路径错误';
              } else {
                errorMessage = `上传失败: ${error.errMsg}`;
              }
            }
            
            reject(new Error(errorMessage));
          }
        });
      });
    },

    // 通用物体识别
    generalRecognition(imageFile, token) {
      return new Promise((resolve, reject) => {
        const fullUrl = `${BASE_URL}/recognition/general`;
        console.log('🔍 发起通用物体识别请求:', fullUrl);
        
        // 检查token
        if (!token) {
          reject(new Error('用户未登录，请先登录'));
          return;
        }

        // 检查图片文件路径
        console.log('📁 通用识别-图片文件路径:', imageFile);
        console.log('🌐 通用识别-上传URL:', fullUrl);

        console.log('🔧 准备上传参数:', {
          url: fullUrl,
          filePath: imageFile,
          name: 'image',
          token: token ? `${token.substring(0, 10)}...` : '无token'
        });

        uni.uploadFile({
          url: fullUrl,
          filePath: imageFile,
          name: 'image',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000, // 30秒超时
          success: (res) => {
            console.log('📸 通用识别原始响应:', res);
            
            // 检查响应状态
            if (res.statusCode !== 200) {
              console.error('❌ API响应状态异常:', res.statusCode, res.data);
              reject(new Error(`服务器响应异常: ${res.statusCode}`));
              return;
            }
            
            // 检查响应数据类型
            if (typeof res.data !== 'string') {
              console.error('❌ API响应数据类型异常:', typeof res.data, res.data);
              reject(new Error('服务器响应格式异常'));
              return;
            }
            
            // 检查是否是HTML错误页面
            if (res.data.trim().toLowerCase().startsWith('<html') || 
                res.data.trim().toLowerCase().startsWith('<!doctype')) {
              console.error('❌ 服务器返回HTML错误页面:', res.data.substring(0, 100));
              reject(new Error('服务器错误，请确保后端服务正常运行'));
              return;
            }
            
            try {
              const result = JSON.parse(res.data);
              console.log('✅ 解析通用识别结果成功:', result);
              
              if (result.success) {
                resolve(result);
              } else {
                reject(new Error(result.message || '识别失败'));
              }
            } catch (error) {
              console.error('❌ JSON解析失败:', error);
              console.error('原始响应数据:', res.data);
              reject(new Error(`识别结果解析失败: ${error.message}`));
            }
          },
          fail: (error) => {
            console.error('📸 通用识别失败:', error);
            reject(new Error(error.errMsg || '图片上传失败'));
          }
        });
      });
    },

    // URL图片识别
    identifyImageUrl(imageUrl, token) {
      return request('/recognition/identify-url', {
        method: 'POST',
        data: { imageUrl },
        token
      });
    },

    // 获取识别历史
    getHistory(params = {}, token) {
      const query = buildQuery(params);
      return request(`/recognition/history?${query}`, {
        token
      });
    },

    // 获取识别记录详情
    getDetail(id, token) {
      return request(`/recognition/detail/${id}`, {
        token
      });
    },

    // 删除识别记录
    deleteRecord(id, token) {
      return request(`/recognition/${id}`, {
        method: 'DELETE',
        token
      });
    },

    // 获取识别统计
    getStats(token) {
      return request('/recognition/stats', {
        token
      });
    }
  },

  // 系统相关
  system: {
    // 获取系统信息
    getSystemInfo() {
      return new Promise((resolve) => {
        uni.getSystemInfo({
          success: (res) => {
            resolve(res);
          },
          fail: (err) => {
            console.error('获取系统信息失败:', err);
            resolve({
              platform: 'unknown',
              system: 'unknown',
              networkType: 'unknown'
            });
          }
        });
      });
    },

    // 检查网络状态
    checkNetworkStatus() {
      return new Promise((resolve) => {
        uni.getNetworkType({
          success: (res) => {
            resolve(res.networkType);
          },
          fail: (err) => {
            console.error('获取网络状态失败:', err);
            resolve('unknown');
          }
        });
      });
    },

    // 测试API连接
    async testAPIConnection() {
      try {
        // 注意：健康检查端点在根路径，不在/api下
        const fullUrl = BASE_URL.replace('/api', '') + '/health';
        console.log('🔗 测试API连接:', fullUrl);

        return new Promise((resolve) => {
          uni.request({
            url: fullUrl,
            method: 'GET',
            timeout: 10000,
            success: (res) => {
              console.log('✅ API连接测试成功:', res);
              if (res.statusCode === 200 && res.data && res.data.status === 'success') {
                resolve(true);
              } else {
                resolve(false);
              }
            },
            fail: (err) => {
              console.error('❌ API连接测试失败:', err);
              resolve(false);
            }
          });
        });
      } catch (error) {
        console.error('API连接测试异常:', error);
        return false;
      }
    },

    // 获取API地址
    getAPIUrl() {
      return BASE_URL;
    }
  }
};

// 错误处理
api.handleError = (error, defaultMessage = '网络错误，请重试') => {
  console.error('API错误:', error);

  let message = defaultMessage;
  if (error.response && error.response.data && error.response.data.error) {
    message = error.response.data.error.message;
  } else if (error.message) {
    message = error.message;
  }

  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  });
};

// 数据转换工具
api.transformers = {
  // 转换后端商品数据为前端所需格式
  productToFrontend(product) {
    return {
      id: product._id,
      name: product.name,
      price: product.price.toFixed(2),
      vip_price: product.memberPrice ? product.memberPrice.toFixed(2) : product.price.toFixed(2),
      img: product.images && product.images.length > 0 ? product.images[0] : '/static/img/default_product.png',
      is_goods: product.isFeatured ? 1 : 0,
      originalPrice: product.originalPrice ? product.originalPrice.toFixed(2) : null,
      stock: product.stock,
      rating: product.rating?.average || 0,
      sales: product.sales?.totalSold || 0,
      description: product.description
    };
  },

  // 转换后端分类数据为前端导航格式
  categoryToNavigation(categories) {
    console.log('🔄 转换分类数据为导航格式，输入:', categories.length, '个分类');

    const navData = categories.map((category, index) => {
      const navItem = {
        id: category._id,
        name: category.homeDisplay?.homeTitle || category.name,
        icon: category.homeDisplay?.homeIcon,
        color: category.homeDisplay?.homeColor,
        subtitle: category.homeDisplay?.homeSubtitle,
        order: category.homeDisplay?.homeOrder || index
      };

      console.log(`📍 导航项${index + 1}:`, navItem);
      return navItem;
    }).sort((a, b) => a.order - b.order); // 按order排序

    console.log('✅ 导航数据转换完成:', navData.length, '个导航项');
    return navData;
  },

  // 转换后端分类数据为分类标签格式
  categoryToClassList(categories) {
    console.log('🔄 转换分类数据为标签格式，输入:', categories.length, '个分类');

    const classList = [{ id: 0, name: '首页' }];

    // 按homeOrder排序并转换
    const sortedCategories = categories.sort((a, b) =>
      (a.homeDisplay?.homeOrder || 0) - (b.homeDisplay?.homeOrder || 0)
    );

    sortedCategories.forEach((category, index) => {
      const displayName = category.homeDisplay?.homeTitle || category.name;
      const shortName = displayName.length > 4 ? displayName.substr(0, 4) : displayName;

      const classItem = {
        id: category._id,
        name: shortName
      };

      console.log(`🏷️ 标签项${index + 1}:`, classItem);
      classList.push(classItem);
    });

    console.log('✅ 标签数据转换完成:', classList.length, '个标签');
    return classList;
  }
};

export default api;
