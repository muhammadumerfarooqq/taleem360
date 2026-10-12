import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getContent, getModel, type ModelContent, type ModelInfo } from '../../api'
import { ChevronLeftIcon } from '../../components/Icons'
import ModelStage from '../../components/ModelStage'

// Client-only screen: no endpoint of its own (see docs/API.md). Reads ?model=<id>.
export default function TeacherProjector() {
  const [params] = useSearchParams()
  const modelId = params.get('model') ?? 'heart'

  const [model, setModel] = useState<ModelInfo | null>(null)
  const [content, setContent] = useState<ModelContent | null>(null)
  const [partId, setPartId] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([getModel(modelId), getContent(modelId)])
      .then(([m, c]) => {
        if (!alive) return
        setModel(m)
        setContent(c)
        setPartId(c.defaultPartId ?? c.parts[0]?.id ?? '')
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [modelId])

  if (!model || !content) {
    return (
      <div className="p-page p-wait">
        {failed ? (
          <>
            <p>We could not load this model.</p>
            <Link to="/teacher" className="p-link">
              Back to dashboard
            </Link>
          </>
        ) : (
          <p>Loading the model…</p>
        )}
      </div>
    )
  }

  const part = content.parts.find((p) => p.id === partId) ?? content.parts[0]

  return (
    <div className="p-page">
      <div className="p-head">
        <div className="p-title-row">
          <Link to="/teacher" className="round-btn glass" aria-label="Back to dashboard">
            <ChevronLeftIcon size={20} color="#FFFFFF" />
          </Link>
          <div>
            <div className="p-title">{model.title}</div>
            <div className="p-sub">
              Scanned from Class {model.classLevel} {model.subject} · {model.chapter}
            </div>
          </div>
        </div>
        <div className="p-live">
          <span />
          Showing on classroom projector
        </div>
      </div>

      <div className="p-body">
        <div className="p-stage projector-stage">
          <ModelStage
            model={model}
            parts={content.parts}
            selectedPartId={part.id}
            onSelectPart={setPartId}
          />
          <div className="p-stage-hint">Drag to rotate · scroll to zoom · click a part</div>
        </div>

        <aside className="p-panel">
          <h2>Parts</h2>
          <div className="p-parts" role="group" aria-label="Parts">
            {content.parts.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`p-part${p.id === part.id ? ' on' : ''}`}
                aria-pressed={p.id === part.id}
                style={{ ['--part' as string]: p.color }}
                onClick={() => setPartId(p.id)}
              >
                <span className="part-dot" style={{ background: p.color }} />
                {p.nameEn}
              </button>
            ))}
          </div>
          <p className="p-text">{part.textEn}</p>
          <div className="p-actions">
            <Link to="/teacher" className="p-start">
              Start class quiz on this model
            </Link>
            <Link to="/teacher" className="p-stop">
              Stop presenting
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
