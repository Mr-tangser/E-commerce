<template>
  <div class="md-layout">
    <div class="md-layout-item md-size-100">
      <md-card>
        <md-card-header class="md-card-header-icon md-card-header-green">
          <div class="card-icon">
            <md-icon>receipt</md-icon>
          </div>
          <h4 class="title">订单管理</h4>
        </md-card-header>
        <md-card-content>
          <!-- 筛选器 -->
          <div class="md-layout" style="margin-bottom: 20px;">
            <div class="md-layout-item md-size-20">
              <md-field>
                <label>订单状态</label>
                <md-select v-model="filters.status" name="status">
                  <md-option value="">全部状态</md-option>
                  <md-option value="pending">待付款</md-option>
                  <md-option value="paid">已付款</md-option>
                  <md-option value="shipped">已发货</md-option>
                  <md-option value="delivered">已送达</md-option>
                  <md-option value="cancelled">已取消</md-option>
                  <md-option value="refunded">已退款</md-option>
                </md-select>
              </md-field>
            </div>
            <div class="md-layout-item md-size-20">
              <md-field>
                <label>支付方式</label>
                <md-select v-model="filters.paymentMethod" name="paymentMethod">
                  <md-option value="">全部方式</md-option>
                  <md-option value="alipay">支付宝</md-option>
                  <md-option value="wechat">微信支付</md-option>
                  <md-option value="bank">银行卡</md-option>
                  <md-option value="cod">货到付款</md-option>
                </md-select>
              </md-field>
            </div>
            <div class="md-layout-item md-size-20">
              <md-field>
                <label>订单金额</label>
                <md-select v-model="filters.amountRange" name="amountRange">
                  <md-option value="">全部金额</md-option>
                  <md-option value="0-100">0-100元</md-option>
                  <md-option value="100-500">100-500元</md-option>
                  <md-option value="500-1000">500-1000元</md-option>
                  <md-option value="1000+">1000元以上</md-option>
                </md-select>
              </md-field>
            </div>
            <div class="md-layout-item md-size-20">
              <md-field>
                <label>时间范围</label>
                <md-select v-model="filters.timeRange" name="timeRange">
                  <md-option value="">全部时间</md-option>
                  <md-option value="today">今天</md-option>
                  <md-option value="week">本周</md-option>
                  <md-option value="month">本月</md-option>
                  <md-option value="quarter">本季度</md-option>
                </md-select>
              </md-field>
            </div>
          </div>

          <md-table
            :value="filteredOrders"
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
              <md-table-cell md-label="订单号" md-sort-by="orderNumber">
                <div class="order-number">{{ item.orderNumber }}</div>
                <div class="order-time">{{ formatDate(item.createdAt) }}</div>
              </md-table-cell>
              <md-table-cell md-label="客户信息" md-sort-by="customer">
                <div class="customer-info">
                  <div class="customer-name">{{ item.customer.name }}</div>
                  <div class="customer-phone">{{ item.customer.phone }}</div>
                </div>
              </md-table-cell>
              <md-table-cell md-label="商品信息" md-sort-by="items">
                <div class="order-items">
                  <div v-for="orderItem in item.items.slice(0, 2)" :key="orderItem.id" class="item-row">
                    {{ orderItem.productName }} x{{ orderItem.quantity }}
                  </div>
                  <div v-if="item.items.length > 2" class="more-items">
                    +{{ item.items.length - 2 }}件商品
                  </div>
                </div>
              </md-table-cell>
              <md-table-cell md-label="订单金额" md-sort-by="totalAmount">
                <div class="amount-info">
                  <div class="total-amount">¥{{ item.totalAmount.toFixed(2) }}</div>
                  <div class="payment-method">{{ getPaymentMethodText(item.paymentMethod) }}</div>
                </div>
              </md-table-cell>
              <md-table-cell md-label="订单状态" md-sort-by="status">
                <md-chip :class="getStatusClass(item.status)">
                  {{ getStatusText(item.status) }}
                </md-chip>
              </md-table-cell>
              <md-table-cell md-label="配送地址" md-sort-by="shippingAddress">
                <div class="address-info" :title="getFullAddress(item.shippingAddress)">
                  {{ getTruncatedAddress(item.shippingAddress) }}
                </div>
              </md-table-cell>
              <md-table-cell md-label="操作">
                <md-button
                  class="md-icon-button md-raised md-round md-info"
                  @click="viewOrderDetails(item)"
                  style="margin: 0.2rem"
                  :title="'查看详情'"
                >
                  <md-icon>visibility</md-icon>
                </md-button>
                <md-button
                  class="md-icon-button md-raised md-round md-primary"
                  @click="handleEditOrder(item)"
                  style="margin: 0.2rem"
                  v-if="hasPermission('orders', 'edit')"
                  :title="'编辑订单'"
                >
                  <md-icon>edit</md-icon>
                </md-button>
                <md-button
                  class="md-icon-button md-raised md-round md-success"
                  @click="updateOrderStatus(item)"
                  style="margin: 0.2rem"
                  v-if="hasPermission('orders', 'edit') && canUpdateStatus(item.status)"
                  :title="'更新状态'"
                >
                  <md-icon>update</md-icon>
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
  name: "OrderList",
  components: {
    pagination: Pagination,
  },
  mixins: [permissionsMixin],

  data: () => ({
    orders: [],
    filters: {
      status: '',
      paymentMethod: '',
      amountRange: '',
      timeRange: ''
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
    filteredOrders() {
      let filtered = this.orders;

      // 状态过滤
      if (this.filters.status) {
        filtered = filtered.filter(item => item.status === this.filters.status);
      }

      // 支付方式过滤
      if (this.filters.paymentMethod) {
        filtered = filtered.filter(item => item.paymentMethod === this.filters.paymentMethod);
      }

      // 金额过滤
      if (this.filters.amountRange) {
        filtered = filtered.filter(item => {
          const amount = item.totalAmount;
          switch (this.filters.amountRange) {
            case '0-100':
              return amount >= 0 && amount <= 100;
            case '100-500':
              return amount > 100 && amount <= 500;
            case '500-1000':
              return amount > 500 && amount <= 1000;
            case '1000+':
              return amount > 1000;
            default:
              return true;
          }
        });
      }

      return filtered;
    },

    filteredTotal() {
      return this.filteredOrders.length;
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
    this.getOrders();
  },

  methods: {
    checkPermissions() {
      if (!this.hasPermission('orders', 'view')) {
        this.handleUnauthorized('您没有权限查看订单列表');
        this.$router.push('/dashboard');
        return;
      }
    },

    getOrders() {
      // 模拟订单数据
      this.orders = [
        {
          id: 1,
          orderNumber: "ORD20250907001",
          customer: {
            name: "张三",
            phone: "13800138000",
            email: "zhangsan@example.com"
          },
          items: [
            { id: 1, productName: "iPhone 14 Pro", quantity: 1, price: 7999 },
            { id: 2, productName: "AirPods Pro", quantity: 1, price: 1999 }
          ],
          totalAmount: 9998,
          status: "paid",
          paymentMethod: "alipay",
          shippingAddress: {
            province: "北京市",
            city: "北京市",
            district: "朝阳区",
            detail: "三里屯街道工人体育场北路8号院1号楼",
            zipCode: "100027"
          },
          createdAt: "2025-09-07T09:30:00Z"
        },
        {
          id: 2,
          orderNumber: "ORD20250907002",
          customer: {
            name: "李四",
            phone: "13900139000",
            email: "lisi@example.com"
          },
          items: [
            { id: 3, productName: "经典白衬衫", quantity: 2, price: 199 }
          ],
          totalAmount: 398,
          status: "shipped",
          paymentMethod: "wechat",
          shippingAddress: {
            province: "上海市",
            city: "上海市",
            district: "浦东新区",
            detail: "陆家嘴环路1000号恒生银行大厦",
            zipCode: "200120"
          },
          createdAt: "2025-09-06T14:20:00Z"
        },
        {
          id: 3,
          orderNumber: "ORD20250907003",
          customer: {
            name: "王五",
            phone: "13700137000",
            email: "wangwu@example.com"
          },
          items: [
            { id: 4, productName: "JavaScript高级程序设计", quantity: 1, price: 89 },
            { id: 5, productName: "Vue.js实战", quantity: 1, price: 79 },
            { id: 6, productName: "Node.js开发指南", quantity: 1, price: 69 }
          ],
          totalAmount: 237,
          status: "pending",
          paymentMethod: "bank",
          shippingAddress: {
            province: "广东省",
            city: "深圳市",
            district: "南山区",
            detail: "科技园南区深南大道10000号腾讯大厦",
            zipCode: "518057"
          },
          createdAt: "2025-09-05T16:45:00Z"
        }
      ];
    },

    viewOrderDetails(order) {
      // 显示订单详情
      const itemsList = order.items.map(item => 
        `• ${item.productName} x${item.quantity} - ¥${item.price}`
      ).join('\n');
      
      const details = `
        订单号: ${order.orderNumber}
        客户: ${order.customer.name} (${order.customer.phone})
        商品明细:
        ${itemsList}
        
        订单金额: ¥${order.totalAmount.toFixed(2)}
        支付方式: ${this.getPaymentMethodText(order.paymentMethod)}
        订单状态: ${this.getStatusText(order.status)}
        配送地址: ${this.getFullAddress(order.shippingAddress)}
        下单时间: ${this.formatDate(order.createdAt)}
      `;
      
      import('sweetalert2').then(Swal => {
        Swal.default.fire({
          title: '订单详情',
          html: `<pre style="text-align: left; white-space: pre-wrap; font-family: Arial;">${details}</pre>`,
          icon: 'info',
          showCloseButton: true,
          confirmButtonText: '确定',
          confirmButtonColor: '#2196f3',
          width: '600px'
        });
      });
    },

    handleEditOrder(order) {
      if (!this.hasPermission('orders', 'edit')) {
        this.handleUnauthorized('您没有权限编辑订单');
        return;
      }
      this.$store.dispatch("alerts/success", `编辑订单: ${order.orderNumber} (功能开发中)`);
    },

    updateOrderStatus(order) {
      if (!this.hasPermission('orders', 'edit')) {
        this.handleUnauthorized('您没有权限更新订单状态');
        return;
      }
      
      // 简单的状态流转逻辑
      const statusFlow = {
        'pending': 'paid',
        'paid': 'shipped',
        'shipped': 'delivered'
      };
      
      const newStatus = statusFlow[order.status];
      if (newStatus) {
        order.status = newStatus;
        this.$store.dispatch("alerts/success", 
          `订单 ${order.orderNumber} 状态已更新为: ${this.getStatusText(newStatus)}`
        );
      }
    },

    canUpdateStatus(status) {
      // 只有特定状态可以更新
      return ['pending', 'paid', 'shipped'].includes(status);
    },

    getStatusText(status) {
      const statusTexts = {
        'pending': '待付款',
        'paid': '已付款',
        'shipped': '已发货',
        'delivered': '已送达',
        'cancelled': '已取消',
        'refunded': '已退款'
      };
      return statusTexts[status] || status;
    },

    getStatusClass(status) {
      const statusClasses = {
        'pending': 'md-warning',
        'paid': 'md-primary',
        'shipped': 'md-info',
        'delivered': 'md-success',
        'cancelled': 'md-default',
        'refunded': 'md-accent'
      };
      return statusClasses[status] || 'md-default';
    },

    getPaymentMethodText(method) {
      const methodTexts = {
        'alipay': '支付宝',
        'wechat': '微信支付',
        'bank': '银行卡',
        'cod': '货到付款'
      };
      return methodTexts[method] || method;
    },

    getFullAddress(address) {
      if (!address) return '';
      return `${address.province}${address.city}${address.district}${address.detail}`;
    },

    getTruncatedAddress(address) {
      const fullAddress = this.getFullAddress(address);
      return fullAddress.length > 20 ? fullAddress.substring(0, 18) + '...' : fullAddress;
    },

    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    },
  },
};
</script>

<style scoped>
.order-number {
  font-weight: 500;
  color: #333;
  font-family: 'Courier New', monospace;
}

.order-time {
  font-size: 12px;
  color: #666;
}

.customer-info .customer-name {
  font-weight: 500;
  color: #333;
}

.customer-info .customer-phone {
  font-size: 12px;
  color: #666;
  font-family: 'Courier New', monospace;
}

.order-items .item-row {
  font-size: 13px;
  color: #555;
  margin-bottom: 2px;
}

.order-items .more-items {
  font-size: 12px;
  color: #999;
  font-style: italic;
}

.amount-info .total-amount {
  font-weight: 500;
  color: #e91e63;
  font-size: 14px;
}

.amount-info .payment-method {
  font-size: 12px;
  color: #666;
}

.address-info {
  font-size: 13px;
  color: #555;
  cursor: help;
  max-width: 150px;
  word-break: break-all;
}

.address-info:hover {
  color: #2196f3;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .order-items .item-row {
    font-size: 12px;
  }
  
  .customer-info .customer-name {
    font-size: 13px;
  }
  
  .address-info {
    max-width: 100px;
    font-size: 12px;
  }
}
</style>
