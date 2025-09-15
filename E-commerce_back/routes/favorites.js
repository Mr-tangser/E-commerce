/**
 * 商品收藏路由 - 处理用户收藏功能
 * 包含添加收藏、取消收藏、收藏列表查询、收藏统计等功能
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Favorite = require('../models/Favorite');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * 获取用户收藏列表
 * GET /api/favorites
 */
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const type = req.query.type || 'product'; // product 或 content

    // 构建查询条件
    const query = {
      user: req.user._id,
      type: type,
      isActive: true
    };

    // 执行查询
    const favorites = await Favorite.find(query)
      .populate({
        path: 'product',
        select: 'name price originalPrice images description category subcategory rating stock isActive',
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'subcategory', select: 'name slug' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 过滤掉已下架的商品
    const activeFavorites = favorites.filter(fav => 
      fav.product && fav.product.isActive
    );

    const total = await Favorite.countDocuments(query);

    res.json({
      success: true,
      data: {
        favorites: activeFavorites,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取收藏列表错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取收藏列表失败'
      }
    });
  }
});

/**
 * 添加收藏
 * POST /api/favorites
 */
router.post('/', protect, [
  body('productId')
    .isMongoId()
    .withMessage('无效的商品ID'),
  body('type')
    .optional()
    .isIn(['product', 'content'])
    .withMessage('收藏类型必须是 product 或 content'),
  body('priceNotification')
    .optional()
    .isBoolean()
    .withMessage('降价通知设置必须是布尔值'),
  body('note')
    .optional()
    .isLength({ max: 200 })
    .withMessage('备注最多200个字符')
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

    const { productId, type = 'product', priceNotification = true, note } = req.body;

    // 检查商品是否存在
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        error: {
          message: '商品不存在或已下架'
        }
      });
    }

    // 检查是否已收藏
    const existingFavorite = await Favorite.findOne({
      user: req.user._id,
      product: productId,
      isActive: true
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        error: {
          message: '商品已在收藏列表中'
        }
      });
    }

    // 创建收藏记录
    const favorite = await Favorite.create({
      user: req.user._id,
      product: productId,
      type,
      favoritePrice: product.price,
      priceNotification,
      note
    });

    // 返回完整的收藏信息
    await favorite.populate('product', 'name price images');

    res.status(201).json({
      success: true,
      message: '收藏成功',
      data: {
        favorite
      }
    });
  } catch (error) {
    console.error('添加收藏错误:', error);
    
    // 处理重复收藏的情况
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: {
          message: '商品已在收藏列表中'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        message: '添加收藏失败'
      }
    });
  }
});

/**
 * 取消收藏
 * DELETE /api/favorites/:productId
 */
router.delete('/:productId', protect, async (req, res) => {
  try {
    const productId = req.params.productId;

    // 查找并删除收藏
    const favorite = await Favorite.findOneAndUpdate(
      {
        user: req.user._id,
        product: productId,
        isActive: true
      },
      { isActive: false },
      { new: true }
    );

    if (!favorite) {
      return res.status(404).json({
        success: false,
        error: {
          message: '收藏记录不存在'
        }
      });
    }

    res.json({
      success: true,
      message: '取消收藏成功'
    });
  } catch (error) {
    console.error('取消收藏错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '取消收藏失败'
      }
    });
  }
});

/**
 * 批量取消收藏
 * DELETE /api/favorites/batch
 */
router.delete('/batch', protect, [
  body('productIds')
    .isArray({ min: 1 })
    .withMessage('商品ID列表不能为空'),
  body('productIds.*')
    .isMongoId()
    .withMessage('商品ID格式无效')
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

    const { productIds } = req.body;

    // 批量取消收藏
    const result = await Favorite.updateMany(
      {
        user: req.user._id,
        product: { $in: productIds },
        isActive: true
      },
      { isActive: false }
    );

    res.json({
      success: true,
      message: `成功取消${result.modifiedCount}个商品的收藏`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('批量取消收藏错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '批量取消收藏失败'
      }
    });
  }
});

/**
 * 检查商品收藏状态
 * GET /api/favorites/check/:productId
 */
router.get('/check/:productId', protect, async (req, res) => {
  try {
    const productId = req.params.productId;
    
    const isFavorited = await Favorite.isUserFavorited(req.user._id, productId);
    
    res.json({
      success: true,
      data: {
        isFavorited,
        productId
      }
    });
  } catch (error) {
    console.error('检查收藏状态错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '检查收藏状态失败'
      }
    });
  }
});

/**
 * 批量检查商品收藏状态
 * POST /api/favorites/check-batch
 */
router.post('/check-batch', protect, [
  body('productIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('商品ID列表应包含1-50个ID'),
  body('productIds.*')
    .isMongoId()
    .withMessage('商品ID格式无效')
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

    const { productIds } = req.body;
    
    // 批量查询收藏状态
    const favorites = await Favorite.find({
      user: req.user._id,
      product: { $in: productIds },
      isActive: true
    }).select('product');
    
    const favoritedIds = favorites.map(fav => fav.product.toString());
    
    // 构建结果对象
    const result = {};
    productIds.forEach(id => {
      result[id] = favoritedIds.includes(id);
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('批量检查收藏状态错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '批量检查收藏状态失败'
      }
    });
  }
});

/**
 * 获取用户收藏统计
 * GET /api/favorites/stats
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await Favorite.getUserFavoriteStats(req.user._id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取收藏统计错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取收藏统计失败'
      }
    });
  }
});

/**
 * 获取商品收藏数量
 * GET /api/favorites/product/:productId/count
 */
router.get('/product/:productId/count', async (req, res) => {
  try {
    const productId = req.params.productId;
    const count = await Favorite.getProductFavoriteCount(productId);
    
    res.json({
      success: true,
      data: {
        productId,
        favoriteCount: count
      }
    });
  } catch (error) {
    console.error('获取商品收藏数量错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取商品收藏数量失败'
      }
    });
  }
});

/**
 * 获取降价商品列表
 * GET /api/favorites/price-drops
 */
router.get('/price-drops', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // 查找用户收藏的商品
    const favorites = await Favorite.find({
      user: req.user._id,
      type: 'product',
      isActive: true,
      priceNotification: true
    })
    .populate('product', 'name price originalPrice images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // 筛选出降价的商品
    const priceDrops = favorites.filter(favorite => 
      favorite.product && 
      favorite.product.isActive && 
      favorite.product.price < favorite.favoritePrice
    ).map(favorite => ({
      ...favorite.toObject(),
      priceDecrease: favorite.favoritePrice - favorite.product.price,
      discountPercentage: Math.round((favorite.favoritePrice - favorite.product.price) / favorite.favoritePrice * 100)
    }));

    const total = priceDrops.length;

    res.json({
      success: true,
      data: {
        priceDrops,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取降价商品错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取降价商品失败'
      }
    });
  }
});

/**
 * 更新收藏设置
 * PUT /api/favorites/:productId/settings
 */
router.put('/:productId/settings', protect, [
  body('priceNotification')
    .optional()
    .isBoolean()
    .withMessage('降价通知设置必须是布尔值'),
  body('note')
    .optional()
    .isLength({ max: 200 })
    .withMessage('备注最多200个字符')
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

    const productId = req.params.productId;
    const updateData = {};
    
    if (req.body.priceNotification !== undefined) {
      updateData.priceNotification = req.body.priceNotification;
    }
    
    if (req.body.note !== undefined) {
      updateData.note = req.body.note;
    }

    const favorite = await Favorite.findOneAndUpdate(
      {
        user: req.user._id,
        product: productId,
        isActive: true
      },
      updateData,
      { new: true }
    ).populate('product', 'name price images');

    if (!favorite) {
      return res.status(404).json({
        success: false,
        error: {
          message: '收藏记录不存在'
        }
      });
    }

    res.json({
      success: true,
      message: '设置更新成功',
      data: {
        favorite
      }
    });
  } catch (error) {
    console.error('更新收藏设置错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '更新收藏设置失败'
      }
    });
  }
});

module.exports = router;
