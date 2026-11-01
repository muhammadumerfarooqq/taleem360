import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { homeFor, useAuth, type AuthResult } from '../../auth/AuthProvider'
import { joinClassWithRoll } from '../../lib/classes'
import {
  CLASS_CODE_LENGTH,
  NAME_MAX,
  PIN_LENGTH,
  checkName,
  checkRoll,
  normalizeClassCode,
  pseudoEmail,
  validatePin,
} from '../../lib/studentAuth'

type Step = 'first' | 'return'

// The one message for a returning student who cannot sign in: it never says which part was wrong.
const NOT_RIGHT = 'The class code, roll number or PIN is not right.'
const ROLL_USED =
  'That roll number is already used in this class. If it is you, choose "I have signed in before" and enter your PIN. Otherwise ask your teacher.'
const SET_UP_FAILED = 'We could not set up your class login right now. Please ask your teacher.'

const onlyDigits = (v: string) => v.replace(/[^0-9]/g, '').slice(0, PIN_LENGTH)

interface ClassLoginFormProps {
  /** Tells the login screen that sign-up and joining are running, so it does not jump to Home in between. */
  onBusy: (busy: boolean) => void
}

// Class students sign in with class code + roll number + a 6-digit PIN. There is no email. Under the hood it is a
// normal Supabase user with a hidden login address made from the code and roll (see lib/studentAuth.ts); that
// address is never shown, mailed or logged.
export default function ClassLoginForm({ onBusy }: ClassLoginFormProps) {
  const navigate = useNavigate()
  const { signUp, signIn, signOut } = useAuth()

  const [step, setStep] = useState<Step>('first')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [roll, setRoll] = useState('')
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const first = step === 'first'

  function switchStep(next: Step) {
    setStep(next)
    setError('')
    setPin('')
    setPin2('')
  }

  // Checks that need no network. Returns the cleaned values, or sets the message and returns null.
  function readInputs() {
    if (code.length !== CLASS_CODE_LENGTH) return fail(`A class code has ${CLASS_CODE_LENGTH} letters or numbers.`)
    let cleanName = ''
    if (first) {
      const n = checkName(name)
      if (!n.ok) return fail(n.message)
      cleanName = n.value
    }
    const r = checkRoll(roll)
    if (!r.ok) return fail(r.message)
    if (first) {
      const p = validatePin(pin)
      if (!p.ok) return fail(p.message)
      if (pin2 !== pin) return fail('The two PINs do not match.')
    } else if (pin.length !== PIN_LENGTH) {
      return fail(`Your PIN has ${PIN_LENGTH} digits.`)
    }
    return { name: cleanName, roll: r.value }
  }

  function fail(message: string): null {
    setError(message)
    return null
  }

  function showAuthFailure(res: Extract<AuthResult, { ok: false }>) {
    if (res.kind === 'weak') setError('Please choose a different PIN.')
    else if (res.kind === 'network' || res.kind === 'rate') setError(res.message)
    else if (res.message.toLowerCase().includes('email')) setError(SET_UP_FAILED) // never talk about the hidden address
    else setError(res.message)
  }

  async function onFirstTime(inputs: { name: string; roll: string }) {
    const email = pseudoEmail(code, inputs.roll)
    let res = await signUp({ email, password: pin, displayName: inputs.name, role: 'student' })
    if (!res.ok && res.kind === 'exists') {
      // This class code and roll number already have a login. If the PIN is theirs, carry on as a sign-in.
      const again = await signIn(email, pin)
      if (!again.ok) {
        if (again.kind === 'network' || again.kind === 'rate') setError(again.message)
        else setError(ROLL_USED)
        return
      }
      res = again
    }
    if (!res.ok) {
      showAuthFailure(res)
      return
    }

    // Signed in. Now join the class with the roll number. The database checks the code and the roll.
    const joined = await joinClassWithRoll(code, inputs.roll)
    if (joined.ok || joined.kind === 'already') {
      navigate(homeFor(res.profile.role), { replace: true })
      return
    }
    // Could not join: do not stay signed in with no class.
    await signOut()
    setError(joined.message)
  }

  async function onReturning(inputs: { roll: string }) {
    const res = await signIn(pseudoEmail(code, inputs.roll), pin)
    if (res.ok) {
      navigate(homeFor(res.profile.role), { replace: true })
      return
    }
    if (res.kind === 'network' || res.kind === 'rate') setError(res.message)
    else setError(NOT_RIGHT)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setError('')
    const inputs = readInputs()
    if (!inputs) return
    setBusy(true)
    onBusy(true)
    try {
      if (first) await onFirstTime(inputs)
      else await onReturning(inputs)
    } finally {
      setBusy(false)
      onBusy(false)
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="cc">Class code</label>
          <input
            id="cc"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder="ABC123"
            value={code}
            onChange={(e) => setCode(normalizeClassCode(e.target.value))}
          />
        </div>

        {first && (
          <div className="field">
            <label htmlFor="cn">Your full name</label>
            <input
              id="cn"
              type="text"
              autoComplete="name"
              maxLength={NAME_MAX}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="cr">Roll number</label>
          <input
            id="cr"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            value={roll}
            onChange={(e) => setRoll(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="cp">{first ? `Choose a ${PIN_LENGTH}-digit PIN` : 'Your PIN'}</label>
          <input
            id="cp"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={first ? 'new-password' : 'current-password'}
            value={pin}
            onChange={(e) => setPin(onlyDigits(e.target.value))}
          />
        </div>

        {first && (
          <div className="field">
            <label htmlFor="cq">Type the PIN again</label>
            <input
              id="cq"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="new-password"
              value={pin2}
              onChange={(e) => setPin2(onlyDigits(e.target.value))}
            />
          </div>
        )}

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Please wait…' : first ? 'Join my class' : 'Sign in'}
        </button>
      </form>

      {first && <p className="auth-note">Remember your PIN. Your teacher can help if you forget it.</p>}
      {!first && <p className="auth-note">Forgot your PIN? Ask your teacher.</p>}

      <button type="button" className="login-teacher" onClick={() => switchStep(first ? 'return' : 'first')}>
        {first ? 'I have signed in before' : 'First time here? Set up my login'}
      </button>
    </>
  )
}
