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
            <md-button class="md-success md-dense" @click="exportToExcel" style="margin-right: 10px;">
              <md-icon>file_download</md-icon>
              导出Excel
            </md-button>
            <md-button class="md-info md-dense" @click="exportToPDFChinese" style="margin-right: 10px;">
              <md-icon>picture_as_pdf</md-icon>
              导出PDF
            </md-button>
            <md-button class="md-warning md-dense" @click="importFromExcel" style="margin-right: 10px;">
              <md-icon>file_upload</md-icon>
              导入Excel
            </md-button>
            <md-button class="md-accent md-dense" @click="downloadTemplate" style="margin-right: 10px;">
              <md-icon>get_app</md-icon>
              下载模板
            </md-button>
            <md-button class="md-primary md-dense" @click="onProFeature">
              <md-icon>add</md-icon>
              添加商家
            </md-button>
          </div>
          
          <!-- 文件导入对话框 -->
          <md-dialog :md-active.sync="showImportDialog" :md-fullscreen="false" :md-backdrop="true">
            <md-dialog-title>导入Excel文件</md-dialog-title>
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
            :value="paginatedTable"
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
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

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

    // 分页后的商家数据
    paginatedTable() {
      const start = this.from;
      const end = start + this.pagination.perPage;
      return this.filteredTable.slice(start, end);
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
      },
      deep: true
    },
    
    'pagination.perPage'() {
      this.pagination.currentPage = 1;
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
          businessAddress: '北京市朝阳区中关村科技园',
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
          businessAddress: '上海市浦东新区陆家嘴金融区',
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
          businessAddress: '广州市天河区珠江新城',
          verifyStatus: 'pending',
          level: 'silver',
          category: 'food',
          productCount: 45,
          monthlyRevenue: 120000,
          rating: 4.2,
          joinDate: '2023-08-10',
          isActive: true,
          logo: '/img/stores/fruit.png'
        },
        {
          _id: '4',
          storeName: '星巴克咖啡旗舰店',
          storeCode: 'SB004',
          ownerName: '陈经理',
          contactPhone: '135****2468',
          businessAddress: '深圳市南山区科技园南区',
          verifyStatus: 'verified',
          level: 'diamond',
          category: 'food',
          productCount: 78,
          monthlyRevenue: 680000,
          rating: 4.7,
          joinDate: '2022-11-08',
          isActive: true,
          logo: '/img/stores/starbucks.png'
        },
        {
          _id: '5',
          storeName: '苹果授权专卖店',
          storeCode: 'AP005',
          ownerName: '刘总监',
          contactPhone: '186****7890',
          businessAddress: '杭州市西湖区文三路电子信息街',
          verifyStatus: 'verified',
          level: 'diamond',
          category: 'electronics',
          productCount: 234,
          monthlyRevenue: 1250000,
          rating: 4.9,
          joinDate: '2022-06-12',
          isActive: true,
          logo: '/img/stores/apple.png'
        },
        {
          _id: '6',
          storeName: '优衣库服装专营',
          storeCode: 'UQ006',
          ownerName: '田女士',
          contactPhone: '151****3579',
          businessAddress: '成都市锦江区春熙路步行街',
          verifyStatus: 'verified',
          level: 'gold',
          category: 'clothing',
          productCount: 145,
          monthlyRevenue: 380000,
          rating: 4.4,
          joinDate: '2023-02-28',
          isActive: true,
          logo: '/img/stores/uniqlo.png'
        },
        {
          _id: '7',
          storeName: '书香阁古籍书店',
          storeCode: 'BK007',
          ownerName: '文老师',
          contactPhone: '159****4681',
          businessAddress: '西安市雁塔区大雁塔文化商圈',
          verifyStatus: 'verified',
          level: 'silver',
          category: 'books',
          productCount: 892,
          monthlyRevenue: 95000,
          rating: 4.6,
          joinDate: '2023-05-18',
          isActive: true,
          logo: '/img/stores/bookstore.png'
        },
        {
          _id: '8',
          storeName: '德国汽车配件专营店',
          storeCode: 'GM008',
          ownerName: '穆勒先生',
          contactPhone: '177****2580',
          businessAddress: '北京市海淀区中关村汽车用品城',
          verifyStatus: 'suspended',
          level: 'bronze',
          category: 'sports',
          productCount: 67,
          monthlyRevenue: 45000,
          rating: 3.8,
          joinDate: '2023-09-03',
          isActive: false,
          logo: '/img/stores/automotive.png'
        },
        {
          _id: '9',
          storeName: '韩式美妆连锁店',
          storeCode: 'KM009',
          ownerName: '金小姐',
          contactPhone: '138****9527',
          businessAddress: '上海市黄浦区南京东路步行街',
          verifyStatus: 'verified',
          level: 'gold',
          category: 'clothing',
          productCount: 156,
          monthlyRevenue: 520000,
          rating: 4.5,
          joinDate: '2022-12-15',
          isActive: true,
          logo: '/img/stores/cosmetics.png'
        },
        {
          _id: '10',
          storeName: '健身器材专业店',
          storeCode: 'FT010',
          ownerName: '刘教练',
          contactPhone: '152****8642',
          businessAddress: '武汉市汉口区江汉路体育用品街',
          verifyStatus: 'rejected',
          level: 'bronze',
          category: 'sports',
          productCount: 89,
          monthlyRevenue: 78000,
          rating: 4.1,
          joinDate: '2023-07-22',
          isActive: true,
          logo: '/img/stores/fitness.png'
        },
        {
          _id: '11',
          storeName: '意大利家居生活馆',
          storeCode: 'IT011',
          ownerName: '马可先生',
          contactPhone: '187****5432',
          businessAddress: '天津市和平区五大道商业区',
          verifyStatus: 'pending',
          level: 'silver',
          category: 'home',
          productCount: 234,
          monthlyRevenue: 285000,
          rating: 4.3,
          joinDate: '2023-04-10',
          isActive: true,
          logo: '/img/stores/home.png'
        },
        {
          _id: '12',
          storeName: '宠物用品生活馆',
          storeCode: 'PT012',
          ownerName: '王小姐',
          contactPhone: '165****9876',
          businessAddress: '南京市鼓楼区新街口商业中心',
          verifyStatus: 'verified',
          level: 'silver',
          category: 'home',
          productCount: 178,
          monthlyRevenue: 165000,
          rating: 4.4,
          joinDate: '2023-06-08',
          isActive: true,
          logo: '/img/stores/pet.png'
        },
        {
          _id: '13',
          storeName: '海底捞火锅店',
          storeCode: 'HD013',
          ownerName: '赵店长',
          contactPhone: '133****2468',
          businessAddress: '重庆市渝中区解放碑商圈',
          verifyStatus: 'verified',
          level: 'gold',
          category: 'food',
          productCount: 56,
          monthlyRevenue: 450000,
          rating: 4.6,
          joinDate: '2022-08-25',
          isActive: true,
          logo: '/img/stores/hotpot.png'
        },
        {
          _id: '14',
          storeName: '戴森官方专卖店',
          storeCode: 'DY014',
          ownerName: '李总',
          contactPhone: '199****1357',
          businessAddress: '青岛市市南区香港中路万象城',
          verifyStatus: 'verified',
          level: 'diamond',
          category: 'home',
          productCount: 45,
          monthlyRevenue: 780000,
          rating: 4.8,
          joinDate: '2022-10-12',
          isActive: true,
          logo: '/img/stores/dyson.png'
        },
        {
          _id: '15',
          storeName: '乐高玩具专营店',
          storeCode: 'LG015',
          ownerName: '冯先生',
          contactPhone: '147****8024',
          businessAddress: '厦门市思明区中山路步行街',
          verifyStatus: 'verified',
          level: 'gold',
          category: 'books',
          productCount: 312,
          monthlyRevenue: 320000,
          rating: 4.7,
          joinDate: '2023-01-20',
          isActive: true,
          logo: '/img/stores/lego.png'
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
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString('zh-CN');
    },

    handleImageError(event) {
      event.target.src = '/img/default-store.png';
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

      this.importProgress = { show: true, value: 0, text: '正在读取文件...' };

      try {
        const data = await this.readExcelFile(this.selectedFile);
        this.importProgress = { show: true, value: 50, text: '正在验证数据...' };
        
        const validatedData = this.validateImportData(data);
        this.importProgress = { show: true, value: 80, text: '正在导入数据...' };
        
        await this.importMerchants(validatedData);
        this.importProgress = { show: true, value: 100, text: '导入完成！' };
        
        setTimeout(() => {
          this.closeImportDialog();
          this.getList();
          this.$store.dispatch("alerts/success", `成功导入 ${validatedData.length} 条商家记录`);
        }, 1000);
      } catch (error) {
        console.error('导入失败:', error);
        this.importProgress = { show: false, value: 0, text: '' };
        this.$store.dispatch("alerts/error", `导入失败: ${error.message}`);
      }
    },

    // 读取Excel文件
    readExcelFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            resolve(jsonData);
          } catch (error) {
            reject(new Error('文件读取失败，请确保文件格式正确'));
          }
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsArrayBuffer(file);
      });
    },

    // 验证导入数据
    validateImportData(rawData) {
      if (rawData.length < 2) {
        throw new Error('文件中没有找到有效数据');
      }

      const headers = rawData[0];
      const expectedHeaders = [
        '商家名称', '商家编号', '店主姓名', '联系电话', '经营地址',
        '认证状态', '商家等级', '经营类别', '商品数量', '月销售额', '评分'
      ];

      // 检查表头是否匹配
      const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
      if (missingHeaders.length > 0) {
        throw new Error(`缺少必要的列: ${missingHeaders.join(', ')}`);
      }

      const validatedData = [];
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        try {
          const merchant = this.parseExcelRow(headers, row);
          validatedData.push(merchant);
          } catch (error) {
          console.warn(`第${i+1}行数据有误: ${error.message}`);
        }
      }

      if (validatedData.length === 0) {
        throw new Error('没有找到有效的商家数据');
      }

      return validatedData;
    },

    // 解析Excel行数据
    parseExcelRow(headers, row) {
      const getColumnValue = (columnName) => {
        const index = headers.indexOf(columnName);
        return index >= 0 ? row[index] : '';
      };

      // 验证必填字段
      const storeName = getColumnValue('商家名称');
      const storeCode = getColumnValue('商家编号');
      const ownerName = getColumnValue('店主姓名');
      const contactPhone = getColumnValue('联系电话');

      if (!storeName || !storeCode || !ownerName || !contactPhone) {
        throw new Error('缺少必填字段');
      }

      return {
        storeName: storeName.toString().trim(),
        storeCode: storeCode.toString().trim(),
        ownerName: ownerName.toString().trim(),
        contactPhone: contactPhone.toString().trim(),
        businessAddress: getColumnValue('经营地址') || '',
        verifyStatus: this.parseVerifyStatus(getColumnValue('认证状态')),
        level: this.parseLevel(getColumnValue('商家等级')),
        category: this.parseCategory(getColumnValue('经营类别')),
        productCount: parseInt(getColumnValue('商品数量')) || 0,
        monthlyRevenue: parseFloat(getColumnValue('月销售额')) || 0,
        rating: parseFloat(getColumnValue('评分')) || 0,
        joinDate: new Date().toISOString().split('T')[0],
        isActive: true
      };
    },

    // 解析认证状态
    parseVerifyStatus(status) {
      const statusMap = {
          '已认证': 'verified',
          '待审核': 'pending',
          '已拒绝': 'rejected',
          '已暂停': 'suspended'
        };
      return statusMap[status] || 'pending';
    },
        
    // 解析商家等级
    parseLevel(level) {
        const levelMap = {
          '钻石商家': 'diamond',
          '金牌商家': 'gold',
          '银牌商家': 'silver',
          '铜牌商家': 'bronze'
        };
      return levelMap[level] || 'bronze';
    },
        
    // 解析经营类别
    parseCategory(category) {
        const categoryMap = {
          '数码电子': 'electronics',
          '服装饰品': 'clothing',
          '食品生鲜': 'food',
          '图书文具': 'books',
          '家居用品': 'home',
          '运动户外': 'sports'
        };
      return categoryMap[category] || 'electronics';
    },

    // 导入商家数据到后端
    async importMerchants(merchants) {
      try {
        const response = await this.$http.post('admin/merchants/import', {
          merchants: merchants
        });

        if (!response.data.success) {
          throw new Error(response.data.message || '导入失败');
        }
      } catch (error) {
        console.warn('后端导入失败，使用模拟导入:', error.message);
        // 模拟导入成功，将数据添加到本地表格
        this.table = [...this.table, ...merchants];
      }
    },

    // 导出到Excel
    exportToExcel() {
      try {
        const exportData = this.prepareExportData();
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // 设置列宽
        const colWidths = [
          { wch: 20 }, // 商家名称
          { wch: 15 }, // 商家编号
          { wch: 12 }, // 店主姓名
          { wch: 15 }, // 联系电话
          { wch: 25 }, // 经营地址
          { wch: 10 }, // 认证状态
          { wch: 12 }, // 商家等级
          { wch: 12 }, // 经营类别
          { wch: 10 }, // 商品数量
          { wch: 15 }, // 月销售额
          { wch: 8 },  // 评分
          { wch: 12 }, // 入驻时间
          { wch: 10 }  // 活跃状态
        ];
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '商家列表');
        
        const fileName = `商家管理_${this.formatDateForFile(new Date())}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        this.$store.dispatch("alerts/success", "Excel文件导出成功");
      } catch (error) {
        console.error('Excel导出失败:', error);
        this.$store.dispatch("alerts/error", "Excel导出失败");
      }
    },


    // 准备导出数据（用于Excel）
    prepareExportData() {
      return this.filteredTable.map(item => ({
        '商家名称': item.storeName || '',
        '商家编号': item.storeCode || '',
        '店主姓名': item.ownerName || '',
        '联系电话': item.contactPhone || '',
        '经营地址': item.businessAddress || '',
        '认证状态': this.getVerifyStatusText(item.verifyStatus),
        '商家等级': this.getLevelText(item.level),
        '经营类别': this.getCategoryText(item.category),
        '商品数量': `${item.productCount || 0}件`,
        '月销售额': `¥${this.formatMoney(item.monthlyRevenue || 0)}`,
        '评分': item.rating || '暂无',
        '入驻时间': this.formatDate(item.joinDate),
        '活跃状态': item.isActive ? '营业中' : '已停业'
      }));
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

    // 下载导入模板
    downloadTemplate() {
      try {
        const templateData = [
          {
            '商家名称': '示例商家A',
            '商家编号': 'SHOP001',
            '店主姓名': '张三',
            '联系电话': '13800138000',
            '经营地址': '北京市朝阳区示例街道123号',
            '认证状态': '已认证',
            '商家等级': '金牌商家',
            '经营类别': '数码电子',
            '商品数量': 100,
            '月销售额': 50000,
            '评分': 4.5
          },
          {
            '商家名称': '示例商家B',
            '商家编号': 'SHOP002',
            '店主姓名': '李四',
            '联系电话': '13900139000',
            '经营地址': '上海市浦东新区示例路456号',
            '认证状态': '待审核',
            '商家等级': '银牌商家',
            '经营类别': '服装饰品',
            '商品数量': 80,
            '月销售额': 30000,
            '评分': 4.2
          }
        ];

          const ws = XLSX.utils.json_to_sheet(templateData);
        
        // 设置列宽
        const colWidths = [
          { wch: 20 }, // 商家名称
          { wch: 15 }, // 商家编号
          { wch: 12 }, // 店主姓名
          { wch: 15 }, // 联系电话
          { wch: 30 }, // 经营地址
          { wch: 12 }, // 认证状态
          { wch: 12 }, // 商家等级
          { wch: 12 }, // 经营类别
          { wch: 10 }, // 商品数量
          { wch: 12 }, // 月销售额
          { wch: 8 }   // 评分
        ];
        ws['!cols'] = colWidths;

        // 添加说明信息
        const instructions = [
          [''],
          ['导入说明：'],
          ['1. 请保持表头不变，从第三行开始填写数据'],
          ['2. 商家名称、商家编号、店主姓名、联系电话为必填项'],
          ['3. 认证状态：已认证/待审核/已拒绝/已暂停'],
          ['4. 商家等级：钻石商家/金牌商家/银牌商家/铜牌商家'],
          ['5. 经营类别：数码电子/服装饰品/食品生鲜/图书文具/家居用品/运动户外'],
          ['6. 商品数量和月销售额请填写数字'],
          ['7. 评分请填写 0-5 之间的数字'],
          ['']
        ];

        // 将说明添加到工作表的后面
        const range = XLSX.utils.decode_range(ws['!ref']);
        let currentRow = range.e.r + 2;
        
        instructions.forEach((instruction, index) => {
          const cellAddress = XLSX.utils.encode_cell({ r: currentRow + index, c: 0 });
          ws[cellAddress] = { v: instruction[0], t: 's' };
        });

        // 更新范围
        ws['!ref'] = XLSX.utils.encode_range({
          s: { c: 0, r: 0 },
          e: { c: range.e.c, r: currentRow + instructions.length - 1 }
        });

        const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, '商家导入模板');
        
          XLSX.writeFile(wb, '商家导入模板.xlsx');
        
        this.$store.dispatch("alerts/success", "模板下载成功，请按照模板格式填写数据");
      } catch (error) {
        console.error('模板下载失败:', error);
        this.$store.dispatch("alerts/error", "模板下载失败");
      }
    },

    // 中文PDF导出（使用html2pdf）
    async exportToPDFChinese() {
      try {
        // 创建HTML内容
        const htmlContent = this.generateHTMLReport();
        
        // 创建HTML元素
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        element.style.padding = '20px';
        element.style.fontFamily = 'Microsoft YaHei, SimSun, sans-serif';
        element.style.fontSize = '12px';
        
        // 使用html2pdf生成PDF
        const opt = {
          margin: 10,
          filename: `商家管理报表_${this.formatDateForFile(new Date())}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        
        await html2pdf().set(opt).from(element).save();
        
        this.$store.dispatch("alerts/success", "中文PDF文件导出成功");
      } catch (error) {
        console.error('中文PDF导出失败:', error);
        this.$store.dispatch("alerts/error", `中文PDF导出失败: ${error.message}`);
      }
    },

    // 生成HTML报表内容
    generateHTMLReport() {
      const exportData = this.prepareExportData();
      
      let html = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin-bottom: 10px;">商家管理报表</h1>
          <p style="color: #666; margin: 5px 0;">导出时间：${this.formatDate(new Date())}</p>
          <p style="color: #666; margin: 5px 0;">总数量：${this.filteredTable.length} 条记录</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background-color: #428bca; color: white;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">商家名称</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">商家编号</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">店主姓名</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">联系电话</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">经营地址</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">认证状态</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">商家等级</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">经营类别</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">商品数量</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">月销售额</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">评分</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">入驻时间</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">活跃状态</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      exportData.forEach((item, index) => {
        const rowStyle = index % 2 === 0 ? 'background-color: #f9f9f9;' : 'background-color: white;';
        html += `
          <tr style="${rowStyle}">
            <td style="border: 1px solid #ddd; padding: 6px;">${item['商家名称']}</td>
            <td style="border: 1px solid #ddd; padding: 6px;">${item['商家编号']}</td>
            <td style="border: 1px solid #ddd; padding: 6px;">${item['店主姓名']}</td>
            <td style="border: 1px solid #ddd; padding: 6px;">${item['联系电话']}</td>
            <td style="border: 1px solid #ddd; padding: 6px;">${item['经营地址'] || '未填写'}</td>
            <td style="border: 1px solid #ddd; padding: 6px;">${item['认证状态']}</td>
            <td style="border: 1px solid #ddd; padding: 6px;">${item['商家等级']}</td>
            <td style="border: 1px solid #ddd; padding: 6px;">${item['经营类别']}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${item['商品数量']}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${item['月销售额']}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${item['评分']}</td>
            <td style="border: 1px solid #ddd; padding: 6px;">${item['入驻时间']}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${item['活跃状态']}</td>
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
  border-color: #2196f3;
  background-color: #e3f2fd;
  transform: scale(1.02);
}

.upload-icon {
  font-size: 48px !important;
  color: #2196f3;
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
  
  .file-drop-zone {
    padding: 20px;
  }
  
  .upload-icon {
    font-size: 36px !important;
  }
}
</style>

