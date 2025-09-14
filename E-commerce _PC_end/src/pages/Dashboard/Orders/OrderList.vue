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
          <!-- 导入导出按钮 -->
          <div class="text-right" style="margin-bottom: 20px;">
            <md-button class="md-success md-dense" @click="exportToExcel" style="margin-right: 10px;">
              <md-icon>file_download</md-icon>
              导出Excel
            </md-button>
            <md-button class="md-info md-dense" @click="exportToPDF" style="margin-right: 10px;">
              <md-icon>picture_as_pdf</md-icon>
              导出PDF
            </md-button>
            <md-button class="md-warning md-dense" @click="importFromExcel" style="margin-right: 10px;">
              <md-icon>file_upload</md-icon>
              导入Excel
            </md-button>
            <md-button class="md-accent md-dense" @click="downloadTemplate">
              <md-icon>get_app</md-icon>
              下载模板
            </md-button>
          </div>
          
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
            :value="paginatedOrders"
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

    <!-- 文件导入对话框 -->
    <md-dialog :md-active.sync="showImportDialog" :md-fullscreen="false" :md-backdrop="true">
      <md-dialog-title>导入订单数据</md-dialog-title>
      <md-dialog-content style="padding: 24px; min-width: 400px;">
        <div class="import-area">
          <input 
            ref="fileInput" 
            type="file" 
            accept=".xlsx,.xls" 
            @change="handleFileSelect" 
            style="display: none;"
          />
          <div 
            class="file-drop-zone" 
            :class="{ 'drag-over': isDragOver }"
            @click="$refs.fileInput.click()"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @drop.prevent="handleFileDrop"
          >
            <md-icon class="upload-icon">cloud_upload</md-icon>
            <p>点击选择文件或将Excel文件拖拽到此处</p>
            <p class="file-info">支持 .xlsx 和 .xls 格式</p>
            <p class="template-info">
              <md-button class="md-dense md-accent" @click="downloadTemplate">
                下载导入模板
              </md-button>
            </p>
          </div>
          <div v-if="selectedFile" class="selected-file">
            <md-icon>description</md-icon>
            <span>{{ selectedFile.name }}</span>
            <md-button class="md-icon-button" @click="clearFile">
              <md-icon>close</md-icon>
            </md-button>
          </div>
          <div v-if="importProgress.show" class="import-progress">
            <md-progress-bar :md-value="importProgress.value"></md-progress-bar>
            <p>{{ importProgress.text }}</p>
          </div>
        </div>
      </md-dialog-content>
      <md-dialog-actions>
        <md-button @click="closeImportDialog">取消</md-button>
        <md-button 
          class="md-primary md-raised" 
          @click="processImport" 
          :disabled="!selectedFile || importProgress.show"
        >
          开始导入
        </md-button>
      </md-dialog-actions>
    </md-dialog>
  </div>
</template>

<script>
import Pagination from "@/components/Pagination";
import permissionsMixin from "@/mixins/permissions";
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

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

    // 导入导出相关数据
    showImportDialog: false,
    selectedFile: null,
    isDragOver: false,
    importProgress: {
      show: false,
      value: 0,
      text: ''
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

      // 时间过滤
      if (this.filters.timeRange) {
        const now = new Date();
        let startDate;
        
        switch (this.filters.timeRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarter':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            break;
        }
        
        if (startDate) {
          filtered = filtered.filter(item => 
            new Date(item.createdAt) >= startDate
          );
        }
      }

      return filtered;
    },

    // 分页后的订单数据
    paginatedOrders() {
      const start = this.from;
      const end = start + this.pagination.perPage;
      return this.filteredOrders.slice(start, end);
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

  watch: {
    // 监听筛选条件变化，重置到第一页
    filters: {
      handler() {
        this.pagination.currentPage = 1;
      },
      deep: true
    },
    
    // 监听每页显示数量变化，重置到第一页
    'pagination.perPage'() {
      this.pagination.currentPage = 1;
    }
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
        },
        {
          id: 4,
          orderNumber: "ORD20250908004",
          customer: {
            name: "赵六",
            phone: "15612345678",
            email: "zhaoliu@example.com"
          },
          items: [
            { id: 7, productName: "MacBook Pro 16英寸", quantity: 1, price: 19999 },
            { id: 8, productName: "Magic Mouse", quantity: 1, price: 749 },
            { id: 9, productName: "USB-C转换器", quantity: 2, price: 499 }
          ],
          totalAmount: 21747,
          status: "delivered",
          paymentMethod: "alipay",
          shippingAddress: {
            province: "浙江省",
            city: "杭州市",
            district: "西湖区",
            detail: "文三路477号华星科技大厦A座2201室",
            zipCode: "310013"
          },
          createdAt: "2025-09-04T11:15:00Z"
        },
        {
          id: 5,
          orderNumber: "ORD20250908005",
          customer: {
            name: "孙七",
            phone: "17788889999",
            email: "sunqi@example.com"
          },
          items: [
            { id: 10, productName: "雅诗兰黛小棕瓶精华", quantity: 1, price: 880 },
            { id: 11, productName: "SK-II神仙水", quantity: 1, price: 1690 },
            { id: 12, productName: "兰蔻小黑瓶精华", quantity: 1, price: 1150 }
          ],
          totalAmount: 3720,
          status: "cancelled",
          paymentMethod: "wechat",
          shippingAddress: {
            province: "四川省",
            city: "成都市",
            district: "锦江区",
            detail: "春熙路步行街太古里T1-3F",
            zipCode: "610021"
          },
          createdAt: "2025-09-03T20:30:00Z"
        },
        {
          id: 6,
          orderNumber: "ORD20250909006",
          customer: {
            name: "周八",
            phone: "13333666999",
            email: "zhouba@example.com"
          },
          items: [
            { id: 13, productName: "Nike Air Force 1", quantity: 1, price: 899 },
            { id: 14, productName: "Adidas三叶草卫衣", quantity: 1, price: 699 },
            { id: 15, productName: "Champion帽子", quantity: 2, price: 199 }
          ],
          totalAmount: 1996,
          status: "refunded",
          paymentMethod: "bank",
          shippingAddress: {
            province: "江苏省",
            city: "南京市",
            district: "鼓楼区",
            detail: "汉中路1号紫峰大厦B座1808室",
            zipCode: "210008"
          },
          createdAt: "2025-09-02T14:45:00Z"
        },
        {
          id: 7,
          orderNumber: "ORD20250910007",
          customer: {
            name: "吴九",
            phone: "18800112233",
            email: "wujiu@example.com"
          },
          items: [
            { id: 16, productName: "小米13 Pro", quantity: 1, price: 4999 },
            { id: 17, productName: "小米无线耳机", quantity: 1, price: 399 },
            { id: 18, productName: "小米充电宝20000mAh", quantity: 1, price: 149 }
          ],
          totalAmount: 5547,
          status: "shipped",
          paymentMethod: "alipay",
          shippingAddress: {
            province: "湖北省",
            city: "武汉市",
            district: "武昌区",
            detail: "中南路99号保利广场写字楼A座15层",
            zipCode: "430071"
          },
          createdAt: "2025-09-01T08:20:00Z"
        },
        {
          id: 8,
          orderNumber: "ORD20250911008",
          customer: {
            name: "郑十",
            phone: "19966778899",
            email: "zhengshi@example.com"
          },
          items: [
            { id: 19, productName: "戴森V15吸尘器", quantity: 1, price: 4990 },
            { id: 20, productName: "戴森卷发棒", quantity: 1, price: 3690 }
          ],
          totalAmount: 8680,
          status: "paid",
          paymentMethod: "cod",
          shippingAddress: {
            province: "山东省",
            city: "青岛市",
            district: "市南区",
            detail: "香港中路40号数码港大厦20楼",
            zipCode: "266071"
          },
          createdAt: "2025-08-31T16:30:00Z"
        },
        {
          id: 9,
          orderNumber: "ORD20250912009",
          customer: {
            name: "冯十一",
            phone: "13655558888",
            email: "fengshiyi@example.com"
          },
          items: [
            { id: 21, productName: "乐高建筑系列-自由女神像", quantity: 1, price: 899 },
            { id: 22, productName: "乐高科技系列-兰博基尼", quantity: 1, price: 2999 },
            { id: 23, productName: "乐高创意系列-花束", quantity: 2, price: 399 }
          ],
          totalAmount: 4696,
          status: "delivered",
          paymentMethod: "wechat",
          shippingAddress: {
            province: "福建省",
            city: "厦门市",
            district: "思明区",
            detail: "观音山商务中心18号楼11层A室",
            zipCode: "361008"
          },
          createdAt: "2025-08-30T13:15:00Z"
        },
        {
          id: 10,
          orderNumber: "ORD20250913010",
          customer: {
            name: "陈十二",
            phone: "15299887766",
            email: "chenshier@example.com"
          },
          items: [
            { id: 24, productName: "松下电饭煲IH加热", quantity: 1, price: 2899 },
            { id: 25, productName: "九阳豆浆机", quantity: 1, price: 199 },
            { id: 26, productName: "美的微波炉", quantity: 1, price: 599 },
            { id: 27, productName: "苏泊尔不锈钢锅具套装", quantity: 1, price: 899 }
          ],
          totalAmount: 4596,
          status: "pending",
          paymentMethod: "bank",
          shippingAddress: {
            province: "河南省",
            city: "郑州市",
            district: "金水区",
            detail: "花园路与农业路交叉口国贸中心A座2201",
            zipCode: "450008"
          },
          createdAt: "2025-08-29T10:45:00Z"
        },
        {
          id: 11,
          orderNumber: "ORD20250914011",
          customer: {
            name: "韩十三",
            phone: "18677889900",
            email: "hanshisan@example.com"
          },
          items: [
            { id: 28, productName: "Kindle Oasis", quantity: 1, price: 2399 },
            { id: 29, productName: "《百年孤独》", quantity: 1, price: 39 },
            { id: 30, productName: "《人类简史》", quantity: 1, price: 55 },
            { id: 31, productName: "得力文具套装", quantity: 3, price: 89 }
          ],
          totalAmount: 2760,
          status: "shipped",
          paymentMethod: "alipay",
          shippingAddress: {
            province: "陕西省",
            city: "西安市",
            district: "雁塔区",
            detail: "科技路195号世纪颐园写字楼C座808室",
            zipCode: "710075"
          },
          createdAt: "2025-08-28T09:00:00Z"
        },
        {
          id: 12,
          orderNumber: "ORD20250915012",
          customer: {
            name: "曹十四",
            phone: "13788990011",
            email: "caoshisi@example.com"
          },
          items: [
            { id: 32, productName: "华为MateBook X Pro", quantity: 1, price: 9999 },
            { id: 33, productName: "华为FreeBuds Pro 2", quantity: 1, price: 1399 },
            { id: 34, productName: "华为智能手表GT3", quantity: 1, price: 1688 }
          ],
          totalAmount: 13086,
          status: "paid",
          paymentMethod: "wechat",
          shippingAddress: {
            province: "重庆市",
            city: "重庆市",
            district: "渝中区",
            detail: "解放碑步行街时代广场22楼2206室",
            zipCode: "400010"
          },
          createdAt: "2025-08-27T15:20:00Z"
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

    // ========== 导入导出相关方法 ==========
    
    // 显示导入对话框
    importFromExcel() {
      this.showImportDialog = true;
      this.selectedFile = null;
      this.importProgress = { show: false, value: 0, text: '' };
    },

    // 关闭导入对话框
    closeImportDialog() {
      this.showImportDialog = false;
      this.selectedFile = null;
      this.importProgress = { show: false, value: 0, text: '' };
    },

    // 处理文件选择
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        this.validateAndSetFile(file);
      }
    },

    // 处理文件拖放
    handleFileDrop(event) {
      this.isDragOver = false;
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        this.validateAndSetFile(files[0]);
      }
    },

    // 验证并设置文件
    validateAndSetFile(file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!validTypes.includes(file.type)) {
        this.$store.dispatch("alerts/error", "请选择有效的Excel文件（.xlsx或.xls格式）");
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        this.$store.dispatch("alerts/error", "文件大小不能超过10MB");
        return;
      }
      
      this.selectedFile = file;
    },

    // 清除选中的文件
    clearFile() {
      this.selectedFile = null;
      this.$refs.fileInput.value = '';
    },

    // 处理Excel导入
    async processImport() {
      if (!this.selectedFile) {
        this.$store.dispatch("alerts/error", "请先选择文件");
        return;
      }

      this.importProgress = { show: true, value: 50, text: '正在处理文件...' };

      // 简化的导入逻辑
      setTimeout(() => {
        this.importProgress = { show: true, value: 100, text: '导入完成！' };
        
        setTimeout(() => {
          this.closeImportDialog();
          this.$store.dispatch("alerts/success", "Excel订单导入功能演示完成");
        }, 1000);
      }, 2000);
    },

    // 导出到Excel
    exportToExcel() {
      try {
        const exportData = this.prepareExportData();
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // 设置列宽
        const colWidths = [
          { wch: 18 }, // 订单号
          { wch: 15 }, // 客户姓名
          { wch: 15 }, // 客户电话
          { wch: 30 }, // 商品信息
          { wch: 12 }, // 订单金额
          { wch: 12 }, // 支付方式
          { wch: 10 }, // 订单状态
          { wch: 25 }, // 配送地址
          { wch: 18 }  // 下单时间
        ];
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '订单列表');
        
        const fileName = `订单数据_${this.formatDateForFile(new Date())}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        this.$store.dispatch("alerts/success", "Excel文件导出成功");
      } catch (error) {
        console.error('Excel导出失败:', error);
        this.$store.dispatch("alerts/error", "Excel导出失败");
      }
    },

    // 导出到PDF
    async exportToPDF() {
      try {
        const htmlContent = this.generateHTMLReport();
        
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        element.style.padding = '20px';
        element.style.fontFamily = 'Microsoft YaHei, SimSun, sans-serif';
        element.style.fontSize = '12px';
        
        const opt = {
          margin: 10,
          filename: `订单管理报表_${this.formatDateForFile(new Date())}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        
        await html2pdf().set(opt).from(element).save();
        
        this.$store.dispatch("alerts/success", "PDF文件导出成功");
      } catch (error) {
        console.error('PDF导出失败:', error);
        this.$store.dispatch("alerts/error", `PDF导出失败: ${error.message}`);
      }
    },

    // 准备导出数据
    prepareExportData() {
      return this.filteredOrders.map(item => ({
        '订单号': item.orderNumber,
        '客户姓名': item.customer.name,
        '客户电话': item.customer.phone,
        '商品信息': item.items.map(orderItem => 
          `${orderItem.productName} x${orderItem.quantity}`
        ).join('; '),
        '订单金额': `¥${item.totalAmount.toFixed(2)}`,
        '支付方式': this.getPaymentMethodText(item.paymentMethod),
        '订单状态': this.getStatusText(item.status),
        '配送地址': this.getFullAddress(item.shippingAddress),
        '下单时间': this.formatDate(item.createdAt)
      }));
    },

    // 生成HTML报表内容
    generateHTMLReport() {
      const exportData = this.prepareExportData();
      
      let html = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin-bottom: 10px;">订单管理报表</h1>
          <p style="color: #666; margin: 5px 0;">导出时间：${this.formatDate(new Date())}</p>
          <p style="color: #666; margin: 5px 0;">总数量：${this.filteredOrders.length} 条记录</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background-color: #4caf50; color: white;">
              <th style="border: 1px solid #ddd; padding: 8px;">订单号</th>
              <th style="border: 1px solid #ddd; padding: 8px;">客户姓名</th>
              <th style="border: 1px solid #ddd; padding: 8px;">客户电话</th>
              <th style="border: 1px solid #ddd; padding: 8px;">商品信息</th>
              <th style="border: 1px solid #ddd; padding: 8px;">订单金额</th>
              <th style="border: 1px solid #ddd; padding: 8px;">支付方式</th>
              <th style="border: 1px solid #ddd; padding: 8px;">订单状态</th>
              <th style="border: 1px solid #ddd; padding: 8px;">下单时间</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      exportData.forEach((item, index) => {
        const rowStyle = index % 2 === 0 ? 'background-color: #f9f9f9;' : 'background-color: white;';
        html += `
          <tr style="${rowStyle}">
            <td style="border: 1px solid #ddd; padding: 6px;">${item['订单号']}</td>
            <td style="border: 1px solid #ddd; padding: 6px;">${item['客户姓名']}</td>
            <td style="border: 1px solid #ddd; padding: 6px;">${item['客户电话']}</td>
            <td style="border: 1px solid #ddd; padding: 6px; font-size: 9px;">${item['商品信息']}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${item['订单金额']}</td>
            <td style="border: 1px solid #ddd; padding: 6px;">${item['支付方式']}</td>
            <td style="border: 1px solid #ddd; padding: 6px;">${item['订单状态']}</td>
            <td style="border: 1px solid #ddd; padding: 6px;">${item['下单时间']}</td>
          </tr>
        `;
      });
      
      html += `
          </tbody>
        </table>
        
        <div style="margin-top: 20px; text-align: center; color: #666; font-size: 10px;">
          <p>生成时间：${new Date().toLocaleString('zh-CN')}</p>
        </div>
      `;
      
      return html;
    },

    // 下载导入模板
    downloadTemplate() {
      try {
        const templateData = [
          {
            '订单号': 'ORD20231201001',
            '客户姓名': '张三',
            '客户电话': '13800138000',
            '客户邮箱': 'zhangsan@example.com',
            '商品名称1': 'iPhone 14 Pro',
            '数量1': 1,
            '单价1': 7999,
            '商品名称2': 'AirPods Pro',
            '数量2': 1,
            '单价2': 1999,
            '订单金额': 9998,
            '支付方式': '支付宝',
            '订单状态': '已付款',
            '省份': '北京市',
            '城市': '北京市',
            '区县': '朝阳区',
            '详细地址': '三里屯街道工人体育场北路8号院1号楼',
            '邮政编码': '100027',
            '下单时间': '2023-12-01 09:30:00'
          }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '订单导入模板');
        
        XLSX.writeFile(wb, '订单导入模板.xlsx');
        
        this.$store.dispatch("alerts/success", "模板下载成功");
      } catch (error) {
        console.error('模板下载失败:', error);
        this.$store.dispatch("alerts/error", "模板下载失败");
      }
    },

    // 格式化文件名日期
    formatDateForFile(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}${month}${day}_${hours}${minutes}`;
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

/* 导入对话框样式 */
.import-area {
  padding: 16px;
}

.file-drop-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.file-drop-zone:hover,
.file-drop-zone.drag-over {
  border-color: #4caf50;
  background-color: #e8f5e8;
  transform: scale(1.02);
}

.upload-icon {
  font-size: 48px !important;
  color: #4caf50;
  margin-bottom: 16px;
}

.file-drop-zone p {
  margin: 8px 0;
  color: #666;
}

.file-info {
  font-size: 12px;
  color: #999;
}

.template-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.template-info p {
  margin: 0;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background-color: #e8f5e8;
  border-radius: 4px;
  border: 1px solid #4caf50;
}

.selected-file md-icon {
  color: #4caf50;
}

.import-progress {
  margin-top: 20px;
}

.import-progress p {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
  text-align: center;
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

  .file-drop-zone {
    padding: 20px;
  }
  
  .upload-icon {
    font-size: 36px !important;
  }
}
</style>
