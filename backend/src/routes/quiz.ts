import { Router, Request, Response } from 'express';
import { query, insert, update } from '../utils/database';
import { authUser } from '../middlewares/auth';
import { authAdmin } from '../middlewares/auth';

const router = Router();

interface Quiz {
  id: number;
  card_id: number;
  question: string;
  question_type: number;
  options: string;
  answer: string;
  explanation: string;
  status: number;
}

interface QuizRecord {
  id: number;
  user_id: number;
  quiz_id: number;
  card_id: number;
  user_answer: string;
  is_correct: number;
  time_spent: number;
}

// ================== 用户端 API ==================

// 获取卡片的测验题目
router.get('/card/:cardId', authUser, async (req: Request, res: Response) => {
  try {
    const cardId = Number(req.params.cardId);

    const quizzes = await query<Quiz[]>(
      'SELECT id, card_id, question, question_type, options FROM quizzes WHERE card_id = ? AND status = 1 ORDER BY sort_order ASC',
      [cardId]
    );

    // 解析 options JSON
    const result = quizzes.map(q => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : [],
    }));

    res.json({ code: 200, data: result });
  } catch (error) {
    console.error('获取测验题目错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 提交答案
router.post('/submit', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { quiz_id, user_answer, time_spent } = req.body;

    if (!quiz_id || user_answer === undefined) {
      return res.status(400).json({ code: 400, message: '参数不完整' });
    }

    // 获取题目信息
    const quizzes = await query<Quiz[]>(
      'SELECT * FROM quizzes WHERE id = ?',
      [quiz_id]
    );

    if (quizzes.length === 0) {
      return res.status(404).json({ code: 404, message: '题目不存在' });
    }

    const quiz = quizzes[0];
    const isCorrect = String(user_answer).trim().toLowerCase() === String(quiz.answer).trim().toLowerCase();

    // 记录答题
    await insert(
      `INSERT INTO quiz_records (user_id, quiz_id, card_id, user_answer, is_correct, time_spent) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, quiz_id, quiz.card_id, user_answer, isCorrect ? 1 : 0, time_spent || 0]
    );

    // 更新用户进度
    await update(
      `UPDATE user_progress 
       SET correct_count = correct_count + ?, wrong_count = wrong_count + ? 
       WHERE user_id = ? AND card_id = ?`,
      [isCorrect ? 1 : 0, isCorrect ? 0 : 1, userId, quiz.card_id]
    );

    // 更新每日统计
    const today = new Date().toISOString().split('T')[0];
    const existingStats = await query<any[]>(
      'SELECT id FROM user_daily_stats WHERE user_id = ? AND stat_date = ?',
      [userId, today]
    );

    if (existingStats.length === 0) {
      await insert(
        `INSERT INTO user_daily_stats (user_id, stat_date, quiz_count, correct_count) 
         VALUES (?, ?, 1, ?)`,
        [userId, today, isCorrect ? 1 : 0]
      );
    } else {
      await update(
        `UPDATE user_daily_stats 
         SET quiz_count = quiz_count + 1, correct_count = correct_count + ? 
         WHERE user_id = ? AND stat_date = ?`,
        [isCorrect ? 1 : 0, userId, today]
      );
    }

    res.json({
      code: 200,
      data: {
        is_correct: isCorrect,
        correct_answer: quiz.answer,
        explanation: quiz.explanation,
      },
    });
  } catch (error) {
    console.error('提交答案错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取错题列表
router.get('/wrong', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page = 1, pageSize = 20 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = parseInt(pageSize as string) || 20;

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(DISTINCT qr.quiz_id) as total 
       FROM quiz_records qr 
       WHERE qr.user_id = ? AND qr.is_correct = 0`,
      [userId]
    );

    const offset = (pageNum - 1) * pageSizeNum;
    const records = await query<any[]>(
      `SELECT DISTINCT qr.quiz_id, q.question, q.question_type, q.options, q.answer, q.explanation,
              c.title as card_title, co.name as course_name,
              (SELECT user_answer FROM quiz_records WHERE quiz_id = qr.quiz_id AND user_id = ? ORDER BY created_at DESC LIMIT 1) as last_answer
       FROM quiz_records qr 
       JOIN quizzes q ON qr.quiz_id = q.id 
       JOIN cards c ON q.card_id = c.id 
       JOIN courses co ON c.course_id = co.id 
       WHERE qr.user_id = ? AND qr.is_correct = 0 
       ORDER BY qr.created_at DESC 
       LIMIT ${pageSizeNum} OFFSET ${offset}`,
      [userId, userId]
    );

    // 解析 options JSON
    const result = records.map(r => ({
      ...r,
      options: r.options ? JSON.parse(r.options) : [],
    }));

    res.json({
      code: 200,
      data: {
        list: result,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / pageSizeNum),
        },
      },
    });
  } catch (error) {
    console.error('获取错题列表错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ================== 管理端 API ==================

// 获取题目列表（管理员）
router.get('/list', authAdmin, async (req: Request, res: Response) => {
  try {
    const { card_id, status, page = 1, pageSize = 20 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = parseInt(pageSize as string) || 20;

    let sql = `
      SELECT q.*, c.title as card_title, co.name as course_name 
      FROM quizzes q 
      JOIN cards c ON q.card_id = c.id 
      JOIN courses co ON c.course_id = co.id 
      WHERE 1=1
    `;
    let countSql = 'SELECT COUNT(*) as total FROM quizzes q WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];

    if (card_id) {
      sql += ' AND q.card_id = ?';
      countSql += ' AND q.card_id = ?';
      params.push(Number(card_id));
      countParams.push(Number(card_id));
    }

    if (status !== undefined) {
      sql += ' AND q.status = ?';
      countSql += ' AND q.status = ?';
      params.push(Number(status));
      countParams.push(Number(status));
    }

    const countResult = await query<{ total: number }[]>(countSql, countParams);
    const offset = (pageNum - 1) * pageSizeNum;
    sql += ` ORDER BY q.id DESC LIMIT ${pageSizeNum} OFFSET ${offset}`;

    const quizzes = await query<Quiz[]>(sql, params);

    res.json({
      code: 200,
      data: {
        list: quizzes,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / pageSizeNum),
        },
      },
    });
  } catch (error) {
    console.error('获取题目列表错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 创建题目（管理员）
router.post('/create', authAdmin, async (req: Request, res: Response) => {
  try {
    const { card_id, question, question_type, options, answer, explanation, sort_order } = req.body;

    if (!card_id || !question || !answer) {
      return res.status(400).json({ code: 400, message: '卡片、题目和答案不能为空' });
    }

    const id = await insert(
      `INSERT INTO quizzes (card_id, question, question_type, options, answer, explanation, sort_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [card_id, question, question_type || 1, options ? JSON.stringify(options) : null, answer, explanation || null, sort_order || 0]
    );

    res.json({ code: 200, message: '创建成功', data: { id } });
  } catch (error) {
    console.error('创建题目错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 更新题目（管理员）
router.put('/update/:id', authAdmin, async (req: Request, res: Response) => {
  try {
    const quizId = Number(req.params.id);
    const { card_id, question, question_type, options, answer, explanation, sort_order, status } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (card_id !== undefined) {
      updates.push('card_id = ?');
      params.push(card_id);
    }
    if (question !== undefined) {
      updates.push('question = ?');
      params.push(question);
    }
    if (question_type !== undefined) {
      updates.push('question_type = ?');
      params.push(question_type);
    }
    if (options !== undefined) {
      updates.push('options = ?');
      params.push(JSON.stringify(options));
    }
    if (answer !== undefined) {
      updates.push('answer = ?');
      params.push(answer);
    }
    if (explanation !== undefined) {
      updates.push('explanation = ?');
      params.push(explanation);
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

    params.push(quizId);
    await update(`UPDATE quizzes SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新题目错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 删除题目（管理员）
router.delete('/delete/:id', authAdmin, async (req: Request, res: Response) => {
  try {
    const quizId = Number(req.params.id);
    await update('UPDATE quizzes SET status = 0 WHERE id = ?', [quizId]);
    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

export default router;
