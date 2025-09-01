// API工具函数
import { getAPIBaseURL, CONNECTION_CONFIG, ERROR_MESSAGES } from '@/config/api-config.js';

const BASE_URL = getAPIBaseURL();
console.log('🔧 API配置初始化:', BASE_URL);

// 网络状态检测
const checkNetworkStatus = () => {
  return new Promise((resolve, reject) => {
    uni.getNetworkType({
      success: (res) => {
        console.log('📶 网络类型:', res.networkType);
        if (res.networkType === 'none') {
          reject(new Error('网络未连接，请检查网络设置'));
        } else {
          resolve(res.networkType);
        }
      },
      fail: (err) => {
        console.error('获取网络状态失败:', err);
        resolve('unknown'); // 假设网络可用
      }
    });
  });
};

// API连接测试
const testAPIConnection = async (testUrl = BASE_URL) => {
  try {
    console.log('🔗 测试API连接:', testUrl);
    
    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: `${testUrl}/products?limit=1`,
        method: 'GET',
        timeout: CONNECTION_CONFIG.timeout,
        success: resolve,
        fail: reject
      });
    });
    
    console.log('✅ API连接测试成功');
    return true;
  } catch (error) {
    console.error('❌ API连接测试失败:', error);
    return false;
  }
};

// 构建查询字符串的兼容性函数
function buildQuery(params = {}) {
  const query = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  return query;
}

// 通用请求方法
async function request(url, options = {}) {
  try {
    // 先检查网络状态
    await checkNetworkStatus();
    
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
        timeout: CONNECTION_CONFIG.timeout,
        success: (res) => {
          console.log(`API请求成功 ${url}:`, res);
          
          // 处理uni.request可能返回数组的情况
          let actualResponse = res;
          if (Array.isArray(res) && res.length > 1) {
            actualResponse = res[1];
          }
          
          if (actualResponse.statusCode === 200) {
            console.log(`API响应数据:`, actualResponse.data);
            resolve(actualResponse.data);
          } else {
            console.error(`API请求失败 ${url}:`, actualResponse);
            const errorMsg = actualResponse.data?.error?.message || `服务器错误(${actualResponse.statusCode})`;
            reject(new Error(errorMsg));
          }
        },
        fail: (err) => {
          console.error(`API请求异常 ${url}:`, err);
          let errorMessage = '网络连接失败';
          
          if (err.errMsg) {
            if (err.errMsg.includes('timeout')) {
              errorMessage = '请求超时，请检查网络连接';
            } else if (err.errMsg.includes('fail')) {
              errorMessage = '无法连接到服务器，请检查网络或服务器状态';
            } else if (err.errMsg.includes('abort')) {
              errorMessage = '请求被取消';
            } else {
              errorMessage = `网络错误: ${err.errMsg}`;
            }
          }
          
          reject(new Error(errorMessage));
        }
      });
    });
  } catch (networkError) {
    console.error('网络检测失败:', networkError);
    throw networkError;
  }
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
    },

    // 获取推荐商品
    getRecommendedProducts(params = {}) {
      const query = buildQuery(params);
      return request(`/products/recommended?${query}`);
    },

    // 基于浏览历史获取推荐商品
    getRecommendationsByHistory(browsingParams = {}) {
      return request('/products/recommendations/history', {
        method: 'POST',
        data: browsingParams
      });
    },

    // 获取相似商品
    getSimilarProducts(productId, params = {}) {
      const query = buildQuery(params);
      return request(`/products/${productId}/similar?${query}`);
    },

    // 获取新品推荐
    getNewProductRecommendations(params = {}) {
      return request('/products/recommendations/new', {
        method: 'POST',
        data: params
      });
    }
  },

  // 用户相关
  user: {
    // 用户登录
    login(username, password) {
      return request('/auth/login', {
        method: 'POST',
        data: { username, password }
      });
    },
    
    // 用户注册
    register(userData) {
      return request('/auth/register', {
        method: 'POST',
        data: userData
      });
    },
    
    // 获取用户信息
    getUserInfo(token) {
      return request('/auth/me', {
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

  // 系统相关
  system: {
    // 检查网络状态
    checkNetworkStatus,
    
    // 测试API连接
    testAPIConnection,
    
    // 获取当前API地址
    getAPIUrl() {
      return BASE_URL;
    },
    
    // 获取系统信息
    getSystemInfo() {
      return new Promise((resolve, reject) => {
        uni.getSystemInfo({
          success: (res) => {
            console.log('📱 系统信息:', res);
            resolve(res);
          },
          fail: reject
        });
      });
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
