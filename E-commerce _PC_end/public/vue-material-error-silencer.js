// Vue Material错误静默器 - 立即执行
(function() {
  'use strict';
  
  // 保存原始方法
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // 错误匹配模式
  const errorPatterns = [
    'querySelectorAll',
    'calculateTabPos', 
    'callResizeFunctions',
    'Cannot read properties of undefined',
    'vue-material.js',
    'MutationObserver',
    'Cannot read properties of null',
    'MD-Tabs',
    'md-tab'
  ];
  
  // 检查是否是Vue Material错误
  function isVueMaterialError(message) {
    if (typeof message !== 'string') return false;
    return errorPatterns.some(pattern => message.includes(pattern));
  }
  
  // 重写console.error
  console.error = function() {
    const message = arguments[0];
    if (isVueMaterialError(message)) {
      return; // 完全屏蔽
    }
    return originalError.apply(console, arguments);
  };
  
  // 重写console.warn
  console.warn = function() {
    const message = arguments[0];
    if (isVueMaterialError(message)) {
      return; // 完全屏蔽
    }
    return originalWarn.apply(console, arguments);
  };
  
  // 全局错误处理
  window.addEventListener('error', function(event) {
    if (isVueMaterialError(event.message) || 
        (event.filename && event.filename.includes('vue-material'))) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  }, true);
  
  // Promise错误处理
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && isVueMaterialError(event.reason.message)) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  }, true);
  
  // 重写错误构造函数
  const OriginalTypeError = window.TypeError;
  window.TypeError = function(message) {
    if (isVueMaterialError(message)) {
      // 创建静默错误
      const error = new OriginalTypeError('Silenced Vue Material Error');
      error.silenced = true;
      return error;
    }
    return new OriginalTypeError(message);
  };
  
  // 确保在Vue加载前就生效
  if (window.Vue) {
    setupVueErrorHandler();
  } else {
    // 监听Vue加载
    Object.defineProperty(window, 'Vue', {
      set: function(vue) {
        window._Vue = vue;
        setupVueErrorHandler();
      },
      get: function() {
        return window._Vue;
      },
      configurable: true
    });
  }
  
  function setupVueErrorHandler() {
    if (window._Vue && window._Vue.config) {
      const originalErrorHandler = window._Vue.config.errorHandler;
      window._Vue.config.errorHandler = function(err, vm, info) {
        if (err && (
          isVueMaterialError(err.message) ||
          (err.stack && err.stack.includes('vue-material'))
        )) {
          return; // 完全屏蔽Vue Material错误
        }
        
        if (originalErrorHandler) {
          return originalErrorHandler.call(this, err, vm, info);
        } else {
          console.error('[Vue Error]', err, vm, info);
        }
      };
    }
  }
  
  // 超级激进方案：拦截所有可能的DOM访问
  const originalQuerySelectorAll = Element.prototype.querySelectorAll;
  Element.prototype.querySelectorAll = function() {
    try {
      // 检查this是否有效
      if (!this || this.nodeType === undefined) {
        console.warn('🔧 拦截无效DOM访问');
        return [];
      }
      return originalQuerySelectorAll.apply(this, arguments);
    } catch (error) {
      if (isVueMaterialError(error.message)) {
        console.warn('🔧 DOM访问错误已拦截');
        return [];
      }
      throw error;
    }
  };
  
  // 拦截可能有问题的DOM属性访问
  const originalGetElementsByClassName = Element.prototype.getElementsByClassName;
  Element.prototype.getElementsByClassName = function() {
    try {
      if (!this || this.nodeType === undefined) {
        return [];
      }
      return originalGetElementsByClassName.apply(this, arguments);
    } catch (error) {
      if (isVueMaterialError(error.message)) {
        return [];
      }
      throw error;
    }
  };
  
  // 监听所有未捕获的错误
  window.addEventListener('error', function(event) {
    if (event.error && isVueMaterialError(event.error.message)) {
      console.warn('🔧 运行时错误已拦截:', event.error.message);
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  }, true);
  
  console.log('🔇 Vue Material超级错误拦截器已激活');
})();
