import { Router, Request, Response } from 'express';
import { query, insert, update } from '../utils/database';
import { authAdmin } from '../middlewares/auth';

const router = Router();

interface Course {
  id: number;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  card_count: number;
  status: number;
  created_at: string;
  updated_at: string;
}

// 获取课程列表（公开接口）
router.get('/list', async (req: Request, res: Response) => {
  try {
    const { status, keyword } = req.query;
    
    let sql = 'SELECT * FROM courses WHERE 1=1';
    const params: any[] = [];

    if (status !== undefined) {
      sql += ' AND status = ?';
      params.push(Number(status));
    }

    if (keyword) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY sort_order ASC, id DESC';

    const courses = await query<Course[]>(sql, params);

    res.json({
      code: 200,
      data: courses,
    });
  } catch (error) {
    console.error('获取课程列表错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取课程详情
router.get('/detail/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const courses = await query<Course[]>(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );

    if (courses.length === 0) {
      return res.status(404).json({ code: 404, message: '课程不存在' });
    }

    res.json({
      code: 200,
      data: courses[0],
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 创建课程（需要管理员权限）
router.post('/create', authAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, icon, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({ code: 400, message: '课程名称不能为空' });
    }

    const id = await insert(
      'INSERT INTO courses (name, description, icon, sort_order) VALUES (?, ?, ?, ?)',
      [name, description || null, icon || null, sort_order || 0]
    );

    res.json({
      code: 200,
      message: '创建成功',
      data: { id },
    });
  } catch (error) {
    console.error('创建课程错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 更新课程（需要管理员权限）
router.put('/update/:id', authAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, icon, sort_order, status } = req.body;

    // 检查课程是否存在
    const courses = await query<Course[]>('SELECT id FROM courses WHERE id = ?', [id]);
    if (courses.length === 0) {
      return res.status(404).json({ code: 404, message: '课程不存在' });
    }

    // 构建更新语句
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      params.push(icon);
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      params.push(sort_order);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ code: 400, message: '没有要更新的内容' });
    }

    params.push(id);
    await update(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新课程错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 删除课程（需要管理员权限）
router.delete('/delete/:id', authAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 检查课程是否存在
    const courses = await query<Course[]>('SELECT id FROM courses WHERE id = ?', [id]);
    if (courses.length === 0) {
      return res.status(404).json({ code: 404, message: '课程不存在' });
    }

    // 软删除（设置 status = 0）
    await update('UPDATE courses SET status = 0 WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除课程错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

export default router;
