import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ScanIcon } from '../../components/Icons'
import TeacherLayout from '../../components/TeacherLayout'
import { getModels, listAttemptsForStudents, modelTitle, type ModelRow } from '../../lib/attempts'
import { getClassDetail, listMyClasses, type ClassDetail, type TeacherClass } from '../../lib/classes'
import {
  LEVEL_LABEL,
  STATUS_LABEL,
  formatPercent,
  percentOf,
  summarizeClassTopics,
  summarizeStudents,
  type Attempt,
} from '../../lib/insights'

// The teacher's Overview and Student results with REAL data, for the selected class. Real sign-in only
// (demo mode keeps the sample dashboard in TeacherDashboard.tsx).
export default function TeacherRealDashboard() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<TeacherClass[] | null>(null)
  const [classId, setClassId] = useState('')
  const [classError, setClassError] = useState('')

  const [detail, setDetail] = useState<ClassDetail | null>(null)
  const [attempts, setAttempts] = useState<Attempt[] | null>(null)
  const [attemptsError, setAttemptsError] = useState('')
  const [dataError, setDataError] = useState('')
  const [models, setModels] = useState<Map<string, ModelRow> | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  // 1. the teacher's classes
  useEffect(() => {
    if (!user) return
    let alive = true
    listMyClasses(user.id).then((res) => {
      if (!alive) return
      if (res.ok) {
        setClasses(res.data)
        setClassId((old) => (old && res.data.some((c) => c.id === old) ? old : (res.data[0]?.id ?? '')))
      } else {
        setClassError(res.message)
        setClasses([])
      }
    })
    return () => {
      alive = false
    }
  }, [user])

  // 2. the selected class: its students, their attempts, and the topic names
  useEffect(() => {
    if (!user || !classId) return
    let alive = true
    setDetail(null)
    setAttempts(null)
    setAttemptsError('')
    setDataError('')
    setOpen(null)
    ;(async () => {
      const [d, m] = await Promise.all([getClassDetail(classId, user.id), getModels()])
      if (!alive) return
      if (m.ok) setModels(m.data)
      if (!d.ok) {
        setDataError(d.message)
        return
      }
      setDetail(d.data)
      if (!d.data.studentsReadable) {
        setAttempts([])
        return
      }
      const a = await listAttemptsForStudents(d.data.students.map((s) => s.studentId))
      if (!alive) return
      if (a.ok) setAttempts(a.data)
      else {
        setAttempts([])
        setAttemptsError(a.message)
      }
    })()
    return () => {
      alive = false
    }
  }, [user, classId, tick])

  const view = useMemo(() => {
    if (!detail || !attempts) return null
    const ids = detail.students.map((s) => s.studentId)
    const byId = new Map(detail.students.map((s) => [s.studentId, s]))
    const rows = summarizeStudents(ids, attempts).map((r) => ({ ...r, student: byId.get(r.studentId)! }))
    const topics = summarizeClassTopics(attempts)
    return {
      average: percentOf(attempts),
      students: ids.length,
      attemptCount: attempts.length,
      rows,
      topics,
      weak: topics.filter((t) => t.level === 'weak'),
    }
  }, [detail, attempts])

  const current = classes?.find((c) => c.id === classId)

  const head = (
    <div className="t-head">
      <div>
        <h1>{current ? current.name : 'Overview'}</h1>
        <div className="t-sub">
          {current ? `${current.grade ? `Grade ${current.grade} · ` : ''}Quiz results from your students` : 'Quiz results from your students'}
        </div>
      </div>
      <div className="t-head-actions">
        <Link to="/teacher/classes" className="t-link-btn">
          Your classes
        </Link>
        <Link to="/teacher/projector?model=generator" className="t-primary">
          <ScanIcon size={18} color="#1B1B2F" />
          Scan a diagram
        </Link>
      </div>
    </div>
  )

  if (classes === null) {
    return (
      <TeacherLayout>
        {head}
        <div className="t-card" role="status">
          Loading your classes…
        </div>
      </TeacherLayout>
    )
  }

  if (classes.length === 0) {
    return (
      <TeacherLayout>
        {head}
        <div className="t-card">
          <p className="ins-text">{classError || 'You have no classes yet. Create one and share its code with your students.'}</p>
          <Link to="/teacher/classes" className="cls-link">
            Create a class
          </Link>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      {head}

      {classes.length > 1 && (
        <div className="t-filter" id="class-filter">
          <label htmlFor="class-select">Class</label>
          <select id="class-select" value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.grade ? ` · Grade ${c.grade}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {dataError && (
        <div className="t-card" role="alert">
          <p className="ins-text">{dataError}</p>
          <button type="button" className="ins-btn" onClick={() => setTick((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}

      {!dataError && !view && (
        <div className="t-card" role="status">
          Loading the class…
        </div>
      )}

      {view && (
        <>
          {attemptsError && (
            <div className="t-card" role="alert">
              <p className="ins-text">{attemptsError}</p>
              <button type="button" className="ins-btn" onClick={() => setTick((n) => n + 1)}>
                Try again
              </button>
            </div>
          )}

          <div className="t-stats">
            <div className="t-card stat">
              <div className="stat-label">Class average</div>
              <div className="stat-value teal">{formatPercent(view.average)}</div>
            </div>
            <div className="t-card stat">
              <div className="stat-label">Students</div>
              <div className="stat-value">{view.students}</div>
            </div>
            <div className="t-card stat">
              <div className="stat-label">Quizzes taken</div>
              <div className="stat-value">{view.attemptCount}</div>
            </div>
          </div>

          <div className="t-columns">
            <section className="t-card t-results" id="student-results" aria-label="Student results">
              <h2>Student results</h2>
              {view.rows.length === 0 ? (
                <p className="ins-text">No students have joined this class yet. Share its code from "Your classes".</p>
              ) : (
                <ul className="ins-students">
                  {view.rows.map((r) => {
                    const isOpen = open === r.studentId
                    return (
                      <li key={r.studentId} className={`ins-student status-${r.status}`}>
                        <button
                          type="button"
                          className="ins-student-head"
                          aria-expanded={isOpen}
                          onClick={() => setOpen(isOpen ? null : r.studentId)}
                        >
                          <span className="ins-student-name">
                            <strong>{r.student.name ?? 'Name not available'}</strong>
                            {r.student.rollNo || r.student.classLogin || r.student.email ? (
                              <span className="ins-sub">
                                {[
                                  r.student.rollNo ? `Roll ${r.student.rollNo}` : null,
                                  r.student.classLogin ? 'Class login' : r.student.email,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </span>
                            ) : null}
                          </span>
                          <span className="ins-student-stats">
                            <span className="ins-sub">
                              {r.quizzes} {r.quizzes === 1 ? 'quiz' : 'quizzes'}
                            </span>
                            <span className="ins-avg">{formatPercent(r.average)}</span>
                          </span>
                          <span className={`t-chip st-${r.status}`}>{STATUS_LABEL[r.status]}</span>
                        </button>
                        {isOpen && (
                          <div className="ins-detail">
                            {r.topics.length === 0 ? (
                              <p className="ins-text">This student has not taken a quiz yet.</p>
                            ) : (
                              <ul className="ins-topics">
                                {r.topics.map((t) => (
                                  <li key={t.modelId}>
                                    <span>
                                      <strong>{modelTitle(models, t.modelId)}</strong>
                                      <span className="ins-sub">
                                        {t.attempts} {t.attempts === 1 ? 'quiz' : 'quizzes'}
                                      </span>
                                    </span>
                                    <span className="ins-topic-right">
                                      {formatPercent(t.average)}
                                      <span className={`ins-tag ${t.level}`}>{LEVEL_LABEL[t.level]}</span>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section className="t-card t-struggle" aria-label="Where the class struggles">
              <h2>Where the class struggles</h2>
              <p className="t-hint">Average score by topic, weakest first</p>
              {view.topics.length === 0 ? (
                <p className="ins-text">No quizzes have been taken yet.</p>
              ) : (
                <>
                  {view.weak.length === 0 ? (
                    <p className="ins-ok">No weak topics yet.</p>
                  ) : (
                    <div className="ins-weak" role="status">
                      <strong>
                        {view.weak.length} weak {view.weak.length === 1 ? 'topic' : 'topics'}
                      </strong>
                      : {view.weak.map((t) => modelTitle(models, t.modelId)).join(', ')}
                    </div>
                  )}
                  <div className="bars">
                    {view.topics.map((t) => (
                      <div key={t.modelId}>
                        <div className="bar-head">
                          <span>{modelTitle(models, t.modelId)}</span>
                          <span>{formatPercent(t.average)}</span>
                        </div>
                        <div className="bar-track">
                          <div className={t.level === 'weak' ? 'low' : ''} style={{ width: `${Math.min(100, Math.max(0, t.average))}%` }} />
                        </div>
                        <div className="ins-sub">
                          {t.students} {t.students === 1 ? 'student' : 'students'} tried it · {t.attempts}{' '}
                          {t.attempts === 1 ? 'quiz' : 'quizzes'} · {LEVEL_LABEL[t.level]}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </TeacherLayout>
  )
}
