<template>
  <div class="md-layout">
    <div class="md-layout-item md-medium-size-50 md-xsmall-size-100 md-size-25">
      <stats-card header-color="blue">
        <template slot="header">
          <div class="card-icon">
            <i class="fab fa-twitter"></i>
    </div>
          <p class="category">关注者</p>
          <h3 class="title">
            +245
          </h3>
        </template>

        <template slot="footer">
          <div class="stats">
            <md-icon>update</md-icon>
            刚刚更新
    </div>
        </template>
      </stats-card>
          </div>
    <div class="md-layout-item md-medium-size-50 md-xsmall-size-100 md-size-25">
      <stats-card header-color="rose">
        <template slot="header">
          <div class="card-icon">
            <md-icon>equalizer</md-icon>
              </div>
          <p class="category">网站访问量</p>
          <h3 class="title">
            75.521
          </h3>
        </template>

        <template slot="footer">
          <div class="stats">
            <md-icon>local_offer</md-icon>
            Tracked from Google Analytics
          </div>
        </template>
      </stats-card>
          </div>
    <div class="md-layout-item md-medium-size-50 md-xsmall-size-100 md-size-25">
      <stats-card header-color="green">
        <template slot="header">
          <div class="card-icon">
            <md-icon>store</md-icon>
        </div>
          <p class="category">营收</p>
          <h3 class="title">
            $ 34.245
          </h3>
        </template>

        <template slot="footer">
          <div class="stats">
            <md-icon>date_range</md-icon>
            过去24小时
    </div>
        </template>
      </stats-card>
          </div>
    <div class="md-layout-item md-medium-size-50 md-xsmall-size-100 md-size-25">
      <stats-card header-color="warning">
        <template slot="header">
          <div class="card-icon">
            <md-icon>weekend</md-icon>
        </div>
          <p class="category">预订量</p>
          <h3 class="title">
            184
          </h3>
        </template>

        <template slot="footer">
          <div class="stats">
            <md-icon class="text-danger">warning</md-icon>
            <a href="#pablo">获取更多空间...</a>
              </div>
        </template>
      </stats-card>
            </div>
    <div
      class="md-layout-item md-medium-size-100 md-xsmall-size-100 md-size-33"
    >
      <chart-card
        :chart-data="emailsSubscriptionChart.data"
        :chart-options="emailsSubscriptionChart.options"
        :chart-responsive-options="emailsSubscriptionChart.responsiveOptions"
        chart-type="Bar"
        chart-inside-header
        background-color="rose"
      >
        <md-icon slot="fixed-button">build</md-icon>
        <md-button class="md-simple md-info md-just-icon" slot="first-button">
          <md-icon>refresh</md-icon>
          <md-tooltip md-direction="bottom">Refresh</md-tooltip>
        </md-button>
        <md-button class="md-simple md-just-icon" slot="second-button">
          <md-icon>edit</md-icon>
          <md-tooltip md-direction="bottom">Change Date</md-tooltip>
        </md-button>

        <template slot="content">
          <h4 class="title">网站浏览量</h4>
          <p class="category">
            上次营销活动表现
          </p>
        </template>

        <template slot="footer">
          <div class="stats">
            <md-icon>access_time</md-icon>
            10天前更新
          </div>
        </template>
      </chart-card>
              </div>
    <div
      class="md-layout-item md-medium-size-100 md-xsmall-size-100 md-size-33"
    >
      <chart-card
        :chart-data="dailySalesChart.data"
        :chart-options="dailySalesChart.options"
        chart-type="Line"
        chart-inside-header
        background-color="green"
      >
        <md-button class="md-simple md-info md-just-icon" slot="first-button">
          <md-icon>refresh</md-icon>
          <md-tooltip md-direction="bottom">Refresh</md-tooltip>
        </md-button>
        <md-button class="md-simple md-just-icon" slot="second-button">
          <md-icon>edit</md-icon>
          <md-tooltip md-direction="bottom">Change Date</md-tooltip>
        </md-button>

        <template slot="content">
          <h4 class="title">每日销售</h4>
          <p class="category">
            <span class="text-success"
              ><i class="fas fa-long-arrow-alt-up"></i>
              55%
            </span>
            今日销售增长。
          </p>
        </template>

        <template slot="footer">
          <div class="stats">
            <md-icon>access_time</md-icon>
            4分钟前更新
          </div>
        </template>
      </chart-card>
            </div>
    <div
      class="md-layout-item md-medium-size-100 md-xsmall-size-100 md-size-33"
    >
      <chart-card
        :chart-data="dataCompletedTasksChart.data"
        :chart-options="dataCompletedTasksChart.options"
        chart-type="Line"
        chart-inside-header
        background-color="blue"
      >
        <md-button class="md-simple md-info md-just-icon" slot="first-button">
          <md-icon>refresh</md-icon>
          <md-tooltip md-direction="bottom">Refresh</md-tooltip>
        </md-button>
        <md-button class="md-simple md-just-icon" slot="second-button">
          <md-icon>edit</md-icon>
          <md-tooltip md-direction="bottom">Change Date</md-tooltip>
        </md-button>

        <template slot="content">
          <h4 class="title">Completed Tasks</h4>
          <p class="category">
            Last Campaign Performance
          </p>
        </template>

        <template slot="footer">
          <div class="stats">
            <md-icon>access_time</md-icon>
            26分钟前发送的营销活动
          </div>
        </template>
      </chart-card>
    </div>

    <div class="md-layout-item md-medium-size-100 md-xsmall-size-100 md-size-50">
      <md-card>
        <md-card-header class="md-card-header-text md-card-header-warning">
          <div class="card-text">
            <h4 class="title">Employees Stats</h4>
            <p class="category">
              New employees on 15th September, 2016
            </p>
      </div>
        </md-card-header>
        <md-card-content>
          <md-table v-model="users" table-header-color="orange">
            <md-table-row slot="md-table-row" slot-scope="{ item }">
              <md-table-cell md-label="Id">{{ item.id }}</md-table-cell>
              <md-table-cell md-label="Name">{{ item.name }}</md-table-cell>
              <md-table-cell md-label="Salary">{{ item.salary }}</md-table-cell>
              <md-table-cell md-label="Country">{{ item.country }}</md-table-cell>
            </md-table-row>
          </md-table>
        </md-card-content>
      </md-card>
    </div>

    <div class="md-layout-item md-medium-size-100 md-xsmall-size-100 md-size-50">
      <nav-tabs-card>
        <template slot="content">
          <span class="md-nav-tabs-title">Tasks</span>
          <md-tabs class="md-rose" md-alignment="left">
            <md-tab id="tab-home" md-label="Bugs" md-icon="bug_report">
              <md-table v-model="firstTabs" @md-selected="onSelect">
                <md-table-row
                    slot="md-table-row"
                    slot-scope="{ item }"
                    md-selectable="multiple"
                    md-auto-select
                >
                  <md-table-cell>{{ item.tab }}</md-table-cell>
                  <md-table-cell>
                    <md-button class="md-just-icon md-simple md-primary">
                      <md-icon>edit</md-icon>
                      <md-tooltip md-direction="top">Edit</md-tooltip>
                    </md-button>
                    <md-button class="md-just-icon md-simple md-danger">
                      <md-icon>close</md-icon>
                      <md-tooltip md-direction="top">Close</md-tooltip>
                    </md-button>
                  </md-table-cell>
                </md-table-row>
              </md-table>
            </md-tab>

            <md-tab id="tab-pages" md-label="Website" md-icon="code">
              <md-table v-model="secondTabs" @md-selected="onSelect">
                <md-table-row
                    slot="md-table-row"
                    slot-scope="{ item }"
                    md-selectable="multiple"
                    md-auto-select
                >
                  <md-table-cell>{{ item.tab }}</md-table-cell>
                  <md-table-cell>
                    <md-button class="md-just-icon md-simple md-primary">
                      <md-icon>edit</md-icon>
                      <md-tooltip md-direction="top">Edit</md-tooltip>
                    </md-button>
                    <md-button class="md-just-icon md-simple md-danger">
                      <md-icon>close</md-icon>
                      <md-tooltip md-direction="top">Close</md-tooltip>
                    </md-button>
                  </md-table-cell>
                </md-table-row>
              </md-table>
            </md-tab>

            <md-tab id="tab-posts" md-label="Server" md-icon="cloud">
              <md-table v-model="thirdTabs" @md-selected="onSelect">
                <md-table-row
                    slot="md-table-row"
                    slot-scope="{ item }"
                    md-selectable="multiple"
                    md-auto-select
                >
                  <md-table-cell>{{ item.tab }}</md-table-cell>
                  <md-table-cell>
                    <md-button class="md-just-icon md-simple md-primary">
                      <md-icon>edit</md-icon>
                      <md-tooltip md-direction="top">Edit</md-tooltip>
                    </md-button>
                    <md-button class="md-just-icon md-simple md-danger">
                      <md-icon>close</md-icon>
                      <md-tooltip md-direction="top">Close</md-tooltip>
                    </md-button>
                  </md-table-cell>
                </md-table-row>
              </md-table>
            </md-tab>

          </md-tabs>
        </template>
      </nav-tabs-card>
    </div>

  </div>
</template>

<script>

import {
  StatsCard,
  ChartCard,
  NavTabsCard
} from "@/components";

export default {
  components: {
    StatsCard,
    ChartCard,
    NavTabsCard
  },

  data() {
    return {
      product1: process.env.VUE_APP_BASE_URL + "/img/card-2.jpg",
      product2: process.env.VUE_APP_BASE_URL + "/img/card-3.jpg",
      product3: process.env.VUE_APP_BASE_URL + "/img/card-1.jpg",
      seq2: 0,

      selected: [],
      firstTabs: [
        { tab: "Sign contract for \"What are conference organizers afraid of?\""},
        { tab: "Lines From Great Russian Literature? Or E-mails From My Boss?" },
        { tab: "Flooded: One year later, assessing what was lost and what was found when a ravaging rain swept through metro Detroit" },
        { tab: "Create 4 Invisible User Experiences you Never Knew About" }
      ],
      secondTabs: [
        {
          tab:
            "Flooded: One year later, assessing what was lost and what was found when a ravaging rain swept through metro Detroit"
        },
        {
          tab:
            "Sign contract for \"What are conference organizers afraid of?\""
        }
      ],
      thirdTabs: [
        {
          tab:
            "Lines From Great Russian Literature? Or E-mails From My Boss?"
        },
        {
          tab:
            "Flooded: One year later, assessing what was lost and what was found when a ravaging rain swept through metro Detroit"
        },
        {
          tab:
            "Sign contract for \"What are conference organizers afraid of?\""
        }
      ],

      users: [
        {
          id: 1,
          name: "Noelia O'Kon",
          salary: "13098.00",
          country: "Niger"
        },
        {
          id: 2,
          name: "Mr. Enid Von PhD",
          salary: "35978.00",
          country: "Curaçao"
        },
        {
          id: 3,
          name: "Colton Koch",
          salary: "26278.00",
          country: "Netherlands"
        },
        {
          id: 4,
          name: "Gregory Vandervort",
          salary: "25537.00",
          country: "South Korea"
        },
      ],
      dailySalesChart: {
        data: {
          labels: ["M", "T", "W", "T", "F", "S", "S"],
          series: [[12, 17, 7, 17, 23, 18, 38]]
        },
        options: {
          lineSmooth: false, // 简化配置，避免插值错误
          low: 0,
          high: 50, // 建议设置为最大值加上一些额外值以获得更好的外观
          chartPadding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
          }
        }
      },
      dataCompletedTasksChart: {
        data: {
          labels: ["12am", "3pm", "6pm", "9pm", "12pm", "3am", "6am", "9am"],
          series: [[230, 750, 450, 300, 280, 240, 200, 190]]
        },

        options: {
          lineSmooth: false, // 简化配置，避免插值错误
          low: 0,
          high: 1000, // 建议设置为最大值加上一些额外值以获得更好的外观
          chartPadding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
          }
        }
      },
      emailsSubscriptionChart: {
        data: {
          labels: [
            "Ja",
            "Fe",
            "Ma",
            "Ap",
            "Mai",
            "Ju",
            "Jul",
            "Au",
            "Se",
            "Oc",
            "No",
            "De"
          ],
          series: [[542, 443, 320, 780, 553, 453, 326, 434, 568, 610, 756, 895]]
        },
        options: {
          axisX: {
            showGrid: false
          },
          low: 0,
          high: 1000,
          chartPadding: {
            top: 0,
            right: 5,
            bottom: 0,
            left: 0
          }
        },
        responsiveOptions: [
          [
            "screen and (max-width: 640px)",
            {
              seriesBarDistance: 5,
              axisX: {
                labelInterpolationFnc: function(value) {
                  return value && value.length > 0 ? value[0] : value;
                }
              }
            }
          ]
        ]
      }
    };
  },

  methods: {
    onSelect: function(items) {
      this.selected = items;
    },
    
    // 清理Dashboard页面的Vue Material组件
    cleanupDashboardComponents() {
      try {
        // 清理md-tabs组件的MutationObserver
        const mdTabs = this.$el.querySelector('.md-tabs');
        if (mdTabs && mdTabs.__vue__) {
          const tabsInstance = mdTabs.__vue__;
          if (tabsInstance.$el && tabsInstance.$el.querySelectorAll) {
            // 断开所有tabs相关的观察器
            const tabElements = tabsInstance.$el.querySelectorAll('.md-tab');
            tabElements.forEach(tab => {
              if (tab._mutationObserver) {
                tab._mutationObserver.disconnect();
                tab._mutationObserver = null;
              }
              if (tab._resizeObserver) {
                tab._resizeObserver.disconnect();
                tab._resizeObserver = null;
              }
            });
          }
          
          // 清理tabs实例的观察器
          if (tabsInstance._mutationObserver) {
            tabsInstance._mutationObserver.disconnect();
            tabsInstance._mutationObserver = null;
          }
        }
        
        // 清理所有md-table组件
        const mdTables = this.$el.querySelectorAll('.md-table');
        mdTables.forEach(table => {
          if (table._mutationObserver) {
            table._mutationObserver.disconnect();
            table._mutationObserver = null;
          }
          if (table.__vue__ && table.__vue__._mutationObserver) {
            table.__vue__._mutationObserver.disconnect();
            table.__vue__._mutationObserver = null;
          }
        });
        
        // 清理所有md-tooltip
        const tooltips = this.$el.querySelectorAll('.md-tooltip');
        tooltips.forEach(tooltip => {
          if (tooltip._mutationObserver) {
            tooltip._mutationObserver.disconnect();
            tooltip._mutationObserver = null;
          }
        });
        
        console.log('✅ Dashboard组件清理完成');
      } catch (error) {
        console.warn('⚠️ Dashboard清理过程中出现警告:', error.message);
      }
    }
  },
  
  // 在组件销毁前清理所有Vue Material组件
  beforeDestroy() {
    console.log('🧹 Dashboard页面准备离开，开始清理...');
    this.cleanupDashboardComponents();
  },
  
  // 组件销毁时的最后清理
  destroyed() {
    console.log('🗑️ Dashboard页面已销毁');
  }
};
</script>
