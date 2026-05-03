import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import { testConnection } from './utils/database';

// 路由
import uploadRouter from './routes/upload';
import adminRouter from './routes/admin';
import courseRouter from './routes/course';
import cardRouter from './routes/card';
import userRouter from './routes/user';
import progressRouter from './routes/progress';
import reviewRouter from './routes/review';
import quizRouter from './routes/quiz';
import checkinRouter from './routes/checkin';

const app = express();

// 云托管排查：若此处 host 仍是 localhost，说明 DB_* 未注入到容器进程（检查控制台环境变量是否绑定运行实例并已重新发布）
console.log(
  '[boot] DB target:',
  `${config.database.host}:${config.database.port}`,
  '| process.env.DB_HOST =',
  process.env.DB_HOST ?? '(unset)',
);

// 中间件配置
app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(config.upload.baseDir));

// API 路由
app.use('/api/upload', uploadRouter);
app.use('/api/admin', adminRouter);
app.use('/api/course', courseRouter);
app.use('/api/card', cardRouter);
app.use('/api/user', userRouter);
app.use('/api/progress', progressRouter);
app.use('/api/review', reviewRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/checkin', checkinRouter);

// 根路由
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Welcome to Study System API',
    version: '1.0.0',
    endpoints: {
      admin: '/api/admin',
      course: '/api/course',
      card: '/api/card',
      upload: '/api/upload',
    },
  });
});

// 健康检查
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
  });
});

// 全局错误处理
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    code: 500, 
    message: err.message || '服务器内部错误',
  });
});

// 404 处理
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    code: 404, 
    message: '接口不存在',
  });
});

// 启动服务器
const startServer = async () => {
  // 测试数据库连接
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('数据库连接失败，请检查配置！');
    process.exit(1);
  }

  app.listen(Number(config.port), config.host, () => {
    console.log('========================================');
    console.log(`  Study System API Server`);
    console.log(`  运行环境: ${config.nodeEnv}`);
    console.log(`  监听地址: http://${config.host}:${config.port}`);
    console.log(`  上传目录: ${config.upload.baseDir}`);
    console.log('========================================');
    console.log('API 端点:');
    console.log('  POST   /api/admin/login       - 管理员登录');
    console.log('  GET    /api/course/list       - 课程列表');
    console.log('  GET    /api/card/list         - 卡片列表');
    console.log('  POST   /api/upload/image      - 上传图片');
    console.log('========================================');
  });
};

startServer();
