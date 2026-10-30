import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ChevronRightIcon } from '../../components/Icons'
import Logo from '../../components/Logo'
import StudentShell from '../../components/StudentShell'
import TabBar from '../../components/TabBar'
import { getModels, listMyAttempts, modelTitle, type ModelRow } from '../../lib/attempts'
import {
  LEVEL_LABEL,
  STATUS_LABEL,
  formatPercent,
  levelOf,
  overall,
  summarizeByTopic,
  weakTopics,
  type Attempt,
} from '../../lib/insights'

const RECENT = 10

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

// "My progress": the student's own quiz results, by topic. The same screen for every student, whether or not
// they are in a class (for an independent learner it is their self-evaluation). Real sign-in only.
export default function Progress() {
  const { realAuth, user } = useAuth()
  const [attempts, setAttempts] = useState<Attempt[] | null>(null)
  const [models, setModels] = useState<Map<string, ModelRow> | null>(null)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!realAuth || !user) return
    let alive = true
    setError('')
    setAttempts(null)
    Promise.all([listMyAttempts(user.id), getModels()]).then(([a, m]) => {
      if (!alive) return
      if (m.ok) setModels(m.data)
      if (a.ok) setAttempts(a.data)
      else setError(a.message)
    })
    return () => {
      alive = false
    }
  }, [realAuth, user, tick])

  const stats = useMemo(() => {
    const list = attempts ?? []
    const topics = summarizeByTopic(list)
    return { total: overall(list), topics, weak: weakTopics(topics), recent: list.slice(0, RECENT) }
  }, [attempts])

  const shell = (body: ReactNode) => (
    <StudentShell tone="light" bottomBar={<TabBar active="/progress" />}>
      <div className="progress">
        <div className="progress-head">
          <div>
            <div className="progress-title">My progress</div>
            <div className="progress-sub">Your quiz results, topic by topic</div>
          </div>
          <Logo size={40} className="head-logo" />
        </div>
        {body}
      </div>
    </StudentShell>
  )

  if (!realAuth) {
    return shell(
      <div className="prog-card">
        <p className="prog-text">My progress needs real sign-in, so it is not available in demo mode.</p>
        <Link to="/home" className="prog-link">
          Back to home
        </Link>
      </div>,
    )
  }

  if (error) {
    return shell(
      <div className="prog-card" role="alert">
        <p className="prog-text">{error}</p>
        <button type="button" className="prog-btn" onClick={() => setTick((n) => n + 1)}>
          Try again
        </button>
      </div>,
    )
  }

  if (!attempts) {
    return shell(
      <div className="prog-card" role="status">
        <p className="prog-text">Loading your progress…</p>
      </div>,
    )
  }

  if (attempts.length === 0) {
    return shell(
      <div className="prog-card">
        <div className="prog-empty-title">No quizzes yet</div>
        <p className="prog-text">Open a model, take its quiz, and your result will show up here.</p>
        <Link to="/home" className="prog-btn prog-btn-link">
          Pick a model
        </Link>
      </div>,
    )
  }

  const { total, topics, weak, recent } = stats

  return shell(
    <>
      <div className="prog-summary">
        <div className="prog-card prog-stat">
          <div className="prog-stat-label">Average</div>
          <div className="prog-stat-value">{formatPercent(total.average)}</div>
        </div>
        <div className="prog-card prog-stat">
          <div className="prog-stat-label">Quizzes</div>
          <div className="prog-stat-value">{total.quizzes}</div>
        </div>
        <div className={`prog-card prog-stat status-${total.status}`}>
          <div className="prog-stat-label">Status</div>
          <div className="prog-stat-text">{STATUS_LABEL[total.status]}</div>
        </div>
      </div>

      <section className="prog-card" aria-label="Practice these first">
        <h2>Practice these first</h2>
        {weak.length === 0 ? (
          <p className="prog-text">No weak topics. Keep it up!</p>
        ) : (
          <ul className="prog-list">
            {weak.map((t) => (
              <li key={t.modelId}>
                <Link to={`/viewer?model=${encodeURIComponent(t.modelId)}`} className="prog-practice">
                  <span>
                    <strong>{modelTitle(models, t.modelId)}</strong>
                    <span className="prog-row-sub">{formatPercent(t.average)} average</span>
                  </span>
                  <ChevronRightIcon size={18} color="#1B1B2F" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="prog-card" aria-label="Topics">
        <h2>Your topics</h2>
        <ul className="prog-list">
          {topics.map((t) => {
            const m = models?.get(t.modelId)
            return (
              <li key={t.modelId} className="prog-topic">
                <div className="prog-topic-head">
                  <span className="prog-topic-name">
                    <strong>{modelTitle(models, t.modelId)}</strong>
                    {m?.subject ? <span className="prog-row-sub">{m.subject}</span> : null}
                  </span>
                  <span className={`prog-tag ${t.level}`}>{LEVEL_LABEL[t.level]}</span>
                </div>
                <div className="prog-bar" aria-hidden="true">
                  <div className={t.level} style={{ width: `${Math.min(100, Math.max(0, t.average))}%` }} />
                </div>
                <div className="prog-row-sub">
                  {formatPercent(t.average)} average · {t.attempts} {t.attempts === 1 ? 'quiz' : 'quizzes'}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="prog-card" aria-label="Recent quizzes">
        <h2>Recent quizzes</h2>
        <ul className="prog-list">
          {recent.map((a, i) => {
            const pct = (a.score / a.maxScore) * 100
            return (
              <li key={`${a.takenAt ?? 'x'}-${i}`} className="prog-recent">
                <span className="prog-topic-name">
                  <strong>{modelTitle(models, a.modelId)}</strong>
                  <span className="prog-row-sub">{formatDate(a.takenAt)}</span>
                </span>
                <span className="prog-recent-score">
                  {a.score}/{a.maxScore}
                  <span className={`prog-tag ${levelOf(pct)}`}>{Math.round(pct)}%</span>
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </>,
  )
}
