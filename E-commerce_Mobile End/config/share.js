/**
 * 分享功能配置文件
 */

const shareConfig = {
  // 应用域名（用于生成分享链接）
  domain: 'https://your-domain.com', // 请替换为你的实际域名
  
  // 默认分享内容
  defaultShare: {
    title: '精选好物 - 优质商品等你来',
    summary: '发现更多优质商品，享受购物乐趣',
    imageUrl: '/static/img/default_share.png'
  },
  
  // 分享平台配置
  platforms: {
    weixin: {
      appId: 'your_wechat_app_id', // 微信开放平台应用ID
      enabled: true
    },
    qq: {
      appId: 'your_qq_app_id', // QQ开放平台应用ID
      enabled: true
    },
    weibo: {
      appId: 'your_weibo_app_id', // 微博开放平台应用ID
      enabled: false
    }
  },
  
  // 分享选项配置
  shareOptions: {
    // APP环境下的分享选项
    app: ['分享给微信好友', '分享到朋友圈', '分享到QQ', '复制商品链接'],
    
    // H5环境下的分享选项
    h5: ['复制商品链接'],
    
    // 小程序环境下的分享选项
    mp: ['转发给好友', '生成分享海报']
  },
  
  // 分享统计配置
  analytics: {
    enabled: true, // 是否启用分享统计
    trackingEvents: {
      shareClick: 'share_button_click',
      shareSuccess: 'share_success',
      shareCancel: 'share_cancel',
      shareError: 'share_error'
    }
  }
};

export default shareConfig;
