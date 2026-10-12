import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api'
import { CubeIcon } from '../../components/Icons'
import StudentShell from '../../components/StudentShell'

const rings = (
  <svg className="login-rings" aria-hidden="true" width="390" height="300" viewBox="0 0 390 300">
    <circle cx="330" cy="40" r="130" fill="none" stroke="#14B8A6" strokeWidth="1" />
    <circle cx="330" cy="40" r="90" fill="none" stroke="#14B8A6" strokeWidth="1" />
    <circle cx="330" cy="40" r="50" fill="none" stroke="#F59E0B" strokeWidth="1" />
  </svg>
)

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
    <StudentShell tone="dark" decor={rings}>
      <div className="login">
        <div className="brand">
          <div className="brand-mark">
            <CubeIcon size={26} color="#0E1B2C" />
          </div>
          <div className="brand-name">TALEEM360</div>
        </div>

        <div>
          <h1>
            Scan a diagram.
            <br />
            Explore it in 3D.
          </h1>
          <p className="lede">
            Point your camera at a figure in your Sindh Textbook Board science book and learn it part
            by part.
          </p>
        </div>

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
          <button type="button" className="btn btn-outline" onClick={() => navigate('/teacher')}>
            I am a teacher
          </button>
        </form>

        <div className="login-foot">Classes 6 to 10 · English and Urdu</div>
      </div>
    </StudentShell>
  )
}
