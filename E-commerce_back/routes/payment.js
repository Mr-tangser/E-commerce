const express = require('express');
const { body, validationResult } = require('express-validator');
const { AlipaySdk } = require('alipay-sdk');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 初始化支付宝SDK
const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID,
  privateKey: process.env.ALIPAY_PRIVATE_KEY,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
  gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipaydev.com/gateway.do', // 沙箱环境
  timeout: 5000,
  camelCase: true,
});

// 测试用户认证中间件
const testProtect = async (req, res, next) => {
  const jwt = require('jsonwebtoken');
  
  let token;
  const createTestUser = () => {
    req.user = {
      _id: 'test_user_' + Date.now(),
      username: 'test_user',
      role: 'user'
    };
    console.log('使用测试用户:', req.user);
    return next();
  };

  // 检查Authorization头
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
    return createTestUser();
  }

  try {
    // 获取token
    token = req.headers.authorization.split(' ')[1];
    
    // 检查token是否为空或无效值
    if (!token || token === 'null' || token === 'undefined') {
      return createTestUser();
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
    
    // 这里应该查找用户，但为了测试简化，直接使用decoded信息
    req.user = {
      _id: decoded.id,
      username: decoded.username || 'user',
      role: decoded.role || 'user'
    };
    
    console.log('使用真实用户:', req.user);
    next();
  } catch (error) {
    // JWT验证失败，使用测试用户
    console.log('JWT验证失败，使用测试用户:', error.message);
    return createTestUser();
  }
};

// 创建支付宝支付订单
router.post('/alipay/create', testProtect, [
  body('orderId')
    .custom((value) => {
      // 允许测试订单ID或有效的MongoDB ObjectId
      if (value.startsWith('TEST_') || /^[0-9a-fA-F]{24}$/.test(value)) {
        return true;
      }
      throw new Error('无效的订单ID');
    }),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('支付金额必须大于0.01'),
  body('subject')
    .notEmpty()
    .withMessage('订单标题不能为空')
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

    const { orderId, amount, subject } = req.body;

    let order;
    let orderNumber;
    
    // 检查是否为测试订单
    if (orderId && orderId.startsWith('TEST_')) {
      // 测试订单，创建临时订单数据
      orderNumber = orderId;
      order = {
        orderNumber: orderNumber,
        user: req.user._id,
        payment: {
          status: 'pending'
        },
        total: amount
      };
    } else {
      // 验证真实订单是否存在且属于当前用户
      order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: {
            message: '订单不存在'
          }
        });
      }

      if (order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: {
            message: '无权访问此订单'
          }
        });
      }

      if (order.payment.status === 'paid') {
        return res.status(400).json({
          success: false,
          error: {
            message: '订单已支付'
          }
        });
      }
      
      orderNumber = order.orderNumber;
    }

    // 构建支付宝支付参数
    const bizContent = {
      outTradeNo: orderNumber, // 商户订单号
      totalAmount: amount.toFixed(2), // 订单总金额
      subject: subject, // 订单标题
      productCode: 'FAST_INSTANT_TRADE_PAY', // 产品码，网站支付
      timeoutExpress: '30m', // 订单超时时间
    };

    // 获取支付URL - 使用网站支付接口
    const paymentUrl = await alipaySdk.pageExec('alipay.trade.page.pay', {
      bizContent: bizContent,
      returnUrl: process.env.ALIPAY_RETURN_URL,
      notifyUrl: process.env.ALIPAY_NOTIFY_URL,
    });

    // 更新真实订单支付信息（测试订单跳过）
    if (!orderId.startsWith('TEST_') && order.save) {
      order.payment.method = 'alipay';
      order.payment.transactionId = orderNumber;
      await order.save();
    }

    res.json({
      success: true,
      message: '支付订单创建成功',
      data: {
        paymentUrl,
        orderNumber: orderNumber,
        amount: amount,
        subject: subject
      }
    });

  } catch (error) {
    console.error('创建支付宝支付订单错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '创建支付订单失败'
      }
    });
  }
});

// 支付宝支付异步通知
router.post('/alipay/notify', async (req, res) => {
  try {
    console.log('收到支付宝异步通知:', req.body);

    // 验证签名
    const isValid = alipaySdk.checkNotifySign(req.body);
    if (!isValid) {
      console.error('支付宝异步通知签名验证失败');
      return res.send('fail');
    }

    const { out_trade_no, trade_status, trade_no, total_amount } = req.body;

    // 查找订单
    const order = await Order.findOne({ orderNumber: out_trade_no });
    if (!order) {
      console.error('订单不存在:', out_trade_no);
      return res.send('fail');
    }

    // 处理支付成功
    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      if (order.payment.status !== 'paid') {
        // 更新订单支付状态
        order.payment.status = 'paid';
        order.payment.transactionId = trade_no;
        order.payment.paidAt = new Date();
        order.payment.amount = parseFloat(total_amount);
        
        // 更新订单状态
        await order.updateStatus('confirmed', '支付成功，订单已确认');
        
        console.log(`订单 ${out_trade_no} 支付成功`);
      }
    } else if (trade_status === 'TRADE_CLOSED') {
      // 支付关闭
      order.payment.status = 'failed';
      await order.updateStatus('cancelled', '支付失败，订单已取消');
      console.log(`订单 ${out_trade_no} 支付失败`);
    }

    await order.save();
    res.send('success');

  } catch (error) {
    console.error('处理支付宝异步通知错误:', error);
    res.send('fail');
  }
});

// 支付宝支付同步返回
router.get('/alipay/return', async (req, res) => {
  try {
    console.log('收到支付宝同步返回:', req.query);

    // 验证签名
    const isValid = alipaySdk.checkNotifySign(req.query);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: {
          message: '签名验证失败'
        }
      });
    }

    const { out_trade_no, trade_no, total_amount } = req.query;

    // 查询支付结果
    const result = await alipaySdk.exec('alipay.trade.query', {
      bizContent: {
        outTradeNo: out_trade_no,
      },
    });

    res.json({
      success: true,
      message: '支付处理完成',
      data: {
        orderNumber: out_trade_no,
        tradeNo: trade_no,
        amount: total_amount,
        paymentResult: result
      }
    });

  } catch (error) {
    console.error('处理支付宝同步返回错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '处理支付返回失败'
      }
    });
  }
});

// 测试路由
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Payment route is working',
    timestamp: new Date().toISOString()
  });
});

// 查询支付状态
router.get('/alipay/query/:orderNumber', testProtect, async (req, res) => {
  try {
    const { orderNumber } = req.params;

    let order;
    
    // 检查是否为测试订单
    if (orderNumber.startsWith('TEST_')) {
      // 创建临时测试订单数据
      order = {
        orderNumber: orderNumber,
        status: 'pending',
        payment: {
          status: 'pending',
          method: 'alipay',
          transactionId: orderNumber
        },
        total: 299.00,
        createdAt: new Date()
      };
      console.log('处理测试订单查询:', orderNumber);
    } else {
      // 查找真实订单
      order = await Order.findOne({ orderNumber });
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
            message: '无权访问此订单'
          }
        });
      }
    }

    // 查询支付宝订单状态
    let alipayResult = null;
    if (order.payment.method === 'alipay' && order.payment.transactionId) {
      try {
        alipayResult = await alipaySdk.exec('alipay.trade.query', {
          bizContent: {
            outTradeNo: orderNumber,
          },
        });
      } catch (error) {
        console.warn('查询支付宝订单状态失败:', error.message);
      }
    }

    res.json({
      success: true,
      data: {
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          payment: order.payment,
          total: order.total,
          createdAt: order.createdAt
        },
        alipayResult
      }
    });

  } catch (error) {
    console.error('查询支付状态错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '查询支付状态失败'
      }
    });
  }
});

// 支付宝退款
router.post('/alipay/refund', protect, [
  body('orderNumber')
    .notEmpty()
    .withMessage('订单号不能为空'),
  body('refundAmount')
    .isFloat({ min: 0.01 })
    .withMessage('退款金额必须大于0.01'),
  body('refundReason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('退款原因最多200个字符')
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

    const { orderNumber, refundAmount, refundReason } = req.body;

    // 查找订单
    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          message: '订单不存在'
        }
      });
    }

    // 检查权限（只有管理员可以退款）
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          message: '无权执行退款操作'
        }
      });
    }

    // 检查订单状态
    if (order.payment.status !== 'paid') {
      return res.status(400).json({
        success: false,
        error: {
          message: '只能对已支付的订单进行退款'
        }
      });
    }

    // 执行退款
    const refundResult = await alipaySdk.exec('alipay.trade.refund', {
      bizContent: {
        outTradeNo: orderNumber,
        refundAmount: refundAmount.toFixed(2),
        refundReason: refundReason || '订单退款'
      },
    });

    if (refundResult.fundChange === 'Y') {
      // 退款成功，更新订单状态
      order.payment.status = 'refunded';
      order.payment.refundAmount = refundAmount;
      order.payment.refundAt = new Date();
      await order.updateStatus('refunded', `退款成功，金额：￥${refundAmount}`);

      res.json({
        success: true,
        message: '退款成功',
        data: {
          orderNumber,
          refundAmount,
          refundResult
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          message: '退款失败',
          details: refundResult
        }
      });
    }

  } catch (error) {
    console.error('支付宝退款错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '退款处理失败'
      }
    });
  }
});

module.exports = router;
