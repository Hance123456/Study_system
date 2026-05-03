import mysql from 'mysql2/promise';
import { config } from '../config';

/** 云库/网关常会空闲掐断 TCP，池里连接变「僵尸」，首次 execute 报 ECONNRESET；重试一次通常换新连接成功 */
function isTransientDbError(err: unknown): boolean {
  const e = err as NodeJS.ErrnoException & { code?: string };
  const code = e?.code;
  return (
    code === 'ECONNRESET' ||
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT' ||
    code === 'PROTOCOL_CONNECTION_LOST' ||
    e?.errno === -104
  );
}

async function executeWithRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (first) {
    if (!isTransientDbError(first)) throw first;
    await new Promise((r) => setTimeout(r, 150));
    return await run();
  }
}

// 创建数据库连接池（云数据库 SSL / 超时等与 config 对齐）
const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  ssl: config.database.ssl,
  connectTimeout: config.database.connectTimeout,
  timezone: config.database.timezone,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
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
  const [rows] = await executeWithRetry(() => pool.execute(sql, params));
  return rows as T;
};

// 执行插入，返回插入的 ID
export const insert = async (sql: string, params?: any[]): Promise<number> => {
  const [result] = await executeWithRetry(() => pool.execute(sql, params));
  return (result as any).insertId;
};

// 执行更新/删除，返回影响的行数
export const update = async (sql: string, params?: any[]): Promise<number> => {
  const [result] = await executeWithRetry(() => pool.execute(sql, params));
  return (result as any).affectedRows;
};

export default pool;
