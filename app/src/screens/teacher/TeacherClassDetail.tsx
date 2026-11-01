import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import CodeCopy from '../../components/CodeCopy'
import TeacherLayout from '../../components/TeacherLayout'
import { getClassDetail, type ClassDetail } from '../../lib/classes'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

// One class: its join code and the students who joined (read only). Real sign-in only.
export default function TeacherClassDetail() {
  const { classId = '' } = useParams()
  const { realAuth, user } = useAuth()
  const [detail, setDetail] = useState<ClassDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!realAuth || !user || !classId) return
    let alive = true
    setDetail(null)
    setError('')
    getClassDetail(classId, user.id).then((res) => {
      if (!alive) return
      if (res.ok) setDetail(res.data)
      else setError(res.message)
    })
    return () => {
      alive = false
    }
  }, [realAuth, user, classId])

  const back = (
    <Link to="/teacher/classes" className="cls-link">
      ← All classes
    </Link>
  )

  if (!realAuth) {
    return (
      <TeacherLayout active="classes">
        <div className="t-card">
          Classes need real sign-in, so they are not available in demo mode. {back}
        </div>
      </TeacherLayout>
    )
  }

  if (error) {
    return (
      <TeacherLayout active="classes">
        <div className="t-card" role="alert">
          <p>{error}</p>
          {back}
        </div>
      </TeacherLayout>
    )
  }

  if (!detail) {
    return (
      <TeacherLayout active="classes">
        <div className="t-card" role="status">
          Loading the class…
        </div>
      </TeacherLayout>
    )
  }

  const { info, students, studentsReadable } = detail

  return (
    <TeacherLayout active="classes">
      <div className="t-head">
        <div>
          {back}
          <h1>{info.name}</h1>
          <div className="t-sub">
            {info.grade ? `Grade ${info.grade} · ` : ''}
            {studentsReadable ? `${students.length} ${students.length === 1 ? 'student' : 'students'}` : 'students: not available'}
          </div>
        </div>
      </div>

      {info.joinCode && (
        <section className="t-card cls-made" aria-label="Join code">
          <div className="cls-made-title">Join code. Students type this in the Join a class box on their Home screen.</div>
          <CodeCopy code={info.joinCode} />
        </section>
      )}

      <section className="t-card" aria-label="Students">
        <h2>Students</h2>
        {!studentsReadable ? (
          <p className="cls-empty">We could not read the student list for this class.</p>
        ) : students.length === 0 ? (
          <p className="cls-empty">No students have joined yet. Share the code above.</p>
        ) : (
          <div className="t-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.studentId}>
                    <td className="cls-roll">{s.rollNo ?? '—'}</td>
                    <td className="strong-cell">{s.name ?? 'Name not available'}</td>
                    <td className="cls-email">{s.classLogin ? 'Class login' : (s.email ?? '—')}</td>
                    <td>{formatDate(s.joinedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </TeacherLayout>
  )
}
