<template>
  <div class="md-layout">
    <div class="md-layout-item md-size-100">
      <!-- 基础设置 -->
      <md-card>
        <md-card-header class="md-card-header-icon md-card-header-green">
          <div class="card-icon">
            <md-icon>settings</md-icon>
          </div>
          <h4 class="title">系统设置</h4>
        </md-card-header>
        <md-card-content>
          <div class="md-layout">
            <!-- 网站基础信息 -->
            <div class="md-layout-item md-size-50">
              <h5 class="section-title">网站基础信息</h5>
              <md-field>
                <label>网站名称</label>
                <md-input v-model="settings.siteName" :disabled="!canEdit"></md-input>
              </md-field>
              <md-field>
                <label>网站副标题</label>
                <md-input v-model="settings.siteSubtitle" :disabled="!canEdit"></md-input>
              </md-field>
              <md-field>
                <label>网站域名</label>
                <md-input v-model="settings.siteDomain" :disabled="!canEdit"></md-input>
              </md-field>
              <md-field>
                <label>联系邮箱</label>
                <md-input v-model="settings.contactEmail" type="email" :disabled="!canEdit"></md-input>
              </md-field>
              <md-field>
                <label>客服电话</label>
                <md-input v-model="settings.servicePhone" :disabled="!canEdit"></md-input>
              </md-field>
            </div>

            <!-- 业务配置 -->
            <div class="md-layout-item md-size-50">
              <h5 class="section-title">业务配置</h5>
              <md-field>
                <label>默认货币</label>
                <md-select v-model="settings.defaultCurrency" :disabled="!canEdit">
                  <md-option value="CNY">人民币 (CNY)</md-option>
                  <md-option value="USD">美元 (USD)</md-option>
                  <md-option value="EUR">欧元 (EUR)</md-option>
                </md-select>
              </md-field>
              
              <md-field>
                <label>订单自动确认时间 (小时)</label>
                <md-input v-model="settings.autoConfirmHours" type="number" :disabled="!canEdit"></md-input>
              </md-field>
              
              <md-field>
                <label>订单自动完成时间 (天)</label>
                <md-input v-model="settings.autoCompletedays" type="number" :disabled="!canEdit"></md-input>
              </md-field>
              
              <div class="checkbox-group">
                <md-checkbox v-model="settings.enableGuestCheckout" :disabled="!canEdit">
                  允许游客结账
                </md-checkbox>
                <md-checkbox v-model="settings.enableReview" :disabled="!canEdit">
                  启用商品评价
                </md-checkbox>
                <md-checkbox v-model="settings.enableWishlist" :disabled="!canEdit">
                  启用商品收藏
                </md-checkbox>
                <md-checkbox v-model="settings.enableCoupon" :disabled="!canEdit">
                  启用优惠券功能
                </md-checkbox>
              </div>
            </div>
          </div>

          <div class="md-layout">
            <!-- 支付配置 -->
            <div class="md-layout-item md-size-50">
              <h5 class="section-title">支付配置</h5>
              
              <div class="payment-method">
                <h6>支付宝</h6>
                <md-checkbox v-model="settings.payment.alipay.enabled" :disabled="!canEdit">
                  启用支付宝
                </md-checkbox>
                <md-field v-if="settings.payment.alipay.enabled">
                  <label>应用ID</label>
                  <md-input v-model="settings.payment.alipay.appId" :disabled="!canEdit"></md-input>
                </md-field>
              </div>

              <div class="payment-method">
                <h6>微信支付</h6>
                <md-checkbox v-model="settings.payment.wechat.enabled" :disabled="!canEdit">
                  启用微信支付
                </md-checkbox>
                <md-field v-if="settings.payment.wechat.enabled">
                  <label>商户号</label>
                  <md-input v-model="settings.payment.wechat.mchId" :disabled="!canEdit"></md-input>
                </md-field>
              </div>

              <div class="payment-method">
                <h6>银行卡支付</h6>
                <md-checkbox v-model="settings.payment.bank.enabled" :disabled="!canEdit">
                  启用银行卡支付
                </md-checkbox>
              </div>
            </div>

            <!-- 物流配置 -->
            <div class="md-layout-item md-size-50">
              <h5 class="section-title">物流配置</h5>
              
              <md-field>
                <label>默认运费</label>
                <md-input v-model="settings.shipping.defaultFee" type="number" :disabled="!canEdit">
                  <span md-suffix>元</span>
                </md-input>
              </md-field>
              
              <md-field>
                <label>免运费门槛</label>
                <md-input v-model="settings.shipping.freeThreshold" type="number" :disabled="!canEdit">
                  <span md-suffix>元</span>
                </md-input>
              </md-field>

              <div class="shipping-methods">
                <h6>配送方式</h6>
                <md-checkbox v-model="settings.shipping.methods.standard" :disabled="!canEdit">
                  标准配送 (3-5天)
                </md-checkbox>
                <md-checkbox v-model="settings.shipping.methods.express" :disabled="!canEdit">
                  快速配送 (1-2天)
                </md-checkbox>
                <md-checkbox v-model="settings.shipping.methods.overnight" :disabled="!canEdit">
                  次日达
                </md-checkbox>
              </div>
            </div>
          </div>

          <div class="md-layout">
            <!-- 安全设置 -->
            <div class="md-layout-item md-size-50">
              <h5 class="section-title">安全设置</h5>
              
              <md-field>
                <label>会话超时时间 (分钟)</label>
                <md-input v-model="settings.security.sessionTimeout" type="number" :disabled="!canEdit"></md-input>
              </md-field>
              
              <md-field>
                <label>密码最小长度</label>
                <md-input v-model="settings.security.minPasswordLength" type="number" :disabled="!canEdit"></md-input>
              </md-field>
              
              <md-field>
                <label>登录失败锁定次数</label>
                <md-input v-model="settings.security.maxLoginAttempts" type="number" :disabled="!canEdit"></md-input>
              </md-field>

              <div class="security-options">
                <md-checkbox v-model="settings.security.requireTwoFactor" :disabled="!canEdit">
                  强制双因子认证
                </md-checkbox>
                <md-checkbox v-model="settings.security.enableCaptcha" :disabled="!canEdit">
                  启用验证码
                </md-checkbox>
                <md-checkbox v-model="settings.security.enableIpWhitelist" :disabled="!canEdit">
                  启用IP白名单
                </md-checkbox>
              </div>
            </div>

            <!-- 通知设置 -->
            <div class="md-layout-item md-size-50">
              <h5 class="section-title">通知设置</h5>
              
              <div class="notification-types">
                <h6>邮件通知</h6>
                <md-checkbox v-model="settings.notifications.email.orderCreated" :disabled="!canEdit">
                  新订单通知
                </md-checkbox>
                <md-checkbox v-model="settings.notifications.email.paymentReceived" :disabled="!canEdit">
                  付款成功通知
                </md-checkbox>
                <md-checkbox v-model="settings.notifications.email.lowStock" :disabled="!canEdit">
                  库存不足通知
                </md-checkbox>
              </div>

              <div class="notification-types">
                <h6>短信通知</h6>
                <md-checkbox v-model="settings.notifications.sms.orderStatus" :disabled="!canEdit">
                  订单状态变更
                </md-checkbox>
                <md-checkbox v-model="settings.notifications.sms.deliveryUpdate" :disabled="!canEdit">
                  配送状态更新
                </md-checkbox>
              </div>

              <md-field>
                <label>短信服务商</label>
                <md-select v-model="settings.notifications.smsProvider" :disabled="!canEdit">
                  <md-option value="aliyun">阿里云</md-option>
                  <md-option value="tencent">腾讯云</md-option>
                  <md-option value="huawei">华为云</md-option>
                </md-select>
              </md-field>
            </div>
          </div>

          <!-- 保存按钮 -->
          <div class="button-group" v-if="canEdit">
            <md-button class="md-primary md-raised" @click="saveSettings">
              <md-icon>save</md-icon>
              保存设置
            </md-button>
            <md-button class="md-default" @click="resetSettings">
              <md-icon>refresh</md-icon>
              重置
            </md-button>
          </div>
        </md-card-content>
      </md-card>

      <!-- 系统信息 -->
      <md-card>
        <md-card-header class="md-card-header-icon md-card-header-info">
          <div class="card-icon">
            <md-icon>info</md-icon>
          </div>
          <h4 class="title">系统信息</h4>
        </md-card-header>
        <md-card-content>
          <div class="system-info">
            <div class="info-item">
              <span class="info-label">系统版本:</span>
              <span class="info-value">全品汇电商系统 v2.1.0</span>
            </div>
            <div class="info-item">
              <span class="info-label">数据库版本:</span>
              <span class="info-value">MongoDB 5.0.8</span>
            </div>
            <div class="info-item">
              <span class="info-label">Node.js版本:</span>
              <span class="info-value">v18.17.0</span>
            </div>
            <div class="info-item">
              <span class="info-label">服务器运行时间:</span>
              <span class="info-value">{{ serverUptime }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">最后更新:</span>
              <span class="info-value">{{ lastUpdate }}</span>
            </div>
          </div>
        </md-card-content>
      </md-card>
    </div>
  </div>
</template>

<script>
import permissionsMixin from "@/mixins/permissions";

export default {
  name: "SystemSettings",
  mixins: [permissionsMixin],

  data() {
    return {
      settings: {
        // 网站基础信息
        siteName: "全品汇电商平台",
        siteSubtitle: "汇聚全球精品，创造无限价值",
        siteDomain: "www.quanpinhui.com",
        contactEmail: "support@quanpinhui.com",
        servicePhone: "400-888-0000",

        // 业务配置
        defaultCurrency: "CNY",
        autoConfirmHours: 48,
        autoCompletedays: 7,
        enableGuestCheckout: true,
        enableReview: true,
        enableWishlist: true,
        enableCoupon: true,

        // 支付配置
        payment: {
          alipay: {
            enabled: true,
            appId: "2021000000000000"
          },
          wechat: {
            enabled: true,
            mchId: "1600000000"
          },
          bank: {
            enabled: false
          }
        },

        // 物流配置
        shipping: {
          defaultFee: 8,
          freeThreshold: 99,
          methods: {
            standard: true,
            express: true,
            overnight: false
          }
        },

        // 安全设置
        security: {
          sessionTimeout: 120,
          minPasswordLength: 8,
          maxLoginAttempts: 5,
          requireTwoFactor: false,
          enableCaptcha: true,
          enableIpWhitelist: false
        },

        // 通知设置
        notifications: {
          email: {
            orderCreated: true,
            paymentReceived: true,
            lowStock: true
          },
          sms: {
            orderStatus: true,
            deliveryUpdate: true
          },
          smsProvider: "aliyun"
        }
      },

      serverUptime: "15天 8小时 23分钟",
      lastUpdate: "2025-09-07 14:30:00"
    };
  },

  computed: {
    canEdit() {
      return this.hasPermission('settings', 'edit');
    }
  },

  created() {
    this.checkPermissions();
    this.loadSettings();
  },

  methods: {
    checkPermissions() {
      if (!this.hasPermission('settings', 'view')) {
        this.handleUnauthorized('您没有权限查看系统设置');
        this.$router.push('/dashboard');
        return;
      }
    },

    loadSettings() {
      // 从后端加载设置
      // 这里使用模拟数据
      console.log('加载系统设置...');
    },

    saveSettings() {
      if (!this.canEdit) {
        this.handleUnauthorized('您没有权限修改系统设置');
        return;
      }

      // 保存设置到后端
      this.$store.dispatch("alerts/success", "系统设置保存成功");
    },

    resetSettings() {
      if (!this.canEdit) {
        this.handleUnauthorized('您没有权限重置系统设置');
        return;
      }

      // 重置为默认设置
      this.loadSettings();
      this.$store.dispatch("alerts/success", "设置已重置为默认值");
    },
  },
};
</script>

<style scoped>
.section-title {
  color: #4caf50;
  border-bottom: 2px solid #4caf50;
  padding-bottom: 10px;
  margin-bottom: 20px;
  font-weight: 500;
}

.checkbox-group {
  margin-top: 20px;
}

.checkbox-group .md-checkbox {
  margin-bottom: 10px;
}

.payment-method {
  margin-bottom: 25px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.payment-method h6 {
  margin: 0 0 10px 0;
  color: #333;
  font-weight: 500;
}

.shipping-methods {
  margin-top: 20px;
}

.shipping-methods h6 {
  margin-bottom: 10px;
  color: #333;
  font-weight: 500;
}

.security-options {
  margin-top: 20px;
}

.security-options .md-checkbox {
  margin-bottom: 10px;
}

.notification-types {
  margin-bottom: 20px;
}

.notification-types h6 {
  margin-bottom: 10px;
  color: #333;
  font-weight: 500;
}

.notification-types .md-checkbox {
  margin-bottom: 8px;
}

.button-group {
  margin-top: 30px;
  text-align: center;
}

.button-group .md-button {
  margin: 0 10px;
  min-width: 120px;
}

.system-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.info-label {
  font-weight: 500;
  color: #495057;
}

.info-value {
  color: #6c757d;
  font-family: 'Courier New', monospace;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .payment-method {
    margin-bottom: 15px;
    padding: 10px;
  }
  
  .info-item {
    flex-direction: column;
    text-align: left;
  }
  
  .info-value {
    margin-top: 5px;
  }
  
  .button-group .md-button {
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>
