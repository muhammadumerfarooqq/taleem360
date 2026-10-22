import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getModel,
  getTeacherClasses,
  getTeacherResults,
  USE_MOCK,
  type ResultLabel,
  type TeacherClass,
  type TeacherResults,
} from '../../api'
import { ScanIcon } from '../../components/Icons'
import TeacherLayout from '../../components/TeacherLayout'

const chipClass: Record<ResultLabel, string> = {
  Strong: 'strong',
  Okay: 'okay',
  'Needs help': 'help',
}

export default function TeacherDashboard() {
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [classId, setClassId] = useState('')
  const [results, setResults] = useState<TeacherResults | null>(null)
  const [quizTitle, setQuizTitle] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    getTeacherClasses()
      .then((c) => {
        if (!alive) return
        setClasses(c.classes)
        setClassId(c.classes[0]?.id ?? '')
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!classId) return
    let alive = true
    setResults(null)
    getTeacherResults({ classId })
      .then(async (r) => {
        const model = await getModel(r.rows[0]?.modelId ?? 'heart').catch(() => null)
        if (!alive) return
        setResults(r)
        setQuizTitle(model ? `${model.title} quiz · ${model.chapter}` : '')
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [classId])

  const current = classes.find((c) => c.id === classId)

  return (
    <TeacherLayout>
      <div className="t-head">
        <div>
          <h1>{current ? `${current.name} · ${current.subject}` : ' '}</h1>
          <div className="t-sub">{quizTitle || ' '}</div>
        </div>
        <div className="t-head-actions">
          {USE_MOCK && <span className="t-badge">Sample data</span>}
          <Link to={`/teacher/projector?model=${results?.rows[0]?.modelId ?? 'generator'}`} className="t-primary">
            <ScanIcon size={18} color="#1B1B2F" />
            Scan a diagram
          </Link>
        </div>
      </div>

      {classes.length > 1 && (
        <div className="t-filter" id="class-filter">
          <label htmlFor="class-select">Class</label>
          <select id="class-select" value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.subject}
              </option>
            ))}
          </select>
        </div>
      )}

      {failed && (
        <div className="t-card" role="alert">
          We could not load the results. Please refresh the page.
        </div>
      )}

      {results && (
        <>
          <div className="t-stats">
            <div className="t-card stat">
              <div className="stat-label">Students who took the quiz</div>
              <div className="stat-value">{results.summary.studentsTaken}</div>
            </div>
            <div className="t-card stat">
              <div className="stat-label">Class average</div>
              <div className="stat-value teal">{results.summary.classAverage}%</div>
            </div>
            <div className="t-card stat">
              <div className="stat-label">Most scanned model</div>
              <div className="stat-value">{results.summary.mostScannedModel}</div>
            </div>
          </div>

          <div className="t-columns">
            <section className="t-card t-results" id="student-results">
              <h2>Student results</h2>
              <div className="t-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Model</th>
                      <th>Score</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.rows.map((r) => (
                      <tr key={r.studentName}>
                        <td className="strong-cell">{r.studentName}</td>
                        <td>{r.modelId.charAt(0).toUpperCase() + r.modelId.slice(1)}</td>
                        <td className="score-cell">
                          {r.score}/{r.total}
                        </td>
                        <td>
                          <span className={`t-chip ${chipClass[r.label]}`}>{r.label}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="t-card t-struggle">
              <h2>Where the class struggles</h2>
              <p className="t-hint">Share of correct answers by topic</p>
              <div className="bars">
                {results.weakTopics.map((t) => (
                  <div key={t.topic}>
                    <div className="bar-head">
                      <span>{t.topic}</span>
                      <span>{t.percentCorrect}%</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className={t.percentCorrect < 50 ? 'low' : ''}
                        style={{ width: `${t.percentCorrect}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}

      {!results && !failed && <div className="t-card">Loading results…</div>}
    </TeacherLayout>
  )
}
