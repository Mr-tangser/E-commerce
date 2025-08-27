const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://3269779984:tangyaqi..@diyigejihe.df8avp1.mongodb.net/';
    
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // 连接池大小
      serverSelectionTimeoutMS: 5000, // 服务器选择超时
      socketTimeoutMS: 45000, // Socket超时
      bufferMaxEntries: 0, // 禁用mongoose缓冲
      bufferCommands: false, // 禁用mongoose缓冲命令
    });

    console.log(`✅ MongoDB连接成功: ${conn.connection.host}`);
    
    // 监听连接事件
    mongoose.connection.on('connected', () => {
      console.log('🔄 Mongoose连接到MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose连接错误:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose断开连接');
    });

    return conn;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
};

module.exports = connectDB; 