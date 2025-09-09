<template>
  <div class="md-layout">
    <div class="md-layout-item md-size-100">
      <md-card>
        <md-card-header class="md-card-header-icon md-card-header-green">
          <div class="card-icon">
            <md-icon>store</md-icon>
          </div>
          <h4 class="title">商品管理</h4>
        </md-card-header>
        <md-card-content>
          <div class="text-right" style="margin-bottom: 20px;">
            <md-button 
              class="md-primary md-dense" 
              @click="handleCreateProduct"
              v-if="hasPermission('products', 'create')"
            >
              添加商品
            </md-button>
          </div>
          
          <!-- 筛选器 -->
          <div class="md-layout" style="margin-bottom: 20px;">
            <div class="md-layout-item md-size-25">
              <md-field>
                <label>商品状态</label>
                <md-select v-model="filters.status" name="status">
                  <md-option value="">全部状态</md-option>
                  <md-option value="active">上架</md-option>
                  <md-option value="inactive">下架</md-option>
                  <md-option value="draft">草稿</md-option>
                </md-select>
              </md-field>
            </div>
            <div class="md-layout-item md-size-25">
              <md-field>
                <label>商品分类</label>
                <md-select v-model="filters.category" name="category">
                  <md-option value="">全部分类</md-option>
                  <md-option value="electronics">电子产品</md-option>
                  <md-option value="clothing">服装</md-option>
                  <md-option value="books">图书</md-option>
                  <md-option value="home">家居</md-option>
                </md-select>
              </md-field>
            </div>
            <div class="md-layout-item md-size-25">
              <md-field>
                <label>价格范围</label>
                <md-select v-model="filters.priceRange" name="priceRange">
                  <md-option value="">全部价格</md-option>
                  <md-option value="0-50">0-50元</md-option>
                  <md-option value="50-200">50-200元</md-option>
                  <md-option value="200-500">200-500元</md-option>
                  <md-option value="500+">500元以上</md-option>
                </md-select>
              </md-field>
            </div>
          </div>

          <md-table
            :value="filteredProducts"
            :md-sort.sync="sortation.field"
            :md-sort-order.sync="sortation.order"
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
              <md-table-cell md-label="商品图片" md-sort-by="image">
                <div class="product-image-cell">
                  <img 
                    :src="item.image || '/img/placeholder.jpg'" 
                    :alt="item.name"
                    class="product-img"
                    @error="handleImageError"
                  />
                </div>
              </md-table-cell>
              <md-table-cell md-label="商品名称" md-sort-by="name">
                <div class="product-name">{{ item.name }}</div>
                <div class="product-sku">SKU: {{ item.sku }}</div>
              </md-table-cell>
              <md-table-cell md-label="分类" md-sort-by="category">
                {{ getCategoryText(item.category) }}
              </md-table-cell>
              <md-table-cell md-label="价格" md-sort-by="price">
                <span class="price-text">¥{{ item.price.toFixed(2) }}</span>
              </md-table-cell>
              <md-table-cell md-label="库存" md-sort-by="stock">
                <md-chip :class="getStockClass(item.stock)">
                  {{ item.stock }}
                </md-chip>
              </md-table-cell>
              <md-table-cell md-label="状态" md-sort-by="status">
                <md-chip :class="getStatusClass(item.status)">
                  {{ getStatusText(item.status) }}
                </md-chip>
              </md-table-cell>
              <md-table-cell md-label="销量" md-sort-by="sales">
                {{ item.sales }}
              </md-table-cell>
              <md-table-cell md-label="创建时间" md-sort-by="createdAt">
                {{ formatDate(item.createdAt) }}
              </md-table-cell>
              <md-table-cell md-label="操作">
                <md-button
                  class="md-icon-button md-raised md-round md-info"
                  @click="handleEdit(item)"
                  style="margin: 0.2rem"
                  v-if="hasPermission('products', 'edit')"
                  :title="'编辑商品'"
                >
                  <md-icon>edit</md-icon>
                </md-button>
                <md-button
                  class="md-icon-button md-raised md-round md-danger"
                  @click="handleDelete(item)"
                  style="margin: 0.2rem"
                  v-if="hasPermission('products', 'delete')"
                  :title="'删除商品'"
                >
                  <md-icon>delete</md-icon>
                </md-button>
                <md-button
                  class="md-icon-button md-raised md-round"
                  :class="item.status === 'active' ? 'md-warning' : 'md-success'"
                  @click="toggleProductStatus(item)"
                  style="margin: 0.2rem"
                  v-if="hasPermission('products', 'edit')"
                  :title="item.status === 'active' ? '下架商品' : '上架商品'"
                >
                  <md-icon>{{ item.status === 'active' ? 'remove_circle' : 'add_circle' }}</md-icon>
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
  </div>
</template>

<script>
import Pagination from "@/components/Pagination";
import permissionsMixin from "@/mixins/permissions";

export default {
  name: "ProductList",
  components: {
    pagination: Pagination,
  },
  mixins: [permissionsMixin],

  data: () => ({
    products: [],
    filters: {
      status: '',
      category: '',
      priceRange: ''
    },
    sortation: {
      field: "createdAt",
      order: "desc",
    },
    pagination: {
      perPage: 10,
      currentPage: 1,
      perPageOptions: [5, 10, 25, 50],
    },
  }),

  computed: {
    filteredProducts() {
      let filtered = this.products;

      // 状态过滤
      if (this.filters.status) {
        filtered = filtered.filter(item => item.status === this.filters.status);
      }

      // 分类过滤
      if (this.filters.category) {
        filtered = filtered.filter(item => item.category === this.filters.category);
      }

      // 价格过滤
      if (this.filters.priceRange) {
        filtered = filtered.filter(item => {
          const price = item.price;
          switch (this.filters.priceRange) {
            case '0-50':
              return price >= 0 && price <= 50;
            case '50-200':
              return price > 50 && price <= 200;
            case '200-500':
              return price > 200 && price <= 500;
            case '500+':
              return price > 500;
            default:
              return true;
          }
        });
      }

      return filtered;
    },

    filteredTotal() {
      return this.filteredProducts.length;
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
    this.checkPermissions();
    this.getProducts();
  },

  methods: {
    checkPermissions() {
      if (!this.hasPermission('products', 'view')) {
        this.handleUnauthorized('您没有权限查看商品列表');
        this.$router.push('/dashboard');
        return;
      }
    },

    getProducts() {
      // 模拟商品数据
      this.products = [
        {
          id: 1,
          name: "iPhone 14 Pro",
          sku: "IP14P001",
          category: "electronics",
          price: 7999,
          stock: 50,
          status: "active",
          sales: 120,
          image: "/img/product1.jpg",
          createdAt: "2025-08-15T10:30:00Z"
        },
        {
          id: 2,
          name: "经典白衬衫",
          sku: "CLO001",
          category: "clothing",
          price: 199,
          stock: 5,
          status: "active",
          sales: 80,
          image: "/img/product2.jpg",
          createdAt: "2025-08-20T14:20:00Z"
        },
        {
          id: 3,
          name: "JavaScript高级程序设计",
          sku: "BOOK001",
          category: "books",
          price: 89,
          stock: 0,
          status: "inactive",
          sales: 200,
          image: "/img/product3.jpg",
          createdAt: "2025-08-25T09:15:00Z"
        }
      ];
    },

    handleCreateProduct() {
      if (!this.hasPermission('products', 'create')) {
        this.handleUnauthorized('您没有权限创建商品');
        return;
      }
      this.$store.dispatch("alerts/success", "功能开发中，敬请期待");
    },

    handleEdit(product) {
      if (!this.hasPermission('products', 'edit')) {
        this.handleUnauthorized('您没有权限编辑商品');
        return;
      }
      this.$store.dispatch("alerts/success", `编辑商品: ${product.name} (功能开发中)`);
    },

    handleDelete(product) {
      if (!this.hasPermission('products', 'delete')) {
        this.handleUnauthorized('您没有权限删除商品');
        return;
      }
      this.$store.dispatch("alerts/success", `删除商品: ${product.name} (功能开发中)`);
    },

    toggleProductStatus(product) {
      if (!this.hasPermission('products', 'edit')) {
        this.handleUnauthorized('您没有权限修改商品状态');
        return;
      }
      
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      product.status = newStatus;
      
      this.$store.dispatch("alerts/success", 
        `商品 ${product.name} 已${newStatus === 'active' ? '上架' : '下架'}`
      );
    },

    getCategoryText(category) {
      const categoryTexts = {
        'electronics': '电子产品',
        'clothing': '服装',
        'books': '图书',
        'home': '家居'
      };
      return categoryTexts[category] || category;
    },

    getStatusText(status) {
      const statusTexts = {
        'active': '上架',
        'inactive': '下架',
        'draft': '草稿'
      };
      return statusTexts[status] || status;
    },

    getStatusClass(status) {
      const statusClasses = {
        'active': 'md-success',
        'inactive': 'md-warning',
        'draft': 'md-default'
      };
      return statusClasses[status] || 'md-default';
    },

    getStockClass(stock) {
      if (stock === 0) return 'md-danger';
      if (stock <= 10) return 'md-warning';
      return 'md-success';
    },

    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    },

    handleImageError(event) {
      event.target.src = '/img/placeholder.jpg';
    },
  },
};
</script>

<style scoped>
.product-image-cell {
  display: flex;
  align-items: center;
}

.product-img {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #e0e0e0;
}

.product-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.product-sku {
  font-size: 12px;
  color: #666;
  font-family: 'Courier New', monospace;
}

.price-text {
  font-weight: 500;
  color: #e91e63;
  font-size: 14px;
}

.md-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .product-img {
    width: 40px;
    height: 40px;
  }
  
  .product-name {
    font-size: 13px;
  }
  
  .product-sku {
    font-size: 11px;
  }
}
</style>
