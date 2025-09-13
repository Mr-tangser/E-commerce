const express = require('express');
const { body, validationResult } = require('express-validator');
const { AlipaySdk } = require('alipay-sdk');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 生成订单号的函数（沙箱测试用）
function generateOrderNo(userId) {
  return `SANDBOX_${Date.now()}_${userId}`;
}

// 测试订单支付成功状态存储（仅用于测试环境）
const testOrderPaidStatus = new Map();

// 初始化支付宝SDK - 使用沙箱配置
const alipaySdk = new AlipaySdk({
  appId: '2021000147673017',
  privateKey: 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCJl7MMChiRgZij7pSFTRn58MhrHt3Ei4bE0VVLk59M+PpVd0K0gN3sQDnTFIL6zEbSFYo37ndApvHkyHYXzBuPQMnAUHuHn3WGS+dFW3RwF6mNi45YYUr047i3EznDdN0Y1flrIB0iwr3VrrU0AbYS7wvgimikmxZaOhp2lFgPnzBwpatiaodmE283ORALNtHfsaRyXKtSGilIDzbwg1mstPosHd/FRcGFhejcOwKvensCXA4vczmxMm+YeXRhXh6moHZ9X2NICT7PrrD2SN1i3jglc7TwTpFcMi0ygLi3NJrxmVyyYCFS1hCWT/C8MJsnRmx+vb3m7lSaJt+B0enFAgMBAAECggEAGLtPz6Yw7FajHTRRNfS56pdBLyAJNL7vpokKD9+lDqziMmKRduiC+2g//JT/Rh1ZzYFZqtwOS2y2pizyLSze90zp9suAqMwcz9rs4yahM1TNgUfIelJiqsoT9bRa+asT4tbzUjIfipP+k14n7AUyuQyG0gGO9ad6yRUQlKftfEEYiB32ZPYWxj55T+0xcdHiQ7kwTjqURGbzdUXDH5gc+DQMTn80A/zT8bEQ6XvgVte3uyPKiYGwwgsd1ELaqAdaq6MFQw1kFdZxFzJ7hClyTlaCqTUcrV4vJAsHKWJYsbhvjcx0mZkDkup39URrEa7a+H2U3z3Vufav3/vRSqN4gQKBgQDdoqga/X1MFwiKCb7ldoY2HTcAfr4xc041VtfAX7Byp0MwtzgW0XnIsXBA0j66S3snnCpR/sRlnz0n4lHQSeODUQRtW+bPFS6JRhfjuiChA5pmOw1w/QtKK/lh7uM1A1TVTQ9kulIGtznS9wM5h1lAKSKM2a3lrcPdwro3nnZsTQKBgQCe7SSgaYX32J7xCNOVnAGfYC0wFzJI3ZjBhQ2ORG59T6hz87wXo4t5QHXqONJuZ9InnOG50J+nZTymY3jw9Z7iM6vWO8CSvNboWqhjj6xPrLL6V8Ixd8Oof4oAR9eJWfeP9dDDEp6jWHVSZ099cPPwsfrmwUEcdyLGUliMR2TPWQKBgQDIc5lIt+T/0YE2n3PYwubFwIyDVR4dSWT9luqRIbpLJ/377Gm9MX3MxrZ42e5DvYrIG1SnTh1Ar9G25dkK4hj0Jm0znz/UIRsyqoNmwmtKVSDqvxP8EdCJJ9Zn/Y/e3YF3XTfD6UPQsRyKMj/nYwOUpN+LtkCyDwOr6LdVIGuIrQKBgDCduqaXoTPAQF7bpF4P6y8l7KzZa7h+kUwht5Pduy76Pz25QcC5duEQpwGPgE/l0pPrmeGNwEkk3vjHVSfg+0mXJOnUPYSl39gUY46RVNTKr7WFQxJ+4Iua+Ew9reGGdATF3abO+1hcpwceM2LcOsNWrroIRDLA/xJL/mprLJuBAoGAUDiMtwXf25cc4pn0u4HnMVm2QdaNeSI+TZWhqN4sv+OKbqPKjqkLgg/8HyJaruWLxxwt6EaMPG/5SlX+merjmGTUg6jITX6sOlhjHJp1AVi5M1u541nqs7S8hu+y0+4jr9rIqnTtBQ4Ap2mOxWqRym5IueiqOKkKZ9DKQqSUohA=',
  alipayPublicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmA4Adf5Y9KHutvPgRbHRHSI3xrq74Q2clHRP1824/PY9cVBRzoorWxnCc/6BbUdBL3be5zrzzvBL9hh3unU5eyRhIKX9Msr/UZfuUPIrKJKmBuMohYDPzEZMKB66DdwoNzUyiIx7dB9ian6kZUet2hYvkXaN+aJ9e/ostu3SfWg7t22TBK5bwg9NQvt5hW7nL7IxuKZF3+hk4bQR79oErz/9HU5OF2N3sjUO00eClSlGqoME/bJ5POnwNvM9miveoTk6w18zqdASNFUrOonUwicI8o2ypvONuSbmf+RnEarnXe0VPhvuu9siMA5WxudJs2l+mjxt99DYBbQZmI26HQIDAQAB',
  gateway: "https://openapi-sandbox.dl.alipaydev.com/gateway.do",
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
      const orderTimestamp = parseInt(orderNumber.split('_')[1]);
      let paymentStatus = 'pending';
      let orderStatus = 'pending';
      let paidAt = null;
      
      // 优先检查是否被手动标记为支付成功
      if (testOrderPaidStatus.has(orderNumber)) {
        const paidInfo = testOrderPaidStatus.get(orderNumber);
        paymentStatus = 'paid';
        orderStatus = 'confirmed';
        paidAt = paidInfo.paidAt;
        
        // 如果有真实订单，返回真实订单信息
        if (paidInfo.realOrder) {
          console.log('✅ 返回真实订单信息:', paidInfo.realOrder.orderNumber);
          return res.json({
            success: true,
            data: {
              order: {
                orderNumber: paidInfo.realOrder.orderNumber,
                status: paidInfo.realOrder.status,
                payment: paidInfo.realOrder.payment,
                total: paidInfo.realOrder.total,
                createdAt: paidInfo.realOrder.createdAt,
                items: paidInfo.realOrder.items,
                shippingAddress: paidInfo.realOrder.shippingAddress,
                // 添加原始订单信息，用于支付成功页面显示
                originalOrderInfo: paidInfo.originalOrderInfo || null
              }
            }
          });
        }
        
        console.log('✅ 测试订单已手动标记为支付成功:', orderNumber);
      } else {
        // 否则使用30秒自动支付成功逻辑
        const currentTime = Date.now();
        const timeDiff = currentTime - orderTimestamp;
        
        if (timeDiff > 30000) {
          paymentStatus = 'paid';
          orderStatus = 'confirmed';
          paidAt = new Date();
          
          // 30秒自动支付成功时也创建真实订单
          try {
            const testOrderData = {
              orderNumber: orderNumber,
              total: 299.00,
              user: null
            };
            
            const realOrder = await createRealOrder(testOrderData);
            testOrderPaidStatus.set(orderNumber, {
              paidAt: new Date(),
              triggeredManually: false,
              realOrder: realOrder
            });
            
            console.log('🎉 30秒自动支付成功，真实订单已创建:', realOrder.orderNumber);
            
            // 返回真实订单信息
            return res.json({
              success: true,
              data: {
                order: {
                  orderNumber: realOrder.orderNumber,
                  status: realOrder.status,
                  payment: realOrder.payment,
                  total: realOrder.total,
                  createdAt: realOrder.createdAt,
                  items: realOrder.items,
                  shippingAddress: realOrder.shippingAddress
                }
              }
            });
          } catch (error) {
            console.error('❌ 自动创建真实订单失败:', error);
          }
          
          console.log('🎉 模拟测试订单支付成功(30秒自动):', orderNumber);
        } else {
          console.log('⏳ 测试订单等待支付中:', orderNumber, `还需等待${Math.ceil((30000 - timeDiff) / 1000)}秒`);
        }
      }
      
      // 创建临时测试订单数据
      order = {
        orderNumber: orderNumber,
        status: orderStatus,
        payment: {
          status: paymentStatus,
          method: 'alipay',
          transactionId: orderNumber,
          paidAt: paidAt
        },
        total: 299.00,
        createdAt: new Date(orderTimestamp)
      };
      console.log('处理测试订单查询:', orderNumber, '状态:', paymentStatus);
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

// 手动触发测试订单支付成功（仅用于测试）
router.post('/test/pay-success', async (req, res) => {
  try {
    const { orderNumber } = req.body;
    
    if (!orderNumber || !orderNumber.startsWith('TEST_')) {
      return res.status(400).json({
        success: false,
        message: '只能手动触发测试订单的支付成功'
      });
    }
    
    console.log('🧪 手动触发测试订单支付成功:', orderNumber);
    
    // 将订单标记为已支付
    const paidInfo = {
      paidAt: new Date(),
      triggeredManually: true,
      realOrder: null,
      originalOrderInfo: null
    };
    
    // 尝试从缓存中获取原始订单信息
    let originalOrderInfo = req.body.originalOrderInfo;
    
    // 如果请求中没有，尝试从缓存中获取
    if (!originalOrderInfo) {
      const cachedInfo = testOrderPaidStatus.get(orderNumber + '_info');
      if (cachedInfo) {
        originalOrderInfo = cachedInfo.originalOrderInfo;
        console.log('📦 从缓存获取原始订单信息:', originalOrderInfo?.subject);
      }
    }
    
    if (originalOrderInfo) {
      paidInfo.originalOrderInfo = originalOrderInfo;
      console.log('📦 保存原始订单信息:', originalOrderInfo.subject);
    }
    
    // 创建真实订单记录
    try {
      const testOrderData = {
        orderNumber: orderNumber,
        total: originalOrderInfo?.amount || 299.00,
        user: null
      };
      
      const realOrder = await createRealOrder(testOrderData, originalOrderInfo);
      paidInfo.realOrder = realOrder;
      
      console.log('🎉 手动触发支付成功，真实订单已创建:', realOrder.orderNumber);
    } catch (error) {
      console.error('❌ 创建真实订单失败:', error);
    }
    
    testOrderPaidStatus.set(orderNumber, paidInfo);
    
    res.json({
      success: true,
      message: '测试订单支付成功状态已触发',
      data: {
        orderNumber,
        paymentStatus: 'paid',
        timestamp: new Date(),
        realOrderCreated: !!paidInfo.realOrder,
        realOrderNumber: paidInfo.realOrder?.orderNumber
      }
    });
    
  } catch (error) {
    console.error('触发测试支付成功失败:', error);
    res.status(500).json({
      success: false,
      message: '触发测试支付成功失败'
    });
  }
});

// 支付宝沙箱支付路由（兼容GET和POST请求）
router.get('/zf', async (req, res) => {
  try {
    console.log('支付宝沙箱测试请求参数(GET):', req.query);
    
    const userId = req.query.userId || "test_user_001";
    const amount = req.query.amount || "38.88";
    const subject = req.query.subject || "商城订单支付";
    
    const orderParams = {
      bizContent: {
        out_trade_no: generateOrderNo(userId),
        total_amount: amount,
        subject: subject,
        product_code: "FAST_INSTANT_TRADE_PAY",
        quit_url: "http://your-domain.com/payment/cancel",
        notify_url: "http://your-ngrok-url.com/api/payment/sandbox/notify",
        return_url: "http://localhost:3001/payment/success"
      },
    };

    const result = await alipaySdk.pageExec('alipay.trade.page.pay', {
      method: 'GET',
      bizContent: orderParams.bizContent,
      notifyUrl: orderParams.bizContent.notify_url,
      returnUrl: orderParams.bizContent.return_url
    });

    console.log('支付宝支付URL生成成功:', result);

    res.json({
      success: true,
      code: 200,
      payUrl: result,
      data: {
        paymentUrl: result,
        orderNumber: orderParams.bizContent.out_trade_no,
        amount: amount,
        subject: subject
      }
    });

  } catch (error) {
    console.error('支付宝接口错误:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: '支付请求失败',
      error: error.message
    });
  }
});

// 支付宝沙箱支付路由（POST请求，与前端完全兼容）
router.post('/zf', async (req, res) => {
  try {
    console.log('支付宝沙箱支付请求参数(POST):', req.body);
    
    const { orderId, amount, subject, originalOrderInfo } = req.body;
    
    // 保存原始订单信息到内存中，用于后续创建真实订单
    if (originalOrderInfo) {
      testOrderPaidStatus.set(orderId + '_info', {
        originalOrderInfo: originalOrderInfo,
        createdAt: new Date()
      });
      console.log('📦 保存原始订单信息到缓存:', orderId);
    }
    
    // 验证必需参数
    if (!orderId || !amount || !subject) {
      return res.status(400).json({
        success: false,
        error: {
          message: '缺少必需参数: orderId, amount, subject'
        }
      });
    }
    
    // 验证订单ID格式
    if (!orderId.startsWith('TEST_')) {
      return res.status(400).json({
        success: false,
        error: {
          message: '订单ID必须以TEST_开头'
        }
      });
    }
    
    // 验证金额
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: '支付金额必须是大于0的数字'
        }
      });
    }
    
    const orderParams = {
      bizContent: {
        out_trade_no: orderId, // 直接使用前端传入的订单ID
        total_amount: amount.toFixed(2),
        subject: subject,
        product_code: "FAST_INSTANT_TRADE_PAY",
        quit_url: "http://your-domain.com/payment/cancel",
        notify_url: "http://your-ngrok-url.com/api/payment/sandbox/notify",
        return_url: "http://localhost:3001/payment/success"
      },
    };

    const result = await alipaySdk.pageExec('alipay.trade.page.pay', {
      method: 'GET',
      bizContent: orderParams.bizContent,
      notifyUrl: orderParams.bizContent.notify_url,
      returnUrl: orderParams.bizContent.return_url
    });

    console.log('支付宝支付URL生成成功:', result);

    // 返回与原接口兼容的格式
    res.json({
      success: true,
      message: '支付订单创建成功',
      data: {
        paymentUrl: result,
        orderNumber: orderId,
        amount: amount,
        subject: subject
      }
    });

  } catch (error) {
    console.error('支付宝接口错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '创建支付订单失败',
        details: error.message
      }
    });
  }
});

// 创建真实订单的函数
async function createRealOrder(testOrderData, originalOrderInfo = null) {
  try {
    // 生成真实的订单号
    const realOrderNumber = Order.generateOrderNumber();
    
    console.log('🏗️ 创建真实订单，原始信息:', originalOrderInfo);
    
    // 从原始订单信息中提取数据
    const orderItems = originalOrderInfo?.orderItems || [];
    const deliveryAddress = originalOrderInfo?.deliveryAddress || {};
    const shippingInsurance = originalOrderInfo?.shippingInsurance || {};
    
    // 构建订单商品
    const items = orderItems.length > 0 ? orderItems.map(item => ({
      product: new mongoose.Types.ObjectId(), // 创建临时商品ID
      quantity: item.quantity || 1,
      price: item.price || testOrderData.total,
      total: (item.price || testOrderData.total) * (item.quantity || 1),
      variant: {
        name: item.attributes || '默认规格',
        option: '默认选项'
      }
    })) : [{
      product: new mongoose.Types.ObjectId(),
      quantity: 1,
      price: testOrderData.total,
      total: testOrderData.total,
      variant: {
        name: '默认规格',
        option: '默认选项'
      }
    }];
    
    // 计算金额
    const productAmount = originalOrderInfo?.productAmount || testOrderData.total;
    const memberDiscount = originalOrderInfo?.memberDiscount || 0;
    const shippingFee = originalOrderInfo?.shippingFee || 0;
    const insuranceFee = shippingInsurance.selected ? (shippingInsurance.price || 0) : 0;
    
    // 构建真实订单数据
    const orderData = {
      orderNumber: realOrderNumber,
      user: testOrderData.user || new mongoose.Types.ObjectId(),
      items: items,
      status: 'confirmed',
      subtotal: productAmount,
      tax: 0,
      shipping: {
        cost: shippingFee + insuranceFee,
        method: '快递配送',
        insurance: shippingInsurance.selected || false
      },
      discount: {
        amount: memberDiscount,
        code: 'MEMBER_DISCOUNT',
        type: 'fixed'
      },
      total: testOrderData.total,
      payment: {
        method: 'alipay',
        status: 'paid',
        transactionId: testOrderData.orderNumber,
        paidAt: new Date()
      },
      shippingAddress: {
        firstName: (deliveryAddress.name || '测试用户').split(' ')[0],
        lastName: (deliveryAddress.name || '测试用户').split(' ')[1] || '',
        phone: deliveryAddress.phone || '13800138000',
        street: deliveryAddress.detail || deliveryAddress.address || '测试地址',
        city: deliveryAddress.city || '北京市',
        state: deliveryAddress.province || '北京市',
        zipCode: '100000',
        country: '中国'
      },
      notes: {
        customer: `移动端订单 - ${originalOrderInfo?.subject || '商城订单'}`,
        internal: `测试订单转换: ${testOrderData.orderNumber} -> ${realOrderNumber}\n商品: ${orderItems.map(item => `${item.name} x ${item.quantity}`).join(', ')}`
      }
    };

    // 创建真实订单
    const realOrder = new Order(orderData);
    await realOrder.save();
    
    console.log('✅ 真实订单创建成功:', {
      testOrderNumber: testOrderData.orderNumber,
      realOrderNumber: realOrder.orderNumber,
      amount: testOrderData.total,
      productName: orderItems[0]?.name || '未知商品',
      quantity: orderItems[0]?.quantity || 1
    });
    
    return realOrder;
    
  } catch (error) {
    console.error('❌ 创建真实订单失败:', error);
    throw error;
  }
}

// 支付宝异步通知处理（简化版）
router.post('/sandbox/notify', async (req, res) => {
  try {
    console.log('收到支付宝异步通知:', req.body);
    
    const params = req.body;

    // 验证签名
    const signVerified = alipaySdk.checkNotifySign(params);

    if (!signVerified) {
      console.error('签名验证失败');
      return res.status(400).send('invalid signature');
    }

    const tradeStatus = params.trade_status;
    if (tradeStatus === 'TRADE_SUCCESS') {
      console.log('支付成功:', {
        orderNo: params.out_trade_no,
        amount: params.total_amount,
        alipayNo: params.trade_no
      });

      // 如果是测试订单，创建真实订单记录
      if (params.out_trade_no && params.out_trade_no.startsWith('TEST_')) {
        try {
          const testOrderData = {
            orderNumber: params.out_trade_no,
            total: parseFloat(params.total_amount),
            user: null // 这里应该从支付数据中获取用户信息
          };
          
          await createRealOrder(testOrderData);
          console.log('🎉 支付成功，真实订单已创建');
        } catch (error) {
          console.error('❌ 创建真实订单失败:', error);
        }
      }
    }

    res.send('success');

  } catch (error) {
    console.error('处理支付宝异步通知错误:', error);
    res.send('fail');
  }
});

// 查看数据库中的订单列表（用于验证订单创建）
router.get('/orders/list', async (req, res) => {
  try {
    console.log('📋 查询数据库订单列表');
    
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;
    
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('user', 'username email')
      .populate('items.product', 'name price')
      .lean();
    
    const total = await Order.countDocuments();
    
    console.log(`📊 找到 ${orders.length} 个订单，总计 ${total} 个`);
    
    res.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          orderNumber: order.orderNumber,
          status: order.status,
          payment: order.payment,
          total: order.total,
          itemCount: order.items?.length || 0,
          createdAt: order.createdAt,
          user: order.user,
          notes: order.notes
        })),
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + orders.length < total
        }
      }
    });
    
  } catch (error) {
    console.error('❌ 查询订单列表失败:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '查询订单列表失败',
        details: error.message
      }
    });
  }
});

// 查看特定订单详情
router.get('/orders/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    console.log('🔍 查询订单详情:', orderNumber);
    
    const order = await Order.findOne({ orderNumber })
      .populate('user', 'username email phone')
      .populate('items.product', 'name price images')
      .lean();
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          message: '订单不存在'
        }
      });
    }
    
    console.log('✅ 找到订单:', order.orderNumber);
    
    res.json({
      success: true,
      data: {
        order
      }
    });
    
  } catch (error) {
    console.error('❌ 查询订单详情失败:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '查询订单详情失败',
        details: error.message
      }
    });
  }
});

module.exports = router;
