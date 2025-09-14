#!/bin/bash
# AI客服系统停止脚本

echo "🛑 停止AI客服系统..."

# 停止聊天服务
if [ -f "ai-customer-service/chat.pid" ]; then
    CHAT_PID=$(cat ai-customer-service/chat.pid)
    if kill -0 $CHAT_PID 2>/dev/null; then
        echo "💬 停止聊天服务 (PID: $CHAT_PID)..."
        kill $CHAT_PID
        rm ai-customer-service/chat.pid
    else
        echo "💬 聊天服务已停止"
        rm -f ai-customer-service/chat.pid
    fi
fi

# 停止Rasa Actions服务
if [ -f "ai-customer-service/actions.pid" ]; then
    ACTIONS_PID=$(cat ai-customer-service/actions.pid)
    if kill -0 $ACTIONS_PID 2>/dev/null; then
        echo "⚡ 停止Rasa Actions服务 (PID: $ACTIONS_PID)..."
        kill $ACTIONS_PID
        rm ai-customer-service/actions.pid
    else
        echo "⚡ Rasa Actions服务已停止"
        rm -f ai-customer-service/actions.pid
    fi
fi

# 停止Rasa服务
if [ -f "ai-customer-service/rasa.pid" ]; then
    RASA_PID=$(cat ai-customer-service/rasa.pid)
    if kill -0 $RASA_PID 2>/dev/null; then
        echo "🤖 停止Rasa服务 (PID: $RASA_PID)..."
        kill $RASA_PID
        rm ai-customer-service/rasa.pid
    else
        echo "🤖 Rasa服务已停止"
        rm -f ai-customer-service/rasa.pid
    fi
fi

# 清理可能的残留进程
echo "🧹 清理残留进程..."
pkill -f "rasa run"
pkill -f "chatService.js"

echo "✅ AI客服系统已完全停止"
