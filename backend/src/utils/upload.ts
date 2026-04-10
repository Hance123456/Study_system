import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

// 确保目录存在
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 生成唯一文件名
const generateFileName = (originalName: string): string => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}${ext}`;
};

// 图片上传配置
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = req.query.type as string || 'cards';
    const uploadPath = path.join(config.upload.baseDir, 'images', subDir);
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file.originalname));
  },
});

// 音频上传配置
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(config.upload.baseDir, 'audio', 'tts');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file.originalname));
  },
});

// 文件过滤器
const imageFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.upload.allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传 JPG、PNG、GIF、WEBP 格式的图片'));
  }
};

const audioFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.upload.allowedAudioTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传 MP3、WAV 格式的音频'));
  }
};

// 导出上传中间件
export const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: imageFilter,
});

export const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: audioFilter,
});

// 删除文件
export const deleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('删除文件失败:', error);
    return false;
  }
};

// 获取文件的相对 URL 路径（推荐存入数据库，便于迁移环境）
export const getFileRelativeUrl = (filePath: string): string => {
  const relativePath = path.relative(config.upload.baseDir, filePath);
  return `/uploads/${relativePath.replace(/\\/g, '/')}`;
};

// 获取文件的绝对 URL（仅用于返回给前端展示/下载时拼接）
export const getFileUrl = (filePath: string, baseUrl: string): string => {
  return `${baseUrl}${getFileRelativeUrl(filePath)}`;
};
