import { parseQuizOptions } from './quizOptions';

function normalizeOptionsArg(optionsInput: unknown): string[] {
  if (Array.isArray(optionsInput)) {
    return (optionsInput as unknown[]).map((x) => String(x));
  }
  return parseQuizOptions(optionsInput);
}

/**
 * 判分用：与 GET /quiz/card 一致，判断题库中无选项时视为「对 / 错」两项。
 */
export function getEffectiveOptionsForGrading(
  questionType: number,
  optionsColumn: unknown,
): string[] {
  const opts = normalizeOptionsArg(optionsColumn);
  if (Number(questionType) === 3 && opts.length === 0) {
    return ['对', '错'];
  }
  return opts;
}

/**
 * 判断题：常见同义说法规范为「对」或「错」；无法识别则返回 null（再走字面量比较）
 */
export function canonicalizeJudgmentAnswer(s: string): '对' | '错' | null {
  const t = String(s || '').trim().toLowerCase();
  if (!t) return null;
  if (
    t === '对' ||
    t === '正确' ||
    t === '是' ||
    t === 'yes' ||
    t === 'true' ||
    t === 't' ||
    t === 'y' ||
    t === '1'
  ) {
    return '对';
  }
  if (
    t === '错' ||
    t === '错误' ||
    t === '否' ||
    t === 'no' ||
    t === 'false' ||
    t === 'f' ||
    t === 'n' ||
    t === '0'
  ) {
    return '错';
  }
  return null;
}

/** 填空题：去首尾空白、英文小写、连续空白压成单空格，再比较 */
export function normalizeFillBlankAnswer(s: string): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * 正确答案在库中可能是选项字母（如 B）或完整选项文案；返回用于判分与展示的文案。
 * optionsInput 可为 quizzes.options 原始值，或已解析的字符串数组（如判断题 ['对','错']）。
 */
export function resolveQuizExpectedAnswer(
  answerRaw: string,
  optionsInput: unknown,
): { expected: string; display: string } {
  const trimmed = String(answerRaw || '').trim();
  const opts = normalizeOptionsArg(optionsInput);
  if (/^[A-Za-z]$/.test(trimmed) && opts.length > 0) {
    const idx = trimmed.toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < opts.length && opts[idx]) {
      const text = String(opts[idx]).trim();
      return { expected: text, display: text };
    }
  }
  return { expected: trimmed, display: trimmed };
}

/**
 * 按题型比较用户答案与库中答案（单选：用户提交的是选项全文，与解析后的 expected 比；判断 / 填空见规范化逻辑）。
 */
export function gradeQuizSubmission(
  userAnswerRaw: string,
  quiz: { answer: string; options: unknown; question_type: number },
): { isCorrect: boolean; display: string } {
  const qType = Number(quiz.question_type);
  const effOpts = getEffectiveOptionsForGrading(qType, quiz.options);
  let { expected, display } = resolveQuizExpectedAnswer(quiz.answer, effOpts);

  const userTrim = String(userAnswerRaw).trim();

  if (qType === 3) {
    const u = canonicalizeJudgmentAnswer(userTrim);
    const e = canonicalizeJudgmentAnswer(expected);
    if (u !== null && e !== null) {
      return { isCorrect: u === e, display: e };
    }
    const ok = userTrim.toLowerCase() === expected.toLowerCase();
    return { isCorrect: ok, display };
  }

  if (qType === 4) {
    const nu = normalizeFillBlankAnswer(userTrim);
    const ne = normalizeFillBlankAnswer(expected);
    return { isCorrect: nu === ne, display };
  }

  // 单选、多选（按单选项提交）：与选项全文比较，忽略英文大小写
  const ok =
    userTrim.toLowerCase() === String(expected).trim().toLowerCase();
  return { isCorrect: ok, display };
}
