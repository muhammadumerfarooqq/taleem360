// Classes and join codes (real sign-in only). Everything goes through the Supabase client with the
// signed-in person's own session and the public anon key. The database decides who may do what
// (row-level security and the create_class / join_class functions); nothing here is trusted for roles.
//
// The exact column names and what the two functions return are read defensively: if a value is missing the
// screens show a plain placeholder instead of failing.
import { checkRoll, isClassLoginEmail } from './studentAuth'
import { supabase } from './supabase'

export interface ClassInfo {
  id: string
  name: string
  grade: number | null
  joinCode: string
  createdAt: string | null
}

export interface TeacherClass extends ClassInfo {
  /** Number of enrolled students, or null if the database did not let us count them. */
  studentCount: number | null
}

export interface ClassStudent {
  studentId: string
  /** null when the database does not let a teacher read the student's profile. */
  name: string | null
  /** null for a class login (never a hidden login address) and when the profile cannot be read. */
  email: string | null
  /** True for a student who signs in with class code, roll number and PIN (they have no real email). */
  classLogin: boolean
  /** The roll number in this class, or null for students who joined before roll numbers existed. */
  rollNo: string | null
  joinedAt: string | null
}

export interface MyClass {
  classId: string
  name: string | null
  grade: number | null
  /** null when the database does not let a student read the teacher's profile. */
  teacherName: string | null
  joinedAt: string | null
}

export type Result<T> = { ok: true; data: T } | { ok: false; message: string }

export const NAME_MAX = 60
export const CODE_LENGTH = 6
export const GRADES = [6, 7, 8, 9, 10] as const

type Row = Record<string, unknown>

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null)
const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : null
}

function toClass(r: Row): ClassInfo {
  return {
    id: String(r.id ?? ''),
    name: str(r.name) ?? 'Class',
    grade: num(r.grade) ?? num(r.class_level),
    joinCode: str(r.join_code) ?? '',
    createdAt: str(r.created_at),
  } as ClassInfo
}

// An RPC may answer with a row, a list with one row, or just an id. Normalise to a row (or an id string).
function unwrap(data: unknown): Row | string | null {
  const v = Array.isArray(data) ? data[0] : data
  if (v === null || v === undefined) return null
  if (typeof v === 'string') return v
  if (typeof v === 'object') return v as Row
  return null
}

const message = (e: unknown): string => String((e as { message?: string })?.message ?? '').toLowerCase()
const code = (e: unknown): string => String((e as { code?: string })?.code ?? '')

function isNetwork(e: unknown): boolean {
  const m = message(e)
  return m.includes('failed to fetch') || m.includes('networkerror') || m.includes('network request failed') || m.includes('load failed')
}

const NETWORK = 'We could not reach the server. Check your internet and try again.'

// Plain-language text for a failed teacher action. The raw error is never shown.
function teacherError(e: unknown, fallback: string): string {
  if (isNetwork(e)) return NETWORK
  const m = message(e)
  if (code(e) === '42501' || m.includes('permission') || m.includes('not allowed') || m.includes('only teacher') || m.includes('row-level security')) {
    return 'Only teachers can do this. Please sign in with a teacher account.'
  }
  return fallback
}

/** Clean and check a class name and grade. Returns the cleaned values, or a message to show. */
export function checkNewClass(name: string, grade: number): Result<{ name: string; grade: number }> {
  const clean = name.replace(/\s+/g, ' ').trim()
  if (!clean) return { ok: false, message: 'Please enter a class name.' }
  if (clean.length > NAME_MAX) return { ok: false, message: `Keep the class name under ${NAME_MAX} characters.` }
  if (!Number.isInteger(grade) || grade < 6 || grade > 10) return { ok: false, message: 'Choose a grade from 6 to 10.' }
  return { ok: true, data: { name: clean, grade } }
}

/** Keep only letters and digits, upper case, at most 6 characters (what a join code looks like). */
export function cleanCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH)
}

// ---------- teacher ----------

export async function createClass(name: string, grade: number): Promise<Result<ClassInfo>> {
  if (!supabase) return { ok: false, message: 'Classes need real sign-in.' }
  const checked = checkNewClass(name, grade)
  if (!checked.ok) return checked
  try {
    const { data, error } = await supabase.rpc('create_class', { p_name: checked.data.name, p_grade: checked.data.grade })
    if (error) return { ok: false, message: teacherError(error, 'We could not create the class. Please try again.') }
    const row = unwrap(data)
    if (!row || typeof row === 'string') return { ok: false, message: 'We could not create the class. Please try again.' }
    const made = toClass(row)
    if (!made.joinCode) return { ok: false, message: 'The class was made, but its code could not be read. Open "Your classes" to see it.' }
    return { ok: true, data: made }
  } catch (e) {
    return { ok: false, message: teacherError(e, 'We could not create the class. Please try again.') }
  }
}

/** The signed-in teacher's own classes, newest first, with a student count when it can be read. */
export async function listMyClasses(teacherId: string): Promise<Result<TeacherClass[]>> {
  if (!supabase) return { ok: false, message: 'Classes need real sign-in.' }
  try {
    const { data, error } = await supabase.from('classes').select('*')
    if (error) return { ok: false, message: teacherError(error, 'We could not load your classes. Please try again.') }
    // The database only returns what this person may see; keep only their own classes as well.
    const rows = ((data ?? []) as Row[]).filter((r) => r.teacher_id === undefined || r.teacher_id === teacherId)
    const classes = rows.map(toClass)
    const counts = new Map<string, number>()
    let countsOk = true
    if (classes.length) {
      const { data: enr, error: enrError } = await supabase
        .from('enrollments')
        .select('class_id')
        .in('class_id', classes.map((c) => c.id))
      if (enrError) countsOk = false
      else for (const e of (enr ?? []) as Row[]) counts.set(String(e.class_id), (counts.get(String(e.class_id)) ?? 0) + 1)
    }
    const list: TeacherClass[] = classes.map((c) => ({ ...c, studentCount: countsOk ? (counts.get(c.id) ?? 0) : null }))
    list.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    return { ok: true, data: list }
  } catch (e) {
    return { ok: false, message: teacherError(e, 'We could not load your classes. Please try again.') }
  }
}

/** Roll order: numbers first (1, 2, 10), then rolls with letters (10A, A1), then students with no roll. */
export function compareByRoll(
  a: { rollNo: string | null; joinedAt: string | null },
  b: { rollNo: string | null; joinedAt: string | null },
): number {
  const rank = (r: string | null) => (r === null ? 2 : /^[0-9]+$/.test(r) ? 0 : 1)
  const ra = rank(a.rollNo)
  const rb = rank(b.rollNo)
  if (ra !== rb) return ra - rb
  if (ra === 0) return Number(a.rollNo) - Number(b.rollNo)
  if (ra === 1) return (a.rollNo as string).localeCompare(b.rollNo as string, undefined, { numeric: true })
  return (a.joinedAt ?? '').localeCompare(b.joinedAt ?? '')
}

export interface ClassDetail {
  info: ClassInfo
  students: ClassStudent[]
  /** false when the database would not let us read the student list at all. */
  studentsReadable: boolean
}

/** One class and the students enrolled in it (read only). */
export async function getClassDetail(classId: string, teacherId: string): Promise<Result<ClassDetail>> {
  if (!supabase) return { ok: false, message: 'Classes need real sign-in.' }
  try {
    const { data: cls, error } = await supabase.from('classes').select('*').eq('id', classId).maybeSingle()
    if (error) return { ok: false, message: teacherError(error, 'We could not load this class. Please try again.') }
    const row = cls as Row | null
    if (!row || (row.teacher_id !== undefined && row.teacher_id !== teacherId)) {
      return { ok: false, message: 'We could not find this class.' }
    }
    const info = toClass(row)

    const { data: enr, error: enrError } = await supabase.from('enrollments').select('*').eq('class_id', classId)
    if (enrError) return { ok: true, data: { info, students: [], studentsReadable: false } }
    const enrolled = (enr ?? []) as Row[]

    // Names and emails come from the profiles table, which may only show a person their own row.
    const names = new Map<string, { name: string | null; email: string | null; classLogin: boolean }>()
    const ids = enrolled.map((e) => String(e.student_id ?? e.user_id ?? '')).filter(Boolean)
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id, display_name, email').in('id', ids)
      for (const p of (profs ?? []) as Row[]) {
        const email = str(p.email)
        const classLogin = isClassLoginEmail(email)
        names.set(String(p.id), { name: str(p.display_name), email: classLogin ? null : email, classLogin })
      }
    }
    const students: ClassStudent[] = enrolled.map((e) => {
      const id = String(e.student_id ?? e.user_id ?? '')
      const p = names.get(id)
      return {
        studentId: id,
        name: p?.name ?? null,
        email: p?.email ?? null,
        classLogin: p?.classLogin ?? false,
        rollNo: str(e.roll_no),
        joinedAt: str(e.joined_at) ?? str(e.created_at),
      }
    })
    students.sort(compareByRoll)
    return { ok: true, data: { info, students, studentsReadable: true } }
  } catch (e) {
    return { ok: false, message: teacherError(e, 'We could not load this class. Please try again.') }
  }
}

// ---------- student ----------

export type JoinFailKind =
  | 'wrong_code'
  | 'roll_taken'
  | 'invalid_roll'
  | 'locked'
  | 'already'
  | 'role'
  | 'network'
  | 'missing'
  | 'other'

export type JoinResult =
  | { ok: true; joined: { classId: string | null; name?: string | null; grade?: number | null } }
  | { ok: false; message: string; kind: JoinFailKind }

const JOIN_MESSAGES: Record<JoinFailKind, string> = {
  wrong_code: 'That class code was not found. Check it and try again.',
  roll_taken: 'That roll number is already used in this class. Ask your teacher.',
  invalid_roll: 'A roll number can only use letters, numbers, a dash (-) and a slash (/).',
  locked: 'Too many wrong tries. Please wait a while and try again later.',
  already: 'You are already in this class.',
  role: 'Only students can join a class. Please sign in with a student account.',
  network: NETWORK,
  missing: 'Joining with a roll number is not ready yet. Please try again later.',
  other: 'We could not join the class. Please try again.',
}

const joinFail = (kind: JoinFailKind): JoinResult => ({ ok: false, message: JOIN_MESSAGES[kind], kind })

function joinErrorKind(error: unknown): JoinFailKind {
  if (isNetwork(error)) return 'network'
  const m = message(error)
  if (m.includes('roll_taken')) return 'roll_taken'
  if (m.includes('invalid_roll')) return 'invalid_roll'
  if (m.includes('roll_already_set')) return 'other'
  if (m.includes('only_students') || code(error) === '42501' || m.includes('permission') || m.includes('only student') || m.includes('row-level security')) return 'role'
  if (m.includes('already')) return 'already'
  if (m.includes('too many') || m.includes('attempt') || m.includes('rate limit') || m.includes('try again later') || m.includes('locked') || m.includes('blocked')) return 'locked'
  // the function does not exist yet (the migration has not been run)
  if (code(error) === 'PGRST202' || m.includes('could not find the function') || m.includes('does not exist')) return 'missing'
  return 'other'
}

async function runJoin(fn: 'join_class' | 'join_class_with_roll', args: Record<string, string>): Promise<JoinResult> {
  if (!supabase) return { ok: false, message: 'Joining a class needs real sign-in.', kind: 'other' }
  try {
    const { data, error } = await supabase.rpc(fn, args)
    if (error) {
      // never log or show the raw error: it can contain what the person typed
      return joinFail(joinErrorKind(error))
    }
    const row = unwrap(data)
    if (!row) return joinFail('wrong_code')
    if (typeof row === 'string') return { ok: true, joined: { classId: row } }
    const info = toClass(row)
    return { ok: true, joined: { classId: info.id || str(row.class_id), name: str(row.name), grade: info.grade } }
  } catch (e) {
    return joinFail(isNetwork(e) ? 'network' : 'other')
  }
}

/** Join a class with its 6-character code only (no roll number). Kept for older accounts. */
export async function joinClass(rawCode: string): Promise<JoinResult> {
  const codeText = cleanCode(rawCode)
  if (codeText.length !== CODE_LENGTH) return { ok: false, message: `A class code has ${CODE_LENGTH} letters or numbers.`, kind: 'wrong_code' }
  return runJoin('join_class', { p_code: codeText })
}

/**
 * Join a class with its code AND a roll number (the database function join_class_with_roll).
 * The roll is cleaned here with the same rules as the database. The database checks the code, limits wrong
 * tries and refuses a roll that is already used in that class.
 */
export async function joinClassWithRoll(rawCode: string, rawRoll: string): Promise<JoinResult> {
  const codeText = cleanCode(rawCode)
  if (codeText.length !== CODE_LENGTH) return { ok: false, message: `A class code has ${CODE_LENGTH} letters or numbers.`, kind: 'wrong_code' }
  const roll = checkRoll(rawRoll)
  if (!roll.ok) return { ok: false, message: roll.message, kind: 'invalid_roll' }
  return runJoin('join_class_with_roll', { p_code: codeText, p_roll: roll.value })
}

/** The classes this student is in (empty list = independent learner). */
export async function listMyEnrollments(studentId: string): Promise<Result<MyClass[]>> {
  if (!supabase) return { ok: false, message: 'Classes need real sign-in.' }
  try {
    const { data, error } = await supabase.from('enrollments').select('*').eq('student_id', studentId)
    if (error) return { ok: false, message: isNetwork(error) ? NETWORK : 'We could not load your classes. Please try again.' }
    const enrolled = (data ?? []) as Row[]
    if (!enrolled.length) return { ok: true, data: [] }

    const classIds = enrolled.map((e) => String(e.class_id))
    const { data: cls } = await supabase.from('classes').select('*').in('id', classIds)
    const classes = new Map<string, Row>(((cls ?? []) as Row[]).map((c) => [String(c.id), c]))

    // The teacher's name lives in profiles, which may only show a person their own row.
    const teacherIds = [...new Set(((cls ?? []) as Row[]).map((c) => str(c.teacher_id)).filter((x): x is string => !!x))]
    const teachers = new Map<string, string>()
    if (teacherIds.length) {
      const { data: profs } = await supabase.from('profiles').select('id, display_name').in('id', teacherIds)
      for (const p of (profs ?? []) as Row[]) {
        const n = str(p.display_name)
        if (n) teachers.set(String(p.id), n)
      }
    }

    const list: MyClass[] = enrolled.map((e) => {
      const c = classes.get(String(e.class_id))
      return {
        classId: String(e.class_id),
        name: c ? str(c.name) : null,
        grade: c ? (num(c.grade) ?? num(c.class_level)) : null,
        teacherName: c ? (teachers.get(String(c.teacher_id)) ?? null) : null,
        joinedAt: str(e.joined_at) ?? str(e.created_at),
      }
    })
    list.sort((a, b) => (a.joinedAt ?? '').localeCompare(b.joinedAt ?? ''))
    return { ok: true, data: list }
  } catch (e) {
    return { ok: false, message: isNetwork(e) ? NETWORK : 'We could not load your classes. Please try again.' }
  }
}
