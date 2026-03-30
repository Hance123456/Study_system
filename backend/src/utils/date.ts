/**
 * 业务“今天”的日历日期 YYYY-MM-DD（与 Node 进程所在机器本地时区一致）。
 * 打卡、日报统计等应统一用此值查库，避免与 MySQL CURDATE() 时区不一致。
 */
export function localDateYMD(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
