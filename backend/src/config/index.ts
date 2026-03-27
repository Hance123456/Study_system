import path from 'path';
import dotenv from 'dotenv';

// 明确指定 .env 路径为 backend 目录下的 .env，
// 避免从项目根目录启动时加载不到正确的配置
dotenv.config({
  path: path.join(__dirname, '../../.env'),
});

export const config = {
  // 服务器配置
  port: process.env.PORT || 3000,
  
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'study_system_db',
  },

  // 文件上传配置
  upload: {
    baseDir: path.join(__dirname, '../../uploads'),
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3'],
  },

  // JWT 配置（后续用于认证）
  jwt: {
    secret: process.env.JWT_SECRET || 'study_system_secret_key',
    expiresIn: '7d',
  },

  // 微信小程序配置
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
  },
};
