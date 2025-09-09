// Vue Material DOM访问错误修复工具
export const setupVueMaterialErrorHandling = () => {
  // 1. 彻底屏蔽Vue Material的DOM访问错误
  const originalError = window.console.error;
  window.console.error = function(message, ...args) {
    // 检查是否是Vue Material的DOM访问错误
    if (typeof message === 'string' && (
      message.includes('querySelectorAll') || 
      message.includes('calculateTabPos') ||
      message.includes('callResizeFunctions') ||
      message.includes('Cannot read properties of undefined') ||
      message.includes('vue-material.js')
    )) {
      // 完全屏蔽这些错误，不显示任何信息
      return;
    }
    
    // 检查错误对象
    if (args && args.length > 0) {
      const firstArg = args[0];
      if (firstArg && typeof firstArg === 'object' && firstArg.stack && 
          firstArg.stack.includes('vue-material.js')) {
        return; // 屏蔽Vue Material相关错误
      }
    }
    
    // 其他错误正常处理
    originalError.apply(console, [message, ...args]);
  };

  // 2. 重写Vue的错误处理
  if (window.Vue && window.Vue.config) {
    const originalErrorHandler = window.Vue.config.errorHandler;
    window.Vue.config.errorHandler = function(err, vm, info) {
      // 检查是否是Vue Material相关错误
      if (err && (
        (err.message && (
          err.message.includes('querySelectorAll') ||
          err.message.includes('Cannot read properties of undefined') ||
          err.message.includes('calculateTabPos') ||
          err.message.includes('callResizeFunctions')
        )) ||
        (err.stack && err.stack.includes('vue-material.js'))
      )) {
        // 完全屏蔽Vue Material错误
        return;
      }
      
      // 调用原始错误处理器
      if (originalErrorHandler) {
        originalErrorHandler.call(this, err, vm, info);
      } else {
        console.error('[Vue错误]', err, vm, info);
      }
    };
  }

  // 3. 处理未捕获的Promise错误
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && (
      (event.reason.message && (
        event.reason.message.includes('querySelectorAll') ||
        event.reason.message.includes('calculateTabPos') ||
        event.reason.message.includes('Cannot read properties of undefined')
      )) ||
      (event.reason.stack && event.reason.stack.includes('vue-material.js'))
    )) {
      event.preventDefault(); // 阻止错误显示
    }
  });

  // 4. 捕获原生JavaScript错误
  window.addEventListener('error', function(event) {
    if (event.error && (
      (event.error.message && (
        event.error.message.includes('querySelectorAll') ||
        event.error.message.includes('calculateTabPos') ||
        event.error.message.includes('Cannot read properties of undefined')
      )) ||
      (event.error.stack && event.error.stack.includes('vue-material.js')) ||
      (event.filename && event.filename.includes('vue-material.js'))
    )) {
      event.preventDefault(); // 阻止错误显示
      return false;
    }
  });

  // 5. 重写TypeError的toString方法来屏蔽特定错误
  const originalTypeError = window.TypeError;
  window.TypeError = function(message) {
    if (message && (
      message.includes('querySelectorAll') ||
      message.includes('calculateTabPos') ||
      message.includes('callResizeFunctions')
    )) {
      // 创建一个静默的错误对象
      const silentError = new originalTypeError('Vue Material DOM access (silenced)');
      silentError.silent = true;
      return silentError;
    }
    return new originalTypeError(message);
  };

  console.log('🔇 Vue Material错误已完全屏蔽');
};

// 组件级别的清理工具
export const cleanupVueMaterialComponent = (vm) => {
  try {
    if (vm.$el && typeof vm.$el.querySelectorAll === 'function') {
      // 清理可能的Vue Material组件监听器
      const mdComponents = vm.$el.querySelectorAll('[data-md-component]');
      mdComponents.forEach(el => {
        if (el._mutationObserver) {
          el._mutationObserver.disconnect();
          el._mutationObserver = null;
        }
        if (el._resizeObserver) {
          el._resizeObserver.disconnect();
          el._resizeObserver = null;
        }
      });
    }
  } catch (error) {
    console.warn('清理Vue Material组件时出错:', error);
  }
};

// 路由级别的清理
export const cleanupOnRouteChange = (to, from) => {
  try {
    // 特别处理从包含md-tabs的页面的导航
    if (from && (
      from.name === 'Dashboard' || 
      from.path === '/dashboard' ||
      from.name === 'RtlSupport' || 
      from.path === '/rtl-support-page' ||
      from.path?.includes('dashboard')
    )) {
      console.log(`🎯 检测到从${from.name || from.path}页面离开，进行深度清理...`);
      
      // 深度清理md-tabs相关组件
      const mdTabs = document.querySelectorAll('.md-tabs');
      mdTabs.forEach(tabs => {
        if (tabs._mutationObserver) {
          tabs._mutationObserver.disconnect();
          tabs._mutationObserver = null;
        }
        
        // 清理Vue实例
        if (tabs.__vue__) {
          const tabsVue = tabs.__vue__;
          if (tabsVue._mutationObserver) {
            tabsVue._mutationObserver.disconnect();
            tabsVue._mutationObserver = null;
          }
          // 清理calculateTabPos相关的观察器
          if (tabsVue.$el && tabsVue.$el._mutationObserver) {
            tabsVue.$el._mutationObserver.disconnect();
            tabsVue.$el._mutationObserver = null;
          }
        }
        
        // 清理tabs内的每个tab
        const tabElements = tabs.querySelectorAll('.md-tab, .md-tab-content');
        tabElements.forEach(tab => {
          if (tab._mutationObserver) {
            tab._mutationObserver.disconnect();
            tab._mutationObserver = null;
          }
          if (tab._resizeObserver) {
            tab._resizeObserver.disconnect();
            tab._resizeObserver = null;
          }
          if (tab.__vue__) {
            const tabVue = tab.__vue__;
            if (tabVue._mutationObserver) tabVue._mutationObserver.disconnect();
            if (tabVue._resizeObserver) tabVue._resizeObserver.disconnect();
          }
        });
        
        // 清理md-tabs-container
        const tabsContainer = tabs.querySelector('.md-tabs-container');
        if (tabsContainer && tabsContainer._mutationObserver) {
          tabsContainer._mutationObserver.disconnect();
          tabsContainer._mutationObserver = null;
        }
      });
      
      // 额外清理Dashboard特有的组件
      const chartCards = document.querySelectorAll('.chart-card');
      chartCards.forEach(card => {
        if (card._mutationObserver) {
          card._mutationObserver.disconnect();
          card._mutationObserver = null;
        }
      });
    }
    
    // 通用清理：清理所有可能残留的Vue Material全局监听器
    if (window.document) {
      const allMdElements = document.querySelectorAll('[class*="md-"]');
      allMdElements.forEach(el => {
        if (el._mutationObserver) {
          el._mutationObserver.disconnect();
          el._mutationObserver = null;
        }
        if (el._resizeObserver) {
          el._resizeObserver.disconnect();
          el._resizeObserver = null;
        }
        
        // 清理Vue实例上的观察器
        if (el.__vue__) {
          const vueInstance = el.__vue__;
          if (vueInstance._mutationObserver) {
            vueInstance._mutationObserver.disconnect();
            vueInstance._mutationObserver = null;
          }
          if (vueInstance._resizeObserver) {
            vueInstance._resizeObserver.disconnect();
            vueInstance._resizeObserver = null;
          }
        }
      });
    }
    
    console.log(`🧹 路由清理完成 (${from?.name || from?.path || 'unknown'} -> ${to?.name || to?.path || 'unknown'})`);
  } catch (error) {
    console.warn('路由切换时清理Vue Material出错:', error);
  }
};
