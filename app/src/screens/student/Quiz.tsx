import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getModel, getQuiz, submitQuiz, type Quiz as QuizData } from '../../api'
import { CloseIcon } from '../../components/Icons'
import StudentShell from '../../components/StudentShell'

export default function Quiz() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const modelId = params.get('model') ?? 'heart'

  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [title, setTitle] = useState('')
  const [failed, setFailed] = useState(false)
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([getQuiz(modelId), getModel(modelId)])
      .then(([q, m]) => {
        if (!alive) return
        setQuiz(q)
        setTitle(m.title)
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [modelId])

  const leave = `/viewer?model=${encodeURIComponent(modelId)}`

  if (!quiz) {
    return (
      <StudentShell tone="light">
        <div className="quiz-wait">
          {failed ? (
            <>
              <p>We could not load this quiz.</p>
              <Link to="/home" className="text-link">
                Back to home
              </Link>
            </>
          ) : (
            <p>Loading the quiz…</p>
          )}
        </div>
      </StudentShell>
    )
  }

  const total = quiz.questions.length
  const question = quiz.questions[index]
  const chosen = picked[question.id]
  const last = index === total - 1

  async function next() {
    if (!quiz || !chosen) return
    if (!last) {
      setIndex(index + 1)
      return
    }
    setBusy(true)
    setSubmitError(false)
    try {
      const answers = quiz.questions
        .filter((q) => picked[q.id])
        .map((q) => ({ questionId: q.id, optionId: picked[q.id] }))
      const result = await submitQuiz(quiz.quizId, answers)
      navigate('/result', { replace: true, state: { result, modelId, modelTitle: title } })
    } catch {
      setSubmitError(true)
      setBusy(false)
    }
  }

  return (
    <StudentShell tone="light">
      <div className="quiz">
        <div className="quiz-top">
          <Link to={leave} className="round-btn outline" aria-label="Leave quiz">
            <CloseIcon size={20} color="#12263A" />
          </Link>
          <div className="quiz-progress">
            <div className="quiz-count">
              {title ? `${title} quiz · ` : ''}Question {index + 1} of {total}
            </div>
            <div
              className="quiz-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={index + 1}
            >
              <div style={{ width: `${((index + 1) / total) * 100}%` }} />
            </div>
          </div>
        </div>

        <h1 className="quiz-q">{question.text}</h1>

        <div className="quiz-options" role="radiogroup" aria-label="Answers">
          {question.options.map((o) => {
            const on = chosen === o.id
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={on}
                className={`quiz-option${on ? ' on' : ''}`}
                onClick={() => setPicked({ ...picked, [question.id]: o.id })}
              >
                <span className="opt-letter">{o.id.toUpperCase()}</span>
                {o.text}
              </button>
            )
          })}
        </div>

        <div className="quiz-foot">
          {submitError && (
            <div className="quiz-error" role="alert">
              We could not send your answers. Please try again.
            </div>
          )}
          <button type="button" className="quiz-next" disabled={!chosen || busy} onClick={next}>
            {busy ? 'Submitting…' : last ? 'Submit and finish' : 'Next'}
          </button>
          <div className="quiz-note">Marked automatically · your teacher sees your score</div>
        </div>
      </div>
    </StudentShell>
  )
}
