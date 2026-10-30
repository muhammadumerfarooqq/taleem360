import { useEffect, useRef, useState } from 'react'

// A class code in large text with a Copy button. Works on phones and on plain http (falls back to a hidden field).
export default function CodeCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  async function copy() {
    let done = false
    try {
      await navigator.clipboard.writeText(code)
      done = true
    } catch {
      try {
        const box = document.createElement('textarea')
        box.value = code
        box.setAttribute('readonly', '')
        box.style.position = 'fixed'
        box.style.opacity = '0'
        document.body.appendChild(box)
        box.select()
        done = document.execCommand('copy')
        document.body.removeChild(box)
      } catch {
        done = false
      }
    }
    setCopied(done)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-copy">
      <span className="code-big" aria-label={`Join code ${code.split('').join(' ')}`}>
        {code}
      </span>
      <button type="button" className="code-copy-btn" onClick={copy}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <span className="sr-only" role="status">
        {copied ? 'Code copied' : ''}
      </span>
    </div>
  )
}
