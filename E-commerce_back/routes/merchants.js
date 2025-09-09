const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// 导入商家模型（需要创建）
// const Merchant = require('../models/Merchant');

// @desc    获取商家列表
// @route   GET /api/admin/merchants
// @access  Private (需要merchants:view权限)
router.get('/', protect, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, verifyStatus, level, category, isActive } = req.query;

    // 构建查询条件
    let query = {};
    
    if (verifyStatus) query.verifyStatus = verifyStatus;
    if (level) query.level = level;
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // 计算分页参数
    const skip = (page - 1) * limit;

    console.log('📊 获取商家列表请求:', {
      query,
      page: parseInt(page),
      limit: parseInt(limit),
      user: req.user.username
    });

    // 暂时返回模拟数据，实际应该从数据库获取
    const mockMerchants = [
      {
        _id: '1',
        storeName: '小米官方旗舰店',
        storeCode: 'MI001',
        ownerName: '张小明',
        contactPhone: '138****1234',
        businessAddress: '北京市朝阳区',
        verifyStatus: 'verified',
        level: 'diamond',
        category: 'electronics',
        productCount: 156,
        monthlyRevenue: 850000,
        rating: 4.8,
        joinDate: '2023-01-15',
        isActive: true,
        logo: '/img/stores/xiaomi.png',
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date()
      },
      {
        _id: '2',
        storeName: 'H&M服装专营店',
        storeCode: 'HM002',
        ownerName: '李红梅',
        contactPhone: '139****5678',
        businessAddress: '上海市浦东新区',
        verifyStatus: 'verified',
        level: 'gold',
        category: 'clothing',
        productCount: 89,
        monthlyRevenue: 420000,
        rating: 4.5,
        joinDate: '2023-03-20',
        isActive: true,
        logo: '/img/stores/hm.png',
        createdAt: new Date('2023-03-20'),
        updatedAt: new Date()
      },
      {
        _id: '3',
        storeName: '新鲜果蔬专营店',
        storeCode: 'FR003',
        ownerName: '王大锤',
        contactPhone: '137****9012',
        businessAddress: '广州市天河区',
        verifyStatus: 'pending',
        level: 'silver',
        category: 'food',
        productCount: 45,
        monthlyRevenue: 120000,
        rating: 4.2,
        joinDate: '2023-08-10',
        isActive: true,
        logo: '/img/stores/fruit.png',
        createdAt: new Date('2023-08-10'),
        updatedAt: new Date()
      }
    ];

    // 应用过滤条件
    let filteredMerchants = mockMerchants.filter(merchant => {
      let match = true;
      
      if (verifyStatus && merchant.verifyStatus !== verifyStatus) match = false;
      if (level && merchant.level !== level) match = false;
      if (category && merchant.category !== category) match = false;
      if (isActive !== undefined && merchant.isActive !== (isActive === 'true')) match = false;
      
      return match;
    });

    // 应用分页
    const paginatedMerchants = filteredMerchants.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      message: '获取商家列表成功',
      data: {
        merchants: paginatedMerchants,
        pagination: {
          current: parseInt(page),
          total: filteredMerchants.length,
          perPage: parseInt(limit),
          totalPages: Math.ceil(filteredMerchants.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ 获取商家列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取商家列表失败',
      error: error.message
    });
  }
});

// @desc    获取单个商家详情
// @route   GET /api/admin/merchants/:id
// @access  Private (需要merchants:view权限)
router.get('/:id', protect, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📋 获取商家详情:', {
      merchantId: id,
      user: req.user.username
    });

    // 暂时返回模拟数据
    const mockMerchant = {
      _id: id,
      storeName: '小米官方旗舰店',
      storeCode: 'MI001',
      ownerName: '张小明',
      contactPhone: '13812341234',
      contactEmail: 'xiaomi@store.com',
      businessAddress: '北京市朝阳区三里屯SOHO',
      verifyStatus: 'verified',
      level: 'diamond',
      category: 'electronics',
      productCount: 156,
      monthlyRevenue: 850000,
      rating: 4.8,
      joinDate: '2023-01-15',
      isActive: true,
      logo: '/img/stores/xiaomi.png',
      description: '小米官方授权旗舰店，提供小米全系列产品及配件，正品保证，全国联保。',
      businessLicense: 'BL202301150001',
      taxNumber: 'TAX110101234567890',
      bankAccount: '6228480123456789012',
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date()
    };

    res.json({
      success: true,
      message: '获取商家详情成功',
      data: {
        merchant: mockMerchant
      }
    });

  } catch (error) {
    console.error('❌ 获取商家详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取商家详情失败',
      error: error.message
    });
  }
});

// @desc    更新商家信息
// @route   PUT /api/admin/merchants/:id
// @access  Private (需要merchants:edit权限)
router.put('/:id', protect, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('✏️ 更新商家信息:', {
      merchantId: id,
      updateData,
      user: req.user.username
    });

    // 这里应该验证数据并更新到数据库
    // const updatedMerchant = await Merchant.findByIdAndUpdate(id, updateData, { new: true });

    res.json({
      success: true,
      message: '商家信息更新成功',
      data: {
        merchant: { _id: id, ...updateData }
      }
    });

  } catch (error) {
    console.error('❌ 更新商家信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新商家信息失败',
      error: error.message
    });
  }
});

// @desc    切换商家状态
// @route   PATCH /api/admin/merchants/:id/status
// @access  Private (需要merchants:edit权限)
router.patch('/:id/status', protect, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    console.log('🔄 切换商家状态:', {
      merchantId: id,
      newStatus: isActive,
      user: req.user.username
    });

    // 这里应该更新到数据库
    // const updatedMerchant = await Merchant.findByIdAndUpdate(id, { isActive }, { new: true });

    res.json({
      success: true,
      message: `商家已${isActive ? '激活' : '停用'}`,
      data: {
        merchant: { _id: id, isActive }
      }
    });

  } catch (error) {
    console.error('❌ 切换商家状态失败:', error);
    res.status(500).json({
      success: false,
      message: '切换商家状态失败',
      error: error.message
    });
  }
});

module.exports = router;

