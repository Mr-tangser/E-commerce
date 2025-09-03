/**
 * Face++人脸识别服务
 * 提供人脸检测、人脸比对等功能
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class FaceService {
  constructor() {
    // Face++配置 - 请在.env文件中配置您的API Key和Secret
    this.apiKey = process.env.FACEPP_API_KEY || 'your_api_key';
    this.apiSecret = process.env.FACEPP_API_SECRET || 'your_api_secret';
    this.baseURL = 'https://api-cn.faceplusplus.com/facepp/v3';
  }

  /**
   * 检测人脸并获取face_token
   * @param {string} imagePath - 图片文件路径
   * @returns {Promise<Object>} 检测结果
   */
  async detectFace(imagePath) {
    try {
      const formData = new FormData();
      formData.append('api_key', this.apiKey);
      formData.append('api_secret', this.apiSecret);
      formData.append('image_file', fs.createReadStream(imagePath));
      formData.append('return_attributes', 'gender,age,smiling,facequality');

      const response = await axios.post(`${this.baseURL}/detect`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 10000
      });

      const data = response.data;

      if (data.error_message) {
        throw new Error(data.error_message);
      }

      if (!data.faces || data.faces.length === 0) {
        throw new Error('未检测到人脸，请确保照片中有清晰的人脸');
      }

      if (data.faces.length > 1) {
        throw new Error('检测到多张人脸，请确保照片中只有一张人脸');
      }

      const face = data.faces[0];
      
      // 检查人脸质量
      if (face.attributes.facequality.value < 70) {
        throw new Error('人脸图片质量较低，请使用更清晰的照片');
      }

      return {
        success: true,
        data: {
          faceToken: face.face_token,
          faceRectangle: face.face_rectangle,
          attributes: face.attributes
        }
      };

    } catch (error) {
      console.error('人脸检测错误:', error);
      return {
        success: false,
        error: error.message || '人脸检测失败'
      };
    }
  }

  /**
   * 比对两张人脸的相似度
   * @param {string} faceToken1 - 第一张人脸的token
   * @param {string} faceToken2 - 第二张人脸的token
   * @returns {Promise<Object>} 比对结果
   */
  async compareFaces(faceToken1, faceToken2) {
    try {
      const formData = new FormData();
      formData.append('api_key', this.apiKey);
      formData.append('api_secret', this.apiSecret);
      formData.append('face_token1', faceToken1);
      formData.append('face_token2', faceToken2);

      const response = await axios.post(`${this.baseURL}/compare`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 10000
      });

      const data = response.data;

      if (data.error_message) {
        throw new Error(data.error_message);
      }

      return {
        success: true,
        data: {
          confidence: data.confidence,
          thresholds: data.thresholds
        }
      };

    } catch (error) {
      console.error('人脸比对错误:', error);
      return {
        success: false,
        error: error.message || '人脸比对失败'
      };
    }
  }

  /**
   * 验证人脸相似度是否满足登录要求
   * @param {number} confidence - 相似度分数
   * @param {Object} thresholds - 阈值信息
   * @returns {boolean} 是否通过验证
   */
  isFaceMatch(confidence, thresholds) {
    // 使用1e-5阈值（误识率为十万分之一）
    return confidence >= thresholds['1e-5'];
  }

  /**
   * 保存并处理上传的人脸图片
   * @param {Object} file - 上传的文件对象
   * @param {string} userId - 用户ID
   * @returns {Promise<string>} 保存的文件路径
   */
  async saveFaceImage(file, userId) {
    try {
      // 创建用户专用的人脸图片目录
      const faceDir = path.join(__dirname, '../uploads/faces');
      if (!fs.existsSync(faceDir)) {
        fs.mkdirSync(faceDir, { recursive: true });
      }

      // 生成唯一的文件名
      const timestamp = Date.now();
      const fileExt = path.extname(file.originalname);
      const fileName = `${userId}_${timestamp}${fileExt}`;
      const filePath = path.join(faceDir, fileName);

      // 保存文件
      fs.writeFileSync(filePath, file.buffer);

      return `/uploads/faces/${fileName}`;
    } catch (error) {
      console.error('保存人脸图片错误:', error);
      throw new Error('保存人脸图片失败');
    }
  }

  /**
   * 删除人脸图片文件
   * @param {string} imagePath - 图片路径
   */
  async deleteFaceImage(imagePath) {
    try {
      if (imagePath && imagePath.startsWith('/uploads/faces/')) {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    } catch (error) {
      console.error('删除人脸图片错误:', error);
    }
  }

  /**
   * 验证图片格式和大小
   * @param {Object} file - 上传的文件对象
   * @returns {Object} 验证结果
   */
  validateImage(file) {
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: '仅支持JPG、JPEG、PNG格式的图片'
      };
    }

    // 检查文件大小（限制为5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: '图片大小不能超过5MB'
      };
    }

    return {
      valid: true
    };
  }
}

module.exports = new FaceService();
