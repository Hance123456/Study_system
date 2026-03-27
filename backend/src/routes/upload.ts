import { Router, Request, Response } from 'express';
import { uploadImage, uploadAudio, getFileUrl, deleteFile } from '../utils/upload';
import path from 'path';
import { config } from '../config';

const router = Router();

// 上传图片
router.post('/image', uploadImage.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请选择要上传的图片' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = getFileUrl(req.file.path, baseUrl);

    res.json({
      code: 200,
      message: '上传成功',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: fileUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: '上传失败', error });
  }
});

// 批量上传图片
router.post('/images', uploadImage.array('files', 10), (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ code: 400, message: '请选择要上传的图片' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const results = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: getFileUrl(file.path, baseUrl),
    }));

    res.json({
      code: 200,
      message: '上传成功',
      data: results,
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: '上传失败', error });
  }
});

// 上传音频
router.post('/audio', uploadAudio.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请选择要上传的音频' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = getFileUrl(req.file.path, baseUrl);

    res.json({
      code: 200,
      message: '上传成功',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: fileUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: '上传失败', error });
  }
});

// 删除文件
router.delete('/file', (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ code: 400, message: '请提供文件 URL' });
    }

    // 从 URL 中提取相对路径
    const urlPath = new URL(url).pathname;
    const relativePath = urlPath.replace('/uploads/', '');
    const filePath = path.join(config.upload.baseDir, relativePath);

    if (deleteFile(filePath)) {
      res.json({ code: 200, message: '删除成功' });
    } else {
      res.status(404).json({ code: 404, message: '文件不存在' });
    }
  } catch (error) {
    res.status(500).json({ code: 500, message: '删除失败', error });
  }
});

export default router;
