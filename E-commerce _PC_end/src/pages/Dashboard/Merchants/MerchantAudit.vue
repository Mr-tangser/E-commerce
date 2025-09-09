<template>
  <div class="md-layout">
    <div class="md-layout-item md-size-100">
      <md-card>
        <md-card-header class="md-card-header-icon md-card-header-orange">
          <div class="card-icon">
            <md-icon>verified_user</md-icon>
          </div>
          <h4 class="title">商家审核</h4>
        </md-card-header>
        <md-card-content>
          
          <!-- 过滤器 -->
          <div class="md-layout" style="margin-bottom: 20px;">
            <div class="md-layout-item md-size-25">
              <md-field>
                <label>审核状态</label>
                <md-select v-model="filters.auditStatus" name="auditStatus">
                  <md-option value="">全部状态</md-option>
                  <md-option value="pending">待审核</md-option>
                  <md-option value="approved">已通过</md-option>
                  <md-option value="rejected">已拒绝</md-option>
                  <md-option value="resubmitted">重新提交</md-option>
                </md-select>
              </md-field>
            </div>
            <div class="md-layout-item md-size-25">
              <md-field>
                <label>申请类型</label>
                <md-select v-model="filters.applicationType" name="applicationType">
                  <md-option value="">全部类型</md-option>
                  <md-option value="new_registration">新入驻申请</md-option>
                  <md-option value="info_update">信息变更</md-option>
                  <md-option value="category_expansion">类目扩展</md-option>
                  <md-option value="level_upgrade">等级升级</md-option>
                </md-select>
              </md-field>
            </div>
            <div class="md-layout-item md-size-25">
              <md-field>
                <label>紧急程度</label>
                <md-select v-model="filters.priority" name="priority">
                  <md-option value="">全部级别</md-option>
                  <md-option value="high">紧急</md-option>
                  <md-option value="medium">普通</md-option>
                  <md-option value="low">非紧急</md-option>
                </md-select>
              </md-field>
            </div>
            <div class="md-layout-item md-size-25">
              <md-field>
                <label>提交时间</label>
                <md-select v-model="filters.timeRange" name="timeRange">
                  <md-option value="">全部时间</md-option>
                  <md-option value="today">今天</md-option>
                  <md-option value="this_week">本周</md-option>
                  <md-option value="this_month">本月</md-option>
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
              <md-table-cell md-label="申请编号" md-sort-by="applicationId">
                <div class="application-id">{{ item.applicationId }}</div>
              </md-table-cell>
              <md-table-cell md-label="商家信息" md-sort-by="merchantName">
                <div class="merchant-info">
                  <div class="merchant-name">{{ item.merchantName }}</div>
                  <div class="merchant-contact">{{ item.contactPerson }} | {{ item.contactPhone }}</div>
                </div>
              </md-table-cell>
              <md-table-cell md-label="申请类型" md-sort-by="applicationType">
                <md-chip :class="[getApplicationTypeClass(item.applicationType), 'type-chip']">
                  {{ getApplicationTypeText(item.applicationType) }}
                </md-chip>
              </md-table-cell>
              <md-table-cell md-label="审核状态" md-sort-by="auditStatus">
                <md-chip :class="[getAuditStatusClass(item.auditStatus), 'status-chip']">
                  {{ getAuditStatusText(item.auditStatus) }}
                </md-chip>
              </md-table-cell>
              <md-table-cell md-label="紧急程度" md-sort-by="priority">
                <md-chip :class="[getPriorityClass(item.priority), 'priority-chip']">
                  {{ getPriorityText(item.priority) }}
                </md-chip>
              </md-table-cell>
              <md-table-cell md-label="提交时间" md-sort-by="submitTime">
                {{ formatDateTime(item.submitTime) }}
              </md-table-cell>
              <md-table-cell md-label="审核员" md-sort-by="reviewer">
                <span class="reviewer-name">{{ item.reviewer || '未分配' }}</span>
              </md-table-cell>
              <md-table-cell md-label="剩余时间">
                <div class="time-remaining" :class="getTimeRemainingClass(item.timeRemaining)">
                  {{ getTimeRemainingText(item.timeRemaining) }}
                </div>
              </md-table-cell>
              <md-table-cell md-label="操作">
                <md-button
                  class="md-icon-button md-raised md-round md-info"
                  @click="viewApplication(item)"
                  style="margin: 0.2rem;"
                  title="查看详情"
                >
                  <md-icon>visibility</md-icon>
                </md-button>
                <md-button
                  v-if="item.auditStatus === 'pending'"
                  class="md-icon-button md-raised md-round md-success"
                  @click="approveApplication(item)"
                  style="margin: 0.2rem;"
                  title="通过审核"
                >
                  <md-icon>check</md-icon>
                </md-button>
                <md-button
                  v-if="item.auditStatus === 'pending'"
                  class="md-icon-button md-raised md-round md-danger"
                  @click="rejectApplication(item)"
                  style="margin: 0.2rem;"
                  title="拒绝申请"
                >
                  <md-icon>close</md-icon>
                </md-button>
                <md-button
                  class="md-icon-button md-raised md-round md-warning"
                  @click="assignReviewer(item)"
                  style="margin: 0.2rem;"
                  title="分配审核员"
                >
                  <md-icon>assignment_ind</md-icon>
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

    <!-- 审核详情对话框 -->
    <md-dialog :md-active.sync="showDetailDialog" :md-fullscreen="false" :md-backdrop="true">
      <md-dialog-title>
        <span style="color: #ff9800; font-size: 18px;">
          🔍 审核详情 - {{ selectedApplication.applicationId }}
        </span>
        <md-chip 
          :class="getAuditStatusClass(selectedApplication.auditStatus)" 
          style="margin-left: 10px; font-weight: 500;"
        >
          {{ getAuditStatusText(selectedApplication.auditStatus) }}
        </md-chip>
      </md-dialog-title>
      
      <md-dialog-content style="padding: 24px; max-height: 600px; overflow-y: auto;">
        <div class="audit-details">
          <div class="detail-section">
            <h4>申请信息</h4>
            <div class="detail-item">
              <span class="detail-label">申请编号：</span>
              <span class="detail-value">{{ selectedApplication.applicationId }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">申请类型：</span>
              <span class="detail-value">{{ getApplicationTypeText(selectedApplication.applicationType) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">提交时间：</span>
              <span class="detail-value">{{ formatDateTime(selectedApplication.submitTime) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">紧急程度：</span>
              <span class="detail-value">{{ getPriorityText(selectedApplication.priority) }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h4>商家信息</h4>
            <div class="detail-item">
              <span class="detail-label">商家名称：</span>
              <span class="detail-value">{{ selectedApplication.merchantName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">联系人：</span>
              <span class="detail-value">{{ selectedApplication.contactPerson }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">联系电话：</span>
              <span class="detail-value">{{ selectedApplication.contactPhone }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">经营地址：</span>
              <span class="detail-value">{{ selectedApplication.businessAddress }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h4>申请内容</h4>
            <div class="application-content">
              {{ selectedApplication.applicationContent || '暂无详细说明' }}
            </div>
          </div>

          <div class="detail-section" v-if="selectedApplication.documents && selectedApplication.documents.length">
            <h4>相关文档</h4>
            <div class="documents-list">
              <div 
                v-for="(doc, index) in selectedApplication.documents" 
                :key="index"
                class="document-item"
              >
                <md-icon>description</md-icon>
                <span>{{ doc.name }}</span>
                <md-button class="md-icon-button md-primary" @click="viewDocument(doc)">
                  <md-icon>visibility</md-icon>
                </md-button>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="selectedApplication.auditHistory && selectedApplication.auditHistory.length">
            <h4>审核历史</h4>
            <div class="audit-history">
              <div 
                v-for="(history, index) in selectedApplication.auditHistory" 
                :key="index"
                class="history-item"
              >
                <div class="history-time">{{ formatDateTime(history.time) }}</div>
                <div class="history-action">{{ history.action }}</div>
                <div class="history-reviewer">审核员：{{ history.reviewer }}</div>
                <div class="history-comment" v-if="history.comment">{{ history.comment }}</div>
              </div>
            </div>
          </div>
        </div>
      </md-dialog-content>
      
      <md-dialog-actions>
        <md-button class="md-primary" @click="closeDetailDialog">关闭</md-button>
        <md-button 
          v-if="selectedApplication.auditStatus === 'pending'"
          class="md-success md-raised" 
          @click="approveApplication(selectedApplication)"
        >
          通过审核
        </md-button>
        <md-button 
          v-if="selectedApplication.auditStatus === 'pending'"
          class="md-danger md-raised" 
          @click="rejectApplication(selectedApplication)"
        >
          拒绝申请
        </md-button>
      </md-dialog-actions>
    </md-dialog>

    <!-- 审核操作对话框 -->
    <md-dialog :md-active.sync="showAuditDialog" :md-fullscreen="false" :md-backdrop="true">
      <md-dialog-title>
        <span style="color: #ff9800; font-size: 18px;">
          {{ auditAction === 'approve' ? '✅ 通过审核' : '❌ 拒绝申请' }}
        </span>
      </md-dialog-title>
      
      <md-dialog-content style="padding: 24px;">
        <div class="audit-form">
          <md-field>
            <label>审核意见</label>
            <md-textarea 
              v-model="auditComment" 
              :placeholder="auditAction === 'approve' ? '请填写通过原因...' : '请填写拒绝原因...'"
              :required="auditAction === 'reject'"
            ></md-textarea>
          </md-field>
          
          <md-field v-if="auditAction === 'reject'">
            <label>拒绝类型</label>
            <md-select v-model="rejectReason" required>
              <md-option value="incomplete_docs">资料不完整</md-option>
              <md-option value="invalid_info">信息不符</md-option>
              <md-option value="policy_violation">违反政策</md-option>
              <md-option value="duplicate_application">重复申请</md-option>
              <md-option value="other">其他原因</md-option>
            </md-select>
          </md-field>
        </div>
      </md-dialog-content>
      
      <md-dialog-actions>
        <md-button class="md-primary" @click="closeAuditDialog">取消</md-button>
        <md-button 
          :class="auditAction === 'approve' ? 'md-success' : 'md-danger'"
          class="md-raised"
          @click="submitAuditDecision"
          :disabled="savingAudit || (auditAction === 'reject' && !auditComment.trim())"
        >
          <md-icon v-if="savingAudit">hourglass_empty</md-icon>
          {{ savingAudit ? '处理中...' : (auditAction === 'approve' ? '确认通过' : '确认拒绝') }}
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
      auditStatus: '',
      applicationType: '',
      priority: '',
      timeRange: ''
    },

    sortation: {
      field: "submitTime",
      order: "desc",
    },

    pagination: {
      perPage: 5,
      currentPage: 1,
      perPageOptions: [5, 10, 25, 50],
    },

    // 详情对话框相关数据
    showDetailDialog: false,
    selectedApplication: {},

    // 审核对话框相关数据
    showAuditDialog: false,
    auditAction: '', // 'approve' or 'reject'
    auditComment: '',
    rejectReason: '',
    savingAudit: false,
  }),

  computed: {
    filteredTable() {
      let filtered = this.table;

      // 审核状态过滤
      if (this.filters.auditStatus) {
        filtered = filtered.filter(item => item.auditStatus === this.filters.auditStatus);
      }

      // 申请类型过滤
      if (this.filters.applicationType) {
        filtered = filtered.filter(item => item.applicationType === this.filters.applicationType);
      }

      // 紧急程度过滤
      if (this.filters.priority) {
        filtered = filtered.filter(item => item.priority === this.filters.priority);
      }

      // 时间范围过滤
      if (this.filters.timeRange) {
        const now = new Date();
        let startDate;
        
        switch (this.filters.timeRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'this_week':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
            break;
          case 'this_month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        }
        
        if (startDate) {
          filtered = filtered.filter(item => 
            new Date(item.submitTime) >= startDate
          );
        }
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
        // 从后端API获取审核列表
        const response = await this.$http.get('admin/merchant-audit', {
          params: {
            page: this.pagination.currentPage,
            limit: this.pagination.perPage,
            auditStatus: this.filters.auditStatus || undefined,
            applicationType: this.filters.applicationType || undefined,
            priority: this.filters.priority || undefined,
            timeRange: this.filters.timeRange || undefined
          }
        });

        if (response.data.success) {
          this.table = response.data.data.applications;
        } else {
          throw new Error(response.data.message || '获取审核列表失败');
        }
      } catch (error) {
        console.error('获取审核列表失败:', error);
        
        this.$store.dispatch("alerts/error", 
          `获取审核列表失败: ${error.response?.data?.message || error.message}`
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
          applicationId: 'APP20231201001',
          merchantName: '星巴克咖啡旗舰店',
          contactPerson: '张经理',
          contactPhone: '138****1234',
          businessAddress: '北京市朝阳区三里屯',
          applicationType: 'new_registration',
          auditStatus: 'pending',
          priority: 'high',
          submitTime: '2023-12-01T09:30:00Z',
          reviewer: null,
          timeRemaining: 72,
          applicationContent: '申请开设星巴克咖啡官方旗舰店，主营各类咖啡饮品和轻食',
          documents: [
            { name: '营业执照.pdf', url: '/docs/license.pdf' },
            { name: '食品经营许可证.pdf', url: '/docs/food-license.pdf' }
          ],
          auditHistory: []
        },
        {
          _id: '2',
          applicationId: 'APP20231201002',
          merchantName: '优衣库服装专营',
          contactPerson: '李女士',
          contactPhone: '139****5678',
          businessAddress: '上海市浦东新区陆家嘴',
          applicationType: 'category_expansion',
          auditStatus: 'approved',
          priority: 'medium',
          submitTime: '2023-11-28T14:20:00Z',
          reviewer: '王审核员',
          timeRemaining: 0,
          applicationContent: '申请扩展经营类目，新增运动服装和配件销售',
          documents: [
            { name: '类目扩展申请表.pdf', url: '/docs/category-expansion.pdf' }
          ],
          auditHistory: [
            {
              time: '2023-11-30T10:15:00Z',
              action: '审核通过',
              reviewer: '王审核员',
              comment: '资料齐全，符合扩展要求'
            }
          ]
        },
        {
          _id: '3',
          applicationId: 'APP20231130003',
          merchantName: '海底捞火锅店',
          contactPerson: '赵店长',
          contactPhone: '137****9012',
          businessAddress: '广州市天河区体育中心',
          applicationType: 'info_update',
          auditStatus: 'rejected',
          priority: 'low',
          submitTime: '2023-11-30T16:45:00Z',
          reviewer: '刘审核员',
          timeRemaining: 0,
          applicationContent: '更新商家经营地址和联系方式',
          documents: [
            { name: '地址变更证明.pdf', url: '/docs/address-change.pdf' }
          ],
          auditHistory: [
            {
              time: '2023-12-01T09:00:00Z',
              action: '审核拒绝',
              reviewer: '刘审核员',
              comment: '地址变更证明不完整，请补充相关材料'
            }
          ]
        }
      ];
    },

    viewApplication(application) {
      this.selectedApplication = { ...application };
      this.showDetailDialog = true;
    },

    approveApplication(application) {
      this.selectedApplication = { ...application };
      this.auditAction = 'approve';
      this.auditComment = '';
      this.rejectReason = '';
      this.showAuditDialog = true;
    },

    rejectApplication(application) {
      this.selectedApplication = { ...application };
      this.auditAction = 'reject';
      this.auditComment = '';
      this.rejectReason = '';
      this.showAuditDialog = true;
    },

    assignReviewer(application) {
      this.$store.dispatch("alerts/error", "分配审核员功能暂未开放。");
    },

    async submitAuditDecision() {
      if (this.auditAction === 'reject' && !this.auditComment.trim()) {
        this.$store.dispatch("alerts/error", "拒绝申请时必须填写拒绝原因");
        return;
      }

      this.savingAudit = true;

      try {
        // 调用后端API提交审核决定
        const response = await this.$http.post(`admin/merchant-audit/${this.selectedApplication._id}/decision`, {
          action: this.auditAction,
          comment: this.auditComment,
          rejectReason: this.rejectReason
        });

        if (response.data.success) {
          // 更新本地数据
          const itemIndex = this.table.findIndex(item => item._id === this.selectedApplication._id);
          if (itemIndex !== -1) {
            this.table[itemIndex].auditStatus = this.auditAction === 'approve' ? 'approved' : 'rejected';
            this.table[itemIndex].reviewer = '当前用户'; // 应该从后端获取当前用户信息
          }

          this.$store.dispatch("alerts/success", 
            `申请 ${this.selectedApplication.applicationId} 已${this.auditAction === 'approve' ? '通过' : '拒绝'}审核`
          );

          this.closeAuditDialog();
          this.closeDetailDialog();
        } else {
          throw new Error(response.data.message || '审核操作失败');
        }
      } catch (error) {
        console.error('审核操作失败:', error);
        
        this.$store.dispatch("alerts/error", 
          `审核操作失败: ${error.response?.data?.message || error.message}`
        );
      } finally {
        this.savingAudit = false;
      }
    },

    closeDetailDialog() {
      this.showDetailDialog = false;
      this.selectedApplication = {};
    },

    closeAuditDialog() {
      this.showAuditDialog = false;
      this.auditAction = '';
      this.auditComment = '';
      this.rejectReason = '';
      this.savingAudit = false;
    },

    viewDocument(document) {
      // 这里可以实现文档查看功能
      this.$store.dispatch("alerts/info", `查看文档：${document.name}`);
    },

    customSort() {
      return false;
    },

    getAuditStatusClass(status) {
      const statusClasses = {
        'pending': 'md-warning',
        'approved': 'md-success',
        'rejected': 'md-danger',
        'resubmitted': 'md-info'
      };
      return statusClasses[status] || 'md-default';
    },

    getAuditStatusText(status) {
      const statusTexts = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已拒绝',
        'resubmitted': '重新提交'
      };
      return statusTexts[status] || status;
    },

    getApplicationTypeClass(type) {
      const typeClasses = {
        'new_registration': 'md-primary',
        'info_update': 'md-info',
        'category_expansion': 'md-success',
        'level_upgrade': 'md-accent'
      };
      return typeClasses[type] || 'md-default';
    },

    getApplicationTypeText(type) {
      const typeTexts = {
        'new_registration': '新入驻申请',
        'info_update': '信息变更',
        'category_expansion': '类目扩展',
        'level_upgrade': '等级升级'
      };
      return typeTexts[type] || type;
    },

    getPriorityClass(priority) {
      const priorityClasses = {
        'high': 'md-danger',
        'medium': 'md-warning',
        'low': 'md-success'
      };
      return priorityClasses[priority] || 'md-default';
    },

    getPriorityText(priority) {
      const priorityTexts = {
        'high': '紧急',
        'medium': '普通',
        'low': '非紧急'
      };
      return priorityTexts[priority] || priority;
    },

    getTimeRemainingClass(hours) {
      if (hours <= 0) return 'time-expired';
      if (hours <= 24) return 'time-urgent';
      if (hours <= 72) return 'time-warning';
      return 'time-normal';
    },

    getTimeRemainingText(hours) {
      if (hours <= 0) return '已超时';
      if (hours < 24) return `${hours}小时`;
      return `${Math.ceil(hours / 24)}天`;
    },

    formatDateTime(dateString) {
      if (!dateString) return '暂无';
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
.application-id {
  font-family: monospace;
  font-weight: 500;
  color: #2196f3;
}

.merchant-info {
  text-align: left;
}

.merchant-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.merchant-contact {
  font-size: 13px;
  color: #666;
}

.reviewer-name {
  font-style: italic;
  color: #666;
}

.time-remaining {
  font-weight: 500;
}

.time-expired {
  color: #f44336;
}

.time-urgent {
  color: #ff9800;
}

.time-warning {
  color: #ffc107;
}

.time-normal {
  color: #4caf50;
}

.status-chip, .type-chip, .priority-chip {
  font-weight: 500;
}

/* 详情对话框样式 */
.audit-details {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  color: #ff9800;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #fff3e0;
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

.application-content {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.document-item md-icon:first-child {
  color: #2196f3;
}

.audit-history {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  padding: 12px;
  background: #f8f9fa;
  border-left: 4px solid #2196f3;
  border-radius: 0 6px 6px 0;
}

.history-time {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.history-action {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.history-reviewer {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.history-comment {
  color: #333;
  font-style: italic;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #dee2e6;
}

.audit-form {
  padding: 8px 0;
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

.md-chip.md-primary {
  background-color: #2196f3 !important;
  color: white !important;
}

.md-chip.md-info {
  background-color: #00bcd4 !important;
  color: white !important;
}

.md-chip.md-accent {
  background-color: #e91e63 !important;
  color: white !important;
}

/* 对话框样式 */
::v-deep .md-dialog {
  max-width: 900px;
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
  
  .document-item {
    flex-wrap: wrap;
  }
  
  ::v-deep .md-dialog {
    width: 95%;
    max-width: none;
  }

  .merchant-info,
  .application-id {
    font-size: 14px;
  }
}
</style>

