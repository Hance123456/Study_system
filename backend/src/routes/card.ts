import { Router, Request, Response } from 'express';
import { query, insert, update } from '../utils/database';
import { authAdmin } from '../middlewares/auth';

const router = Router();

interface Card {
  id: number;
  course_id: number;
  title: string;
  content: string;
  summary: string;
  image: string;
  audio_url: string;
  difficulty: number;
  sort_order: number;
  view_count: number;
  status: number;
  created_at: string;
  updated_at: string;
  course_name?: string;
}

// 获取卡片列表
router.get('/list', async (req: Request, res: Response) => {
  try {
    const { course_id, status, difficulty, keyword } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    
    let sql = `
      SELECT c.*, co.name as course_name 
      FROM cards c 
      LEFT JOIN courses co ON c.course_id = co.id 
      WHERE 1=1
    `;
    let countSql = 'SELECT COUNT(*) as total FROM cards c WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];

    if (course_id) {
      sql += ' AND c.course_id = ?';
      countSql += ' AND c.course_id = ?';
      params.push(Number(course_id));
      countParams.push(Number(course_id));
    }

    if (status !== undefined) {
      sql += ' AND c.status = ?';
      countSql += ' AND c.status = ?';
      params.push(Number(status));
      countParams.push(Number(status));
    }

    if (difficulty) {
      sql += ' AND c.difficulty = ?';
      countSql += ' AND c.difficulty = ?';
      params.push(Number(difficulty));
      countParams.push(Number(difficulty));
    }

    if (keyword) {
      sql += ' AND (c.title LIKE ? OR c.content LIKE ? OR c.summary LIKE ?)';
      countSql += ' AND (c.title LIKE ? OR c.content LIKE ? OR c.summary LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    // 获取总数
    const countResult = await query<{ total: number }[]>(countSql, countParams);
    const total = countResult[0].total;

    // 分页 - 直接拼接数字到 SQL 中，避免参数类型问题
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY c.sort_order ASC, c.id DESC LIMIT ${pageSize} OFFSET ${offset}`;

    const cards = await query<Card[]>(sql, params);

    res.json({
      code: 200,
      data: {
        list: cards,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取卡片列表错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取卡片详情
router.get('/detail/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cards = await query<Card[]>(
      `SELECT c.*, co.name as course_name 
       FROM cards c 
       LEFT JOIN courses co ON c.course_id = co.id 
       WHERE c.id = ?`,
      [id]
    );

    if (cards.length === 0) {
      return res.status(404).json({ code: 404, message: '卡片不存在' });
    }

    // 增加浏览次数
    await update('UPDATE cards SET view_count = view_count + 1 WHERE id = ?', [id]);

    res.json({
      code: 200,
      data: cards[0],
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 创建卡片（需要管理员权限）
router.post('/create', authAdmin, async (req: Request, res: Response) => {
  try {
    const { course_id, title, content, summary, image, audio_url, difficulty, sort_order } = req.body;

    if (!course_id || !title || !content) {
      return res.status(400).json({ code: 400, message: '课程、标题和内容不能为空' });
    }

    // 检查课程是否存在
    const courses = await query<{ id: number }[]>('SELECT id FROM courses WHERE id = ? AND status = 1', [course_id]);
    if (courses.length === 0) {
      return res.status(400).json({ code: 400, message: '课程不存在或已禁用' });
    }

    const id = await insert(
      `INSERT INTO cards (course_id, title, content, summary, image, audio_url, difficulty, sort_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [course_id, title, content, summary || null, image || null, audio_url || null, difficulty || 1, sort_order || 0]
    );

    // 更新课程卡片数量
    await update('UPDATE courses SET card_count = card_count + 1 WHERE id = ?', [course_id]);

    res.json({
      code: 200,
      message: '创建成功',
      data: { id },
    });
  } catch (error) {
    console.error('创建卡片错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 更新卡片（需要管理员权限）
router.put('/update/:id', authAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { course_id, title, content, summary, image, audio_url, difficulty, sort_order, status } = req.body;

    // 检查卡片是否存在
    const cards = await query<Card[]>('SELECT * FROM cards WHERE id = ?', [id]);
    if (cards.length === 0) {
      return res.status(404).json({ code: 404, message: '卡片不存在' });
    }

    const oldCard = cards[0];

    // 构建更新语句
    const updates: string[] = [];
    const params: any[] = [];

    if (course_id !== undefined) {
      updates.push('course_id = ?');
      params.push(course_id);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }
    if (summary !== undefined) {
      updates.push('summary = ?');
      params.push(summary);
    }
    if (image !== undefined) {
      updates.push('image = ?');
      params.push(image);
    }
    if (audio_url !== undefined) {
      updates.push('audio_url = ?');
      params.push(audio_url);
    }
    if (difficulty !== undefined) {
      updates.push('difficulty = ?');
      params.push(difficulty);
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
    await update(`UPDATE cards SET ${updates.join(', ')} WHERE id = ?`, params);

    // 如果更改了课程，更新卡片数量
    if (course_id !== undefined && course_id !== oldCard.course_id) {
      await update('UPDATE courses SET card_count = card_count - 1 WHERE id = ?', [oldCard.course_id]);
      await update('UPDATE courses SET card_count = card_count + 1 WHERE id = ?', [course_id]);
    }

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新卡片错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 删除卡片（需要管理员权限）
router.delete('/delete/:id', authAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 检查卡片是否存在
    const cards = await query<Card[]>('SELECT course_id FROM cards WHERE id = ?', [id]);
    if (cards.length === 0) {
      return res.status(404).json({ code: 404, message: '卡片不存在' });
    }

    // 软删除（设置 status = 0）
    await update('UPDATE cards SET status = 0 WHERE id = ?', [id]);

    // 更新课程卡片数量
    await update('UPDATE courses SET card_count = card_count - 1 WHERE id = ?', [cards[0].course_id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除卡片错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

export default router;
