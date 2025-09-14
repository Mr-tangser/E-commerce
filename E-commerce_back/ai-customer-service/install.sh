#!/bin/bash
# AI客服系统安装脚本

echo "🤖 开始安装Rasa + Gemini电商AI客服系统..."

# 检查Python环境
echo "📋 检查Python环境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3未安装，请先安装Python 3.8+版本"
    exit 1
fi

python_version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "✅ Python版本: $python_version"

# 创建虚拟环境
echo "🔧 创建Python虚拟环境..."
python3 -m venv rasa-env
source rasa-env/bin/activate

# 安装Rasa
echo "📦 安装Rasa..."
pip install --upgrade pip
pip install rasa[transformers,spacy]==3.6.19
pip install jieba
pip install google-generativeai

# 下载中文模型
echo "🔤 下载中文语言模型..."
python -m spacy download zh_core_web_sm

# 安装Node.js依赖
echo "📦 安装Node.js依赖..."
cd ../
npm install express axios cors uuid @google/generative-ai

# 创建环境变量文件
echo "📄 创建环境配置文件..."
cat > .env << EOF
# Gemini API Key (请在Google AI Studio获取)
GEMINI_API_KEY=your_gemini_api_key_here

# 服务端口配置
RASA_PORT=5005
CHAT_SERVICE_PORT=3001

# 日志级别
LOG_LEVEL=info
EOF

echo "✅ 安装完成！"
echo ""
echo "📋 接下来的步骤："
echo "1. 编辑 .env 文件，设置您的 GEMINI_API_KEY"
echo "2. 运行 ./start.sh 启动服务"
echo "3. 在前端页面测试AI客服功能"
echo ""
echo "🔗 获取Gemini API Key:"
echo "   https://makersuite.google.com/app/apikey"
