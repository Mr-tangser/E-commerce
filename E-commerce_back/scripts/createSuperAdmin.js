const mongoose = require('mongoose');
const Admin = require('../models/Admin');

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://3269779984:tangyaqi..@diyigejihe.df8avp1.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createSuperAdmin() {
  try {
    // 检查是否已存在超级管理员
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      console.log('✅ 超级管理员已存在:', existingSuperAdmin.email);
      process.exit(0);
    }

    // 创建超级管理员
    const superAdmin = await Admin.create({
      username: 'superadmin',
      email: 'admin@jsonapi.com',
      password: 'secret',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      department: 'technical',
      permissions: {
        users: { view: true, create: true, edit: true, delete: true },
        products: { view: true, create: true, edit: true, delete: true },
        orders: { view: true, create: true, edit: true, delete: true },
        analytics: { view: true, export: true },
        settings: { view: true, edit: true }
      }
    });

    console.log('🎉 超级管理员创建成功!');
    console.log('📧 邮箱:', superAdmin.email);
    console.log('🔑 密码: secret');
    console.log('👤 用户名:', superAdmin.username);
    console.log('🔐 角色:', superAdmin.role);
    
    // 创建默认管理员
    const defaultAdmin = await Admin.create({
      username: 'admin',
      email: 'admin@ecommerce.com', 
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      department: 'sales',
      permissions: {
        users: { view: true, create: false, edit: true, delete: false },
        products: { view: true, create: true, edit: true, delete: false },
        orders: { view: true, create: false, edit: true, delete: false },
        analytics: { view: true, export: false },
        settings: { view: false, edit: false }
      }
    });

    console.log('✨ 默认管理员创建成功!');
    console.log('📧 邮箱:', defaultAdmin.email);
    console.log('🔑 密码: admin123');

  } catch (error) {
    console.error('❌ 创建管理员失败:', error);
  } finally {
    mongoose.connection.close();
  }
}

// 直接运行创建函数
if (require.main === module) {
  createSuperAdmin();
}

module.exports = createSuperAdmin; 
