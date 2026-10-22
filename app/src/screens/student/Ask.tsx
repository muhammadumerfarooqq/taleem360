import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ApiError,
  askQuestion,
  getContent,
  getModel,
  type AskSource,
  type Lang,
} from '../../api'
import { BookIcon, ChevronLeftIcon, SearchOffIcon, SendIcon } from '../../components/Icons'
import Logo from '../../components/Logo'
import StudentShell from '../../components/StudentShell'

interface Message {
  id: number
  role: 'user' | 'tutor'
  text: string
  lang: Lang
  grounded?: boolean
  error?: boolean
  sources?: AskSource[]
}

const URDU = /[؀-ۿ]/

const heartSuggestions = [
  'What do the valves do?',
  'Arteries vs veins',
  'ابہر کی دیوار موٹی کیوں ہے؟',
]

// Starter questions for the other sample models. Each one matches a topic in mock/server.ts.
const suggestionsByModel: Record<string, string[]> = {
  heart: heartSuggestions,
  'carbon-atom': ['What are valence electrons?', 'How many electrons fit in each shell?', 'مرکزے میں کیا ہوتا ہے؟'],
  generator: ['How does the generator make electricity?', 'What do the brushes do?', 'بلب کیوں روشن ہوتا ہے؟'],
  'computer-hardware': ['What is RAM?', 'RAM vs storage', 'سی پی یو کیا کرتا ہے؟'],
}

export default function Ask() {
  const [params] = useSearchParams()
  const modelId = params.get('model') ?? 'heart'
  const partId = params.get('part') ?? undefined
  const suggestions = Object.prototype.hasOwnProperty.call(suggestionsByModel, modelId)
    ? suggestionsByModel[modelId]
    : heartSuggestions

  const [title, setTitle] = useState('')
  const [partName, setPartName] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const nextId = useRef(1)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    Promise.all([getModel(modelId), getContent(modelId)])
      .then(([m, c]) => {
        if (!alive) return
        setTitle(m.title)
        setPartName(c.parts.find((p) => p.id === partId)?.nameEn ?? '')
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [modelId, partId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, busy])

  async function ask(raw: string) {
    const question = raw.trim()
    if (!question || busy) return
    const lang: Lang = URDU.test(question) ? 'ur' : 'en'
    setMessages((m) => [...m, { id: nextId.current++, role: 'user', text: question, lang }])
    setText('')
    setBusy(true)
    try {
      const res = await askQuestion({ modelId, partId, question, lang })
      setMessages((m) => [
        ...m,
        {
          id: nextId.current++,
          role: 'tutor',
          text: res.answer,
          lang: res.lang,
          grounded: res.grounded,
          sources: res.sources,
        },
      ])
    } catch (e) {
      const limited = e instanceof ApiError && e.code === 'rate_limited'
      setMessages((m) => [
        ...m,
        {
          id: nextId.current++,
          role: 'tutor',
          error: true,
          lang: 'en',
          text: limited
            ? 'You are asking very quickly. Wait a moment and try again.'
            : 'Something went wrong. Please try again.',
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    ask(text)
  }

  const bar = (
    <div className="ask-bar">
      <div className="ask-chips">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            className={`ask-chip${URDU.test(s) ? ' urdu' : ''}`}
            disabled={busy}
            onClick={() => ask(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <form className="ask-input" onSubmit={onSubmit}>
        <label htmlFor="q" className="sr-only">
          Ask a question
        </label>
        <input
          id="q"
          type="text"
          autoComplete="off"
          placeholder={`Ask about the ${title ? title.toLowerCase() : 'model'}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="ask-send" aria-label="Send question" disabled={busy || !text.trim()}>
          <SendIcon size={22} color="#1B1B2F" />
        </button>
      </form>
    </div>
  )

  return (
    <StudentShell tone="light" bottomBar={bar}>
      <div className="ask">
        <div className="ask-head">
          <Link
            to={`/viewer?model=${encodeURIComponent(modelId)}`}
            className="round-btn soft"
            aria-label="Back to the model"
          >
            <ChevronLeftIcon size={20} color="#12263A" />
          </Link>
          <div>
            <div className="ask-title">AI tutor</div>
            <div className="ask-sub">
              Answers from your textbook{title ? ` · ${title}` : ''}
              {partName ? ` · ${partName}` : ''}
            </div>
          </div>
          <Logo size={40} className="head-logo" />
        </div>

        <div className="ask-thread" aria-live="polite">
          <div className="bubble tutor">
            Ask me anything about the {title ? title.toLowerCase() : 'model'}. I answer only from your
            textbook.
          </div>

          {messages.map((m) => (
            <div
              key={m.id}
              className={`bubble ${m.role}${m.grounded === false ? ' not-found' : ''}${m.error ? ' error' : ''}`}
            >
              {m.grounded === false && (
                <div className="nf-label">
                  <SearchOffIcon size={14} color="#8A4B06" />
                  Not found in your book
                </div>
              )}
              <div
                className={m.lang === 'ur' ? 'urdu bubble-ur' : undefined}
                dir={m.lang === 'ur' ? 'rtl' : undefined}
                lang={m.lang}
              >
                {m.text}
              </div>
              {m.sources && m.sources.length > 0 && (
                <div className="source-pill">
                  <BookIcon size={14} color="#0B5C56" />
                  {m.sources[0].book} · {m.sources[0].chapter} · p. {m.sources[0].page}
                </div>
              )}
            </div>
          ))}

          {busy && (
            <div className="bubble tutor typing" aria-label="The tutor is typing">
              <i />
              <i />
              <i />
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>
    </StudentShell>
  )
}
