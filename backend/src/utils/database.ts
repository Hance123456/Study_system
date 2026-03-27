import mysql from 'mysql2/promise';
import { config } from '../config';

// 创建数据库连接池
const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 测试数据库连接
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功！');
    connection.release();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
};

// 执行查询
export const query = async <T>(sql: string, params?: any[]): Promise<T> => {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
};

// 执行插入，返回插入的 ID
export const insert = async (sql: string, params?: any[]): Promise<number> => {
  const [result] = await pool.execute(sql, params);
  return (result as any).insertId;
};

// 执行更新/删除，返回影响的行数
export const update = async (sql: string, params?: any[]): Promise<number> => {
  const [result] = await pool.execute(sql, params);
  return (result as any).affectedRows;
};

export default pool;
