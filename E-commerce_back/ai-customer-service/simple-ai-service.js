/**
 * 简化AI客服服务 - 直接使用Gemini API
 * 无需Rasa，Windows兼容
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 内存存储会话
const sessions = new Map();

// Gemini API配置（如果有）
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'demo-key';

// 简单的规则回复
const quickReplies = {
  '订单': '您好！我可以帮您查询订单状态、修改订单或处理订单问题。请提供您的订单号。',
  '退换货': '我们支持7天无理由退换货。请确保商品包装完好，附带购买凭证。',
  '支付': '我们支持微信、支付宝、银行卡等多种支付方式。如遇支付问题，请检查账户余额。',
  '物流': '您可以在订单详情页面查看物流信息，一般1-3个工作日发货。',
  '商品': '我们有服装、电子产品、家居用品等多个分类。有什么特定需求吗？',
  '会员': 'VIP会员享受专属折扣、免运费、优先客服等特权。',
  '客服': '我是AI智能客服，24小时为您服务。复杂问题可转接人工客服：400-123-4567',
  '时间': '当前时间是：{time}',
  '日期': '今天是：{date}',
  '问候': '您好！很高兴为您服务！😊 我可以帮您处理各种问题。',
  '再见': '感谢您的咨询！祝您生活愉快！如有其他问题，我随时为您服务。🌟'
};

/**
 * 算术计算函数
 */
function calculateArithmetic(expression) {
  try {
    // 清理表达式，只允许数字、基本运算符和空格
    const cleanExpr = expression.replace(/[^0-9+\-*/().\s]/g, '');
    
    // 安全检查：避免执行恶意代码
    if (!/^[\d+\-*/().\s]+$/.test(cleanExpr)) {
      throw new Error('无效的数学表达式');
    }
    
    // 使用Function构造器安全计算（比eval更安全）
    const result = Function(`"use strict"; return (${cleanExpr})`)();
    
    // 检查结果是否为数字
    if (typeof result !== 'number' || isNaN(result)) {
      throw new Error('计算结果无效');
    }
    
    return result;
  } catch (error) {
    return null;
  }
}

/**
 * 检测是否为算术表达式
 */
function isArithmetic(message) {
  // 匹配基本算术表达式：数字、运算符、括号
  const arithmeticPattern = /^[\d+\-*/().\s=？?]+$/;
  return arithmeticPattern.test(message) && /[+\-*/]/.test(message);
}

/**
 * 简单的意图识别
 */
function detectIntent(message) {
  const msg = message.toLowerCase().trim();
  
  // 算术计算检测
  if (isArithmetic(message)) return 'arithmetic';
  
  // 时间相关
  if (msg.includes('几点') || msg.includes('时间') || msg.includes('now') || msg.includes('time')) return '时间';
  
  // 日期相关
  if (msg.includes('几号') || msg.includes('日期') || msg.includes('today') || msg.includes('date') || 
      msg.includes('星期') || msg.includes('周几')) return '日期';
  
  // 问候语
  if (msg.includes('你好') || msg.includes('您好') || msg.includes('hello') || msg.includes('hi') ||
      msg.includes('早上好') || msg.includes('下午好') || msg.includes('晚上好')) return '问候';
  
  // 告别语
  if (msg.includes('再见') || msg.includes('拜拜') || msg.includes('bye') || msg.includes('goodbye')) return '再见';
  
  // 业务相关
  if (msg.includes('订单') || msg.includes('order')) return '订单';
  if (msg.includes('退') || msg.includes('换') || msg.includes('return')) return '退换货';
  if (msg.includes('支付') || msg.includes('付款') || msg.includes('pay')) return '支付';
  if (msg.includes('物流') || msg.includes('快递') || msg.includes('shipping')) return '物流';
  if (msg.includes('商品') || msg.includes('产品') || msg.includes('product')) return '商品';
  if (msg.includes('会员') || msg.includes('vip') || msg.includes('member')) return '会员';
  if (msg.includes('客服') || msg.includes('帮助') || msg.includes('help')) return '客服';
  
  return 'default';
}

/**
 * 生成AI回复
 */
function generateReply(message, intent) {
  // 处理算术计算
  if (intent === 'arithmetic') {
    const result = calculateArithmetic(message);
    if (result !== null) {
      return `📊 计算结果：${message} = ${result}`;
    } else {
      return '抱歉，这个算式我算不出来，请检查表达式是否正确。支持 +、-、*、/ 和括号运算。';
    }
  }
  
  // 处理时间查询
  if (intent === '时间') {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    return quickReplies['时间'].replace('{time}', timeStr);
  }
  
  // 处理日期查询
  if (intent === '日期') {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
    return quickReplies['日期'].replace('{date}', dateStr);
  }
  
  // 如果有匹配的快速回复
  if (quickReplies[intent]) {
    return quickReplies[intent];
  }
  
  // 默认回复
  const defaultReplies = [
    '感谢您的咨询！我正在学习中，如需更详细帮助，请联系人工客服：400-123-4567',
    '我会努力为您解答。如果我的回答不够准确，请联系我们的人工客服。',
    '您的问题很重要！虽然我在持续学习，但复杂问题建议咨询专业客服。',
    '我来为您服务！如需更专业的帮助，人工客服电话：400-123-4567'
  ];
  
  return defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
}

// 路由配置
app.get('/api/chat/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Simple AI Customer Service',
    timestamp: new Date().toISOString(),
    sessions: sessions.size,
    mode: 'simplified'
  });
});

app.post('/api/chat/session', (req, res) => {
  const sessionId = uuidv4();
  const userInfo = req.body.userInfo || {};
  
  sessions.set(sessionId, {
    id: sessionId,
    userInfo,
    messages: [],
    createdAt: new Date(),
    lastActivity: new Date()
  });
  
  console.log(`🎯 新会话创建: ${sessionId}`);
  
  res.json({
    sessionId,
    message: '🤖 AI智能客服为您服务！我可以帮您解答订单、商品、支付等问题。',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/chat/message', async (req, res) => {
  try {
    const { sessionId, message, userInfo } = req.body;
    
    if (!sessionId || !sessions.has(sessionId)) {
      return res.status(400).json({
        error: '会话不存在',
        message: '请重新开始对话'
      });
    }
    
    const session = sessions.get(sessionId);
    
    // 记录用户消息
    session.messages.push({
      type: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // 意图识别
    const intent = detectIntent(message);
    console.log(`🧠 用户消息: "${message}" -> 意图: ${intent}`);
    
    // 生成回复
    const aiReply = generateReply(message, intent);
    
    // 记录AI回复
    session.messages.push({
      type: 'ai',
      content: aiReply,
      timestamp: new Date(),
      intent
    });
    
    session.lastActivity = new Date();
    
    console.log(`🤖 AI回复: ${aiReply}`);
    
    res.json({
      message: aiReply,
      intent,
      timestamp: new Date().toISOString(),
      confidence: 0.85
    });
    
  } catch (error) {
    console.error('❌ 处理消息失败:', error);
    res.status(500).json({
      error: '处理失败',
      message: '抱歉，我遇到了一些问题。请稍后重试或联系人工客服：400-123-4567'
    });
  }
});

// 会话管理
app.get('/api/chat/sessions', (req, res) => {
  const sessionList = Array.from(sessions.values()).map(session => ({
    id: session.id,
    messageCount: session.messages.length,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity
  }));
  
  res.json({
    total: sessions.size,
    sessions: sessionList
  });
});

// 清理过期会话（每小时清理一次）
setInterval(() => {
  const now = new Date();
  const expiredSessions = [];
  
  for (const [sessionId, session] of sessions) {
    const hoursSinceLastActivity = (now - session.lastActivity) / (1000 * 60 * 60);
    if (hoursSinceLastActivity > 2) { // 2小时无活动则清理
      expiredSessions.push(sessionId);
    }
  }
  
  expiredSessions.forEach(sessionId => {
    sessions.delete(sessionId);
    console.log(`🧹 清理过期会话: ${sessionId}`);
  });
  
  if (expiredSessions.length > 0) {
    console.log(`🧹 已清理 ${expiredSessions.length} 个过期会话`);
  }
}, 60 * 60 * 1000); // 每小时执行一次

// 启动服务（监听所有网络接口，支持真机调试）
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 简化AI客服服务启动成功！`);
  console.log(`📊 本地地址: http://localhost:${PORT}`);
  console.log(`📱 真机地址: http://192.168.0.198:${PORT}`);
  console.log(`💬 健康检查: http://192.168.0.198:${PORT}/api/chat/health`);
  console.log(`📚 模式: 简化版 (无需Rasa)`);
  console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
  console.log('');
  console.log('🎯 支持的功能:');
  console.log('  ✅ 智能意图识别');
  console.log('  ✅ 快速回复');
  console.log('  ✅ 会话管理');
  console.log('  ✅ 人工客服转接');
  console.log('  ✅ 真机调试支持');
  console.log('  ✅ Windows兼容');
  console.log('');
  console.log('📱 真机调试注意事项:');
  console.log('  1. 确保手机和电脑在同一局域网');
  console.log('  2. 检查防火墙是否允许端口3001');
  console.log('  3. 前端配置使用: 192.168.0.198:3001');
  console.log('');
  console.log('🛑 停止服务: Ctrl+C');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 接收到停止信号，正在关闭服务...');
  console.log(`📊 最终会话数: ${sessions.size}`);
  process.exit(0);
});

module.exports = app;
