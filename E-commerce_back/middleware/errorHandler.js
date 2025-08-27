const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 记录错误日志
  console.error('❌ 错误详情:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message: `数据验证失败: ${message}`,
      statusCode: 400,
      type: 'ValidationError'
    };
  }

  // Mongoose 重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = {
      message: `${field} 已存在，请使用其他值`,
      statusCode: 400,
      type: 'DuplicateKeyError'
    };
  }

  // Mongoose 无效ID错误
  if (err.name === 'CastError') {
    error = {
      message: '无效的ID格式',
      statusCode: 400,
      type: 'CastError'
    };
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: '无效的令牌',
      statusCode: 401,
      type: 'JWTError'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: '令牌已过期',
      statusCode: 401,
      type: 'JWTExpiredError'
    };
  }

  // 文件上传错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      message: '文件大小超出限制',
      statusCode: 400,
      type: 'FileSizeError'
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      message: '意外的文件字段',
      statusCode: 400,
      type: 'FileFieldError'
    };
  }

  // 默认错误
  const statusCode = error.statusCode || 500;
  const message = error.message || '服务器内部错误';

  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        statusCode,
        type: error.type || 'InternalServerError',
        stack: err.stack,
        details: error
      }
    });
  } else {
    // 生产环境只返回基本错误信息
    res.status(statusCode).json({
      success: false,
      error: {
        message: statusCode === 500 ? '服务器内部错误' : message,
        statusCode
      }
    });
  }
};

module.exports = errorHandler; 