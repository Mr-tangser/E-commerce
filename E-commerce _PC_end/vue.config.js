module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
        onError: function (err, req, res) {
          console.log('代理错误:', err);
        },
        onProxyReq: function (proxyReq, req, res) {
          console.log('代理请求:', req.method, req.url);
        }
      }
    },
    // 允许跨域访问
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Content-Length, X-Requested-With"
    }
  },
  
  // 生产环境配置
  publicPath: process.env.NODE_ENV === 'production'
    ? '/vue-material-dashboard/'
    : '/'
};
