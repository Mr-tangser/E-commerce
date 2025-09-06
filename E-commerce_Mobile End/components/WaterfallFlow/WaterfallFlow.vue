<template>
  <view class="waterfall-wrapper">
    <!-- 瀑布流内容区域 -->
    <view class="waterfall-container">
      <!-- 左列 -->
      <view class="waterfall-column left-column">
        <view 
          v-for="(item, index) in leftColumnData" 
          :key="`left-col-${index}-${item._waterfallId || item.id || 'item-' + index}`"
          class="waterfall-item"
          @click="onItemClick(item)"
        >
          <view class="item-image">
            <image 
              :src="item.img" 
              mode="widthFix"
              :lazy-load="true"
              :fade-show="true"
              @load="onImageLoad($event, 'left', index)"
              @error="onImageError($event, item)"
            />
          </view>
          <view class="item-content">
            <view class="item-title">
              <view class="tag" v-if="item.is_goods === 1">
                <text>特价</text>
              </view>
              <text class="title-text">{{ item.name }}</text>
            </view>
            <view class="item-price">
              <view class="user-price">
                <text class="currency">￥</text>
                <text class="price">{{ item.price }}</text>
              </view>
              <view class="vip-price">
                <image src="/static/vip_ico.png"></image>
                <text>￥{{ item.vip_price }}</text>
              </view>
            </view>
            <view class="item-stats" v-if="item.sales || item.rating">
              <text class="sales" v-if="item.sales">已售{{ item.sales }}</text>
              <text class="rating" v-if="item.rating">{{ item.rating }}分</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 右列 -->
      <view class="waterfall-column right-column">
        <view 
          v-for="(item, index) in rightColumnData" 
          :key="`right-col-${index}-${item._waterfallId || item.id || 'item-' + index}`"
          class="waterfall-item"
          @click="onItemClick(item)"
        >
          <view class="item-image">
            <image 
              :src="item.img" 
              mode="widthFix"
              :lazy-load="true"
              :fade-show="true"
              @load="onImageLoad($event, 'right', index)"
              @error="onImageError($event, item)"
            />
          </view>
          <view class="item-content">
            <view class="item-title">
              <view class="tag" v-if="item.is_goods === 1">
                <text>特价</text>
              </view>
              <text class="title-text">{{ item.name }}</text>
            </view>
            <view class="item-price">
              <view class="user-price">
                <text class="currency">￥</text>
                <text class="price">{{ item.price }}</text>
              </view>
              <view class="vip-price">
                <image src="/static/vip_ico.png"></image>
                <text>￥{{ item.vip_price }}</text>
              </view>
            </view>
            <view class="item-stats" v-if="item.sales || item.rating">
              <text class="sales" v-if="item.sales">已售{{ item.sales }}</text>
              <text class="rating" v-if="item.rating">{{ item.rating }}分</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 底部加载状态 - 独立于瀑布流布局 -->
    <view class="load-more-container" v-if="showLoadMore">
      <view class="load-more-content" v-if="isLoading">
        <view class="loading-spinner"></view>
        <text class="loading-text">{{ loadMoreText }}</text>
      </view>
      <view class="load-more-content" v-else-if="hasMore">
        <text class="loading-text">上拉加载更多</text>
      </view>
      <view class="load-more-content no-more" v-else>
        <text class="loading-text">已经到底了~</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'WaterfallFlow',
  props: {
    // 商品数据列表
    dataList: {
      type: Array,
      default: () => []
    },
    // 列间距
    columnGap: {
      type: Number,
      default: 20
    },
    // 是否显示加载更多
    showLoadMore: {
      type: Boolean,
      default: false
    },
    // 加载更多文本
    loadMoreText: {
      type: String,
      default: '正在加载中...'
    },
    // 是否正在加载
    isLoading: {
      type: Boolean,
      default: false
    },
    // 是否还有更多数据
    hasMore: {
      type: Boolean,
      default: true
    }
  },
  
  data() {
    return {
      leftColumnData: [],
      rightColumnData: [],
      leftColumnHeight: 0,
      rightColumnHeight: 0,
      imageHeights: new Map(), // 存储图片高度
      containerWidth: 0,
      itemWidth: 0
    };
  },
  
  
  watch: {
    dataList: {
      handler(newData) {
        console.log('🌊 瀑布流数据更新:', newData.length, '个商品');
        this.initWaterfall();
      },
      immediate: true,
      deep: true
    }
  },
  
  mounted() {
    this.getContainerWidth();
  },
  
  methods: {
    // 获取容器宽度
    getContainerWidth() {
      this.$nextTick(() => {
        const query = uni.createSelectorQuery().in(this);
        query.select('.waterfall-container').boundingClientRect(data => {
          if (data) {
            this.containerWidth = data.width;
            this.itemWidth = (data.width - this.columnGap) / 2;
            console.log('📏 瀑布流容器宽度:', this.containerWidth, '商品卡片宽度:', this.itemWidth);
            this.initWaterfall();
          }
        }).exec();
      });
    },
    
    // 初始化瀑布流
    initWaterfall() {
      if (!this.dataList.length || !this.containerWidth) {
        return;
      }
      
      console.log('🔄 初始化瀑布流布局，商品数量:', this.dataList.length);
      
      this.leftColumnData = [];
      this.rightColumnData = [];
      this.leftColumnHeight = 0;
      this.rightColumnHeight = 0;
      
      // 为每个商品分配到左右列，确保每个商品都有唯一标识
      this.dataList.forEach((item, index) => {
        // 确保每个商品都有唯一的内部ID
        const uniqueItem = {
          ...item,
          _waterfallIndex: index, // 添加瀑布流内部索引
          _waterfallId: item.id || `item-${index}-${Date.now()}` // 确保有唯一ID
        };
        this.addItemToColumn(uniqueItem, index);
      });
      
      console.log('✅ 瀑布流布局完成', {
        总商品数: this.dataList.length,
        左列商品: this.leftColumnData.length,
        右列商品: this.rightColumnData.length,
        左列高度: this.leftColumnHeight,
        右列高度: this.rightColumnHeight,
        是否平衡: Math.abs(this.leftColumnData.length - this.rightColumnData.length) <= 1 ? '✅' : '⚠️'
      });
    },
    
    // 添加商品到合适的列
    addItemToColumn(item, index) {
      // 估算商品卡片高度
      const estimatedHeight = this.estimateItemHeight(item);
      
      // 对于偶数商品，使用更智能的分配策略
      const totalItems = this.leftColumnData.length + this.rightColumnData.length;
      const isEvenDistribution = this.dataList.length % 2 === 0;
      
      if (isEvenDistribution) {
        // 偶数商品：优先保持数量平衡，然后考虑高度
        const leftCount = this.leftColumnData.length;
        const rightCount = this.rightColumnData.length;
        
        if (leftCount < rightCount) {
          // 左列商品少，优先分配给左列
          this.leftColumnData.push(item);
          this.leftColumnHeight += estimatedHeight;
        } else if (rightCount < leftCount) {
          // 右列商品少，优先分配给右列
          this.rightColumnData.push(item);
          this.rightColumnHeight += estimatedHeight;
        } else {
          // 数量相等，按高度分配
          if (this.leftColumnHeight <= this.rightColumnHeight) {
            this.leftColumnData.push(item);
            this.leftColumnHeight += estimatedHeight;
          } else {
            this.rightColumnData.push(item);
            this.rightColumnHeight += estimatedHeight;
          }
        }
      } else {
        // 奇数商品：按原来的高度分配
        if (this.leftColumnHeight <= this.rightColumnHeight) {
          this.leftColumnData.push(item);
          this.leftColumnHeight += estimatedHeight;
        } else {
          this.rightColumnData.push(item);
          this.rightColumnHeight += estimatedHeight;
        }
      }
    },
    
    // 估算商品卡片高度
    estimateItemHeight(item) {
      // 基础内容高度（标题 + 价格 + 边距等）
      const baseContentHeight = 200;
      
      // 根据商品名称长度估算标题高度
      const titleHeight = Math.ceil(item.name.length / 15) * 40 + 20;
      
      // 图片高度估算（假设图片比例为4:3到3:4之间）
      const imageRatio = 1.2; // 默认图片高宽比
      const imageHeight = this.itemWidth * imageRatio;
      
      return imageHeight + baseContentHeight + titleHeight;
    },
    
    // 图片加载完成
    onImageLoad(event, column, index) {
      const { width, height } = event.detail;
      if (width && height) {
        const actualImageHeight = (height / width) * this.itemWidth;
        console.log(`📸 ${column}列第${index}张图片加载完成:`, { width, height, actualImageHeight });
        
        // 可以在这里根据实际图片高度重新调整布局
        // 但为了性能考虑，暂时使用估算高度
      }
    },
    
    // 图片加载失败
    onImageError(event, item) {
      console.warn('🖼️ 图片加载失败:', item.name, event);
    },
    
    // 商品点击事件
    onItemClick(item) {
      console.log('🛒 点击商品:', item.name);
      this.$emit('item-click', item);
    },
    
    // 触发加载更多事件
    onLoadMore() {
      console.log('🔄 触发加载更多商品');
      this.$emit('load-more');
    },
    
    // 添加新数据（用于加载更多）
    addMoreData(newData) {
      if (!newData || !newData.length) {
        return;
      }
      
      console.log('➕ 添加更多数据到瀑布流:', newData.length, '个商品');
      
      const currentLength = this.dataList.length;
      newData.forEach((item, index) => {
        // 确保新数据也有唯一标识
        const uniqueItem = {
          ...item,
          _waterfallIndex: currentLength + index,
          _waterfallId: item.id || `item-${currentLength + index}-${Date.now()}`
        };
        this.addItemToColumn(uniqueItem, currentLength + index);
      });
    },
    
    // 重置瀑布流
    reset() {
      console.log('🔄 重置瀑布流');
      this.leftColumnData = [];
      this.rightColumnData = [];
      this.leftColumnHeight = 0;
      this.rightColumnHeight = 0;
      this.imageHeights.clear();
    }
  }
};
</script>

<style scoped lang="scss">
.waterfall-wrapper {
  width: 100%;
  background-color: #f2f2f2;
}

.waterfall-container {
  display: flex;
  padding: 0 30rpx;
  min-height: 200rpx;
}

.waterfall-column {
  flex: 1;
  
  &.left-column {
    margin-right: 20rpx;
  }
}

.waterfall-item {
  background-color: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  
  &:active {
    transform: scale(0.98);
  }
}

.item-image {
  width: 100%;
  position: relative;
  
  image {
    width: 100%;
    display: block;
    border-radius: 12rpx 12rpx 0 0;
  }
}

.item-content {
  padding: 20rpx;
}

.item-title {
  margin-bottom: 15rpx;
  min-height: 80rpx;
  
  .tag {
    display: inline-block;
    margin-bottom: 8rpx;
    
    text {
      font-size: 22rpx;
      color: #fff;
      background: linear-gradient(135deg, #ff6b6b, #ff8e53);
      padding: 4rpx 12rpx;
      border-radius: 8rpx;
      display: inline-block;
    }
  }
  
  .title-text {
    font-size: 26rpx;
    color: #333;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.item-price {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10rpx;
  
  .user-price {
    display: flex;
    align-items: baseline;
    
    .currency {
      font-size: 24rpx;
      color: #ff4757;
      font-weight: bold;
    }
    
    .price {
      font-size: 32rpx;
      color: #ff4757;
      font-weight: bold;
      margin-left: 2rpx;
    }
  }
  
  .vip-price {
    display: flex;
    align-items: center;
    
    image {
      width: 24rpx;
      height: 24rpx;
      margin-right: 6rpx;
    }
    
    text {
      font-size: 22rpx;
      color: #ffa502;
    }
  }
}

.item-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 22rpx;
  color: #999;
  
  .sales {
    flex: 1;
  }
  
  .rating {
    color: #ffa502;
  }
}

/* 加载状态 */
.waterfall-container:empty::before {
  content: "加载中...";
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 200rpx;
  font-size: 28rpx;
  color: #999;
}

/* 底部加载更多样式 */
.load-more-container {
  width: 100%;
  padding: 30rpx 0 50rpx 0;
  display: flex;
  justify-content: center;
  background-color: #f2f2f2;
  margin-top: 20rpx;
}

.load-more-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10rpx);
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
  
  .loading-spinner {
    width: 40rpx;
    height: 40rpx;
    border: 4rpx solid #e5e5e5;
    border-top: 4rpx solid #007aff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16rpx;
  }
  
  .loading-text {
    font-size: 26rpx;
    color: #666;
    font-weight: 500;
  }
  
  &.no-more {
    background: rgba(245, 245, 245, 0.9);
    
    .loading-text {
      color: #999;
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
