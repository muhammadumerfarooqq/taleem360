// TALEEM360, step 5B: Supabase Edge Function "manage-student".
//
// A teacher can (1) reset a class student's PIN or (2) remove a student from their class.
// Setting another person's password and deleting an auth user need the service-role key. That key exists
// ONLY here: Supabase injects SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY into the Edge Function
// environment by itself. Do not copy it into the app, a .env file, the repo or a log. Keep "Verify JWT" ON.
//
// Single file on purpose, so it can also be pasted into the Supabase dashboard editor.
// How to deploy: backend/functions/README.md. This file has NOT been run against a real project.
//
// Request  : POST  { "action": "reset_pin" | "remove_student", "student_id": "...", "class_id": "..." }
// Responses: 200 { ok: true, pin }                     reset_pin  (the PIN is shown once, never stored or logged)
//            200 { ok: true, removed: "login" | "enrollment" }   remove_student
//            400 { error, message }  bad request, or "not a class login" for reset_pin on an email learner
//            401 { error: "unauthorized", message }  no or invalid sign-in
//            403 { error: "forbidden", message: "Not allowed" }  EVERY failed permission check looks the same
//            405 / 409 / 500 { error, message }
//
// Permission checks (all done here with the service-role client; nothing in the body is trusted):
//   1. the Authorization header holds a valid user session (auth.getUser with an anon-key client);
//   2. that user has role 'teacher' in public.profiles;
//   3. that user owns class_id (public.classes.teacher_id = caller);
//   4. student_id is enrolled in class_id (public.enrollments);
//   5. student_id is not the caller, and its profile role is 'student'.
// If 2, 3, 4 or 5 fails the answer is the same 403 "Not allowed", so nothing about other users is revealed.
//
// Assumptions about the database (check them; see backend/functions/README.md):
//   - public.profiles(id, role), public.classes(id, teacher_id), public.enrollments(class_id, student_id)
//   - deleting an auth user removes (or may be blocked by) rows that reference it; a block is reported, not hidden

import { createClient } from 'npm:@supabase/supabase-js@2'

// The hidden login address of a class student ends with this domain. It MUST be the same as the app's
// VITE_CLASS_LOGIN_DOMAIN (default below). Only set the CLASS_LOGIN_DOMAIN function secret if you changed the app's.
const FALLBACK_DOMAIN = 'students.taleem360.example'
const CLASS_LOGIN_DOMAIN = (Deno.env.get('CLASS_LOGIN_DOMAIN')?.trim() || FALLBACK_DOMAIN).toLowerCase()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // the caller is checked by its session token, not by its origin
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

const forbidden = () => reply(403, { error: 'forbidden', message: 'Not allowed' })
const failed = () => reply(500, { error: 'server_error', message: 'Something went wrong. Please try again.' })

// What may be logged: the action, the teacher and the student. Never a PIN, a token or a key.
function log(action: string, teacherId: string, studentId: string, outcome: string) {
  console.log(JSON.stringify({ fn: 'manage-student', action, teacher: teacherId, student: studentId, outcome }))
}

const ID = /^[A-Za-z0-9_-]{1,64}$/

// ---- PIN: 6 random digits, never an obvious one (same rule as validatePin in app/src/lib/studentAuth.ts) ----

function isTrivialPin(pin: string): boolean {
  const d = pin.split('').map(Number)
  const steps = d.slice(1).map((n, i) => (n - d[i] + 10) % 10)
  return steps.every((s) => s === 0) || steps.every((s) => s === 1) || steps.every((s) => s === 9)
}

function randomDigits(): string {
  const limit = 4_294_000_000 // the largest multiple of 1,000,000 below 2^32: no modulo bias
  const buf = new Uint32Array(1)
  for (;;) {
    crypto.getRandomValues(buf)
    if (buf[0] < limit) return String(buf[0] % 1_000_000).padStart(6, '0')
  }
}

function generatePin(): string {
  for (let i = 0; i < 1000; i++) {
    const pin = randomDigits()
    if (!isTrivialPin(pin)) return pin
  }
  throw new Error('pin_generation_failed') // practically impossible
}

// ---- the request ----

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return reply(204, {})
  if (req.method !== 'POST') return reply(405, { error: 'method_not_allowed', message: 'Use POST.' })

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anonKey || !serviceKey) return failed() // not running inside Supabase, or misconfigured

  // 1. who is calling
  const header = req.headers.get('Authorization') ?? ''
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
  if (!token) return reply(401, { error: 'unauthorized', message: 'Please sign in again.' })

  // 2. the body (checked before any database work)
  let body: Record<string, unknown>
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('bad body')
    body = parsed as Record<string, unknown>
  } catch {
    return reply(400, { error: 'invalid_request', message: 'The request was not understood.' })
  }
  const { action, student_id: studentId, class_id: classId } = body
  if (
    (action !== 'reset_pin' && action !== 'remove_student') ||
    typeof studentId !== 'string' || !ID.test(studentId) ||
    typeof classId !== 'string' || !ID.test(classId)
  ) {
    return reply(400, { error: 'invalid_request', message: 'The request was not understood.' })
  }

  const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } }
  const anon = createClient(url, anonKey, clientOptions)
  const { data: who, error: whoError } = await anon.auth.getUser(token)
  const teacherId = who?.user?.id
  if (whoError || !teacherId) return reply(401, { error: 'unauthorized', message: 'Please sign in again.' })

  // From here on the service-role client reads and writes. The caller's own permissions no longer matter,
  // so every check below is explicit.
  const admin = createClient(url, serviceKey, clientOptions)

  try {
    // 3. the caller is a teacher
    const me = await admin.from('profiles').select('role').eq('id', teacherId).maybeSingle()
    if (me.error) { log(action, teacherId, studentId, 'error:profile'); return failed() }
    if (me.data?.role !== 'teacher') { log(action, teacherId, studentId, 'denied'); return forbidden() }

    // 4. the caller owns the class
    const cls = await admin.from('classes').select('teacher_id').eq('id', classId).maybeSingle()
    if (cls.error) { log(action, teacherId, studentId, 'error:class'); return failed() }
    if (!cls.data || cls.data.teacher_id !== teacherId) { log(action, teacherId, studentId, 'denied'); return forbidden() }

    // 5. the student is enrolled in that class (and is a student, and is not the caller)
    const enr = await admin.from('enrollments').select('student_id').eq('class_id', classId).eq('student_id', studentId)
    if (enr.error) { log(action, teacherId, studentId, 'error:enrollment'); return failed() }
    if (!enr.data || enr.data.length === 0 || studentId === teacherId) { log(action, teacherId, studentId, 'denied'); return forbidden() }
    const prof = await admin.from('profiles').select('role').eq('id', studentId).maybeSingle()
    if (prof.error) { log(action, teacherId, studentId, 'error:student'); return failed() }
    if (prof.data?.role !== 'student') { log(action, teacherId, studentId, 'denied'); return forbidden() }

    // Is this a class login (hidden address) or an email learner?
    const target = await admin.auth.admin.getUserById(studentId)
    if (target.error || !target.data?.user) { log(action, teacherId, studentId, 'error:auth-user'); return failed() }
    const classLogin = (target.data.user.email ?? '').toLowerCase().endsWith(`@${CLASS_LOGIN_DOMAIN}`)

    // ---------- reset_pin ----------
    if (action === 'reset_pin') {
      if (!classLogin) {
        log(action, teacherId, studentId, 'refused:email-learner')
        return reply(400, {
          error: 'not_class_login',
          message: 'This student signs in with an email and password, so their PIN cannot be reset here.',
        })
      }
      const pin = generatePin()
      const done = await admin.auth.admin.updateUserById(studentId, { password: pin })
      if (done.error) { log(action, teacherId, studentId, 'error:update'); return failed() }
      log(action, teacherId, studentId, 'ok')
      return reply(200, { ok: true, pin }) // shown to the teacher once; not stored, not logged
    }

    // ---------- remove_student ----------
    if (!classLogin) {
      // An email learner keeps their account and quiz history; only this class enrolment goes.
      const gone = await admin.from('enrollments').delete().eq('class_id', classId).eq('student_id', studentId)
      if (gone.error) { log(action, teacherId, studentId, 'error:enrollment-delete'); return failed() }
      log(action, teacherId, studentId, 'ok:enrollment')
      return reply(200, { ok: true, removed: 'enrollment' })
    }

    // A class login is deleted completely (login, quiz history through the existing cascades), which frees the roll.
    // The enrolment rows go first; if the login cannot be deleted they are put back so nothing is half done.
    const saved = await admin.from('enrollments').select('*').eq('student_id', studentId)
    if (saved.error) { log(action, teacherId, studentId, 'error:enrollment-read'); return failed() }
    const del = await admin.from('enrollments').delete().eq('student_id', studentId)
    if (del.error) { log(action, teacherId, studentId, 'error:enrollment-delete'); return failed() }

    const removed = await admin.auth.admin.deleteUser(studentId)
    if (removed.error) {
      const restore = saved.data && saved.data.length ? await admin.from('enrollments').insert(saved.data) : { error: null }
      log(action, teacherId, studentId, restore.error ? 'error:delete-user:restore-failed' : 'error:delete-user:restored')
      return reply(409, {
        error: 'cannot_delete',
        message: restore.error
          ? 'This student could not be removed, and their class place may need to be checked. Please try again or ask for help.'
          : 'This student could not be removed because other records still depend on them. Nothing was changed.',
      })
    }
    log(action, teacherId, studentId, 'ok:login')
    return reply(200, { ok: true, removed: 'login' })
  } catch {
    log(String(action), teacherId, studentId, 'error:exception')
    return failed()
  }
})
