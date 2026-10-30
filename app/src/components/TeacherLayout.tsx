import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { MenuIcon } from './Icons'
import Logo from './Logo'

interface TeacherLayoutProps {
  children: ReactNode
  /** Which sidebar link is highlighted. */
  active?: 'overview' | 'classes'
}

// Desktop-first layout for teacher pages (no StudentShell).
// Wide screens: dark sidebar. Narrow screens (<= 900px): top bar with a menu button.
export default function TeacherLayout({ children, active = 'overview' }: TeacherLayoutProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const navigate = useNavigate()
  const { realAuth, profile, signOut } = useAuth()

  async function onSignOut() {
    close()
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="t-app">
      <div className="t-topbar">
        <div className="t-brand">
          <span className="t-brand-mark">
            <Logo size={30} />
          </span>
          TALEEM360
        </div>
        <button
          type="button"
          className="t-menu-btn"
          aria-label="Menu"
          aria-expanded={open}
          aria-controls="t-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <MenuIcon size={22} color="#1B1B2F" />
        </button>
      </div>

      <aside id="t-nav" className={`t-side${open ? ' open' : ''}`}>
        <div className="t-brand t-brand-side">
          <span className="t-brand-mark">
            <Logo size={32} />
          </span>
          TALEEM360
        </div>
        <Link to="/teacher" className={`t-link${active === 'overview' ? ' active' : ''}`} onClick={close}>
          Overview
        </Link>
        <Link to="/teacher/projector?model=generator" className="t-link" onClick={close}>
          Scan to projector
        </Link>
        <a href="#student-results" className="t-link" onClick={close}>
          Student results
        </a>
        {realAuth ? (
          <Link to="/teacher/classes" className={`t-link${active === 'classes' ? ' active' : ''}`} onClick={close}>
            Classes
          </Link>
        ) : (
          <a href="#class-filter" className="t-link" onClick={close}>
            Classes
          </a>
        )}
        <span className="t-link disabled" aria-disabled="true">
          Model library
        </span>
        {realAuth && profile && (
          <div className="t-user">
            Signed in as <strong>{profile.display_name}</strong>
          </div>
        )}
        {realAuth ? (
          <button type="button" className="t-link signout t-signout-btn" onClick={onSignOut}>
            Sign out
          </button>
        ) : (
          <Link to="/login" className="t-link signout" onClick={close}>
            Sign out
          </Link>
        )}
      </aside>

      <main className="t-main">{children}</main>
    </div>
  )
}
