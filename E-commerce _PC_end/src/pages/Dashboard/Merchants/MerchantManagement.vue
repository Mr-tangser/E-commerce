<template>
  <div class="md-layout">
    <div class="md-layout-item md-size-100">
      <md-card>
        <md-card-header class="md-card-header-icon md-card-header-blue">
          <div class="card-icon">
            <md-icon>store</md-icon>
          </div>
          <h4 class="title">商家管理</h4>
        </md-card-header>
        <md-card-content>
          <div class="text-right">
            <md-button class="md-primary md-dense" @click="onProFeature">
              添加商家
            </md-button>
          </div>
          
          <!-- 过滤器 -->
          <div class="md-layout" style="margin-bottom: 20px;">
            <div class="md-layout-item md-size-25">
              <md-field>
                <label>认证状态</label>
                <md-select v-model="filters.verifyStatus" name="verifyStatus">
                  <md-option value="">全部状态</md-option>
                  <md-option value="pending">待审核</md-option>
                  <md-option value="verified">已认证</md-option>
                  <md-option value="rejected">已拒绝</md-option>
                  <md-option value="suspended">已暂停</md-option>
                </md-select>
              </md-field>
            </div>
            <div class="md-layout-item md-size-25">
              <md-field>
                <label>商家等级</label>
                <md-select v-model="filters.level" name="level">
                  <md-option value="">全部等级</md-option>
                  <md-option value="bronze">铜牌商家</md-option>
                  <md-option value="silver">银牌商家</md-option>
                  <md-option value="gold">金牌商家</md-option>
                  <md-option value="diamond">钻石商家</md-option>
                </md-select>
              </md-field>
            </div>
            <div class="md-layout-item md-size-25">
              <md-field>
                <label>经营类别</label>
                <md-select v-model="filters.category" name="category">
                  <md-option value="">全部类别</md-option>
                  <md-option value="electronics">数码电子</md-option>
                  <md-option value="clothing">服装饰品</md-option>
                  <md-option value="food">食品生鲜</md-option>
                  <md-option value="books">图书文具</md-option>
                  <md-option value="home">家居用品</md-option>
                  <md-option value="sports">运动户外</md-option>
                </md-select>
              </md-field>
            </div>
            <div class="md-layout-item md-size-25">
              <md-field>
                <label>活跃状态</label>
                <md-select v-model="filters.isActive" name="isActive">
                  <md-option value="">全部状态</md-option>
                  <md-option value="true">活跃</md-option>
                  <md-option value="false">停业</md-option>
                </md-select>
              </md-field>
            </div>
          </div>

          <md-table
            :value="filteredTable"
            :md-sort.sync="sortation.field"
            :md-sort-order.sync="sortation.order"
            :md-sort-fn="customSort"
            class="paginated-table table-striped table-hover"
          >
            <md-table-toolbar>
              <md-field>
                <label>每页显示</label>
                <md-select v-model="pagination.perPage" name="pages">
                  <md-option
                    v-for="item in pagination.perPageOptions"
                    :key="item"
                    :label="item"
                    :value="item"
                  >
                    {{ item }}
                  </md-option>
                </md-select>
              </md-field>
            </md-table-toolbar>

            <md-table-row slot="md-table-row" slot-scope="{ item }">
              <md-table-cell md-label="商家logo" md-sort-by="logo">
                <div class="avatar-cell">
                  <img 
                    :src="item.logo || '/img/default-store.png'" 
                    :alt="item.storeName"
                    class="store-logo"
                    @error="handleImageError"
                  />
                </div>
              </md-table-cell>
              <md-table-cell md-label="商家名称" md-sort-by="storeName">
                <div class="store-name-cell">
                  <div class="store-name">{{ item.storeName }}</div>
                  <div class="store-code">ID: {{ item.storeCode }}</div>
                </div>
              </md-table-cell>
              <md-table-cell md-label="店主信息" md-sort-by="ownerName">
                <div class="owner-info">
                  <div class="owner-name">{{ item.ownerName }}</div>
                  <div class="owner-contact">{{ item.contactPhone }}</div>
                </div>
              </md-table-cell>
              <md-table-cell md-label="认证状态" md-sort-by="verifyStatus">
                <md-chip :class="[getVerifyStatusClass(item.verifyStatus), 'status-chip']">
                  {{ getVerifyStatusText(item.verifyStatus) }}
                </md-chip>
              </md-table-cell>
              <md-table-cell md-label="商家等级" md-sort-by="level">
                <md-chip :class="[getLevelClass(item.level), 'level-chip']">
                  {{ getLevelText(item.level) }}
                </md-chip>
              </md-table-cell>
              <md-table-cell md-label="经营类别" md-sort-by="category">
                {{ getCategoryText(item.category) }}
              </md-table-cell>
              <md-table-cell md-label="商品数量" md-sort-by="productCount">
                <span class="product-count">{{ item.productCount || 0 }}件</span>
              </md-table-cell>
              <md-table-cell md-label="月销售额" md-sort-by="monthlyRevenue">
                <span class="revenue-amount">¥{{ formatMoney(item.monthlyRevenue) }}</span>
              </md-table-cell>
              <md-table-cell md-label="评分" md-sort-by="rating">
                <div class="rating-cell">
                  <span class="rating-stars">★</span>
                  <span class="rating-number">{{ item.rating || '暂无' }}</span>
                </div>
              </md-table-cell>
              <md-table-cell md-label="入驻时间" md-sort-by="joinDate">
                {{ formatDate(item.joinDate) }}
              </md-table-cell>
              <md-table-cell md-label="状态" md-sort-by="isActive">
                <md-chip :class="[item.isActive ? 'md-success' : 'md-warning', 'active-chip']">
                  {{ item.isActive ? '营业中' : '已停业' }}
                </md-chip>
              </md-table-cell>
              <md-table-cell md-label="操作">
                <md-button
                  class="md-icon-button md-raised md-round md-info"
                  @click="viewMerchant(item)"
                  style="margin: 0.2rem;"
                  title="查看详情"
                >
                  <md-icon>visibility</md-icon>
                </md-button>
                <md-button
                  class="md-icon-button md-raised md-round md-warning"
                  @click="editMerchant(item)"
                  style="margin: 0.2rem;"
                  title="编辑商家"
                >
                  <md-icon>edit</md-icon>
                </md-button>
                <md-button
                  class="md-icon-button md-raised md-round"
                  :class="item.isActive ? 'md-accent' : 'md-success'"
                  @click="toggleMerchantStatus(item)"
                  style="margin: 0.2rem;"
                  :title="item.isActive ? '暂停营业' : '恢复营业'"
                >
                  <md-icon>{{ item.isActive ? 'pause' : 'play_arrow' }}</md-icon>
                </md-button>
              </md-table-cell>
            </md-table-row>
          </md-table>

        </md-card-content>

        <md-card-actions md-alignment="space-between">
          <div class="">
            <p class="card-category">
              Showing {{ from + 1 }} to {{ to }} of {{ filteredTotal }} entries
            </p>
          </div>
          <pagination
            class="pagination-no-border pagination-success"
            v-model="pagination.currentPage"
            :per-page="pagination.perPage"
            :total="filteredTotal"
          />
        </md-card-actions>
      </md-card>
    </div>

    <!-- 商家详情对话框 -->
    <md-dialog :md-active.sync="showDetailDialog" :md-fullscreen="false" :md-backdrop="true">
      <md-dialog-title>
        <span style="color: #2196f3; font-size: 18px;">
          🏪 商家详情 - {{ selectedMerchant.storeName }}
        </span>
        <md-chip 
          :class="getVerifyStatusClass(selectedMerchant.verifyStatus)" 
          style="margin-left: 10px; font-weight: 500;"
        >
          {{ getVerifyStatusText(selectedMerchant.verifyStatus) }}
        </md-chip>
      </md-dialog-title>
      
      <md-dialog-content style="padding: 24px; max-height: 500px; overflow-y: auto;">
        <div class="merchant-details">
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="detail-item">
              <span class="detail-label">商家名称：</span>
              <span class="detail-value">{{ selectedMerchant.storeName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">商家编号：</span>
              <span class="detail-value">{{ selectedMerchant.storeCode }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">店主姓名：</span>
              <span class="detail-value">{{ selectedMerchant.ownerName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">联系电话：</span>
              <span class="detail-value">{{ selectedMerchant.contactPhone }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">经营地址：</span>
              <span class="detail-value">{{ selectedMerchant.businessAddress }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h4>经营信息</h4>
            <div class="detail-item">
              <span class="detail-label">经营类别：</span>
              <span class="detail-value">{{ getCategoryText(selectedMerchant.category) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">商家等级：</span>
              <span class="detail-value">{{ getLevelText(selectedMerchant.level) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">商品数量：</span>
              <span class="detail-value">{{ selectedMerchant.productCount || 0 }}件</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">月销售额：</span>
              <span class="detail-value">¥{{ formatMoney(selectedMerchant.monthlyRevenue) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">客户评分：</span>
              <span class="detail-value">{{ selectedMerchant.rating || '暂无评分' }}</span>
            </div>
          </div>
        </div>
      </md-dialog-content>
      
      <md-dialog-actions>
        <md-button class="md-primary" @click="closeDetailDialog">关闭</md-button>
        <md-button class="md-primary md-raised" @click="editMerchant(selectedMerchant)">
          编辑商家
        </md-button>
      </md-dialog-actions>
    </md-dialog>
  </div>
</template>

<script>
import Pagination from "@/components/Pagination";
import permissionsMixin from "@/mixins/permissions";

export default {
  components: {
    pagination: Pagination,
  },
  mixins: [permissionsMixin],

  data: () => ({
    table: [],

    filters: {
      verifyStatus: '',
      level: '',
      category: '',
      isActive: ''
    },

    sortation: {
      field: "joinDate",
      order: "desc",
    },

    pagination: {
      perPage: 5,
      currentPage: 1,
      perPageOptions: [5, 10, 25, 50],
    },

    // 详情对话框相关数据
    showDetailDialog: false,
    selectedMerchant: {},
  }),

  computed: {
    filteredTable() {
      let filtered = this.table;

      // 认证状态过滤
      if (this.filters.verifyStatus) {
        filtered = filtered.filter(item => item.verifyStatus === this.filters.verifyStatus);
      }

      // 等级过滤
      if (this.filters.level) {
        filtered = filtered.filter(item => item.level === this.filters.level);
      }

      // 类别过滤
      if (this.filters.category) {
        filtered = filtered.filter(item => item.category === this.filters.category);
      }

      // 活跃状态过滤
      if (this.filters.isActive !== '') {
        filtered = filtered.filter(item => 
          item.isActive === (this.filters.isActive === 'true')
        );
      }

      return filtered;
    },

    filteredTotal() {
      return this.filteredTable.length;
    },

    from() {
      return this.pagination.perPage * (this.pagination.currentPage - 1);
    },

    to() {
      let highBound = this.from + this.pagination.perPage;
      if (this.filteredTotal < highBound) {
        highBound = this.filteredTotal;
      }
      return highBound;
    },
  },

  created() {
    this.getList();
  },

  watch: {
    filters: {
      handler() {
        this.pagination.currentPage = 1;
        this.getList();
      },
      deep: true
    },
    
    'pagination.currentPage'() {
      this.getList();
    },
    
    'pagination.perPage'() {
      this.pagination.currentPage = 1;
      this.getList();
    }
  },

  methods: {
    async getList() {
      try {
        // 从后端API获取商家列表
        const response = await this.$http.get('admin/merchants', {
          params: {
            page: this.pagination.currentPage,
            limit: this.pagination.perPage,
            verifyStatus: this.filters.verifyStatus || undefined,
            level: this.filters.level || undefined,
            category: this.filters.category || undefined,
            isActive: this.filters.isActive || undefined
          }
        });

        if (response.data.success) {
          this.table = response.data.data.merchants;
        } else {
          throw new Error(response.data.message || '获取商家列表失败');
        }
      } catch (error) {
        console.error('获取商家列表失败:', error);
        
        this.$store.dispatch("alerts/error", 
          `获取商家列表失败: ${error.response?.data?.message || error.message}`
        );
        
        // 暂时使用模拟数据用于展示界面结构
        this.table = this.getMockData();
      }
    },

    // 模拟数据（临时用于界面展示）
    getMockData() {
      return [
        {
          _id: '1',
          storeName: '小米官方旗舰店',
          storeCode: 'MI001',
          ownerName: '张小明',
          contactPhone: '138****1234',
          businessAddress: '北京市朝阳区',
          verifyStatus: 'verified',
          level: 'diamond',
          category: 'electronics',
          productCount: 156,
          monthlyRevenue: 850000,
          rating: 4.8,
          joinDate: '2023-01-15',
          isActive: true,
          logo: '/img/stores/xiaomi.png'
        },
        {
          _id: '2',
          storeName: 'H&M服装专营店',
          storeCode: 'HM002',
          ownerName: '李红梅',
          contactPhone: '139****5678',
          businessAddress: '上海市浦东新区',
          verifyStatus: 'verified',
          level: 'gold',
          category: 'clothing',
          productCount: 89,
          monthlyRevenue: 420000,
          rating: 4.5,
          joinDate: '2023-03-20',
          isActive: true,
          logo: '/img/stores/hm.png'
        },
        {
          _id: '3',
          storeName: '新鲜果蔬专营店',
          storeCode: 'FR003',
          ownerName: '王大锤',
          contactPhone: '137****9012',
          businessAddress: '广州市天河区',
          verifyStatus: 'pending',
          level: 'silver',
          category: 'food',
          productCount: 45,
          monthlyRevenue: 120000,
          rating: 4.2,
          joinDate: '2023-08-10',
          isActive: true,
          logo: '/img/stores/fruit.png'
        }
      ];
    },

    onProFeature() {
      this.$store.dispatch("alerts/error", "这是PRO功能，暂未开放。");
    },

    viewMerchant(merchant) {
      this.selectedMerchant = { ...merchant };
      this.showDetailDialog = true;
    },

    editMerchant(merchant) {
      this.onProFeature();
    },

    toggleMerchantStatus(merchant) {
      merchant.isActive = !merchant.isActive;
      this.$store.dispatch("alerts/success", 
        `商家 ${merchant.storeName} 已${merchant.isActive ? '恢复营业' : '暂停营业'}`
      );
    },

    closeDetailDialog() {
      this.showDetailDialog = false;
      this.selectedMerchant = {};
    },

    customSort() {
      return false;
    },

    getVerifyStatusClass(status) {
      const statusClasses = {
        'verified': 'md-success',
        'pending': 'md-warning',
        'rejected': 'md-danger',
        'suspended': 'md-accent'
      };
      return statusClasses[status] || 'md-default';
    },

    getVerifyStatusText(status) {
      const statusTexts = {
        'verified': '已认证',
        'pending': '待审核',
        'rejected': '已拒绝',
        'suspended': '已暂停'
      };
      return statusTexts[status] || status;
    },

    getLevelClass(level) {
      const levelClasses = {
        'diamond': 'md-accent',
        'gold': 'md-warning',
        'silver': 'md-info',
        'bronze': 'md-default'
      };
      return levelClasses[level] || 'md-default';
    },

    getLevelText(level) {
      const levelTexts = {
        'diamond': '钻石商家',
        'gold': '金牌商家',
        'silver': '银牌商家',
        'bronze': '铜牌商家'
      };
      return levelTexts[level] || level;
    },

    getCategoryText(category) {
      const categoryTexts = {
        'electronics': '数码电子',
        'clothing': '服装饰品',
        'food': '食品生鲜',
        'books': '图书文具',
        'home': '家居用品',
        'sports': '运动户外'
      };
      return categoryTexts[category] || category;
    },

    formatMoney(amount) {
      if (!amount) return '0';
      return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    formatDate(dateString) {
      if (!dateString) return '暂无';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    },

    handleImageError(event) {
      event.target.src = '/img/default-store.png';
    },
  },
};
</script>

<style scoped>
.store-logo {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #e0e0e0;
}

.store-name-cell {
  text-align: left;
}

.store-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.store-code {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.owner-info {
  text-align: left;
}

.owner-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.owner-contact {
  font-size: 13px;
  color: #666;
}

.product-count {
  font-weight: 500;
  color: #2196f3;
}

.revenue-amount {
  font-weight: 500;
  color: #4caf50;
}

.rating-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-stars {
  color: #ffc107;
  font-size: 16px;
}

.rating-number {
  font-weight: 500;
  color: #333;
}

.status-chip, .level-chip, .active-chip {
  font-weight: 500;
}

.avatar-cell {
  display: flex;
  align-items: center;
}

/* 详情对话框样式 */
.merchant-details {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  color: #2196f3;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e3f2fd;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  min-height: 28px;
}

.detail-label {
  font-weight: 500;
  color: #666;
  width: 100px;
  flex-shrink: 0;
}

.detail-value {
  color: #333;
  flex: 1;
  word-break: break-all;
}

/* 芯片颜色 */
.md-chip.md-success {
  background-color: #4caf50 !important;
  color: white !important;
}

.md-chip.md-warning {
  background-color: #ff9800 !important;
  color: white !important;
}

.md-chip.md-danger {
  background-color: #f44336 !important;
  color: white !important;
}

.md-chip.md-accent {
  background-color: #e91e63 !important;
  color: white !important;
}

.md-chip.md-info {
  background-color: #2196f3 !important;
  color: white !important;
}

.md-chip.md-default {
  background-color: #9e9e9e !important;
  color: white !important;
}

/* 对话框样式 */
::v-deep .md-dialog {
  max-width: 800px;
  width: 90%;
}

::v-deep .md-dialog-title {
  display: flex;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e0e0e0;
}

::v-deep .md-dialog-content {
  padding: 0 !important;
}

::v-deep .md-dialog-actions {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  justify-content: flex-end;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .store-logo {
    width: 40px;
    height: 40px;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  
  .detail-label {
    width: auto;
    margin-bottom: 4px;
    font-size: 14px;
  }
  
  ::v-deep .md-dialog {
    width: 95%;
    max-width: none;
  }
}
</style>

