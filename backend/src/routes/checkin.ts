import { Router, Request, Response } from 'express';
import { query, insert, update } from '../utils/database';
import { authUser } from '../middlewares/auth';
import { localDateYMD } from '../utils/date';

const router = Router();

function rowDateToYMD(v: unknown): string {
  if (v instanceof Date) return localDateYMD(v);
  if (typeof v === 'string') return v.slice(0, 10);
  return localDateYMD(new Date(String(v)));
}

function addDaysYMD(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d + deltaDays);
  return localDateYMD(dt);
}

function isCheckedInDb(v: unknown): boolean {
  return v === true || Number(v) === 1;
}

// 打卡
router.post('/', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const today = localDateYMD();

    // 检查今日是否已打卡
    const existingStats = await query<any[]>(
      'SELECT * FROM user_daily_stats WHERE user_id = ? AND stat_date = ?',
      [userId, today]
    );

    if (existingStats.length > 0 && isCheckedInDb(existingStats[0].is_checked_in)) {
      return res.status(400).json({ code: 400, message: '今日已打卡' });
    }

    if (existingStats.length === 0) {
      await insert(
        `INSERT INTO user_daily_stats (user_id, stat_date, is_checked_in) VALUES (?, ?, 1)`,
        [userId, today]
      );
    } else {
      await update(
        'UPDATE user_daily_stats SET is_checked_in = 1 WHERE user_id = ? AND stat_date = ?',
        [userId, today]
      );
    }

    // 计算连续打卡天数
    const streakResult = await query<any[]>(`
      SELECT COUNT(*) as streak FROM (
        SELECT stat_date, 
               DATE_SUB(stat_date, INTERVAL ROW_NUMBER() OVER (ORDER BY stat_date DESC) DAY) as grp
        FROM user_daily_stats 
        WHERE user_id = ? AND is_checked_in = 1 AND stat_date <= ?
        ORDER BY stat_date DESC
      ) t 
      WHERE grp = (
        SELECT DATE_SUB(stat_date, INTERVAL ROW_NUMBER() OVER (ORDER BY stat_date DESC) DAY)
        FROM user_daily_stats 
        WHERE user_id = ? AND is_checked_in = 1 AND stat_date = ?
        LIMIT 1
      )
    `, [userId, today, userId, today]);

    // 简单计算连续天数
    const consecutiveResult = await query<any[]>(`
      SELECT stat_date FROM user_daily_stats 
      WHERE user_id = ? AND is_checked_in = 1 
      ORDER BY stat_date DESC 
      LIMIT 30
    `, [userId]);

    let streak = 0;
    const dates = consecutiveResult.map((r) => rowDateToYMD(r.stat_date));

    for (let i = 0; i < dates.length; i++) {
      const expectedStr = addDaysYMD(today, -i);
      if (dates[i] === expectedStr) {
        streak++;
      } else {
        break;
      }
    }

    res.json({
      code: 200,
      message: '打卡成功',
      data: {
        streak,
        date: today,
      },
    });
  } catch (error) {
    console.error('打卡错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取打卡状态
router.get('/status', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const today = localDateYMD();

    const stats = await query<any[]>(
      'SELECT is_checked_in FROM user_daily_stats WHERE user_id = ? AND stat_date = ?',
      [userId, today]
    );

    const isCheckedIn = stats.length > 0 && isCheckedInDb(stats[0].is_checked_in);

    // 计算连续打卡天数
    const consecutiveResult = await query<any[]>(`
      SELECT stat_date FROM user_daily_stats 
      WHERE user_id = ? AND is_checked_in = 1 
      ORDER BY stat_date DESC 
      LIMIT 30
    `, [userId]);

    let streak = 0;
    const dates = consecutiveResult.map((r) => rowDateToYMD(r.stat_date));

    const checkDate = isCheckedIn ? today : addDaysYMD(today, -1);

    for (let i = 0; i < dates.length; i++) {
      const expectedStr = addDaysYMD(checkDate, -i);
      if (dates[i] === expectedStr) {
        streak++;
      } else {
        break;
      }
    }

    res.json({
      code: 200,
      data: {
        isCheckedIn,
        streak,
        today,
      },
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取打卡日历（最近30天）
router.get('/calendar', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const records = await query<any[]>(`
      SELECT stat_date, is_checked_in, study_duration, cards_learned 
      FROM user_daily_stats 
      WHERE user_id = ? AND stat_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY stat_date DESC
    `, [userId]);

    const normalized = records.map((r) => ({
      date: rowDateToYMD(r.stat_date),
      is_checked_in: isCheckedInDb(r.is_checked_in) ? 1 : 0,
      study_duration: Number(r.study_duration || 0),
      cards_learned: Number(r.cards_learned || 0),
    }));

    res.json({ code: 200, data: normalized });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取某日打卡详情（用于日历点击展示）
router.get('/calendar/day', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const date = String(req.query.date || '').trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ code: 400, message: '日期格式应为 YYYY-MM-DD' });
    }

    const rows = await query<any[]>(
      `SELECT stat_date, is_checked_in, study_duration, cards_learned, cards_reviewed, quiz_count, correct_count
       FROM user_daily_stats
       WHERE user_id = ? AND stat_date = ?
       LIMIT 1`,
      [userId, date],
    );

    if (rows.length === 0) {
      return res.json({
        code: 200,
        data: {
          date,
          is_checked_in: 0,
          study_duration: 0,
          cards_learned: 0,
          cards_reviewed: 0,
          quiz_count: 0,
          correct_count: 0,
        },
      });
    }

    const row = rows[0];
    return res.json({
      code: 200,
      data: {
        date: rowDateToYMD(row.stat_date),
        is_checked_in: isCheckedInDb(row.is_checked_in) ? 1 : 0,
        study_duration: Number(row.study_duration || 0),
        cards_learned: Number(row.cards_learned || 0),
        cards_reviewed: Number(row.cards_reviewed || 0),
        quiz_count: Number(row.quiz_count || 0),
        correct_count: Number(row.correct_count || 0),
      },
    });
  } catch (error) {
    return res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

export default router;
