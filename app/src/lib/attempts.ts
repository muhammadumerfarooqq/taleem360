// Quiz attempts and model titles (real sign-in only). Only the Supabase client with the public anon key and
// the signed-in person's own session. The database decides who may read or write what (row-level security);
// nothing here is trusted for roles.
//
// Quiz marking is still done in the browser: the score saved here comes from the app's own marking.
import type { Attempt } from './insights'
import { supabase } from './supabase'

export type Result<T> = { ok: true; data: T } | { ok: false; message: string }

export interface ModelRow {
  id: string
  title: string
  subject: string | null
  grade: number | null
}

type Row = Record<string, unknown>

const NETWORK = 'We could not reach the server. Check your internet and try again.'
const msg = (e: unknown) => String((e as { message?: string })?.message ?? '').toLowerCase()
const isNetwork = (e: unknown) => {
  const m = msg(e)
  return m.includes('failed to fetch') || m.includes('networkerror') || m.includes('network request failed') || m.includes('load failed')
}

function toInt(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isInteger(n) ? n : null
}

function toAttempt(r: Row): Attempt | null {
  const score = toInt(r.score)
  const maxScore = toInt(r.max_score)
  if (score === null || maxScore === null || maxScore <= 0 || score < 0 || score > maxScore) return null
  return {
    studentId: String(r.student_id ?? ''),
    modelId: String(r.model_id ?? ''),
    score,
    maxScore,
    takenAt: typeof r.taken_at === 'string' ? r.taken_at : null,
  }
}

// ---------- model titles (cached in memory for the session) ----------

let modelCache: Map<string, ModelRow> | null = null
let modelRequest: Promise<Result<Map<string, ModelRow>>> | null = null

/** All models (id, title, subject, grade). Cached after the first success; a failure is not cached. */
export function getModels(): Promise<Result<Map<string, ModelRow>>> {
  if (!supabase) return Promise.resolve({ ok: false, message: 'Models need real sign-in.' })
  if (modelCache) return Promise.resolve({ ok: true, data: modelCache })
  if (modelRequest) return modelRequest
  const client = supabase
  modelRequest = (async (): Promise<Result<Map<string, ModelRow>>> => {
    try {
      const { data, error } = await client.from('models').select('id, title, subject, grade')
      if (error) return { ok: false, message: isNetwork(error) ? NETWORK : 'We could not load the topic names.' }
      const map = new Map<string, ModelRow>()
      for (const r of (data ?? []) as Row[]) {
        const id = String(r.id ?? '')
        if (!id) continue
        map.set(id, {
          id,
          title: typeof r.title === 'string' && r.title.trim() ? r.title : id,
          subject: typeof r.subject === 'string' ? r.subject : null,
          grade: toInt(r.grade),
        })
      }
      modelCache = map
      return { ok: true, data: map }
    } catch (e) {
      return { ok: false, message: isNetwork(e) ? NETWORK : 'We could not load the topic names.' }
    } finally {
      modelRequest = null
    }
  })()
  return modelRequest
}

/** A readable name for a model id. Falls back to the id itself when the models table cannot be read. */
export function modelTitle(models: Map<string, ModelRow> | null, id: string): string {
  return models?.get(id)?.title ?? id
}

// ---------- saving ----------

/** Check the values before they are sent (the database checks them again). */
export function checkAttempt(modelId: string, score: number, maxScore: number): Result<null> {
  if (!modelId.trim()) return { ok: false, message: 'Missing topic.' }
  if (!Number.isInteger(score) || !Number.isInteger(maxScore)) return { ok: false, message: 'The score must be a whole number.' }
  if (maxScore <= 0) return { ok: false, message: 'The maximum score must be more than 0.' }
  if (score < 0 || score > maxScore) return { ok: false, message: 'The score must be between 0 and the maximum.' }
  return { ok: true, data: null }
}

/** Insert one attempt. student_id is not sent: the database fills it in with the signed-in person. */
export async function saveAttempt(modelId: string, score: number, maxScore: number): Promise<Result<null>> {
  if (!supabase) return { ok: false, message: 'Saving needs real sign-in.' }
  const checked = checkAttempt(modelId, score, maxScore)
  if (!checked.ok) return checked
  try {
    const { error } = await supabase.from('attempts').insert({ model_id: modelId, score, max_score: maxScore })
    if (error) return { ok: false, message: isNetwork(error) ? NETWORK : 'Could not save your result.' }
    return { ok: true, data: null }
  } catch (e) {
    return { ok: false, message: isNetwork(e) ? NETWORK : 'Could not save your result.' }
  }
}

// One finished quiz is saved once. The key identifies the finished quiz (it survives a re-render and a refresh
// because it is also kept for this browser tab). A failed save is NOT remembered, so Retry works.
const STORE = 'taleem360.savedAttempts'
const savedKeys = new Set<string>()
const inFlight = new Map<string, Promise<Result<null>>>()

function wasSaved(key: string): boolean {
  if (savedKeys.has(key)) return true
  try {
    const list = JSON.parse(sessionStorage.getItem(STORE) ?? '[]') as string[]
    if (list.includes(key)) {
      savedKeys.add(key)
      return true
    }
  } catch {
    // no storage: the in-memory set still guards against re-renders
  }
  return false
}

function remember(key: string) {
  savedKeys.add(key)
  try {
    const list = JSON.parse(sessionStorage.getItem(STORE) ?? '[]') as string[]
    sessionStorage.setItem(STORE, JSON.stringify([...list, key].slice(-50)))
  } catch {
    // ignore
  }
}

export function saveAttemptOnce(key: string, modelId: string, score: number, maxScore: number): Promise<Result<null>> {
  if (wasSaved(key)) return Promise.resolve({ ok: true, data: null })
  const running = inFlight.get(key)
  if (running) return running
  const p = saveAttempt(modelId, score, maxScore)
    .then((res) => {
      if (res.ok) remember(key)
      return res
    })
    .finally(() => inFlight.delete(key))
  inFlight.set(key, p)
  return p
}

// ---------- reading ----------

async function readAttempts(build: (table: ReturnType<NonNullable<typeof supabase>['from']>) => PromiseLike<{ data: unknown; error: unknown }>): Promise<Result<Attempt[]>> {
  if (!supabase) return { ok: false, message: 'Progress needs real sign-in.' }
  try {
    const { data, error } = await build(supabase.from('attempts'))
    if (error) return { ok: false, message: isNetwork(error) ? NETWORK : 'We could not load the quiz results. Please try again.' }
    const list = ((data ?? []) as Row[]).map(toAttempt).filter((a): a is Attempt => a !== null)
    return { ok: true, data: list }
  } catch (e) {
    return { ok: false, message: isNetwork(e) ? NETWORK : 'We could not load the quiz results. Please try again.' }
  }
}

const COLUMNS = 'student_id, model_id, score, max_score, taken_at'

/** The signed-in student's own attempts, newest first. */
export async function listMyAttempts(studentId: string): Promise<Result<Attempt[]>> {
  const res = await readAttempts((t) => t.select(COLUMNS).eq('student_id', studentId))
  if (res.ok) res.data.sort((a, b) => (b.takenAt ?? '').localeCompare(a.takenAt ?? ''))
  return res
}

/** The attempts of a list of students (a teacher reading their class). */
export async function listAttemptsForStudents(studentIds: string[]): Promise<Result<Attempt[]>> {
  if (!studentIds.length) return { ok: true, data: [] }
  const res = await readAttempts((t) => t.select(COLUMNS).in('student_id', studentIds))
  if (res.ok) res.data.sort((a, b) => (b.takenAt ?? '').localeCompare(a.takenAt ?? ''))
  return res
}
