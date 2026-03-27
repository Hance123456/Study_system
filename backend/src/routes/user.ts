import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { query, insert, update } from '../utils/database';
import { config } from '../config';
import { authUser } from '../middlewares/auth';

const router = Router();

interface User {
  id: number;
  openid: string;
  union_id: string;
  nickname: string;
  avatar: string;
  gender: number;
  phone: string;
  status: number;
  created_at: string;
  last_login_at: string;
}

// 下载微信头像到本地，并返回相对 URL（/uploads/images/avatars/xxx.png）
const saveWeChatAvatar = async (avatarUrl: string, openid: string): Promise<string | null> => {
  try {
    if (!avatarUrl) return null;

    const res = await axios.get<ArrayBuffer>(avatarUrl, { responseType: 'arraybuffer' });

    const avatarDir = path.join(config.upload.baseDir, 'images', 'avatars');
    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true });
    }

    const extMatch = avatarUrl.match(/\.(jpg|jpeg|png|gif|webp)/i);
    const ext = extMatch ? extMatch[0] : '.jpg';
    const fileName = `${openid}_${Date.now()}${ext}`;
    const filePath = path.join(avatarDir, fileName);

    fs.writeFileSync(filePath, Buffer.from(res.data));

    // 静态资源通过 /uploads 映射到 upload.baseDir
    const relativeUrl = `/uploads/images/avatars/${fileName}`;
    return relativeUrl;
  } catch (err) {
    console.error('保存微信头像失败:', err);
    return null;
  }
};

// 微信小程序登录
router.post('/wxlogin', async (req: Request, res: Response) => {
  try {
    const { code, userInfo } = req.body;

    if (!code) {
      return res.status(400).json({ code: 400, message: '缺少 code 参数' });
    }

    // 必须配置好微信小程序的 appId 和 appSecret
    if (!config.wechat.appId || !config.wechat.appSecret) {
      return res.status(500).json({
        code: 500,
        message: '服务器未配置微信小程序 appId / appSecret',
      });
    }

    // 调用微信 jscode2session，获取真实 openid/unionid
    let openid: string;
    let unionid: string | null = null;

    try {
      const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
          appid: config.wechat.appId,
          secret: config.wechat.appSecret,
          js_code: code,
          grant_type: 'authorization_code',
        },
      });

      if (wxRes.data.errcode || !wxRes.data.openid) {
        console.error('微信登录失败:', wxRes.data);
        return res.status(400).json({
          code: 400,
          message: wxRes.data.errmsg || '微信登录失败',
        });
      }

      openid = wxRes.data.openid;
      unionid = wxRes.data.unionid || null;
    } catch (err) {
      console.error('调用微信 jscode2session 接口错误:', err);
      return res.status(500).json({
        code: 500,
        message: '微信登录接口错误',
      });
    }

    // 查询用户是否存在
    let users = await query<User[]>('SELECT * FROM users WHERE openid = ?', [openid]);
    let user: User;
    let isNewUser = false;

    // 先尝试保存头像（如果有）
    const localAvatarUrl = userInfo?.avatarUrl
      ? await saveWeChatAvatar(userInfo.avatarUrl, openid)
      : null;

    if (users.length === 0) {
      // 新用户，创建账号
      isNewUser = true;
      const userId = await insert(
        `INSERT INTO users (openid, union_id, nickname, avatar, gender, last_login_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          openid,
          unionid,
          null,
          null,
          0,
        ]
      );
      
      users = await query<User[]>('SELECT * FROM users WHERE id = ?', [userId]);
      user = users[0];
    } else {
      user = users[0];
      
      // 更新登录时间和用户信息（如果这次获取到了新的头像，就覆盖为本地路径）
      await update(
        `UPDATE users SET last_login_at = NOW(), 
         nickname = COALESCE(?, nickname), 
         avatar = COALESCE(?, avatar) 
         WHERE id = ?`,
        [
          userInfo?.nickName ?? null,
          localAvatarUrl ?? user.avatar ?? null,
          user.id,
        ]
      );

      // 同步最新字段到 user 变量（用于后续返回）
      if (localAvatarUrl) {
        user.avatar = localAvatarUrl;
      }
      if (userInfo?.nickName) {
        user.nickname = userInfo.nickName;
      }
    }

    // 生成 Token
    const token = jwt.sign(
      { id: user.id, openid: user.openid, type: 'user' },
      config.jwt.secret,
      { expiresIn: '30d' }
    );

    res.json({
      code: 200,
      data: {
        token,
        isNewUser,
        user: {
          id: user.id,
          nickname: user.nickname || null,
          avatar: user.avatar || null,
        },
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取当前用户信息
router.get('/info', authUser, async (req: Request, res: Response) => {
  try {
    const users = await query<User[]>(
      `SELECT id, openid, nickname, avatar, gender, created_at, last_login_at 
       FROM users WHERE id = ?`,
      [req.user!.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    res.json({
      code: 200,
      data: users[0],
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 更新用户信息
router.put('/update', authUser, async (req: Request, res: Response) => {
  try {
    const { nickname, avatar, gender } = req.body;
    
    const updates: string[] = [];
    const params: any[] = [];

    if (nickname !== undefined) {
      updates.push('nickname = ?');
      params.push(nickname);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      params.push(avatar);
    }
    if (gender !== undefined) {
      updates.push('gender = ?');
      params.push(gender);
    }

    if (updates.length === 0) {
      return res.status(400).json({ code: 400, message: '没有要更新的内容' });
    }

    params.push(req.user!.id);
    await update(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取用户学习统计
router.get('/stats', authUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // 获取学习统计
    const statsResult = await query<any[]>(`
      SELECT 
        COUNT(DISTINCT card_id) as total_cards,
        SUM(CASE WHEN mastery_level >= 3 THEN 1 ELSE 0 END) as mastered_cards,
        SUM(review_count) as total_reviews
      FROM user_progress WHERE user_id = ?
    `, [userId]);

    // 获取今日学习统计
    const todayResult = await query<any[]>(`
      SELECT 
        COALESCE(study_duration, 0) as today_duration,
        COALESCE(cards_learned, 0) as today_cards,
        COALESCE(cards_reviewed, 0) as today_reviews,
        COALESCE(quiz_count, 0) as today_quizzes,
        COALESCE(correct_count, 0) as today_correct,
        COALESCE(is_checked_in, 0) as is_checked_in
      FROM user_daily_stats 
      WHERE user_id = ? AND stat_date = CURDATE()
    `, [userId]);

    // 获取学习天数
    const studyDaysResult = await query<any[]>(`
      SELECT COUNT(DISTINCT stat_date) as study_days 
      FROM user_daily_stats 
      WHERE user_id = ? AND (study_duration > 0 OR cards_learned > 0)
    `, [userId]);

    // 获取总学习时长
    const totalDurationResult = await query<any[]>(`
      SELECT COALESCE(SUM(study_duration), 0) as total_duration
      FROM user_daily_stats 
      WHERE user_id = ?
    `, [userId]);

    // 获取连续学习天数
    const streakResult = await query<any[]>(`
      SELECT COUNT(*) as streak FROM (
        SELECT stat_date FROM user_daily_stats 
        WHERE user_id = ? AND (study_duration > 0 OR cards_learned > 0)
        AND stat_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ORDER BY stat_date DESC
      ) t
    `, [userId]);

    const stats = statsResult[0] || {};
    const today = todayResult[0] || {};
    const streak = streakResult[0]?.streak || 0;
    const studyDays = studyDaysResult[0]?.study_days || 0;
    const totalDuration = totalDurationResult[0]?.total_duration || 0;

    res.json({
      code: 200,
      data: {
        total_learned: stats.total_cards || 0,
        total_mastered: stats.mastered_cards || 0,
        total_reviews: stats.total_reviews || 0,
        study_days: studyDays,
        total_duration: totalDuration,
        today_cards: today.today_cards || 0,
        today_reviews: today.today_reviews || 0,
        today_quizzes: today.today_quizzes || 0,
        today_correct: today.today_correct || 0,
        today_duration: today.today_duration || 0,
        is_checked_in: today.is_checked_in || 0,
        streak: streak,
      },
    });
  } catch (error) {
    console.error('获取学习统计错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

export default router;
