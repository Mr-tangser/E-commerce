/**
 * 购物车数据管理工具
 */

const CART_KEY = 'shopping_cart';

class CartManager {
  /**
   * 获取购物车数据
   */
  static getCartItems() {
    try {
      const cartData = uni.getStorageSync(CART_KEY);
      return cartData || [];
    } catch (error) {
      console.error('❌ 获取购物车数据失败:', error);
      return [];
    }
  }

  /**
   * 保存购物车数据
   */
  static saveCartItems(items) {
    try {
      uni.setStorageSync(CART_KEY, items);
      console.log('💾 购物车数据已保存:', items.length, '个商品');
      return true;
    } catch (error) {
      console.error('❌ 保存购物车数据失败:', error);
      return false;
    }
  }

  /**
   * 添加商品到购物车
   */
  static addToCart(productData) {
    try {
      const { productId, name, price, image, variants, quantity } = productData;
      
      // 验证必需参数
      if (!productId || !name || !price || quantity <= 0) {
        throw new Error('商品数据不完整');
      }

      const cartItems = this.getCartItems();
      
      // 生成商品的唯一标识（商品ID + 属性组合）
      const variantKey = this.generateVariantKey(variants);
      const itemKey = `${productId}_${variantKey}`;
      
      // 查找是否已存在相同商品（相同商品ID和属性）
      const existingIndex = cartItems.findIndex(item => item.itemKey === itemKey);
      
      if (existingIndex !== -1) {
        // 如果已存在，增加数量
        cartItems[existingIndex].quantity += quantity;
        cartItems[existingIndex].updatedAt = new Date().toISOString();
        
        console.log('🔄 购物车商品数量更新:', cartItems[existingIndex]);
      } else {
        // 如果不存在，添加新商品
        const newItem = {
          id: Date.now(), // 购物车项目ID
          itemKey: itemKey, // 唯一标识
          productId: productId,
          name: name,
          price: price,
          image: image,
          variants: variants || {},
          variantText: this.formatVariantText(variants),
          quantity: quantity,
          selected: true, // 默认选中
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        cartItems.push(newItem);
        console.log('➕ 新商品已添加到购物车:', newItem);
      }
      
      // 保存到本地存储
      this.saveCartItems(cartItems);
      
      // 返回操作结果
      return {
        success: true,
        message: '已添加到购物车',
        totalItems: cartItems.length,
        cartItems: cartItems
      };
      
    } catch (error) {
      console.error('❌ 添加到购物车失败:', error);
      return {
        success: false,
        message: error.message || '添加失败',
        totalItems: 0
      };
    }
  }

  /**
   * 更新购物车商品数量
   */
  static updateQuantity(itemId, newQuantity) {
    try {
      if (newQuantity <= 0) {
        return this.removeFromCart(itemId);
      }

      const cartItems = this.getCartItems();
      const itemIndex = cartItems.findIndex(item => item.id === itemId);
      
      if (itemIndex === -1) {
        throw new Error('商品不存在');
      }
      
      cartItems[itemIndex].quantity = newQuantity;
      cartItems[itemIndex].updatedAt = new Date().toISOString();
      
      this.saveCartItems(cartItems);
      
      return {
        success: true,
        message: '数量已更新',
        cartItems: cartItems
      };
      
    } catch (error) {
      console.error('❌ 更新数量失败:', error);
      return {
        success: false,
        message: error.message || '更新失败'
      };
    }
  }

  /**
   * 从购物车删除商品
   */
  static removeFromCart(itemId) {
    try {
      const cartItems = this.getCartItems();
      const filteredItems = cartItems.filter(item => item.id !== itemId);
      
      this.saveCartItems(filteredItems);
      
      return {
        success: true,
        message: '商品已删除',
        cartItems: filteredItems
      };
      
    } catch (error) {
      console.error('❌ 删除商品失败:', error);
      return {
        success: false,
        message: error.message || '删除失败'
      };
    }
  }

  /**
   * 切换商品选中状态
   */
  static toggleSelection(itemId) {
    try {
      const cartItems = this.getCartItems();
      const itemIndex = cartItems.findIndex(item => item.id === itemId);
      
      if (itemIndex === -1) {
        throw new Error('商品不存在');
      }
      
      cartItems[itemIndex].selected = !cartItems[itemIndex].selected;
      cartItems[itemIndex].updatedAt = new Date().toISOString();
      
      this.saveCartItems(cartItems);
      
      return {
        success: true,
        cartItems: cartItems
      };
      
    } catch (error) {
      console.error('❌ 切换选中状态失败:', error);
      return {
        success: false,
        message: error.message || '操作失败'
      };
    }
  }

  /**
   * 全选/取消全选
   */
  static toggleSelectAll(selectAll) {
    try {
      const cartItems = this.getCartItems();
      
      cartItems.forEach(item => {
        item.selected = selectAll;
        item.updatedAt = new Date().toISOString();
      });
      
      this.saveCartItems(cartItems);
      
      return {
        success: true,
        cartItems: cartItems
      };
      
    } catch (error) {
      console.error('❌ 全选操作失败:', error);
      return {
        success: false,
        message: error.message || '操作失败'
      };
    }
  }

  /**
   * 批量删除选中商品
   */
  static removeSelectedItems() {
    try {
      const cartItems = this.getCartItems();
      const remainingItems = cartItems.filter(item => !item.selected);
      
      this.saveCartItems(remainingItems);
      
      return {
        success: true,
        message: '选中商品已删除',
        cartItems: remainingItems
      };
      
    } catch (error) {
      console.error('❌ 批量删除失败:', error);
      return {
        success: false,
        message: error.message || '删除失败'
      };
    }
  }

  /**
   * 获取购物车统计信息
   */
  static getCartStatistics() {
    const cartItems = this.getCartItems();
    const selectedItems = cartItems.filter(item => item.selected);
    
    const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return {
      totalItems: cartItems.length,
      selectedItemsCount: selectedItems.length,
      totalQuantity: totalQuantity,
      totalAmount: totalAmount,
      allSelected: cartItems.length > 0 && selectedItems.length === cartItems.length
    };
  }

  /**
   * 获取选中的商品（用于结算）
   */
  static getSelectedItems() {
    const cartItems = this.getCartItems();
    return cartItems.filter(item => item.selected);
  }

  /**
   * 清空购物车
   */
  static clearCart() {
    try {
      this.saveCartItems([]);
      return {
        success: true,
        message: '购物车已清空'
      };
    } catch (error) {
      console.error('❌ 清空购物车失败:', error);
      return {
        success: false,
        message: error.message || '清空失败'
      };
    }
  }

  /**
   * 生成属性组合的唯一标识
   */
  static generateVariantKey(variants) {
    if (!variants || Object.keys(variants).length === 0) {
      return 'default';
    }
    
    const sortedKeys = Object.keys(variants).sort();
    const keyParts = sortedKeys.map(key => {
      const variant = variants[key];
      return `${key}:${variant.size || variant.value || variant.optionId || 'default'}`;
    });
    
    return keyParts.join('|');
  }

  /**
   * 格式化属性文本显示
   */
  static formatVariantText(variants) {
    if (!variants || Object.keys(variants).length === 0) {
      return '默认规格';
    }
    
    const variantTexts = [];
    for (let variantId in variants) {
      const variant = variants[variantId];
      if (variant && (variant.size || variant.value)) {
        variantTexts.push(variant.size || variant.value);
      }
    }
    
    return variantTexts.length > 0 ? variantTexts.join('，') : '默认规格';
  }

  /**
   * 检查购物车是否为空
   */
  static isEmpty() {
    return this.getCartItems().length === 0;
  }

  /**
   * 获取购物车商品数量（用于TabBar显示）
   */
  static getCartItemCount() {
    const cartItems = this.getCartItems();
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }
}

export default CartManager;
