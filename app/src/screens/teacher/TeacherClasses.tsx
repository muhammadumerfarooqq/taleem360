import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import CodeCopy from '../../components/CodeCopy'
import TeacherLayout from '../../components/TeacherLayout'
import {
  GRADES,
  NAME_MAX,
  createClass,
  listMyClasses,
  type ClassInfo,
  type TeacherClass,
} from '../../lib/classes'

// The teacher's own classes: create one (and see its join code) and list the ones they have.
// Real sign-in only: in demo mode this page just says so.
export default function TeacherClasses() {
  const { realAuth, user } = useAuth()
  const [classes, setClasses] = useState<TeacherClass[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [name, setName] = useState('')
  const [grade, setGrade] = useState(9)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [made, setMade] = useState<ClassInfo | null>(null)

  async function load() {
    if (!user) return
    const res = await listMyClasses(user.id)
    if (res.ok) {
      setLoadError('')
      setClasses(res.data)
    } else {
      setLoadError(res.message)
      setClasses((old) => old ?? [])
    }
  }

  useEffect(() => {
    if (realAuth && user) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realAuth, user])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setMade(null)
    const res = await createClass(name, grade)
    setBusy(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    setMade(res.data)
    setName('')
    await load()
  }

  if (!realAuth) {
    return (
      <TeacherLayout active="classes">
        <div className="t-head">
          <h1>Classes</h1>
        </div>
        <div className="t-card">
          Creating classes needs real sign-in, so it is not available in demo mode.{' '}
          <Link to="/teacher" className="cls-link">
            Back to the dashboard
          </Link>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout active="classes">
      <div className="t-head">
        <div>
          <h1>Your classes</h1>
          <div className="t-sub">Make a class, then give its code to your students.</div>
        </div>
      </div>

      <section className="t-card cls-create" aria-label="Create a class">
        <h2>Create a class</h2>
        <form className="cls-form" onSubmit={onSubmit} noValidate>
          <div className="cls-field">
            <label htmlFor="cls-name">Class name</label>
            <input
              id="cls-name"
              type="text"
              maxLength={NAME_MAX}
              autoComplete="off"
              placeholder="For example: 9-A Science"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="cls-field cls-grade">
            <label htmlFor="cls-grade">Grade</label>
            <select id="cls-grade" value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="t-primary cls-submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create class'}
          </button>
        </form>
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}
        {made && (
          <div className="cls-made" role="status">
            <div className="cls-made-title">
              {made.name}
              {made.grade ? ` · Grade ${made.grade}` : ''} is ready. Share this code with your students:
            </div>
            <CodeCopy code={made.joinCode} />
            <Link to={`/teacher/classes/${made.id}`} className="cls-link">
              Open this class
            </Link>
          </div>
        )}
      </section>

      <section className="t-card" aria-label="Your classes">
        <h2>Your classes</h2>
        {classes === null ? (
          <p className="cls-empty">Loading your classes…</p>
        ) : classes.length === 0 ? (
          <p className="cls-empty">{loadError || 'You have no classes yet. Create your first one above.'}</p>
        ) : (
          <ul className="cls-list">
            {classes.map((c) => (
              <li key={c.id}>
                <Link to={`/teacher/classes/${c.id}`} className="cls-row">
                  <span className="cls-row-main">
                    <strong>{c.name}</strong>
                    <span className="cls-row-sub">
                      {c.grade ? `Grade ${c.grade}` : 'Grade not set'} ·{' '}
                      {c.studentCount === null ? 'students: not available' : `${c.studentCount} ${c.studentCount === 1 ? 'student' : 'students'}`}
                    </span>
                  </span>
                  <span className="cls-code">{c.joinCode || '------'}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {classes && classes.length > 0 && loadError && <p className="cls-empty">{loadError}</p>}
      </section>
    </TeacherLayout>
  )
}
