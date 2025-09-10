const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// 导入审核模型（需要创建）
// const MerchantAudit = require('../models/MerchantAudit');

// @desc    获取商家审核列表
// @route   GET /api/admin/merchant-audit
// @access  Private (需要merchant_audit:view权限)
router.get('/', protect, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, auditStatus, applicationType, priority, timeRange } = req.query;

    // 构建查询条件
    let query = {};
    
    if (auditStatus) query.auditStatus = auditStatus;
    if (applicationType) query.applicationType = applicationType;
    if (priority) query.priority = priority;
    
    // 时间范围过滤
    if (timeRange) {
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
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
        query.submitTime = { $gte: startDate };
      }
    }

    // 计算分页参数
    const skip = (page - 1) * limit;

    console.log('📊 获取商家审核列表请求:', {
      query,
      page: parseInt(page),
      limit: parseInt(limit),
      user: req.user.username
    });

    // 暂时返回模拟数据
    const mockAuditApplications = [
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
        submitTime: new Date('2023-12-01T09:30:00Z'),
        reviewer: null,
        timeRemaining: 72,
        applicationContent: '申请开设星巴克咖啡官方旗舰店，主营各类咖啡饮品和轻食',
        documents: [
          { name: '营业执照.pdf', url: '/docs/license.pdf' },
          { name: '食品经营许可证.pdf', url: '/docs/food-license.pdf' }
        ],
        auditHistory: [],
        createdAt: new Date('2023-12-01T09:30:00Z'),
        updatedAt: new Date()
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
        submitTime: new Date('2023-11-28T14:20:00Z'),
        reviewer: '王审核员',
        timeRemaining: 0,
        applicationContent: '申请扩展经营类目，新增运动服装和配件销售',
        documents: [
          { name: '类目扩展申请表.pdf', url: '/docs/category-expansion.pdf' }
        ],
        auditHistory: [
          {
            time: new Date('2023-11-30T10:15:00Z'),
            action: '审核通过',
            reviewer: '王审核员',
            comment: '资料齐全，符合扩展要求'
          }
        ],
        createdAt: new Date('2023-11-28T14:20:00Z'),
        updatedAt: new Date('2023-11-30T10:15:00Z')
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
        submitTime: new Date('2023-11-30T16:45:00Z'),
        reviewer: '刘审核员',
        timeRemaining: 0,
        applicationContent: '更新商家经营地址和联系方式',
        documents: [
          { name: '地址变更证明.pdf', url: '/docs/address-change.pdf' }
        ],
        auditHistory: [
          {
            time: new Date('2023-12-01T09:00:00Z'),
            action: '审核拒绝',
            reviewer: '刘审核员',
            comment: '地址变更证明不完整，请补充相关材料'
          }
        ],
        createdAt: new Date('2023-11-30T16:45:00Z'),
        updatedAt: new Date('2023-12-01T09:00:00Z')
      }
    ];

    // 应用过滤条件
    let filteredApplications = mockAuditApplications.filter(app => {
      let match = true;
      
      if (auditStatus && app.auditStatus !== auditStatus) match = false;
      if (applicationType && app.applicationType !== applicationType) match = false;
      if (priority && app.priority !== priority) match = false;
      
      // 时间过滤已在查询构建中处理
      
      return match;
    });

    // 应用分页
    const paginatedApplications = filteredApplications.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      message: '获取审核列表成功',
      data: {
        applications: paginatedApplications,
        pagination: {
          current: parseInt(page),
          total: filteredApplications.length,
          perPage: parseInt(limit),
          totalPages: Math.ceil(filteredApplications.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ 获取审核列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取审核列表失败',
      error: error.message
    });
  }
});

// @desc    获取单个审核申请详情
// @route   GET /api/admin/merchant-audit/:id
// @access  Private (需要merchant_audit:view权限)
router.get('/:id', protect, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📋 获取审核详情:', {
      applicationId: id,
      user: req.user.username
    });

    // 暂时返回模拟数据
    const mockApplication = {
      _id: id,
      applicationId: 'APP20231201001',
      merchantName: '星巴克咖啡旗舰店',
      contactPerson: '张经理',
      contactPhone: '13812341234',
      contactEmail: 'starbucks@coffee.com',
      businessAddress: '北京市朝阳区三里屯SOHO A座',
      applicationType: 'new_registration',
      auditStatus: 'pending',
      priority: 'high',
      submitTime: new Date('2023-12-01T09:30:00Z'),
      reviewer: null,
      timeRemaining: 72,
      applicationContent: '申请开设星巴克咖啡官方旗舰店，主营各类咖啡饮品、轻食和咖啡豆销售。我们是星巴克官方授权的加盟商，拥有完整的品牌授权和经营资质。',
      documents: [
        { name: '营业执照.pdf', url: '/docs/license.pdf', size: '2.3MB', uploadTime: '2023-12-01T09:15:00Z' },
        { name: '食品经营许可证.pdf', url: '/docs/food-license.pdf', size: '1.8MB', uploadTime: '2023-12-01T09:18:00Z' },
        { name: '品牌授权书.pdf', url: '/docs/brand-auth.pdf', size: '1.2MB', uploadTime: '2023-12-01T09:20:00Z' }
      ],
      auditHistory: [
        {
          time: new Date('2023-12-01T09:30:00Z'),
          action: '提交申请',
          reviewer: '系统',
          comment: '申请已提交，等待审核'
        }
      ],
      merchantInfo: {
        legalPerson: '张经理',
        registeredCapital: '500万元',
        businessScope: '餐饮服务，食品销售',
        establishDate: '2020-03-15',
        taxNumber: 'TAX110101987654321'
      },
      createdAt: new Date('2023-12-01T09:30:00Z'),
      updatedAt: new Date()
    };

    res.json({
      success: true,
      message: '获取审核详情成功',
      data: {
        application: mockApplication
      }
    });

  } catch (error) {
    console.error('❌ 获取审核详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取审核详情失败',
      error: error.message
    });
  }
});

// @desc    提交审核决定
// @route   POST /api/admin/merchant-audit/:id/decision
// @access  Private (需要merchant_audit:approve或reject权限)
router.post('/:id/decision', protect, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment, rejectReason } = req.body;

    // 验证输入
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: '无效的审核操作'
      });
    }

    if (action === 'reject' && !comment?.trim()) {
      return res.status(400).json({
        success: false,
        message: '拒绝申请时必须填写拒绝原因'
      });
    }

    console.log('✅ 提交审核决定:', {
      applicationId: id,
      action,
      comment,
      rejectReason,
      reviewer: req.user.username
    });

    // 构建审核历史记录
    const auditHistoryItem = {
      time: new Date(),
      action: action === 'approve' ? '审核通过' : '审核拒绝',
      reviewer: req.user.username,
      comment: comment || (action === 'approve' ? '审核通过' : '审核拒绝')
    };

    if (action === 'reject' && rejectReason) {
      auditHistoryItem.rejectReason = rejectReason;
    }

    // 这里应该更新到数据库
    /*
    const updatedApplication = await MerchantAudit.findByIdAndUpdate(id, {
      auditStatus: action === 'approve' ? 'approved' : 'rejected',
      reviewer: req.user.username,
      auditTime: new Date(),
      auditComment: comment,
      rejectReason: action === 'reject' ? rejectReason : undefined,
      $push: { auditHistory: auditHistoryItem }
    }, { new: true });
    */

    res.json({
      success: true,
      message: `申请已${action === 'approve' ? '通过' : '拒绝'}审核`,
      data: {
        application: {
          _id: id,
          auditStatus: action === 'approve' ? 'approved' : 'rejected',
          reviewer: req.user.username,
          auditTime: new Date(),
          auditComment: comment,
          rejectReason: action === 'reject' ? rejectReason : undefined
        }
      }
    });

  } catch (error) {
    console.error('❌ 审核操作失败:', error);
    res.status(500).json({
      success: false,
      message: '审核操作失败',
      error: error.message
    });
  }
});

// @desc    分配审核员
// @route   PATCH /api/admin/merchant-audit/:id/assign
// @access  Private (需要merchant_audit:assign权限)
router.patch('/:id/assign', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerId } = req.body;

    console.log('👥 分配审核员:', {
      applicationId: id,
      reviewerId,
      assignedBy: req.user.username
    });

    // 这里应该验证审核员是否存在，并更新到数据库
    /*
    const updatedApplication = await MerchantAudit.findByIdAndUpdate(id, {
      reviewer: reviewerId,
      assignedAt: new Date(),
      assignedBy: req.user._id
    }, { new: true });
    */

    res.json({
      success: true,
      message: '审核员分配成功',
      data: {
        application: {
          _id: id,
          reviewer: reviewerId,
          assignedAt: new Date(),
          assignedBy: req.user.username
        }
      }
    });

  } catch (error) {
    console.error('❌ 分配审核员失败:', error);
    res.status(500).json({
      success: false,
      message: '分配审核员失败',
      error: error.message
    });
  }
});

// @desc    获取审核统计数据
// @route   GET /api/admin/merchant-audit/stats
// @access  Private (需要merchant_audit:view权限)
router.get('/stats', protect, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    console.log('📈 获取审核统计数据:', {
      user: req.user.username
    });

    // 暂时返回模拟统计数据
    const mockStats = {
      totalApplications: 156,
      pendingAudits: 23,
      approvedToday: 8,
      rejectedToday: 3,
      averageAuditTime: 2.5, // 天
      urgentApplications: 5,
      byType: {
        new_registration: 45,
        info_update: 67,
        category_expansion: 32,
        level_upgrade: 12
      },
      byStatus: {
        pending: 23,
        approved: 98,
        rejected: 35
      },
      monthlyTrend: [
        { month: '11月', approved: 42, rejected: 12 },
        { month: '12月', approved: 38, rejected: 8 }
      ]
    };

    res.json({
      success: true,
      message: '获取统计数据成功',
      data: {
        stats: mockStats
      }
    });

  } catch (error) {
    console.error('❌ 获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
});

module.exports = router;

