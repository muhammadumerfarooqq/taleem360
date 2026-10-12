import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CubeIcon, MenuIcon } from './Icons'

interface TeacherLayoutProps {
  children: ReactNode
}

// Desktop-first layout for teacher pages (no StudentShell).
// Wide screens: dark sidebar. Narrow screens (<= 900px): top bar with a menu button.
export default function TeacherLayout({ children }: TeacherLayoutProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <div className="t-app">
      <div className="t-topbar">
        <div className="t-brand">
          <span className="t-brand-mark">
            <CubeIcon size={19} color="#0E1B2C" />
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
          <MenuIcon size={22} color="#FFFFFF" />
        </button>
      </div>

      <aside id="t-nav" className={`t-side${open ? ' open' : ''}`}>
        <div className="t-brand t-brand-side">
          <span className="t-brand-mark">
            <CubeIcon size={21} color="#0E1B2C" />
          </span>
          TALEEM360
        </div>
        <Link to="/teacher" className="t-link active" onClick={close}>
          Overview
        </Link>
        <Link to="/teacher/projector?model=heart" className="t-link" onClick={close}>
          Scan to projector
        </Link>
        <a href="#student-results" className="t-link" onClick={close}>
          Student results
        </a>
        <a href="#class-filter" className="t-link" onClick={close}>
          Classes
        </a>
        <span className="t-link disabled" aria-disabled="true">
          Model library
        </span>
        <Link to="/login" className="t-link signout" onClick={close}>
          Sign out
        </Link>
      </aside>

      <main className="t-main">{children}</main>
    </div>
  )
}
