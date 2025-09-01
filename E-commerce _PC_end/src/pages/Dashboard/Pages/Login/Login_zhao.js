import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export default {
  data() {
    return {
      images: [],
      videoFrames: { frame: 0 },
      frameCount: 600,
      imagesToLoad: 600,
      context: null,
      lenis: null,
      // 表单控制
      showLoginForm: false,
      activeTab: 'login',
      loginLoading: false,
      registerLoading: false,
      errorMessage: '',
      // 登录表单数据
      loginForm: {
        email: '',
        password: ''
      },
      // 注册表单数据
      registerForm: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      }
    }
  },

  mounted() {
    this.initializeApp();
  },

  beforeUnmount() {
    if (this.lenis) {
      this.lenis.destroy();
    }
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
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
      const canvas = this.$refs.canvas;
      this.context = canvas.getContext("2d");
      this.setCanvasSize();
      
      window.addEventListener("resize", () => {
        this.setCanvasSize();
        this.render();
        ScrollTrigger.refresh();
      });
    },

    setCanvasSize() {
      const canvas = this.$refs.canvas;
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

    currentFrame(index) {
      const folder = this.getCurrentTimeFolder();
      const frameNumber = (index + 1).toString().padStart(4, "0");
      return `/img/${folder}/${folder}_${frameNumber}.png`;
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

      if(!this.imagesToLoad) {
        this.render();
        this.setupScrollTrigger();
      }
    },

    render() {
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

          if(progress <= 0.1 ) {
            const navProgress = progress / 0.1;
            const opacity = 1 - navProgress;
            gsap.set(nav,{opacity});
          } else {
            gsap.set(nav,{ opacity: 0 });
          }

          if(progress <= 0.25) {
            const zProgress = progress / 0.25;
            const translateZ = zProgress * -500;

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

          if(progress < 0.6) {
            gsap.set(this.$refs.heroImg, {
              transform: "translateZ(1000px)",
              opacity: 0,
            });
          } else if (progress >= 0.6 && progress <= 0.9) {
            const imgProgress = (progress - 0.6) /0.3;
            const translateZ = 1000 - imgProgress * 1000;

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
            }, 500);
          }
        }
      })
    },

    // 处理登录
    async handleLogin() {
      if (!this.validateLoginForm()) {
        return;
      }

      this.loginLoading = true;
      this.errorMessage = '';

      try {
        // 这里可以集成实际的API调用
        console.log('登录数据:', this.loginForm);
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 登录成功后的逻辑
        alert('欢迎进入E-Mall智能商城管理系统！');
        // 可以在这里进行路由跳转
        // this.$router.push('/dashboard');
        
      } catch (error) {
        this.errorMessage = '登录失败，请检查管理员邮箱和密码是否正确';
        console.error('登录错误:', error);
      } finally {
        this.loginLoading = false;
      }
    },

    // 处理注册
    async handleRegister() {
      if (!this.validateRegisterForm()) {
        return;
      }

      this.registerLoading = true;
      this.errorMessage = '';

      try {
        console.log('注册数据:', this.registerForm);
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 权限申请成功后的逻辑
        alert('权限申请提交成功！管理员将在24小时内审核您的申请，请耐心等待。');
        this.activeTab = 'login';
        this.resetRegisterForm();
        
      } catch (error) {
        this.errorMessage = '权限申请提交失败，请检查网络连接后重试';
        console.error('权限申请错误:', error);
      } finally {
        this.registerLoading = false;
      }
    },

    // 验证登录表单
    validateLoginForm() {
      if (!this.loginForm.email || !this.loginForm.password) {
        this.errorMessage = '请填写管理员邮箱和密码';
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.loginForm.email)) {
        this.errorMessage = '请输入有效的管理员邮箱地址';
        return false;
      }
      
      if (this.loginForm.password.length < 6) {
        this.errorMessage = '管理密码长度不能少于6位';
        return false;
      }
      
      return true;
    },

    // 验证权限申请表单
    validateRegisterForm() {
      const { username, email, password, confirmPassword } = this.registerForm;
      
      if (!username || !email || !password || !confirmPassword) {
        this.errorMessage = '请填写所有申请信息';
        return false;
      }
      
      if (username.length < 2) {
        this.errorMessage = '申请人姓名至少需要2个字符';
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        this.errorMessage = '请输入有效的企业邮箱地址';
        return false;
      }
      
      if (password.length < 8) {
        this.errorMessage = '管理密码至少需要8个字符，建议包含数字和字母';
        return false;
      }
      
      if (password !== confirmPassword) {
        this.errorMessage = '两次输入的密码不一致，请重新确认';
        return false;
      }
      
      // 简单的密码强度检查
      const hasNumber = /\d/.test(password);
      const hasLetter = /[a-zA-Z]/.test(password);
      if (!hasNumber || !hasLetter) {
        this.errorMessage = '密码强度不够，请包含数字和字母';
        return false;
      }
      
      return true;
    },

    // 重置注册表单
    resetRegisterForm() {
      this.registerForm = {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      };
    },

    // 切换标签页时清除错误信息
    switchTab(tab) {
      this.activeTab = tab;
      this.errorMessage = '';
    },

    // 滚动到登录表单
    scrollToLogin() {
      // 先显示登录表单
      this.showLoginForm = true;
      
      // 延迟一点时间确保DOM已更新，然后滚动到登录区域
      this.$nextTick(() => {
        const targetPosition = window.innerHeight * 7; // 对应ScrollTrigger的end位置
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      });
    }
  }
}