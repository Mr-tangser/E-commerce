const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 获取首页分类（带推荐商品）
router.get('/homepage', async (req, res) => {
  try {
    const categories = await Category.getHomepageCategories();
    
    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    console.error('获取首页分类错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取首页分类失败'
      }
    });
  }
});

// 获取所有分类（树形结构）
router.get('/', async (req, res) => {
  try {
    const categories = await Category.getCategoryTree();
    
    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取分类列表失败'
      }
    });
  }
});

// 获取所有分类（平铺结构）
router.get('/flat', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };
    
    if (req.query.level !== undefined) filter.level = parseInt(req.query.level);
    if (req.query.parent) filter.parent = req.query.parent;
    if (req.query.featured === 'true') filter.isFeatured = true;

    const categories = await Category.find(filter)
      .populate('parent', 'name slug')
      .sort('sortOrder')
      .skip(skip)
      .limit(limit);

    const total = await Category.countDocuments(filter);

    res.json({
      success: true,
      data: {
        categories,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取分类平铺列表错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取分类列表失败'
      }
    });
  }
});

// 获取单个分类详情
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name slug')
      .populate('path', 'name slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          message: '分类不存在'
        }
      });
    }

    if (!category.isActive) {
      return res.status(404).json({
        success: false,
        error: {
          message: '分类已禁用'
        }
      });
    }

    res.json({
      success: true,
      data: {
        category
      }
    });
  } catch (error) {
    console.error('获取分类详情错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取分类详情失败'
      }
    });
  }
});

// 根据slug获取分类
router.get('/slug/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ 
      slug: req.params.slug,
      isActive: true 
    })
    .populate('parent', 'name slug')
    .populate('path', 'name slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          message: '分类不存在'
        }
      });
    }

    res.json({
      success: true,
      data: {
        category
      }
    });
  } catch (error) {
    console.error('根据slug获取分类错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取分类详情失败'
      }
    });
  }
});

// 创建分类（管理员）
router.post('/', protect, authorize('admin'), [
  body('name')
    .notEmpty()
    .withMessage('分类名称不能为空')
    .isLength({ max: 50 })
    .withMessage('分类名称最多50个字符'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('分类描述最多500个字符'),
  body('parent')
    .optional()
    .isMongoId()
    .withMessage('无效的父分类ID'),
  body('sortOrder')
    .optional()
    .isInt()
    .withMessage('排序值必须是整数')
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

    const { name, description, parent, image, icon, sortOrder, meta, attributes } = req.body;

    // 检查父分类是否存在
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          error: {
            message: '父分类不存在'
          }
        });
      }
    }

    const category = await Category.create({
      name,
      description,
      parent,
      image,
      icon,
      sortOrder,
      meta,
      attributes
    });

    const populatedCategory = await Category.findById(category._id)
      .populate('parent', 'name slug');

    res.status(201).json({
      success: true,
      message: '分类创建成功',
      data: {
        category: populatedCategory
      }
    });
  } catch (error) {
    console.error('创建分类错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '创建分类失败'
      }
    });
  }
});

// 更新分类（管理员）
router.put('/:id', protect, authorize('admin'), [
  body('name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('分类名称最多50个字符'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('分类描述最多500个字符'),
  body('parent')
    .optional()
    .isMongoId()
    .withMessage('无效的父分类ID'),
  body('sortOrder')
    .optional()
    .isInt()
    .withMessage('排序值必须是整数')
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

    const { name, description, parent, image, icon, sortOrder, meta, attributes, isActive, isFeatured } = req.body;

    // 检查父分类是否存在
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          error: {
            message: '父分类不存在'
          }
        });
      }

      // 不能将分类设置为自己的子分类
      if (parent === req.params.id) {
        return res.status(400).json({
          success: false,
          error: {
            message: '不能将分类设置为自己的子分类'
          }
        });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        parent,
        image,
        icon,
        sortOrder,
        meta,
        attributes,
        isActive,
        isFeatured
      },
      { new: true, runValidators: true }
    ).populate('parent', 'name slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          message: '分类不存在'
        }
      });
    }

    res.json({
      success: true,
      message: '分类更新成功',
      data: {
        category
      }
    });
  } catch (error) {
    console.error('更新分类错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '更新分类失败'
      }
    });
  }
});

// 删除分类（管理员）
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          message: '分类不存在'
        }
      });
    }

    // 检查是否有子分类
    const hasChildren = await Category.exists({ parent: req.params.id });
    if (hasChildren) {
      return res.status(400).json({
        success: false,
        error: {
          message: '无法删除有子分类的分类，请先删除子分类'
        }
      });
    }

    // 检查是否有产品使用此分类
    const Product = require('../models/Product');
    const hasProducts = await Product.exists({ 
      $or: [{ category: req.params.id }, { subcategory: req.params.id }] 
    });
    
    if (hasProducts) {
      return res.status(400).json({
        success: false,
        error: {
          message: '无法删除有产品使用的分类，请先移除或重新分配产品'
        }
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '分类删除成功'
    });
  } catch (error) {
    console.error('删除分类错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '删除分类失败'
      }
    });
  }
});

// 获取分类下的产品
router.get('/:id/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          message: '分类不存在'
        }
      });
    }

    // 获取所有子分类ID
    const allChildren = await category.getAllChildren();
    const categoryIds = [category._id, ...allChildren.map(c => c._id)];

    const Product = require('../models/Product');
    const filter = {
      category: { $in: categoryIds },
      isActive: true
    };

    // 添加其他筛选条件
    if (req.query.brand) filter.brand = req.query.brand;
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: {
        category,
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
    console.error('获取分类产品错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取分类产品失败'
      }
    });
  }
});

// 批量更新分类排序
router.patch('/reorder', protect, authorize('admin'), [
  body('categories')
    .isArray()
    .withMessage('分类数据必须是数组')
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

    const { categories } = req.body;

    // 批量更新排序
    for (const item of categories) {
      await Category.findByIdAndUpdate(item.id, { sortOrder: item.sortOrder });
    }

    res.json({
      success: true,
      message: '分类排序更新成功'
    });
  } catch (error) {
    console.error('更新分类排序错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '更新分类排序失败'
      }
    });
  }
});

module.exports = router; 