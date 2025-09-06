import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { encryptAES, getCurrentTimestamp } from '@/utils/crypto';

export default {
  data() {
    return {
      images: [],
      videoFrames: { frame: 0 },
      frameCount: 600,
      imagesToLoad: 600,
      context: null,
      lenis: null,
      currentTheme: 'morning', // 当前主题
      // 预加载组件控制
      preloaderShow: true,
      preloadProgress: 0,
      // 表单控制
      showLoginForm: false,
      loginLoading: false,
      errorMessage: '',
      showPassword: false, // 密码显示隐藏控制
      // 验证码相关
      captchaLoading: false,
      captchaSvg: '',
      captchaId: '',
      // 登录表单数据
      loginForm: {
        identifier: '', // 用户名或邮箱
        password: '',
        captchaCode: '' // 验证码
      },
      // 事件处理器引用，用于清理
      handleResize: null
    }
  },

  mounted() {
    this.applyTheme(); // 应用时间主题
    this.initializeApp();
    this.loadCaptcha(); // 加载验证码
  },

  beforeUnmount() {
    // 完全清理所有滚动相关的实例
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
    
    // 清理所有ScrollTrigger实例
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    ScrollTrigger.refresh();
    
    // 移除所有GSAP动画
    gsap.killTweensOf("*");
    
    // 清理window事件监听器
    window.removeEventListener("resize", this.handleResize);
    
    // 重置body类名，清理可能的滚动干扰
    document.body.classList.remove('no-scroll', 'login-page');
    
    // 确保恢复正常的滚动行为
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  },

  beforeDestroy() {
    // Vue 2兼容性
    this.beforeUnmount();
  },

  methods: {
    initializeApp() {
      gsap.registerPlugin(ScrollTrigger);
      
      this.lenis = new Lenis();
      this.lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => {
        this.lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);

      this.setupCanvas();
      this.loadImages();
    },

    setupCanvas() {
      try {
        const canvas = this.$refs.canvas;
        if (!canvas) return; // 如果canvas不存在，直接返回
        
        this.context = canvas.getContext("2d");
        this.setCanvasSize();
        
        // 定义resize处理器，以便后续清理
        this.handleResize = () => {
          try {
            this.setCanvasSize();
            this.render();
            ScrollTrigger.refresh();
          } catch (error) {
            console.warn('Canvas resize error suppressed:', error);
          }
        };
        
        window.addEventListener("resize", this.handleResize);
      } catch (error) {
        console.warn('Canvas setup error suppressed:', error);
      }
    },

    setCanvasSize() {
      const canvas = this.$refs.canvas;
      if (!canvas || !this.context) return; // 防止canvas未就绪时调用
      
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * pixelRatio;
      canvas.height = window.innerHeight * pixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      this.context.scale(pixelRatio, pixelRatio);
    },

    // 获取当前时间对应的文件夹
    getCurrentTimeFolder() {
      const now = new Date();
      const hour = now.getHours();
      
      if (hour >= 0 && hour < 6) {
        return 'Loading_early_morning'; // 凌晨 00:00-05:59
      } else if (hour >= 6 && hour < 12) {
        return 'Loading_Morning';       // 上午 06:00-11:59
      } else if (hour >= 12 && hour < 18) {
        return 'Loading_afternoon';     // 下午 12:00-17:59
      } else {
        return 'Load_Night';           // 夜间 18:00-23:59
      }
    },

    // 获取当前时间对应的主题
    getCurrentTheme() {
      const now = new Date();
      const hour = now.getHours();
      
      if (hour >= 0 && hour < 6) {
        return 'early-morning'; // 凌晨
      } else if (hour >= 6 && hour < 12) {
        return 'morning';       // 上午
      } else if (hour >= 12 && hour < 18) {
        return 'afternoon';     // 下午
      } else {
        return 'night';         // 夜间
      }
    },

    // 应用主题
    applyTheme() {
      const theme = this.getCurrentTheme();
      this.currentTheme = theme;
      document.body.className = `theme-${theme}`;
    },

    currentFrame(index) {
      const folder = this.getCurrentTimeFolder();
      const frameNumber = (index + 1).toString().padStart(4, "0");
      
      // 根据不同文件夹配置正确的路径和文件名
      let fullPath;
      
      if (folder === 'Load_Night') {
        // 夜间：嵌套文件夹 Load_Night/Load_Night/
        fullPath = `/img/Load_Night/Load_Night/Loading_Night_${frameNumber}.png`;
      } else if (folder === 'Loading_afternoon') {
        // 下午：嵌套文件夹 Loading_afternoon/Loading_afternoon/
        fullPath = `/img/Loading_afternoon/Loading_afternoon/Loading_afternoon_${frameNumber}.png`;
      } else if (folder === 'Loading_early_morning') {
        // 凌晨：嵌套文件夹 Loading_early_morning/Loading_early_morning/
        fullPath = `/img/Loading_early_morning/Loading_early_morning/Loading_early_morning_${frameNumber}.png`;
      } else if (folder === 'Loading_Morning') {
        // 上午：直接文件夹 Loading_Morning/
        fullPath = `/img/Loading_Morning/Loading_Morning_${frameNumber}.png`;
      }
      
      return fullPath;
    },

    loadImages() {
      for(let i = 0; i < this.frameCount; i++) {
        const img = new Image();
        img.onload = this.onLoad;
        img.onerror = this.onLoad;
        img.src = this.currentFrame(i);
        this.images.push(img);
      }
    },

    onLoad() {
      this.imagesToLoad--;

      // 更新预加载进度（四舍五入为整数）
      const loaded = this.frameCount - this.imagesToLoad;
      this.preloadProgress = Math.max(0, Math.min(100, Math.round((loaded / this.frameCount) * 100)));

      if(!this.imagesToLoad) {
        this.preloadProgress = 100;
        this.render();
        this.setupScrollTrigger();
        // 让预加载组件完成100%后上浮离场
        // 组件收到100%会自动触发退出动画
      }
    },

    render() {
      try {
        if (!this.context) return; // 如果context不存在，直接返回
        
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;

        this.context.clearRect(0,0,canvasWidth, canvasHeight);

        const img = this.images[this.videoFrames.frame];
        if(img && img.complete && img.naturalWidth > 0) {
          const imageAspect = img.naturalWidth / img.naturalHeight;
          const canvasAspect = canvasWidth / canvasHeight;

          let drawWidth, drawHeight, drawX, drawY;

          if(imageAspect > canvasAspect) {
            drawHeight = canvasHeight;
            drawWidth = drawHeight * imageAspect;
            drawX = (canvasWidth - drawWidth) / 2;
            drawY = 0;
          } else {
            drawWidth = canvasWidth;
            drawHeight = drawWidth / imageAspect;
            drawX = 0;
            drawY = (canvasHeight - drawHeight) / 2;
          }

          this.context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        }
      } catch (error) {
        console.warn('Canvas render error suppressed:', error);
      }
    },

    setupScrollTrigger() {
      const nav = document.querySelector("nav");
      
      ScrollTrigger.create({
        trigger: ".hero",
        start: "top top",
        end: `+=${window.innerHeight * 7}px`,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const animationProgress = Math.min(progress / 0.9,1);
          const targetFrame = Math.round(animationProgress * (this.frameCount - 1));
          this.videoFrames.frame = targetFrame;
          this.render();

          if(progress <= 0.25) {
            const zProgress = progress / 0.25;
            const translateZ = zProgress * 500; // 向前移动消失

            let opacity = 1;
            if(progress >= 0.2) {
              const fadeProgress = Math.min((progress - 0.2) / (0.25 - 0.2),1);
              opacity = 1 - fadeProgress; // 在后期淡出
            }

            gsap.set(nav, {
              transform: `translateZ(${translateZ}px)`,
              opacity,
            });
          } else {
            gsap.set(nav, { 
              opacity: 0,
              transform: `translateZ(500px)`
            });
          }

          if(progress <= 0.25) {
            const zProgress = progress / 0.25;
            const translateZ = zProgress * 500; // 改为向前移动

            let opacity = 1;
            if(progress >= 0.2) {
              const fadeProgress = Math.min((progress - 0.2) / (0.25 - 0.2),1);
              opacity = 1 - fadeProgress;
            }

            gsap.set(this.$refs.header, {
              transform: `translate(-50%,-50%) translateZ(${translateZ}px)`,
              opacity,
            });
          } else {
            gsap.set(this.$refs.header, {opacity: 0});
          }

          if(progress < 0.83) {
            gsap.set(this.$refs.heroImg, {
              transform: "translateZ(-1000px)", // 改为从前往后
              opacity: 0,
            });
          } else if (progress >= 0.6 && progress <= 0.9) {
            const imgProgress = (progress - 0.6) /0.3;
            const translateZ = -1000 + imgProgress * 1000; // 改为从前往后的运动

            let opacity = 0;
            if(progress <= 0.8) {
              const opacityProgress = (progress - 0.6) / 0.2;
              opacity = opacityProgress;
            } else {
              opacity = 1;
            }

            gsap.set(this.$refs.heroImg, {
              transform: `translateZ(${translateZ}px)`,
              opacity,
            });
          } else {
            gsap.set(this.$refs.heroImg, {
              transform: "translateZ(0px)",
              opacity: 1,
            })
            // 动画完成后显示登录表单，添加延迟让动画完全结束
            setTimeout(() => {
              this.showLoginForm = true;
              // 给Vue足够时间更新DOM，然后触发动画
              this.$nextTick(() => {
                setTimeout(() => {
                  const loginContainer = document.querySelector('.login-container');
                  if (loginContainer) {
                    loginContainer.classList.add('show');
                  }
                }, 100);
              });
            }, 500);
          }
        }
      })
    },

    // 预加载完成回调
    handlePreloaderFinished() {
      // 隐藏预加载组件的占位
      this.preloaderShow = false;
    },

    // 处理登录
    async handleLogin() {
      if (!this.validateLoginForm()) {
        return;
      }

      this.loginLoading = true;
      this.errorMessage = '';

      try {
        // 重新启用加密功能
        const timestamp = getCurrentTimestamp();
        
        // 加密密码
        let encryptedPassword;
        try {
          encryptedPassword = encryptAES(this.loginForm.password, timestamp);
        } catch (error) {
          console.error('前端加密失败:', error);
          this.errorMessage = '密码加密失败，请重试';
          return;
        }
        
        // 调用后端admin登录接口
        const loginData = {
          identifier: this.loginForm.identifier,
          password: encryptedPassword,
          captchaId: this.captchaId,
          captchaCode: this.loginForm.captchaCode,
          timestamp: timestamp
        };
        
        const response = await this.$http.post('http://localhost:3000/api/admin/login', loginData);
        
        if (response.data.success) {
          // 保存token到localStorage
          const token = response.data.data.access_token;
          localStorage.setItem('vue-authenticate.vueauth_access_token', token);
          
          // 保存用户信息
          const adminInfo = response.data.data.admin;
          localStorage.setItem('admin_info', JSON.stringify(adminInfo));
          
          // 更新Vuex状态
          this.$store.commit('auth/SET_AUTHENTICATED', true);
          this.$store.commit('auth/SET_USER', adminInfo);
          
          // 登录成功提示
          this.$notify({
            message: `欢迎回来，${adminInfo.fullName || adminInfo.username}！`,
            horizontalAlign: 'right',
            verticalAlign: 'top',
            type: 'success'
          });
          
          // 延迟跳转到仪表板
          setTimeout(() => {
            this.$router.push('/dashboard');
          }, 1500);
        }
        
      } catch (error) {
        console.error('登录错误:', error);
        if (error.response?.data?.error?.message) {
          this.errorMessage = error.response.data.error.message;
        } else {
          this.errorMessage = '登录失败，请检查网络连接后重试';
        }
        
        // 登录失败时刷新验证码
        this.refreshCaptcha();
      } finally {
        this.loginLoading = false;
      }
    },

    // 加载验证码
    async loadCaptcha() {
      this.captchaLoading = true;
      try {
        const response = await this.$http.get('http://localhost:3000/api/captcha/generate');
        
        if (response.data.success) {
          this.captchaId = response.data.data.captchaId;
          this.captchaSvg = response.data.data.captchaSvg;
          console.log('验证码加载成功:', this.captchaId);
        } else {
          this.errorMessage = '验证码加载失败，请刷新页面重试';
        }
      } catch (error) {
        console.error('加载验证码失败:', error);
        this.errorMessage = '验证码服务暂时不可用';
      } finally {
        this.captchaLoading = false;
      }
    },

    // 刷新验证码
    async refreshCaptcha() {
      // 清空当前验证码输入
      this.loginForm.captchaCode = '';
      await this.loadCaptcha();
    },

    // 切换密码显示隐藏
    togglePassword() {
      this.showPassword = !this.showPassword;
    },


    // 验证登录表单
    validateLoginForm() {
      if (!this.loginForm.identifier || !this.loginForm.password) {
        this.errorMessage = '请填写用户名/邮箱和密码';
        return false;
      }
      
      if (!this.loginForm.captchaCode) {
        this.errorMessage = '请输入验证码';
        return false;
      }
      
      if (this.loginForm.captchaCode.length !== 4) {
        this.errorMessage = '验证码必须为4位';
        return false;
      }
      
      if (!this.captchaId) {
        this.errorMessage = '验证码已失效，请刷新验证码';
        this.refreshCaptcha();
        return false;
      }
      
      // 检查是否为邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(this.loginForm.identifier);
      
      // 如果不是邮箱格式，验证用户名格式
      if (!isEmail) {
        const usernameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/;
        if (!usernameRegex.test(this.loginForm.identifier)) {
          this.errorMessage = '用户名格式不正确（2-20位，支持中文、字母、数字、下划线）';
          return false;
        }
      }
      
      if (this.loginForm.password.length < 6) {
        this.errorMessage = '密码长度不能少于6位';
        return false;
      }
      
      return true;
    },



    // 判断是否为邮箱登录
    isEmailLogin(identifier) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(identifier);
    },


    // 显示登录表单并滚动到正确位置
    scrollToLogin() {
      // 先显示登录表单
      this.showLoginForm = true;
      
      // 滚动到登录表单完全固定的位置
      this.$nextTick(() => {
        // 根据ScrollTrigger设置，登录表单在90%进度时完全固定
        // 总长度是window.innerHeight * 7，90%就是最佳位置
        const totalScrollHeight = window.innerHeight * 7;
        const targetPosition = totalScrollHeight * 0.9;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // 确保登录容器在动画完成后可见
        setTimeout(() => {
          const loginContainer = document.querySelector('.login-container');
          if (loginContainer) {
            loginContainer.classList.add('show');
          }
        }, 800); // 增加延迟确保滚动和动画完成
      });
    },

    // 隐藏登录表单
    hideLoginForm() {
      const loginContainer = document.querySelector('.login-container');
      
      // 先添加hide类，触发退出动画
      if (loginContainer) {
        loginContainer.classList.remove('show');
        loginContainer.classList.add('hide');
      }
      
      // 等待动画完成后隐藏元素
      setTimeout(() => {
        this.showLoginForm = false;
      }, 600); // 与CSS transition时间一致
    }
  }
}