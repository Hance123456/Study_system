import COS from 'cos-nodejs-sdk-v5';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { deleteFile, getFileRelativeUrl } from './upload';

let cosClient: COS | null = null;

/** 四项齐全则走 COS，否则仍用本地 uploads */
export function isCosEnabled(): boolean {
  const c = config.cos;
  return !!(c.secretId && c.secretKey && c.bucket && c.region);
}

function getClient(): COS {
  if (!cosClient) {
    cosClient = new COS({
      SecretId: config.cos.secretId,
      SecretKey: config.cos.secretKey,
    });
  }
  return cosClient;
}

function getPublicBase(): string {
  const c = config.cos;
  if (c.publicBaseUrl) {
    return c.publicBaseUrl.replace(/\/$/, '');
  }
  return `https://${c.bucket}.cos.${c.region}.myqcloud.com`;
}

function putObject(params: COS.PutObjectParams): Promise<void> {
  return new Promise((resolve, reject) => {
    getClient().putObject(params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function deleteObject(params: COS.DeleteObjectParams): Promise<void> {
  return new Promise((resolve, reject) => {
    getClient().deleteObject(params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/** Multer 落到本地磁盘后的文件：可选上传到 COS 并删除本地临时文件 */
export async function publishLocalUpload(localPath: string): Promise<string> {
  if (!isCosEnabled()) {
    return getFileRelativeUrl(localPath);
  }
  const relativeKey = path.relative(config.upload.baseDir, localPath).replace(/\\/g, '/');
  const c = config.cos;
  await putObject({
    Bucket: c.bucket,
    Region: c.region,
    Key: relativeKey,
    Body: fs.createReadStream(localPath),
    /** 否则默认常为私有，浏览器/小程序匿名 GET 会 403 */
    ACL: 'public-read',
  });
  try {
    fs.unlinkSync(localPath);
  } catch {
    /* ignore */
  }
  return `${getPublicBase()}/${relativeKey}`;
}

/** 内存中的文件（如微信头像）直接写入 COS 或本地 */
export async function publishBuffer(
  buffer: Buffer,
  relativeKey: string,
  contentType?: string,
): Promise<string> {
  const key = relativeKey.replace(/^\//, '').replace(/\\/g, '/');
  if (!isCosEnabled()) {
    const fullPath = path.join(config.upload.baseDir, key);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);
    return getFileRelativeUrl(fullPath);
  }
  const c = config.cos;
  await putObject({
    Bucket: c.bucket,
    Region: c.region,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  });
  return `${getPublicBase()}/${key}`;
}

/** 删除 COS 或本地 uploads 中的文件（根据 URL 判断） */
export async function deleteStoredAsset(url: string): Promise<boolean> {
  const urlStr = String(url || '').trim();
  if (!urlStr) return false;
  try {
    if (isCosEnabled() && urlStr.startsWith('http')) {
      const base = getPublicBase();
      if (urlStr.startsWith(base)) {
        const key = decodeURIComponent(urlStr.slice(base.length).replace(/^\//, ''));
        await deleteObject({
          Bucket: config.cos.bucket,
          Region: config.cos.region,
          Key: key,
        });
        return true;
      }
    }
    const urlPath = urlStr.includes('://') ? new URL(urlStr).pathname : urlStr;
    const relativePath = urlPath.replace(/^\/?uploads\//, '');
    const filePath = path.join(config.upload.baseDir, relativePath);
    return deleteFile(filePath);
  } catch (e) {
    console.error('deleteStoredAsset:', e);
    return false;
  }
}
