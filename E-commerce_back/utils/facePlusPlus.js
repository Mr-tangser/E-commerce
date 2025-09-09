/**
 * Face++ API 集成服务
 * 提供人脸检测、人脸注册、人脸比对等功能
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class FacePlusPlusService {
  constructor() {
    // Face++ API 配置 - 清理密钥中的空格和换行符
    this.apiKey = (process.env.FACE_PLUS_PLUS_API_KEY || 'your_api_key_here').trim();
    this.apiSecret = (process.env.FACE_PLUS_PLUS_API_SECRET || 'your_api_secret_here').trim();
    this.apiBaseUrl = 'https://api-cn.faceplusplus.com/facepp/v3';

    // 人脸库配置
    this.facesetToken = process.env.FACE_PLUS_PLUS_FACESET_TOKEN || 'ecommerce_faceset';

    // 详细调试信息
    console.log('🔍 Face++ API 初始化调试:');
    console.log('📋 环境变量状态:', {
      hasApiKey: !!process.env.FACE_PLUS_PLUS_API_KEY,
      hasApiSecret: !!process.env.FACE_PLUS_PLUS_API_SECRET,
      keyLength: this.apiKey?.length,
      secretLength: this.apiSecret?.length
    });
    console.log('🔑 API Key (前10位):', this.apiKey?.substring(0, 10) + '...');
    console.log('🔒 API Secret (前10位):', this.apiSecret?.substring(0, 10) + '...');
    console.log('📁 Faceset Token:', this.facesetToken);

    if (this.apiKey === 'your_api_key_here' || this.apiSecret === 'your_api_secret_here') {
      console.warn('⚠️ Face++ API密钥未配置，人脸识别功能将不可用');
      console.log('💡 如需启用人脸识别功能，请在 .env 文件中配置 FACE_PLUS_PLUS_API_KEY 和 FACE_PLUS_PLUS_API_SECRET');
      this.isEnabled = false;
    } else {
      console.log('✅ Face++ API密钥已配置');
      this.isEnabled = true;
    }
  }

  /**
   * 创建FormData并添加基础认证信息
   */
  createBaseFormData() {
    const formData = new FormData();
    formData.append('api_key', this.apiKey);
    formData.append('api_secret', this.apiSecret);
    return formData;
  }

  /**
   * 发送API请求的通用方法
   */
  async makeRequest(endpoint, formData) {
    try {
      const response = await axios.post(`${this.apiBaseUrl}${endpoint}`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30秒超时
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Face++ API请求失败 (${endpoint}):`, error.response?.data || error.message);

      return {
        success: false,
        error: {
          message: this.parseErrorMessage(error),
          code: error.response?.status || 500,
          details: error.response?.data
        }
      };
    }
  }

  /**
   * 解析错误消息
   */
  parseErrorMessage(error) {
    if (error.response?.data?.error_message) {
      return this.translateError(error.response.data.error_message);
    }

    if (error.code === 'ECONNABORTED') {
      return '请求超时，请稍后重试';
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return '网络连接失败，请检查网络';
    }

    return '服务暂时不可用，请稍后重试';
  }

  /**
   * 翻译Face++错误消息
   */
  translateError(errorMessage) {
    const errorMap = {
      'INVALID_API_KEY': 'API密钥无效',
      'INVALID_API_SECRET': 'API密钥或密码错误',
      'INSUFFICIENT_BALANCE': 'API余额不足',
      'INVALID_IMAGE_FORMAT': '图片格式不支持',
      'IMAGE_FILE_TOO_LARGE': '图片文件过大',
      'NO_FACE_DETECTED': '未检测到人脸',
      'MULTIPLE_FACES_DETECTED': '检测到多张人脸，请确保只有一张人脸',
      'FACE_TOKEN_NOT_FOUND': '人脸信息不存在',
      'FACESET_NOT_FOUND': '人脸库不存在',
      'FACESET_FULL': '人脸库已满',
      'EMPTY_FACESET': '未找到匹配的人脸，请先注册',
      'FACE_ALREADY_EXISTS': '人脸已存在',
      'LOW_QUALITY_FACE': '人脸质量过低，请重新拍照',
      'CONCURRENCY_LIMIT_EXCEEDED': '请求过于频繁，请稍后重试'
    };

    return errorMap[errorMessage] || errorMessage;
  }

  /**
   * 人脸检测
   * @param {Buffer|string} imageBuffer - 图片缓冲区或base64字符串
   * @returns {Promise<Object>} 检测结果
   */
  async detectFace(imageBuffer) {
    if (!this.isEnabled) {
      return {
        success: false,
        error: { message: 'Face++ API未配置，人脸识别功能不可用' }
      };
    }

    try {
      const formData = this.createBaseFormData();

      if (Buffer.isBuffer(imageBuffer)) {
        formData.append('image_file', imageBuffer, {
          filename: 'face.jpg',
          contentType: 'image/jpeg'
        });
      } else if (typeof imageBuffer === 'string') {
        formData.append('image_base64', imageBuffer);
      } else {
        throw new Error('无效的图片格式');
      }

      // 暂时不使用return_attributes参数，避免参数错误
      // formData.append('return_attributes', 'age,gender');

      const result = await this.makeRequest('/detect', formData);

      if (!result.success) {
        return result;
      }

      const faces = result.data.faces;
      if (!faces || faces.length === 0) {
        return {
          success: false,
          error: { message: '未检测到人脸，请确保光线充足并正对摄像头' }
        };
      }

      if (faces.length > 1) {
        return {
          success: false,
          error: { message: '检测到多张人脸，请确保画面中只有一张人脸' }
        };
      }

      const face = faces[0];

      // 暂时注释人脸质量检查，避免参数错误
      // const faceQuality = face.attributes?.face_quality;
      // if (faceQuality) {
      //   const threshold = face.attributes.face_quality.threshold;
      //   const value = face.attributes.face_quality.value;

      //   if (value < threshold) {
      //     return {
      //       success: false,
      //       error: { message: '人脸质量过低，请改善光线条件并重新拍照' }
      //     };
      //   }
      // }

      return {
        success: true,
        data: {
          faceToken: face.face_token,
          faceRectangle: face.face_rectangle,
          attributes: face.attributes,
          confidence: face.confidence || 100
        }
      };

    } catch (error) {
      console.error('人脸检测错误:', error);
      return {
        success: false,
        error: { message: '人脸检测失败，请重试' }
      };
    }
  }

  /**
   * 创建人脸库（如果不存在）
   */
  async createFacesetIfNotExists() {
    try {
      // 首先检查人脸库是否存在
      const checkFormData = this.createBaseFormData();
      checkFormData.append('faceset_token', this.facesetToken);

      const checkResult = await this.makeRequest('/faceset/getdetail', checkFormData);

      if (checkResult.success) {
        // 人脸库已存在
        return { success: true, exists: true };
      }

      // 人脸库不存在，创建新的 - 不指定faceset_token让系统自动生成
      const createFormData = this.createBaseFormData();
      createFormData.append('display_name', 'E-Commerce User Faceset');
      // 不指定faceset_token，让Face++自动生成

      const createResult = await this.makeRequest('/faceset/create', createFormData);

      if (createResult.success) {
        // 使用Face++返回的faceset_token
        const newFacesetToken = createResult.data.faceset_token;
        this.facesetToken = newFacesetToken;
        console.log('🆕 Face++人脸库创建成功，新Token:', this.facesetToken);
        console.log('📊 Face++返回的faceset信息:', createResult.data);
        
        // 重要：更新所有用户的faceSetId到新的faceset
        await this.updateAllUsersFaceSetId(newFacesetToken);
        
        // 等待一下让faceset生效
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { success: true, exists: false, newToken: newFacesetToken };
      } else {
        console.error('Face++人脸库创建失败:', createResult.error);
        return createResult;
      }

    } catch (error) {
      console.error('创建人脸库时发生错误:', error);
      return {
        success: false,
        error: { message: '人脸库初始化失败' }
      };
    }
  }

  /**
   * 更新所有用户的faceSetId到新的faceset
   * 当faceset重新创建时调用
   */
  async updateAllUsersFaceSetId(newFacesetToken) {
    try {
      console.log('🔄 开始更新所有用户的faceSetId到新faceset...');
      
      // 引入User模型（动态引入避免循环依赖）
      const User = require('../models/User');
      
      // 查找所有有人脸的用户
      const usersWithFace = await User.find({ hasFace: true, faceToken: { $exists: true, $ne: null } });
      console.log(`📊 找到 ${usersWithFace.length} 个已注册人脸的用户`);
      
      if (usersWithFace.length === 0) {
        console.log('✅ 没有需要更新的用户');
        return;
      }
      
      // 批量更新用户的faceSetId
      const updateResult = await User.updateMany(
        { hasFace: true, faceToken: { $exists: true, $ne: null } },
        { 
          $set: { 
            faceSetId: newFacesetToken 
          },
          $unset: {
            // 清除旧的人脸注册状态，要求用户重新注册
            faceToken: "",
            hasFace: false
          }
        }
      );
      
      console.log('🔄 用户更新结果:', {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount
      });
      
      console.log('⚠️ 重要提醒：由于人脸库重新创建，所有用户需要重新注册人脸');
      
    } catch (error) {
      console.error('❌ 更新用户faceSetId失败:', error);
    }
  }

  /**
   * 添加人脸到人脸库
   * @param {string} faceToken - 人脸令牌
   * @param {string} userId - 用户ID（作为外部ID）
   */
  async addFaceToFaceset(faceToken, userId) {
    if (!this.isEnabled) {
      return {
        success: false,
        error: { message: 'Face++ API未配置，人脸注册功能不可用' }
      };
    }

    try {
      // 确保人脸库存在
      const facesetResult = await this.createFacesetIfNotExists();
      if (!facesetResult.success) {
        return facesetResult;
      }

      const formData = this.createBaseFormData();
      formData.append('faceset_token', this.facesetToken);
      formData.append('face_tokens', faceToken);
      // 移除 outer_id 参数，这是导致 COEXISTENCE_ARGUMENTS 错误的原因
      // outer_id 不应该在 addface 时使用，而是在人脸检测时关联

      console.log('🔧 Face++ addface 参数:');
      console.log('📁 faceset_token:', this.facesetToken);
      console.log('👤 face_tokens:', faceToken);
      console.log('🆔 user_id (仅用于内部记录):', userId);

      const result = await this.makeRequest('/faceset/addface', formData);

      if (result.success) {
        return {
          success: true,
          data: {
            faceAdded: result.data.face_added,
            faceCount: result.data.face_count
          }
        };
      }

      return result;

    } catch (error) {
      console.error('添加人脸到人脸库错误:', error);
      return {
        success: false,
        error: { message: '人脸注册失败，请重试' }
      };
    }
  }

  /**
   * 人脸搜索（在人脸库中查找匹配的人脸）
   * @param {string} faceToken - 待搜索的人脸令牌
   * @param {number} confidenceThreshold - 置信度阈值（默认80）
   */
  async searchFace(faceToken, confidenceThreshold = 80) {
    if (!this.isEnabled) {
      return {
        success: false,
        error: { message: 'Face++ API未配置，人脸识别功能不可用' }
      };
    }

    try {
      // 确保人脸库存在
      const facesetResult = await this.createFacesetIfNotExists();
      if (!facesetResult.success) {
        return facesetResult;
      }

      const formData = this.createBaseFormData();
      formData.append('face_token', faceToken);
      formData.append('faceset_token', this.facesetToken);
      formData.append('return_result_count', '1'); // 只返回最匹配的一个结果

      const result = await this.makeRequest('/search', formData);

      if (!result.success) {
        // 特殊处理：如果人脸库为空，这是正常情况
        if (result.error && result.error.details && result.error.details.error_message === 'EMPTY_FACESET') {
                  console.log('📝 提示：人脸库为空，可能需要重新注册人脸');
        return {
          success: false,
          error: { 
            message: '未找到匹配的人脸。由于系统升级，请重新注册人脸',
            code: 'NEED_REREGISTER_FACE'
          }
        };
        }
        return result;
      }

      const results = result.data.results;
      if (!results || results.length === 0) {
        return {
          success: false,
          error: { message: '未找到匹配的人脸，请先注册' }
        };
      }

      const bestMatch = results[0];
      const confidence = bestMatch.confidence;

      if (confidence < confidenceThreshold) {
        return {
          success: false,
          error: {
            message: `人脸匹配度过低 (${confidence.toFixed(1)}%)，请重试或重新注册`,
            confidence: confidence
          }
        };
      }

      return {
        success: true,
        data: {
          matchedFaceToken: bestMatch.face_token,
          confidence: confidence
          // 移除 userId，因为我们不再使用 outer_id
          // 用户查找将通过 face_token 在数据库中进行
        }
      };

    } catch (error) {
      console.error('人脸搜索错误:', error);
      return {
        success: false,
        error: { message: '人脸识别失败，请重试' }
      };
    }
  }

  /**
   * 从人脸库中删除人脸
   * @param {string} faceToken - 要删除的人脸令牌
   */
  async removeFaceFromFaceset(faceToken) {
    try {
      const formData = this.createBaseFormData();
      formData.append('faceset_token', this.facesetToken);
      formData.append('face_tokens', faceToken);

      const result = await this.makeRequest('/faceset/removeface', formData);

      if (result.success) {
        return {
          success: true,
          data: {
            faceRemoved: result.data.face_removed,
            faceCount: result.data.face_count
          }
        };
      }

      return result;

    } catch (error) {
      console.error('删除人脸错误:', error);
      return {
        success: false,
        error: { message: '删除人脸失败' }
      };
    }
  }

  /**
   * 人脸比对（1:1比较两张人脸）
   * @param {string} faceToken1 - 第一张人脸令牌
   * @param {string} faceToken2 - 第二张人脸令牌
   */
  async compareFaces(faceToken1, faceToken2) {
    try {
      const formData = this.createBaseFormData();
      formData.append('face_token1', faceToken1);
      formData.append('face_token2', faceToken2);

      const result = await this.makeRequest('/compare', formData);

      if (result.success) {
        return {
          success: true,
          data: {
            confidence: result.data.confidence,
            isMatch: result.data.confidence > 80, // 80%以上认为匹配
            thresholds: result.data.thresholds
          }
        };
      }

      return result;

    } catch (error) {
      console.error('人脸比对错误:', error);
      return {
        success: false,
        error: { message: '人脸比对失败' }
      };
    }
  }

  /**
   * 获取人脸库详情
   */
  async getFacesetDetail() {
    try {
      const formData = this.createBaseFormData();
      formData.append('faceset_token', this.facesetToken);

      const result = await this.makeRequest('/faceset/getdetail', formData);

      if (result.success) {
        return {
          success: true,
          data: {
            faceCount: result.data.face_count,
            facesetToken: result.data.faceset_token,
            displayName: result.data.display_name,
            createTime: result.data.create_time
          }
        };
      }

      return result;

    } catch (error) {
      console.error('获取人脸库详情错误:', error);
      return {
        success: false,
        error: { message: '获取人脸库信息失败' }
      };
    }
  }

  /**
   * 检查API配置是否有效
   */
  async checkAPIStatus() {
    try {
      // 通过获取人脸库详情来检查API状态
      const result = await this.getFacesetDetail();

      if (result.success || (result.error && result.error.details && result.error.details.error_message === 'FACESET_NOT_FOUND')) {
        return {
          success: true,
          message: 'Face++ API连接正常'
        };
      }

      return {
        success: false,
        message: 'Face++ API连接失败: ' + (result.error?.message || '未知错误')
      };

    } catch (error) {
      return {
        success: false,
        message: 'Face++ API配置错误: ' + error.message
      };
    }
  }
}

// 创建单例实例
const facePlusPlusService = new FacePlusPlusService();

module.exports = facePlusPlusService;


