import { Link, useSearchParams } from 'react-router-dom'
import { CloseIcon } from '../../components/Icons'
import StudentShell from '../../components/StudentShell'
import { BookFigure } from '../../components/subjectArt'
import { mockFigures, pick, subjectModelIds } from '../../mock/subjects'

// The Home tab ids and what the scanner shows for each. With no ?subject= it stays on Biology, as before.
const subjectNames: Record<string, string> = {
  biology: 'Biology',
  chemistry: 'Chemistry',
  physics: 'Physics',
  cs: 'Computer Science',
}

const bar = (width: string, tone: string, mt: number) => (
  <div className="page-line" style={{ width, background: tone, marginTop: mt }} />
)

// Placeholder only: a drawn textbook page. The real camera comes later with Capacitor.
export default function Scan() {
  const [params] = useSearchParams()
  const requested = params.get('subject')
  const subject = pick(subjectNames, requested) ? (requested as string) : 'biology'
  const modelId = pick(subjectModelIds, subject) ?? 'heart'
  const figure = pick(mockFigures, modelId)
  const heart = modelId === 'heart'
  return (
    <StudentShell tone="camera">
      <div className="scan">
        <div className="scan-stage">
          <div className="scan-page">
            <div className="page-line title" style={{ width: '70%' }} />
            {bar('96%', '#DAD5C7', 12)}
            {bar('90%', '#DAD5C7', 8)}
            {bar('94%', '#DAD5C7', 8)}
            <div className="page-figure">
              {!heart && <BookFigure modelId={modelId} />}
              {heart && (
                <svg
                  aria-label="Textbook figure of the human heart"
                  role="img"
                  viewBox="0 0 200 200"
                >
                  <path
                    d="M100 185 C38 142 18 100 34 68 C50 38 90 44 100 70 C110 44 150 38 166 68 C182 100 162 142 100 185Z"
                    fill="#E9889A"
                    stroke="#7A2433"
                    strokeWidth="2"
                  />
                  <path
                    d="M96 66 C94 20 138 12 152 44"
                    fill="none"
                    stroke="#B3283F"
                    strokeWidth="13"
                    strokeLinecap="round"
                  />
                  <path
                    d="M118 68 C124 38 150 40 162 58"
                    fill="none"
                    stroke="#4A74D8"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M66 62 L66 16"
                    fill="none"
                    stroke="#4A74D8"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <path d="M100 74 L100 170" stroke="#7A2433" strokeWidth="2" strokeDasharray="4 4" />
                </svg>
              )}
            </div>
            <div className="page-caption">{figure ? `${figure.figure} ${figure.label}` : 'Fig 9.4 Human heart'}</div>
            {bar('96%', '#DAD5C7', 14)}
            {bar('88%', '#DAD5C7', 8)}
          </div>

          <div className="scan-dim" aria-hidden="true" />
          <div className="scan-frame" aria-hidden="true">
            <i className="corner tl" />
            <i className="corner tr" />
            <i className="corner bl" />
            <i className="corner br" />
          </div>
          <div className="scan-hint">
            <span>Fit one diagram inside the box</span>
          </div>
        </div>

        <div className="scan-top">
          <Link to="/home" className="round-btn dark" aria-label="Close scanner">
            <CloseIcon size={20} color="#FFFFFF" />
          </Link>
          <div className="pill-label">Class 9 · {pick(subjectNames, subject)}</div>
          <div className="round-spacer" />
        </div>

        <div className="scan-bottom">
          <Link to={`/fetching?subject=${encodeURIComponent(subject)}`} className="shutter" aria-label="Capture diagram">
            <span />
          </Link>
          <div className="scan-note">The camera takes one photo, then closes</div>
        </div>
      </div>
    </StudentShell>
  )
}
