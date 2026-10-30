import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { homeFor, useAuth, type Role } from '../../auth/AuthProvider'
import { AtomIcon, BoltIcon, HeartIcon } from '../../components/Icons'
import Logo from '../../components/Logo'
import StudentShell from '../../components/StudentShell'

type Mode = 'signin' | 'signup'

const MIN_PASSWORD = 8
const looksLikeEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim())

// The real login screen (Supabase email and password). Used only when real sign-in is on;
// otherwise Login.tsx shows the old demo login.
export default function AuthLogin() {
  const navigate = useNavigate()
  const { user, profile, loading, signIn, signUp } = useAuth()

  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Already signed in (for example a saved session): go straight to the right side of the app.
  if (!loading && user && profile) return <Navigate to={homeFor(profile.role)} replace />

  const signup = mode === 'signup'

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    if (signup && !name.trim()) return setError('Please enter your name.')
    if (!looksLikeEmail(email)) return setError('Please enter a valid email address.')
    if (signup && password.length < MIN_PASSWORD) {
      return setError(`Your password needs at least ${MIN_PASSWORD} characters.`)
    }
    if (!password) return setError('Please enter your password.')

    setError('')
    setBusy(true)
    const result = signup
      ? await signUp({ email, password, displayName: name, role })
      : await signIn(email, password)
    setBusy(false)
    if (result.ok) navigate(homeFor(result.profile.role), { replace: true })
    else setError(result.message)
  }

  return (
    <StudentShell tone="sun">
      <div className="login">
        <div className="login-top">
          <div className="brand">
            <div className="brand-mark">
              <Logo size={92} />
            </div>
            <div className="brand-name">TALEEM360</div>
          </div>

          <h1>
            Learn science
            <br />
            in 3D
          </h1>

          <div className="login-stickers" aria-hidden="true">
            <span className="login-sticker pink">
              <HeartIcon size={24} color="#1B1B2F" />
            </span>
            <span className="login-sticker mint">
              <AtomIcon size={22} color="#1B1B2F" />
            </span>
            <span className="login-sticker sky">
              <BoltIcon size={22} color="#1B1B2F" />
            </span>
          </div>
        </div>

        <div className="login-sheet">
          <div className="auth-tabs" role="group" aria-label="Sign in or create an account">
            <button type="button" className={!signup ? 'on' : ''} aria-pressed={!signup} onClick={() => switchMode('signin')}>
              Sign in
            </button>
            <button type="button" className={signup ? 'on' : ''} aria-pressed={signup} onClick={() => switchMode('signup')}>
              Create account
            </button>
          </div>

          <form onSubmit={onSubmit} noValidate>
            {signup && (
              <div className="field">
                <label htmlFor="nm">Your name</label>
                <input
                  id="nm"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="em">Email</label>
              <input
                id="em"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="pw">Password{signup ? ` (at least ${MIN_PASSWORD} characters)` : ''}</label>
              <input
                id="pw"
                type="password"
                autoComplete={signup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {signup && (
              <div className="auth-roles" role="radiogroup" aria-label="I am a">
                <button
                  type="button"
                  role="radio"
                  aria-checked={role === 'student'}
                  className={role === 'student' ? 'on' : ''}
                  onClick={() => setRole('student')}
                >
                  I'm a student
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={role === 'teacher'}
                  className={role === 'teacher' ? 'on' : ''}
                  onClick={() => setRole('teacher')}
                >
                  I'm a teacher
                </button>
              </div>
            )}

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {signup && role === 'student' && (
            <p className="auth-note">Joining a class with a code comes next.</p>
          )}

          <button type="button" className="login-teacher" onClick={() => switchMode(signup ? 'signin' : 'signup')}>
            {signup ? 'I already have an account' : 'New here? Create an account'}
          </button>
          <div className="login-foot">Classes 6 to 10 · English and Urdu</div>
        </div>
      </div>
    </StudentShell>
  )
}
