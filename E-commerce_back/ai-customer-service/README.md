# 🤖 电商AI客服系统

基于 **Rasa + Gemini** 的专业电商智能客服解决方案，完全免费且可定制。

## ✨ 特性

- 🆓 **完全免费** - 基于开源Rasa + 免费Gemini API
- 🛒 **电商专用** - 专门针对电商场景训练和优化
- 🧠 **智能对话** - 支持意图识别、实体提取、上下文理解
- 🔄 **多层次回复** - Rasa规则 + 知识库 + Gemini兜底
- 📱 **移动优先** - 原生移动端聊天界面
- 🚀 **即插即用** - 快速集成到现有电商系统

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端聊天界面   │ -> │  Node.js服务层  │ -> │   Rasa Core    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ↓                        ↓
                    ┌─────────────────┐    ┌─────────────────┐
                    │  Gemini 备用    │    │   自定义Actions │
                    └─────────────────┘    └─────────────────┘
```

## 🎯 支持的业务场景

### 📦 订单相关
- 订单状态查询
- 订单修改/取消
- 物流跟踪

### 🛍️ 商品咨询  
- 商品规格参数
- 库存查询
- 价格咨询

### 💳 支付问题
- 支付方式说明
- 支付失败处理
- 退款咨询

### 🔄 售后服务
- 退换货政策
- 退货申请流程
- 投诉处理

### 👤 会员服务
- 会员权益说明
- 积分查询使用
- 等级升级规则

## 🚀 快速开始

### 1️⃣ 系统要求

- **Python 3.8+**
- **Node.js 16+**
- **内存 4GB+**
- **硬盘 2GB+**

### 2️⃣ 一键安装

```bash
# 克隆项目后进入AI客服目录
cd E-commerce_back/ai-customer-service

# 运行安装脚本
chmod +x install.sh
./install.sh
```

### 3️⃣ 配置API Key

编辑 `.env` 文件，设置Gemini API Key：

```env
GEMINI_API_KEY=your_actual_api_key_here
```

🔗 **获取免费API Key**: https://makersuite.google.com/app/apikey

### 4️⃣ 启动服务

```bash
# 启动所有服务
./start.sh

# 服务地址：
# Rasa API:    http://localhost:5005
# 聊天服务:    http://localhost:3001
# 健康检查:    http://localhost:3001/api/chat/health
```

### 5️⃣ 测试系统

```bash
# 健康检查
curl http://localhost:3001/api/chat/health

# 创建聊天会话
curl -X POST http://localhost:3001/api/chat/session \
  -H "Content-Type: application/json" \
  -d '{"userInfo": {"id": "test_user", "nickname": "测试用户"}}'

# 发送测试消息
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "your_session_id", 
    "message": "我想查询订单状态"
  }'
```

## 📱 前端集成

在Vue页面中使用AI客服组件：

```vue
<template>
  <view>
    <!-- 其他页面内容 -->
    
    <!-- AI客服组件 -->
    <ai-chat 
      :user-info="currentUserInfo"
      :auto-open="false"
    ></ai-chat>
  </view>
</template>

<script>
import AIChat from '@/components/AIChat/AIChat.vue';

export default {
  components: {
    AIChat
  },
  computed: {
    currentUserInfo() {
      return {
        id: 'user123',
        nickname: '用户昵称', 
        avatar: '/static/img/avatar.png'
      };
    }
  }
};
</script>
```

## 🔧 自定义配置

### 训练数据自定义

编辑 `nlu.yml` 添加更多训练样本：

```yaml
- intent: ask_custom_question
  examples: |
    - 你们的特色服务是什么
    - 有什么独特优势
    - 品牌故事
```

### 添加新的业务逻辑

在 `actions.py` 中添加自定义Action：

```python
class ActionCustomBusiness(Action):
    def name(self) -> Text:
        return "action_custom_business"
    
    def run(self, dispatcher, tracker, domain):
        # 你的业务逻辑
        response = "这是自定义的业务回复"
        dispatcher.utter_message(text=response)
        return []
```

## 📊 性能监控

### 查看日志

```bash
# 查看实时日志
npm run logs:rasa      # Rasa服务日志
npm run logs:actions   # Actions服务日志  
npm run logs:chat      # 聊天服务日志

# 或者直接查看文件
tail -f ai-customer-service/rasa.log
tail -f ai-customer-service/actions.log
tail -f chat.log
```

### 系统统计

访问统计接口：`http://localhost:3001/api/chat/stats`

```json
{
  "activeSessions": 5,
  "totalMessages": 128,
  "avgMessagesPerSession": "25.60"
}
```

## 🛠️ 运维管理

### 服务管理

```bash
# 启动服务
./start.sh

# 停止服务  
./stop.sh

# 重启服务
./stop.sh && ./start.sh

# 重新训练模型
npm run train
```

### 模型验证

```bash
# 验证训练数据
npm run validate

# 测试模型效果
npm run test

# 交互式测试
npm run shell
```

## 🔍 故障排除

### 常见问题

**1. Rasa启动失败**
```bash
# 检查Python版本
python3 --version

# 重新安装依赖
pip install -r requirements.txt
```

**2. Gemini API调用失败**
```bash
# 检查API Key配置
grep GEMINI_API_KEY .env

# 测试API连接
curl -H "x-goog-api-key: YOUR_API_KEY" \
  https://generativelanguage.googleapis.com/v1/models
```

**3. 端口冲突**
```bash
# 查看端口占用
lsof -i :5005
lsof -i :3001

# 修改端口配置
vim .env
```

## 📈 扩展功能

### 1. 添加语音支持

集成Web Speech API实现语音输入输出

### 2. 多语言支持

训练英文、日文等多语言模型

### 3. 情感分析

集成情感分析API判断用户情绪

### 4. 数据分析

对话数据统计和用户行为分析

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 💡 技术支持

- 📧 邮箱：support@yourcompany.com
- 📞 电话：400-123-4567
- 💬 QQ群：123456789

## 🌟 致谢

感谢以下开源项目：

- [Rasa](https://rasa.com/) - 对话AI框架
- [Google Gemini](https://ai.google.dev/) - 大语言模型
- [Vue.js](https://vuejs.org/) - 前端框架
- [Express.js](https://expressjs.com/) - Node.js框架

---

**⭐ 如果这个项目对您有帮助，请给我们一个Star！**
