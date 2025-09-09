<template>
	<view class="cu-modal bottom-modal" :class="{'show':isShow}" @click="hide">
	  <view class="cu-dialog">
			<view class="goods-data">
				<view class="thumb">
					<image :src="goodsData && goodsData.images && goodsData.images.length > 0 ? goodsData.images[0] : '/static/img/default_product.png'" mode="aspectFit"></image>
				</view>
				<view class="item">
					<view class="title">
						<text>{{ goodsData ? goodsData.name : '商品加载中...' }}</text>
					</view>
					<view class="price">
						<text class="min">￥</text>
						<text class="max">{{ currentPrice ? Math.floor(currentPrice) : '0' }}</text>
						<text class="min">.{{ currentPrice ? String((currentPrice % 1).toFixed(2)).split('.')[1] : '00' }}</text>
					</view>
					<view class="inventory">
						<text>库存：{{ currentStock }}</text>
					</view>
				</view>
			</view>
			<view class="attr-size">
				<view class="attr-list" v-for="(item,index) in AttrSizeList" :key="index">
					<view class="title">
						<text>{{item.attr}}</text>
					</view>
					<view class="size-list">
						<div class="list" v-for="(value,idx) in item.SizeList" 
						:class="{'action':AttrSizeList[index].index === idx}"
						@click.stop="onAttrSize(item,value,index,idx)" :key="idx">
							<text>{{value.size}}</text>
						</div>
					</view>
				</view>
				<view class="attr-number" @click.stop="onStop">
					<view class="tit">数量</view>
					<view class="number">
						<text class="iconfont icon-jian" @click.stop="onQuantityChange('minus')" :class="{ disabled: quantity <= 1 }"></text>
						<input type="tel" v-model="quantity" maxlength="8" @input="onQuantityInput">
						<text class="iconfont icon-jia" @click.stop="onQuantityChange('plus')" :class="{ disabled: quantity >= currentStock }"></text>
					</view>
				</view>
			</view>
			<view class="attr-btn">
				<!-- 点击"已选"时，显示确定按钮 -->
				<view class="confirm" v-if="BuyType === 1" @click="onConfirm(1)">确定</view>
				
				<!-- 点击"加入购物车"时，显示加入购物车和立即购买两个按钮 -->
				<template v-if="BuyType === 2">
					<view class="add-cart" @click="onConfirm(2)">加入购物车</view>
					<view class="add-buy" @click="onConfirm(3)">立即购买</view>
				</template>
				
				<!-- 点击"立即购买"时，只显示确定按钮，确认后直接购买 -->
				<view class="confirm" v-if="BuyType === 3" @click="onConfirm(3)">确定</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		props: {
			// 商品数据
			goodsData: {
				type: Object,
				default: () => ({})
			},
			// 当前已选择的属性（从父组件传递）
			currentSelectedVariants: {
				type: Object,
				default: () => ({})
			},
			// 当前已选择的数量
			currentQuantity: {
				type: Number,
				default: 1
			}
		},
		data() {
			return {
				isShow: false,
				AttrIndex: 0,
				SizeIndex: 0,
				// 商品属性列表，将从props中的variants数据生成
				AttrSizeList: [],
				// 购买类型
				BuyType: 0,
				// 已选择的属性值
				selectedVariants: {},
				// 购买数量
				quantity: 1
			};
		},
		computed: {
			// 根据商品数据生成属性列表
			computedAttrSizeList() {
				if (!this.goodsData || !this.goodsData.variants || !Array.isArray(this.goodsData.variants)) {
					return [];
				}
				
				return this.goodsData.variants.map((variant, variantIndex) => {
					return {
						index: 0, // 默认选中第一个选项
						attr: variant.name,
						variantId: variant._id,
						SizeList: variant.options.map((option, optionIndex) => {
							return {
								index: optionIndex,
								size: option.value,
								price: option.price,
								stock: option.stock,
								isDefault: option.isDefault,
								optionId: option._id
							};
						})
					};
				});
			},
			
			// 获取当前选择的商品价格
			currentPrice() {
				if (!this.goodsData) return 0;
				let basePrice = this.goodsData.price || 0;
				
				// 计算属性价格加成
				for (let variantId in this.selectedVariants) {
					const selectedOption = this.selectedVariants[variantId];
					if (selectedOption && selectedOption.price) {
						basePrice += selectedOption.price;
					}
				}
				
				return basePrice;
			},
			
			// 获取当前库存
			currentStock() {
				if (!this.goodsData) return 0;
				
				// 如果有选择的属性，计算最小库存
				let minStock = this.goodsData.stock || 0;
				for (let variantId in this.selectedVariants) {
					const selectedOption = this.selectedVariants[variantId];
					if (selectedOption && selectedOption.stock !== undefined) {
						minStock = Math.min(minStock, selectedOption.stock);
					}
				}
				
				return minStock;
			}
		},
		watch: {
			// 监听商品数据变化
			goodsData: {
				handler(newData) {
					if (newData && newData.variants) {
						this.initializeAttributes();
					}
				},
				deep: true,
				immediate: true
			},
			// 监听父组件选择状态变化
			currentSelectedVariants: {
				handler(newSelection) {
					console.log('👀 检测到父组件选择变化:', newSelection);
					// 如果弹窗是打开状态，立即同步
					if (this.isShow) {
						this.syncSelectedVariants();
					}
				},
				deep: true
			},
			// 监听父组件数量变化
			currentQuantity: {
				handler(newQuantity) {
					console.log('👀 检测到父组件数量变化:', newQuantity);
					if (this.isShow) {
						this.quantity = newQuantity;
					}
				}
			}
		},
		methods:{
			/**
			 * 从父组件状态同步到子组件
			 */
			syncFromParentState() {
				console.log('🔄 开始同步父组件状态');
				console.log('📝 父组件传递的选择:', this.currentSelectedVariants);
				console.log('🔢 父组件传递的数量:', this.currentQuantity);
				
				// 确保属性列表已初始化
				if (this.AttrSizeList.length === 0) {
					this.initializeAttributes();
				}
				
				// 同步数量
				this.quantity = this.currentQuantity;
				
				// 同步选择的属性
				this.syncSelectedVariants();
				
				console.log('✅ 状态同步完成');
			},

			/**
			 * 同步选择的属性状态
			 */
			syncSelectedVariants() {
				if (!this.currentSelectedVariants || Object.keys(this.currentSelectedVariants).length === 0) {
					console.log('📋 无父组件选择状态，使用默认值');
					// 如果父组件没有选择状态，使用默认值
					this.setDefaultSelections();
					return;
				}

				console.log('🔄 开始同步选择状态');
				console.log('📦 AttrSizeList数据:', this.AttrSizeList);
				
				// 重置选择状态
				this.selectedVariants = {};
				
				// 更新AttrSizeList中的选中索引并同步selectedVariants
				this.AttrSizeList.forEach((attr, attrIndex) => {
					const parentSelected = this.currentSelectedVariants[attr.variantId];
					let selectedIndex = 0; // 默认选中第一个
					
					if (parentSelected) {
						console.log(`🔍 为${attr.attr}查找匹配项:`, parentSelected);
						
						// 在当前属性的选项中查找匹配的选项
						const matchIndex = attr.SizeList.findIndex(option => {
							// 多种匹配方式兼容不同数据结构
							const matches = [
								option.size === (parentSelected.size || parentSelected.value),
								option.value === (parentSelected.size || parentSelected.value),
								option.optionId === (parentSelected._id || parentSelected.optionId),
								option._id === (parentSelected._id || parentSelected.optionId)
							];
							
							return matches.some(match => match === true);
						});
						
						if (matchIndex !== -1) {
							selectedIndex = matchIndex;
							console.log(`✅ ${attr.attr}找到匹配项:`, attr.SizeList[matchIndex].size, `(索引:${matchIndex})`);
						} else {
							console.warn(`⚠️ ${attr.attr}未找到匹配项，使用默认值`);
						}
					}
					
					// 设置选中状态
					this.AttrSizeList[attrIndex].index = selectedIndex;
					
					// 更新selectedVariants，使用子组件的数据结构
					this.selectedVariants[attr.variantId] = attr.SizeList[selectedIndex];
					
					console.log(`📝 ${attr.attr}最终选择:`, this.selectedVariants[attr.variantId]);
				});
				
				console.log('🎯 同步完成，最终选择状态:', this.selectedVariants);
			},

			/**
			 * 设置默认选择
			 */
			setDefaultSelections() {
				this.selectedVariants = {};
				this.AttrSizeList.forEach((attr, attrIndex) => {
					let defaultIndex = 0;
					// 查找默认选项
					const defaultOption = attr.SizeList.find(option => option.isDefault);
					if (defaultOption) {
						defaultIndex = defaultOption.index;
					}
					
					// 设置选中状态
					this.AttrSizeList[attrIndex].index = defaultIndex;
					
					// 保存选中的variant，确保数据结构一致
					this.selectedVariants[attr.variantId] = {
						...attr.SizeList[defaultIndex],
						variantId: attr.variantId,
						variantName: attr.attr
					};
				});
				
				console.log('🔧 默认选择设置完成:', this.selectedVariants);
			},

			/**
			 * 初始化商品属性
			 */
			initializeAttributes() {
				if (this.computedAttrSizeList.length > 0) {
					// 使用计算属性的数据
					this.AttrSizeList = JSON.parse(JSON.stringify(this.computedAttrSizeList));
					
					console.log('🔧 属性列表初始化完成，共', this.AttrSizeList.length, '个属性');
				}
			},

			/**
			 * 显示 
			 * @param {Number} type 1 点击选择 2 加入购物 3 立即购买
			 */
			show(type){
				this.BuyType = type;
				this.isShow = true;
				
				// 每次打开都重新同步状态
				this.syncFromParentState();
			},
			
			hide(){
				this.isShow = false;
			},
			
			onStop(){
				
			},
			
			/**
			 * 属性选择点击
			 */
			onAttrSize(item, value, index, idx){
				// 更新本地状态
				this.AttrSizeList[index].index = idx;
				this.AttrIndex = item.index;
				this.SizeIndex = value.index;
				
				// 更新选中的variant，确保数据结构一致
				this.selectedVariants[item.variantId] = {
					...value,
					variantId: item.variantId,
					variantName: item.attr
				};
				
				console.log('🎨 属性选择更新:', item.attr, '->', value.size);
				console.log('📦 当前选择:', this.selectedVariants);
				
				// 触发事件，通知父组件选择的属性已改变
				this.$emit('variant-change', {
					selectedVariants: this.selectedVariants,
					currentPrice: this.currentPrice,
					currentStock: this.currentStock
				});
			},
			
			/**
			 * 数量变化
			 */
			onQuantityChange(type) {
				if (type === 'minus' && this.quantity > 1) {
					this.quantity--;
				} else if (type === 'plus' && this.quantity < this.currentStock) {
					this.quantity++;
				}
				
				this.$emit('quantity-change', this.quantity);
			},
			
			/**
			 * 数量输入处理
			 */
			onQuantityInput(e) {
				let value = parseInt(e.detail.value) || 1;
				if (value < 1) {
					value = 1;
				} else if (value > this.currentStock) {
					value = this.currentStock;
					uni.showToast({
						title: '库存不足',
						icon: 'none'
					});
				}
				this.quantity = value;
				this.$emit('quantity-change', this.quantity);
			},
			
			/**
			 * 确认点击
			 */
			onConfirm(type){
				// 检查是否所有必要属性都已选择
				if (this.AttrSizeList.length > 0) {
					let hasUnselected = false;
					for (let attr of this.AttrSizeList) {
						if (attr.index === undefined || attr.index < 0) {
							hasUnselected = true;
							break;
						}
					}
					
					if (hasUnselected) {
						uni.showToast({
							title: '请选择商品属性',
							icon: 'none'
						});
						return;
					}
				}
				
				if (this.quantity > this.currentStock) {
					uni.showToast({
						title: '库存不足',
						icon: 'none'
					});
					return;
				}
				
				// 构建数据
				const data = {
					productId: this.goodsData._id,
					variants: this.selectedVariants,
					quantity: this.quantity,
					price: this.currentPrice,
					type: type
				};
				
				console.log('📝 确认数据:', data);
				
				// 根据类型处理不同逻辑
				if (type === 1) {
					// 类型1：点击"已选"的确定按钮，只需要同步选择状态
					console.log('✅ 属性选择确认，更新已选显示');
					this.$emit('selection-update', {
						selectedVariants: this.selectedVariants,
						quantity: this.quantity,
						price: this.currentPrice,
						stock: this.currentStock
					});
				} else {
					// 类型2或3：购买相关操作
					console.log('🛒 购买操作:', type === 2 ? '加入购物车' : '立即购买');
					this.$emit('confirm', data);
				}
				
				// 关闭弹窗
				this.hide();
			}
		}
	}
</script>

<style scoped lang="scss">
	@import 'GoodsAttr.scss';
</style>
