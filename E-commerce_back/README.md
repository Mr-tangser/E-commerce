# 四人协作电商项目 - Express服务器

这是一个基于Express.js和MongoDB的电商后端API服务器，专为四人协作开发设计。

## 🚀 特性

- **完整的电商功能**: 用户管理、产品管理、订单管理、分类管理
- **安全的认证系统**: JWT令牌认证，角色权限控制
- **MongoDB集成**: 使用Mongoose ODM，支持云数据库
- **RESTful API**: 标准化的API设计，支持分页、搜索、筛选
- **输入验证**: 使用express-validator进行数据验证
- **错误处理**: 统一的错误处理中间件
- **协作友好**: 清晰的代码结构，便于多人协作开发

## 📋 系统要求

- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm 或 yarn

## 🛠️ 安装步骤

### 1. 克隆项目
```bash
git clone <项目地址>
cd e-commerce-server
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
创建 `.env` 文件（参考 `.env.example`）：
```env
# MongoDB连接配置
MONGODB_URI=mongodb+srv://3269779984:tangyaqi..@diyigejihe.df8avp1.mongodb.net/

# 服务器配置
PORT=3000
NODE_ENV=development

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# 安全配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. 启动服务器
```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

## 🏗️ 项目结构

```
├── config/                 # 配置文件
│   └── database.js        # 数据库连接配置
├── middleware/            # 中间件
│   ├── auth.js           # 认证中间件
│   ├── errorHandler.js   # 错误处理中间件
│   └── notFound.js       # 404处理中间件
├── models/               # 数据模型
│   ├── User.js          # 用户模型
│   ├── Product.js       # 产品模型
│   ├── Order.js         # 订单模型
│   └── Category.js      # 分类模型
├── routes/               # 路由
│   ├── auth.js          # 认证路由
│   ├── users.js         # 用户管理路由
│   ├── products.js      # 产品管理路由
│   ├── orders.js        # 订单管理路由
│   └── categories.js    # 分类管理路由
├── uploads/              # 文件上传目录
├── .env.example          # 环境变量模板
├── .gitignore           # Git忽略文件
├── package.json          # 项目依赖配置
├── README.md            # 项目说明文档
└── server.js            # 主服务器文件
```

## 🔐 API认证

### 获取令牌
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 使用令牌
```bash
Authorization: Bearer <your-jwt-token>
```

## 📚 API端点

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 用户管理
- `GET /api/users` - 获取用户列表（管理员）
- `GET /api/users/:id` - 获取用户详情
- `PUT /api/users/:id` - 更新用户信息
- `DELETE /api/users/:id` - 删除用户（管理员）
- `PATCH /api/users/:id/toggle-status` - 切换用户状态（管理员）

### 产品管理
- `GET /api/products` - 获取产品列表
- `GET /api/products/:id` - 获取产品详情
- `POST /api/products` - 创建产品（管理员）
- `PUT /api/products/:id` - 更新产品（管理员）
- `DELETE /api/products/:id` - 删除产品（管理员）
- `POST /api/products/:id/reviews` - 添加产品评论
- `GET /api/products/:id/reviews` - 获取产品评论

### 订单管理
- `GET /api/orders` - 获取用户订单列表
- `GET /api/orders/admin` - 获取所有订单（管理员）
- `GET /api/orders/:id` - 获取订单详情
- `POST /api/orders` - 创建订单
- `PATCH /api/orders/:id/status` - 更新订单状态（管理员）
- `PATCH /api/orders/:id/cancel` - 取消订单
- `DELETE /api/orders/:id` - 删除订单（管理员）

### 分类管理
- `GET /api/categories` - 获取分类树形结构
- `GET /api/categories/flat` - 获取分类平铺列表
- `GET /api/categories/:id` - 获取分类详情
- `GET /api/categories/slug/:slug` - 根据slug获取分类
- `POST /api/categories` - 创建分类（管理员）
- `PUT /api/categories/:id` - 更新分类（管理员）
- `DELETE /api/categories/:id` - 删除分类（管理员）
- `GET /api/categories/:id/products` - 获取分类下的产品
- `PATCH /api/categories/reorder` - 批量更新分类排序（管理员）

## 🔒 权限控制

### 用户角色
- **user**: 普通用户，可以浏览产品、下单、管理自己的订单
- **moderator**: 版主，可以管理产品评论、协助管理
- **admin**: 管理员，拥有所有权限

### 权限矩阵
| 操作 | user | moderator | admin |
|------|------|-----------|-------|
| 浏览产品 | ✅ | ✅ | ✅ |
| 下单 | ✅ | ✅ | ✅ |
| 管理自己的订单 | ✅ | ✅ | ✅ |
| 添加评论 | ✅ | ✅ | ✅ |
| 管理产品 | ❌ | ❌ | ✅ |
| 管理分类 | ❌ | ❌ | ✅ |
| 管理用户 | ❌ | ❌ | ✅ |
| 管理所有订单 | ❌ | ❌ | ✅ |

## 🚀 开发指南

### 代码规范
- 使用ES6+语法
- 遵循RESTful API设计原则
- 统一的错误响应格式
- 完整的输入验证
- 详细的错误日志

### 协作开发流程
1. **功能分支**: 每个功能创建独立分支
2. **代码审查**: 提交前进行代码审查
3. **测试**: 确保API功能正常
4. **文档**: 更新API文档和注释

### 添加新功能
1. 创建数据模型（如需要）
2. 添加路由处理
3. 实现业务逻辑
4. 添加权限控制
5. 编写测试用例
6. 更新文档

## 🧪 测试

```bash
# 运行测试
npm test

# 运行测试并监听文件变化
npm run test:watch
```

## 📦 部署

### 生产环境配置
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
```

### PM2部署
```bash
npm install -g pm2
pm2 start server.js --name "ecommerce-api"
pm2 save
pm2 startup
```

## 🔧 常见问题

### MongoDB连接失败
- 检查网络连接
- 验证连接字符串
- 确认数据库用户权限

### JWT令牌无效
- 检查令牌是否过期
- 验证JWT_SECRET配置
- 确认令牌格式正确

### 权限不足
- 检查用户角色
- 验证路由权限设置
- 确认中间件配置

## 📞 技术支持

如有问题，请联系开发团队或查看项目文档。

## 📄 许可证

MIT License

---

**注意**: 这是一个协作开发项目，请遵循团队开发规范，保持良好的代码质量和文档更新。 