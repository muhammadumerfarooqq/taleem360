import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
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
import Progress from './screens/student/Progress'
import TeacherClasses from './screens/teacher/TeacherClasses'
import TeacherClassDetail from './screens/teacher/TeacherClassDetail'

// Student screens and teacher screens. In demo (mock) mode these wrappers do nothing.
const student = (page: ReactNode) => <ProtectedRoute role="student">{page}</ProtectedRoute>
const teacher = (page: ReactNode) => <ProtectedRoute role="teacher">{page}</ProtectedRoute>

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={student(<Home />)} />
      <Route path="/scan" element={student(<Scan />)} />
      <Route path="/fetching" element={student(<Fetching />)} />
      <Route path="/viewer" element={student(<Viewer />)} />
      <Route path="/ask" element={student(<Ask />)} />
      <Route path="/quiz" element={student(<Quiz />)} />
      <Route path="/progress" element={student(<Progress />)} />
      <Route path="/result" element={student(<Result />)} />
      <Route path="/teacher" element={teacher(<TeacherDashboard />)} />
      <Route path="/teacher/classes" element={teacher(<TeacherClasses />)} />
      <Route path="/teacher/classes/:classId" element={teacher(<TeacherClassDetail />)} />
      <Route path="/teacher/projector" element={teacher(<TeacherProjector />)} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
