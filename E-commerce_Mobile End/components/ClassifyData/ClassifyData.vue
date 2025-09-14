<template>
	<view class="page-total">
		<!-- 分类列表 -->
		<view class="classify-list">
			<view class="list" @click="onSkip('classify')">
				<view class="thumb"><image src="/static/img/pin_01.png"></image></view>
				<view class="name"><text class="one-omit">小米</text></view>
			</view>
			<view class="list" @click="onSkip('classify')">
				<view class="thumb"><image src="/static/img/pin_02.png"></image></view>
				<view class="name"><text class="one-omit">华为</text></view>
			</view>
			<view class="list" @click="onSkip('classify')">
				<view class="thumb"><image src="/static/img/pin_03.png"></image></view>
				<view class="name"><text class="one-omit">荣耀</text></view>
			</view>
			<view class="list" @click="onSkip('classify')">
				<view class="thumb"><image src="/static/img/pin_04.png"></image></view>
				<view class="name"><text class="one-omit">iPhone</text></view>
			</view>
			<view class="list" @click="onSkip('classify')">
				<view class="thumb"><image src="/static/img/pin_05.png"></image></view>
				<view class="name"><text class="one-omit">vivo</text></view>
			</view>
		</view>
		
		<!-- 分类商品加载状态 -->
		<view class="loading-state" v-if="categoryLoading">
			<view class="loading-content">
				<text>正在加载{{(selectedCategory && selectedCategory.name) || '分类'}}商品...</text>
			</view>
		</view>
		
		<!-- 分类商品展示区域 -->
		<view v-else-if="categoryProducts && categoryProducts.length > 0">
			<!-- 分类标题 -->
			<view class="category-header">
				<view class="category-title">
					<text class="iconfont icon-zhizi"></text>
					<text class="title">{{(selectedCategory && selectedCategory.name) || '分类商品'}}</text>
					<text class="count">({{categoryProducts.length}}件商品)</text>
				</view>
			</view>
			
			<!-- 分类商品列表 -->
			<view class="category-goods-list">
				<view class="list" v-for="(item, index) in categoryProducts" @click="onSkip('goods', item)" :key="index">
					<view class="pictrue">
						<image :src="item.img" mode="heightFix"></image>
						<view class="tag" v-if="item.is_goods === 1">特价</view>
					</view>
					<view class="content">
						<view class="title">
							<text class="two-omit">{{item.name}}</text>
						</view>
						<view class="rating-sales">
							<view class="rating">
								<text class="iconfont icon-xingxing"></text>
								<text>{{item.rating || '4.8'}}</text>
							</view>
							<view class="sales">
								<text>已售{{item.sales || 0}}件</text>
							</view>
						</view>
						<view class="price-info">
							<view class="user-price">
								<text class="symbol">￥</text>
								<text class="price">{{item.price}}</text>
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
		
		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<view class="empty-content">
				<image src="/static/img/empty.png" mode="aspectFit"></image>
				<text>该分类暂无商品</text>
				<text class="tip">换个分类看看吧~</text>
			</view>
		</view>
		
		<!-- 默认商品展示（备用方案） -->
		<view class="default-products" v-if="!categoryLoading && (!categoryProducts || categoryProducts.length === 0)">
			<!-- 超值爆款 -->
			<view class="super-hot-style">
				<view class="hot-title">
					<view class="iconfont icon-zhizi"></view>
					<view class="title">超值爆款</view>
				</view>
				<view class="goods-list">
					<view class="list" v-for="(item, index) in classGoodsList" @click="onSkip('goods', item)" :key="index">
						<view class="thumb">
							<image :src="item.img" mode="widthFix"></image>
						</view>
						<view class="title"><text class="one-omit">{{item.name}}</text></view>
						<view class="price">
							<view class="retail-price">
								<text class="min">￥</text>
								<text class="max">{{item.price}}</text>
							</view>
							<view class="sales-volume">已售4件</view>
						</view>
					</view>
				</view>
			</view>
			<!-- 更多热卖 -->
			<view class="more-hot">
				<view class="hot-title">
					<view class="title">
						<text class="iconfont icon-xiedian"></text>
						<text class="icon">更多热卖</text>
						<text class="iconfont icon-xiedian"></text>
					</view>
				</view>
				<view class="goods-list">
					<view class="list" v-for="(item,index) in goodsList" @click="onSkip('goods', item)" :key="index">
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
	</view>
</template>

<script>
export default {
	props: {
		// 分类商品数据
		categoryProducts: {
			type: Array,
			default: () => []
		},
		// 分类加载状态
		categoryLoading: {
			type: Boolean,
			default: false
		},
		// 当前分类ID
		currentCategoryId: {
			type: [String, Number],
			default: null
		},
		// 选中的分类信息
		selectedCategory: {
			type: Object,
			default: () => null
		}
	},
	data() {
		return {
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
				},{
					id: 1,
					name: '同仁堂美白祛斑霜套装 淡斑美白祛黄提亮补水保湿套装 男女士护肤美白化妆品套装',
					price: '288.00',
					vip_price: '282.00',
					img: '/static/img/goods_thumb_19.png',
					is_goods: 0,
				},{
					id: 1,
					name: '【限定款·雕花口红8支礼盒装】中国风口红套装七夕礼物送女朋友老婆生日礼物唇膏唇釉花仙西子同心锁口红 【限定款8支雕花口红】',
					price: '188.00',
					vip_price: '99.00',
					img: '/static/img/goods_thumb_20.png',
					is_goods: 0,
				},
			],
			classGoodsList: [
				{
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
				},
			]
		};
	},
	methods:{
		/**
		 * 跳转点击
		 * @param {String} type 跳转类型
		 * @param {Object} data 商品数据
		 */
		onSkip(type, data = null){
			switch (type){
				case 'classify':
					uni.navigateTo({
						url: '/pages/SearchGoodsList/SearchGoodsList',
					})
					break;
				case 'goods':
					// 跳转到商品详情页，传递商品ID
					console.log('🛒 分类商品点击:', data);
					console.log('🔍 商品ID:', data && data.id);
					console.log('🔍 商品名称:', data && data.name);
					
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
					});
					break;
			}
		}
	}
};
</script>

<style lang="scss">
@import 'ClassifyData.scss';
</style>
