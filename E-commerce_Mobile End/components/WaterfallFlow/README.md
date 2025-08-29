# 瀑布流组件 WaterfallFlow

一个高性能的uni-app瀑布流布局组件，支持懒加载、自动布局优化和流畅的用户体验。

## 特性

- 🌊 **自动瀑布流布局**: 智能分配商品到左右列，保持高度平衡
- 🚀 **高性能**: 支持懒加载、图片渐显效果
- 📱 **响应式设计**: 适配不同屏幕尺寸
- 🎨 **精美UI**: 现代化卡片设计，支持特价标签、评分等
- ⚡ **优化体验**: 点击反馈、加载动画、错误处理

## 使用方法

### 基础用法

```vue
<template>
  <WaterfallFlow 
    :dataList="goodsList"
    @item-click="onItemClick"
  />
</template>

<script>
import WaterfallFlow from '@/components/WaterfallFlow/WaterfallFlow.vue';

export default {
  components: {
    WaterfallFlow
  },
  data() {
    return {
      goodsList: [
        {
          id: 1,
          name: '商品名称',
          price: '99.00',
          vip_price: '79.00',
          img: '/static/img/product.jpg',
          is_goods: 1, // 1为特价商品
          sales: 1520,
          rating: 4.8
        }
        // ... 更多商品
      ]
    };
  },
  methods: {
    onItemClick(item) {
      console.log('点击商品:', item);
      // 跳转到商品详情页
      uni.navigateTo({
        url: `/pages/goodsDetail/goodsDetail?id=${item.id}`
      });
    }
  }
}
</script>
```

### 高级用法

```vue
<template>
  <WaterfallFlow 
    :dataList="goodsList"
    :columnGap="20"
    :showLoadMore="hasMore"
    :loadMoreText="loadingText"
    @item-click="onItemClick"
    @load-more="loadMoreData"
  />
</template>

<script>
export default {
  data() {
    return {
      goodsList: [],
      hasMore: true,
      loadingText: '加载更多...'
    };
  },
  methods: {
    // 加载更多数据
    async loadMoreData() {
      try {
        const newData = await api.getProducts({
          page: this.currentPage + 1
        });
        this.goodsList = [...this.goodsList, ...newData];
        this.currentPage++;
      } catch (error) {
        console.error('加载失败:', error);
      }
    }
  }
}
</script>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| dataList | Array | [] | 商品数据列表 |
| columnGap | Number | 20 | 左右列间距（rpx） |
| showLoadMore | Boolean | false | 是否显示加载更多 |
| loadMoreText | String | '加载更多...' | 加载更多按钮文本 |

## Events

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| item-click | 商品点击事件 | (item) 商品数据对象 |
| load-more | 加载更多事件 | - |

## 数据格式

商品数据对象应包含以下字段：

```javascript
{
  id: Number|String,        // 商品ID（必须）
  name: String,             // 商品名称（必须）
  price: String,            // 商品价格（必须）
  vip_price: String,        // VIP价格（必须）
  img: String,              // 商品图片URL（必须）
  is_goods: Number,         // 是否特价商品：1-是，0-否（可选）
  sales: Number,            // 销量（可选）
  rating: Number            // 评分（可选）
}
```

## 样式自定义

组件使用了scoped样式，如需自定义样式，可以通过以下方式：

### 1. 通过CSS变量自定义（推荐）

```css
.waterfall-container {
  --item-border-radius: 16rpx;
  --item-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  --price-color: #ff4757;
  --tag-gradient: linear-gradient(135deg, #ff6b6b, #ff8e53);
}
```

### 2. 深度选择器覆盖

```css
/* 覆盖商品卡片样式 */
::v-deep .waterfall-item {
  border-radius: 20rpx !important;
}

/* 覆盖价格颜色 */
::v-deep .user-price .price {
  color: #e74c3c !important;
}
```

## 性能优化

1. **懒加载**: 图片默认开启懒加载，减少初始化时间
2. **图片渐显**: 图片加载完成后平滑显示
3. **高度估算**: 智能估算商品卡片高度，优化布局算法
4. **事件防抖**: 避免频繁的布局计算

## 注意事项

1. 确保商品数据中的图片URL有效
2. 商品ID应该是唯一的，用于列表更新优化
3. 建议在数据量较大时实现分页加载
4. 图片建议使用适当的尺寸，避免过大影响性能

## 兼容性

- ✅ App端（Android/iOS）
- ✅ H5
- ✅ 微信小程序
- ✅ 支付宝小程序
- ✅ 百度小程序

## 演示页面

访问 `/pages/waterfallDemo/waterfallDemo` 查看完整的演示效果。

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基础瀑布流布局
- 支持懒加载和性能优化
- 支持响应式设计
