const Redis = require('redis');

let redisClient = null;

const connectRedis = async () => {
  try {
    // 创建Redis客户端
    redisClient = Redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    // 连接到Redis
    await redisClient.connect();
    
    console.log('✅ Redis连接成功');

    // 监听连接事件
    redisClient.on('connect', () => {
      console.log('🔄 Redis客户端连接中...');
    });

    redisClient.on('ready', () => {
      console.log('🚀 Redis客户端准备就绪');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis连接错误:', err);
    });

    redisClient.on('end', () => {
      console.log('🔌 Redis连接已断开');
    });

    return redisClient;
  } catch (error) {
    console.error('❌ Redis连接失败:', error);
    // Redis连接失败不应该导致整个应用退出
    console.warn('⚠️ 将在无Redis模式下运行（验证码功能将被禁用）');
    return null;
  }
};

// 获取Redis客户端实例
const getRedisClient = () => {
  return redisClient;
};

// 检查Redis是否可用
const isRedisAvailable = () => {
  return redisClient && redisClient.isReady;
};

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisAvailable
};

