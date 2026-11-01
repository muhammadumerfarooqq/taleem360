import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { getMe, USE_MOCK, type QuizSubmitResult } from '../../api'
import { CheckIcon, CloseIcon } from '../../components/Icons'
import { saveAttemptOnce } from '../../lib/attempts'
import { listMyEnrollments } from '../../lib/classes'
import Logo from '../../components/Logo'
import StudentShell from '../../components/StudentShell'

interface ResultState {
  result: QuizSubmitResult
  modelId: string
  modelTitle: string
}

const CIRCUMFERENCE = 377 // 2 * pi * r (r = 60)

function praise(score: number, total: number) {
  const share = score / total
  if (share >= 0.8) return 'Nicely done'
  if (share >= 0.6) return 'Good effort'
  return 'Keep practising'
}

export default function Result() {
  const location = useLocation()
  const state = location.state as ResultState | null
  const [name, setName] = useState('')
  const { realAuth, profile } = useAuth()
  // Saving the finished quiz to the database (real sign-in, students only). The screen shows normally either way.
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveTry, setSaveTry] = useState(0)
  const saveKey = state?.result ? state.result.savedResultId || location.key : ''
  const saveModelId = state?.modelId ?? ''
  const saveScore = state?.result?.score ?? 0
  const saveTotal = state?.result?.total ?? 0
  const canSave = realAuth && profile?.role === 'student' && !!saveKey

  useEffect(() => {
    if (!canSave) return
    let alive = true
    setSaveState('saving')
    // The key makes sure one finished quiz is saved once, even after a re-render or a refresh.
    saveAttemptOnce(saveKey, saveModelId, saveScore, saveTotal).then((res) => {
      if (alive) setSaveState(res.ok ? 'saved' : 'error')
    })
    return () => {
      alive = false
    }
  }, [canSave, saveKey, saveModelId, saveScore, saveTotal, saveTry])

  // Is this student in at least one class? Decides whether the score goes "to your teacher" (real sign-in only).
  // null = not known yet or could not be read; then the text makes no claim about a teacher.
  const [inClass, setInClass] = useState<boolean | null>(null)
  const studentId = realAuth && profile?.role === 'student' ? profile.id : ''
  useEffect(() => {
    if (!studentId) return
    let alive = true
    listMyEnrollments(studentId).then((res) => {
      if (alive) setInClass(res.ok ? res.data.length > 0 : null)
    })
    return () => {
      alive = false
    }
  }, [studentId])

  useEffect(() => {
    let alive = true
    getMe()
      .then((me) => alive && setName(me.name))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  if (!state?.result) return <Navigate to="/home" replace />

  const { result, modelId, modelTitle } = state
  // With real sign-in, greet the signed-in person; in demo mode, the sample student.
  const shownName = realAuth && profile ? profile.display_name : name
  const percent = Math.round((result.score / result.total) * 100)
  const firstReview = result.results.find((r) => !r.correct)
  const reviewLabel = firstReview
    ? `Review ${firstReview.topic.toLowerCase()} in 3D`
    : 'Explore the model in 3D'

  return (
    <StudentShell tone="light">
      <div className="result">
        <div className="result-top">
          <Logo size={76} className="result-logo" />
          <div className="result-model">{modelTitle ? `${modelTitle} quiz` : 'Quiz result'}</div>
          <div className="ring">
            <svg aria-hidden="true" width="170" height="170" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" fill="none" stroke="#DCE3EB" strokeWidth="12" />
              <circle
                cx="70"
                cy="70"
                r="60"
                fill="none"
                stroke="#0F766E"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(percent / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              />
            </svg>
            <div className="ring-text">
              <div className="ring-score">
                {result.score}/{result.total}
              </div>
              <div className="ring-percent">{percent} percent</div>
            </div>
          </div>
          <h1>
            {praise(result.score, result.total)}
            {shownName ? `, ${shownName}` : ''}
          </h1>
          <p>
            {canSave && saveState === 'error'
              ? 'Your score is shown here, but it has not been saved yet.'
              : realAuth && inClass !== true
                ? 'Saved to your progress.'
                : 'Your score has been sent to your teacher.'}
          </p>
        </div>

        <ul className="topic-list">
          {result.results.map((r) => (
            <li key={r.questionId}>
              <span className={`topic-dot ${r.correct ? 'good' : 'bad'}`}>
                {r.correct ? (
                  <CheckIcon size={13} color="#1B1B2F" />
                ) : (
                  <CloseIcon size={12} color="#1B1B2F" />
                )}
              </span>
              <span className="topic-name">{r.topic}</span>
              {!r.correct && <span className="topic-review">Review</span>}
            </li>
          ))}
        </ul>

        <div className="result-actions">
          <Link to={`/viewer?model=${encodeURIComponent(modelId)}`} className="btn-quiz big">
            {reviewLabel}
          </Link>
          <Link to="/home" className="btn-home">
            Back to home
          </Link>
          {canSave && saveState === 'saving' && <div className="save-note">Saving your result…</div>}
          {canSave && saveState === 'saved' && (
            <div className="save-note ok">
              Saved. See it in <Link to="/progress">My progress</Link>.
            </div>
          )}
          {canSave && saveState === 'error' && (
            <div className="save-note err" role="alert">
              Could not save your result.
              <button type="button" onClick={() => setSaveTry((n) => n + 1)}>
                Retry
              </button>
            </div>
          )}
          {USE_MOCK && !realAuth && <div className="result-note">Sample result (mock mode)</div>}
        </div>
      </div>
    </StudentShell>
  )
}
