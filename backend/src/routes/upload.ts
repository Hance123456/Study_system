import { Router, Request, Response } from 'express';
import { uploadImage, uploadAudio, getFileUrl, deleteFile } from '../utils/upload';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { config } from '../config';

const router = Router();

// 调用 edge-tts 生成语音文件（优先使用 python，其次 py）
const generateTtsAudio = (text: string, outputPath: string, voice = 'zh-CN-XiaoxiaoNeural', rate = '+0%') => {
  const candidates: Array<{ cmd: string; args: string[] }> = [
    {
      cmd: 'python',
      args: ['-m', 'edge_tts', '--voice', voice, '--rate', rate, '--text', text, '--write-media', outputPath],
    },
    {
      cmd: 'py',
      args: ['-m', 'edge_tts', '--voice', voice, '--rate', rate, '--text', text, '--write-media', outputPath],
    },
  ];

  return new Promise<void>((resolve, reject) => {
    const run = (index: number) => {
      if (index >= candidates.length) {
        reject(new Error('未找到可用的 Python 运行环境，请先安装 Python 和 edge-tts'));
        return;
      }

      const task = candidates[index];
      const child = spawn(task.cmd, task.args, { windowsHide: true });
      let stderr = '';
      let spawnError: Error | null = null;

      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
      });

      child.on('error', (err) => {
        spawnError = err as Error;
      });

      child.on('close', (code) => {
        if (!spawnError && code === 0) {
          resolve();
          return;
        }

        const message = (stderr || spawnError?.message || '').toLowerCase();
        const shouldTryNext =
          message.includes('not found') ||
          message.includes('不是内部或外部命令') ||
          message.includes('no module named edge_tts') ||
          message.includes('module edge_tts');

        if (shouldTryNext) {
          run(index + 1);
        } else {
          reject(new Error(stderr || spawnError?.message || 'TTS 生成失败'));
        }
      });
    };

    run(0);
  });
};

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

// 一键 TTS 生成音频
router.post('/tts', async (req: Request, res: Response) => {
  try {
    const { text, voice, rate } = req.body as { text?: string; voice?: string; rate?: string };
    const content = (text || '').trim();

    if (!content) {
      return res.status(400).json({ code: 400, message: '请输入要转换的文本' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ code: 400, message: '文本过长，请控制在 5000 字以内' });
    }

    const ttsDir = path.join(config.upload.baseDir, 'audio', 'tts');
    if (!fs.existsSync(ttsDir)) {
      fs.mkdirSync(ttsDir, { recursive: true });
    }

    const fileName = `tts_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp3`;
    const outputPath = path.join(ttsDir, fileName);

    await generateTtsAudio(content, outputPath, voice || 'zh-CN-XiaoxiaoNeural', rate || '+0%');

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = getFileUrl(outputPath, baseUrl);

    res.json({
      code: 200,
      message: 'TTS 生成成功',
      data: {
        filename: fileName,
        url: fileUrl,
      },
    });
  } catch (error: any) {
    console.error('TTS 生成失败:', error);
    res.status(500).json({ code: 500, message: error.message || 'TTS 生成失败' });
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
