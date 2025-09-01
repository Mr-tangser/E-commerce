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
						<text>{{ newProductsStats.total > 0 ? `为您精选了 ${newProductsStats.total} 款新品` : '今日上新商品是否有你心仪礼物' }}</text>
					</view>
				</view>
				
				<!-- 新品加载状态 -->
				<view class="new-products-loading" v-if="loadingNewProducts">
					<view class="loading-content">
						<view class="loading-spinner"></view>
						<text>正在加载新品...</text>
					</view>
				</view>
				
				<!-- 新品商品列表 -->
				<view class="goods-list" v-else-if="newProductsList.length > 0">
					<view class="list" v-for="item in newProductsList.slice(0, 4)" :key="item.id" @click="onGoodsClick(item)">
						<view class="pictrue">
							<image :src="item.img" mode="aspectFill"></image>
							<view class="new-badge">NEW</view>
						</view>
						<view class="price">
							<text class="selling-price">￥{{ item.price }}</text>
							<text class="original-price" v-if="item.originalPrice">￥{{ item.originalPrice }}</text>
						</view>
					</view>
				</view>
				
				<!-- 默认展示 -->
				<view class="goods-list" v-else>
					<view class="list" @click="onSkip('goods')">
						<view class="pictrue">
							<image src="/static/img/goods_07.png"></image>
						</view>
						<view class="price">
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
					<!-- 个性化推荐提示 -->
					<view class="recommend-hint" v-if="showPersonalizedHint">
						<text class="hint-text">🎯 根据您的浏览记录为您推荐</text>
					</view>
					<!-- 推荐统计信息 -->
					<view class="recommend-stats" v-if="recommendationStats.total > 0">
						<text class="stats-text">为您精选了 {{ recommendationStats.total }} 款商品</text>
						<view class="stats-reasons" v-if="Object.keys(recommendationStats.reasons).length > 0">
							<view class="reason-tag" v-for="(count, reason) in recommendationStats.reasons" :key="reason">
								<text>{{ reason }} {{ count }}个</text>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 加载状态 -->
				<view class="loading-state" v-if="loading">
					<view class="loading-content">
						<view class="loading-spinner"></view>
						<text class="loading-text">{{ loadingText }}</text>
						<view class="loading-progress">
							<view class="progress-bar" :style="{ width: loadingProgress + '%' }"></view>
						</view>
					</view>
				</view>
				
				<!-- 瀑布流商品列表 -->
				<WaterfallFlow 
					:dataList="goodsList"
					:showLoadMore="false"
					@item-click="onGoodsClick"
					v-else-if="!loading && goodsList.length > 0"
				/>
				
				<!-- 空状态 -->
				<view class="empty-state" v-else-if="!loading && goodsList.length === 0">
					<view class="empty-content">
						<text class="empty-icon">🛒</text>
						<text class="empty-title">暂无商品数据</text>
						<text class="empty-desc">商品正在补充中，请稍后再来看看</text>
						<view class="empty-actions">
							<button class="retry-btn" @click="loadPageData">重新加载</button>
						</view>
					</view>
				</view>
				
				<!-- 错误状态 -->
				<view class="error-state" v-else-if="hasError">
					<view class="error-content">
						<text class="error-icon">⚠️</text>
						<text class="error-title">加载失败</text>
						<text class="error-desc">{{ errorMessage }}</text>
						<view class="error-actions">
							<button class="retry-btn" @click="retryLoad">重试</button>
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
import WaterfallFlow from '../../components/WaterfallFlow/WaterfallFlow.vue';
// 引入mescroll-mixins.js
import MescrollMixin from "@/components/mescroll-uni/mescroll-mixins.js";
import api from '@/utils/api.js';
import RecommendationService from '@/utils/recommendation-service.js';
export default {
  mixins: [MescrollMixin], // 使用mixin
	components:{
		TabBar,
		ClassifyData,
		WaterfallFlow,
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
			loadingText: '正在加载商品...',
			loadingProgress: 0,
			// 错误状态
			hasError: false,
			errorMessage: '',
			// 是否显示个性化推荐提示
			showPersonalizedHint: false,
			// 推荐统计信息
			recommendationStats: {
				total: 0,
				reasons: {}
			},
			// 新品推荐数据
			newProductsList: [],
			loadingNewProducts: false,
			newProductsStats: {
				total: 0
			},
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
		onSkip(type, data = null){
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
					// 跳转到商品详情，如果有商品数据则传递ID
					let goodsUrl = '/pages/GoodsDetails/GoodsDetails';
					if (data && data.id) {
						goodsUrl += `?id=${data.id}`;
						console.log('🔍 跳转商品详情页:', goodsUrl, data);
					}
					uni.navigateTo({
						url: goodsUrl,
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
			this.hasError = false;
			this.errorMessage = '';
			this.loadingProgress = 0;
			
			try {
				// 阶段1: 测试API连通性 (20%)
				this.loadingText = '检查网络连接...';
				await this.testApiConnection();
				this.loadingProgress = 20;
				
				// 阶段2: 加载分类数据 (60%)
				this.loadingText = '加载商品分类...';
				await this.loadHomepageCategories();
				this.loadingProgress = 60;
				
				// 阶段3: 加载推荐商品 (80%)
				this.loadingText = '加载推荐商品...';
				await this.loadRecommendedProducts();
				this.loadingProgress = 80;
				
				// 阶段4: 加载新品推荐 (100%)
				this.loadingText = '加载新品推荐...';
				await this.loadNewProducts();
				this.loadingProgress = 100;
				
				console.log('⏹️ 数据加载完成');
			} catch (error) {
				console.error('❌ 加载页面数据失败:', error);
				this.hasError = true;
				this.errorMessage = error.message || '网络连接失败，请检查网络后重试';
				// 不再显示全局错误提示，由界面状态展示
			} finally {
				this.loading = false;
			}
		},
		
		// 重试加载
		async retryLoad() {
			await this.loadPageData();
		},

		// 测试API连通性
		async testApiConnection() {
			try {
				console.log('🔗 测试API连通性...');
				console.log('📍 当前API地址:', api.system.getAPIUrl());
				
				// 获取系统信息
				const systemInfo = await api.system.getSystemInfo();
				console.log('📱 运行环境:', {
					platform: systemInfo.platform,
					system: systemInfo.system,
					networkType: systemInfo.networkType
				});
				
				// 检查网络状态
				const networkType = await api.system.checkNetworkStatus();
				console.log('📶 网络状态正常:', networkType);
				
				// 测试API连接
				const isConnected = await api.system.testAPIConnection();
				if (isConnected) {
					console.log('✅ API连接正常');
					return true;
				} else {
					throw new Error('API服务器无响应，请检查服务器是否启动');
				}
			} catch (error) {
				console.error('❌ API连通性测试失败:', error);
				
				// 提供详细的错误信息和解决建议
				let errorMessage = error.message;
				if (error.message.includes('网络未连接')) {
					errorMessage = '网络未连接，请检查WiFi或移动网络设置';
				} else if (error.message.includes('无法连接到服务器')) {
					errorMessage = '无法连接到服务器，请确保：\n1. 手机和电脑在同一WiFi网络\n2. 后端服务已启动(npm start)\n3. 防火墙未阻止端口3000';
				}
				
				throw new Error(errorMessage);
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
				console.log('🛒 开始加载推荐商品数据...');
				
				// 使用推荐服务获取个性化推荐商品
				const recommendations = await RecommendationService.getPersonalizedRecommendations(20);
				
				if (recommendations && recommendations.length > 0) {
					// 使用推荐商品
					this.goodsList = recommendations;
					
					// 判断是否显示个性化提示
					const hasPersonalizedItems = recommendations.some(p => 
						p.reason && !['精选推荐', '热销推荐', '好评推荐'].includes(p.reason)
					);
					this.showPersonalizedHint = hasPersonalizedItems;
					
					// 更新推荐统计信息
					const reasons = this.getRecommendationReasons(recommendations);
					this.recommendationStats = {
						total: recommendations.length,
						reasons: reasons
					};
					
					this.$forceUpdate();
					
					console.log('✅ 个性化推荐商品加载成功:', recommendations.length, '个商品');
					console.log('🎯 推荐原因分布:', reasons);
					
					if (hasPersonalizedItems) {
						console.log('💡 为您展示个性化推荐商品');
					}
				} else {
					// 降级到普通商品列表
					console.warn('⚠️ 推荐系统无商品，降级到普通商品列表');
					await this.loadFallbackProducts();
				}
			} catch (error) {
				console.error('❌ 加载推荐商品失败:', error);
				// 降级到普通商品列表
				await this.loadFallbackProducts();
			}
		},

		// 降级商品加载方案
		async loadFallbackProducts() {
			try {
				console.log('🔄 使用降级方案加载商品...');
				const response = await api.product.getProducts({
					limit: 20
				});
				
				if (response && response.success && response.data && response.data.products && response.data.products.length > 0) {
					const products = response.data.products.map(product => 
						api.transformers.productToFrontend(product)
					);
					
					this.goodsList = products;
					this.$forceUpdate();
					
					console.log('✅ 降级商品数据加载成功:', products.length, '个商品');
				} else {
					console.warn('⚠️ 无法获取商品数据');
				}
			} catch (error) {
				console.error('❌ 降级商品加载失败:', error);
				api.handleError(error, '商品数据加载失败');
			}
		},

		// 获取推荐原因统计
		getRecommendationReasons(recommendations) {
			const reasons = {};
			recommendations.forEach(product => {
				const reason = product.reason || '其他';
				reasons[reason] = (reasons[reason] || 0) + 1;
			});
			return reasons;
		},

		// 加载新品推荐
		async loadNewProducts() {
			try {
				console.log('🆕 开始加载新品推荐...');
				this.loadingNewProducts = true;
				
				// 获取新品推荐
				const newProducts = await RecommendationService.getNewProductRecommendations(8);
				
				if (newProducts && newProducts.length > 0) {
					this.newProductsList = newProducts;
					this.newProductsStats = {
						total: newProducts.length
					};
					console.log('✅ 新品推荐加载成功:', newProducts.length, '个商品');
				} else {
					console.log('ℹ️ 暂无新品推荐');
				}
			} catch (error) {
				console.error('❌ 加载新品推荐失败:', error);
				// 静默失败，不影响主要功能
			} finally {
				this.loadingNewProducts = false;
			}
		},

		// 商品点击处理
		async onGoodsClick(item) {
			console.log('🛒 点击商品:', item.name, item);
			
			try {
				// 1. 先记录浏览历史（用于实时推荐）
				const historyItem = {
					id: item.id,
					name: item.name,
					price: item.price,
					img: item.img,
					category: item.category,
					subcategory: item.subcategory,
					tags: item.tags || []
				};
				
				// 记录到浏览历史
				const BrowsingHistory = (await import('@/utils/browsing-history.js')).default;
				BrowsingHistory.addProduct(historyItem);
				console.log('📖 商品浏览记录已保存:', item.name);
				
				// 2. 实时更新推荐商品（异步执行，不阻塞跳转）
				this.updateRecommendationsRealtime(item);
				
				// 3. 跳转到商品详情页
				let goodsUrl = '/pages/GoodsDetails/GoodsDetails';
				if (item && item.id) {
					goodsUrl += `?id=${item.id}`;
				}
				uni.navigateTo({
					url: goodsUrl,
					animationType: 'zoom-fade-out',
					animationDuration: 200
				});
				
			} catch (error) {
				console.error('❌ 商品点击处理失败:', error);
				// 即使出错也要跳转
				let goodsUrl = '/pages/GoodsDetails/GoodsDetails';
				if (item && item.id) {
					goodsUrl += `?id=${item.id}`;
				}
				uni.navigateTo({
					url: goodsUrl,
					animationType: 'zoom-fade-out',
					animationDuration: 200
				});
			}
		},

		// 实时更新推荐商品
		async updateRecommendationsRealtime(clickedItem) {
			try {
				console.log('🔄 开始实时更新推荐商品...');
				
				// 异步执行，不阻塞UI
				setTimeout(async () => {
					try {
						// 获取基于新浏览记录的推荐，传入实时上下文
						const updatedRecommendations = await RecommendationService.getPersonalizedRecommendations(20, clickedItem);
						
						if (updatedRecommendations && updatedRecommendations.length > 0) {
							// 过滤掉刚点击的商品（避免重复推荐）
							const filteredRecommendations = updatedRecommendations.filter(product => 
								product.id !== clickedItem.id
							);
							
							// 如果过滤后商品不足，补充一些新商品
							if (filteredRecommendations.length < 15) {
								try {
									const additionalProducts = await this.getAdditionalProducts(filteredRecommendations.length);
									filteredRecommendations.push(...additionalProducts);
								} catch (error) {
									console.warn('⚠️ 获取补充商品失败:', error);
								}
							}
							
							// 更新推荐商品列表
							this.goodsList = filteredRecommendations.slice(0, 20);
							
							// 更新推荐统计信息
							const hasPersonalizedItems = filteredRecommendations.some(p => 
								p.reason && !['精选推荐', '热销推荐', '好评推荐'].includes(p.reason)
							);
							this.showPersonalizedHint = hasPersonalizedItems;
							
							const reasons = this.getRecommendationReasons(filteredRecommendations);
							this.recommendationStats = {
								total: filteredRecommendations.length,
								reasons: reasons
							};
							
							// 强制更新UI
							this.$forceUpdate();
							
							console.log('✅ 实时推荐更新成功:', filteredRecommendations.length, '个商品');
							console.log('🎯 新推荐原因分布:', reasons);
							
							// 显示推荐更新提示
							if (hasPersonalizedItems) {
								uni.showToast({
									title: '已为您刷新推荐',
									icon: 'none',
									duration: 1500
								});
							}
						}
					} catch (error) {
						console.error('❌ 实时推荐更新失败:', error);
					}
				}, 300); // 300ms后执行，确保跳转动画流畅
				
			} catch (error) {
				console.error('❌ 启动实时推荐更新失败:', error);
			}
		},

		// 获取补充商品（当推荐商品不足时）
		async getAdditionalProducts(currentCount) {
			try {
				const response = await api.product.getProducts({
					limit: 20 - currentCount,
					offset: Math.floor(Math.random() * 50) // 随机偏移，增加多样性
				});
				
				if (response && response.success && response.data && response.data.products) {
					return response.data.products.map(product => 
						api.transformers.productToFrontend(product)
					);
				}
				return [];
			} catch (error) {
				console.error('❌ 获取补充商品失败:', error);
				return [];
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

/* 个性化推荐提示样式 */
.recommend-hint {
  margin-top: 10rpx;
  text-align: center;
  
  .hint-text {
    font-size: 24rpx;
    color: #ff6b3d;
    background: linear-gradient(135deg, #ff6b3d, #ff8f4d);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 500;
    padding: 8rpx 16rpx;
    border-radius: 20rpx;
    background-color: rgba(255, 107, 61, 0.1);
    border: 1rpx solid rgba(255, 107, 61, 0.2);
  }
}

/* 推荐统计信息样式 */
.recommend-stats {
  margin-top: 15rpx;
  text-align: center;
  
  .stats-text {
    font-size: 26rpx;
    color: #666;
    margin-bottom: 10rpx;
  }
  
  .stats-reasons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8rpx;
    
    .reason-tag {
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
      border: 1rpx solid #dee2e6;
      border-radius: 15rpx;
      padding: 4rpx 12rpx;
      
      text {
        font-size: 22rpx;
        color: #495057;
      }
    }
  }
}

/* 优化加载状态样式 */
.loading-state {
  padding: 60rpx 40rpx;
  text-align: center;
  
  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .loading-spinner {
      width: 60rpx;
      height: 60rpx;
      border: 4rpx solid #f3f3f3;
      border-top: 4rpx solid #fe3b0f;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20rpx;
    }
    
    .loading-text {
      font-size: 28rpx;
      color: #666;
      margin-bottom: 20rpx;
    }
    
    .loading-progress {
      width: 200rpx;
      height: 6rpx;
      background: #f0f0f0;
      border-radius: 3rpx;
      overflow: hidden;
      
      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #fe3b0f, #ff6b3d);
        border-radius: 3rpx;
        transition: width 0.3s ease;
      }
    }
  }
}

/* 空状态样式 */
.empty-state {
  padding: 80rpx 40rpx;
  text-align: center;
  
  .empty-content {
    .empty-icon {
      font-size: 80rpx;
      margin-bottom: 20rpx;
    }
    
    .empty-title {
      font-size: 32rpx;
      color: #333;
      margin-bottom: 10rpx;
      display: block;
    }
    
    .empty-desc {
      font-size: 26rpx;
      color: #999;
      margin-bottom: 30rpx;
      display: block;
    }
    
    .empty-actions {
      .retry-btn {
        background: linear-gradient(135deg, #fe3b0f, #ff6b3d);
        color: white;
        border: none;
        border-radius: 25rpx;
        padding: 12rpx 30rpx;
        font-size: 28rpx;
      }
    }
  }
}

/* 错误状态样式 */
.error-state {
  padding: 80rpx 40rpx;
  text-align: center;
  
  .error-content {
    .error-icon {
      font-size: 80rpx;
      margin-bottom: 20rpx;
    }
    
    .error-title {
      font-size: 32rpx;
      color: #e74c3c;
      margin-bottom: 10rpx;
      display: block;
    }
    
    .error-desc {
      font-size: 26rpx;
      color: #999;
      margin-bottom: 30rpx;
      display: block;
    }
    
    .error-actions {
      .retry-btn {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
        border: none;
        border-radius: 25rpx;
        padding: 12rpx 30rpx;
        font-size: 28rpx;
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 新品推荐样式优化 */
.new-product {
  .goods-list {
    .list {
      position: relative;
      
      .pictrue {
        position: relative;
        
        .new-badge {
          position: absolute;
          top: 8rpx;
          right: 8rpx;
          background: linear-gradient(135deg, #ff6b3d, #ff8f4d);
          color: white;
          font-size: 20rpx;
          padding: 4rpx 8rpx;
          border-radius: 8rpx;
          font-weight: 600;
          z-index: 2;
          box-shadow: 0 2rpx 4rpx rgba(255, 107, 61, 0.3);
        }
      }
    }
  }
}

/* 新品加载状态 */
.new-products-loading {
  padding: 40rpx;
  text-align: center;
  
  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .loading-spinner {
      width: 40rpx;
      height: 40rpx;
      border: 3rpx solid #f3f3f3;
      border-top: 3rpx solid #fe3b0f;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 15rpx;
    }
    
    text {
      font-size: 24rpx;
      color: #999;
    }
  }
}
</style>
