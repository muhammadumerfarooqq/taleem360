import { Link } from 'react-router-dom'
import { HomeIcon, QuizIcon, ScanIcon } from './Icons'

const tabs = [
  { to: '/home', label: 'Home', Icon: HomeIcon },
  { to: '/scan', label: 'Scan', Icon: ScanIcon },
  { to: '/quiz', label: 'Quizzes', Icon: QuizIcon },
]

export default function TabBar({ active }: { active: string }) {
  return (
    <nav className="tabbar">
      {tabs.map(({ to, label, Icon }) => (
        <Link key={to} to={to} className={`tab${active === to ? ' active' : ''}`}>
          <Icon size={22} />
          {label}
        </Link>
      ))}
    </nav>
  )
}
