<template>
  <div class="fixed-plugin" v-click-outside="closeDropDown">
    <div class="dropdown show-dropdown" :class="{ show: isOpen }">
      <a data-toggle="dropdown">
        <i class="fa fa-cog fa-2x" @click="toggleDropDown"> </i>
      </a>
      <ul class="dropdown-menu" :class="{ show: isOpen }">
        <li class="header-title">侧边栏颜色</li>
        <li class="adjustments-line text-center">
          <span
              v-for="item in sidebarColors"
              :key="item.color"
              class="badge filter"
              :class="[`badge-${item.color}`, { active: item.active }]"
              :data-color="item.color"
              @click="changeSidebarBackground(item)"
          >
          </span>
        </li>
        <li class="header-title">侧边栏背景</li>
        <li class="adjustments-line text-center">
          <span
              v-for="item in sidebarBg"
              :key="item.colorBg"
              class="badge filter"
              :class="[`badge-${item.colorBg}`, { active: item.active }]"
              :data-color="item.colorBg"
              @click="changeSidebarBg(item)"
          >
          </span>
        </li>
        <li class="adjustments-line sidebar-mini">
          侧边栏收缩
          <md-switch
              :value="!sidebarMini"
              @change="val => updateValue('sidebarMini', val)"
          ></md-switch>
        </li>
        <li class="adjustments-line sidebar-img">
          侧边栏背景图
          <md-switch
              :value="!sidebarImg"
              @change="val => updateValueImg('sidebarImg', val)"
          ></md-switch>
        </li>
        <li class="adjustments-line main-bg">
          主页面背景
          <md-switch
              :value="!mainBgImg"
              @change="val => updateValueMainBg('mainBgImg', val)"
          ></md-switch>
        </li>

        <li class="header-title">侧边栏背景图片</li>
        <li
            v-for="item in sidebarImages"
            :key="item.image"
            :class="{ active: item.active }"
            @click="changeSidebarImage(item)"
        >
          <a class="img-holder switch-trigger">
            <img :src="item.image" alt=""/>
          </a>
        </li>

        <li class="header-title main-bg-section">主页面背景图片</li>
        <li
            v-for="item in mainBgImages"
            :key="item.image"
            :class="{ active: item.active }"
            @click="changeMainBgImage(item)"
        >
          <a class="img-holder switch-trigger">
            <img :src="item.image" alt=""/>
          </a>
        </li>


      </ul>
    </div>
  </div>
</template>
<script>

  export default {
    props: {
      sidebarMini: Boolean,
      sidebarImg: Boolean,
      mainBgImg: Boolean
    },
    data() {
      return {
        isOpen: false,
        backgroundImage: `${process.env.VUE_APP_BASE_URL}/img/sidebar-2.jpg`,
        sidebarColors: [
          {color: "purple", active: false},
          {color: "azure", active: false},
          {color: "green", active: true},
          {color: "orange", active: false},
          {color: "rose", active: false},
          {color: "danger", active: false}
        ],
        sidebarBg: [
          {colorBg: "black", active: true},
          {colorBg: "white", active: false},
          {colorBg: "red", active: false}
        ],
        sidebarImages: [
          {image: process.env.BASE_URL + 'img/back/back_1.jpg', active: false},
          {image: process.env.BASE_URL + 'img/back/back_2.jpg', active: true},
          {image: process.env.BASE_URL + 'img/back/back_3.jpg', active: false},
          {image: process.env.BASE_URL + 'img/back/back_4.jpg', active: false}
        ],
        mainBackgroundImage: `${process.env.VUE_APP_BASE_URL}/img/background_img_1.png`,
        mainBgImages: [
          {image: process.env.BASE_URL + 'img/background_img_1.png', active: true},
          {image: process.env.BASE_URL + 'img/background_img_2.png', active: false}
        ]
      };
    },
    methods: {
      toggleDropDown() {
        this.isOpen = !this.isOpen;
      },
      closeDropDown() {
        this.isOpen = false;
      },
      toggleList(list, itemToActivate) {
        list.forEach(listItem => {
          listItem.active = false;
        });
        itemToActivate.active = true;
      },
      updateValue(name, val) {
        this.$emit(`update:${name}`, val);
      },
      updateValueImg(name, val) {
        this.$emit(`update:${name}`, val);

        if (this.sidebarImg) {
          document.body.classList.toggle("sidebar-image");
          this.$emit("update:image", "");
        } else {
          document.body.classList.toggle("sidebar-image");
          this.$emit("update:image", this.backgroundImage);
        }
      },
      changeSidebarBackground(item) {
        this.$emit("update:color", item.color);
        this.toggleList(this.sidebarColors, item);
      },
      changeSidebarBg(item) {
        this.$emit("update:colorBg", item.colorBg);
        this.toggleList(this.sidebarBg, item);
      },
      changeSidebarImage(item) {
        if (this.sidebarImg) {
          this.$emit("update:image", item.image);
        }
        this.backgroundImage = item.image;
        this.toggleList(this.sidebarImages, item);
      },
      updateValueMainBg(name, val) {
        this.$emit(`update:${name}`, val);

        if (this.mainBgImg) {
          document.body.classList.toggle("main-background-image");
          this.$emit("update:mainImage", "");
        } else {
          document.body.classList.toggle("main-background-image");
          this.$emit("update:mainImage", this.mainBackgroundImage);
        }
      },
      changeMainBgImage(item) {
        if (this.mainBgImg) {
          this.$emit("update:mainImage", item.image);
        }
        this.mainBackgroundImage = item.image;
        this.toggleList(this.mainBgImages, item);
      }
    }
  };
</script>
<style>
  .centered-row {
    display: flex;
    height: 100%;
    align-items: center;
  }

  .button-container .btn {
    margin-right: 10px;
  }

  .centered-buttons {
    display: flex;
    justify-content: center;
  }

  /* 主页面背景图片区块分隔线 */
  .header-title.main-bg-section {
    border-top: 1px solid #e0e0e0;
    margin-top: 15px;
    padding-top: 20px;
    position: relative;
  }

  .header-title.main-bg-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 1px;
    background: linear-gradient(to right, transparent, #ddd, transparent);
  }

  /* 优化主页面背景图片显示宽度 */
  .header-title.main-bg-section ~ li:not(.adjustments-line):not(.header-title) {
    width: 50% !important; /* 两张图片各占50%宽度 */
    padding: 8px 4px; /* 调整内边距 */
  }
  
  .header-title.main-bg-section ~ li .img-holder {
    margin: 0; /* 重置边距 */
    padding: 4px; /* 减少内边距 */
  }
  
  .header-title.main-bg-section ~ li .img-holder img {
    width: 100%;
    height: 75px; /* 适中的高度 */
    object-fit: cover;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); /* 添加阴影效果 */
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .header-title.main-bg-section ~ li .img-holder:hover img {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }

</style>
