// The ONE place that decides what is weak and what is strong. Pure functions, no network, easy to test.
//
// The rule (percent of marks):
//   - A topic (model) is judged by the AVERAGE of all of one student's attempts on it:
//       percentage = sum(score) / sum(max_score) * 100
//   - weak   : below WEAK_BELOW            (under 50%)
//   - strong : STRONG_AT_LEAST or higher   (75% and up)
//   - ok     : everything in between       (50% to just under 75%)
//   - A student "needs attention" when their OVERALL average is below WEAK_BELOW.
//   - A class topic is judged the same way, using all the class's attempts on that model added together.

export const WEAK_BELOW = 50
export const STRONG_AT_LEAST = 75

export type Level = 'weak' | 'ok' | 'strong'
export type StudentStatus = 'none' | 'attention' | 'ok' | 'strong'

export interface Attempt {
  studentId: string
  modelId: string
  score: number
  maxScore: number
  takenAt: string | null
}

export interface TopicSummary {
  modelId: string
  attempts: number
  /** sum(score) / sum(max_score) * 100, unrounded */
  average: number
  level: Level
}

export interface ClassTopicSummary extends TopicSummary {
  /** How many different students have attempted this topic. */
  students: number
}

/** sum(score) / sum(max_score) * 100. Returns null when there is nothing to average. */
export function percentOf(attempts: Pick<Attempt, 'score' | 'maxScore'>[]): number | null {
  let score = 0
  let max = 0
  for (const a of attempts) {
    score += a.score
    max += a.maxScore
  }
  return max > 0 ? (score / max) * 100 : null
}

/** Weak / ok / strong for a percentage. */
export function levelOf(percent: number): Level {
  if (percent < WEAK_BELOW) return 'weak'
  if (percent >= STRONG_AT_LEAST) return 'strong'
  return 'ok'
}

/** Student status from their overall average and how many quizzes they have done. */
export function statusOf(average: number | null, quizzes: number): StudentStatus {
  if (quizzes === 0 || average === null) return 'none'
  if (average < WEAK_BELOW) return 'attention'
  if (average >= STRONG_AT_LEAST) return 'strong'
  return 'ok'
}

/** Per-topic summary (one row per model), weakest first. */
export function summarizeByTopic(attempts: Attempt[]): TopicSummary[] {
  const groups = new Map<string, Attempt[]>()
  for (const a of attempts) {
    const list = groups.get(a.modelId)
    if (list) list.push(a)
    else groups.set(a.modelId, [a])
  }
  const rows: TopicSummary[] = []
  for (const [modelId, list] of groups) {
    const average = percentOf(list)
    if (average === null) continue
    rows.push({ modelId, attempts: list.length, average, level: levelOf(average) })
  }
  return rows.sort((a, b) => a.average - b.average || a.modelId.localeCompare(b.modelId))
}

/** Overall numbers for one student. */
export function overall(attempts: Attempt[]): { quizzes: number; average: number | null; status: StudentStatus } {
  const average = percentOf(attempts)
  return { quizzes: attempts.length, average, status: statusOf(average, attempts.length) }
}

/** Topics where the average is weak, weakest first ("Practice these first"). */
export function weakTopics<T extends TopicSummary>(topics: T[]): T[] {
  return topics.filter((t) => t.level === 'weak').sort((a, b) => a.average - b.average)
}

/** Per-topic summary for a whole class: all attempts added together, plus how many students tried it. */
export function summarizeClassTopics(attempts: Attempt[]): ClassTopicSummary[] {
  const byTopic = summarizeByTopic(attempts)
  return byTopic.map((t) => ({
    ...t,
    students: new Set(attempts.filter((a) => a.modelId === t.modelId).map((a) => a.studentId)).size,
  }))
}

export interface StudentRow {
  studentId: string
  quizzes: number
  average: number | null
  status: StudentStatus
  topics: TopicSummary[]
}

const STATUS_ORDER: Record<StudentStatus, number> = { attention: 0, ok: 1, strong: 2, none: 3 }

/** One row per student (also students with no attempts), weakest first. People with no quizzes go last. */
export function summarizeStudents(studentIds: string[], attempts: Attempt[]): StudentRow[] {
  const byStudent = new Map<string, Attempt[]>()
  for (const a of attempts) {
    const list = byStudent.get(a.studentId)
    if (list) list.push(a)
    else byStudent.set(a.studentId, [a])
  }
  const rows: StudentRow[] = studentIds.map((studentId) => {
    const mine = byStudent.get(studentId) ?? []
    const o = overall(mine)
    return { studentId, quizzes: o.quizzes, average: o.average, status: o.status, topics: summarizeByTopic(mine) }
  })
  return rows.sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      (a.average ?? 101) - (b.average ?? 101) ||
      a.studentId.localeCompare(b.studentId),
  )
}

/** Whole-number text for a percentage, for example "72%". */
export function formatPercent(p: number | null): string {
  return p === null ? '—' : `${Math.round(p)}%`
}

export const LEVEL_LABEL: Record<Level, string> = { weak: 'Weak', ok: 'OK', strong: 'Strong' }
export const STATUS_LABEL: Record<StudentStatus, string> = {
  none: 'No quizzes yet',
  attention: 'Needs attention',
  ok: 'OK',
  strong: 'Strong',
}
