const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  let token;

  // 从请求头获取token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 获取token
      token = req.headers.authorization.split(' ')[1];

      // 验证token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');

      let user;
      
      // 根据userType选择对应的模型
      if (decoded.userType === 'admin') {
        user = await Admin.findById(decoded.id).select('-password');
        if (user) {
          user.userType = 'admin';
        }
      } else {
        user = await User.findById(decoded.id).select('-password');
        if (user) {
          user.userType = 'user';
        }
      }
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            message: '用户不存在',
            statusCode: 401
          }
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: {
            message: '账户已被禁用',
            statusCode: 401
          }
        });
      }

      // 将用户信息添加到请求对象
      req.user = user;
      next();
    } catch (error) {
      console.error('Token验证失败:', error);
      return res.status(401).json({
        success: false,
        error: {
          message: '无效的认证令牌',
          statusCode: 401
        }
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: '未提供认证令牌',
        statusCode: 401
      }
    });
  }
};

// 角色验证中间件
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: '未认证',
          statusCode: 401
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: '权限不足',
          statusCode: 403
        }
      });
    }

    next();
  };
};

// 可选认证中间件（不强制要求认证）
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // 静默处理错误，不阻止请求继续
      console.log('可选认证失败:', error.message);
    }
  }

  next();
};

// 检查资源所有权
const checkOwnership = (model, field = 'user') => {
  return async (req, res, next) => {
    try {
      const resource = await model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          error: {
            message: '资源不存在',
            statusCode: 404
          }
        });
      }

      // 管理员可以访问所有资源
      if (req.user.role === 'admin') {
        return next();
      }

      // 检查资源所有权
      if (String(resource[field]) !== String(req.user._id)) {
        return res.status(403).json({
          success: false,
          error: {
            message: '无权访问此资源',
            statusCode: 403
          }
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  checkOwnership
}; 