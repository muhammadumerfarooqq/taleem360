import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './screens/student/Login'
import Home from './screens/student/Home'
import Scan from './screens/student/Scan'
import Fetching from './screens/student/Fetching'
import Viewer from './screens/student/Viewer'
import Ask from './screens/student/Ask'
import Quiz from './screens/student/Quiz'
import Result from './screens/student/Result'
import TeacherDashboard from './screens/teacher/TeacherDashboard'
import TeacherProjector from './screens/teacher/TeacherProjector'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/scan" element={<Scan />} />
      <Route path="/fetching" element={<Fetching />} />
      <Route path="/viewer" element={<Viewer />} />
      <Route path="/ask" element={<Ask />} />
      <Route path="/quiz" element={<Quiz />} />
      <Route path="/result" element={<Result />} />
      <Route path="/teacher" element={<TeacherDashboard />} />
      <Route path="/teacher/projector" element={<TeacherProjector />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
