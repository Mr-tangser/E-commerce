const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const Recognition = require('../models/Recognition');
const auth = require('../middleware/auth');
const baiduApiConfig = require('../config/baiduApi');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/recognition';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持上传图片文件 (jpeg, jpg, png, gif, bmp)'));
    }
  }
});

// 百度AI API配置 - 从配置文件获取
const { apiKey: BAIDU_API_KEY, secretKey: BAIDU_SECRET_KEY } = baiduApiConfig.getCredentials();

// 获取百度API访问令牌
async function getBaiduAccessToken() {
  try {
    const tokenUrl = baiduApiConfig.getEndpoint('tokenUrl');
    const requestConfig = baiduApiConfig.getRequestConfig();
    
    const response = await axios.post(
      tokenUrl,
      null,
      {
        params: {
          grant_type: 'client_credentials',
          client_id: BAIDU_API_KEY,
          client_secret: BAIDU_SECRET_KEY
        },
        timeout: requestConfig.timeout
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('获取百度API令牌失败:', error);
    throw new Error('获取API访问令牌失败');
  }
}

// 将图片转换为base64
function imageToBase64(filePath) {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    throw new Error('图片转换失败');
  }
}

// 物品识别接口 - 看图识万物
router.post('/identify', auth.protect, upload.single('image'), async (req, res) => {
  try {
    console.log('🎯 收到识别请求...', {
      file: req.file ? '文件已接收' : '❌ 未接收到文件',
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      mimeType: req.file?.mimetype,
      userId: req.user._id
    });

    if (!req.file) {
      console.error('❌ 未接收到图片文件');
      console.log('📋 请求详情:', {
        headers: req.headers,
        body: req.body,
        files: req.files
      });
      return res.status(400).json({
        success: false,
        error: {
          message: '请上传图片文件 - 确保请求中包含名为 image 的文件字段',
          statusCode: 400,
          details: '检查前端uploadFile的name参数是否为image'
        }
      });
    }

    // 检查API密钥配置
    if (!baiduApiConfig.validateConfig()) {
      return res.status(500).json({
        success: false,
        message: '百度AI API配置缺失或无效'
      });
    }

    // 获取访问令牌
    const accessToken = await getBaiduAccessToken();

    // 将图片转换为base64
    const imageBase64 = await imageToBase64(req.file.path); // 添加await

    // 调用百度看图识万物API
    console.log('🚀 正在调用百度识别API...');
    
    // 准备请求数据（URL编码格式）
    const formData = new URLSearchParams();
    const recognitionParams = baiduApiConfig.getRecognitionParams();
    formData.append('image', imageBase64);
    formData.append('baike_num', recognitionParams.baikeNum.toString()); // 返回百科词条数量
    
    const apiEndpoint = baiduApiConfig.getEndpoint('advancedGeneral');
    const requestConfig = baiduApiConfig.getRequestConfig();
    
    const response = await axios.post(
      `${apiEndpoint}?access_token=${accessToken}`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: requestConfig.timeout
      }
    );

    const result = response.data;
    console.log('📊 [识别响应] 百度API原始响应:', JSON.stringify(result, null, 2));

    // 清理临时文件
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // 处理识别结果
    if (result.error_code) {
      console.log('❌ [识别失败] 错误代码:', result.error_code, '错误信息:', result.error_msg);
      // 保存失败记录
      await Recognition.create({
        userId: req.user._id,
        recognitionType: 'general',
        results: result,
        baiduLogId: result.log_id || 'unknown',
        status: 'failed',
        errorMessage: result.error_msg
      });

      return res.status(400).json({
        success: false,
        message: '识别失败',
        error: result.error_msg
      });
    }

    // 提取最佳结果
    let topResult = { name: '', score: 0, baike_info: null };

    // 处理通用物体识别结果
    if (result.result && Array.isArray(result.result) && result.result.length > 0) {
      console.log('📋 [识别结果] 结果数组长度:', result.result.length);
      
      // 记录所有识别结果
      result.result.forEach((item, index) => {
        const itemName = item.keyword || item.name || '未知';
        console.log(`   ${index + 1}. 物品: "${itemName}", 置信度: ${item.score || 0}`);
      });
      
      const bestItem = result.result[0];
      topResult = {
        name: bestItem.keyword || bestItem.name || '未知物品',  // 优先使用keyword，其次name
        score: parseFloat(bestItem.score) || 0,
        baike_info: bestItem.baike_info || null
      };
      
      console.log('🏆 [最佳结果] 物品名称:', `"${topResult.name}"`, '置信度:', topResult.score);
    } else {
      console.log('❌ [识别结果] 无有效识别结果');
      // 即使没有识别出结果，也返回一个默认的topResult
      topResult = {
        name: '未识别的物品',
        score: 0,
        baike_info: null
      };
    }

    // 保存识别记录
    const recognitionRecord = await Recognition.create({
      userId: req.user._id,
      recognitionType: 'general',
      results: result.result || [],
      confidence: topResult.score,
      topResult: topResult,
      baiduLogId: result.log_id,
      status: 'success'
    });

    // 格式化返回结果
    const recognitionResult = {
      success: true,
      message: '识别成功',
      data: {
        id: recognitionRecord._id,
        results: result.result || [],
        topResult: topResult,
        log_id: result.log_id
      }
    };

    res.json(recognitionResult);

  } catch (error) {
    console.error('物品识别错误:', error);

    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: '识别服务异常',
      error: error.message
    });
  }
});

// 通用物体识别接口
router.post('/general', auth.protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传图片文件'
      });
    }

    // 检查API密钥配置
    if (!baiduApiConfig.validateConfig()) {
      return res.status(500).json({
        success: false,
        message: '百度AI API配置缺失或无效'
      });
    }

    // 获取访问令牌
    console.log('🔑 [通用识别] 正在获取百度API访问令牌...');
    const accessToken = await getBaiduAccessToken();
    console.log('✅ [通用识别] 百度API访问令牌获取成功');

    // 将图片转换为base64
    console.log('📸 [通用识别] 正在将图片转换为base64...');
    const imageBase64 = await imageToBase64(req.file.path);
    console.log('✅ [通用识别] 图片base64转换成功，大小:', imageBase64.length);

    // 调用百度通用物体识别API
    console.log('🚀 [通用识别] 正在调用百度通用识别API...');
    
    // 准备请求数据（URL编码格式）
    const formData = new URLSearchParams();
    const recognitionParams = baiduApiConfig.getRecognitionParams();
    formData.append('image', imageBase64);
    formData.append('baike_num', recognitionParams.baikeNum.toString()); // 返回百科词条数量
    
    const apiEndpoint = baiduApiConfig.getEndpoint('advancedGeneral');
    const requestConfig = baiduApiConfig.getRequestConfig();
    
    const response = await axios.post(
      `${apiEndpoint}?access_token=${accessToken}`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: requestConfig.timeout
      }
    );

    const result = response.data;
    console.log('📊 [通用识别] 百度API响应结果:', JSON.stringify(result, null, 2));

    // 清理临时文件
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // 处理识别结果
    if (result.error_code) {
      console.log('❌ [通用识别失败] 错误代码:', result.error_code, '错误信息:', result.error_msg);
      // 保存失败记录
      await Recognition.create({
        userId: req.user._id,
        recognitionType: 'general',
        results: result,
        baiduLogId: result.log_id || 'unknown',
        status: 'failed',
        errorMessage: result.error_msg
      });

      return res.status(400).json({
        success: false,
        message: '识别失败',
        error: result.error_msg
      });
    }

    // 提取最佳结果
    let topResult = { name: '', score: 0, baike_info: null };
    if (result.result && Array.isArray(result.result) && result.result.length > 0) {
      console.log('📋 [通用识别结果] 结果数组长度:', result.result.length);
      
      // 记录所有识别结果
      result.result.forEach((item, index) => {
        const itemName = item.keyword || item.name || '未知';
        console.log(`   ${index + 1}. 物品: "${itemName}", 置信度: ${item.score || 0}`);
      });
      
      const bestItem = result.result[0];
      topResult = {
        name: bestItem.keyword || bestItem.name || '未知物品',  // 优先使用keyword，其次name
        score: parseFloat(bestItem.score) || 0,
        baike_info: bestItem.baike_info || null
      };
      
      console.log('🏆 [通用识别最佳结果] 物品名称:', `"${topResult.name}"`, '置信度:', topResult.score);
    } else {
      console.log('❌ [通用识别结果] 无有效识别结果');
      // 即使没有识别出结果，也返回一个默认的topResult
      topResult = {
        name: '未识别的物品',
        score: 0,
        baike_info: null
      };
    }

    // 保存识别记录
    const recognitionRecord = await Recognition.create({
      userId: req.user._id,
      recognitionType: 'general',
      results: result.result || [],
      confidence: topResult.score,
      topResult: topResult,
      baiduLogId: result.log_id,
      status: 'success'
    });

    // 格式化返回结果
    const recognitionResult = {
      success: true,
      message: '识别成功',
      data: {
        id: recognitionRecord._id,
        results: result.result || [],
        topResult: topResult,
        log_id: result.log_id
      }
    };

    res.json(recognitionResult);

  } catch (error) {
    console.error('物体识别错误:', error);

    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: '识别服务异常',
      error: error.message
    });
  }
});

// 图片URL识别接口
router.post('/identify-url', auth.protect, async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: '请提供图片URL'
      });
    }

    // 检查API密钥配置
    if (!baiduApiConfig.validateConfig()) {
      return res.status(500).json({
        success: false,
        message: '百度AI API配置缺失或无效'
      });
    }

    // 获取访问令牌
    const accessToken = await getBaiduAccessToken();

    // 调用百度通用物体识别API
    const apiEndpoint = baiduApiConfig.getEndpoint('advancedGeneral');
    const requestConfig = baiduApiConfig.getRequestConfig();
    
    const response = await axios.post(
      apiEndpoint,
      {
        url: imageUrl
      },
      {
        params: {
          access_token: accessToken
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: requestConfig.timeout
      }
    );

    const result = response.data;
    console.log('📊 [URL识别] 百度API响应结果:', JSON.stringify(result, null, 2));

    // 处理识别结果
    if (result.error_code) {
      console.log('❌ [URL识别失败] 错误代码:', result.error_code, '错误信息:', result.error_msg);
      // 保存失败记录
      await Recognition.create({
        userId: req.user._id,
        imageUrl: imageUrl,
        recognitionType: 'url',
        results: result,
        baiduLogId: result.log_id || 'unknown',
        status: 'failed',
        errorMessage: result.error_msg
      });

      return res.status(400).json({
        success: false,
        message: '识别失败',
        error: result.error_msg
      });
    }

    // 提取最佳结果
    let topResult = { name: '', score: 0, baike_info: null };

    // 处理通用物体识别结果
    if (result.result && Array.isArray(result.result) && result.result.length > 0) {
      console.log('📋 [URL识别结果] 结果数组长度:', result.result.length);
      
      // 记录所有识别结果
      result.result.forEach((item, index) => {
        const itemName = item.keyword || item.name || '未知';
        console.log(`   ${index + 1}. 物品: "${itemName}", 置信度: ${item.score || 0}`);
      });
      
      const bestItem = result.result[0];
      topResult = {
        name: bestItem.keyword || bestItem.name || '未知物品',  // 优先使用keyword，其次name
        score: parseFloat(bestItem.score) || 0,
        baike_info: bestItem.baike_info || null
      };
      
      console.log('🏆 [URL识别最佳结果] 物品名称:', `"${topResult.name}"`, '置信度:', topResult.score);
    } else {
      console.log('❌ [URL识别结果] 无有效识别结果');
      // 即使没有识别出结果，也返回一个默认的topResult
      topResult = {
        name: '未识别的物品',
        score: 0,
        baike_info: null
      };
    }

    // 保存识别记录
    const recognitionRecord = await Recognition.create({
      userId: req.user._id,
      imageUrl: imageUrl,
      recognitionType: 'url',
      results: result.result || [],
      confidence: topResult.score,
      topResult: topResult,
      baiduLogId: result.log_id,
      status: 'success'
    });

    // 格式化返回结果
    const recognitionResult = {
      success: true,
      message: '识别成功',
      data: {
        id: recognitionRecord._id,
        results: result.result || [],
        topResult: topResult,
        log_id: result.log_id
      }
    };

    res.json(recognitionResult);

  } catch (error) {
    console.error('URL图片识别错误:', error);

    res.status(500).json({
      success: false,
      message: '识别服务异常',
      error: error.message
    });
  }
});

// 获取用户识别历史
router.get('/history', auth.protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const query = { userId: req.user._id };
    if (type) {
      query.recognitionType = type;
    }

    const recognitions = await Recognition.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Recognition.countDocuments(query);

    res.json({
      success: true,
      data: {
        recognitions: recognitions,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: recognitions.length,
          totalRecords: total
        }
      }
    });

  } catch (error) {
    console.error('获取识别历史错误:', error);
    res.status(500).json({
      success: false,
      message: '获取历史记录失败',
      error: error.message
    });
  }
});

// 获取单个识别记录详情
router.get('/detail/:id', auth.protect, async (req, res) => {
  try {
    const recognition = await Recognition.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!recognition) {
      return res.status(404).json({
        success: false,
        message: '识别记录不存在'
      });
    }

    res.json({
      success: true,
      data: recognition
    });

  } catch (error) {
    console.error('获取识别记录详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取记录详情失败',
      error: error.message
    });
  }
});

// 删除识别记录
router.delete('/:id', auth.protect, async (req, res) => {
  try {
    const recognition = await Recognition.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!recognition) {
      return res.status(404).json({
        success: false,
        message: '识别记录不存在'
      });
    }

    res.json({
      success: true,
      message: '删除成功'
    });

  } catch (error) {
    console.error('删除识别记录错误:', error);
    res.status(500).json({
      success: false,
      message: '删除记录失败',
      error: error.message
    });
  }
});

// 获取识别统计信息
router.get('/stats', auth.protect, async (req, res) => {
  try {
    const stats = await Recognition.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$recognitionType',
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          avgConfidence: {
            $avg: '$confidence'
          }
        }
      }
    ]);

    const totalRecognitions = await Recognition.countDocuments({
      userId: req.user._id
    });

    const successfulRecognitions = await Recognition.countDocuments({
      userId: req.user._id,
      status: 'success'
    });

    res.json({
      success: true,
      data: {
        total: totalRecognitions,
        successful: successfulRecognitions,
        successRate: totalRecognitions > 0 ? (successfulRecognitions / totalRecognitions * 100).toFixed(2) : 0,
        byType: stats
      }
    });

  } catch (error) {
    console.error('获取识别统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
});

module.exports = router;
