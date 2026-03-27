import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, update } from '../utils/database';
import { config } from '../config';
import { authAdmin } from '../middlewares/auth';

const router = Router();

interface Admin {
  id: number;
  username: string;
  password: string;
  name: string;
  role: string;
  status: number;
}

// 管理员登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }

    // 查询管理员
    const admins = await query<Admin[]>(
      'SELECT * FROM admins WHERE username = ? AND status = 1',
      [username]
    );

    if (admins.length === 0) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    const admin = admins[0];

    // 验证密码（如果密码未加密，直接比较；否则用 bcrypt 比较）
    let isPasswordValid = false;
    if (admin.password.startsWith('$2')) {
      // 密码已加密
      isPasswordValid = await bcrypt.compare(password, admin.password);
    } else {
      // 密码未加密（首次登录）
      isPasswordValid = password === admin.password;
      
      // 首次登录后加密密码
      if (isPasswordValid) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await update('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, admin.id]);
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    // 生成 Token
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role, type: 'admin' },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取当前管理员信息
router.get('/info', authAdmin, async (req: Request, res: Response) => {
  try {
    const admins = await query<Admin[]>(
      'SELECT id, username, name, role, created_at FROM admins WHERE id = ?',
      [req.admin!.id]
    );

    if (admins.length === 0) {
      return res.status(404).json({ code: 404, message: '管理员不存在' });
    }

    res.json({
      code: 200,
      data: admins[0],
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 修改密码
router.put('/password', authAdmin, async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ code: 400, message: '请输入旧密码和新密码' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ code: 400, message: '新密码长度不能少于6位' });
    }

    // 查询当前密码
    const admins = await query<Admin[]>(
      'SELECT password FROM admins WHERE id = ?',
      [req.admin!.id]
    );

    const admin = admins[0];
    const isPasswordValid = await bcrypt.compare(oldPassword, admin.password);

    if (!isPasswordValid) {
      return res.status(400).json({ code: 400, message: '旧密码错误' });
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await update('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, req.admin!.id]);

    res.json({ code: 200, message: '密码修改成功' });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

export default router;
