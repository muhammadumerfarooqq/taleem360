import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import CodeCopy from '../../components/CodeCopy'
import TeacherLayout from '../../components/TeacherLayout'
import { getClassDetail, manageStudent, type ClassDetail, type ClassStudent } from '../../lib/classes'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

type Pending = { kind: 'reset' | 'remove'; student: ClassStudent }

// A student whose profile the teacher cannot read: we cannot tell a class login from an email learner.
const profileHidden = (s: ClassStudent) => !s.classLogin && s.name === null && s.email === null

function RemoveText({ student }: { student: ClassStudent }) {
  const who = student.name ?? 'This student'
  const roll = student.rollNo ? ` The roll number ${student.rollNo} becomes free for a real student.` : ''
  if (student.classLogin) {
    return (
      <p>
        This permanently deletes {who}&apos;s class login and <strong>all their quiz results</strong>. It cannot be undone.{roll}
      </p>
    )
  }
  if (profileHidden(student)) {
    return (
      <p>
        If {who} uses a class login, this permanently deletes their login and <strong>all their quiz results</strong>, and it cannot be undone.
        If they use an email, they only leave this class and keep their account and quiz results.
      </p>
    )
  }
  return (
    <p>
      {who} leaves this class. Their account and quiz results are kept, and they can join again with the class code.
    </p>
  )
}

// One class: its join code and the students who joined. The teacher can reset a class student's PIN or remove a
// student (both run in the Edge Function "manage-student"). Real sign-in only.
export default function TeacherClassDetail() {
  const { classId = '' } = useParams()
  const { realAuth, user } = useAuth()
  const [detail, setDetail] = useState<ClassDetail | null>(null)
  const [error, setError] = useState('')

  const [pending, setPending] = useState<Pending | null>(null)
  const [busy, setBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const [shownPin, setShownPin] = useState<{ student: ClassStudent; pin: string } | null>(null)
  const [notice, setNotice] = useState('')
  const opener = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!realAuth || !user || !classId) return
    let alive = true
    setDetail(null)
    setError('')
    getClassDetail(classId, user.id).then((res) => {
      if (!alive) return
      if (res.ok) setDetail(res.data)
      else setError(res.message)
    })
    return () => {
      alive = false
    }
  }, [realAuth, user, classId])

  // Reload the list without showing the loading screen (used after a student is removed).
  const refresh = useCallback(async () => {
    if (!user || !classId) return
    const res = await getClassDetail(classId, user.id)
    if (res.ok) setDetail(res.data)
  }, [user, classId])

  function open(kind: Pending['kind'], student: ClassStudent) {
    opener.current = document.activeElement as HTMLElement | null
    setDialogError('')
    setNotice('')
    setPending({ kind, student })
  }

  function close() {
    if (busy) return
    setPending(null)
    setShownPin(null)
    setDialogError('')
    opener.current?.focus?.()
  }

  async function confirm() {
    if (!pending || busy) return
    const { kind, student } = pending
    setBusy(true)
    setDialogError('')
    const res = await manageStudent(kind === 'reset' ? 'reset_pin' : 'remove_student', student.studentId, classId)
    setBusy(false)
    if (!res.ok) {
      setDialogError(res.message)
      return
    }
    setPending(null)
    if (kind === 'reset' && res.pin) {
      setShownPin({ student, pin: res.pin })
      return
    }
    setNotice(`${student.name ?? 'The student'} was removed${res.removed === 'login' ? ' and their login was deleted' : ' from this class'}.`)
    opener.current = null
    await refresh()
  }

  // Escape closes a question (not while it is working, and never a PIN that is still on screen).
  useEffect(() => {
    if (!pending) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const back = (
    <Link to="/teacher/classes" className="cls-link">
      ← All classes
    </Link>
  )

  if (!realAuth) {
    return (
      <TeacherLayout active="classes">
        <div className="t-card">
          Classes need real sign-in, so they are not available in demo mode. {back}
        </div>
      </TeacherLayout>
    )
  }

  if (error) {
    return (
      <TeacherLayout active="classes">
        <div className="t-card" role="alert">
          <p>{error}</p>
          {back}
        </div>
      </TeacherLayout>
    )
  }

  if (!detail) {
    return (
      <TeacherLayout active="classes">
        <div className="t-card" role="status">
          Loading the class…
        </div>
      </TeacherLayout>
    )
  }

  const { info, students, studentsReadable } = detail
  const showResetFor = (s: ClassStudent) => s.classLogin || profileHidden(s)

  return (
    <TeacherLayout active="classes">
      <div className="t-head">
        <div>
          {back}
          <h1>{info.name}</h1>
          <div className="t-sub">
            {info.grade ? `Grade ${info.grade} · ` : ''}
            {studentsReadable ? `${students.length} ${students.length === 1 ? 'student' : 'students'}` : 'students: not available'}
          </div>
        </div>
      </div>

      {info.joinCode && (
        <section className="t-card cls-made" aria-label="Join code">
          <div className="cls-made-title">Join code. Students type this in the Join a class box on their Home screen.</div>
          <CodeCopy code={info.joinCode} />
        </section>
      )}

      <section className="t-card" aria-label="Students">
        <h2>Students</h2>
        {notice && (
          <p className="cls-notice" role="status">
            {notice}
          </p>
        )}
        {!studentsReadable ? (
          <p className="cls-empty">We could not read the student list for this class.</p>
        ) : students.length === 0 ? (
          <p className="cls-empty">No students have joined yet. Share the code above.</p>
        ) : (
          <div className="t-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.studentId}>
                    <td className="cls-roll">{s.rollNo ?? '—'}</td>
                    <td className="strong-cell">
                      {s.name ?? 'Name not available'}
                      <div className="cls-actions">
                        {showResetFor(s) && (
                          <button type="button" className="cls-act" disabled={busy} onClick={() => open('reset', s)}>
                            Reset PIN
                          </button>
                        )}
                        <button type="button" className="cls-act danger" disabled={busy} onClick={() => open('remove', s)}>
                          Remove student
                        </button>
                      </div>
                    </td>
                    <td className="cls-email">{s.classLogin ? 'Class login' : (s.email ?? '—')}</td>
                    <td>{formatDate(s.joinedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(pending || shownPin) && (
        <div className="cls-modal-back" role="presentation">
          <div className="cls-modal" role="dialog" aria-modal="true" aria-labelledby="cls-modal-title">
            {shownPin ? (
              <>
                <h2 id="cls-modal-title">New PIN for {shownPin.student.name ?? 'this student'}</h2>
                <CodeCopy code={shownPin.pin} label="New PIN" />
                <p className="cls-modal-warn">
                  Tell this student their new PIN. It is shown only once. They should write it down.
                </p>
                <div className="cls-modal-buttons">
                  <button type="button" className="cls-act primary" autoFocus onClick={close}>
                    Done
                  </button>
                </div>
              </>
            ) : (
              pending && (
                <>
                  <h2 id="cls-modal-title">
                    {pending.kind === 'reset'
                      ? `Reset the PIN for ${pending.student.name ?? 'this student'}?`
                      : `Remove ${pending.student.name ?? 'this student'}?`}
                  </h2>
                  {pending.kind === 'reset' ? (
                    <p>
                      A new 6-digit PIN will be made and shown to you once. The old PIN stops working. If the student is already
                      signed in on another phone, that phone stays signed in until its session ends.
                    </p>
                  ) : (
                    <RemoveText student={pending.student} />
                  )}
                  {dialogError && (
                    <div className="auth-error" role="alert">
                      {dialogError}
                    </div>
                  )}
                  {busy && (
                    <p className="cls-modal-wait" role="status">
                      {pending.kind === 'reset' ? 'Making a new PIN…' : 'Removing…'}
                    </p>
                  )}
                  <div className="cls-modal-buttons">
                    <button type="button" className="cls-act" autoFocus disabled={busy} onClick={close}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={`cls-act ${pending.kind === 'remove' ? 'danger-solid' : 'primary'}`}
                      disabled={busy}
                      onClick={confirm}
                    >
                      {pending.kind === 'reset'
                        ? 'Reset PIN'
                        : pending.student.classLogin
                          ? 'Remove for good'
                          : 'Remove student'}
                    </button>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}
    </TeacherLayout>
  )
}
