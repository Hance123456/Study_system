import { Router, Request, Response } from 'express';
import { query, insert, update } from '../utils/database';
import { authUser } from '../middlewares/auth';

const router = Router();

// 艾宾浩斯复习间隔（天数）
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

interface ReviewPlan {
  id: number;
  user_id: number;
  card_id: number;
  plan_date: string;
  review_stage: number;
  is_completed: number;
  completed_at: string;
  card_title?: string;
  course_name?: string;
}

// 获取今日复习计划
router.get('/today', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const today = new Date().toISOString().split('T')[0];

    const plans = await query<ReviewPlan[]>(
      `SELECT rp.*, c.title as card_title, co.name as course_name 
       FROM review_plans rp 
       JOIN cards c ON rp.card_id = c.id 
       JOIN courses co ON c.course_id = co.id 
       WHERE rp.user_id = ? AND rp.plan_date <= ? AND rp.is_completed = 0 
       ORDER BY rp.plan_date ASC, rp.review_stage ASC`,
      [userId, today]
    );

    res.json({ code: 200, data: plans });
  } catch (error) {
    console.error('获取今日复习计划错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取未来复习计划
router.get('/upcoming', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const today = new Date().toISOString().split('T')[0];

    const plans = await query<ReviewPlan[]>(
      `SELECT rp.*, c.title as card_title, co.name as course_name 
       FROM review_plans rp 
       JOIN cards c ON rp.card_id = c.id 
       JOIN courses co ON c.course_id = co.id 
       WHERE rp.user_id = ? AND rp.plan_date > ? AND rp.is_completed = 0 
       ORDER BY rp.plan_date ASC 
       LIMIT 20`,
      [userId, today]
    );

    res.json({ code: 200, data: plans });
  } catch (error) {
    console.error('获取未来复习计划错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 完成复习
router.post('/complete', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { plan_id, is_correct } = req.body;

    if (!plan_id) {
      return res.status(400).json({ code: 400, message: '参数不完整' });
    }

    // 获取复习计划
    const plans = await query<ReviewPlan[]>(
      'SELECT * FROM review_plans WHERE id = ? AND user_id = ?',
      [plan_id, userId]
    );

    if (plans.length === 0) {
      return res.status(404).json({ code: 404, message: '复习计划不存在' });
    }

    const plan = plans[0];

    // 标记完成
    await update(
      'UPDATE review_plans SET is_completed = 1, completed_at = NOW() WHERE id = ?',
      [plan_id]
    );

    // 更新用户进度
    await update(
      `UPDATE user_progress 
       SET review_count = review_count + 1, 
           correct_count = correct_count + ?,
           wrong_count = wrong_count + ?,
           last_study_at = NOW()
       WHERE user_id = ? AND card_id = ?`,
      [is_correct ? 1 : 0, is_correct ? 0 : 1, userId, plan.card_id]
    );

    // 更新每日统计
    const today = new Date().toISOString().split('T')[0];
    await update(
      `UPDATE user_daily_stats 
       SET cards_reviewed = cards_reviewed + 1 
       WHERE user_id = ? AND stat_date = ?`,
      [userId, today]
    );

    // 生成下一次复习计划（如果还没到最后一个阶段）
    const nextStage = plan.review_stage + 1;
    if (nextStage <= REVIEW_INTERVALS.length) {
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS[nextStage - 1]);

      // 检查是否已存在该阶段的计划
      const existingPlan = await query<any[]>(
        'SELECT id FROM review_plans WHERE user_id = ? AND card_id = ? AND review_stage = ?',
        [userId, plan.card_id, nextStage]
      );

      if (existingPlan.length === 0) {
        await insert(
          `INSERT INTO review_plans (user_id, card_id, plan_date, review_stage) 
           VALUES (?, ?, ?, ?)`,
          [userId, plan.card_id, nextReviewDate.toISOString().split('T')[0], nextStage]
        );
      }

      // 更新用户进度中的下次复习时间
      await update(
        'UPDATE user_progress SET next_review_at = ? WHERE user_id = ? AND card_id = ?',
        [nextReviewDate.toISOString(), userId, plan.card_id]
      );
    } else {
      // 已完成所有复习阶段，更新掌握程度为"精通"
      await update(
        'UPDATE user_progress SET mastery_level = 4, next_review_at = NULL WHERE user_id = ? AND card_id = ?',
        [userId, plan.card_id]
      );
    }

    res.json({ 
      code: 200, 
      message: '复习完成',
      data: { nextStage: nextStage <= REVIEW_INTERVALS.length ? nextStage : null }
    });
  } catch (error) {
    console.error('完成复习错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 手动添加卡片到复习计划
router.post('/add', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { card_id } = req.body;

    if (!card_id) {
      return res.status(400).json({ code: 400, message: '参数不完整' });
    }

    // 检查是否已有复习计划
    const existingPlan = await query<any[]>(
      'SELECT id FROM review_plans WHERE user_id = ? AND card_id = ? AND is_completed = 0',
      [userId, card_id]
    );

    if (existingPlan.length > 0) {
      return res.status(400).json({ code: 400, message: '该卡片已在复习计划中' });
    }

    // 创建复习计划（从第一阶段开始）
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS[0]);

    await insert(
      `INSERT INTO review_plans (user_id, card_id, plan_date, review_stage) 
       VALUES (?, ?, ?, 1)`,
      [userId, card_id, nextReviewDate.toISOString().split('T')[0]]
    );

    // 更新或创建用户进度
    const existingProgress = await query<any[]>(
      'SELECT id FROM user_progress WHERE user_id = ? AND card_id = ?',
      [userId, card_id]
    );

    if (existingProgress.length === 0) {
      await insert(
        `INSERT INTO user_progress (user_id, card_id, mastery_level, next_review_at) 
         VALUES (?, ?, 1, ?)`,
        [userId, card_id, nextReviewDate.toISOString()]
      );
    } else {
      await update(
        'UPDATE user_progress SET next_review_at = ? WHERE user_id = ? AND card_id = ?',
        [nextReviewDate.toISOString(), userId, card_id]
      );
    }

    res.json({ code: 200, message: '添加成功' });
  } catch (error) {
    console.error('添加复习计划错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取复习统计
router.get('/stats', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const today = new Date().toISOString().split('T')[0];

    // 今日待复习
    const todayResult = await query<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM review_plans 
       WHERE user_id = ? AND plan_date <= ? AND is_completed = 0`,
      [userId, today]
    );

    // 本周待复习
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekResult = await query<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM review_plans 
       WHERE user_id = ? AND plan_date <= ? AND is_completed = 0`,
      [userId, weekEnd.toISOString().split('T')[0]]
    );

    // 已完成复习总数
    const completedResult = await query<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM review_plans WHERE user_id = ? AND is_completed = 1',
      [userId]
    );

    res.json({
      code: 200,
      data: {
        today: todayResult[0].count,
        thisWeek: weekResult[0].count,
        completed: completedResult[0].count,
      },
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

export default router;
