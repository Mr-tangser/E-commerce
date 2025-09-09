<template>
  <div class="md-layout">
    <div class="md-layout-item md-size-100">
      <!-- 数据概览卡片 -->
      <div class="md-layout">
        <div class="md-layout-item md-size-25">
          <md-card class="stats-card">
            <md-card-header class="md-card-header-icon md-card-header-success">
              <div class="card-icon">
                <md-icon>trending_up</md-icon>
              </div>
              <p class="card-category">今日销售额</p>
              <h4 class="card-title">¥{{ todaySales.toLocaleString() }}</h4>
            </md-card-header>
            <md-card-content>
              <p class="card-category">
                <span class="text-success">
                  <md-icon>arrow_upward</md-icon> {{ todayGrowth }}%
                </span>
                较昨日
              </p>
            </md-card-content>
          </md-card>
        </div>

        <div class="md-layout-item md-size-25">
          <md-card class="stats-card">
            <md-card-header class="md-card-header-icon md-card-header-warning">
              <div class="card-icon">
                <md-icon>receipt</md-icon>
              </div>
              <p class="card-category">今日订单</p>
              <h4 class="card-title">{{ todayOrders }}</h4>
            </md-card-header>
            <md-card-content>
              <p class="card-category">
                <span class="text-warning">
                  <md-icon>arrow_upward</md-icon> {{ orderGrowth }}%
                </span>
                较昨日
              </p>
            </md-card-content>
          </md-card>
        </div>

        <div class="md-layout-item md-size-25">
          <md-card class="stats-card">
            <md-card-header class="md-card-header-icon md-card-header-danger">
              <div class="card-icon">
                <md-icon>people</md-icon>
              </div>
              <p class="card-category">新增用户</p>
              <h4 class="card-title">{{ newUsers }}</h4>
            </md-card-header>
            <md-card-content>
              <p class="card-category">
                <span class="text-danger">
                  <md-icon>arrow_upward</md-icon> {{ userGrowth }}%
                </span>
                较昨日
              </p>
            </md-card-content>
          </md-card>
        </div>

        <div class="md-layout-item md-size-25">
          <md-card class="stats-card">
            <md-card-header class="md-card-header-icon md-card-header-info">
              <div class="card-icon">
                <md-icon>store</md-icon>
              </div>
              <p class="card-category">商品销量</p>
              <h4 class="card-title">{{ totalSoldProducts }}</h4>
            </md-card-header>
            <md-card-content>
              <p class="card-category">
                <span class="text-info">
                  <md-icon>arrow_upward</md-icon> {{ productGrowth }}%
                </span>
                较昨日
              </p>
            </md-card-content>
          </md-card>
        </div>
      </div>

      <!-- 销售趋势图表 -->
      <div class="md-layout">
        <div class="md-layout-item md-size-70">
          <md-card>
            <md-card-header class="md-card-header-icon md-card-header-green">
              <div class="card-icon">
                <md-icon>timeline</md-icon>
              </div>
              <h4 class="title">销售趋势分析</h4>
            </md-card-header>
            <md-card-content>
              <div class="chart-container">
                <canvas id="salesChart" width="400" height="200"></canvas>
              </div>
            </md-card-content>
          </md-card>
        </div>

        <div class="md-layout-item md-size-30">
          <md-card>
            <md-card-header class="md-card-header-icon md-card-header-primary">
              <div class="card-icon">
                <md-icon>pie_chart</md-icon>
              </div>
              <h4 class="title">商品分类销售占比</h4>
            </md-card-header>
            <md-card-content>
              <div class="chart-container">
                <canvas id="categoryChart" width="300" height="300"></canvas>
              </div>
            </md-card-content>
          </md-card>
        </div>
      </div>

      <!-- 热销商品排行 -->
      <div class="md-layout">
        <div class="md-layout-item md-size-50">
          <md-card>
            <md-card-header class="md-card-header-icon md-card-header-warning">
              <div class="card-icon">
                <md-icon>star</md-icon>
              </div>
              <h4 class="title">热销商品TOP10</h4>
            </md-card-header>
            <md-card-content>
              <div class="top-products">
                <div v-for="(product, index) in topProducts" :key="product.id" class="product-rank">
                  <div class="rank-number" :class="getRankClass(index)">{{ index + 1 }}</div>
                  <div class="product-info">
                    <div class="product-name">{{ product.name }}</div>
                    <div class="product-sales">销量: {{ product.sales }}</div>
                  </div>
                  <div class="product-revenue">¥{{ product.revenue.toLocaleString() }}</div>
                </div>
              </div>
            </md-card-content>
          </md-card>
        </div>

        <div class="md-layout-item md-size-50">
          <md-card>
            <md-card-header class="md-card-header-icon md-card-header-success">
              <div class="card-icon">
                <md-icon>location_on</md-icon>
              </div>
              <h4 class="title">地区销售分布</h4>
            </md-card-header>
            <md-card-content>
              <div class="region-sales">
                <div v-for="region in regionSales" :key="region.name" class="region-item">
                  <div class="region-name">{{ region.name }}</div>
                  <div class="region-bar">
                    <div class="progress-bar" :style="{ width: region.percentage + '%' }"></div>
                  </div>
                  <div class="region-amount">¥{{ region.amount.toLocaleString() }}</div>
                </div>
              </div>
            </md-card-content>
          </md-card>
        </div>
      </div>

      <!-- 导出功能 -->
      <div class="md-layout" v-if="hasPermission('analytics', 'export')">
        <div class="md-layout-item md-size-100">
          <md-card>
            <md-card-header class="md-card-header-icon md-card-header-info">
              <div class="card-icon">
                <md-icon>file_download</md-icon>
              </div>
              <h4 class="title">数据导出</h4>
            </md-card-header>
            <md-card-content>
              <div class="export-buttons">
                <md-button class="md-primary" @click="exportSalesData">
                  <md-icon>file_download</md-icon>
                  导出销售数据
                </md-button>
                <md-button class="md-success" @click="exportOrderData">
                  <md-icon>file_download</md-icon>
                  导出订单数据
                </md-button>
                <md-button class="md-warning" @click="exportProductData">
                  <md-icon>file_download</md-icon>
                  导出商品数据
                </md-button>
              </div>
            </md-card-content>
          </md-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import permissionsMixin from "@/mixins/permissions";

export default {
  name: "SalesAnalytics",
  mixins: [permissionsMixin],

  data() {
    return {
      // 数据概览
      todaySales: 125680,
      todayGrowth: 15.8,
      todayOrders: 342,
      orderGrowth: 23.1,
      newUsers: 89,
      userGrowth: 12.5,
      totalSoldProducts: 1256,
      productGrowth: 8.9,

      // 热销商品
      topProducts: [
        { id: 1, name: "iPhone 14 Pro", sales: 145, revenue: 1159855 },
        { id: 2, name: "AirPods Pro", sales: 98, revenue: 195902 },
        { id: 3, name: "iPad Air", sales: 76, revenue: 379240 },
        { id: 4, name: "MacBook Pro", sales: 45, revenue: 809550 },
        { id: 5, name: "Apple Watch", sales: 123, revenue: 369000 },
        { id: 6, name: "经典白衬衫", sales: 234, revenue: 46566 },
        { id: 7, name: "牛仔裤", sales: 189, revenue: 75411 },
        { id: 8, name: "运动鞋", sales: 167, revenue: 83500 },
        { id: 9, name: "JavaScript指南", sales: 345, revenue: 30705 },
        { id: 10, name: "智能手环", sales: 278, revenue: 139000 }
      ],

      // 地区销售
      regionSales: [
        { name: "北京", amount: 2856000, percentage: 28.5 },
        { name: "上海", amount: 2344000, percentage: 23.4 },
        { name: "广州", amount: 1890000, percentage: 18.9 },
        { name: "深圳", amount: 1567000, percentage: 15.7 },
        { name: "杭州", amount: 890000, percentage: 8.9 },
        { name: "其他", amount: 453000, percentage: 4.6 }
      ]
    };
  },

  mounted() {
    this.checkPermissions();
    this.initCharts();
  },

  methods: {
    checkPermissions() {
      if (!this.hasPermission('analytics', 'view')) {
        this.handleUnauthorized('您没有权限查看数据分析');
        this.$router.push('/dashboard');
        return;
      }
    },

    initCharts() {
      // 这里应该使用真实的图表库如Chart.js或ECharts
      // 为了演示目的，我们只显示占位符
      this.$nextTick(() => {
        this.drawSalesChart();
        this.drawCategoryChart();
      });
    },

    drawSalesChart() {
      const canvas = document.getElementById('salesChart');
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(0, 150, 400, 50);
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.fillText('销售趋势图表 (需要集成Chart.js)', 50, 100);
    },

    drawCategoryChart() {
      const canvas = document.getElementById('categoryChart');
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      // 绘制简单的饼图占位符
      ctx.beginPath();
      ctx.arc(150, 150, 80, 0, Math.PI * 2);
      ctx.fillStyle = '#2196f3';
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.fillText('分类占比图', 110, 155);
    },

    getRankClass(index) {
      if (index === 0) return 'rank-1';
      if (index === 1) return 'rank-2';
      if (index === 2) return 'rank-3';
      return 'rank-normal';
    },

    exportSalesData() {
      if (!this.hasPermission('analytics', 'export')) {
        this.handleUnauthorized('您没有权限导出数据');
        return;
      }
      this.$store.dispatch("alerts/success", "销售数据导出功能开发中");
    },

    exportOrderData() {
      if (!this.hasPermission('analytics', 'export')) {
        this.handleUnauthorized('您没有权限导出数据');
        return;
      }
      this.$store.dispatch("alerts/success", "订单数据导出功能开发中");
    },

    exportProductData() {
      if (!this.hasPermission('analytics', 'export')) {
        this.handleUnauthorized('您没有权限导出数据');
        return;
      }
      this.$store.dispatch("alerts/success", "商品数据导出功能开发中");
    },
  },
};
</script>

<style scoped>
.stats-card {
  margin-bottom: 20px;
}

.stats-card .card-title {
  font-size: 2.2em;
  font-weight: 300;
  margin: 0;
}

.stats-card .card-category {
  color: #999;
  margin: 0;
  font-size: 14px;
}

.text-success {
  color: #4caf50 !important;
}

.text-warning {
  color: #ff9800 !important;
}

.text-danger {
  color: #f44336 !important;
}

.text-info {
  color: #2196f3 !important;
}

.chart-container {
  padding: 20px;
  text-align: center;
}

.top-products {
  padding: 10px 0;
}

.product-rank {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.rank-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  margin-right: 15px;
}

.rank-1 {
  background: #ffd700;
}

.rank-2 {
  background: #c0c0c0;
}

.rank-3 {
  background: #cd7f32;
}

.rank-normal {
  background: #999;
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: 500;
  color: #333;
}

.product-sales {
  font-size: 12px;
  color: #666;
}

.product-revenue {
  font-weight: 500;
  color: #4caf50;
}

.region-sales {
  padding: 10px 0;
}

.region-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.region-name {
  width: 60px;
  font-size: 14px;
  color: #333;
}

.region-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  margin: 0 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(45deg, #4caf50, #8bc34a);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.region-amount {
  width: 80px;
  text-align: right;
  font-size: 12px;
  color: #666;
}

.export-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.export-buttons .md-button {
  min-width: 150px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .product-rank {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }
  
  .rank-number {
    margin-bottom: 5px;
  }
  
  .region-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .region-bar {
    width: 100%;
    margin: 5px 0;
  }
  
  .export-buttons {
    flex-direction: column;
  }
}
</style>
