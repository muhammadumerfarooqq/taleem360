import type { CSSProperties } from 'react'
import type { ModelInfo } from '../api'

interface ModelStageProps {
  model: ModelInfo
  selectedPartId: string
  onSelectPart: (partId: string) => void
}

// Where each part's hotspot and label sit on the flat stand-in (percent of the stage).
// Step 2 replaces this whole component with the real model-viewer; keep the props the same.
const hotspots: Record<
  string,
  { x: number; y: number; label: string; labelStyle: CSSProperties }
> = {
  veins: { x: 32.7, y: 14.7, label: 'Veins', labelStyle: { left: '31.7%', top: 0 } },
  'pulmonary-trunk': {
    x: 77.3,
    y: 25.7,
    label: 'Pulmonary trunk',
    labelStyle: { left: 'calc(77.3% + 16px)', top: '25.7%', transform: 'translateY(-50%)' },
  },
  valves: { x: 50, y: 50.3, label: 'Valves', labelStyle: { left: '46%', top: '56%' } },
  aorta: { x: 65, y: 12.3, label: '', labelStyle: {} },
}

const AORTA = 'M96 66 C94 20 138 12 152 44'
const PULMONARY = 'M118 68 C124 38 150 40 162 58'
const VEINS = 'M66 62 L66 16'
const VALVES = 'M100 74 L100 172'

export default function ModelStage({ model, selectedPartId, onSelectPart }: ModelStageProps) {
  const sel = selectedPartId
  const glow = (id: string, d: string, width: number, dash?: string) =>
    sel === id ? (
      <path
        d={d}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={width + 6}
        strokeLinecap="round"
        strokeDasharray={dash}
        opacity=".9"
      />
    ) : null

  return (
    <div className="stage-art">
      <svg
        aria-label="Interactive 3D heart model, drawn here as a flat stand-in"
        role="img"
        viewBox="0 0 200 200"
      >
        <ellipse cx="100" cy="190" rx="70" ry="8" fill="#000000" opacity=".35" />
        <path
          d="M100 185 C38 142 18 100 34 68 C50 38 90 44 100 70 C110 44 150 38 166 68 C182 100 162 142 100 185Z"
          fill="#E0566F"
          stroke="#9E2A41"
          strokeWidth="2"
        />
        {glow('valves', VALVES, 2, '4 4')}
        <path d={VALVES} stroke="#9E2A41" strokeWidth="2" strokeDasharray="4 4" />
        {glow('aorta', AORTA, 13)}
        <path d={AORTA} fill="none" stroke="#FFB020" strokeWidth="13" strokeLinecap="round" />
        {glow('pulmonary-trunk', PULMONARY, 10)}
        <path d={PULMONARY} fill="none" stroke="#5B86F0" strokeWidth="10" strokeLinecap="round" />
        {glow('veins', VEINS, 12)}
        <path d={VEINS} fill="none" stroke="#5B86F0" strokeWidth="12" strokeLinecap="round" />
        <path
          d="M50 96 C60 92 78 92 90 100"
          fill="none"
          stroke="#F4A3B1"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {model.parts.map((part) => {
        const h = hotspots[part.id]
        if (!h) return null
        const active = part.id === sel
        return (
          <span key={part.id}>
            {h.label && (
              <span className="hotspot-label" style={h.labelStyle}>
                {h.label}
              </span>
            )}
            <button
              type="button"
              className={`hotspot${active ? ' active' : ''}`}
              style={{ left: `${h.x}%`, top: `${h.y}%`, ['--part' as string]: part.color }}
              aria-label={part.name}
              aria-pressed={active}
              onClick={() => onSelectPart(part.id)}
            >
              <span className="hotspot-dot" />
            </button>
          </span>
        )
      })}
    </div>
  )
}
