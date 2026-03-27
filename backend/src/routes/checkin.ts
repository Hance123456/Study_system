import { Router, Request, Response } from 'express';
import { query, insert, update } from '../utils/database';
import { authUser } from '../middlewares/auth';

const router = Router();

// 打卡
router.post('/', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const today = new Date().toISOString().split('T')[0];

    // 检查今日是否已打卡
    const existingStats = await query<any[]>(
      'SELECT * FROM user_daily_stats WHERE user_id = ? AND stat_date = ?',
      [userId, today]
    );

    if (existingStats.length > 0 && existingStats[0].is_checked_in === 1) {
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
    const dates = consecutiveResult.map(r => r.stat_date);
    const todayDate = new Date(today);
    
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(todayDate);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedStr = expectedDate.toISOString().split('T')[0];
      
      if (dates[i].toISOString().split('T')[0] === expectedStr) {
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
    const today = new Date().toISOString().split('T')[0];

    const stats = await query<any[]>(
      'SELECT is_checked_in FROM user_daily_stats WHERE user_id = ? AND stat_date = ?',
      [userId, today]
    );

    const isCheckedIn = stats.length > 0 && stats[0].is_checked_in === 1;

    // 计算连续打卡天数
    const consecutiveResult = await query<any[]>(`
      SELECT stat_date FROM user_daily_stats 
      WHERE user_id = ? AND is_checked_in = 1 
      ORDER BY stat_date DESC 
      LIMIT 30
    `, [userId]);

    let streak = 0;
    const dates = consecutiveResult.map(r => {
      const d = new Date(r.stat_date);
      return d.toISOString().split('T')[0];
    });
    
    const checkDate = isCheckedIn ? today : new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const startDate = new Date(checkDate);
    
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(startDate);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedStr = expectedDate.toISOString().split('T')[0];
      
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

    res.json({ code: 200, data: records });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

export default router;
