const notFound = (req, res, next) => {
  const error = new Error(`未找到路径: ${req.originalUrl}`);
  error.statusCode = 404;
  
  // 记录404错误
  console.log(`🔍 404错误: ${req.method} ${req.originalUrl} - ${req.ip}`);
  
  next(error);
};

module.exports = notFound; 