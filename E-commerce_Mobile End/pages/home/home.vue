<template>
	<view class="page">
		<view class="head-info">
			<!-- 搜索 -->
			<view class="head-search">
				<view class="icon-info" @click="onCode">
					<text class="iconfont icon-saoyisao"></text>
					<!-- <image src="/static/xiaoxi_ico.png" mode=""></image> -->
				</view>
				<view class="search" @click="onSearch">
					<view class="icon">
						<image src="/static/fdj_ico.png" mode=""></image>
					</view>
					<view class="hint">
						<text class="max">搜索</text>
						<text class="min">热门内容</text>
					</view>
				</view>
				<view class="icon-info" @click="onSkip('paycode')">
					<text class="iconfont icon-fukuanma"></text>
					<!-- <image src="/static/fkm_ico.png" mode=""></image> -->
				</view>
			</view>
			<!-- 分类列表 -->
			<view class="classify-list">
				<view class="list" v-for="(item,index) in classList"
				:class="{'action':classifyShow==index}"
				@click="onClassify(item,index)"
				:key="index">
					<text>{{item.name}}</text>
					<text class="line" v-show="classifyShow==index"></text>
				</view>
			</view>
		</view>
    <mescroll-body ref="mescrollRef"
                   @down="downCallback"
                   @up="upCallback"
                   :down="downOption"
                   :up="upOption"
                   :top="0">
		<view class="main" v-show="classifyShow===0">
			<!-- banner -->
			<view class="banner">
				<swiper class="screen-swiper square-dot" indicator-dots="true" circular="true" autoplay="true" interval="5000" duration="500">
					<swiper-item v-for="(item,index) in swiperList" :key="index">
						<image :src="item.url" mode="aspectFill"></image>
						<!-- <video src="{{item.url}}" autoplay loop muted show-play-btn="{{false}}" controls="{{false}}" objectFit="cover" wx:if="{{item.type=='video'}}"></video> -->
					</swiper-item>
				</swiper>
			</view>
			<!-- 菜单导航 -->
			<view class="menu-nav">
				<scroll-view scroll-x @scroll="ScrollMenu" class="nav-list">
					<view class="nav" ref="nav">
						<view class="list" v-for="(item,index) in navList"
						@click="onSkip('menu')"
						:key="item.id">
							<image :src="item.icon || '/static/nav/nav_ico'+(index+1)+'.png'" mode="aspectFill"></image>
							<text>{{item.name}}</text>
						</view>
					</view>
				</scroll-view>
				<view class="indicator" v-if="navList.length>10">
					<view class="plan">
						<view class="bar" :style="'left:'+slideNum+'%'"></view>
					</view>
				</view>
			</view>
			<!-- 通知 -->
			<view class="inform">
				<view class="inform-info">
					<view class="picture">
						<image src="/static/gg_ico.png" mode=""></image>
					</view>
					<view class="info">
						<swiper class="swiper" :circular="true" :vertical="true" :indicator-dots="false" :autoplay="true" :interval="3000" :duration="1000">
							<swiper-item>
								<view class="swiper-item" @click="onSkip('inform')">
									<text class="one-omit">何*** 理刚刚通过推广赚了￥25.00元，商品男装休闲装购买</text>
								</view>
							</swiper-item>
							<swiper-item>
								<view class="swiper-item" @click="onSkip('inform')">
									<text class="one-omit">张*** 理刚刚通过推广赚了￥99.00元，商品Mac book pro 15寸购买</text>
								</view>
							</swiper-item>
							<swiper-item>
								<view class="swiper-item" @click="onSkip('inform')">
									<text class="one-omit">郑*** 理刚刚通过推广赚了￥88.00元，商品华为meat30 pro购买</text>
								</view>
							</swiper-item>
						</swiper>
					</view>
				</view>
			</view>
			<!-- 限时抢购，好货精选 -->
			<view class="flash-good">
				<view class="flash-sale">
					<view class="line"></view>
					<view class="flash-title" @click="onSkip('flash')">
						<view class="pictrue">
							<image src="/static/xsqg_title.png" mode=""></image>
						</view>
						<view class="date-time">
							<text class="time">02</text>
							<text class="da">:</text>
							<text class="time">15</text>
							<text class="da">:</text>
							<text class="time">55</text>
						</view>
					</view>
					<view class="goods-list">
						<view class="list" @click="onSkip('goods')">
							<view class="pictrue">
								<image src="/static/img/goods_01.png"></image>
							</view>
							<view class="price">
								<text class="selling-price">￥59</text>
								<text class="original-price">￥999</text>
							</view>
						</view>
						<view class="list" @click="onSkip('goods')">
							<view class="pictrue">
								<image src="/static/img/goods_02.png"></image>
							</view>
							<view class="price">
								<text class="selling-price">￥59</text>
								<text class="original-price">￥999</text>
							</view>
						</view>
					</view>
				</view>
				<view class="good-choice">
					<view class="goods-title" @click="onSkip('GoodChoice')">
						<view class="title">
							<text>好货精选</text>
						</view>
						<view class="describe">
							<text>全场</text>
							<text class="num">1</text>
							<text>折起</text>
						</view>
					</view>
					<view class="goods-list">
						<view class="list" @click="onSkip('goods')">
							<view class="pictrue">
								<image src="/static/img/goods_03.png"></image>
							</view>
							<view class="price">
								<text class="selling-price">￥59</text>
								<text class="original-price">￥999</text>
							</view>
						</view>
						<view class="list" @click="onSkip('goods')">
							<view class="pictrue">
								<image src="/static/img/goods_08.png"></image>
							</view>
							<view class="price">
								<text class="selling-price">￥59</text>
								<text class="original-price">￥999</text>
							</view>
						</view>
					</view>
				</view>
			</view>
			<!-- 今日上新 -->
			<view class="new-product">
				<view class="product-title">
					<view class="title">
						<image src="/static/hr_ico.png"></image>
						<text>今日上新</text>
					</view>
					<view class="describe">
						<text>今日上新商品是否有你心仪礼物</text>
					</view>
				</view>
				<view class="goods-list">
					<view class="list" @click="onSkip('goods')">
						<view class="pictrue">
							<image src="/static/img/goods_07.png"></image>
						</view>
						<view class="price" @click="onSkip('goods')">
							<text class="selling-price">￥59</text>
							<text class="original-price">￥19</text>
						</view>
					</view>
					<view class="list" @click="onSkip('goods')">
						<view class="pictrue">
							<image src="/static/img/goods_10.png"></image>
						</view>
						<view class="price">
							<text class="selling-price">￥399</text>
							<text class="original-price">￥299</text>
						</view>
					</view>
					<view class="list" @click="onSkip('goods')">
						<view class="pictrue">
							<image src="/static/img/goods_11.png"></image>
						</view>
						<view class="price">
							<text class="selling-price">￥3999</text>
							<text class="original-price">￥2999</text>
						</view>
					</view>
					<view class="list" @click="onSkip('goods')">
						<view class="pictrue">
							<image src="/static/img/goods_10.png"></image>
						</view>
						<view class="price">
							<text class="selling-price">￥599</text>
							<text class="original-price">￥199</text>
						</view>
					</view>
				</view>
			</view>
			<!-- 为你推荐 -->
			<view class="recommend-info">
				<view class="recommend-title">
					<view class="title">
						<image src="/static/wntj_title.png" mode=""></image>
					</view>
				</view>
				<view class="goods-list">
					<view class="list" v-for="(item,index) in goodsList" @click="onSkip('goods')" :key="index">
						<view class="pictrue">
							<image :src="item.img" mode="heightFix"></image>
						</view>
						<view class="title-tag">
							<view class="tag">
								<text v-if="item.is_goods === 1">特价</text>
								{{item.name}}
							</view>
						</view>
						<view class="price-info">
							<view class="user-price">
								<text class="min">￥</text>
								<text class="max">{{item.price}}</text>
							</view>
							<view class="vip-price">
								<image src="/static/vip_ico.png"></image>
								<text>￥{{item.vip_price}}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
    </mescroll-body>
    <ClassifyData v-show="classifyShow!=0"></ClassifyData>
		<!-- tabbar -->
		<TabBar :tabBarShow="0"></TabBar>
	</view>
</template>

<script>
import TabBar from '../../components/TabBar/TabBar.vue';
import ClassifyData from '../../components/ClassifyData/ClassifyData.vue';
// 引入mescroll-mixins.js
import MescrollMixin from "@/components/mescroll-uni/mescroll-mixins.js";
import api from '@/utils/api.js';
export default {
  mixins: [MescrollMixin], // 使用mixin
	components:{
		TabBar,
		ClassifyData,
		},
	data(){
		return{
      mescroll: null, // mescroll实例对象 (此行可删,mixins已默认)
      // 下拉刷新的配置(可选, 绝大部分情况无需配置)
      downOption: {},
      // 上拉加载的配置(可选, 绝大部分情况无需配置)
      upOption: {
        use: false
      },
			swiperList: [
				{
					id: 0,
					type: 'image',
					url: '/static/img/banner_01.png'
				},
				{
					id: 1,
					type: 'image',
					url: '/static/img/banner_02.png'
				},
				{
					id: 2,
					type: 'image',
					url: '/static/img/banner_03.png'
				},
				{
					id: 3,
					type: 'image',
					url: '/static/img/banner_04.png'
				},
				{
					id: 4,
					type: 'image',
					url: '/static/img/banner_01.png'
				},
				{
					id: 5,
					type: 'image',
					url: '/static/img/banner_01.png'
				}
			],
			slideNum: 0,
			navList: [], // 将从API获取
			classList: [
				{
					id: 0,
					name: '首页',
				}
			], // 将从API获取并追加到首页后面
			goodsList:[
				{
					id: 1,
					name: 'BANDALY 2020夏季女装连衣裙韩版大码宽松显瘦套装裙子两件套 JX19301 上豆绿下米白 M ',
					price: '219.00',
					vip_price: '129.00',
					img: '/static/img/goods_thumb_01.png',
					is_goods: 0,
				},{
					id: 1,
					name: '花花公子 卫衣男秋季圆领薄款休闲体恤男士时尚长袖T恤外套上衣男生情侣装套头衣服秋天男装 白色 XL',
					price: '139.00',
					vip_price: '99.00',
					img: '/static/img/goods_thumb_02.png',
					is_goods: 1,
				},{
					id: 1,
					name: '【两件套】花花公子PLAYBOY短袖T恤男套装夏季新款卫衣男士韩版修身冰丝宽松运动休闲上衣服裤子男装 CYFS903卡其色 XL',
					price: '168.00',
					vip_price: '158.00',
					img: '/static/img/goods_thumb_03.png',
					is_goods: 1,
				},{
					id: 1,
					name: '雪域森林短袖T恤男装2020夏季潮流时尚衣服男潮牌圆领印花宽松T恤半袖男 20855橙色 XL',
					price: '68.00',
					vip_price: '36.00',
					img: '/static/img/goods_thumb_04.png',
					is_goods: 0,
				},{
					id: 1,
					name: '短袖男夏季T恤男装韩版潮流印花套头衣服男士圆领宽松五分袖学生休闲夏天运动时尚情侣装大码 D119白色 XL',
					price: '68.00',
					vip_price: '59.00',
					img: '/static/img/goods_thumb_05.png',
					is_goods: 0,
				},{
					id: 1,
					name: '时尚休闲套装女夏季热天宽松女孩中学生高中初中生女生短袖套装衣服夏天少女学生韩版原宿风T恤潮流裤子一套 绿字母上衣+绿色裤两件套 均码',
					price: '83.00',
					vip_price: '78.00',
					img: '/static/img/goods_thumb_06.png',
					is_goods: 1,
				},{
					id: 1,
					name: '北极绒2020春夏季棉质睡衣女睡裙女夏季韩版纯棉短袖少女性感睡衣甜美可爱卡通家居服连衣裙 A3023 M【纯棉 品质保障】',
					price: '68.00',
					vip_price: '48.00',
					img: '/static/img/goods_thumb_07.png',
					is_goods: 1,
				},{
					id: 1,
					name: '韩卡婷 2020新款夏季短袖t恤女宽松学生衣服原宿风青春百搭显瘦上衣体恤闺蜜女装 白色 均码【80-120斤】',
					price: '29.00',
					vip_price: '19.00',
					img: '/static/img/goods_thumb_08.png',
					is_goods: 0,
				},{
					id: 1,
					name: '美连诚雪纺连衣裙 2020新款女夏裙子波点气质沙滩裙仙气时尚女装休闲衣服大码女装 白底红点 M ',
					price: '168.00',
					vip_price: '160.00',
					img: '/static/img/goods_thumb_09.png',
					is_goods: 0,
				},{
					id: 1,
					name: '凝拉t恤女短袖纯棉2020新款夏装中长款韩版宽松大码欧货潮上衣服半袖体恤 桔色2053 2XL（建议150-170斤)',
					price: '89.00',
					vip_price: '78.00',
					img: '/static/img/goods_thumb_10.png',
					is_goods: 0,
				},{
					id: 1,
					name: '荣耀Play4T 全网通6GB+128GB大内存 幻夜黑 4000mAh大电池 4800万AI摄影  6.39英寸魅眼屏',
					price: '1190.00',
					vip_price: '1100.00',
					img: '/static/img/goods_thumb_11.png',
					is_goods: 0,
				},{
					id: 1,
					name: '小米（MI） Redmi 8A',
					price: '699.00',
					vip_price: '599.00',
					img: '/static/img/goods_thumb_12.png',
					is_goods: 0,
				},{
					id: 1,
					name: 'Apple iPhone 11',
					price: '5899.00',
					vip_price: '5800.00',
					img: '/static/img/goods_thumb_13.png',
					is_goods: 0,
				},{
					id: 1,
					name: '戴尔(DELL)成就3681英特尔酷睿i5商用办公高性能台式机电脑整机(十代i5-10400 8G 1T 三年上门售后)21.5英寸',
					price: '3699.00',
					vip_price: '3600.00',
					img: '/static/img/goods_thumb_14.png',
					is_goods: 0,
				},{
					id: 1,
					name: '戴尔DELL灵越5000 14英寸酷睿i5网课学习轻薄笔记本电脑(十代i5-1035G1 8G 512G MX230 2G独显)银',
					price: '4888.00',
					vip_price: '4999.00',
					img: '/static/img/goods_thumb_15.png',
					is_goods: 0,
				},{
					id: 1,
					name: '联想(Lenovo) 来酷 Lecoo一体台式机电脑23英寸(J4105 8G 256G SSD 三年上门）白',
					price: '4888.00',
					vip_price: '3600.00',
					img: '/static/img/goods_thumb_16.png',
					is_goods: 0,
				},{
					id: 1,
					name: 'Apple 2020新款 MacBook Pro 13.3【带触控栏】十代i5 16G 512G 2.0GHz 深空灰 笔记本电脑 轻薄本 MWP42CHA',
					price: '18200.00',
					vip_price: '18200.00',
					img: '/static/img/goods_thumb_17.png',
					is_goods: 0,
				},{
					id: 1,
					name: 'Apple新款 Mac mini台式电脑主机 八代i5 8G 512G SSD 台式机 MXNG2CHA',
					price: '8299.00',
					vip_price: '8200.00',
					img: '/static/img/goods_thumb_18.png',
					is_goods: 0,
				}
			], // goodsList数据临时保留，将通过API替换
			classifyShow: 0,
			// 页面高度
			pageHeight: 500,
			// 加载状态
			loading: false,
		}
	},
	onReady() {
		uni.hideTabBar();
		// #ifdef MP
		uni.setNavigationBarTitle({
			title: '首页',
		})
		uni.setNavigationBarColor({
			frontColor: '#ffffff',
			backgroundColor: '#fe3b0f',
		})
		// #endif
	},
	onLoad() {
		console.log('首页onLoad执行');
		// 异步加载真实数据
		this.loadPageData();
	},
	onPageScroll(e){
		let scrollTop = e.scrollTop;
		if(scrollTop > 0){
			this.pageHeight = 210;
		}else{
			this.pageHeight = 500;
		}
	},
  onReachBottom(){
    console.log(12333);
  },
	methods:{
    /*下拉刷新的回调, 有三种处理方式:*/
    downCallback(){
      this.mescroll.endSuccess();
    },
    /*上拉加载的回调*/
    upCallback(page) {
      setTimeout(() =>{
        this.mescroll.endByPage(10, 20);
      },2000)
    },
		/**
		 * 菜单导航滚动
		 */
		ScrollMenu(e){
			let scrollLeft = e.target.scrollLeft;
			const query = uni.createSelectorQuery().in(this);
			query.select('.nav').boundingClientRect(data => {
				let wid = e.target.scrollWidth - data.width - (data.left*2+5);
				this.slideNum = (scrollLeft/wid*300) / 2;
			}).exec();
		},
		/**
		 * 搜索点击
		 */
		onSearch(){
			uni.navigateTo({url:'/pages/search/search'})
		},
		/**
		 * 扫一扫点击
		 */
		onCode(){
			// 只允许通过相机扫码
			uni.scanCode({
				onlyFromCamera: true,
				success: function (res) {
						console.log('条码类型：' + res.scanType);
						console.log('条码内容：' + res.result);
				}
			});
		},
		/**
		 * 分类点击
		 * @param {Object} item
		 * @param {Number} index
		 */
		onClassify(item,index){
			this.classifyShow = index;
		},
		/**
		 * 跳转点击
		 * @param {String} type 跳转类型
		 */
		onSkip(type){
			switch (type){
				case 'mess':
					uni.navigateTo({
						url: '/pages/Message/Message'
					})
					break;
				case 'paycode':
					uni.navigateTo({
						url: '/pages/PaymentCode/PaymentCode'
					})
					break;
				case 'menu':
					uni.navigateTo({
						url: '/pages/SearchGoodsList/SearchGoodsList'
					})
					break;
				case 'inform':
					break;
				case 'flash':
					uni.navigateTo({
						url: '/pages/FlashSale/FlashSale'
					})
					break;
				case 'GoodChoice':
					uni.navigateTo({
						url: '/pages/GoodChoice/GoodChoice'
					})
					break;
				case 'goods':
					uni.navigateTo({
						url: '/pages/GoodsDetails/GoodsDetails',
						animationType: 'zoom-fade-out',
						animationDuration: 200
					})
					break;
			}
		},
		
		// 加载页面数据
		async loadPageData() {
			console.log('🚀 开始加载页面数据...');
			this.loading = true;
			try {
				// 首先测试API连通性
				await this.testApiConnection();
				
				// 并行加载数据
				await Promise.all([
					this.loadHomepageCategories(),
					this.loadRecommendedProducts()
				]);
			} catch (error) {
				console.error('❌ 加载页面数据失败:', error);
				api.handleError(error, '加载数据失败');
			} finally {
				this.loading = false;
				console.log('⏹️ 数据加载完成');
			}
		},

		// 测试API连通性
		async testApiConnection() {
			try {
				console.log('🔗 测试API连通性...');
						const testResponse = await uni.request({
			url: 'http://192.168.157.4:3000/api/categories/homepage',
			method: 'GET',
			timeout: 30000
		});
				
				console.log('🌐 API连通性测试结果:', testResponse);
				
				// 处理可能的数组响应
				let actualResponse = testResponse;
				if (Array.isArray(testResponse) && testResponse.length > 1) {
					actualResponse = testResponse[1];
				}
				
				if (actualResponse.statusCode === 200) {
					console.log('✅ API连接正常');
					console.log('📊 原始API响应数据:', JSON.stringify(actualResponse.data, null, 2));
					return actualResponse.data;
				} else {
					throw new Error(`API连接失败: ${actualResponse.statusCode}`);
				}
			} catch (error) {
				console.error('❌ API连通性测试失败:', error);
				throw error;
			}
		},

		// 加载首页分类和导航数据
		async loadHomepageCategories() {
			try {
				console.log('🔄 开始加载首页分类数据...');
				console.log('🌐 API基础URL:', 'http://192.168.92.58:3000/api');
				
				const response = await api.category.getHomepageCategories();
				console.log('📡 完整API响应:', JSON.stringify(response, null, 2));
				
				if (response && response.success && response.data && response.data.categories) {
					const categories = response.data.categories;
					console.log('✅ 获取到分类数据:', categories.length, '个分类');
					console.log('📦 分类详细数据:', JSON.stringify(categories, null, 2));
					
					// 检查每个分类的homeDisplay配置
					categories.forEach((category, index) => {
						console.log(`🏷️  分类${index + 1}: ${category.name}`, {
							showOnHome: category.homeDisplay?.showOnHome,
							homeTitle: category.homeDisplay?.homeTitle,
							homeOrder: category.homeDisplay?.homeOrder
						});
					});
					
					// 过滤出配置了首页显示的分类
					const homeCategories = categories.filter(cat => 
						cat.homeDisplay && cat.homeDisplay.showOnHome
					).sort((a, b) => 
						(a.homeDisplay.homeOrder || 0) - (b.homeDisplay.homeOrder || 0)
					);
					
					console.log('🏠 首页显示分类:', homeCategories.length, '个');
					
					if (homeCategories.length > 0) {
						// 更新导航数据 (9宫格导航)
						const navData = api.transformers.categoryToNavigation(homeCategories);
						console.log('🧭 转换后的导航数据:', navData);
						this.$set(this, 'navList', navData);
						
						// 更新分类标签 (顶部横向滚动标签)
						const newClassList = api.transformers.categoryToClassList(homeCategories);
						console.log('🏷️  转换后的分类标签:', newClassList);
						this.$set(this, 'classList', newClassList);
						
						console.log('✅ 首页分类数据加载成功!');
					} else {
						console.warn('⚠️ 没有配置首页显示的分类，使用默认数据');
						this.setDefaultNavigationData();
					}
				} else {
					console.warn('⚠️ API响应格式异常，使用默认数据');
					console.log('响应结构:', {
						hasResponse: !!response,
						hasSuccess: !!(response && response.success),
						hasData: !!(response && response.data),
						hasCategories: !!(response && response.data && response.data.categories)
					});
					this.setDefaultNavigationData();
				}
			} catch (error) {
				console.error('❌ 获取首页分类失败:', error);
				console.error('错误详情:', error.message);
				console.warn('🔄 使用默认导航数据作为降级方案');
				this.setDefaultNavigationData();
				// 不再抛出错误，避免阻断其他数据加载
			}
		},

		// 加载推荐商品数据
		async loadRecommendedProducts() {
			try {
				console.log('开始加载推荐商品数据...');
				const response = await api.product.getProducts({
					limit: 20,
					featured: true // 获取精选商品
				});
				console.log('商品API响应:', response);
				
				if (response && response.success && response.data && response.data.products) {
					// 转换商品数据格式
					const products = response.data.products.map(product => 
						api.transformers.productToFrontend(product)
					);
					this.$set(this, 'goodsList', products);
					console.log('推荐商品数据加载成功:', products.length, '个商品');
				}
			} catch (error) {
				console.error('获取推荐商品失败:', error);
				// 如果推荐商品加载失败，尝试加载普通商品列表
				try {
					console.log('尝试加载普通商品列表...');
					const fallbackResponse = await api.product.getProducts({
						limit: 20
					});
					if (fallbackResponse && fallbackResponse.success && fallbackResponse.data && fallbackResponse.data.products) {
						const products = fallbackResponse.data.products.map(product => 
							api.transformers.productToFrontend(product)
						);
						this.$set(this, 'goodsList', products);
						console.log('商品数据加载成功（备用方案）:', products.length, '个商品');
					} else {
						console.warn('普通商品列表也无法加载，保持现有商品数据');
					}
				} catch (fallbackError) {
					console.error('备用商品加载也失败:', fallbackError);
					console.warn('保持现有商品数据');
				}
			}
		},

		// 设置默认导航数据
		setDefaultNavigationData() {
			console.log('设置默认导航数据');
			
			// 默认10宫格导航数据（2行×5列）
			const defaultNavList = [
				{ id: 1, name: '手机专区' },
				{ id: 2, name: '潮牌男装' },
				{ id: 3, name: '运动男装' },
				{ id: 4, name: '时尚背包' },
				{ id: 5, name: '台式电脑' },
				{ id: 6, name: '珠宝首饰' },
				{ id: 7, name: '美颜美妆' },
				{ id: 8, name: '家用电器' },
				{ id: 9, name: '洗护用品' },
				{ id: 10, name: '女装' }
			];
			
			// 默认分类标签数据
			const defaultClassList = [
				{ id: 0, name: '首页' },
				{ id: 1, name: '手机' },
				{ id: 2, name: '男装' },
				{ id: 3, name: '背包' },
				{ id: 4, name: '电脑' },
				{ id: 5, name: '珠宝' },
				{ id: 6, name: '美妆' },
				{ id: 7, name: '女装' }
			];
			
			this.$set(this, 'navList', defaultNavList);
			this.$set(this, 'classList', defaultClassList);
			
			console.log('默认导航数据设置完成');
		}
	}
};
</script>

<style scoped lang="scss">
@import 'home.scss';
</style>
