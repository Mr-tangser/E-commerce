<template>
  <div class="md-layout">
    <div class="md-layout-item md-size-100">
      <md-card>
        <md-card-header class="md-card-header-icon md-card-header-green">
          <div class="card-icon">
            <md-icon>assignment</md-icon>
          </div>
          <h4 class="title">管理员用户列表</h4>
        </md-card-header>
        <md-card-content>
          <div class="text-right">
            <md-button class="md-primary md-dense" @click="onProFeature">
              添加管理员
            </md-button>
          </div>
          
          <!-- 过滤器 -->
          <div class="md-layout" style="margin-bottom: 20px;">
            <div class="md-layout-item md-size-25">
              <md-field>
                <label>角色筛选</label>
                <md-select v-model="filters.role" name="role">
                  <md-option value="">全部角色</md-option>
                  <md-option value="super_admin">超级管理员</md-option>
                  <md-option value="admin">管理员</md-option>
                  <md-option value="manager">经理</md-option>
                  <md-option value="staff">员工</md-option>
                </md-select>
              </md-field>
            </div>
            <div class="md-layout-item md-size-25">
              <md-field>
                <label>部门筛选</label>
                <md-select v-model="filters.department" name="department">
                  <md-option value="">全部部门</md-option>
                  <md-option value="sales">销售</md-option>
                  <md-option value="marketing">市场</md-option>
                  <md-option value="customer_service">客服</md-option>
                  <md-option value="inventory">库存</md-option>
                  <md-option value="finance">财务</md-option>
                  <md-option value="technical">技术</md-option>
                </md-select>
              </md-field>
            </div>
            <div class="md-layout-item md-size-25">
              <md-field>
                <label>状态筛选</label>
                <md-select v-model="filters.isActive" name="isActive">
                  <md-option value="">全部状态</md-option>
                  <md-option value="true">激活</md-option>
                  <md-option value="false">停用</md-option>
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
              <md-table-cell md-label="头像" md-sort-by="avatar">
                <div class="avatar-cell">
                  <img 
                    :src="item.avatar || '/img/default.jpg'" 
                    :alt="item.username"
                    class="avatar-img"
                    @error="handleImageError"
                  />
                </div>
              </md-table-cell>
              <md-table-cell md-label="用户名" md-sort-by="username">
                {{ item.username }}
              </md-table-cell>
              <md-table-cell md-label="全名" md-sort-by="fullName">
                {{ item.fullName }}
              </md-table-cell>
              <md-table-cell md-label="邮箱" md-sort-by="email">
                <div class="email-cell" :title="item.email">
                  {{ truncateEmail(item.email) }}
                </div>
              </md-table-cell>
              <md-table-cell md-label="角色" md-sort-by="role">
                <md-chip :class="[getRoleClass(item.role), 'role-chip']">
                  {{ getRoleText(item.role) }}
                </md-chip>
              </md-table-cell>
              <md-table-cell md-label="部门" md-sort-by="department">
                {{ getDepartmentText(item.department) }}
              </md-table-cell>
              <md-table-cell md-label="权限">
                <div 
                  class="permissions-summary" 
                  :title="getPermissionTooltip(item.permissions)"
                  @click="editUserPermissions(item)"
                >
                  <md-chip :class="getPermissionLevelClass(item.permissions)" class="permission-level">
                    {{ getPermissionLevel(item.permissions) }}
                  </md-chip>
                  <span class="permission-count">{{ getPermissionCount(item.permissions) }}项</span>
                </div>
              </md-table-cell>
              <md-table-cell md-label="状态" md-sort-by="isActive">
                <md-chip :class="[item.isActive ? 'md-success' : 'md-warning', 'status-chip']">
                  {{ item.isActive ? '激活' : '停用' }}
                </md-chip>
              </md-table-cell>
              <md-table-cell md-label="最后登录" md-sort-by="lastLogin">
                {{ formatDate(item.lastLogin) }}
              </md-table-cell>
              <md-table-cell md-label="登录次数" md-sort-by="loginCount">
                {{ item.loginCount || 0 }}
              </md-table-cell>
              <md-table-cell md-label="操作" :class="item.role === 'super_admin' ? 'super-admin-actions' : ''">
                <md-button
                  class="md-icon-button md-raised md-round md-info"
                  @click="handleEdit(item)"
                  style="margin: 0.2rem; position: relative;"
                  :disabled="item.role === 'super_admin'"
                  :title="item.role === 'super_admin' ? '超级管理员无法编辑' : '编辑用户'"
                >
                  <md-icon>edit</md-icon>
                </md-button>
                <md-button
                  class="md-icon-button md-raised md-round md-danger"
                  @click="handleDelete(item)"
                  style="margin: 0.2rem; position: relative;"
                  :disabled="item.role === 'super_admin'"
                  :title="item.role === 'super_admin' ? '超级管理员无法删除' : '删除用户'"
                >
                  <md-icon>delete</md-icon>
                </md-button>
                <md-button
                  class="md-icon-button md-raised md-round"
                  :class="item.isActive ? 'md-warning' : 'md-success'"
                  @click="toggleUserStatus(item)"
                  style="margin: 0.2rem; position: relative;"
                  :disabled="item.role === 'super_admin'"
                  :title="item.role === 'super_admin' ? '超级管理员状态无法修改' : (item.isActive ? '停用用户' : '激活用户')"
                >
                  <md-icon>{{ item.isActive ? 'block' : 'check_circle' }}</md-icon>
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

    <!-- 权限编辑对话框 -->
    <md-dialog :md-active.sync="showPermissionDialog" :md-fullscreen="false" :md-backdrop="true">
      <md-dialog-title>
        <span style="color: #2196f3; font-size: 18px;">
          🔐 编辑权限 - {{ selectedUser.username }}
        </span>
        <md-chip 
          :class="getRoleClass(selectedUser.role)" 
          style="margin-left: 10px; font-weight: 500;"
        >
          {{ getRoleText(selectedUser.role) }}
        </md-chip>
      </md-dialog-title>
      
      <md-dialog-content style="padding: 24px; max-height: 500px; overflow-y: auto;">
        <div v-if="selectedUser.role === 'super_admin'" class="super-admin-notice">
          <md-icon style="color: #ff5722; margin-right: 8px;">security</md-icon>
          <span style="color: #ff5722; font-weight: 500;">
            超级管理员权限不可修改，拥有系统全部权限
          </span>
        </div>
        
        <div v-else class="permissions-editor">
          <div v-for="(resourceActions, resource) in editablePermissions" :key="resource" class="permission-group">
            <h4 class="permission-resource-title">
              <md-icon class="resource-icon">{{ getResourceIcon(resource) }}</md-icon>
              {{ getResourceText(resource) }}
            </h4>
            
            <div class="permission-actions">
              <md-checkbox 
                v-for="(value, action) in resourceActions" 
                :key="`${resource}-${action}`"
                v-model="editablePermissions[resource][action]"
                :class="getActionClass(action)"
                class="permission-checkbox"
              >
                <span class="action-text">{{ getActionText(action) }}</span>
                <span class="action-desc">({{ getActionDescription(action) }})</span>
              </md-checkbox>
            </div>
          </div>
        </div>
      </md-dialog-content>
      
      <md-dialog-actions>
        <md-button class="md-primary" @click="closePermissionDialog">取消</md-button>
        <md-button 
          v-if="selectedUser.role !== 'super_admin'"
          class="md-primary md-raised" 
          @click="savePermissions"
          :disabled="savingPermissions"
        >
          <md-icon v-if="savingPermissions">hourglass_empty</md-icon>
          {{ savingPermissions ? '保存中...' : '保存权限' }}
        </md-button>
        <md-button 
          v-else
          class="md-accent md-raised" 
          @click="closePermissionDialog"
        >
          知道了
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

    query: null,

    filters: {
      role: '',
      department: '',
      isActive: ''
    },

    sortation: {
      field: "createdAt",
      order: "asc",
    },

    pagination: {
      perPage: 5,
      currentPage: 1,
      perPageOptions: [5, 10, 25, 50],
    },

    // 权限编辑相关数据
    showPermissionDialog: false,
    selectedUser: {},
    editablePermissions: {},
    savingPermissions: false,
  }),

  computed: {
    sort() {
      if (this.sortation.order === "desc") {
        return `-${this.sortation.field}`;
      }

      return this.sortation.field;
    },

    filteredTable() {
      let filtered = this.table;

      // 角色过滤
      if (this.filters.role) {
        filtered = filtered.filter(item => item.role === this.filters.role);
      }

      // 部门过滤
      if (this.filters.department) {
        filtered = filtered.filter(item => item.department === this.filters.department);
      }

      // 状态过滤
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
    // 监听筛选条件变化，重新获取数据
    filters: {
      handler() {
        this.pagination.currentPage = 1; // 重置到第一页
        this.getList();
      },
      deep: true
    },
    
    // 监听分页变化
    'pagination.currentPage'() {
      this.getList();
    },
    
    'pagination.perPage'() {
      this.pagination.currentPage = 1; // 重置到第一页
      this.getList();
    }
  },

  methods: {
    async getList() {
      try {
        // 从后端API获取用户列表
        const response = await this.$http.get('admin/users', {
          params: {
            page: this.pagination.currentPage,
            limit: this.pagination.perPage,
            role: this.filters.role || undefined,
            department: this.filters.department || undefined,
            isActive: this.filters.isActive || undefined
          }
        });

        if (response.data.success) {
          this.table = response.data.data.users;
          // 可以在这里处理分页信息
          // this.pagination.total = response.data.data.pagination.total;
        } else {
          throw new Error(response.data.message || '获取用户列表失败');
        }
      } catch (error) {
        console.error('获取用户列表失败:', error);
        
        // 如果API调用失败，显示错误信息
        this.$store.dispatch("alerts/error", 
          `获取用户列表失败: ${error.response?.data?.message || error.message}`
        );
        
        // 根据用户要求：不要使用模拟数据，所有数据必须从后端拿到进行修改
        console.error('不要使用模拟数据，所有数据必须从后端拿到进行修改');
        this.table = [];
        this.pagination.total = 0;
      }
    },


    onProFeature() {
      this.$store.dispatch("alerts/error", "这是PRO功能，暂未开放。");
    },

    handleEdit(user) {
      if (user.role === 'super_admin') {
        this.$store.dispatch("alerts/error", "无法编辑超级管理员账户");
        return;
      }
      this.onProFeature();
    },

    handleDelete(user) {
      if (user.role === 'super_admin') {
        this.$store.dispatch("alerts/error", "无法删除超级管理员账户");
        return;
      }
      this.onProFeature();
    },

    customSort() {
      return false;
    },

    getRoleClass(role) {
      const roleClasses = {
        'super_admin': 'md-accent',
        'admin': 'md-primary',
        'manager': 'md-success',
        'staff': 'md-warning'
      };
      return roleClasses[role] || 'md-default';
    },

    getRoleText(role) {
      const roleTexts = {
        'super_admin': '超级管理员',
        'admin': '管理员',
        'manager': '经理',
        'staff': '员工'
      };
      return roleTexts[role] || role;
    },

    getDepartmentText(department) {
      const departmentTexts = {
        'sales': '销售',
        'marketing': '市场',
        'customer_service': '客服',
        'inventory': '库存',
        'finance': '财务',
        'technical': '技术'
      };
      return departmentTexts[department] || department;
    },

    getPermissionLevel(permissions) {
      const totalCount = this.getPermissionCount(permissions);
      if (totalCount >= 15) return '完全权限';
      if (totalCount >= 10) return '高级权限';
      if (totalCount >= 5) return '标准权限';
      return '基础权限';
    },

    getPermissionLevelClass(permissions) {
      const totalCount = this.getPermissionCount(permissions);
      if (totalCount >= 15) return 'md-accent'; // 红色
      if (totalCount >= 10) return 'md-primary'; // 蓝色
      if (totalCount >= 5) return 'md-success'; // 绿色
      return 'md-warning'; // 橙色
    },

    getPermissionCount(permissions) {
      let count = 0;
      for (const [resource, actions] of Object.entries(permissions)) {
        for (const [action, allowed] of Object.entries(actions)) {
          if (allowed) count++;
        }
      }
      return count;
    },

    getPermissionTooltip(permissions) {
      const details = [];
      for (const [resource, actions] of Object.entries(permissions)) {
        const resourceActions = [];
        for (const [action, allowed] of Object.entries(actions)) {
          if (allowed) {
            resourceActions.push(this.getActionText(action));
          }
        }
        if (resourceActions.length > 0) {
          details.push(`${this.getResourceText(resource)}: ${resourceActions.join('、')}`);
        }
      }
      return details.join('\n');
    },

    getActivePermissions(permissions) {
      const activePerms = [];
      for (const [resource, actions] of Object.entries(permissions)) {
        for (const [action, allowed] of Object.entries(actions)) {
          if (allowed) {
            activePerms.push(`${this.getResourceText(resource)}-${this.getActionText(action)}`);
          }
        }
      }
      return activePerms.slice(0, 6); // 显示前6个权限
    },

    getResourceText(resource) {
      const resourceTexts = {
        'users': '用户',
        'products': '商品',
        'orders': '订单',
        'analytics': '分析',
        'settings': '设置'
      };
      return resourceTexts[resource] || resource;
    },

    getActionText(action) {
      const actionTexts = {
        'view': '查看',
        'create': '创建',
        'edit': '编辑',
        'delete': '删除',
        'export': '导出'
      };
      return actionTexts[action] || action;
    },

    formatDate(dateString) {
      if (!dateString) return '从未登录';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    },

    truncateEmail(email) {
      if (!email) return '';
      
      // 如果邮箱长度小于等于20，直接返回
      if (email.length <= 20) {
        return email;
      }
      
      // 找到 @ 符号的位置
      const atIndex = email.indexOf('@');
      if (atIndex === -1) return email;
      
      const localPart = email.substring(0, atIndex);
      const domainPart = email.substring(atIndex);
      
      // 如果用户名部分过长，截断用户名部分
      if (localPart.length > 8) {
        return localPart.substring(0, 6) + '...' + domainPart;
      }
      
      // 如果域名部分过长，截断域名部分
      if (domainPart.length > 12) {
        return localPart + '@...' + domainPart.substring(domainPart.lastIndexOf('.'));
      }
      
      return email;
    },

    handleImageError(event) {
      event.target.src = '/img/default.jpg';
    },

    toggleUserStatus(user) {
      // 模拟状态切换
      if (user.role === 'super_admin') {
        this.$store.dispatch("alerts/error", "无法修改超级管理员状态");
        return;
      }
      user.isActive = !user.isActive;
      this.$store.dispatch("alerts/success", 
        `用户 ${user.username} 已${user.isActive ? '激活' : '停用'}`
      );
    },

    // 编辑用户权限
    editUserPermissions(user) {
      this.selectedUser = { ...user };
      
      // 如果是超级管理员，显示提示信息
      if (user.role === 'super_admin') {
        this.editablePermissions = {};
      } else {
        // 深拷贝权限对象以避免直接修改原数据
        this.editablePermissions = JSON.parse(JSON.stringify(user.permissions));
      }
      
      this.showPermissionDialog = true;
    },

    // 关闭权限编辑对话框
    closePermissionDialog() {
      this.showPermissionDialog = false;
      this.selectedUser = {};
      this.editablePermissions = {};
      this.savingPermissions = false;
    },

    // 保存权限
    async savePermissions() {
      if (this.selectedUser.role === 'super_admin') {
        this.$store.dispatch("alerts/error", "超级管理员权限不可修改");
        return;
      }

      this.savingPermissions = true;

      try {
        // 调用后端API保存权限
        const response = await this.$http.put(`admin/users/${this.selectedUser._id}/permissions`, {
          permissions: this.editablePermissions
        });

        if (response.data.success) {
          // 更新本地数据
          const userIndex = this.table.findIndex(u => u._id === this.selectedUser._id);
          if (userIndex !== -1) {
            this.table[userIndex].permissions = { ...this.editablePermissions };
            // 如果后端返回了更新后的用户数据，使用它
            if (response.data.data && response.data.data.user) {
              Object.assign(this.table[userIndex], response.data.data.user);
            }
          }

          this.$store.dispatch("alerts/success", 
            response.data.message || `用户 ${this.selectedUser.username} 的权限已更新`
          );

          this.closePermissionDialog();
        } else {
          throw new Error(response.data.message || '保存权限失败');
        }
      } catch (error) {
        console.error('保存权限失败:', error);
        
        let errorMessage = '保存权限失败，请重试';
        
        if (error.response) {
          const { status, data } = error.response;
          if (status === 403) {
            errorMessage = data.message || '没有权限修改该用户的权限';
          } else if (status === 404) {
            errorMessage = '用户不存在';
          } else if (status === 400) {
            errorMessage = data.message || '权限数据格式错误';
          } else if (data && data.message) {
            errorMessage = data.message;
          }
        }
        
        this.$store.dispatch("alerts/error", errorMessage);
      } finally {
        this.savingPermissions = false;
      }
    },

    // 获取资源图标
    getResourceIcon(resource) {
      const resourceIcons = {
        'users': 'people',
        'products': 'store',
        'orders': 'receipt',
        'analytics': 'bar_chart',
        'settings': 'settings'
      };
      return resourceIcons[resource] || 'folder';
    },

    // 获取操作样式类
    getActionClass(action) {
      const actionClasses = {
        'view': 'action-view',
        'create': 'action-create', 
        'edit': 'action-edit',
        'delete': 'action-delete',
        'export': 'action-export'
      };
      return actionClasses[action] || '';
    },

    // 获取操作描述
    getActionDescription(action) {
      const actionDescriptions = {
        'view': '可以查看和浏览',
        'create': '可以创建新项目',
        'edit': '可以修改现有项目',
        'delete': '可以删除项目',
        'export': '可以导出数据'
      };
      return actionDescriptions[action] || '';
    },

    showPermissionDetails(user) {
      const details = [];
      for (const [resource, actions] of Object.entries(user.permissions)) {
        const resourceActions = [];
        for (const [action, allowed] of Object.entries(actions)) {
          if (allowed) {
            resourceActions.push(this.getActionText(action));
          }
        }
        if (resourceActions.length > 0) {
          details.push(`📋 ${this.getResourceText(resource)}: ${resourceActions.join('、')}`);
        }
      }
      
      const message = `
        <div style="text-align: left; font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;">
          <h3 style="color: #2196f3; margin-bottom: 15px; font-size: 18px;">
            👤 ${user.username} 的权限详情
          </h3>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
            <strong style="color: #333;">权限级别：</strong>
            <span style="color: #2196f3; font-weight: 500;">${this.getPermissionLevel(user.permissions)}</span>
            <span style="color: #666; margin-left: 10px;">(共${this.getPermissionCount(user.permissions)}项权限)</span>
          </div>
          <div style="line-height: 2; font-size: 14px;">
            ${details.join('<br>')}
          </div>
        </div>
      `;
      
      // 使用SweetAlert2显示详细信息
      import('sweetalert2').then(Swal => {
        Swal.default.fire({
          title: '',
          html: message,
          icon: 'info',
          showCloseButton: true,
          showConfirmButton: true,
          confirmButtonText: '知道了',
          confirmButtonColor: '#2196f3',
          width: '500px',
          customClass: {
            popup: 'permission-details-popup'
          }
        });
      }).catch(() => {
        // 如果SweetAlert2不可用，使用简单的alert
        this.$store.dispatch("alerts/success", `${user.username} 权限：${this.getPermissionLevel(user.permissions)}`);
      });
    },
  },
};
</script>
<style scoped>
#pro-feature {
  font-weight: bold;
}

.md-chip.md-mini {
  font-size: 10px !important;
  padding: 2px 6px !important;
  height: auto !important;
  margin: 1px !important;
}

.avatar-cell {
  display: flex;
  align-items: center;
}

.avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
  border: 2px solid #e0e0e0;
}

.email-cell {
  max-width: 180px;
  cursor: help;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email-cell:hover {
  color: #2196f3;
  background-color: #f8f9fa;
  padding: 2px 4px;
  border-radius: 3px;
  transition: all 0.2s ease;
}

.permissions-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: help;
  position: relative;
}

.permissions-summary:hover {
  opacity: 0.8;
}

.permissions-summary:hover::after {
  content: "点击查看详细权限";
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  z-index: 1000;
}

.permission-level {
  font-weight: 500;
  white-space: nowrap;
}

.permission-count {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.permissions-container {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  max-width: 200px;
}

.md-table-cell {
  vertical-align: middle !important;
}

.role-chip {
  font-weight: 500;
}

.status-chip {
  font-weight: 500;
}

.filters-row {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.filter-title {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 10px;
}

/* 确保超级管理员角色突出显示 */
.md-chip.md-accent {
  background-color: #ff5722 !important;
  color: white !important;
}

.md-chip.md-primary {
  background-color: #2196f3 !important;
  color: white !important;
}

.md-chip.md-success {
  background-color: #4caf50 !important;
  color: white !important;
}

.md-chip.md-warning {
  background-color: #ff9800 !important;
  color: white !important;
}

/* 禁用按钮样式 */
.md-button:disabled {
  opacity: 0.3 !important;
  cursor: not-allowed !important;
  background-color: #f5f5f5 !important;
  color: #bbb !important;
  box-shadow: none !important;
  border: 1px solid #e0e0e0 !important;
  pointer-events: all !important; /* 允许hover事件 */
}

.md-button:disabled:hover {
  opacity: 0.3 !important;
  transform: none !important;
  box-shadow: none !important;
  background-color: #f0f0f0 !important;
  cursor: not-allowed !important;
}

.md-button:disabled .md-icon {
  color: #bbb !important;
}

/* 为超级管理员操作列添加特殊样式 */
.super-admin-actions .md-button:disabled {
  background: repeating-linear-gradient(
    45deg,
    #f8f8f8,
    #f8f8f8 3px,
    #e8e8e8 3px,
    #e8e8e8 6px
  ) !important;
  border: 1px solid #ddd !important;
  position: relative;
}

.super-admin-actions .md-button:disabled:hover {
  background: repeating-linear-gradient(
    45deg,
    #f0f0f0,
    #f0f0f0 3px,
    #e0e0e0 3px,
    #e0e0e0 6px
  ) !important;
  cursor: not-allowed !important;
  animation: shake 0.5s ease-in-out;
}

.super-admin-actions .md-button:disabled::after {
  content: "🔒";
  position: absolute;
  top: -2px;
  right: -2px;
  font-size: 10px;
  background: #ff4444;
  color: white;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

/* 禁用按钮摇摆动画 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

/* 操作列容器样式 */
.super-admin-actions {
  position: relative;
}

.super-admin-actions::before {
  content: "超级管理员权限受保护";
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 68, 68, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
  z-index: 1000;
}

.super-admin-actions:hover::before {
  opacity: 1;
}

/* 权限详情弹窗样式 */
::v-deep .permission-details-popup {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif !important;
}

::v-deep .permission-details-popup .swal2-html-container {
  text-align: left !important;
  max-height: 400px;
  overflow-y: auto;
}

/* 权限编辑对话框样式 */
.super-admin-notice {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #fff3e0;
  border: 1px solid #ffcc80;
  border-radius: 8px;
  margin-bottom: 16px;
}

.permissions-editor {
  padding: 8px 0;
}

.permission-group {
  margin-bottom: 24px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.permission-resource-title {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 12px 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.resource-icon {
  margin-right: 8px;
  color: #2196f3;
  font-size: 20px !important;
}

.permission-actions {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.permission-checkbox {
  margin-bottom: 8px !important;
}

.permission-checkbox .md-checkbox {
  margin-right: 8px;
}

.action-text {
  font-weight: 500;
  color: #333;
}

.action-desc {
  font-size: 12px;
  color: #666;
  margin-left: 4px;
}

/* 不同操作类型的颜色 */
.action-view .md-checkbox-container::after {
  border-color: #4caf50 !important;
}

.action-create .md-checkbox-container::after {
  border-color: #2196f3 !important;
}

.action-edit .md-checkbox-container::after {
  border-color: #ff9800 !important;
}

.action-delete .md-checkbox-container::after {
  border-color: #f44336 !important;
}

.action-export .md-checkbox-container::after {
  border-color: #9c27b0 !important;
}

.permission-checkbox.md-checked .action-view .action-text {
  color: #4caf50;
}

.permission-checkbox.md-checked .action-create .action-text {
  color: #2196f3;
}

.permission-checkbox.md-checked .action-edit .action-text {
  color: #ff9800;
}

.permission-checkbox.md-checked .action-delete .action-text {
  color: #f44336;
}

.permission-checkbox.md-checked .action-export .action-text {
  color: #9c27b0;
}

/* 权限对话框容器样式 */
::v-deep .md-dialog {
  max-width: 600px;
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

/* 权限提示悬浮提示更新 */
.permissions-summary:hover::after {
  content: "点击编辑权限";
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  z-index: 1000;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .permissions-container {
    max-width: 150px;
  }
  
  .avatar-img {
    width: 30px;
    height: 30px;
  }
  
  .md-chip {
    font-size: 11px !important;
  }
  
  .email-cell {
    max-width: 120px;
    font-size: 12px;
  }
  
  ::v-deep .permission-details-popup {
    width: 90% !important;
  }

  ::v-deep .md-dialog {
    width: 95%;
    max-width: none;
  }

  .permission-actions {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .permission-resource-title {
    font-size: 14px;
    padding: 10px 12px;
  }

  .resource-icon {
    font-size: 18px !important;
  }
}

@media (max-width: 480px) {
  .email-cell {
    max-width: 100px;
    font-size: 11px;
  }

  ::v-deep .md-dialog-title {
    padding: 16px 20px 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .permissions-editor {
    padding: 4px 0;
  }

  .permission-group {
    margin-bottom: 16px;
  }

  .permission-actions {
    padding: 12px;
  }
}
</style>
