<template>
  <view class="page">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="nav-left" @click="goBack">
        <text class="iconfont icon-arrow-left"></text>
      </view>
      <view class="nav-center">
        <text class="nav-title">完善个人信息</text>
      </view>
      <view class="nav-right"></view>
    </view>

    <!-- 用户头像 -->
    <view class="avatar-section">
      <view class="avatar-container" @click="chooseAvatar">
        <image :src="form.avatar" class="avatar-image" mode="aspectFill"></image>
        <view class="avatar-upload">
          <text class="iconfont icon-camera"></text>
        </view>
      </view>
      <text class="avatar-tip">点击更换头像</text>
    </view>

    <!-- 表单区域 -->
    <view class="form-container">
      <!-- 昵称 -->
      <view class="form-item">
        <view class="form-label">
          <text class="label-text">昵称</text>
        </view>
        <view class="form-input-wrapper">
          <input 
            v-model="form.nickname" 
            placeholder="请输入昵称" 
            class="form-input"
            maxlength="20"
          >
        </view>
      </view>

      <!-- 性别 -->
      <view class="form-item">
        <view class="form-label">
          <text class="label-text">性别</text>
        </view>
        <view class="form-input-wrapper">
          <view class="gender-options">
            <view 
              class="gender-item" 
              :class="{ active: form.gender === 'male' }" 
              @click="form.gender = 'male'"
            >
              <text class="iconfont icon-male"></text>
              <text class="gender-text">男</text>
            </view>
            <view 
              class="gender-item" 
              :class="{ active: form.gender === 'female' }" 
              @click="form.gender = 'female'"
            >
              <text class="iconfont icon-female"></text>
              <text class="gender-text">女</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 生日 -->
      <view class="form-item">
        <view class="form-label">
          <text class="label-text">生日</text>
        </view>
        <view class="form-input-wrapper">
          <picker mode="date" :value="form.birthday" @change="onBirthdayChange">
            <view class="picker-input">
              <text class="picker-text">{{ form.birthday || '请选择生日' }}</text>
              <text class="iconfont icon-arrow-right picker-arrow"></text>
            </view>
          </picker>
        </view>
      </view>

      <!-- 收货地址标题 -->
      <view class="section-title">
        <text class="title-text">收货地址</text>
        <text class="title-tip">便于为您推荐附近商品</text>
      </view>

      <!-- 收货人姓名 -->
      <view class="form-item">
        <view class="form-label">
          <text class="label-text">收货人</text>
          <text class="required-mark">*</text>
        </view>
        <view class="form-input-wrapper">
          <input 
            v-model="form.address.receiverName" 
            placeholder="请输入收货人姓名" 
            class="form-input"
            maxlength="20"
          >
        </view>
      </view>

      <!-- 收货电话 -->
      <view class="form-item">
        <view class="form-label">
          <text class="label-text">收货电话</text>
          <text class="required-mark">*</text>
        </view>
        <view class="form-input-wrapper">
          <input 
            v-model="form.address.receiverPhone" 
            placeholder="请输入收货人电话" 
            class="form-input"
            type="tel"
            maxlength="11"
          >
        </view>
      </view>

      <!-- 省市区选择 -->
      <view class="form-item">
        <view class="form-label">
          <text class="label-text">所在地区</text>
          <text class="required-mark">*</text>
        </view>
        <view class="form-input-wrapper">
          <picker 
            mode="region" 
            :value="regionArray" 
            @change="onRegionChange"
            custom-item="请选择"
          >
            <view class="picker-input">
              <text class="picker-text">{{ regionText || '请选择省市区' }}</text>
              <text class="iconfont icon-arrow-right picker-arrow"></text>
            </view>
          </picker>
        </view>
      </view>

      <!-- 详细地址 -->
      <view class="form-item">
        <view class="form-label">
          <text class="label-text">详细地址</text>
          <text class="required-mark">*</text>
        </view>
        <view class="form-input-wrapper">
          <textarea 
            v-model="form.address.street" 
            placeholder="请输入详细地址（街道、门牌号等）" 
            class="form-textarea"
            maxlength="200"
            :auto-height="true"
          ></textarea>
        </view>
      </view>

      <!-- 邮政编码 -->
      <view class="form-item">
        <view class="form-label">
          <text class="label-text">邮政编码</text>
        </view>
        <view class="form-input-wrapper">
          <input 
            v-model="form.address.zipCode" 
            placeholder="请输入邮政编码" 
            class="form-input"
            type="number"
            maxlength="6"
          >
        </view>
      </view>
      
      <!-- 安全设置标题 -->
      <view class="section-title">
        <text class="title-text">安全设置</text>
        <text class="title-tip">设置生物识别，提升账户安全性</text>
      </view>
      
      <!-- 人脸识别设置 -->
      <view class="form-item">
        <view class="form-label">
          <text class="label-text">人脸识别</text>
        </view>
        <view class="form-input-wrapper">
          <view class="security-item">
            <view class="security-info">
              <text class="security-title">人脸登录</text>
              <text class="security-desc">{{ faceRegistered ? '已注册，可使用人脸登录' : '未注册，注册后可快速登录' }}</text>
            </view>
            <view class="security-action">
              <button 
                v-if="!faceRegistered"
                class="register-face-btn"
                @click="registerFace"
                :disabled="loading"
              >
                立即注册
              </button>
              <view v-else class="face-actions">
                <button 
                  class="update-face-btn"
                  @click="registerFace"
                  :disabled="loading"
                >
                  更新
                </button>
                <button 
                  class="delete-face-btn"
                  @click="deleteFace"
                  :disabled="loading"
                >
                  删除
                </button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="save-container">
      <button 
        class="save-btn" 
        :class="{ active: canSave }" 
        @click="saveProfile"
        :disabled="!canSave"
      >
        保存并完成
      </button>
      <view class="skip-btn" @click="skipProfile">
        <text class="skip-text">暂时跳过</text>
      </view>
    </view>

    <!-- 加载遮罩 -->
    <view class="loading-mask" v-if="loading">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">{{ loadingText }}</text>
      </view>
    </view>
    
    <!-- 人脸识别组件 -->
    <FaceRecognition 
      :visible="showFaceRecognition"
      type="register"
      @success="handleFaceRegisterSuccess"
      @close="closeFaceRecognition"
    />
  </view>
</template>

<script>
import api from '@/utils/api.js'
import FaceRecognition from '@/components/FaceRecognition/FaceRecognition.vue'

export default {
  components: {
    FaceRecognition
  },
  data() {
    return {
      loading: false,
      loadingText: '保存中...',
      
      // 区域选择数组
      regionArray: [],
      
      // 人脸识别相关
      showFaceRecognition: false,
      faceRegistered: false,
      
      // 表单数据
      form: {
        avatar: '/static/img/5.jpg',
        nickname: '',
        gender: '',
        birthday: '',
        address: {
          receiverName: '',
          receiverPhone: '',
          province: '',
          city: '',
          district: '',
          street: '',
          zipCode: ''
        }
      }
    };
  },
  
  computed: {
    /**
     * 是否可以保存
     */
    canSave() {
      const addr = this.form.address;
      return (
        addr.receiverName && 
        addr.receiverPhone && 
        addr.province && 
        addr.city && 
        addr.district && 
        addr.street
      );
    },
    
    /**
     * 地区显示文本
     */
    regionText() {
      const addr = this.form.address;
      if (addr.province && addr.city && addr.district) {
        return `${addr.province} ${addr.city} ${addr.district}`;
      }
      return '';
    }
  },
  
  onLoad(options) {
    // 获取用户基本信息（如果有）
    this.loadUserInfo();
    // 检查人脸注册状态
    this.checkFaceStatus();
  },
  
  methods: {
    /**
     * 加载用户信息
     */
    async loadUserInfo() {
      try {
        const token = uni.getStorageSync('token');
        if (token) {
          const response = await api.user.getUserInfo(token);
          if (response.success && response.data.user) {
            const user = response.data.user;
            this.form.nickname = user.username || '';
            this.form.avatar = user.avatar || '/static/img/5.jpg';
          }
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
      }
    },
    
    /**
     * 选择头像
     */
    chooseAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album'],
        success: (res) => {
          this.form.avatar = res.tempFilePaths[0];
          // 这里可以上传头像到服务器
          // this.uploadAvatar(res.tempFilePaths[0]);
        }
      });
    },
    
    /**
     * 生日选择
     */
    onBirthdayChange(e) {
      this.form.birthday = e.detail.value;
    },
    
    /**
     * 地区选择
     */
    onRegionChange(e) {
      this.regionArray = e.detail.value;
      this.form.address.province = e.detail.value[0];
      this.form.address.city = e.detail.value[1];
      this.form.address.district = e.detail.value[2];
    },
    
    /**
     * 保存用户资料
     */
    async saveProfile() {
      if (!this.canSave) return;
      
      try {
        // 验证手机号格式
        if (!this.validatePhone(this.form.address.receiverPhone)) {
          uni.showToast({
            title: '请输入正确的手机号',
            icon: 'none'
          });
          return;
        }
        
        this.loading = true;
        this.loadingText = '保存中...';
        
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('请先登录');
        }
        
        // 构建更新数据
        const updateData = {
          nickname: this.form.nickname,
          gender: this.form.gender,
          birthday: this.form.birthday,
          address: {
            receiverName: this.form.address.receiverName,
            receiverPhone: this.form.address.receiverPhone,
            province: this.form.address.province,
            city: this.form.address.city,
            district: this.form.address.district,
            street: this.form.address.street,
            zipCode: this.form.address.zipCode
          }
        };
        
        // 调用更新API
        const response = await api.user.updateUserInfo(updateData, token);
        
        if (response.success) {
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          });
          
          // 跳转到首页
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/home/home'
            });
          }, 1500);
        } else {
          throw new Error(response.error?.message || '保存失败');
        }
        
      } catch (error) {
        console.error('保存用户信息失败:', error);
        api.handleError(error, '保存失败');
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 跳过资料完善
     */
    skipProfile() {
      uni.showModal({
        title: '提示',
        content: '跳过后可以在个人中心随时完善资料，确定要跳过吗？',
        confirmText: '确定跳过',
        cancelText: '继续完善',
        success: (res) => {
          if (res.confirm) {
            uni.switchTab({
              url: '/pages/home/home'
            });
          }
        }
      });
    },
    
    /**
     * 返回上一页
     */
    goBack() {
      uni.navigateBack();
    },
    
    /**
     * 验证手机号格式
     */
    validatePhone(phone) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      return phoneRegex.test(phone);
    },
    
    /**
     * 检查人脸注册状态
     */
    async checkFaceStatus() {
      try {
        const token = uni.getStorageSync('token');
        if (token) {
          const response = await api.user.getFaceStatus(token);
          if (response.success) {
            this.faceRegistered = response.data.faceRegistered || false;
          }
        }
      } catch (error) {
        console.error('检查人脸状态失败:', error);
      }
    },
    
    /**
     * 注册人脸
     */
    registerFace() {
      this.showFaceRecognition = true;
    },
    
    /**
     * 人脸注册成功回调
     */
    handleFaceRegisterSuccess(result) {
      console.log('人脸注册成功:', result);
      this.faceRegistered = true;
      
      uni.showToast({
        title: '人脸注册成功',
        icon: 'success'
      });
      
      this.closeFaceRecognition();
    },
    
    /**
     * 关闭人脸识别组件
     */
    closeFaceRecognition() {
      this.showFaceRecognition = false;
    },
    
    /**
     * 删除人脸信息
     */
    async deleteFace() {
      try {
        const result = await uni.showModal({
          title: '确认删除',
          content: '删除后将无法使用人脸登录，确定要删除吗？',
          confirmText: '确定删除',
          cancelText: '取消'
        });
        
        if (!result.confirm) return;
        
        this.loading = true;
        this.loadingText = '删除中...';
        
        const token = uni.getStorageSync('token');
        const response = await api.user.deleteFaceData(token);
        
        if (response.success) {
          this.faceRegistered = false;
          
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          });
        } else {
          throw new Error(response.error?.message || '删除失败');
        }
        
      } catch (error) {
        console.error('删除人脸信息失败:', error);
        api.handleError(error, '删除失败');
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import 'UserProfile.scss';
</style>
