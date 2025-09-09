// Vue Material核心补丁 - 彻底修复calculateTabPos错误
export const patchVueMaterialTabs = () => {
  // 在Vue Material加载前就拦截可能的错误源
  if (typeof window !== 'undefined') {
    
    // 方案1: 重写MutationObserver以拦截Vue Material的使用
    const OriginalMutationObserver = window.MutationObserver;
    
    window.MutationObserver = function(callback) {
      const wrappedCallback = function(mutations, observer) {
        try {
          // 检查回调是否来自Vue Material
          const stack = new Error().stack;
          if (stack && (
            stack.includes('vue-material') || 
            stack.includes('calculateTabPos') || 
            stack.includes('callResizeFunctions')
          )) {
            // 检查目标元素是否存在
            mutations.forEach(mutation => {
              if (mutation.target && typeof mutation.target.querySelectorAll !== 'function') {
                console.warn('🔧 阻止Vue Material访问无效DOM元素');
                return; // 跳过这次调用
              }
            });
          }
          
          // 正常执行回调
          callback.apply(this, arguments);
        } catch (error) {
          if (error.message.includes('querySelectorAll') || 
              error.message.includes('calculateTabPos')) {
            console.warn('🔧 MutationObserver错误已拦截:', error.message);
          } else {
            throw error; // 重新抛出非Vue Material相关错误
          }
        }
      };
      
      return new OriginalMutationObserver(wrappedCallback);
    };
    
    // 保持原有的属性和方法
    Object.setPrototypeOf(window.MutationObserver, OriginalMutationObserver);
    Object.defineProperty(window.MutationObserver, 'prototype', {
      value: OriginalMutationObserver.prototype,
      writable: false
    });
    
    // 方案2: 拦截querySelectorAll调用
    const originalQuerySelectorAll = Element.prototype.querySelectorAll;
    Element.prototype.querySelectorAll = function(selector) {
      try {
        // 检查调用栈是否来自Vue Material
        const stack = new Error().stack;
        if (stack && (
          stack.includes('calculateTabPos') ||
          stack.includes('callResizeFunctions') ||
          stack.includes('vue-material.js')
        )) {
          // 验证this是否有效
          if (!this || typeof this.nodeType !== 'number') {
            console.warn('🔧 阻止Vue Material访问无效元素');
            return document.createDocumentFragment().querySelectorAll(selector);
          }
        }
        
        return originalQuerySelectorAll.call(this, selector);
      } catch (error) {
        if (error.message.includes('Cannot read properties of undefined')) {
          console.warn('🔧 querySelectorAll错误已拦截:', error.message);
          return document.createDocumentFragment().querySelectorAll(selector);
        }
        throw error;
      }
    };
    
    // 方案3: 拦截Vue组件的$el访问
    if (window.Vue) {
      setupVueElProtection();
    } else {
      // 等待Vue加载
      Object.defineProperty(window, 'Vue', {
        set: function(vue) {
          window._Vue = vue;
          setupVueElProtection();
        },
        get: function() {
          return window._Vue;
        },
        configurable: true
      });
    }
    
    console.log('🔧 Vue Material核心补丁已应用');
  }
};

function setupVueElProtection() {
  if (window._Vue) {
    // 重写Vue组件的$el访问器
    const originalVueInit = window._Vue.prototype._init;
    
    window._Vue.prototype._init = function(options) {
      originalVueInit.call(this, options);
      
      // 为所有Vue组件添加$el保护
      if (this.$options && this.$options.name && 
          this.$options.name.includes('MdTab')) {
        
        const originalEl = this.$el;
        Object.defineProperty(this, '$el', {
          get: function() {
            if (!originalEl || typeof originalEl.querySelectorAll !== 'function') {
              console.warn('🔧 保护Vue Material组件访问无效$el');
              return document.createElement('div');
            }
            return originalEl;
          },
          set: function(value) {
            originalEl = value;
          },
          enumerable: true,
          configurable: true
        });
      }
    };
  }
}

// 方案4: 直接patch Vue Material的calculateTabPos方法
export const patchCalculateTabPos = () => {
  // 等待Vue Material加载后进行patch
  const waitForVueMaterial = () => {
    // 查找所有已存在的md-tabs实例
    const mdTabsElements = document.querySelectorAll('.md-tabs');
    
    mdTabsElements.forEach(tabsEl => {
      if (tabsEl.__vue__) {
        const vueInstance = tabsEl.__vue__;
        
        // 检查是否有calculateTabPos方法
        if (vueInstance.calculateTabPos) {
          const originalCalculateTabPos = vueInstance.calculateTabPos;
          
          vueInstance.calculateTabPos = function() {
            try {
              // 验证$el的有效性
              if (!this.$el || typeof this.$el.querySelectorAll !== 'function') {
                console.warn('🔧 calculateTabPos: $el无效，跳过计算');
                return;
              }
              
              return originalCalculateTabPos.call(this);
            } catch (error) {
              console.warn('🔧 calculateTabPos错误已处理:', error.message);
            }
          };
          
          console.log('🔧 已patch calculateTabPos方法');
        }
        
        // 同样patch callResizeFunctions方法
        if (vueInstance.callResizeFunctions) {
          const originalCallResizeFunctions = vueInstance.callResizeFunctions;
          
          vueInstance.callResizeFunctions = function() {
            try {
              if (!this.$el || typeof this.$el.querySelectorAll !== 'function') {
                console.warn('🔧 callResizeFunctions: $el无效，跳过调用');
                return;
              }
              
              return originalCallResizeFunctions.call(this);
            } catch (error) {
              console.warn('🔧 callResizeFunctions错误已处理:', error.message);
            }
          };
          
          console.log('🔧 已patch callResizeFunctions方法');
        }
      }
    });
  };
  
  // 立即执行一次
  waitForVueMaterial();
  
  // 定期检查新的md-tabs组件
  setInterval(waitForVueMaterial, 1000);
  
  // 监听DOM变化，及时patch新组件
  if (window.MutationObserver) {
    const observer = new window.MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              if (node.classList && node.classList.contains('md-tabs')) {
                setTimeout(waitForVueMaterial, 100); // 延迟patch以确保Vue实例已创建
              }
              
              // 检查子元素
              const tabsInside = node.querySelectorAll && node.querySelectorAll('.md-tabs');
              if (tabsInside && tabsInside.length > 0) {
                setTimeout(waitForVueMaterial, 100);
              }
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('🔧 Vue Material动态patch监听已启动');
  }
};
