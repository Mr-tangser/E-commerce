# 🔧 故障排除指南

## 问题1: Vue警告 - Duplicate keys detected

### 错误信息
```
[Vue warn]: Duplicate keys detected: '1'. This may cause an update error.
```

### 原因分析
- WaterfallFlow组件中左右两列使用了相同的key值
- 当数据有相同id时，Vue无法正确区分组件

### 解决方案 ✅
已修复：在WaterfallFlow组件中为左右列添加不同前缀：
```vue
<!-- 左列 -->
:key="`left-${item.id || index}`"

<!-- 右列 -->  
:key="`right-${item.id || index}`"
```

---

## 问题2: 真机调试无法连接后端

### 错误表现
- 真机上页面无数据
- 控制台显示网络连接失败
- API请求超时或失败

### 原因分析
1. **网络问题**: 手机和电脑不在同一WiFi网络
2. **IP地址错误**: 配置的IP地址不正确
3. **防火墙阻挡**: 电脑防火墙阻止了端口3000
4. **后端服务未启动**: 服务器没有运行

### 解决方案 ✅

#### 步骤1: 检查网络连接
```bash
# 确保手机和电脑在同一WiFi网络
# 手机设置 → WiFi → 查看当前连接的网络
# 电脑网络设置 → 查看WiFi连接
```

#### 步骤2: 获取正确的IP地址
```bash
# Windows用户
ipconfig

# Mac/Linux用户  
ifconfig

# 找到IPv4地址，例如: 192.168.1.100
```

#### 步骤3: 更新API配置
编辑文件：`E-commerce_Mobile End/config/api-config.js`
```javascript
const getCurrentDeviceIP = () => {
  return '192.168.1.100'; // 替换为实际IP地址
};
```

#### 步骤4: 检查后端服务
```bash
# 进入后端目录
cd E-commerce_back

# 启动服务
npm start

# 确认服务运行在端口3000
# 应该看到: Server running on http://localhost:3000
```

#### 步骤5: 测试连接
在手机浏览器中访问：
```
http://你的IP地址:3000/api/products?limit=1
```
如果返回JSON数据，说明连接正常。

#### 步骤6: 检查防火墙
**Windows:**
1. 控制面板 → 系统和安全 → Windows Defender 防火墙
2. 高级设置 → 入站规则 → 新建规则
3. 选择"端口" → TCP → 特定本地端口 → 3000
4. 允许连接 → 应用于所有配置文件

**Mac:**
```bash
# 关闭防火墙（临时用于调试）
sudo pfctl -d

# 或者添加端口规则
sudo pfctl -e
echo "pass in proto tcp from any to any port 3000" | sudo pfctl -f -
```

---

## 问题3: HBuilderX真机调试连接失败

### 解决步骤

1. **重启服务**
   ```bash
   # 停止后端服务 (Ctrl+C)
   # 重新启动
   cd E-commerce_back
   npm start
   ```

2. **重新连接真机**
   - 在HBuilderX中断开真机连接
   - 重新连接设备
   - 重新运行项目

3. **检查USB调试**
   - Android: 开启开发者选项中的USB调试
   - iOS: 信任开发者证书

4. **清除缓存**
   - 在HBuilderX中：运行 → 清理
   - 删除手机App，重新安装

---

## 问题4: API请求超时

### 优化配置 ✅
已优化API配置：
- 超时时间: 15秒（真机网络较慢）
- 自动重试机制
- 网络状态检测
- 详细错误提示

---

## 问题5: 小程序环境部署

### 注意事项
- 小程序只支持HTTPS协议
- 需要在小程序后台配置服务器域名
- 更新`api-config.js`中的生产环境地址

### 配置示例
```javascript
// 小程序生产环境
production: {
  server: 'https://your-api-domain.com/api'
}
```

---

## 🛠️ 调试工具

### 网络状态检测
```javascript
// 在控制台运行
api.system.checkNetworkStatus()
  .then(type => console.log('网络类型:', type))
  .catch(err => console.error('网络错误:', err));
```

### API连接测试  
```javascript
// 测试API连接
api.system.testAPIConnection()
  .then(result => console.log('API连接:', result))
  .catch(err => console.error('API错误:', err));
```

### 系统信息获取
```javascript
// 获取设备信息
api.system.getSystemInfo()
  .then(info => console.log('系统信息:', info));
```

---

## 📞 常见问题快速解决

| 问题 | 快速解决 |
|------|----------|
| 数据不显示 | 检查后端服务 + 网络连接 |
| Vue重复键警告 | 已修复，重新运行项目 |
| 真机连接失败 | 检查WiFi + IP地址 + 防火墙 |
| 请求超时 | 检查网络速度 + 服务器状态 |
| 小程序部署 | 配置HTTPS + 服务器域名 |

---

## 🆘 联系支持

如果问题仍未解决：
1. 查看控制台完整错误信息
2. 检查网络连接状态
3. 确认后端服务运行状态
4. 提供详细的错误截图和日志

