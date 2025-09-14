@echo off
echo 🚀 启动Rasa + Gemini电商AI客服系统 (Windows版)...

:: 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python未安装，请先安装Python 3.7+
    pause
    exit /b 1
)

echo ✅ Python已安装

:: 检查并安装Rasa
echo 🔧 检查Rasa安装状态...
pip show rasa >nul 2>&1
if errorlevel 1 (
    echo 📦 安装Rasa...
    pip install rasa
    pip install rasa[spacy]
    echo ✅ Rasa安装完成
) else (
    echo ✅ Rasa已安装
)

:: 检查并安装其他依赖
echo 📦 安装AI服务依赖...
pip install python-dotenv google-generativeai

:: 检查.env文件
if not exist ".env" (
    echo 📝 创建.env文件...
    echo GEMINI_API_KEY=your_gemini_api_key_here > .env
    echo RASA_PORT=5005 >> .env
    echo ACTIONS_PORT=5055 >> .env
    echo CHAT_SERVICE_PORT=3001 >> .env
    echo ⚠️  请在.env文件中设置正确的GEMINI_API_KEY
    echo    获取地址: https://makersuite.google.com/app/apikey
)

:: 训练Rasa模型
echo 🎓 训练Rasa模型...
if not exist "models" (
    rasa train
    echo ✅ 模型训练完成
) else (
    echo ✅ 模型已存在，跳过训练
)

echo.
echo 🚀 启动所有服务...
echo.

:: 启动Rasa服务 (后台运行)
echo 🤖 启动Rasa服务 (端口: 5005)...
start "Rasa服务" /min cmd /c "rasa run --enable-api --cors * --port 5005"

:: 等待Rasa启动
echo ⏳ 等待Rasa服务启动...
timeout /t 5 /nobreak >nul

:: 启动Rasa Actions (后台运行)
echo ⚡ 启动Rasa Actions服务 (端口: 5055)...
start "Rasa Actions" /min cmd /c "rasa run actions --port 5055"

:: 等待Actions启动
echo ⏳ 等待Actions服务启动...
timeout /t 3 /nobreak >nul

:: 启动Node.js聊天服务 (后台运行)
echo 💬 启动Node.js聊天服务 (端口: 3001)...
start "聊天服务" /min cmd /c "node chatService.js"

:: 等待所有服务启动
echo ⏳ 等待所有服务启动完成...
timeout /t 5 /nobreak >nul

echo.
echo ✅ AI客服系统启动成功！
echo.
echo 📊 服务状态：
echo    🤖 Rasa API:        http://localhost:5005
echo    ⚡ Rasa Actions:    http://localhost:5055  
echo    💬 聊天服务:        http://localhost:3001
echo.
echo 📋 测试命令：
echo    curl http://localhost:3001/api/chat/health
echo.
echo 🔍 查看服务窗口：在任务栏可以看到3个最小化的服务窗口
echo 🛑 停止服务：关闭这3个服务窗口即可
echo.
pause
