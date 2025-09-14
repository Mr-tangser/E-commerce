<template>
  <view class="page" ref="page">
    <!-- 搜索 -->
    <view class="search-index">
      <!-- #ifndef H5 -->
      <view class="icon" @click="onCode">
        <text class="iconfont icon-saoyisao"></text>
      </view>
      <!-- #endif -->
      <!-- #ifdef  H5 -->
      <view class="icon" @click="onPayCode">
        <text class="iconfont icon-fukuanma"></text>
      </view>
      <!-- #endif -->
      <view class="search">
        <view class="iconfont icon-fadajing"></view>
        <input
          type="text"
          placeholder="输入搜索内容"
          v-model="searchKeyword"
          @input="onSearchInput"
          @confirm="onSearchConfirm"
        />
      </view>
      <view class="icon" @click="onMessage">
        <text class="iconfont icon-xiaoxi"></text>
      </view>
    </view>

    <!-- 分类数据 -->
    <view class="classify-data" :style="'height:' + height + 'px'">
      <!-- 左侧一级分类 -->
      <view class="classify-one">
        <scroll-view scroll-y class="classify-list">
          <view
            class="list"
            :class="{ action: currentCategoryIndex === index }"
            v-for="(category, index) in categories"
            :key="category.id"
            @click="switchCategory(index, category)"
          >
            <text>{{ category.name }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 右侧二、三级分类 -->
      <view class="classify-two-three">
        <scroll-view scroll-y class="scroll" v-if="currentCategory">
          <!-- 搜索结果 -->
          <view
            v-if="isSearching && searchResults.length > 0"
            class="search-results"
          >
            <view class="search-title">
              <text>搜索结果 ({{ searchResults.length }})</text>
            </view>
            <view class="classify-three">
              <view
                class="list"
                v-for="product in searchResults"
                :key="product.id || product._id || Math.random()"
                @click="goToProductDetail(product)"
              >
                <image
                  :src="getProductImage(product)"
                  mode="aspectFit"
                  @error="onImageError"
                  style="width: 80rpx; height: 80rpx; min-height: 80rpx; display: block;"
                ></image>
                <text>{{ getProductName(product) }}</text>
                <text class="price">¥{{ getProductPrice(product) }}</text>
              </view>
            </view>
          </view>

          <!-- 正常分类展示 -->
          <view v-else-if="!isSearching">

            <!-- 如果没有子分类，尝试直接显示当前分类的商品 -->
            <view
              v-if="
                (!currentCategory.children ||
                  currentCategory.children.length === 0) &&
                currentCategory.products &&
                currentCategory.products.length > 0
              "
              class="classify-two"
            >
              <view class="two-name">
                <view class="name">{{ currentCategory.name }}商品</view>
              </view>
              <view class="classify-three">
                <view
                  class="list"
                  v-for="product in currentCategory.products"
                  :key="
                    'direct-' + (product.id || product._id || Math.random())
                  "
                  @click="goToProductDetail(product)"
                >
                <image
                  :src="getProductImage(product)"
                  mode="aspectFit"
                  @error="onImageError"
                  class="product-image"
                ></image>
                  <text>{{ getProductName(product) }}</text>
                  <text class="price">¥{{ getProductPrice(product) }}</text>
                </view>
              </view>
            </view>

            <!-- 二级分类及其商品 -->
            <view
              v-for="subCategory in currentCategory.children"
              :key="subCategory.id"
              class="classify-two"
            >
              <view class="two-name">
                <view class="name">{{ subCategory.name }}</view>
                <view class="more" @click="goToCategoryProducts(subCategory)">
                  <text>查看全部</text>
                  <text class="iconfont icon-jiantou-you"></text>
                </view>
              </view>
              <view class="classify-three">
                <view
                  class="list"
                  v-for="product in subCategory.products"
                  :key="product.id || product._id || Math.random()"
                  @click="goToProductDetail(product)"
                >
                <image
                  :src="getProductImage(product)"
                  mode="aspectFit"
                  @error="onImageError"
                  class="product-image"
                ></image>
                  <text>{{ getProductName(product) }}</text>
                  <text class="price">¥{{ getProductPrice(product) }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 搜索无结果 -->
          <view
            v-else-if="isSearching && searchResults.length === 0"
            class="no-result"
          >
            <image src="/static/img/no-result.png" mode="aspectFit"></image>
            <text>未找到相关商品</text>
          </view>
        </scroll-view>

        <!-- 加载中状态 -->
        <view v-else-if="loading" class="loading-state">
          <view class="loading-spinner"></view>
          <text>加载中...</text>
        </view>

        <!-- 空状态 -->
        <view v-else class="empty-state">
          <image src="/static/img/empty-category.png" mode="aspectFit"></image>
          <text>暂无分类数据</text>
        </view>
      </view>
    </view>

    <!-- tabbar -->
    <TabBar :tabBarShow="1"></TabBar>
  </view>
</template>

<script>
import TabBar from "../../components/TabBar/TabBar.vue";
import api from "../../utils/api.js";

export default {
  components: {
    TabBar,
  },
  data() {
    return {
      height: 0,
      // 分类数据
      categories: [],
      currentCategoryIndex: 0,
      currentCategory: null,
      loading: false,

      // 搜索相关
      searchKeyword: "",
      isSearching: false,
      searchResults: [],
      searchTimer: null,
    };
  },

  async onLoad() {
    await this.loadCategories();
  },

  onReady() {
    setTimeout(() => {
      uni.hideTabBar();
    }, 100);
    let info = uni.createSelectorQuery().select(".page");
    info
      .boundingClientRect((data) => {
        console.log(data.height);
        this.height = data.height - 100;
        // #ifdef APP-PLUS
        this.height = data.height - 130;
        // #endif
      })
      .exec();
  },

  methods: {
    /**
     * 加载分类数据
     */
    async loadCategories() {
      try {
        this.loading = true;

        // 同时获取分类和商品数据
        const [categoryResponse, productResponse] = await Promise.all([
          api.category.getAllCategories(),
          api.product.getProducts(),
        ]);

        if (categoryResponse.success && categoryResponse.data) {
          // 处理分类数据
          let categoriesData = categoryResponse.data;
          if (
            categoriesData.categories &&
            Array.isArray(categoriesData.categories)
          ) {
            categoriesData = categoriesData.categories;
          } else if (!Array.isArray(categoriesData)) {
            if (categoriesData.data && Array.isArray(categoriesData.data)) {
              categoriesData = categoriesData.data;
            } else if (
              categoriesData.list &&
              Array.isArray(categoriesData.list)
            ) {
              categoriesData = categoriesData.list;
            } else {
              console.warn("⚠️ 分类API返回的数据格式不是数组，使用模拟数据");
              throw new Error("分类数据格式错误");
            }
          }

          this.categories = this.processCategories(categoriesData);

        // 处理商品数据并关联到分类
        if (productResponse.success && productResponse.data) {
          await this.associateProductsToCategories(productResponse.data);
        }

          // 默认选中第一个分类
          if (this.categories.length > 0) {
            this.switchCategory(0, this.categories[0]);
          }
        } else {
          throw new Error(categoryResponse.error?.message || "获取分类失败");
        }
      } catch (error) {
        console.error("❌ 加载分类数据失败:", error);

        uni.showToast({
          title: "数据加载失败，请重试",
          icon: "none",
        });

        this.categories = [];
        this.currentCategory = null;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 处理分类数据，确保数据结构正确
     */
    processCategories(categories) {
      // 检查输入是否为数组
      if (!Array.isArray(categories)) {
        console.error("❌ processCategories: 输入数据不是数组:", categories);
        return [];
      }

      try {
        return categories
          .map((category) => {
            // 检查基础数据
            if (!category || typeof category !== "object") {
              console.warn("⚠️ 跳过无效的分类数据:", category);
              return null;
            }

            return {
              id:
                category._id ||
                category.id ||
                `cat_${Date.now()}_${Math.random()}`,
              name: category.name || "未知分类",
              image: category.image || "/static/img/default-category.png",
              children:
                category.children && Array.isArray(category.children)
                  ? category.children
                      .map((child) => {
                        if (!child || typeof child !== "object") return null;
                        return {
                          id:
                            child._id ||
                            child.id ||
                            `sub_${Date.now()}_${Math.random()}`,
                          name: child.name || "未知子分类",
                          image:
                            child.image ||
                            "/static/img/default-subcategory.png",
                          products:
                            child.products && Array.isArray(child.products)
                              ? child.products
                              : [],
                        };
                      })
                      .filter((child) => child !== null)
                  : [],
            };
          })
          .filter((category) => category !== null);
      } catch (error) {
        console.error("❌ processCategories: 处理数据时发生错误:", error);
        return [];
      }
    },

    /**
     * 将商品数据关联到分类
     */
    async associateProductsToCategories(productsData) {
      try {
        // 处理不同的商品数据结构
        let products = [];
        if (Array.isArray(productsData)) {
          products = productsData;
        } else if (
          productsData.products &&
          Array.isArray(productsData.products)
        ) {
          products = productsData.products;
        } else if (productsData.data && Array.isArray(productsData.data)) {
          products = productsData.data;
        } else if (productsData.list && Array.isArray(productsData.list)) {
          products = productsData.list;
        } else {
          products = [];
        }

        if (products.length === 0) {
          return;
        }

        // 为每个分类收集商品
        this.categories.forEach((category, categoryIndex) => {
          // 初始化商品数组
          if (!category.products) category.products = [];

          // 查找属于当前分类的商品
          const categoryProducts = products.filter((product) => {
            return this.isProductBelongsToCategory(product, category);
          });

          if (categoryProducts.length > 0) {
            // 所有商品作为直接商品
            category.products = categoryProducts;

            // 如果有子分类，也分配一些商品
            if (category.children && category.children.length > 0) {
              const productsPerChild = Math.ceil(
                categoryProducts.length / category.children.length
              );
              category.children.forEach((child, childIndex) => {
                const startIndex = childIndex * productsPerChild;
                const endIndex = startIndex + productsPerChild;
                if (!child.products) child.products = [];
                child.products = categoryProducts.slice(startIndex, endIndex);
              });
            }
          }
        });
        
      } catch (error) {
        console.error("❌ 关联商品到分类失败:", error);
      }
    },

    /**
     * 判断商品是否属于指定分类
     */
    isProductBelongsToCategory(product, category) {
      if (!product || !category) return false;

      // 尝试不同的分类字段名
      const categoryFields = [
        "category",
        "categoryName",
        "type",
        "tags",
        "categories",
      ];
      const categoryName = category.name.toLowerCase();

      for (const field of categoryFields) {
        if (product[field]) {
          const productCategory = product[field];

          // 如果是字符串
          if (typeof productCategory === "string") {
            if (
              productCategory.toLowerCase().includes(categoryName) ||
              categoryName.includes(productCategory.toLowerCase())
            ) {
              return true;
            }
          }
          // 如果是数组
          else if (Array.isArray(productCategory)) {
            for (const cat of productCategory) {
              if (
                typeof cat === "string" &&
                (cat.toLowerCase().includes(categoryName) ||
                  categoryName.includes(cat.toLowerCase()))
              ) {
                return true;
              }
            }
          }
        }
      }

      // 根据商品名称进行模糊匹配
      const productName = this.getProductName(product).toLowerCase();
      const keywords = this.getCategoryKeywords(category.name);

      for (const keyword of keywords) {
        if (productName.includes(keyword.toLowerCase())) {
          return true;
        }
      }

      return false;
    },

    /**
     * 根据分类名称获取关键词
     */
    getCategoryKeywords(categoryName) {
      const keywordMap = {
        服装: [
          "服装",
          "衣服",
          "上衣",
          "下装",
          "T恤",
          "衬衫",
          "裤子",
          "裙子",
          "外套",
        ],
        男装: ["男装", "男士", "男", "T恤", "衬衫", "裤子", "西装"],
        女装: ["女装", "女士", "女", "连衣裙", "裙子", "上衣", "外套"],
        数码: ["数码", "电器", "手机", "电脑", "平板", "耳机", "音箱"],
        家居: ["家居", "家具", "沙发", "桌子", "椅子", "床", "柜子"],
        美妆: ["美妆", "化妆品", "护肤", "口红", "面膜", "精华"],
        运动: ["运动", "健身", "球鞋", "运动服", "户外", "跑步"],
        食品: ["食品", "零食", "饮料", "茶叶", "咖啡", "糖果"],
      };

      // 返回匹配的关键词
      for (const [key, keywords] of Object.entries(keywordMap)) {
        if (categoryName.includes(key)) {
          return keywords;
        }
      }

      // 如果没有匹配的关键词，返回分类名本身
      return [categoryName];
    },

    /**
     * 切换分类
     */
    async switchCategory(index, category) {
      try {
        // 参数验证
        if (typeof index !== "number" || index < 0) {
          console.error("❌ switchCategory: 无效的索引", index);
          return;
        }

        if (!category || typeof category !== "object") {
          console.error("❌ switchCategory: 无效的分类数据", category);
          return;
        }

        this.currentCategoryIndex = index;
        this.currentCategory = category;

        // 清除搜索状态
        this.isSearching = false;
        this.searchResults = [];
        this.searchKeyword = "";

        // 确保分类有基础结构
        if (!category.children) {
          category.children = [];
        }

        // 如果分类没有商品数据，尝试加载
        if (
          category.children.length === 0 ||
          category.children.some(
            (child) => !child.products || child.products.length === 0
          )
        ) {
          await this.loadCategoryProducts(category.id);
        }
      } catch (error) {
        console.error("❌ 切换分类失败:", error);
        // 不影响用户体验，静默处理错误
      }
    },

    /**
     * 加载分类商品
     */
    async loadCategoryProducts(categoryId) {
      try {
        const response = await api.category.getCategoryProducts(categoryId);

        if (response.success && response.data) {
          // 更新当前分类的商品数据
          const category = this.categories[this.currentCategoryIndex];
          if (category && category.children) {
            // 这里可以根据实际API返回的数据结构来更新
          }
        }
      } catch (error) {
        console.error("❌ 加载分类商品失败:", error);
      }
    },

    /**
     * 搜索输入事件
     */
    onSearchInput(e) {
      const keyword = e.detail.value.trim();

      // 清除之前的定时器
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }

      // 设置防抖搜索
      this.searchTimer = setTimeout(() => {
        if (keyword) {
          this.performSearch(keyword);
        } else {
          this.isSearching = false;
          this.searchResults = [];
        }
      }, 500);
    },

    /**
     * 搜索确认事件
     */
    onSearchConfirm(e) {
      const keyword = e.detail.value.trim();
      if (keyword) {
        this.performSearch(keyword);
      }
    },

    /**
     * 执行搜索
     */
    async performSearch(keyword) {
      try {
        this.isSearching = true;

        // 调用搜索API
        const response = await api.product.searchProducts(keyword, {
          category: this.currentCategory ? this.currentCategory.id : undefined,
        });

        if (response.success && response.data) {
          this.searchResults = response.data.products || [];
        } else {
          throw new Error("搜索失败");
        }
      } catch (error) {
        console.error("❌ 搜索失败:", error);
        // 使用本地搜索作为备选
        this.searchResults = this.localSearch(keyword);
      }
    },

    /**
     * 本地搜索（备选方案）
     */
    localSearch(keyword) {
      const results = [];
      const lowerKeyword = keyword.toLowerCase();

      if (this.currentCategory && this.currentCategory.children) {
        this.currentCategory.children.forEach((subCategory) => {
          if (subCategory.products) {
            subCategory.products.forEach((product) => {
              if (product.name.toLowerCase().includes(lowerKeyword)) {
                results.push(product);
              }
            });
          }
        });
      }

      return results;
    },

    /**
     * 前往商品详情
     */
    goToProductDetail(product) {
      uni.navigateTo({
        url: `/pages/productDetail/productDetail?id=${product.id}`,
      });
    },

    /**
     * 查看分类全部商品
     */
    goToCategoryProducts(subCategory) {
      uni.navigateTo({
        url: `/pages/productList/productList?categoryId=${subCategory.id}&categoryName=${subCategory.name}`,
      });
    },

    /**
     * 获取商品图片URL - 兼容不同的API数据格式
     */
    getProductImage(product) {
      if (!product) {
        return "/static/img/goods_thumb_01.png";
      }

      // 优先检查images数组（根据调试信息，后端主要使用这个字段）
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const firstImage = product.images[0];

        if (typeof firstImage === "string" && firstImage.trim()) {
          let imageUrl = firstImage.trim();

          // 如果是完整URL，直接返回
          if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
            return imageUrl;
          }

          // 如果是相对路径，保持原样
          if (imageUrl.startsWith("/")) {
            return imageUrl;
          }

          // 如果只是文件名，拼接路径
          if (!imageUrl.includes("/")) {
            return `/static/img/${imageUrl}`;
          }

          return imageUrl;
        }
      }

      // 尝试其他图片字段名
      const imageFields = ["image", "img", "thumbnail", "picture", "photo", "cover", "imageUrl", "pic", "avatar"];
      
      for (const field of imageFields) {
        if (product[field] && typeof product[field] === "string" && product[field].trim()) {
          let imageUrl = product[field].trim();

          // 如果是完整URL，直接返回
          if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
            return imageUrl;
          }

          // 如果是相对路径，保持原样
          if (imageUrl.startsWith("/")) {
            return imageUrl;
          }

          // 如果只是文件名，拼接路径
          if (!imageUrl.includes("/")) {
            return `/static/img/${imageUrl}`;
          }

          return imageUrl;
        }
      }

      return "/static/img/goods_thumb_01.png";
    },

    /**
     * 获取商品名称 - 兼容不同的API数据格式
     */
    getProductName(product) {
      if (!product) return "未知商品";

      // 尝试不同的名称字段
      const nameFields = [
        "name",
        "title",
        "productName",
        "goods_name",
        "itemName",
      ];
      for (const field of nameFields) {
        if (product[field] && typeof product[field] === "string") {
          return product[field];
        }
      }

      return "未知商品";
    },

    /**
     * 获取商品价格 - 兼容不同的API数据格式
     */
    getProductPrice(product) {
      if (!product) return "0.00";

      // 尝试不同的价格字段
      const priceFields = [
        "price",
        "currentPrice",
        "salePrice",
        "amount",
        "cost",
        "money",
      ];
      for (const field of priceFields) {
        if (product[field] !== undefined && product[field] !== null) {
          const price = parseFloat(product[field]);
          if (!isNaN(price)) {
            return price.toFixed(2);
          }
        }
      }

      return "0.00";
    },

    /**
     * 图片加载失败处理
     */
    onImageError(e) {
      // 尝试使用项目中实际存在的备选图片
      const fallbackImages = [
        "/static/img/goods_thumb_01.png",
        "/static/img/goods_thumb_02.png",
        "/static/img/goods_01.png",
        "/static/img/goods_02.png",
        "/static/img/banner_01.png",
      ];

      const currentSrc = e.target.src;

      // 找到下一个可尝试的图片
      for (let i = 0; i < fallbackImages.length; i++) {
        if (!currentSrc.includes(fallbackImages[i].split("/").pop())) {
          e.target.src = fallbackImages[i];
          return;
        }
      }
    },

    /**
     * 扫一扫点击 - 物品识别功能
     */
    onCode() {
      const that = this;
      uni.showActionSheet({
        itemList: ['物品识别', '扫码', '从相册选择'],
        success: function (res) {
          switch(res.tapIndex) {
            case 0: // 物品识别
              that.handleImageRecognition();
              break;
            case 1: // 扫码
              that.handleScanCode();
              break;
            case 2: // 从相册选择
              that.handleChooseFromAlbum();
              break;
          }
        }
      });
    },

    /**
     * 处理图片识别
     */
    async handleImageRecognition() {
      try {
        // 获取用户token
        const token = uni.getStorageSync('token');
        if (!token) {
          uni.showModal({
            title: '提示',
            content: '请先登录后再使用识别功能',
            success: (res) => {
              if (res.confirm) {
                uni.navigateTo({
                  url: '/pages/Login'
                });
              }
            }
          });
          return;
        }

        // 选择图片来源
        const sourceType = await this.chooseImageSource();
        
        // 获取图片
        const imagePath = await this.getImage(sourceType);
        
        // 显示识别中提示
        uni.showLoading({
          title: '识别中...',
          mask: true
        });
        
        // 调用识别API
        const result = await api.recognition.identifyImage(imagePath, token);
        
        uni.hideLoading();
        
        // 显示识别结果
        this.showRecognitionResult(result.data, imagePath);
        
      } catch (error) {
        uni.hideLoading();
        console.error('物品识别失败:', error);
        uni.showToast({
          title: error.message || '识别失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    },

    /**
     * 处理扫码
     */
    handleScanCode() {
      uni.scanCode({
        onlyFromCamera: true,
        success: (res) => {
          // 根据扫码结果查找商品
          this.searchByBarcode(res.result);
        },
        fail: (error) => {
          uni.showToast({
            title: "扫码失败",
            icon: "none",
          });
        },
      });
    },

    /**
     * 从相册选择图片识别
     */
    async handleChooseFromAlbum() {
      try {
        // 获取用户token
        const token = uni.getStorageSync('token');
        if (!token) {
          uni.showModal({
            title: '提示',
            content: '请先登录后再使用识别功能',
            success: (res) => {
              if (res.confirm) {
                uni.navigateTo({
                  url: '/pages/Login'
                });
              }
            }
          });
          return;
        }

        // 从相册选择图片
        const imagePath = await this.getImage('album');
        
        // 显示识别中提示
        uni.showLoading({
          title: '识别中...',
          mask: true
        });
        
        // 调用识别API
        const result = await api.recognition.identifyImage(imagePath, token);
        
        uni.hideLoading();
        
        // 显示识别结果
        this.showRecognitionResult(result.data, imagePath);
        
      } catch (error) {
        uni.hideLoading();
        console.error('图片识别失败:', error);
        uni.showToast({
          title: error.message || '识别失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    },

    /**
     * 选择图片来源
     */
    chooseImageSource() {
      return new Promise((resolve) => {
        uni.showActionSheet({
          itemList: ['拍照识别', '从相册选择'],
          success: (res) => {
            resolve(res.tapIndex === 0 ? 'camera' : 'album');
          },
          fail: () => {
            resolve('camera'); // 默认使用相机
          }
        });
      });
    },

    /**
     * 获取图片
     */
    getImage(sourceType) {
      return new Promise((resolve, reject) => {
        uni.chooseImage({
          count: 1,
          sourceType: [sourceType === 'camera' ? 'camera' : 'album'],
          sizeType: ['compressed'], // 压缩图片
          success: (res) => {
            console.log('选择图片成功:', res.tempFilePaths[0]);
            resolve(res.tempFilePaths[0]);
          },
          fail: (error) => {
            console.error('选择图片失败:', error);
            reject(new Error('获取图片失败'));
          }
        });
      });
    },

    /**
     * 显示识别结果
     */
    showRecognitionResult(data, imagePath) {
      console.log('📋 识别结果数据:', data);
      
      if (!data || !data.topResult || !data.topResult.name) {
        uni.showToast({
          title: '未识别出物品',
          icon: 'none',
          duration: 2000
        });
        return;
      }

      const topResult = data.topResult;
      const confidence = (topResult.score * 100).toFixed(1);
      
      // 跳转到识别结果页面
      uni.navigateTo({
        url: `/pages/recognition/result?data=${encodeURIComponent(JSON.stringify(data))}&image=${encodeURIComponent(imagePath)}`
      });
      
      // 显示成功提示
      uni.showToast({
        title: '识别成功！',
        icon: 'success',
        duration: 1500
      });
    },

    /**
     * 根据条码搜索商品
     */
    async searchByBarcode(barcode) {
      try {
        // 这里可以调用专门的条码搜索接口
        const response = await api.product.searchProducts(barcode);

        if (
          response.success &&
          response.data &&
          response.data.products.length > 0
        ) {
          const product = response.data.products[0];
          this.goToProductDetail(product);
        } else {
          uni.showToast({
            title: "未找到对应商品",
            icon: "none",
          });
        }
      } catch (error) {
        uni.showToast({
          title: "搜索失败",
          icon: "none",
        });
      }
    },

    /**
     * 付款码点击
     */
    onPayCode() {
      uni.navigateTo({
        url: "/pages/PaymentCode/PaymentCode",
      });
    },

    /**
     * 消息点击
     */
    onMessage() {
      uni.navigateTo({
        url: "/pages/message/message",
      });
    },
  },
};
</script>

<style scoped lang="scss">
@import "classify.scss";
</style>
