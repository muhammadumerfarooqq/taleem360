import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { ChartIcon, HomeIcon, QuizIcon, ScanIcon } from './Icons'

const tabs = [
  { to: '/home', label: 'Home', Icon: HomeIcon },
  { to: '/scan', label: 'Scan', Icon: ScanIcon },
  { to: '/quiz', label: 'Quizzes', Icon: QuizIcon },
]

// With real sign-in there is a fourth tab, My progress. In demo mode the bar is exactly as before.
const progressTab = { to: '/progress', label: 'Progress', Icon: ChartIcon }

export default function TabBar({ active }: { active: string }) {
  const { realAuth } = useAuth()
  const shown = realAuth ? [...tabs, progressTab] : tabs
  return (
    <nav className="tabbar">
      {shown.map(({ to, label, Icon }) => (
        <Link key={to} to={to} className={`tab${active === to ? ' active' : ''}`}>
          <Icon size={22} />
          {label}
        </Link>
      ))}
    </nav>
  )
}
