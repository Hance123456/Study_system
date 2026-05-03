import path from 'path';
import dotenv from 'dotenv';

// 加载 .env 配置
dotenv.config({
  path: path.join(__dirname, '../../.env'),
});

const nodeEnv = process.env.NODE_ENV || 'development';

const defaultUploadBaseDir = path.join(__dirname, '../../uploads');
const uploadBaseDirRaw = process.env.UPLOAD_BASE_DIR || defaultUploadBaseDir;
const uploadBaseDir = path.isAbsolute(uploadBaseDirRaw)
  ? uploadBaseDirRaw
  : path.resolve(__dirname, '../../', uploadBaseDirRaw);

export const config = {
  nodeEnv,
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT || '3000'),
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // 数据库配置 - 重点优化支持微信云数据库
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'study_system_db',
    // 微信云数据库通常需要 SSL
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    timezone: '+08:00',
    connectTimeout: 20000,
  },

  upload: {
    baseDir: uploadBaseDir,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3'],
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'study_system_secret_key_2026',
    expiresIn: '7d',
  },

  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
  },

  /** 可选：配置 COS_SECRET_ID 等四项后，上传/头像/TTS 会写入腾讯云 COS，避免云托管容器磁盘丢失 */
  cos: {
    secretId: process.env.COS_SECRET_ID || '',
    secretKey: process.env.COS_SECRET_KEY || '',
    bucket: process.env.COS_BUCKET || '',
    region: process.env.COS_REGION || '',
    publicBaseUrl: (process.env.COS_PUBLIC_BASE_URL || '').replace(/\/$/, ''),
  },
};

export default config;
