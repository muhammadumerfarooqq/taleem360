import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import StudentShell from '../components/StudentShell'
import { homeFor, useAuth, type Role } from './AuthProvider'

interface ProtectedRouteProps {
  /** Which role may open this page. */
  role: Role
  children: ReactNode
}

// In demo (mock) mode this does nothing, so every screen opens exactly as before.
// With real sign-in: logged-out people go to the login screen, and each role is kept on its own side
// (a student cannot open /teacher, a teacher is sent away from the student screens).
export default function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const { realAuth, user, profile, loading, signOut } = useAuth()
  const location = useLocation()

  if (!realAuth) return <>{children}</>

  if (loading) {
    return (
      <StudentShell tone="sun">
        <div className="auth-wait" role="status">
          <span className="auth-spinner" aria-hidden="true" />
          Loading…
        </div>
      </StudentShell>
    )
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />

  if (!profile) {
    return (
      <StudentShell tone="sun">
        <div className="auth-wait">
          <p>We could not load your profile.</p>
          <button type="button" className="btn btn-primary" onClick={() => void signOut()}>
            Sign out and try again
          </button>
        </div>
      </StudentShell>
    )
  }

  if (profile.role !== role) return <Navigate to={homeFor(profile.role)} replace />

  return <>{children}</>
}
