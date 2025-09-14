// chatService.js - Node.js后端聊天服务
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

class ChatService {
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.sessions = new Map(); // 存储会话状态
        this.rasaUrl = 'http://localhost:5005'; // Rasa服务地址
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // 日志中间件
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // 创建新的聊天会话
        this.app.post('/api/chat/session', (req, res) => {
            const sessionId = uuidv4();
            this.sessions.set(sessionId, {
                created: new Date(),
                messages: [],
                userInfo: req.body.userInfo || {}
            });
            
            res.json({ 
                sessionId,
                message: "AI客服已就绪，有什么可以帮您的吗？" 
            });
        });

        // 发送消息到AI客服
        this.app.post('/api/chat/message', async (req, res) => {
            try {
                const { sessionId, message, userInfo } = req.body;
                
                if (!sessionId || !message) {
                    return res.status(400).json({ 
                        error: '缺少必要参数：sessionId 或 message' 
                    });
                }

                // 记录用户消息
                this.addMessageToSession(sessionId, 'user', message);

                // 发送到Rasa
                const rasaResponse = await this.sendToRasa(sessionId, message, userInfo);
                
                // 记录AI回复
                this.addMessageToSession(sessionId, 'bot', rasaResponse.text);

                res.json({
                    response: rasaResponse.text,
                    confidence: rasaResponse.confidence || 0.8,
                    intent: rasaResponse.intent,
                    entities: rasaResponse.entities || []
                });

            } catch (error) {
                console.error('聊天服务错误:', error);
                
                // 降级处理：返回友好的错误信息
                const fallbackMessage = this.getFallbackResponse(req.body.message);
                
                res.json({
                    response: fallbackMessage,
                    confidence: 0.1,
                    fallback: true
                });
            }
        });

        // 获取聊天历史
        this.app.get('/api/chat/history/:sessionId', (req, res) => {
            const sessionId = req.params.sessionId;
            const session = this.sessions.get(sessionId);
            
            if (!session) {
                return res.status(404).json({ error: '会话不存在' });
            }
            
            res.json({
                messages: session.messages,
                created: session.created
            });
        });

        // 健康检查
        this.app.get('/api/chat/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                service: 'AI Customer Service',
                timestamp: new Date().toISOString(),
                sessions: this.sessions.size
            });
        });

        // 获取聊天统计
        this.app.get('/api/chat/stats', (req, res) => {
            const stats = {
                activeSessions: this.sessions.size,
                totalMessages: Array.from(this.sessions.values())
                    .reduce((total, session) => total + session.messages.length, 0),
                avgMessagesPerSession: 0
            };
            
            if (stats.activeSessions > 0) {
                stats.avgMessagesPerSession = 
                    (stats.totalMessages / stats.activeSessions).toFixed(2);
            }
            
            res.json(stats);
        });
    }

    async sendToRasa(sessionId, message, userInfo = {}) {
        try {
            const rasaPayload = {
                sender: sessionId,
                message: message,
                metadata: {
                    userInfo: userInfo,
                    timestamp: new Date().toISOString()
                }
            };

            console.log('发送到Rasa:', rasaPayload);

            const response = await axios.post(
                `${this.rasaUrl}/webhooks/rest/webhook`,
                rasaPayload,
                {
                    timeout: 10000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Rasa响应:', response.data);

            if (response.data && response.data.length > 0) {
                const botMessage = response.data[0];
                return {
                    text: botMessage.text || '抱歉，我暂时无法理解您的问题。',
                    confidence: 0.8,
                    intent: botMessage.intent,
                    entities: botMessage.entities
                };
            } else {
                throw new Error('Rasa返回空响应');
            }

        } catch (error) {
            console.error('Rasa通信错误:', error.message);
            
            // 如果Rasa不可用，使用Gemini作为备用
            return await this.fallbackToGemini(message);
        }
    }

    async fallbackToGemini(message) {
        try {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

            const prompt = `
你是一个专业的电商客服，只回答电商相关问题：
- 商品咨询、价格、库存
- 订单查询、修改、取消  
- 支付问题、退换货
- 物流配送、会员服务

用户问题：${message}

请用简洁友好的语气回答（100字内）：
            `;

            const result = await model.generateContent(prompt);
            const response = result.response;
            
            return {
                text: response.text() || '抱歉，请稍后重试或联系人工客服：400-123-4567',
                confidence: 0.6,
                fallback: true,
                source: 'gemini'
            };

        } catch (error) {
            console.error('Gemini备用服务错误:', error);
            return {
                text: '系统暂时繁忙，请稍后重试或拨打客服热线：400-123-4567',
                confidence: 0.1,
                fallback: true,
                source: 'static'
            };
        }
    }

    getFallbackResponse(message) {
        // 静态备用回复
        const fallbackResponses = {
            '订单': '您可以在"个人中心-我的订单"查看订单状态，或提供订单号我来帮您查询。',
            '退货': '我们支持7天无理由退货，请在订单页面申请退货或联系客服：400-123-4567',
            '支付': '我们支持微信、支付宝、银行卡支付。如有支付问题请联系客服。',
            '物流': '工作日24小时内发货，一般3-5天送达。可在订单页面查看物流信息。',
            '客服': '人工客服热线：400-123-4567，服务时间：9:00-21:00'
        };

        for (const [keyword, response] of Object.entries(fallbackResponses)) {
            if (message.includes(keyword)) {
                return response;
            }
        }

        return '抱歉，我没有理解您的问题。请联系人工客服：400-123-4567';
    }

    addMessageToSession(sessionId, role, content) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.messages.push({
                role,
                content,
                timestamp: new Date().toISOString()
            });
            
            // 限制消息历史长度
            if (session.messages.length > 100) {
                session.messages = session.messages.slice(-50);
            }
        }
    }

    // 清理过期会话
    cleanupSessions() {
        const now = new Date();
        const expireTime = 24 * 60 * 60 * 1000; // 24小时

        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.created > expireTime) {
                this.sessions.delete(sessionId);
                console.log(`清理过期会话: ${sessionId}`);
            }
        }
    }

    start(port = 3001) {
        // 定期清理会话
        setInterval(() => this.cleanupSessions(), 60 * 60 * 1000); // 每小时清理一次

        this.app.listen(port, () => {
            console.log(`🤖 AI客服服务启动成功！`);
            console.log(`🌐 服务地址: http://localhost:${port}`);
            console.log(`📊 健康检查: http://localhost:${port}/api/chat/health`);
            console.log(`📈 统计信息: http://localhost:${port}/api/chat/stats`);
            console.log(`🔗 Rasa地址: ${this.rasaUrl}`);
        });
    }
}

// 如果直接运行此文件，启动服务
if (require.main === module) {
    const chatService = new ChatService();
    chatService.start(3001);
}

module.exports = ChatService;
