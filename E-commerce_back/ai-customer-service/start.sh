#!/bin/bash
# AI客服系统启动脚本

echo "🚀 启动Rasa + Gemini电商AI客服系统..."

# 检查.env文件
if [ ! -f ".env" ]; then
    echo "❌ .env文件不存在，请先运行 ./install.sh"
    exit 1
fi

# 加载环境变量
source .env

# 检查Gemini API Key
if [ "$GEMINI_API_KEY" = "your_gemini_api_key_here" ]; then
    echo "⚠️  警告: 请在.env文件中设置正确的GEMINI_API_KEY"
    echo "   获取地址: https://makersuite.google.com/app/apikey"
fi

# 激活虚拟环境
echo "🔧 激活Python虚拟环境..."
source rasa-env/bin/activate

# 启动Rasa服务
echo "🤖 启动Rasa服务 (端口: ${RASA_PORT:-5005})..."
cd ai-customer-service
nohup rasa run --enable-api --cors "*" --port ${RASA_PORT:-5005} > rasa.log 2>&1 &
RASA_PID=$!
echo "Rasa PID: $RASA_PID"

# 启动Actions服务
echo "⚡ 启动Rasa Actions服务..."
nohup rasa run actions > actions.log 2>&1 &
ACTIONS_PID=$!
echo "Actions PID: $ACTIONS_PID"

# 等待Rasa启动
echo "⏳ 等待Rasa服务启动..."
sleep 10

# 启动聊天服务
echo "💬 启动Node.js聊天服务 (端口: ${CHAT_SERVICE_PORT:-3001})..."
cd ..
nohup node ai-customer-service/chatService.js > chat.log 2>&1 &
CHAT_PID=$!
echo "聊天服务 PID: $CHAT_PID"

# 保存PID文件
echo "$RASA_PID" > ai-customer-service/rasa.pid
echo "$ACTIONS_PID" > ai-customer-service/actions.pid
echo "$CHAT_PID" > ai-customer-service/chat.pid

echo ""
echo "✅ AI客服系统启动成功！"
echo ""
echo "📊 服务状态："
echo "   🤖 Rasa API:        http://localhost:${RASA_PORT:-5005}"
echo "   ⚡ Rasa Actions:    http://localhost:5055"
echo "   💬 聊天服务:        http://localhost:${CHAT_SERVICE_PORT:-3001}"
echo ""
echo "📋 测试命令："
echo "   curl http://localhost:${CHAT_SERVICE_PORT:-3001}/api/chat/health"
echo ""
echo "📄 日志文件："
echo "   Rasa:     ai-customer-service/rasa.log"
echo "   Actions:  ai-customer-service/actions.log"
echo "   聊天服务:  chat.log"
echo ""
echo "🛑 停止服务: ./stop.sh"
