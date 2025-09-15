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
				
				<!-- 瀑布流商品展示 -->
				<WaterfallFlow 
					v-if="waterfallGoodsList.length > 0"
					:dataList="waterfallGoodsList"
					:showLoadMore="true"
					:isLoading="isLoadingMore"
					:hasMore="hasMoreProducts"
					:loadMoreText="loadMoreText"
					@item-click="onGoodsClick"
					@load-more="onLoadMoreProducts"
				/>
				
				<!-- 加载状态 -->
				<view class="loading-state" v-else-if="loading">
					<text>正在加载商品...</text>
				</view>
				<!-- 空状态 -->
				<view class="empty-state" v-else>
					<text>暂无商品数据</text>
				</view>
			</view>
		</view>
    </mescroll-body>
    <ClassifyData 
			v-show="classifyShow!=0" 
			:categoryProducts="categoryProducts"
			:categoryLoading="categoryLoading"
			:currentCategoryId="currentCategoryId"
			:selectedCategory="classList[classifyShow]"
		></ClassifyData>
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
// 导入配置模块
import ENV_CONFIG from '../../config/env.js';
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
      // 上拉加载的配置
      upOption: {
        use: true,
        auto: false, // 不自动加载
        page: {
          num: 0, // 当前页码,默认0,回调之前会加1,即callback(page)会从1开始
          size: 6 // 每页数据的数量改为6个，确保是偶数
        },
        noMoreSize: 5,
        // 完全隐藏mescroll的UI，只使用其滚动检测功能
        textLoading: '', // 不显示加载文本
        textNoMore: '', // 不显示无更多数据文本
        bgColor: 'transparent', // 透明背景
        textColor: 'transparent', // 透明文字
        inOffsetRate: 1, // 减小触发距离
        outOffsetRate: 1,
        showLoading: false, // 不显示加载动画
        showNoMore: false, // 不显示无更多数据
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
			// 瀑布流推荐商品数据
			waterfallGoodsList: [],
			classifyShow: 0,
			// 页面高度
			pageHeight: 500,
			// 加载状态
			loading: false,
			// 无限滚动相关
			isLoadingMore: false,
			hasMoreProducts: true,
			currentPage: 1,
			pageSize: 6, // 改为6个，确保是偶数
			loadMoreText: '正在加载中...',
			// 实时推荐相关
			isRealtimeRecommending: false,
			lastClickedProduct: null,
			realtimeRecommendationCount: 0,
			// 分类相关
			currentCategoryId: null,
			categoryProducts: [],
			categoryLoading: false,
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
	
	// 页面卸载时清理
	onUnload() {
		console.log('首页onUnload执行，清理资源');
		this.cleanup();
	},
	
	// Vue组件销毁前清理
	beforeDestroy() {
		console.log('首页beforeDestroy执行，清理资源');
		this.cleanup();
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
      console.log('下拉刷新回调');
      if (this.mescroll && !this._isDestroyed) {
        // 重新加载数据
        this.loadPageData().finally(() => {
          this.mescroll && this.mescroll.endSuccess();
        });
      }
    },
    /*上拉加载的回调*/
    upCallback(page) {
      console.log('📖 上拉加载回调，页码:', page.num);
      if (this.mescroll && !this._isDestroyed) {
        this.loadMoreProducts(page);
      }
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
		async onClassify(item, index){
			console.log('🏷️ 分类点击:', item, '索引:', index);
			console.log('🔍 完整classList数据:', this.classList);
			console.log('🔍 当前点击的分类详情:', JSON.stringify(item, null, 2));
			
			// 更新选中状态
			this.classifyShow = index;
			
			// 如果点击的是首页（index为0），不需要加载分类商品
			if (index === 0) {
				this.currentCategoryId = null;
				this.categoryProducts = [];
				console.log('🏠 回到首页，清空分类商品，显示推荐商品');
				return;
			}
			
			// 如果分类有ID，加载该分类的商品
			if (item && item.id) {
				this.currentCategoryId = item.id;
				console.log('📦 开始加载分类商品，分类ID:', item.id, '分类名称:', item.name);
				
				// 显示加载提示
				uni.showToast({
					title: `正在加载${item.name}商品...`,
					icon: 'loading',
					duration: 2000
				});
				
				await this.loadCategoryProducts(item.id, item.name);
			} else {
				console.warn('⚠️ 分类缺少ID信息:', item);
				console.warn('⚠️ 可能的原因: API返回的分类数据格式不正确或分类没有ID字段');
				uni.showToast({
					title: '分类信息异常',
					icon: 'error'
				});
				
				// 使用备用方案，根据分类名称加载默认商品
				if (item && item.name) {
					console.log('🔄 使用备用方案，根据分类名称加载默认商品');
					this.setDefaultCategoryProducts(item.name);
				}
			}
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
					console.log('🚀 开始跳转商品详情页');
					console.log('📦 接收到的数据:', data);
					
					let goodsUrl = '/pages/GoodsDetails/GoodsDetails';
					if (data && data.id) {
						goodsUrl += `?id=${data.id}`;
						console.log('🔍 跳转商品详情页:', goodsUrl);
						console.log('📋 完整商品数据:', JSON.stringify(data, null, 2));
					} else {
						console.error('❌ 商品数据或ID缺失:', data);
						uni.showToast({
							title: '商品数据异常',
							icon: 'error'
						});
						return;
					}
					
					console.log('🔄 执行页面跳转...');
					uni.navigateTo({
						url: goodsUrl,
						animationType: 'zoom-fade-out',
						animationDuration: 200,
						success: () => {
							console.log('✅ 页面跳转成功');
						},
						fail: (error) => {
							console.error('❌ 页面跳转失败:', error);
							uni.showToast({
								title: '页面跳转失败',
								icon: 'error'
							});
						}
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
			if (this._isDestroyed) {
				console.log('⚠️ 组件已销毁，停止API连通性测试');
				throw new Error('组件已销毁');
			}
			
			try {
				console.log('🔗 测试API连通性...');
				// 从配置模块获取API地址
				const apiBaseUrl = ENV_CONFIG.SERVER_URL
				console.log('📍 当前API地址:', `${apiBaseUrl}/api`);
				
				// 使用Promise封装uni.request以获得更好的错误处理
				const testResponse = await new Promise((resolve, reject) => {
					uni.request({
						url: `${apiBaseUrl}/health`,
						method: 'GET',
						timeout: 10000,
						success: (res) => {
							console.log('📡 uni.request成功响应:', res);
							resolve(res);
						},
						fail: (error) => {
							console.error('📡 uni.request失败:', error);
							reject(new Error(`网络请求失败: ${error.errMsg || 'unknown error'}`));
						}
					});
				});
				
				console.log('🌐 API连通性测试结果:', testResponse);
				
				if (testResponse.statusCode === 200) {
					console.log('✅ API连接正常');
					console.log('📊 API响应数据:', JSON.stringify(testResponse.data, null, 2));
					return testResponse.data;
				} else {
					throw new Error(`API服务器响应异常: HTTP ${testResponse.statusCode}`);
				}
			} catch (error) {
				console.error('❌ API连通性测试失败:', error);
				let errorMessage = error.message || 'unknown error';
				
				if (errorMessage.includes('网络未连接') || errorMessage.includes('fail')) {
					errorMessage = '网络连接失败，请检查：\n1. 手机和电脑是否在同一WiFi网络\n2. 网络连接是否正常\n3. 服务器地址是否正确';
				} else if (errorMessage.includes('timeout')) {
					errorMessage = '连接超时，请检查：\n1. 后端服务是否启动(npm start)\n2. 服务器地址是否正确\n3. 防火墙设置';
				}
				
				throw new Error(errorMessage);
			}
		},

		// 加载首页分类和导航数据
		async loadHomepageCategories() {
			// 防止组件销毁后执行
			if (this._isDestroyed) {
				console.log('⚠️ 组件已销毁，停止加载分类数据');
				return;
			}
			
			try {
				console.log('🔄 开始加载首页分类数据...');
				// 从配置模块获取API地址
				const apiBaseUrl = ENV_CONFIG.BASE_URL
				console.log('🌐 API基础URL:', apiBaseUrl);
				
				// 直接使用uni.request获取分类数据
				const response = await new Promise((resolve, reject) => {
					uni.request({
						url: `${apiBaseUrl}/categories/homepage`,
						method: 'GET',
						timeout: 10000,
						success: (res) => {
							console.log('📡 分类API原始响应:', res);
							resolve(res);
						},
						fail: (error) => {
							console.error('📡 分类API请求失败:', error);
							reject(new Error(`获取分类失败: ${error.errMsg || 'unknown error'}`));
						}
					});
				});
				
				console.log('📡 完整API响应:', JSON.stringify(response, null, 2));
				
				// 再次检查组件是否已销毁
				if (this._isDestroyed) {
					console.log('⚠️ 组件已销毁，停止处理分类数据');
					return;
				}
				
				if (response.statusCode === 200 && response.data && response.data.success && response.data.data && response.data.data.categories) {
					const categories = response.data.data.categories;
					console.log('✅ 获取到分类数据:', categories.length, '个分类');
					console.log('📦 分类详细数据:', JSON.stringify(categories, null, 2));
					
					// 检查每个分类的homeDisplay配置
					categories.forEach((category, index) => {
						console.log(`🏷️  分类${index + 1}: ${category.name}`, {
							showOnHome: category.homeDisplay && category.homeDisplay.showOnHome,
							homeTitle: category.homeDisplay && category.homeDisplay.homeTitle,
							homeOrder: category.homeDisplay && category.homeDisplay.homeOrder
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
						// 手动转换导航数据 (9宫格导航)
						const navData = homeCategories.slice(0, 10).map((category, index) => ({
							id: category._id || category.id,
							name: (category.homeDisplay && category.homeDisplay.homeTitle) || category.name,
							icon: category.icon || `/static/nav/nav_ico${(index % 10) + 1}.png`
						}));
						console.log('🧭 转换后的导航数据:', navData);
						this.$set(this, 'navList', navData);
						
						// 手动转换分类标签 (顶部横向滚动标签)
						const newClassList = [
							{ id: 0, name: '首页' },
							...homeCategories.slice(0, 7).map((category, index) => ({
								id: category._id || category.id,
								name: (category.homeDisplay && category.homeDisplay.homeTitle) || category.name
							}))
						];
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
			// 防止组件销毁后执行
			if (this._isDestroyed) {
				console.log('⚠️ 组件已销毁，停止加载商品数据');
				return;
			}
			
			try {
				console.log('🛒 开始加载推荐商品数据...');
				
				// 直接使用uni.request获取商品数据，初始加载6个商品（偶数）
				// 从配置模块获取API地址
				const apiBaseUrl = ENV_CONFIG.BASE_URL
				
				const response = await new Promise((resolve, reject) => {
					uni.request({
						url: `${apiBaseUrl}/products`,
						method: 'GET',
						data: {
							limit: 6, // 初始加载6个商品，确保偶数
							page: 1
						},
						timeout: 10000,
						success: (res) => {
							console.log('📦 商品API原始响应:', res);
							resolve(res);
						},
						fail: (error) => {
							console.error('📦 商品API请求失败:', error);
							reject(new Error(`获取商品失败: ${error.errMsg || 'unknown error'}`));
						}
					});
				});
				
				// 再次检查组件是否已销毁
				if (this._isDestroyed) {
					console.log('⚠️ 组件已销毁，停止处理商品数据');
					return;
				}
				
				if (response.statusCode === 200 && response.data && response.data.success && response.data.data && response.data.data.products) {
					let products = response.data.data.products;
					console.log('📦 获取到商品数据:', products.length, '个商品');
					
					// 确保商品数量为偶数
					if (products.length % 2 !== 0) {
						products = products.slice(0, products.length - 1);
						console.log('🔧 调整为偶数商品:', products.length, '个');
					}
					
					// 转换商品数据格式为瀑布流格式
					const waterfallProducts = products.map((product, index) => ({
						id: product._id || product.id,
						name: product.name,
						price: product.price,
						vip_price: product.memberPrice || (product.price * 0.8).toFixed(2),
						img: this.getProductImage(product),
						is_goods: product.isFeatured ? 1 : 0,
						sales: product.sales?.totalSold || Math.floor(Math.random() * 1000),
						rating: product.rating?.average || (4 + Math.random()).toFixed(1)
					}));
					
					// 更新瀑布流数据
					this.waterfallGoodsList = waterfallProducts;
					this.$forceUpdate();
					
					console.log('✅ 瀑布流商品数据加载成功:', waterfallProducts.length, '个商品');
					console.log('🔢 商品数量是否为偶数:', waterfallProducts.length % 2 === 0 ? '✅是' : '❌否');
					console.log('🔍 瀑布流商品数据预览:', waterfallProducts.slice(0, 2));
				} else {
					console.warn('⚠️ 无法获取商品数据');
					console.log('📊 API响应详情:', JSON.stringify(response, null, 2));
					
					// 使用默认商品数据作为备选方案
					this.setDefaultProductData();
				}
			} catch (error) {
				if (!this._isDestroyed) {
					console.error('❌ 加载推荐商品失败:', error);
					// 使用默认商品数据作为备选方案
					this.setDefaultProductData();
				}
			}
		},

		// 设置默认导航数据
		setDefaultNavigationData() {
			console.log('设置默认导航数据');
			
			// 使用真实的分类ID作为默认数据
			const defaultNavList = [
				{ id: '68b039423b0bc493f4cc4aa3', name: '手机专区' },
				{ id: '68b039423b0bc493f4cc4aac', name: '潮牌男装' },
				{ id: '68b039423b0bc493f4cc4aab', name: '运动男装' },
				{ id: '68b039423b0bc493f4cc4aa4', name: '时尚背包' },
				{ id: '68b039423b0bc493f4cc4aa5', name: '台式电脑' },
				{ id: '68b039423b0bc493f4cc4aa7', name: '珠宝首饰' },
				{ id: '68b039423b0bc493f4cc4aa6', name: '美颜美妆' },
				{ id: '68b039423b0bc493f4cc4aa8', name: '家用电器' },
				{ id: '68b039423b0bc493f4cc4aa9', name: '洗护用品' },
				{ id: '68b039423b0bc493f4cc4aaa', name: '女装' }
			];
			
			// 使用真实的分类ID作为默认分类标签数据
			const defaultClassList = [
				{ id: 0, name: '首页' },
				{ id: '68b039423b0bc493f4cc4aa3', name: '手机专区' },
				{ id: '68b039423b0bc493f4cc4aac', name: '潮牌男装' },
				{ id: '68b039423b0bc493f4cc4aa4', name: '时尚背包' },
				{ id: '68b039423b0bc493f4cc4aa5', name: '台式电脑' },
				{ id: '68b039423b0bc493f4cc4aa7', name: '珠宝首饰' },
				{ id: '68b039423b0bc493f4cc4aa6', name: '美颜美妆' },
				{ id: '68b039423b0bc493f4cc4aaa', name: '女装' }
			];
			
			this.$set(this, 'navList', defaultNavList);
			this.$set(this, 'classList', defaultClassList);
			
			console.log('默认导航数据设置完成，使用真实分类ID');
			console.log('分类列表:', defaultClassList);
		},
		
		// 设置默认商品数据
		setDefaultProductData() {
			console.log('设置默认商品数据');
			
			// 使用一些真实的后端商品ID作为默认数据
			const realProductIds = [
				'68b039483b0bc493f4cc4aef', // 任天堂 Nintendo Switch OLED
				'68b039483b0bc493f4cc4aee', // 戴森V15 Detect无线吸尘器
				'68b039483b0bc493f4cc4aed', // ZARA女装连衣裙
				'68b039483b0bc493f4cc4aec', // 小米13 Ultra
				'68b039483b0bc493f4cc4aeb', // 耐克 Air Max 270
				'68b039483b0bc493f4cc4aea', // iPhone 15 Pro Max
				'68b039483b0bc493f4cc4ae9', // MacBook Pro M3
				'68b039483b0bc493f4cc4ae8', // AirPods Pro 3
				'68b039483b0bc493f4cc4ae7', // iPad Pro 12.9
				'68b039483b0bc493f4cc4ae6', // Apple Watch Ultra 2
				'68b039483b0bc493f4cc4ae5', // Sony WH-1000XM5
				'68b039483b0bc493f4cc4ae4'  // Tesla Model Y
			];
			
			// 使用现有的goodsList数据转换为瀑布流格式，初始显示前6个商品（偶数）
			const defaultWaterfallProducts = this.goodsList.slice(0, 6).map((product, index) => ({
				id: realProductIds[index] || `68b039483b0bc493f4cc4ae${index}`, // 使用真实的MongoDB ObjectId格式
				name: product.name,
				price: product.price,
				vip_price: product.vip_price,
				img: product.img,
				is_goods: product.is_goods,
				sales: Math.floor(Math.random() * 1000),
				rating: (4 + Math.random()).toFixed(1)
			}));
			
			this.waterfallGoodsList = defaultWaterfallProducts;
			this.$forceUpdate();
			
			console.log('默认商品数据设置完成，商品数量:', defaultWaterfallProducts.length);
			console.log('默认商品ID列表:', defaultWaterfallProducts.map(p => p.id));
			console.log('📖 无限滚动设置: 初始显示6个商品，每次加载6个，确保左右两列平衡');
		},
		
		// 获取商品图片
		getProductImage(product) {
			if (product.images) {
				// 如果images是数组
				if (Array.isArray(product.images) && product.images.length > 0) {
					return product.images[0];
				}
				// 如果images是字符串
				if (typeof product.images === 'string' && product.images.trim() !== '') {
					return product.images;
				}
			}
			// 使用默认图片
			return '/static/img/goods_thumb_01.png';
		},
		
		// 瀑布流商品点击事件
		async onGoodsClick(item) {
			console.log('🛒 瀑布流商品点击:', item);
			console.log('🔍 商品ID:', item.id);
			console.log('🔍 商品名称:', item.name);
			
			if (!item.id) {
				console.error('❌ 商品ID缺失，无法跳转');
				uni.showToast({
					title: '商品ID缺失',
					icon: 'error'
				});
				return;
			}
			
			// 记录点击的商品信息，用于实时推荐
			this.lastClickedProduct = item;
			
			// 如果点击的是推荐商品，记录统计信息
			if (item.isRecommended) {
				console.log('📊 用户点击了推荐商品:', item.name);
				console.log('🔍 推荐商品ID:', item.id);
				console.log('📋 原始ID:', item.originalId);
			}
			
			// 触发实时推荐（异步执行，不阻塞页面跳转）
			this.triggerRealtimeRecommendation(item);
			
			// 跳转到商品详情页
			this.onSkip('goods', item);
		},
		
		// 瀑布流加载更多事件
		onLoadMoreProducts() {
			console.log('🔄 瀑布流触发加载更多');
			// 这个方法由瀑布流组件触发，但实际加载由mescroll控制
		},
		
		// 加载更多商品数据
		async loadMoreProducts(page) {
			if (this._isDestroyed) {
				console.log('⚠️ 组件已销毁，停止加载更多');
				return;
			}
			
			try {
				this.isLoadingMore = true;
				console.log('🔄 开始加载第', page.num, '页商品数据...');
				
				// 从配置模块获取API地址
				const apiBaseUrl = ENV_CONFIG.BASE_URL
				
				// 从后端API获取更多商品数据
				const response = await new Promise((resolve, reject) => {
					uni.request({
						url: `${apiBaseUrl}/products`,
						method: 'GET',
						data: {
							limit: 6, // 每次加载6个商品，确保偶数
							page: page.num
						},
						timeout: 10000,
						success: (res) => {
							console.log('📦 加载更多商品API响应:', res);
							resolve(res);
						},
						fail: (error) => {
							console.error('📦 加载更多商品API失败:', error);
							reject(new Error(`获取更多商品失败: ${error.errMsg || 'unknown error'}`));
						}
					});
				});
				
				if (response.statusCode === 200 && response.data && response.data.success && response.data.data && response.data.data.products) {
					let products = response.data.data.products;
					console.log('📦 获取到更多商品数据:', products.length, '个商品');
					
					// 检查是否还有更多数据
					const hasMoreFromAPI = response.data.data.hasMore !== undefined ? response.data.data.hasMore : products.length >= 6;
					
					// 确保商品数量为偶数
					if (products.length % 2 !== 0 && products.length > 0) {
						products = products.slice(0, products.length - 1);
						console.log('🔧 调整为偶数商品:', products.length, '个');
					}
					
					if (products.length > 0) {
						// 转换商品数据格式为瀑布流格式
						const newWaterfallProducts = products.map((product, index) => ({
							id: product._id || product.id,
							name: product.name,
							price: product.price,
							vip_price: product.memberPrice || (product.price * 0.8).toFixed(2),
							img: this.getProductImage(product),
							is_goods: product.isFeatured ? 1 : 0,
							sales: product.sales?.totalSold || Math.floor(Math.random() * 1000),
							rating: product.rating?.average || (4 + Math.random()).toFixed(1)
						}));
						
						// 添加到现有商品列表
						this.waterfallGoodsList = [...this.waterfallGoodsList, ...newWaterfallProducts];
						
						console.log('✅ 加载更多商品成功:', newWaterfallProducts.length, '个');
						console.log('📊 当前总商品数:', this.waterfallGoodsList.length);
						console.log('🔢 商品数量是否为偶数:', this.waterfallGoodsList.length % 2 === 0 ? '✅是' : '❌否');
						
						// 检查是否还有更多数据
						if (!hasMoreFromAPI || products.length < 6) {
							console.log('🏁 数据加载完毕，没有更多商品了');
							this.hasMoreProducts = false;
						}
						
						// 通知mescroll加载完成
						if (this.mescroll) {
							this.mescroll.endByPage(newWaterfallProducts.length, 6);
						}
					} else {
						// 没有更多数据
						console.log('📄 API返回空数据，没有更多商品了');
						this.hasMoreProducts = false;
						
						if (this.mescroll) {
							this.mescroll.endByPage(0, 6);
						}
					}
				} else {
					// API响应格式异常，尝试生成备用数据
					console.warn('⚠️ API响应异常，使用备用数据');
					
					// 限制备用数据的页数，避免无限生成
					if (page.num <= 5) { // 最多生成5页备用数据
						const backupProducts = this.generateEvenProducts(page.num, 6);
						
						if (backupProducts.length > 0) {
							this.waterfallGoodsList = [...this.waterfallGoodsList, ...backupProducts];
							
							// 如果已经是第5页备用数据，标记为没有更多
							if (page.num >= 5) {
								console.log('🏁 备用数据已达上限，没有更多了');
								this.hasMoreProducts = false;
							}
							
							if (this.mescroll) {
								this.mescroll.endByPage(backupProducts.length, 6);
							}
						} else {
							this.hasMoreProducts = false;
							if (this.mescroll) {
								this.mescroll.endByPage(0, 6);
							}
						}
					} else {
						console.log('🏁 备用数据页数已达上限，没有更多了');
						this.hasMoreProducts = false;
						if (this.mescroll) {
							this.mescroll.endByPage(0, 6);
						}
					}
				}
			} catch (error) {
				console.error('❌ 加载更多商品失败:', error);
				
				// 错误时尝试使用备用数据
				try {
					// 限制备用数据的页数
					if (page.num <= 5) {
						const backupProducts = this.generateEvenProducts(page.num, 6);
						if (backupProducts.length > 0) {
							this.waterfallGoodsList = [...this.waterfallGoodsList, ...backupProducts];
							console.log('🔄 使用备用数据:', backupProducts.length, '个商品');
							
							// 如果已经是第5页备用数据，标记为没有更多
							if (page.num >= 5) {
								console.log('🏁 备用数据已达上限（错误处理），没有更多了');
								this.hasMoreProducts = false;
							}
							
							if (this.mescroll) {
								this.mescroll.endByPage(backupProducts.length, 6);
							}
						} else {
							this.hasMoreProducts = false;
							if (this.mescroll) {
								this.mescroll.endByPage(0, 6);
							}
						}
					} else {
						console.log('🏁 备用数据页数已达上限（错误处理），没有更多了');
						this.hasMoreProducts = false;
						if (this.mescroll) {
							this.mescroll.endByPage(0, 6);
						}
					}
				} catch (backupError) {
					console.error('❌ 备用数据也失败:', backupError);
					this.hasMoreProducts = false;
					if (this.mescroll) {
						this.mescroll.endByPage(0, 6);
					}
				}
			} finally {
				this.isLoadingMore = false;
			}
		},
		
		// 生成偶数个商品数据
		generateEvenProducts(pageNum, targetCount) {
			// 确保targetCount是偶数
			const evenCount = targetCount % 2 === 0 ? targetCount : targetCount - 1;
			
			if (evenCount <= 0) {
				return [];
			}
			
			const products = [];
			const baseIndex = (pageNum - 1) * evenCount;
			
			// 循环使用goodsList中的商品，生成新的商品数据
			for (let i = 0; i < evenCount; i++) {
				const sourceIndex = (baseIndex + i) % this.goodsList.length;
				const sourceProduct = this.goodsList[sourceIndex];
				
				products.push({
					id: `generated-${pageNum}-${i}-${Date.now()}`,
					name: `${sourceProduct.name} (第${pageNum}页-${i + 1})`,
					price: sourceProduct.price,
					vip_price: sourceProduct.vip_price,
					img: sourceProduct.img,
					is_goods: sourceProduct.is_goods,
					sales: Math.floor(Math.random() * 2000) + 100,
					rating: (3.5 + Math.random() * 1.5).toFixed(1)
				});
			}
			
			console.log(`🎯 生成了${evenCount}个商品 (页码:${pageNum})`);
			return products;
		},
		
		// 触发实时推荐
		async triggerRealtimeRecommendation(clickedItem) {
			if (this.isRealtimeRecommending || this._isDestroyed) {
				console.log('⚠️ 实时推荐正在进行中或组件已销毁，跳过本次推荐');
				return;
			}
			
			try {
				this.isRealtimeRecommending = true;
				console.log('🎯 开始实时推荐，基于商品:', clickedItem.name);
				
				// 延迟一段时间后执行推荐，避免影响页面跳转体验
				setTimeout(async () => {
					if (this._isDestroyed) return;
					
					try {
						await this.loadSimilarProductRecommendations(clickedItem);
					} catch (error) {
						console.error('❌ 实时推荐失败:', error);
					} finally {
						this.isRealtimeRecommending = false;
					}
				}, 1500); // 1.5秒后执行推荐
				
			} catch (error) {
				console.error('❌ 触发实时推荐失败:', error);
				this.isRealtimeRecommending = false;
			}
		},
		
		// 加载相似商品推荐
		async loadSimilarProductRecommendations(clickedItem) {
			if (this._isDestroyed) {
				console.log('⚠️ 组件已销毁，停止相似商品推荐');
				return;
			}
			
			try {
				console.log('🔍 获取相似商品推荐，基于:', clickedItem);
				
				// 从商品名称中提取关键词来判断商品类型
				const productType = this.extractProductType(clickedItem);
				console.log('📝 提取的商品类型:', productType);
				
				// 从配置模块获取API地址
				const apiBaseUrl = ENV_CONFIG.BASE_URL
				
				// 调用后端API获取相似类型的商品
				const response = await new Promise((resolve, reject) => {
					uni.request({
						url: `${apiBaseUrl}/products`,
						method: 'GET',
						data: {
							limit: 6, // 获取6个推荐商品
							page: 1,
							category: productType.category,
							keywords: productType.keywords.join(','),
							excludeId: clickedItem.id // 排除当前点击的商品
						},
						timeout: 10000,
						success: (res) => {
							console.log('🎯 相似商品API响应:', res);
							resolve(res);
						},
						fail: (error) => {
							console.error('🎯 相似商品API失败:', error);
							reject(new Error(`获取相似商品失败: ${error.errMsg || 'unknown error'}`));
						}
					});
				});
				
				if (this._isDestroyed) return;
				
				if (response.statusCode === 200 && response.data && response.data.success && response.data.data && response.data.data.products) {
					let similarProducts = response.data.data.products;
					console.log('🎯 获取到相似商品:', similarProducts.length, '个');
					
					if (similarProducts.length > 0) {
						// 确保商品数量为偶数
						if (similarProducts.length % 2 !== 0) {
							similarProducts = similarProducts.slice(0, similarProducts.length - 1);
						}
						
						// 转换商品数据格式
						const recommendedProducts = similarProducts.map((product, index) => ({
							id: product._id || product.id,
							name: product.name,
							price: product.price,
							vip_price: product.memberPrice || (product.price * 0.8).toFixed(2),
							img: this.getProductImage(product),
							is_goods: product.isFeatured ? 1 : 0,
							sales: product.sales?.totalSold || Math.floor(Math.random() * 1000),
							rating: product.rating?.average || (4 + Math.random()).toFixed(1),
							isRecommended: true, // 标记为推荐商品
							originalId: product._id || product.id // 保存原始ID
						}));
						
						console.log('🎯 API推荐商品ID映射:');
						recommendedProducts.forEach((rec, index) => {
							console.log(`  ${index + 1}. ${rec.name} -> ID: ${rec.id}`);
						});
						
						// 替换瀑布流中的部分商品为推荐商品
						this.replaceWithRecommendedProducts(recommendedProducts, clickedItem);
						
						console.log('✅ 实时推荐完成:', recommendedProducts.length, '个相似商品');
					} else {
						console.log('📄 没有找到相似商品');
					}
				} else {
					// 如果API没有返回相似商品，使用本地算法生成推荐
					console.log('🔄 API无相似商品，使用本地推荐算法');
					this.generateLocalSimilarRecommendations(clickedItem);
				}
			} catch (error) {
				console.error('❌ 加载相似商品推荐失败:', error);
				// 降级到本地推荐算法
				this.generateLocalSimilarRecommendations(clickedItem);
			}
		},
		
		// 从商品信息中提取商品类型
		extractProductType(product) {
			const name = product.name.toLowerCase();
			let category = '其他';
			let keywords = [];
			
			// 服装类
			if (name.includes('衣') || name.includes('装') || name.includes('裙') || name.includes('裤') || name.includes('套装')) {
				category = '服装';
				if (name.includes('女') || name.includes('女装') || name.includes('连衣裙')) {
					keywords.push('女装', '女');
				}
				if (name.includes('男') || name.includes('男装')) {
					keywords.push('男装', '男');
				}
				if (name.includes('t恤') || name.includes('短袖')) {
					keywords.push('T恤', '短袖');
				}
				if (name.includes('长袖') || name.includes('卫衣')) {
					keywords.push('长袖', '卫衣');
				}
			}
			// 电子产品类
			else if (name.includes('手机') || name.includes('iphone') || name.includes('华为') || name.includes('小米')) {
				category = '手机';
				keywords.push('手机', '智能手机');
			}
			else if (name.includes('电脑') || name.includes('笔记本') || name.includes('台式') || name.includes('macbook')) {
				category = '电脑';
				keywords.push('电脑', '笔记本');
			}
			else if (name.includes('耳机') || name.includes('airpods') || name.includes('音响')) {
				category = '数码配件';
				keywords.push('耳机', '音频');
			}
			// 家电类
			else if (name.includes('吸尘器') || name.includes('洗衣机') || name.includes('冰箱')) {
				category = '家电';
				keywords.push('家电', '电器');
			}
			
			// 如果没有匹配到具体分类，从商品名称中提取关键词
			if (category === '其他') {
				const words = name.split(/[\s\u4e00-\u9fff]+/).filter(word => word.length > 1);
				keywords = words.slice(0, 3); // 取前3个关键词
			}
			
			return { category, keywords };
		},
		
		// 替换瀑布流中的商品为推荐商品
		replaceWithRecommendedProducts(recommendedProducts, clickedItem) {
			if (recommendedProducts.length === 0) return;
			
			// 找到当前瀑布流中的商品，排除推荐商品和点击的商品
			const currentProducts = this.waterfallGoodsList.filter(item => 
				!item.isRecommended && item.id !== clickedItem.id
			);
			
			// 计算要替换的数量（不超过推荐商品数量，也不超过当前商品的一半）
			const replaceCount = Math.min(
				recommendedProducts.length,
				Math.floor(currentProducts.length / 2),
				6
			);
			
			if (replaceCount > 0) {
				// 随机选择要替换的位置
				const replaceIndices = [];
				while (replaceIndices.length < replaceCount) {
					const randomIndex = Math.floor(Math.random() * this.waterfallGoodsList.length);
					const item = this.waterfallGoodsList[randomIndex];
					if (!item.isRecommended && item.id !== clickedItem.id && !replaceIndices.includes(randomIndex)) {
						replaceIndices.push(randomIndex);
					}
				}
				
				// 执行替换
				replaceIndices.forEach((index, i) => {
					if (i < recommendedProducts.length) {
						this.$set(this.waterfallGoodsList, index, recommendedProducts[i]);
					}
				});
				
				// 强制更新视图
				this.$forceUpdate();
				
				console.log('🔄 已替换', replaceCount, '个商品为推荐商品');
				this.realtimeRecommendationCount += replaceCount;
			}
		},
		
		// 生成本地相似商品推荐
		generateLocalSimilarRecommendations(clickedItem) {
			try {
				console.log('🏠 使用本地算法生成相似商品推荐');
				
				const productType = this.extractProductType(clickedItem);
				
				// 从现有商品列表中找到相似的商品
				const similarProducts = this.goodsList.filter(item => {
					const itemType = this.extractProductType(item);
					return itemType.category === productType.category || 
						   productType.keywords.some(keyword => 
							   item.name.toLowerCase().includes(keyword.toLowerCase())
						   );
				}).slice(0, 6);
				
				console.log('🔍 找到的相似商品:', similarProducts.length, '个');
				console.log('📝 相似商品列表:', similarProducts.map(p => ({ id: p.id, name: p.name })));
				
				if (similarProducts.length > 0) {
					// 确保偶数
					const evenCount = similarProducts.length % 2 === 0 ? similarProducts.length : similarProducts.length - 1;
					
					// 使用真实的商品ID，确保推荐商品可以正常跳转到详情页
					const realProductIds = [
						'68b039483b0bc493f4cc4aef', // 任天堂 Nintendo Switch OLED
						'68b039483b0bc493f4cc4aee', // 戴森V15 Detect无线吸尘器
						'68b039483b0bc493f4cc4aed', // ZARA女装连衣裙
						'68b039483b0bc493f4cc4aec', // 小米13 Ultra
						'68b039483b0bc493f4cc4aeb', // 耐克 Air Max 270
						'68b039483b0bc493f4cc4aea', // iPhone 15 Pro Max
						'68b039483b0bc493f4cc4ae9', // MacBook Pro M3
						'68b039483b0bc493f4cc4ae8', // AirPods Pro 3
						'68b039483b0bc493f4cc4ae7', // iPad Pro 12.9
						'68b039483b0bc493f4cc4ae6', // Apple Watch Ultra 2
						'68b039483b0bc493f4cc4ae5', // Sony WH-1000XM5
						'68b039483b0bc493f4cc4ae4'  // Tesla Model Y
					];
					
					const recommendedProducts = similarProducts.slice(0, evenCount).map((product, index) => ({
						id: realProductIds[index] || product.id || `68b039483b0bc493f4cc4ae${index}`, // 优先使用真实ID
						name: product.name,
						price: product.price,
						vip_price: product.vip_price,
						img: product.img,
						is_goods: product.is_goods,
						sales: Math.floor(Math.random() * 1000),
						rating: (4 + Math.random()).toFixed(1),
						isRecommended: true,
						originalId: product.id // 保存原始ID，用于调试
					}));
					
					console.log('🎯 生成的推荐商品ID映射:');
					recommendedProducts.forEach((rec, index) => {
						console.log(`  ${index + 1}. ${rec.name} -> ID: ${rec.id} (原始: ${rec.originalId})`);
					});
					
					// 替换商品
					this.replaceWithRecommendedProducts(recommendedProducts, clickedItem);
					
					console.log('✅ 本地推荐完成:', recommendedProducts.length, '个商品');
				}
			} catch (error) {
				console.error('❌ 本地推荐算法失败:', error);
			}
		},
		
		// 加载分类商品数据
		async loadCategoryProducts(categoryId, categoryName) {
			// 防止组件销毁后执行
			if (this._isDestroyed) {
				console.log('⚠️ 组件已销毁，停止加载分类商品');
				return;
			}
			
			try {
				this.categoryLoading = true;
				console.log('🔄 开始加载分类商品数据...');
				console.log('📋 分类ID:', categoryId, '分类名称:', categoryName);
				console.log('📋 分类ID类型:', typeof categoryId);
				
				// 验证分类ID
				if (!categoryId) {
					throw new Error('分类ID为空或未定义');
				}
				
				// 从配置模块获取API地址
				const apiBaseUrl = ENV_CONFIG.BASE_URL;
				const requestUrl = `${apiBaseUrl}/categories/${categoryId}/products`;
				console.log('🌐 请求URL:', requestUrl);
				console.log('🌐 API基础URL:', apiBaseUrl);
				
				// 调用后端API获取分类商品
				const response = await new Promise((resolve, reject) => {
					uni.request({
						url: requestUrl,
						method: 'GET',
						data: {
							limit: 20, // 加载更多商品
							page: 1
						},
						timeout: 10000,
						success: (res) => {
							console.log('📦 分类商品API原始响应:', res);
							console.log('📦 响应状态码:', res.statusCode);
							console.log('📦 响应数据:', JSON.stringify(res.data, null, 2));
							resolve(res);
						},
						fail: (error) => {
							console.error('📦 分类商品API请求失败:', error);
							console.error('📦 请求失败详情:', JSON.stringify(error, null, 2));
							reject(new Error(`获取分类商品失败: ${error.errMsg || 'unknown error'}`));
						}
					});
				});
				
				// 再次检查组件是否已销毁
				if (this._isDestroyed) {
					console.log('⚠️ 组件已销毁，停止处理分类商品数据');
					return;
				}
				
				if (response.statusCode === 200 && response.data && response.data.success && response.data.data && response.data.data.products) {
					const products = response.data.data.products;
					console.log('✅ 获取到分类商品数据:', products.length, '个商品');
					console.log('📋 分类商品详情:', products.slice(0, 2)); // 显示前2个商品的详情
					
					// 转换商品数据格式
					const categoryProducts = products.map((product, index) => ({
						id: product._id || product.id,
						name: product.name,
						description: product.description,
						shortDescription: product.shortDescription,
						price: product.price,
						vip_price: product.memberPrice || (product.price * 0.8).toFixed(2),
						img: this.getProductImage(product),
						is_goods: product.isFeatured ? 1 : 0,
						sales: (product.sales && product.sales.totalSold) || Math.floor(Math.random() * 1000),
						rating: (product.rating && product.rating.average) ? product.rating.average.toFixed(1) : (4 + Math.random()).toFixed(1),
						category: categoryName,
						brand: product.brand,
						stock: product.stock,
						sku: product.sku
					}));
					
					// 更新分类商品数据
					this.categoryProducts = categoryProducts;
					this.$forceUpdate();
					
					console.log('✅ 分类商品数据加载成功:', categoryProducts.length, '个商品');
					console.log('🏷️ 商品所属分类:', categoryName);
					console.log('📦 转换后的商品数据预览:', categoryProducts.slice(0, 1));
					
					// 显示成功提示
					uni.showToast({
						title: `${categoryName}: ${categoryProducts.length}个商品`,
						icon: 'success',
						duration: 2000
					});
				} else {
					console.warn('⚠️ 无法获取分类商品数据');
					console.log('📊 API响应状态码:', response.statusCode);
					console.log('📊 API响应是否成功:', response.data && response.data.success);
					console.log('📊 API响应数据结构:', {
						hasData: !!(response.data && response.data.data),
						hasProducts: !!(response.data && response.data.data && response.data.data.products),
						productCount: response.data && response.data.data && response.data.data.products ? response.data.data.products.length : 0
					});
					
					// 使用默认数据作为备选方案
					this.setDefaultCategoryProducts(categoryName);
				}
			} catch (error) {
				if (!this._isDestroyed) {
					console.error('❌ 加载分类商品失败:', error);
					
					// 显示错误提示
					uni.showToast({
						title: '加载商品失败',
						icon: 'error'
					});
					
					// 使用默认数据作为备选方案
					this.setDefaultCategoryProducts(categoryName);
				}
			} finally {
				if (!this._isDestroyed) {
					this.categoryLoading = false;
				}
			}
		},
		
		// 设置默认分类商品数据
		setDefaultCategoryProducts(categoryName) {
			console.log('🔄 设置默认分类商品数据，分类:', categoryName);
			
			// 根据分类名称筛选相关商品
			let filteredProducts = [];
			const allProducts = this.goodsList;
			
			// 根据分类名称匹配商品
			if (categoryName.includes('手机') || categoryName.includes('iPhone') || categoryName.includes('华为') || categoryName.includes('小米')) {
				filteredProducts = allProducts.filter(product => 
					product.name.toLowerCase().includes('手机') || 
					product.name.toLowerCase().includes('iphone') || 
					product.name.toLowerCase().includes('华为') || 
					product.name.toLowerCase().includes('小米') ||
					product.name.toLowerCase().includes('荣耀')
				);
			} else if (categoryName.includes('男装') || categoryName.includes('服装')) {
				filteredProducts = allProducts.filter(product => 
					product.name.includes('男装') || 
					product.name.includes('男') ||
					product.name.includes('T恤') ||
					product.name.includes('卫衣')
				);
			} else if (categoryName.includes('女装')) {
				filteredProducts = allProducts.filter(product => 
					product.name.includes('女装') || 
					product.name.includes('女') ||
					product.name.includes('连衣裙') ||
					product.name.includes('t恤女')
				);
			} else if (categoryName.includes('电脑') || categoryName.includes('笔记本')) {
				filteredProducts = allProducts.filter(product => 
					product.name.includes('电脑') || 
					product.name.includes('笔记本') ||
					product.name.includes('MacBook') ||
					product.name.includes('戴尔') ||
					product.name.includes('联想')
				);
			} else {
				// 默认选择一些商品
				filteredProducts = allProducts.slice(0, 10);
			}
			
			// 如果没有匹配的商品，使用默认商品
			if (filteredProducts.length === 0) {
				filteredProducts = allProducts.slice(0, 8);
			}
			
			// 转换为标准格式
			const categoryProducts = filteredProducts.map((product, index) => ({
				id: product.id || `default-${categoryName}-${index}`,
				name: product.name,
				price: product.price,
				vip_price: product.vip_price,
				img: product.img,
				is_goods: product.is_goods,
				sales: Math.floor(Math.random() * 1000),
				rating: (4 + Math.random()).toFixed(1),
				category: categoryName
			}));
			
			this.categoryProducts = categoryProducts;
			this.$forceUpdate();
			
			console.log('✅ 默认分类商品数据设置完成:', categoryProducts.length, '个商品');
		},
		
		/**
		 * 显示识别结果
		 */
		showRecognitionResult(data, imagePath) {
			console.log('📋 识别结果数据:', data);
			console.log('📸 图片路径:', imagePath);
			
			if (!data || !data.topResult || !data.topResult.name) {
				uni.showToast({
					title: '未识别出物品',
					icon: 'none',
					duration: 2000
				});
				return;
			}

			const topResult = data.topResult;
			const confidence = (topResult.score * 100).toFixed(1);
			
			// 跳转到识别结果详情页面
			uni.navigateTo({
				url: `/pages/recognition/result?data=${encodeURIComponent(JSON.stringify(data))}&image=${encodeURIComponent(imagePath)}`,
				success: () => {
					console.log('✅ 识别结果页面跳转成功');
				},
				fail: (error) => {
					console.error('❌ 识别结果页面跳转失败:', error);
					uni.showToast({
						title: '页面跳转失败',
						icon: 'error',
						duration: 2000
					});
				}
			});
			
			// 显示成功提示
			uni.showToast({
				title: '识别成功！',
				icon: 'success',
				duration: 1500
			});
		},

		/**
		 * 显示登录提示
		 */
		showLoginPrompt(message = '请先登录后再使用识别功能') {
			uni.showModal({
				title: '需要登录',
				content: message,
				confirmText: '去登录',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm) {
						uni.navigateTo({
							url: '/pages/Login'
						});
					}
				}
			});
		},

		/**
		 * 验证token有效性
		 */
		async validateToken(token) {
			try {
				const result = await api.user.getUserInfo(token);
				console.log('🔍 Token验证结果:', result);
				
				if (result.success && result.data) {
					return true;
				} else {
					// token无效，清除本地存储
					uni.removeStorageSync('token');
					return false;
				}
			} catch (error) {
				console.error('❌ Token验证失败:', error);
				// 如果是401错误，说明token已过期
				if (error.message && error.message.includes('401')) {
					uni.removeStorageSync('token');
				}
				return false;
			}
		},

		/**
		 * 选择图片来源
		 */
		chooseImageSource() {
			return new Promise((resolve) => {
				uni.showActionSheet({
					itemList: ['拍照识别', '从相册选择'],
					success: (res) => {
						resolve(res.tapIndex === 0 ? 'camera' : 'album');
					},
					fail: () => {
						resolve('camera'); // 默认使用相机
					}
				});
			});
		},

		/**
		 * 获取图片
		 */
		getImage(sourceType) {
			return new Promise((resolve, reject) => {
				uni.chooseImage({
					count: 1,
					sourceType: [sourceType === 'camera' ? 'camera' : 'album'],
					sizeType: ['compressed'], // 压缩图片
					success: (res) => {
						console.log('选择图片成功:', res.tempFilePaths[0]);
						resolve(res.tempFilePaths[0]);
					},
					fail: (error) => {
						console.error('选择图片失败:', error);
						reject(new Error('获取图片失败'));
					}
				});
			});
		},

		// 清理资源
		cleanup() {
			console.log('🧹 清理页面资源...');
			// 标记组件已销毁，防止异步操作继续执行
			this._isDestroyed = true;
			
			// 清理可能的定时器
			if (this._loadTimer) {
				clearTimeout(this._loadTimer);
				this._loadTimer = null;
			}
			
			// 清理mescroll实例
			if (this.mescroll) {
				this.mescroll.destroy && this.mescroll.destroy();
			}
			
			console.log('✅ 资源清理完成');
		}
	}
};
</script>

<style scoped lang="scss">
@import 'home.scss';
</style>
