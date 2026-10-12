import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './screens/student/Login'
import Home from './screens/student/Home'
import Placeholder from './screens/Placeholder'

const later: { path: string; title: string; step: string; student: boolean }[] = [
  { path: '/scan', title: 'Scan', step: '1B', student: true },
  { path: '/fetching', title: 'Fetching model', step: '1B', student: true },
  { path: '/viewer', title: '3D viewer', step: '1B', student: true },
  { path: '/ask', title: 'Ask the AI tutor', step: '1B', student: true },
  { path: '/quiz', title: 'Quiz', step: '1C', student: true },
  { path: '/result', title: 'Quiz result', step: '1C', student: true },
  { path: '/teacher', title: 'Teacher dashboard', step: '1C', student: false },
  { path: '/teacher/projector', title: 'Teacher projector', step: '1C', student: false },
]

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home />} />
      {later.map((r) => (
        <Route
          key={r.path}
          path={r.path}
          element={<Placeholder title={r.title} step={r.step} student={r.student} />}
        />
      ))}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
