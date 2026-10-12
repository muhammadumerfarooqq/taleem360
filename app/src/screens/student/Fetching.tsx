import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getModel, recognize } from '../../api'
import { CheckIcon, CubeIcon, SearchOffIcon } from '../../components/Icons'
import StudentShell from '../../components/StudentShell'

const steps = ['Recognising the diagram', 'Fetching the 3D model', 'Preparing the viewer']
const progress = [8, 38, 70, 100]
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

type Status = 'working' | 'not_found' | 'error'

export default function Fetching() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const mockFail = params.get('fail') === '1' // mock only: forces "Diagram not found"
  // Placeholder photo: the real camera photo is passed in a later step.
  const photo = useMemo(() => new Blob([], { type: 'image/jpeg' }), [])

  const [status, setStatus] = useState<Status>('working')
  const [step, setStep] = useState(0)
  const [label, setLabel] = useState('')
  const [modelId, setModelId] = useState('heart')

  useEffect(() => {
    let alive = true
    async function run() {
      try {
        const [res] = await Promise.all([recognize(photo, { mockFail }), wait(900)])
        if (!alive) return
        if (res.status !== 'ok') {
          setStatus('not_found')
          return
        }
        setLabel(res.figure ? `${res.label}, ${res.figure}` : res.label)
        setModelId(res.modelId)
        setStep(1)
        const [model] = await Promise.all([getModel(res.modelId), wait(900)])
        if (!alive) return
        setStep(2)
        await wait(900)
        if (!alive) return
        setStep(3)
        await wait(500)
        if (!alive) return
        navigate(`/viewer?model=${encodeURIComponent(model.id)}`, { replace: true })
      } catch {
        if (alive) setStatus('error')
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [photo, mockFail, navigate])

  if (status !== 'working') {
    return (
      <StudentShell tone="dark">
        <div className="fetch fetch-fail">
          <div className="fetch-icon fail">
            <SearchOffIcon size={56} color="#F59E0B" />
          </div>
          <h1>{status === 'not_found' ? 'Diagram not found' : 'Something went wrong'}</h1>
          <p className="fetch-sub">
            {status === 'not_found'
              ? 'We could not match this picture to a diagram in our database. Fit one diagram inside the box and try again.'
              : 'We could not reach the server. Check your connection and try again.'}
          </p>
          <Link to="/scan" className="btn btn-primary fetch-btn">
            Retake photo
          </Link>
          <Link to="/home" className="fetch-link">
            Back to home
          </Link>
        </div>
      </StudentShell>
    )
  }

  return (
    <StudentShell tone="dark">
      <div className="fetch">
        <svg className="fetch-rings" aria-hidden="true" width="390" height="400" viewBox="0 0 390 400">
          <circle cx="195" cy="200" r="170" fill="none" stroke="#14B8A6" strokeWidth="1" />
          <circle cx="195" cy="200" r="125" fill="none" stroke="#14B8A6" strokeWidth="1" />
          <circle cx="195" cy="200" r="80" fill="none" stroke="#F59E0B" strokeWidth="1" />
        </svg>

        <div className="fetch-icon">
          <CubeIcon size={64} color="#14B8A6" />
        </div>
        <h1>Fetching 3D Model from Database</h1>
        <p className="fetch-sub" aria-live="polite">
          {label ? `Recognised: ${label}` : 'Looking at your photo…'}
        </p>

        <div
          className="fetch-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress[step]}
        >
          <div style={{ width: `${progress[step]}%` }} />
        </div>

        <ul className="fetch-steps">
          {steps.map((text, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'todo'
            return (
              <li key={text} className={state}>
                <span className="step-dot">
                  {state === 'done' && <CheckIcon size={13} color="#0E1B2C" />}
                </span>
                {text}
              </li>
            )
          })}
        </ul>

        <Link
          to={`/viewer?model=${encodeURIComponent(modelId)}`}
          className="btn btn-primary fetch-btn"
          aria-disabled={step < 3}
          tabIndex={step < 3 ? -1 : 0}
          onClick={(e) => step < 3 && e.preventDefault()}
        >
          Open the model
        </Link>
        <Link to="/scan" className="fetch-link">
          Wrong diagram? Scan again
        </Link>
      </div>
    </StudentShell>
  )
}
