import { Router, Request, Response } from 'express';
import { query, insert, update } from '../utils/database';
import { authUser } from '../middlewares/auth';
import { localDateYMD } from '../utils/date';

const router = Router();

// 艾宾浩斯复习间隔（天数）
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

function getDifficultyFactor(difficulty: number): number {
  if (difficulty === 1) return 1.1; // 简单题适当拉长间隔
  if (difficulty === 3) return 0.85; // 困难题适当缩短间隔
  return 1.0; // 中等题
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function toMysqlDateTime(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

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
    const today = localDateYMD();

    const plans = await query<ReviewPlan[]>(
      `SELECT rp.*, c.title as card_title, co.name as course_name 
       FROM review_plans rp 
       JOIN cards c ON rp.card_id = c.id 
       JOIN courses co ON c.course_id = co.id 
       WHERE rp.user_id = ? AND rp.plan_date <= ? AND rp.is_completed = 0
         AND c.status = 1
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
    const today = localDateYMD();

    const plans = await query<ReviewPlan[]>(
      `SELECT rp.*, c.title as card_title, co.name as course_name 
       FROM review_plans rp 
       JOIN cards c ON rp.card_id = c.id 
       JOIN courses co ON c.course_id = co.id 
       WHERE rp.user_id = ? AND rp.plan_date > ? AND rp.is_completed = 0
         AND c.status = 1
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

    // 查询卡片难度（用于动态间隔）
    const cards = await query<{ difficulty: number }[]>(
      'SELECT difficulty FROM cards WHERE id = ? LIMIT 1',
      [plan.card_id]
    );
    const difficulty = Number(cards[0]?.difficulty || 2);

    // 计算“该卡片在最近一次错误后的连续正确次数”（用于动态拉长间隔）
    const streakRows = await query<{ streak: number }[]>(
      `SELECT COUNT(*) as streak
       FROM quiz_records r
       WHERE r.user_id = ? AND r.card_id = ? AND r.is_correct = 1
         AND r.id > COALESCE(
           (SELECT MAX(id) FROM quiz_records
            WHERE user_id = ? AND card_id = ? AND is_correct = 0), 0
         )`,
      [userId, plan.card_id, userId, plan.card_id]
    );
    const correctStreak = Number(streakRows[0]?.streak || 0);

    // 更新每日统计
    const today = localDateYMD();
    await update(
      `UPDATE user_daily_stats 
       SET cards_reviewed = cards_reviewed + 1 
       WHERE user_id = ? AND stat_date = ?`,
      [userId, today]
    );

    // 动态阶段推进：答对前进，答错回退
    const stageNow = Number(plan.review_stage || 1);
    const nextStage = is_correct
      ? clamp(stageNow + 1, 1, REVIEW_INTERVALS.length)
      : clamp(stageNow - 1, 1, REVIEW_INTERVALS.length);

    // 固定曲线基础间隔 + 动态修正（表现倍率 * 难度倍率）
    const baseDays = REVIEW_INTERVALS[nextStage - 1];
    const performanceFactor = is_correct
      ? Math.min(1 + 0.2 * correctStreak, 2.0) // 连续答对越多，间隔越长
      : 0.5; // 答错直接缩短
    const difficultyFactor = getDifficultyFactor(difficulty);
    const dynamicDays = clamp(
      Math.round(baseDays * performanceFactor * difficultyFactor),
      1,
      60
    );

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + dynamicDays);

    // 保持每张卡仅有一条“待完成”复习计划，避免旧计划冲突
    await update(
      'UPDATE review_plans SET is_completed = 1, completed_at = NOW() WHERE user_id = ? AND card_id = ? AND is_completed = 0',
      [userId, plan.card_id]
    );

    await insert(
      `INSERT INTO review_plans (user_id, card_id, plan_date, review_stage) 
       VALUES (?, ?, ?, ?)`,
      [userId, plan.card_id, localDateYMD(nextReviewDate), nextStage]
    );

    // 动态更新掌握程度（阶段越高掌握度越高）
    const masteryLevel = nextStage >= REVIEW_INTERVALS.length ? 4 : (nextStage >= 4 ? 3 : 2);
    await update(
      'UPDATE user_progress SET mastery_level = ?, next_review_at = ? WHERE user_id = ? AND card_id = ?',
      [masteryLevel, toMysqlDateTime(nextReviewDate), userId, plan.card_id]
    );

    res.json({ 
      code: 200, 
      message: '复习完成',
      data: {
        nextStage,
        next_interval_days: dynamicDays,
        correct_streak: correctStreak,
        difficulty_factor: difficultyFactor,
      }
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
      [userId, card_id, localDateYMD(nextReviewDate)]
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
        [userId, card_id, toMysqlDateTime(nextReviewDate)]
      );
    } else {
      await update(
        'UPDATE user_progress SET next_review_at = ? WHERE user_id = ? AND card_id = ?',
        [toMysqlDateTime(nextReviewDate), userId, card_id]
      );
    }

    res.json({ code: 200, message: '添加成功' });
  } catch (error) {
    console.error('添加复习计划错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 学习时自动加入“今日复习栏”（plan_date=今天），避免必须手动点“复习”
router.post('/add-today', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { card_id } = req.body;
    if (!card_id) {
      return res.status(400).json({ code: 400, message: '参数不完整' });
    }

    const today = localDateYMD();
    const existing = await query<any[]>(
      'SELECT id FROM review_plans WHERE user_id = ? AND card_id = ? AND is_completed = 0',
      [userId, card_id],
    );
    if (existing.length === 0) {
      await insert(
        `INSERT INTO review_plans (user_id, card_id, plan_date, review_stage) 
         VALUES (?, ?, ?, 1)`,
        [userId, card_id, today],
      );
    }

    // 确保用户进度存在（至少“了解”）
    const progress = await query<any[]>(
      'SELECT mastery_level FROM user_progress WHERE user_id = ? AND card_id = ?',
      [userId, card_id],
    );
    if (progress.length === 0) {
      await insert(
        `INSERT INTO user_progress (user_id, card_id, mastery_level, last_study_at, next_review_at) 
         VALUES (?, ?, 1, NOW(), NOW())`,
        [userId, card_id],
      );
    } else if (Number(progress[0].mastery_level || 0) === 0) {
      await update(
        'UPDATE user_progress SET mastery_level = 1, last_study_at = NOW() WHERE user_id = ? AND card_id = ?',
        [userId, card_id],
      );
    }

    res.json({ code: 200, message: '添加成功' });
  } catch (error) {
    console.error('添加今日复习错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取复习统计
router.get('/stats', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const today = localDateYMD();

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
      [userId, localDateYMD(weekEnd)]
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
