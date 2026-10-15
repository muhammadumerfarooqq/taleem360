import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { getMe, USE_MOCK, type QuizSubmitResult } from '../../api'
import { CheckIcon, CloseIcon } from '../../components/Icons'
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
  const percent = Math.round((result.score / result.total) * 100)
  const firstReview = result.results.find((r) => !r.correct)
  const reviewLabel = firstReview
    ? `Review ${firstReview.topic.toLowerCase()} in 3D`
    : 'Explore the model in 3D'

  return (
    <StudentShell tone="light">
      <div className="result">
        <div className="result-top">
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
            {name ? `, ${name}` : ''}
          </h1>
          <p>Your score has been sent to your teacher.</p>
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
          {USE_MOCK && <div className="result-note">Sample result (mock mode)</div>}
        </div>
      </div>
    </StudentShell>
  )
}
