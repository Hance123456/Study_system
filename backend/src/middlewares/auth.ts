import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: number;
        username: string;
        role: string;
      };
      user?: {
        id: number;
        openid: string;
      };
    }
  }
}

// 验证管理员 Token
export const authAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录或登录已过期' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: number;
      username: string;
      role: string;
      type: string;
    };

    if (decoded.type !== 'admin') {
      return res.status(403).json({ code: 403, message: '无权限访问' });
    }

    req.admin = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, message: 'Token 无效或已过期' });
  }
};

// 验证用户 Token（小程序用户）
export const authUser = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录或登录已过期' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: number;
      openid: string;
      type: string;
    };

    if (decoded.type !== 'user') {
      return res.status(403).json({ code: 403, message: '无权限访问' });
    }

    req.user = {
      id: decoded.id,
      openid: decoded.openid,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, message: 'Token 无效或已过期' });
  }
};
