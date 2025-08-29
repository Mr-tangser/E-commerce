import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export default {
  data() {
    return {
      images: [],
      videoFrames: { frame: 0 },
      frameCount: 360,
      imagesToLoad: 360,
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

    currentFrame(index) {
      return `/img/Starry/Starry_${(index + 1).toString().padStart(4,"0")}.jpg`;
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
        alert('登录成功！');
        // 可以在这里进行路由跳转
        // this.$router.push('/dashboard');
        
      } catch (error) {
        this.errorMessage = '登录失败，请检查用户名和密码';
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
        
        // 注册成功后的逻辑
        alert('注册成功！请登录');
        this.activeTab = 'login';
        this.resetRegisterForm();
        
      } catch (error) {
        this.errorMessage = '注册失败，请稍后重试';
        console.error('注册错误:', error);
      } finally {
        this.registerLoading = false;
      }
    },

    // 验证登录表单
    validateLoginForm() {
      if (!this.loginForm.email || !this.loginForm.password) {
        this.errorMessage = '请填写所有字段';
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.loginForm.email)) {
        this.errorMessage = '请输入有效的邮箱地址';
        return false;
      }
      
      return true;
    },

    // 验证注册表单
    validateRegisterForm() {
      const { username, email, password, confirmPassword } = this.registerForm;
      
      if (!username || !email || !password || !confirmPassword) {
        this.errorMessage = '请填写所有字段';
        return false;
      }
      
      if (username.length < 3) {
        this.errorMessage = '用户名至少需要3个字符';
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        this.errorMessage = '请输入有效的邮箱地址';
        return false;
      }
      
      if (password.length < 6) {
        this.errorMessage = '密码至少需要6个字符';
        return false;
      }
      
      if (password !== confirmPassword) {
        this.errorMessage = '两次输入的密码不一致';
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
    }
  }
}