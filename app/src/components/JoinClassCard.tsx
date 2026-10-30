import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { CODE_LENGTH, cleanCode, joinClass, listMyEnrollments, type MyClass } from '../lib/classes'

type Notice = { kind: 'ok' | 'error'; text: string } | null

// Student Home card (real sign-in only): shows the classes the student is in, or "Independent learner",
// and lets them join a class with the 6-character code from their teacher.
export default function JoinClassCard() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<MyClass[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  // Names learned when joining, used if the database does not show the class back to this student.
  const known = useRef(new Map<string, { name: string | null; grade: number | null }>())

  const fill = (list: MyClass[]): MyClass[] =>
    list.map((c) => {
      const k = known.current.get(c.classId)
      return k ? { ...c, name: c.name ?? k.name, grade: c.grade ?? k.grade } : c
    })

  async function load(keep?: MyClass) {
    if (!user) return
    const res = await listMyEnrollments(user.id)
    if (!res.ok) {
      setLoadError(res.message)
      if (keep) setClasses((old) => old ?? [keep])
      return
    }
    setLoadError('')
    let list = fill(res.data)
    // Just joined, but the database did not show the new class back yet: still show it.
    if (keep && !list.some((c) => c.classId === keep.classId)) list = [...list, keep]
    setClasses(list)
  }

  useEffect(() => {
    let alive = true
    if (user) {
      listMyEnrollments(user.id).then((res) => {
        if (!alive) return
        if (res.ok) setClasses(fill(res.data))
        else {
          setLoadError(res.message)
          setClasses([])
        }
      })
    }
    return () => {
      alive = false
    }
  }, [user])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    if (code.length !== CODE_LENGTH) {
      setNotice({ kind: 'error', text: `A class code has ${CODE_LENGTH} letters or numbers.` })
      return
    }
    setBusy(true)
    setNotice(null)
    const res = await joinClass(code)
    setBusy(false)
    if (!res.ok) {
      setNotice({ kind: 'error', text: res.message })
      return
    }
    setCode('')
    const j = res.joined
    if (j.classId) known.current.set(j.classId, { name: j.name ?? null, grade: j.grade ?? null })
    setNotice({ kind: 'ok', text: j.name ? `You joined ${j.name}!` : 'You joined the class!' })
    await load(j.classId ? { classId: j.classId, name: j.name ?? null, grade: j.grade ?? null, teacherName: null, joinedAt: null } : undefined)
  }

  return (
    <section className="class-card" aria-label="Your class">
      {classes === null ? (
        <div className="class-status">Loading your classes…</div>
      ) : classes.length === 0 ? (
        <>
          <div className="class-title">
            <span className="class-badge">Independent learner</span>
          </div>
          <p className="class-text">You are learning on your own. Got a code from your teacher? Join the class below.</p>
        </>
      ) : (
        <>
          <div className="class-title">Your {classes.length === 1 ? 'class' : 'classes'}</div>
          <ul className="class-list">
            {classes.map((c) => (
              <li key={c.classId}>
                <strong>{c.name ?? 'Your class'}</strong>
                {c.grade ? <span> · Grade {c.grade}</span> : null}
                {c.teacherName ? <div className="class-teacher">Teacher: {c.teacherName}</div> : null}
              </li>
            ))}
          </ul>
        </>
      )}

      {loadError && <p className="class-text class-soft">{loadError}</p>}

      <form className="join-form" onSubmit={onSubmit} noValidate>
        <label htmlFor="join-code" className="join-label">
          {classes && classes.length ? 'Join another class' : 'Join a class'}
        </label>
        <div className="join-row">
          <input
            id="join-code"
            className="join-input"
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            placeholder="ABC123"
            value={code}
            onChange={(e) => setCode(cleanCode(e.target.value))}
          />
          <button type="submit" className="join-btn" disabled={busy || code.length !== CODE_LENGTH}>
            {busy ? 'Joining…' : 'Join'}
          </button>
        </div>
      </form>

      {notice && (
        <div className={notice.kind === 'ok' ? 'class-ok' : 'auth-error'} role={notice.kind === 'ok' ? 'status' : 'alert'}>
          {notice.text}
        </div>
      )}
    </section>
  )
}
