<template>
  <view class="waterfall-demo">
    <view class="demo-header">
      <text class="demo-title">瀑布流效果演示</text>
      <view class="demo-controls">
        <button class="control-btn" @click="refreshData">刷新数据</button>
        <button class="control-btn" @click="loadMore">加载更多</button>
      </view>
    </view>
    
    <WaterfallFlow 
      :dataList="demoData"
      :showLoadMore="hasMore"
      :loadMoreText="loadMoreText"
      @item-click="onItemClick"
    />
    
    <view class="demo-stats">
      <text>共 {{ demoData.length }} 个商品</text>
    </view>
  </view>
</template>

<script>
import WaterfallFlow from '@/components/WaterfallFlow/WaterfallFlow.vue';

export default {
  components: {
    WaterfallFlow
  },
  
  data() {
    return {
      demoData: [],
      hasMore: true,
      loadMoreText: '加载更多...',
      page: 1,
      loading: false
    };
  },
  
  onLoad() {
    this.generateDemoData();
  },
  
  methods: {
    // 生成演示数据
    generateDemoData() {
      const mockProducts = [
        {
          id: 1,
          name: 'iPhone 14 Pro Max 深空黑色 256GB 全网通5G手机',
          price: '8999.00',
          vip_price: '8799.00',
          img: '/static/img/goods_thumb_11.png',
          is_goods: 1,
          sales: 1520,
          rating: 4.8
        },
        {
          id: 2,
          name: '华为 MatePad Pro 11英寸平板电脑 8GB+128GB WiFi版',
          price: '3699.00',
          vip_price: '3499.00',
          img: '/static/img/goods_thumb_12.png',
          is_goods: 0,
          sales: 890,
          rating: 4.6
        },
        {
          id: 3,
          name: 'BANDALY 2020夏季女装连衣裙韩版大码宽松显瘦套装裙子两件套',
          price: '219.00',
          vip_price: '129.00',
          img: '/static/img/goods_thumb_01.png',
          is_goods: 1,
          sales: 2340,
          rating: 4.9
        },
        {
          id: 4,
          name: '花花公子 卫衣男秋季圆领薄款休闲体恤男士时尚长袖T恤外套上衣',
          price: '139.00',
          vip_price: '99.00',
          img: '/static/img/goods_thumb_02.png',
          is_goods: 1,
          sales: 567,
          rating: 4.5
        },
        {
          id: 5,
          name: '戴尔DELL灵越5000 14英寸酷睿i5网课学习轻薄笔记本电脑',
          price: '4888.00',
          vip_price: '4699.00',
          img: '/static/img/goods_thumb_15.png',
          is_goods: 0,
          sales: 123,
          rating: 4.7
        },
        {
          id: 6,
          name: '短袖男夏季T恤男装韩版潮流印花套头衣服男士圆领宽松五分袖学生休闲',
          price: '68.00',
          vip_price: '59.00',
          img: '/static/img/goods_thumb_05.png',
          is_goods: 0,
          sales: 2890,
          rating: 4.3
        },
        {
          id: 7,
          name: 'Apple 2020新款 MacBook Pro 13.3 十代i5 16G 512G 深空灰',
          price: '18200.00',
          vip_price: '17999.00',
          img: '/static/img/goods_thumb_17.png',
          is_goods: 1,
          sales: 45,
          rating: 4.9
        },
        {
          id: 8,
          name: '北极绒2020春夏季棉质睡衣女睡裙女夏季韩版纯棉短袖少女性感睡衣',
          price: '68.00',
          vip_price: '48.00',
          img: '/static/img/goods_thumb_07.png',
          is_goods: 1,
          sales: 1234,
          rating: 4.4
        },
        {
          id: 9,
          name: '小米（MI） Redmi 8A 全网通智能手机 学生老人备用机',
          price: '699.00',
          vip_price: '599.00',
          img: '/static/img/goods_thumb_12.png',
          is_goods: 0,
          sales: 3456,
          rating: 4.2
        },
        {
          id: 10,
          name: '美连诚雪纺连衣裙 2020新款女夏裙子波点气质沙滩裙仙气时尚女装',
          price: '168.00',
          vip_price: '160.00',
          img: '/static/img/goods_thumb_09.png',
          is_goods: 0,
          sales: 789,
          rating: 4.6
        }
      ];
      
      // 生成更多演示数据
      const extendedData = [];
      for (let i = 0; i < 3; i++) {
        mockProducts.forEach((product, index) => {
          extendedData.push({
            ...product,
            id: product.id + (i * 10),
            name: `${product.name} - 第${i + 1}批次`
          });
        });
      }
      
      this.demoData = extendedData;
    },
    
    // 刷新数据
    refreshData() {
      console.log('🔄 刷新瀑布流数据');
      this.page = 1;
      this.generateDemoData();
      
      uni.showToast({
        title: '数据已刷新',
        icon: 'success'
      });
    },
    
    // 加载更多
    loadMore() {
      if (this.loading) return;
      
      this.loading = true;
      this.loadMoreText = '加载中...';
      
      setTimeout(() => {
        const newData = this.generateMoreData();
        this.demoData = [...this.demoData, ...newData];
        
        this.page++;
        this.loading = false;
        this.loadMoreText = '加载更多...';
        
        if (this.page >= 5) {
          this.hasMore = false;
          this.loadMoreText = '没有更多了';
        }
        
        uni.showToast({
          title: `加载了${newData.length}个商品`,
          icon: 'success'
        });
      }, 1500);
    },
    
    // 生成更多数据
    generateMoreData() {
      const colors = ['红色', '蓝色', '绿色', '黄色', '紫色', '橙色'];
      const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
      
      return Array.from({ length: 10 }, (_, index) => ({
        id: this.demoData.length + index + 1,
        name: `新品商品 ${colors[index % colors.length]} ${sizes[index % sizes.length]}号 限量版`,
        price: (Math.random() * 1000 + 50).toFixed(2),
        vip_price: (Math.random() * 800 + 30).toFixed(2),
        img: `/static/img/goods_thumb_${(index % 17) + 1}.png`,
        is_goods: Math.random() > 0.5 ? 1 : 0,
        sales: Math.floor(Math.random() * 5000),
        rating: (Math.random() * 2 + 3).toFixed(1)
      }));
    },
    
    // 商品点击
    onItemClick(item) {
      console.log('🛒 点击商品:', item);
      
      uni.showModal({
        title: '商品详情',
        content: `商品名称: ${item.name}\n价格: ¥${item.price}\nVIP价: ¥${item.vip_price}\n销量: ${item.sales}\n评分: ${item.rating}`,
        showCancel: false
      });
    }
  }
};
</script>

<style scoped lang="scss">
.waterfall-demo {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.demo-header {
  background-color: #fff;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
  
  .demo-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
    display: block;
    text-align: center;
  }
  
  .demo-controls {
    display: flex;
    justify-content: space-around;
    
    .control-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      border: none;
      padding: 20rpx 40rpx;
      border-radius: 25rpx;
      font-size: 28rpx;
      box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
      
      &:active {
        transform: scale(0.95);
      }
    }
  }
}

.demo-stats {
  background-color: #fff;
  padding: 20rpx;
  text-align: center;
  border-top: 1rpx solid #eee;
  position: sticky;
  bottom: 0;
  
  text {
    font-size: 24rpx;
    color: #666;
  }
}
</style>
