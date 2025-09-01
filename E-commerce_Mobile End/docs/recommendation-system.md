# 📊 个性化推荐系统使用指南

## 🎯 功能概述

我们的个性化推荐系统会根据用户的浏览历史，智能推荐可能感兴趣的商品，提升用户购物体验和转化率。

## ✨ 主要特性

### 🔍 智能浏览记录
- **自动记录**: 用户查看商品详情时自动保存浏览记录
- **数据分析**: 记录商品分类、价格、浏览次数等关键信息
- **本地存储**: 使用uni-app本地存储，保护用户隐私
- **容量限制**: 最多保存50条记录，自动管理存储空间

### 🧠 推荐算法
1. **相似商品推荐** (权重40%)
   - 基于用户最近浏览的商品
   - 分析商品分类、标签、价格区间
   - 推荐相似特征的商品

2. **分类偏好推荐** (权重30%)
   - 分析用户偏好的商品分类
   - 推荐热门分类下的优质商品
   - 支持主分类和子分类推荐

3. **热销商品推荐** (权重20%)
   - 推荐平台热销商品
   - 基于销量和用户评价
   - 保证推荐质量

4. **高评分商品推荐** (权重10%)
   - 推荐高评分商品
   - 至少5个评价且评分4.0以上
   - 提升用户满意度

### 🎨 界面展示
- **个性化提示**: 显示"🎯 根据您的浏览记录为您推荐"
- **瀑布流布局**: 美观的商品展示方式
- **降级方案**: 无浏览记录时显示通用推荐

## 🚀 使用方法

### 前端调用

```javascript
import RecommendationService from '@/utils/recommendation-service.js';

// 获取个性化推荐
const recommendations = await RecommendationService.getPersonalizedRecommendations(20);

// 获取相似商品
const similarProducts = await RecommendationService.getSimilarProducts(productId, 6);

// 获取新品推荐
const newProducts = await RecommendationService.getNewProductRecommendations(8);

// 获取用户偏好分析
const preferences = RecommendationService.getUserPreferences();
```

### 浏览记录管理

```javascript
import BrowsingHistory from '@/utils/browsing-history.js';

// 添加浏览记录
BrowsingHistory.addProduct({
  id: 'product_id',
  name: '商品名称',
  price: 99.99,
  img: 'image_url',
  category: '分类名称'
});

// 获取浏览统计
const stats = BrowsingHistory.getStatistics();

// 获取偏好分类
const categories = BrowsingHistory.getPreferredCategories(5);

// 清空浏览记录
BrowsingHistory.clearHistory();
```

## 🔧 API接口

### 推荐商品接口

```http
GET /api/products/recommended?limit=10
```

### 个性化推荐接口

```http
POST /api/products/recommendations/history
Content-Type: application/json

{
  "recentProductIds": ["id1", "id2"],
  "preferredCategories": ["手机", "数码"],
  "historySize": 15
}
```

### 相似商品接口

```http
GET /api/products/:id/similar?limit=6
```

### 新品推荐接口

```http
POST /api/products/recommendations/new
Content-Type: application/json

{
  "preferredCategories": ["手机", "数码"],
  "limit": 8
}
```

## 📈 推荐效果

### 冷启动场景
- **新用户**: 显示精选推荐、热销商品
- **无浏览记录**: 使用通用推荐算法
- **降级方案**: 确保始终有商品展示

### 个性化场景
- **有浏览记录**: 智能分析用户偏好
- **多维度推荐**: 结合分类、相似性、热度
- **动态权重**: 根据数据质量调整推荐策略

## 🎭 用户体验

### 可视化提示
```vue
<!-- 个性化推荐提示 -->
<view class="recommend-hint" v-if="showPersonalizedHint">
  <text class="hint-text">🎯 根据您的浏览记录为您推荐</text>
</view>
```

### 推荐原因统计
```javascript
// 显示推荐原因分布
const reasons = {
  "与您浏览的商品相似": 5,
  "您感兴趣的分类商品": 3,
  "热销推荐": 2,
  "好评推荐": 1
};
```

## 🔍 测试流程

### 1. 基础测试
1. 打开首页，查看是否显示商品推荐
2. 检查控制台日志，确认推荐算法执行
3. 验证降级方案是否正常工作

### 2. 浏览记录测试
1. 点击多个不同分类的商品
2. 查看商品详情页
3. 返回首页，观察推荐是否变化
4. 检查是否显示个性化提示

### 3. 推荐算法测试
1. 浏览特定分类商品（如手机）
2. 再次进入首页
3. 观察推荐商品是否偏向该分类
4. 验证推荐原因统计

### 4. 性能测试
1. 检查推荐算法响应时间
2. 验证本地存储性能
3. 测试大量浏览记录的处理

## 📊 数据监控

### 关键指标
- **点击率**: 推荐商品的点击率
- **转化率**: 推荐商品的购买转化率
- **覆盖率**: 推荐算法覆盖的商品比例
- **个性化度**: 不同用户推荐结果的差异性

### 日志监控
```javascript
// 推荐效果日志
console.log('🎯 推荐原因分布:', reasons);
console.log('📊 浏览记录统计:', stats);
console.log('💡 为您展示个性化推荐商品');
```

## 🔧 配置参数

### 浏览记录配置
```javascript
const MAX_HISTORY_SIZE = 50; // 最大记录数
const STORAGE_KEY = 'browsing_history'; // 存储键名
```

### 推荐算法权重
```javascript
const WEIGHTS = {
  SIMILAR: 0.4,    // 相似商品权重
  CATEGORY: 0.3,   // 分类推荐权重
  HOT: 0.2,        // 热销商品权重
  RATED: 0.1       // 高评分商品权重
};
```

## 🚨 注意事项

1. **隐私保护**: 浏览记录仅存储在本地，不会上传到服务器
2. **性能优化**: 推荐算法支持降级方案，确保页面加载速度
3. **兼容性**: 支持各种设备和浏览器环境
4. **错误处理**: 完善的错误捕获和降级机制

## 🎉 总结

个性化推荐系统通过智能分析用户行为，提供精准的商品推荐，显著提升用户体验和商城转化率。系统具备完善的降级机制和错误处理，确保在各种场景下都能正常运行。

