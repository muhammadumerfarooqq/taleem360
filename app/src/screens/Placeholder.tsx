import { Link } from 'react-router-dom'
import StudentShell from '../components/StudentShell'

interface PlaceholderProps {
  title: string
  step: string
  /** Student screens use the phone shell; teacher screens stay full-width. */
  student?: boolean
}

export default function Placeholder({ title, step, student = false }: PlaceholderProps) {
  const body = (
    <div className="placeholder">
      <h1>{title}</h1>
      <p>Coming in {step}</p>
      <Link to={student ? '/home' : '/login'}>{student ? 'Back to home' : 'Back to login'}</Link>
    </div>
  )
  return student ? <StudentShell>{body}</StudentShell> : <div className="teacher-page">{body}</div>
}
