// API工具函数
const BASE_URL = 'http://192.168.160.128:3000/api'

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
    
    // 微信登录
    wechatLogin(code, phoneNumber, encryptedData, iv) {
      return request('/auth/wechat-login', {
        method: 'POST',
        data: { code, phoneNumber, encryptedData, iv }
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
