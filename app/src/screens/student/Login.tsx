import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api'
import { AtomIcon, BoltIcon, CubeIcon, HeartIcon } from '../../components/Icons'
import StudentShell from '../../components/StudentShell'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('student@school.edu.pk')
  const [password, setPassword] = useState('password123')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await login(email, password)
      navigate('/home')
    } finally {
      setBusy(false)
    }
  }

  return (
    <StudentShell tone="sun">
      <div className="login">
        <div className="login-top">
          <div className="brand">
            <div className="brand-mark">
              <CubeIcon size={26} color="#1B1B2F" />
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
          <div className="login-welcome">Welcome back</div>
          <form onSubmit={onSubmit}>
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
              <label htmlFor="pw">Password</label>
              <input
                id="pw"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              Sign in as student
            </button>
          </form>
          <button type="button" className="login-teacher" onClick={() => navigate('/teacher')}>
            I am a teacher
          </button>
          <div className="login-foot">Classes 6 to 10 · English and Urdu</div>
        </div>
      </div>
    </StudentShell>
  )
}
