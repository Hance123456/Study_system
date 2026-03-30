import { Router, Request, Response } from 'express';
import { query, insert, update } from '../utils/database';
import { authUser } from '../middlewares/auth';
import { localDateYMD } from '../utils/date';

const router = Router();

// 艾宾浩斯复习间隔（天数）
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

interface UserProgress {
  id: number;
  user_id: number;
  card_id: number;
  mastery_level: number;
  review_count: number;
  correct_count: number;
  wrong_count: number;
  last_study_at: string;
  next_review_at: string;
}

// 记录学习行为
router.post('/record', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { card_id, course_id, action_type, duration, learning_mode } = req.body;

    if (!card_id || !action_type) {
      return res.status(400).json({ code: 400, message: '参数不完整' });
    }

    const today = localDateYMD();

    // 「今日学习卡片数」= 当日去重后的卡片数，同一卡片多次进入只计 1 次（与首页展示语义一致）
    let bumpDistinctCard = false;
    if (action_type === 'view' || action_type === 'listen') {
      const dup = await query<{ c: number }[]>(
        `SELECT COUNT(*) as c FROM learning_logs 
         WHERE user_id = ? AND card_id = ? AND log_date = ? 
           AND action_type IN ('view','listen')`,
        [userId, card_id, today]
      );
      bumpDistinctCard = (dup[0]?.c || 0) === 0;
    }

    await insert(
      `INSERT INTO learning_logs (user_id, card_id, course_id, action_type, duration, learning_mode, log_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, card_id, course_id || null, action_type, duration || 0, learning_mode || 'static', today]
    );

    const existingStats = await query<any[]>(
      'SELECT id FROM user_daily_stats WHERE user_id = ? AND stat_date = ?',
      [userId, today]
    );

    if (existingStats.length === 0) {
      await insert(
        `INSERT INTO user_daily_stats (user_id, stat_date, study_duration, cards_learned) 
         VALUES (?, ?, ?, ?)`,
        [userId, today, duration || 0, bumpDistinctCard ? 1 : 0]
      );
    } else {
      await update(
        `UPDATE user_daily_stats 
         SET study_duration = study_duration + ?, 
             cards_learned = cards_learned + ? 
         WHERE user_id = ? AND stat_date = ?`,
        [duration || 0, bumpDistinctCard ? 1 : 0, userId, today]
      );
    }

    // 更新用户学习进度
    if (action_type === 'view' || action_type === 'listen') {
      const existingProgress = await query<UserProgress[]>(
        'SELECT * FROM user_progress WHERE user_id = ? AND card_id = ?',
        [userId, card_id]
      );

      if (existingProgress.length === 0) {
        // 首次学习，创建进度记录并生成复习计划
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS[0]);

        await insert(
          `INSERT INTO user_progress (user_id, card_id, mastery_level, last_study_at, next_review_at) 
           VALUES (?, ?, 1, NOW(), ?)`,
          [userId, card_id, nextReviewDate.toISOString()]
        );

        // 生成第一次复习计划
        await insert(
          `INSERT INTO review_plans (user_id, card_id, plan_date, review_stage) 
           VALUES (?, ?, ?, 1)`,
          [userId, card_id, nextReviewDate.toISOString().split('T')[0]]
        );
      } else {
        // 更新学习时间
        await update(
          'UPDATE user_progress SET last_study_at = NOW() WHERE user_id = ? AND card_id = ?',
          [userId, card_id]
        );
      }
    }

    res.json({ code: 200, message: '记录成功' });
  } catch (error) {
    console.error('记录学习行为错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 更新掌握程度
router.post('/mastery', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { card_id, mastery_level } = req.body;

    if (!card_id || mastery_level === undefined) {
      return res.status(400).json({ code: 400, message: '参数不完整' });
    }

    const existingProgress = await query<UserProgress[]>(
      'SELECT * FROM user_progress WHERE user_id = ? AND card_id = ?',
      [userId, card_id]
    );

    if (existingProgress.length === 0) {
      await insert(
        `INSERT INTO user_progress (user_id, card_id, mastery_level, last_study_at) 
         VALUES (?, ?, ?, NOW())`,
        [userId, card_id, mastery_level]
      );
    } else {
      await update(
        'UPDATE user_progress SET mastery_level = ? WHERE user_id = ? AND card_id = ?',
        [mastery_level, userId, card_id]
      );
    }

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新掌握程度错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取用户某课程的学习进度
router.get('/course/:courseId', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const courseId = Number(req.params.courseId);

    // 获取课程卡片总数
    const totalResult = await query<{ total: number }[]>(
      'SELECT COUNT(*) as total FROM cards WHERE course_id = ? AND status = 1',
      [courseId]
    );

    // 获取用户已学习的卡片数
    const learnedResult = await query<{ learned: number }[]>(
      `SELECT COUNT(*) as learned FROM user_progress up 
       JOIN cards c ON up.card_id = c.id 
       WHERE up.user_id = ? AND c.course_id = ? AND c.status = 1`,
      [userId, courseId]
    );

    // 获取已掌握的卡片数
    const masteredResult = await query<{ mastered: number }[]>(
      `SELECT COUNT(*) as mastered FROM user_progress up 
       JOIN cards c ON up.card_id = c.id 
       WHERE up.user_id = ? AND c.course_id = ? AND up.mastery_level >= 3 AND c.status = 1`,
      [userId, courseId]
    );

    res.json({
      code: 200,
      data: {
        total: totalResult[0].total,
        learned: learnedResult[0].learned,
        mastered: masteredResult[0].mastered,
        progress: totalResult[0].total > 0 
          ? Math.round((learnedResult[0].learned / totalResult[0].total) * 100) 
          : 0,
      },
    });
  } catch (error) {
    console.error('获取学习进度错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取用户某卡片的学习状态
router.get('/card/:cardId', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const cardId = Number(req.params.cardId);

    const progress = await query<UserProgress[]>(
      'SELECT * FROM user_progress WHERE user_id = ? AND card_id = ?',
      [userId, cardId]
    );

    if (progress.length === 0) {
      return res.json({
        code: 200,
        data: {
          mastery_level: 0,
          review_count: 0,
          last_study_at: null,
          next_review_at: null,
        },
      });
    }

    res.json({ code: 200, data: progress[0] });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

export default router;
