const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 获取所有产品（支持分页、搜索、筛选）
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // 构建筛选条件
    const filter = { isActive: true };
    
    if (req.query.category) filter.category = req.query.category;
    if (req.query.brand) filter.brand = req.query.brand;
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }
    if (req.query.inStock === 'true') filter.stock = { $gt: 0 };
    if (req.query.featured === 'true') filter.isFeatured = true;
    
    // 搜索功能
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // 排序
    let sort = { createdAt: -1 };
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'price_asc':
          sort = { price: 1 };
          break;
        case 'price_desc':
          sort = { price: -1 };
          break;
        case 'rating':
          sort = { 'rating.average': -1 };
          break;
        case 'newest':
          sort = { createdAt: -1 };
          break;
        case 'oldest':
          sort = { createdAt: 1 };
          break;
      }
    }

    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取产品列表错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取产品列表失败'
      }
    });
  }
});

// 获取单个产品详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('reviews.user', 'username avatar');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          message: '产品不存在'
        }
      });
    }

    if (!product.isActive) {
      return res.status(404).json({
        success: false,
        error: {
          message: '产品已下架'
        }
      });
    }

    res.json({
      success: true,
      data: {
        product
      }
    });
  } catch (error) {
    console.error('获取产品详情错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取产品详情失败'
      }
    });
  }
});

// 创建产品（管理员）
router.post('/', protect, authorize('admin'), [
  body('name')
    .notEmpty()
    .withMessage('产品名称不能为空')
    .isLength({ max: 100 })
    .withMessage('产品名称最多100个字符'),
  body('description')
    .notEmpty()
    .withMessage('产品描述不能为空'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('价格必须是非负数'),
  body('category')
    .isMongoId()
    .withMessage('无效的分类ID'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('库存必须是非负整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: '输入验证失败',
          details: errors.array()
        }
      });
    }

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: '产品创建成功',
      data: {
        product
      }
    });
  } catch (error) {
    console.error('创建产品错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '创建产品失败'
      }
    });
  }
});

// 更新产品（管理员）
router.put('/:id', protect, authorize('admin'), [
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('产品名称最多100个字符'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('价格必须是非负数'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('库存必须是非负整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: '输入验证失败',
          details: errors.array()
        }
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          message: '产品不存在'
        }
      });
    }

    res.json({
      success: true,
      message: '产品更新成功',
      data: {
        product
      }
    });
  } catch (error) {
    console.error('更新产品错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '更新产品失败'
      }
    });
  }
});

// 删除产品（管理员）
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          message: '产品不存在'
        }
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '产品删除成功'
    });
  } catch (error) {
    console.error('删除产品错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '删除产品失败'
      }
    });
  }
});

// 添加产品评论
router.post('/:id/reviews', protect, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('评分必须是1-5之间的整数'),
  body('comment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('评论最多500个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: '输入验证失败',
          details: errors.array()
        }
      });
    }

    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          message: '产品不存在'
        }
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        error: {
          message: '产品已下架，无法评论'
        }
      });
    }

    // 检查用户是否已经评论过
    const existingReview = product.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: {
          message: '您已经评论过此产品'
        }
      });
    }

    // 添加评论
    await product.addReview(req.user._id, rating, comment);

    res.json({
      success: true,
      message: '评论添加成功'
    });
  } catch (error) {
    console.error('添加评论错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '添加评论失败'
      }
    });
  }
});

// 获取产品评论
router.get('/:id/reviews', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const product = await Product.findById(req.params.id)
      .populate({
        path: 'reviews.user',
        select: 'username avatar'
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          message: '产品不存在'
        }
      });
    }

    const reviews = product.reviews.slice(skip, skip + limit);
    const total = product.reviews.length;

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取产品评论错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取产品评论失败'
      }
    });
  }
});

module.exports = router; 