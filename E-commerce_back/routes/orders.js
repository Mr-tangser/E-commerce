const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, authorize, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// 获取用户订单列表
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.orderNumber = { $regex: req.query.search, $options: 'i' };
    }

    const orders = await Order.find(filter)
      .populate('items.product', 'name images price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取订单列表失败'
      }
    });
  }
});

// 获取所有订单（管理员）
router.get('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter['payment.status'] = req.query.paymentStatus;
    if (req.query.search) {
      filter.$or = [
        { orderNumber: { $regex: req.query.search, $options: 'i' } },
        { 'shippingAddress.firstName': { $regex: req.query.search, $options: 'i' } },
        { 'shippingAddress.lastName': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(filter)
      .populate('user', 'username email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取管理员订单列表错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取订单列表失败'
      }
    });
  }
});

// 获取单个订单详情
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'username email')
      .populate('items.product', 'name images price description');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          message: '订单不存在'
        }
      });
    }

    // 检查权限：只能查看自己的订单或管理员可以查看所有
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          message: '无权访问此订单'
        }
      });
    }

    res.json({
      success: true,
      data: {
        order
      }
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取订单详情失败'
      }
    });
  }
});

// 创建订单
router.post('/', protect, [
  body('items')
    .isArray({ min: 1 })
    .withMessage('订单必须包含至少一个商品'),
  body('items.*.product')
    .isMongoId()
    .withMessage('无效的产品ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('商品数量必须大于0'),
  body('shippingAddress.firstName')
    .notEmpty()
    .withMessage('收货人姓名不能为空'),
  body('shippingAddress.phone')
    .notEmpty()
    .withMessage('联系电话不能为空'),
  body('shippingAddress.street')
    .notEmpty()
    .withMessage('街道地址不能为空'),
  body('shippingAddress.city')
    .notEmpty()
    .withMessage('城市不能为空'),
  body('shippingAddress.state')
    .notEmpty()
    .withMessage('省份不能为空'),
  body('shippingAddress.zipCode')
    .notEmpty()
    .withMessage('邮编不能为空'),
  body('shippingAddress.country')
    .notEmpty()
    .withMessage('国家不能为空'),
  body('payment.method')
    .isIn(['credit_card', 'debit_card', 'paypal', 'alipay', 'wechat', 'bank_transfer'])
    .withMessage('无效的支付方式')
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

    const { items, shippingAddress, billingAddress, payment, notes } = req.body;

    // 验证产品和库存
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          error: {
            message: `产品 ${item.product} 不存在`
          }
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          error: {
            message: `产品 ${product.name} 已下架`
          }
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: {
            message: `产品 ${product.name} 库存不足`
          }
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      });

      // 减少库存
      product.stock -= item.quantity;
      await product.save();
    }

    // 计算运费和税费
    const shippingCost = 0; // 可以根据实际需求计算
    const tax = subtotal * 0.1; // 假设10%税费
    const total = subtotal + shippingCost + tax;

    // 创建订单
    const order = await Order.create({
      orderNumber: Order.generateOrderNumber(),
      user: req.user._id,
      items: orderItems,
      subtotal,
      tax,
      shipping: {
        cost: shippingCost,
        method: 'standard'
      },
      total,
      payment,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      notes
    });

    // 添加订单状态时间线
    await order.updateStatus('pending', '订单创建成功');

    const populatedOrder = await Order.findById(order._id)
      .populate('items.product', 'name images price')
      .populate('user', 'username email');

    res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: {
        order: populatedOrder
      }
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '创建订单失败'
      }
    });
  }
});

// 更新订单状态（管理员）
router.patch('/:id/status', protect, authorize('admin'), [
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('无效的订单状态'),
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

    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          message: '订单不存在'
        }
      });
    }

    // 更新订单状态
    await order.updateStatus(status, note, req.user._id);

    // 如果订单被取消，恢复库存
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }

    const updatedOrder = await Order.findById(order._id)
      .populate('items.product', 'name images price')
      .populate('user', 'username email');

    res.json({
      success: true,
      message: '订单状态更新成功',
      data: {
        order: updatedOrder
      }
    });
  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '更新订单状态失败'
      }
    });
  }
});

// 取消订单（用户）
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          message: '订单不存在'
        }
      });
    }

    // 检查权限
    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          message: '无权操作此订单'
        }
      });
    }

    // 只能取消待确认的订单
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          message: '只能取消待确认的订单'
        }
      });
    }

    // 更新订单状态
    await order.updateStatus('cancelled', '用户取消订单', req.user._id);

    // 恢复库存
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    res.json({
      success: true,
      message: '订单已取消'
    });
  } catch (error) {
    console.error('取消订单错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '取消订单失败'
      }
    });
  }
});

// 删除订单（管理员）
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          message: '订单不存在'
        }
      });
    }

    // 只能删除已取消或已退款的订单
    if (!['cancelled', 'refunded'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: '只能删除已取消或已退款的订单'
        }
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '订单删除成功'
    });
  } catch (error) {
    console.error('删除订单错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '删除订单失败'
      }
    });
  }
});

module.exports = router; 