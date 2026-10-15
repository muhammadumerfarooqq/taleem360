import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getHomeData, type HomeData } from '../../api'
import {
  AtomIcon,
  BoltIcon,
  ChevronRightIcon,
  HeartIcon,
  MonitorIcon,
  ScanIcon,
} from '../../components/Icons'
import StudentShell from '../../components/StudentShell'
import TabBar from '../../components/TabBar'

const subjectStyle: Record<string, { bg: string; icon: ReactNode }> = {
  biology: { bg: '#FDE7EB', icon: <HeartIcon color="#D6304A" /> },
  chemistry: { bg: '#E1F4F1', icon: <AtomIcon color="#0F766E" /> },
  physics: { bg: '#FEF0D2', icon: <BoltIcon color="#B45309" /> },
  cs: { bg: '#E4ECFB', icon: <MonitorIcon color="#1F4FBF" /> },
}

export default function Home() {
  const [data, setData] = useState<HomeData | null>(null)

  useEffect(() => {
    let alive = true
    getHomeData().then((d) => {
      if (alive) setData(d)
    })
    return () => {
      alive = false
    }
  }, [])

  const student = data?.student

  return (
    <StudentShell tone="light" bottomBar={<TabBar active="/home" />}>
      <div className="home">
        <div className="home-head">
          <div>
            <div className="greet">Assalam o Alaikum</div>
            <div className="who">{student?.name ?? ' '}</div>
          </div>
          <div className="head-right">
            <div className="chip">Class {student?.classLevel ?? ''}</div>
            <div className="avatar">{student?.name.charAt(0) ?? ''}</div>
          </div>
        </div>

        <Link to="/scan" className="hero">
          <div className="hero-copy">
            <div className="hero-kicker">Point · Scan · Explore</div>
            <div className="hero-title">Scan a diagram</div>
            <div className="hero-sub">Point at a figure in your book to open its 3D model</div>
            <span className="hero-cta">
              Open camera
              <ChevronRightIcon size={16} color="#0E1B2C" />
            </span>
          </div>
          <div className="hero-art" aria-hidden="true">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="56" fill="none" stroke="#14B8A6" strokeOpacity=".45" />
              <circle cx="60" cy="60" r="40" fill="none" stroke="#14B8A6" strokeOpacity=".3" strokeDasharray="3 5" />
              <g className="orbit-dot">
                <circle cx="60" cy="4" r="4.5" fill="#F59E0B" />
              </g>
            </svg>
            <div className="hero-lens">
              <ScanIcon size={28} color="#0E1B2C" />
            </div>
          </div>
        </Link>

        <div className="section-title">Browse by subject</div>
        <div className="subjects">
          {data?.subjects.map((s) => (
            <Link key={s.id} to={`/scan?subject=${encodeURIComponent(s.id)}`} className={`card subj-${s.id}`}>
              <div className="subject-icon" style={{ background: subjectStyle[s.id]?.bg }}>
                {subjectStyle[s.id]?.icon}
              </div>
              <span className="subject-mark" aria-hidden="true">
                {subjectStyle[s.id]?.icon}
              </span>
              <div className="subject-name">{s.name}</div>
              <div className="subject-topics">{s.examples}</div>
            </Link>
          ))}
        </div>

        <div className="section-title tight">Recently opened</div>
        <div className="recent">
          {data?.recent.map((r) => (
            <Link key={r.modelId} to={`/viewer?model=${encodeURIComponent(r.modelId)}`} className="recent-item">
              <div className="recent-icon">
                <HeartIcon size={28} color="#D6304A" />
              </div>
              <div className="recent-body">
                <div className="recent-title">{r.title}</div>
                <div className="recent-sub">{r.subject} · {r.chapter}</div>
              </div>
              <ChevronRightIcon size={18} color="#5B6B7D" />
            </Link>
          ))}
        </div>
      </div>
    </StudentShell>
  )
}
