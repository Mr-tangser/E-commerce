<template>
  <view @click="isMore = false">
    <!-- 加载状态 -->
    <view class="loading-overlay" v-if="loading">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text>加载商品详情中...</text>
      </view>
    </view>
    
    <!-- 商品详情内容 - 只有在不加载时才显示 -->
    <view v-if="!loading">
    <view class="goods-head" :style="'background:rgba(255,255,255,' + PageScrollTop / 100 + ')'">
      <!-- 返回 -->
      <view class="back" @click="onBack">
        <view class="back-one" :class="{ action: PageScrollTop > 120 }">
          <text></text>
        </view>
      </view>
      <!-- tab切换 -->
      <view class="head-tab" v-if="PageScrollTop > 120">
        <view class="tab" :class="{'action':TabShow===0}" @click="onTab(0)">
          <text>商品</text>
          <text class="line"></text>
        </view>
        <view class="tab" :class="{'action':TabShow===1}" @click="onTab(1)">
          <text>评价</text>
          <text class="line"></text>
        </view>
        <view class="tab" :class="{'action':TabShow===2}" @click="onTab(2)">
          <text>详情</text>
          <text class="line"></text>
        </view>
      </view>
      <!-- 分享更多 -->
      <view class="share-more">
        <view class="share-more-one" :class="{ action: PageScrollTop > 120 }">
          <view class="list" @click="onShare">
            <text class="iconfont icon-share"></text>
          </view>
          <view class="list" @click.stop="isMore = !isMore">
            <text class="iconfont icon-diandian"></text>
          </view>
        </view>
        <view class="mroe-list" v-show="isMore">
          <navigator class="list">
            <view class="icon">
              <text class="iconfont icon-xiaoxi"></text>
            </view>
            <view class="title">
              <text>消息</text>
            </view>
          </navigator>
          <navigator open-type="switchTab" url="/pages/home/home" class="list">
            <view class="icon">
              <text class="iconfont icon-home"></text>
            </view>
            <view class="title">
              <text>首页</text>
            </view>
          </navigator>
          <navigator class="list">
            <view class="icon">
              <text class="iconfont icon-guanzhu"></text>
            </view>
            <view class="title">
              <text>我的关注</text>
            </view>
          </navigator>
          <navigator class="list">
            <view class="icon">
              <text class="iconfont icon-zuji"></text>
            </view>
            <view class="title">
              <text>浏览记录</text>
            </view>
          </navigator>
        </view>
      </view>
    </view>
    <!-- banner，标题 -->
    <view class="banner-title">
      <!-- banner -->
      <view class="banner">
        <swiper class="screen-swiper round-dot" indicator-dots="true" circular="true" autoplay="true" interval="5000"
                duration="500">
          <swiper-item v-for="(item, index) in swiperList" :key="index">
            <image :src="item.url" mode="aspectFill"></image>
            <!-- <video src="{{item.url}}" autoplay loop muted show-play-btn="{{false}}" controls="{{false
            }}" objectFit="cover" wx:if="{{item.type == 'video'}}"></video> -->
          </swiper-item>
        </swiper>
      </view>
      <!-- 价格 -->
      <view class="price-info" v-show="type==0">
        <view class="price" v-if="goodsDetail">
          <text class="min">￥</text>
          <text class="max">{{ goodsDetail.price ? Math.floor(goodsDetail.price) : '99' }}</text>
          <text class="min">.{{ goodsDetail.price ? String((goodsDetail.price % 1).toFixed(2)).split('.')[1] : '00' }}</text>
        </view>
        <view class="price" v-else>
          <text class="min">￥</text>
          <text class="max">99</text>
          <text class="min">.00</text>
        </view>
        <view class="info">
          <view class="list" @click="onDepreciate">
            <text class="iconfont icon-jiangjia"></text>
            <text>降价通知</text>
          </view>
          <view class="list" @click="onAttention">
            <text class="iconfont" :class="AttentionShow===0?'icon-guanzhu-off':'icon-guanzhu-on action'"></text>
            <text>{{ AttentionShow === 0 ? '关注' : '已关注' }}</text>
          </view>
        </view>
      </view>
			<!-- 限时抢购 -->
			<view class="flash-price" v-show="type==1">
				<view class="price-item">
					<view class="icon-item">
						<text class="iconfont icon-flash-sale"></text>
					</view>
					<view class="price">
						<view class="current-price" v-if="goodsDetail">
							<text class="min">￥</text>
							<text class="max">{{ goodsDetail.memberPrice ? Math.floor(goodsDetail.memberPrice) : (goodsDetail.price ? Math.floor(goodsDetail.price) : '99') }}</text>
							<text class="min">.{{ goodsDetail.memberPrice ? String((goodsDetail.memberPrice % 1).toFixed(2)).split('.')[1] : (goodsDetail.price ? String((goodsDetail.price % 1).toFixed(2)).split('.')[1] : '00') }}</text>
						</view>
						<view class="current-price" v-else>
							<text class="min">￥</text>
							<text class="max">99</text>
							<text class="min">.00</text>
						</view>
						<view class="original-price" v-if="goodsDetail && goodsDetail.originalPrice">
							<text>￥{{ goodsDetail.originalPrice.toFixed(2) }}</text>
						</view>
						<view class="original-price" v-else>
							<text>￥149.00</text>
						</view>
					</view>
					<view class="tag">
						<text class="iconfont icon-flash-naozhong"></text>
					</view>
				</view>
				<view class="time-item">
					<view class="title">
						<text>距结束还剩：</text>
					</view>
					<view class="time">
						<text class="num">02</text>
						<text class="dot">:</text>
						<text class="num">46</text>
						<text class="dot">:</text>
						<text class="num">52</text>
					</view>
				</view>
			</view>
      <!-- 标题 -->
      <view class="goods-title">
        <text v-if="goodsDetail">{{ goodsDetail.name }}</text>
        <text v-else>商品加载中...</text>
      </view>
      <!-- 开通会员 -->
      <view class="dredge-vip">
        <view class="title">
          <text class="iconfont icon-vip"></text>
          <text>
            开通年卡会员预计估算优惠
            <text class="col">15.37</text>
            元
          </text>
        </view>
        <view class="dredge">
          <text>立即</text>
          <text>开通</text>
        </view>
      </view>
    </view>
    <!-- 优惠积分 -->
    <view class="goods-discounts">
      <view class="list">
        <view class="title">积分</view>
        <view class="content">
          <text v-if="goodsDetail && goodsDetail.points">购买本商品可获得{{ goodsDetail.points }}积分</text>
          <text v-else>购买本商品可获得100积分</text>
        </view>
        <view class="more">
          <text class="iconfont icon-more"></text>
        </view>
      </view>
      <view class="list" @click="$refs['GoodsServe'].show()">
        <view class="title">服务</view>
        <view class="content">
          <view class="serve">
            <text class="iconfont icon-baozheng"></text>
            <text>退款保证</text>
          </view>
          <view class="serve">
            <text class="iconfont icon-baozheng"></text>
            <text>物流配送</text>
          </view>
        </view>
        <view class="more">
          <text class="iconfont icon-more"></text>
        </view>
      </view>
      <view class="list" @click="$refs['GoodsCoupon'].show()">
        <view class="title">领券</view>
        <view class="content">
          <view class="coupon-list">
            <view>满19减5</view>
          </view>
          <view class="coupon-list">
            <view>满19减5</view>
          </view>
        </view>
        <view class="more">
          <text class="iconfont icon-more"></text>
        </view>
      </view>
    </view>
    <!-- 属性规格 -->
    <view class="goods-discounts">
      <view class="list" @click="$refs['GoodsAttr'].show(1)">
        <view class="title">已选</view>
        <view class="content">
          <text>{{ selectedVariantsText }}</text>
        </view>
        <view class="more">
          <text class="iconfont icon-more"></text>
        </view>
      </view>
      <view class="list" @click="onSelectAddress">
        <view class="title">送至</view>
        <view class="content">
          <view class="serve">
            <text class="iconfont icon-dingwei"></text>
            <text>{{ selectedAddress.address || '请选择收货地址' }}</text>
          </view>
        </view>
        <view class="more">
          <text class="iconfont icon-more"></text>
        </view>
      </view>
      <view class="list">
        <view class="title">运费</view>
        <view class="content">
          <text>免运费</text>
        </view>
        <view class="more"><!-- <text class="iconfont icon-more"></text> --></view>
      </view>
    </view>
    <!-- 评价 -->
    <view class="evaluate-data" ref="evaluate">
      <view class="title-more" @click="onEvaluate">
        <view class="title">
          <text>评价</text>
          <text class="num">999+</text>
        </view>
        <view class="more">
          <text class="iconfont icon-more"></text>
        </view>
      </view>
      <view class="evaluate-list">
        <view class="user-info">
          <view class="thumb">
            <image src="/static/img/user_pic.jpg" mode=""></image>
          </view>
          <view class="nickname-grade">
            <view class="nickname">
              <text>爱笑的汤姆</text>
            </view>
            <view class="grade">
              <text class="cuIcon-favorfill lg text-gray"></text>
            </view>
          </view>
        </view>
        <view class="content">
          <view class="character">
            <text class="two-omit">搭建啊激动了阿建档立卡点击就阿卡丽登记卡加端口几啊开了都金坷垃就恐龙当家哦架空</text>
          </view>
          <view class="attr">
            <text>蓝色</text>
          </view>
          <view class="thumb-list">
            <view class="list">
              <image src="/static/img/goods_banner_01.webp" mode=""></image>
            </view>
            <view class="list">
              <image src="/static/img/goods_banner_02.webp" mode=""></image>
            </view>
            <view class="list">
              <image src="/static/img/goods_banner_03.webp" mode=""></image>
            </view>
          </view>
        </view>
        <view class="look-all" @click="onEvaluate">
          <text>查看全部评价</text>
        </view>
      </view>
    </view>

    <!-- 商品介绍 -->
    <view class="products-introduction" ref="products">
      <view class="title">
        <text>商品介绍</text>
      </view>
      <!-- 商品描述 -->
      <view class="content" v-if="goodsDetail && goodsDetail.description">
        <view class="description-text">
          <text>{{ goodsDetail.description }}</text>
        </view>
      </view>
      <!-- 商品详情HTML内容 -->
      <view class="content" v-if="goodsDetail && goodsDetail.detailContent">
        <rich-text :nodes="goodsDetail.detailContent"></rich-text>
      </view>
      <!-- 默认内容 -->
      <view class="content" v-if="!goodsDetail || (!goodsDetail.description && !goodsDetail.detailContent)">
        <view class="description-text">
          <text>商品详情加载中...</text>
        </view>
      </view>
    </view>
    <!-- 底部 -->
    <view class="page-footer">
      <view class="footer-fn">
        <view class="list">
          <text class="iconfont icon-kefu"></text>
          <text>联系客服</text>
        </view>
        <view class="list" @click="onToCart">
          <text class="iconfont icon-cart"></text>
          <text>购物车</text>
        </view>
      </view>
      <view class="footer-buy">
        <view class="cart-add" @click="$refs['GoodsAttr'].show(2)">
          <text>加入购物车</text>
        </view>
        <view class="buy-at" @click="$refs['GoodsAttr'].show(3)">
          <text>立即购买</text>
        </view>
      </view>
    </view>
    <!-- 服务弹窗 -->
    <goods-serve ref="GoodsServe"></goods-serve>
    <!-- 优惠券 -->
    <goods-coupon ref="GoodsCoupon"></goods-coupon>
    <!-- 属性规格 -->
    <goods-attr 
      ref="GoodsAttr" 
      :goods-data="goodsDetail"
      :current-selected-variants="selectedVariants"
      :current-quantity="selectedQuantity"
      @variant-change="onVariantChange"
      @quantity-change="onQuantityChange"
      @confirm="onAttrConfirm"
      @selection-update="onSelectionUpdate"
    ></goods-attr>
    </view>
  </view>
</template>

<script>
import GoodsServe from '../../components/GoodsServe/GoodsServe.vue';
import GoodsCoupon from '../../components/GoodsCoupon/GoodsCoupon.vue';
import GoodsAttr from '../../components/GoodsAttr/GoodsAttr.vue';
import api from '@/utils/api.js';
import BrowsingHistory from '@/utils/browsing-history.js';
// 导入环境配置
import ENV_CONFIG from '../../config/env.js';

export default {
  components: {
    GoodsServe,
    GoodsCoupon,
    GoodsAttr,
  },
  data() {
    return {
      TabShow: 0,
      isMore: false,
      AttentionShow: 0,
      // 商品详情数据
      goodsDetail: null,
      productId: null,
      loading: true,

      // 轮播图数据（将从商品详情中获取）
      swiperList: [
        {
          id: 0,
          type: 'image',
          url: '/static/img/goods_banner_01.webp'
        },
        {
          id: 1,
          type: 'image',
          url: '/static/img/goods_banner_02.webp'
        },
        {
          id: 2,
          type: 'image',
          url: '/static/img/goods_banner_03.webp'
        },
        {
          id: 3,
          type: 'image',
          url: '/static/img/goods_banner_04.webp'
        },
        {
          id: 4,
          type: 'image',
          url: '/static/img/goods_banner_05.webp'
        },
      ],
      web_content:
          '<div class="m-img"><img src="https://zhedplus.oss-cn-hangzhou.aliyuncs.com/content_img/20191118/1fb5ff162f25fd4c7383bd998ff2fde9.jpg"><div class="tools" hidden><i class="fa fa-arrow-up move-up"></i><i class="fa fa-arrow-down move-down"></i><em class="move-remove" hidden ><i class="fa fa-times" aria-hidden="true"></i> 移除</em><div class="cover"></div></div></div>',
      PageScrollTop: 0,
			type: 0,
			
			// 商品选择状态
			selectedVariants: {},
			selectedQuantity: 1,
			
			// 选择的收货地址
			selectedAddress: {
				address: '', // 默认为空，显示"请选择收货地址"
				name: '',
				longitude: 0,
				latitude: 0,
				province: '',
				city: '',
				district: '',
				detail: ''
			},
    };
  },
  computed: {
    // 格式化已选择的属性文本
    selectedVariantsText() {
      if (!this.selectedVariants || Object.keys(this.selectedVariants).length === 0) {
        return '请选择规格';
      }
      
      const variantTexts = [];
      for (let variantId in this.selectedVariants) {
        const variant = this.selectedVariants[variantId];
        // 兼容两种数据结构：size字段（来自GoodsAttr组件）和value字段（来自后端数据）
        if (variant && (variant.size || variant.value)) {
          variantTexts.push(variant.size || variant.value);
        }
      }
      
      return variantTexts.length > 0 ? 
        `${variantTexts.join('，')}，${this.selectedQuantity}件` : 
        '请选择规格';
    }
  },
	onLoad(params) {
		console.log('🛒 商品详情页参数:', params);
		this.type = params.type || 0;
		this.productId = params.id;
		
		if (this.productId) {
			console.log('📦 接收到商品ID:', this.productId);
			
			// 加载商品详情数据
			this.loadProductDetail();
		} else {
			console.warn('⚠️ 未接收到商品ID参数');
			uni.showToast({
				title: '商品ID缺失',
				icon: 'error'
			});
		}
	},
	onPageScroll(e) {
		this.PageScrollTop = e.scrollTop;
	},
  methods: {
    /**
     * 返回
     */
    onBack() {
      uni.navigateBack();
    },
    /**
     * tab
     */
    onTab(type) {
      this.TabShow = type;
      switch (type) {
        case 0:
          uni.pageScrollTo({
          	scrollTop: 0,
          	duration: 300
          });
          break;
        case 1:
          uni.createSelectorQuery().select(".evaluate-data").boundingClientRect((data) => { //data - 各种参数
            uni.pageScrollTo({
							scrollTop: this.PageScrollTop + data.top -50,
							duration: 300
						});
          }).exec()
          break;
        case 2:
          uni.createSelectorQuery().select(".products-introduction").boundingClientRect((data) => { //data - 各种参数
            uni.pageScrollTo({
            	scrollTop: this.PageScrollTop + data.top - 50,
            	duration: 300
            });
          }).exec()
          break;
      }
    },
    /**
     * 去购物车
     */
    onToCart() {
      uni.switchTab({
        url: '/pages/cart/cart'
      })
    },
    /**
     * 降价通知点击
     */
    onDepreciate() {
      uni.showToast({
        title: '降价通知提醒成功',
        icon: 'success'
      })
    },
    /**
     * 关注点击
     */
    onAttention() {
      if (this.AttentionShow === 0) {
        this.AttentionShow = 1;
        uni.showToast({
          title: '关注成功',
          icon: 'none'
        })
      } else {
        this.AttentionShow = 0;
        uni.showToast({
          title: '取消成功',
          icon: 'none'
        })
      }

    },
		
		/**
		 * 分享商品
		 */
		async onShare() {
			try {
				const ShareManager = require('@/utils/share.js').default;
				
				// 构建分享内容
				const shareContent = ShareManager.buildShareContent(this.goodsDetail);
				
				console.log('📤 准备分享商品:', shareContent);
				
				// 显示分享选项并处理用户选择
				await ShareManager.showShareOptions(shareContent, this);
				
			} catch (error) {
				console.error('❌ 分享失败:', error);
				// 不显示错误提示，静默处理
			}
		},
		
		/**
		 * 评价点击
		 */
		onEvaluate(){
			uni.navigateTo({
				url: '/pages/GoodsEvaluateList/GoodsEvaluateList'
			})
		},

		/**
		 * 加载商品详情数据
		 */
		async loadProductDetail() {
			let loadingTimeout = null;
			try {
				this.loading = true;
				console.log('🔄 开始加载商品详情，ID:', this.productId);
				
				// 添加超时保护，防止loading状态一直为true
				loadingTimeout = setTimeout(() => {
					if (this.loading) {
						console.warn('⏰ 加载超时，强制结束loading状态');
						this.loading = false;
					}
				}, 10000); // 10秒超时
				
				// 直接使用uni.request获取商品详情
				// 从配置模块获取API地址
				const apiBaseUrl = ENV_CONFIG.BASE_URL;
				console.log('📦 商品详情API地址:', apiBaseUrl);
				
				const response = await new Promise((resolve, reject) => {
					uni.request({
						url: `${apiBaseUrl}/products/${this.productId}`,
						method: 'GET',
						timeout: 10000,
						success: (res) => {
							console.log('📦 商品详情API原始响应:', res);
							resolve(res);
						},
						fail: (error) => {
							console.error('📦 商品详情API请求失败:', error);
							reject(new Error(`获取商品详情失败: ${error.errMsg || 'unknown error'}`));
						}
					});
				});
				
				console.log('📦 商品详情API响应:', response);
				
				if (response.statusCode === 200 && response.data && response.data.success && response.data.data && response.data.data.product) {
					const product = response.data.data.product;
					console.log('📦 原始商品数据:', JSON.stringify(product, null, 2));
					
					this.goodsDetail = product;
					console.log('🔄 goodsDetail设置后:', this.goodsDetail);
					
					// 强制更新视图
					this.$forceUpdate();
					
					console.log('✅ 商品详情加载成功:', product.name);
					
					// 更新商品图片轮播数据
					this.updateProductImages(product);
					
					// 更新页面标题
					uni.setNavigationBarTitle({
						title: product.name.length > 10 ? product.name.substring(0, 10) + '...' : product.name
					});
					
					// 记录商品浏览历史
					try {
						this.recordBrowsingHistory(product);
					} catch (error) {
						console.warn('⚠️ 浏览历史记录失败:', error);
					}
					
					// 初始化默认属性选择
					this.initializeDefaultSelection(product);
					
					// 初始化收货地址
					this.initializeDeliveryAddress();
					
					console.log('🖼️ 商品图片数量:', product.images?.length || 0);
					console.log('💰 商品价格:', product.price);
					
				} else {
					console.error('❌ 商品详情数据格式异常');
					uni.showToast({
						title: '商品数据加载失败',
						icon: 'error'
					});
				}
			} catch (error) {
				console.error('❌ 加载商品详情失败:', error);
				uni.showToast({
					title: '获取商品详情失败',
					icon: 'error'
				});
				
				// 返回上一页
				setTimeout(() => {
					uni.navigateBack();
				}, 2000);
			} finally {
				// 清除超时定时器
				if (loadingTimeout) {
					clearTimeout(loadingTimeout);
				}
				
				this.loading = false;
				console.log('🔄 loading状态已设置为false');
			}
		},

		/**
		 * 更新商品图片轮播数据
		 */
		updateProductImages(product) {
			if (product.images && product.images.length > 0) {
				// 使用真实的商品图片
				this.swiperList = product.images.map((imageUrl, index) => ({
					id: index,
					type: 'image',
					url: imageUrl
				}));
				console.log('🖼️ 更新商品轮播图:', this.swiperList.length, '张图片');
			} else {
				console.warn('⚠️ 商品无图片，使用默认图片');
				// 保持默认图片
			}
		},

		/**
		 * 初始化默认属性选择
		 */
		initializeDefaultSelection(product) {
			try {
				if (!product || !product.variants || !Array.isArray(product.variants)) {
					console.log('📋 商品无variants数据，跳过属性初始化');
					return;
				}

				console.log('🔧 开始初始化默认属性选择');
				
				this.selectedVariants = {};
				
				// 遍历每个variant，选择默认选项
				product.variants.forEach((variant) => {
					if (variant.options && variant.options.length > 0) {
						// 寻找默认选项
						let defaultOption = variant.options.find(option => option.isDefault);
						
						// 如果没有默认选项，取第一个选项
						if (!defaultOption) {
							defaultOption = variant.options[0];
						}
						
						// 设置选中的variant，保持与子组件数据结构一致
						this.selectedVariants[variant._id] = {
							...defaultOption,
							size: defaultOption.value,  // 添加size字段，保持兼容性
							variantId: variant._id,
							variantName: variant.name,
							optionId: defaultOption._id
						};
						
						console.log(`🎨 ${variant.name}默认选择:`, defaultOption.value);
					}
				});
				
				// 设置默认数量
				this.selectedQuantity = 1;
				
				console.log('✅ 默认属性选择初始化完成:', this.selectedVariants);
				
			} catch (error) {
				console.error('❌ 初始化默认属性选择失败:', error);
			}
		},

		/**
		 * 记录商品浏览历史
		 */
		recordBrowsingHistory(product) {
			try {
				const historyItem = {
					id: product._id,
					name: product.name,
					price: product.price,
					img: product.images && product.images.length > 0 ? product.images[0] : '/static/img/default_product.png',
					category: product.category?.name || product.category,
					subcategory: product.subcategory?.name || product.subcategory,
					tags: product.tags || []
				};
				
				BrowsingHistory.addProduct(historyItem);
				console.log('📖 商品浏览记录已保存:', product.name);
				
				// 可选：获取并打印浏览统计
				const stats = BrowsingHistory.getStatistics();
				console.log('📊 浏览记录统计:', stats);
				
			} catch (error) {
				console.error('❌ 记录浏览历史失败:', error);
			}
		},

		/**
		 * 商品属性选择变化事件
		 */
		onVariantChange(data) {
			console.log('🎨 属性选择变化:', data);
			this.selectedVariants = data.selectedVariants;
		},

		/**
		 * 商品数量变化事件
		 */
		onQuantityChange(quantity) {
			console.log('🔢 数量变化:', quantity);
			this.selectedQuantity = quantity;
		},

		/**
		 * 属性选择更新事件（点击"已选"确定时触发）
		 */
		onSelectionUpdate(data) {
			console.log('🔄 属性选择更新:', data);
			this.selectedVariants = data.selectedVariants;
			this.selectedQuantity = data.quantity;
			
			// 可选：显示选择成功提示
			// uni.showToast({
			// 	title: '选择已更新',
			// 	icon: 'success',
			// 	duration: 1000
			// });
		},

		/**
		 * 属性选择确认事件（购买操作时触发）
		 */
		onAttrConfirm(orderData) {
			console.log('✅ 购买操作确认:', orderData);
			
			if (orderData.type === 2) {
				// 加入购物车
				this.addToCart(orderData);
			} else if (orderData.type === 3) {
				// 立即购买 - 构建完整订单数据并保存
				console.log('🛒 立即购买，准备订单数据');
				
				const completeOrderData = {
					product: {
						id: this.goodsDetail._id,
						name: this.goodsDetail.name,
						price: orderData.price,
						originalPrice: this.goodsDetail.originalPrice,
						images: this.goodsDetail.images || [],
						description: this.goodsDetail.description
					},
					selectedVariants: orderData.variants,
					quantity: orderData.quantity,
					totalPrice: orderData.price * orderData.quantity,
					orderType: 'buy_now',
					createdAt: new Date().toISOString()
				};
				
				try {
					// 保存订单数据到本地存储
					uni.setStorageSync('tempOrderData', completeOrderData);
					console.log('💾 订单数据已保存:', completeOrderData);
					
					// 跳转到订单确认页面
					uni.navigateTo({
						url: '/pages/ConfirmOrder/ConfirmOrder'
					});
					
				} catch (error) {
					console.error('❌ 保存订单数据失败:', error);
					uni.showToast({
						title: '订单数据保存失败',
						icon: 'none'
					});
				}
			}
		},

		/**
		 * 添加到购物车
		 */
		async addToCart(orderData) {
			try {
				console.log('🛒 添加到购物车:', orderData);
				
				// 构建购物车商品数据
				const cartItemData = {
					productId: this.goodsDetail._id,
					name: this.goodsDetail.name,
					price: orderData.price,
					image: this.goodsDetail.images && this.goodsDetail.images.length > 0 
						? this.goodsDetail.images[0] 
						: '/static/img/default_product.png',
					variants: orderData.variants,
					quantity: orderData.quantity
				};
				
				console.log('📦 购物车商品数据:', cartItemData);
				
				// 使用购物车管理器添加商品
				const CartManager = require('@/utils/cart.js').default;
				const result = CartManager.addToCart(cartItemData);
				
				if (result.success) {
					uni.showToast({
						title: result.message,
						icon: 'success'
					});
					
					// 触发TabBar购物车数量更新
					uni.$emit('updateCartCount');
					
					console.log('✅ 商品已成功添加到购物车');
				} else {
					throw new Error(result.message);
				}
				
			} catch (error) {
				console.error('❌ 添加购物车失败:', error);
				uni.showToast({
					title: error.message || '添加购物车失败',
					icon: 'none'
				});
			}
		},

		/**
		 * 初始化收货地址
		 */
		initializeDeliveryAddress() {
			try {
				// 尝试从本地存储读取用户上次选择的地址
				const savedAddress = uni.getStorageSync('lastDeliveryAddress');
				
				if (savedAddress && savedAddress.address) {
					this.selectedAddress = savedAddress;
					console.log('📍 恢复上次选择的地址:', savedAddress.address);
				} else {
					console.log('📍 未找到保存的地址，使用默认提示');
				}
			} catch (error) {
				console.error('❌ 初始化收货地址失败:', error);
			}
		},

		/**
		 * 选择收货地址 - 使用UniApp原生API
		 */
		onSelectAddress() {
			console.log('🗺️ 点击选择收货地址');
			
			uni.chooseLocation({
				success: (res) => {
					console.log('📍 选择地址成功:', res);
					
					// 更新选择的地址信息
					this.selectedAddress = {
						address: res.address,
						name: res.name,
						latitude: res.latitude,
						longitude: res.longitude,
						province: '', // chooseLocation不返回省市区信息
						city: '',
						district: '',
						detail: ''
					};
					
					// 保存地址到本地存储，下次自动恢复
					try {
						uni.setStorageSync('lastDeliveryAddress', this.selectedAddress);
						console.log('💾 地址已保存到本地存储');
					} catch (error) {
						console.warn('⚠️ 保存地址到本地存储失败:', error);
					}
					
					// 显示地址更新提示
					uni.showToast({
						title: '地址已更新',
						icon: 'success',
						duration: 1500
					});
				},
				fail: (error) => {
					console.error('❌ 选择地址失败:', error);
					
					if (error.errMsg && error.errMsg.includes('cancel')) {
						// 用户取消选择，不显示错误提示
						return;
					}
					
					uni.showToast({
						title: '选择地址失败',
						icon: 'none',
						duration: 2000
					});
				}
			});
		}
  }
};
</script>

<style scoped lang="scss">
@import 'GoodsDetails.scss';

/* 加载状态样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  
  text {
    margin-top: 20rpx;
    color: #999;
    font-size: 28rpx;
  }
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #fe3b0f;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 商品描述样式 */
.description-text {
  padding: 20rpx 0;
  line-height: 1.6;
  
  text {
    color: #666;
    font-size: 28rpx;
  }
}


</style>
