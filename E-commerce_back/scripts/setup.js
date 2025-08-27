#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 四人协作电商项目 - 环境初始化脚本');
console.log('=====================================\n');

// 检查Node.js版本
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 16) {
  console.error('❌ 错误: 需要Node.js 16.0.0或更高版本');
  console.error(`当前版本: ${nodeVersion}`);
  process.exit(1);
}

console.log(`✅ Node.js版本检查通过: ${nodeVersion}`);

// 检查package.json是否存在
if (!fs.existsSync('package.json')) {
  console.error('❌ 错误: 未找到package.json文件');
  console.error('请确保在项目根目录运行此脚本');
  process.exit(1);
}

console.log('✅ 项目文件检查通过');

// 创建.env文件（如果不存在）
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📝 创建.env文件...');
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env文件创建成功');
  } else {
    console.log('⚠️  警告: 未找到.env.example文件，请手动创建.env文件');
  }
} else {
  console.log('✅ .env文件已存在');
}

// 创建uploads目录
const uploadsPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) {
  console.log('📁 创建uploads目录...');
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('✅ uploads目录创建成功');
} else {
  console.log('✅ uploads目录已存在');
}

// 安装依赖
console.log('\n📦 安装项目依赖...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ 依赖安装完成');
} catch (error) {
  console.error('❌ 依赖安装失败:', error.message);
  console.log('请手动运行: npm install');
}

// 检查MongoDB连接
console.log('\n🔍 检查MongoDB连接...');
console.log('请确保MongoDB服务正在运行');
console.log('连接字符串: mongodb+srv://3269779984:tangyaqi..@diyigejihe.df8avp1.mongodb.net/');

// 显示启动说明
console.log('\n🎯 项目设置完成！');
console.log('\n📋 下一步操作:');
console.log('1. 检查并配置.env文件中的环境变量');
console.log('2. 确保MongoDB连接正常');
console.log('3. 运行开发服务器: npm run dev');
console.log('4. 访问: http://localhost:3000');
console.log('5. 健康检查: http://localhost:3000/health');

console.log('\n🔧 常用命令:');
console.log('- npm run dev     # 开发模式启动');
console.log('- npm start       # 生产模式启动');
console.log('- npm test        # 运行测试');
console.log('- npm run lint    # 代码检查');

console.log('\n👥 协作开发提示:');
console.log('- 每个功能创建独立分支');
console.log('- 提交前进行代码审查');
console.log('- 保持代码注释和文档更新');
console.log('- 遵循团队代码规范');

console.log('\n✨ 祝您开发愉快！'); 