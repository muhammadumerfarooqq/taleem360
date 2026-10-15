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
  const subject = params.get('subject') ?? undefined // mock only: the Home tab the student came from
  const scanHref = subject ? `/scan?subject=${encodeURIComponent(subject)}` : '/scan'
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
        const [res] = await Promise.all([recognize(photo, { mockFail, subject }), wait(900)])
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
  }, [photo, mockFail, subject, navigate])

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
          <Link to={scanHref} className="btn btn-primary fetch-btn">
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
        <div
          className="orb"
          role="progressbar"
          aria-label="Progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress[step]}
        >
          <svg className="orb-ring" viewBox="0 0 160 160" aria-hidden="true">
            <circle className="orb-track" cx="80" cy="80" r="70" />
            <circle
              className="orb-fill"
              cx="80"
              cy="80"
              r="70"
              pathLength={100}
              strokeDasharray={`${progress[step]} 100`}
            />
          </svg>
          <div className="orb-orbit" aria-hidden="true">
            <i />
          </div>
          <div className="orb-core">
            <CubeIcon size={44} color="#14B8A6" />
          </div>
        </div>

        <h1>Fetching 3D Model from Database</h1>
        <p className="fetch-sub" aria-live="polite">
          {label ? <span className="found-pill">Recognised: {label}</span> : 'Looking at your photo…'}
        </p>

        <ol className="timeline">
          {steps.map((text, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'todo'
            return (
              <li key={text} className={state}>
                <span className="tl-dot">{state === 'done' && <CheckIcon size={12} color="#0E1B2C" />}</span>
                <span className="tl-text">{text}</span>
                <span className="tl-state">{state === 'done' ? 'Done' : state === 'active' ? 'Working' : ''}</span>
              </li>
            )
          })}
        </ol>

        <Link
          to={`/viewer?model=${encodeURIComponent(modelId)}`}
          className="btn btn-primary fetch-btn"
          aria-disabled={step < 3}
          tabIndex={step < 3 ? -1 : 0}
          onClick={(e) => step < 3 && e.preventDefault()}
        >
          Open the model
        </Link>
        <Link to={scanHref} className="fetch-link">
          Wrong diagram? Scan again
        </Link>
      </div>
    </StudentShell>
  )
}
