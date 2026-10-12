import type { ReactNode } from 'react'

interface StudentShellProps {
  children: ReactNode
  /** Page tone: sets the column background. */
  tone?: 'light' | 'dark' | 'camera' | 'stage'
  /** Fixed bar at the bottom of the column (e.g. TabBar). Stays put while content scrolls. */
  bottomBar?: ReactNode
  /** Decorations clipped to the column (e.g. Login rings). */
  decor?: ReactNode
}

/**
 * The ONE layout for every student screen.
 * Phone (<=480px): fills the viewport. Wider: one centred phone-sized column.
 */
export default function StudentShell({ children, tone = 'light', bottomBar, decor }: StudentShellProps) {
  return (
    <div className="shell-page">
      <div className={`shell shell-${tone}`}>
        {decor}
        <div className="shell-scroll">{children}</div>
        {bottomBar}
      </div>
    </div>
  )
}
