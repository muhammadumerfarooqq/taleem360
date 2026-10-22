import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getContent, getModel, type ModelContent, type ModelInfo } from '../../api'
import {
  ChatIcon,
  ChevronLeftIcon,
  PauseIcon,
  RotateIcon,
  SpeakerIcon,
} from '../../components/Icons'
import ModelStage from '../../components/ModelStage'
import Logo from '../../components/Logo'
import StudentShell from '../../components/StudentShell'

type Lang = 'en' | 'ur'

export default function Viewer() {
  const [params] = useSearchParams()
  const modelId = params.get('model') ?? 'heart'

  const [model, setModel] = useState<ModelInfo | null>(null)
  const [content, setContent] = useState<ModelContent | null>(null)
  const [failed, setFailed] = useState(false)
  const [partId, setPartId] = useState('')
  const [lang, setLang] = useState<Lang>('en')
  const [playing, setPlaying] = useState(false) // UI only, no audio yet

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

  // Keep the selected part's chip visible in the swipe row.
  useEffect(() => {
    const chip = document.querySelector<HTMLElement>('.part-list .part-chip.on')
    const list = chip?.parentElement
    if (chip && list) {
      list.scrollTo({ left: chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' })
    }
  }, [partId])

  if (!model || !content) {
    return (
      <StudentShell tone="stage">
        <div className="viewer-wait">
          {failed ? (
            <>
              <p>We could not load this model.</p>
              <Link to="/home" className="fetch-link">
                Back to home
              </Link>
            </>
          ) : (
            <p>Loading the model…</p>
          )}
        </div>
      </StudentShell>
    )
  }

  const parts = content.parts
  const part = parts.find((p) => p.id === partId) ?? parts[0]
  const urdu = lang === 'ur'

  function selectPart(id: string) {
    setPartId(id)
    setPlaying(false)
  }

  return (
    <StudentShell tone="stage">
      <div className="viewer">
        <div className="viewer-top">
          <Link to="/home" className="round-btn glass" aria-label="Back to home">
            <ChevronLeftIcon size={20} color="#1B1B2F" />
          </Link>
          <div>
            <div className="viewer-title">{model.title}</div>
            <div className="viewer-sub">
              Class {model.classLevel} {model.subject} · {model.chapter}
            </div>
          </div>
          <div className="lang-toggle" role="group" aria-label="Language">
            <button
              type="button"
              className={!urdu ? 'on' : ''}
              aria-pressed={!urdu}
              onClick={() => setLang('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={`urdu${urdu ? ' on' : ''}`}
              aria-pressed={urdu}
              onClick={() => setLang('ur')}
            >
              اردو
            </button>
          </div>
        </div>

        <div className="viewer-stage">
          <Logo size={46} className="stage-logo" />
          <ModelStage model={model} parts={parts} selectedPartId={part.id} onSelectPart={selectPart} />
          <div className="stage-hint">
            <RotateIcon size={16} color="#1B1B2F" />
            Drag to rotate · pinch to zoom · tap a part
          </div>
        </div>

        <section className="sheet" aria-label="Part details">
          <div className="sheet-head">
            <div className="sheet-name">
              <span className="part-dot" style={{ background: part.color }} />
              <span className="sheet-name-text">
                <span className={urdu ? 'urdu' : undefined} lang={urdu ? 'ur' : 'en'}>
                  {urdu ? part.nameUr : part.nameEn}
                </span>
                <span className="part-count">
                  Part {parts.findIndex((p) => p.id === part.id) + 1} of {parts.length}
                </span>
              </span>
            </div>
            <button
              type="button"
              className={`audio-btn${playing ? ' on' : ''}`}
              aria-pressed={playing}
              aria-label={playing ? 'Pause audio' : 'Listen to this explanation'}
              onClick={() => setPlaying((v) => !v)}
            >
              {playing ? <PauseIcon size={18} /> : <SpeakerIcon size={18} />}
            </button>
          </div>

          <div className="part-list" role="group" aria-label="Parts">
            {parts.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`part-chip${p.id === part.id ? ' on' : ''}`}
                aria-pressed={p.id === part.id}
                onClick={() => selectPart(p.id)}
              >
                <span className="part-dot small" style={{ background: p.color }} />
                {p.nameEn}
              </button>
            ))}
          </div>

          <div className={`explain${urdu ? ' rtl' : ''}`} style={{ ['--part' as string]: part.color }}>
            {urdu ? (
              <p className="urdu explain-ur" dir="rtl" lang="ur">
                {part.textUr}
              </p>
            ) : (
              <p className="explain-en">{part.textEn}</p>
            )}
          </div>

          <div className="sheet-actions">
            <Link to={`/ask?model=${encodeURIComponent(model.id)}&part=${encodeURIComponent(part.id)}`} className="btn-ask">
              <ChatIcon size={18} color="#0F766E" />
              Ask AI tutor
            </Link>
            <Link to={`/quiz?model=${encodeURIComponent(model.id)}`} className="btn-quiz">
              Take quiz
            </Link>
          </div>
        </section>
      </div>
    </StudentShell>
  )
}
