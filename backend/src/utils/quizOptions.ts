/**
 * 将 quizzes.options 转为字符串数组（兼容：JSON 字符串、已解析的数组、mysql2 直接返回的对象等）
 */
export function parseQuizOptions(raw: unknown): string[] {
  if (raw == null || raw === '') return [];

  if (Array.isArray(raw)) {
    return raw.map((x) => String(x));
  }

  if (Buffer.isBuffer(raw)) {
    return parseQuizOptions(raw.toString('utf8'));
  }

  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return [];
    try {
      const p = JSON.parse(s) as unknown;
      if (Array.isArray(p)) return p.map((x) => String(x));
      if (p && typeof p === 'object') return Object.values(p as Record<string, unknown>).map(String);
    } catch {
      return [s];
    }
    return [];
  }

  if (typeof raw === 'object') {
    const vals = Object.values(raw as Record<string, unknown>);
    if (vals.length) return vals.map((v) => String(v));
  }

  return [];
}
