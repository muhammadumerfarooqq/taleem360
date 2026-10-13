import type { ReactElement } from 'react'

// The flat, printed-in-the-book versions of the non-biology sample figures, for the Scan screen.
// (The 3D versions in the viewer are in scene3d.ts and Stage3D.tsx.)

interface Palette {
  amber: string
  blue: string
  teal: string
  red: string
  steel: string
  ink: string
  rim: string
  chip: string
  boardFill: string
  boardLine: string
  trace: string
  slot: string
}

// Printed on the textbook page in the scanner.
const bookPalette: Palette = {
  amber: '#D98A00',
  blue: '#4A74D8',
  teal: '#0F9A8C',
  red: '#B3283F',
  steel: '#7B8794',
  ink: '#4B4638',
  rim: '#F4F1E6',
  chip: '#CBD5E1',
  boardFill: '#BFE3D0',
  boardLine: '#3E7A5F',
  trace: '#7DBB9C',
  slot: '#8FC2A8',
}

const WHITE = '#FFFFFF'

// ---------- Chemistry: carbon atom (2 electrons in the K shell, 4 in the L shell) ----------

const K_RADIUS = 38
const L_RADIUS = 74
const K_ELECTRONS = [
  [138, 100],
  [62, 100],
]
const L_ELECTRONS = [
  [152.3, 47.7],
  [152.3, 152.3],
  [47.7, 152.3],
  [47.7, 47.7],
]
const NUCLEUS_PARTICLES = [
  [108, 100],
  [104, 107],
  [96, 107],
  [92, 100],
  [96, 93],
  [104, 93],
]

function atom(p: Palette, sel: string): ReactElement {
  return (
    <g>
      {sel === 'l-shell' && (
        <circle cx="100" cy="100" r={L_RADIUS} fill="none" stroke={WHITE} strokeWidth="9" opacity=".9" />
      )}
      <circle cx="100" cy="100" r={L_RADIUS} fill="none" stroke={p.teal} strokeWidth="3" />
      {sel === 'k-shell' && (
        <circle cx="100" cy="100" r={K_RADIUS} fill="none" stroke={WHITE} strokeWidth="9" opacity=".9" />
      )}
      <circle cx="100" cy="100" r={K_RADIUS} fill="none" stroke={p.blue} strokeWidth="3" />
      {K_ELECTRONS.map(([x, y]) => (
        <circle key={`k${x}`} cx={x} cy={y} r="5" fill={p.blue} stroke={p.rim} strokeWidth="1.5" />
      ))}
      {sel === 'nucleus' && (
        <circle cx="100" cy="100" r="19" fill="none" stroke={WHITE} strokeWidth="3" opacity=".9" />
      )}
      <circle cx="100" cy="100" r="16" fill={p.amber} opacity=".3" />
      {NUCLEUS_PARTICLES.map(([x, y], i) => (
        <circle
          key={`n${i}`}
          cx={x}
          cy={y}
          r="5.5"
          fill={i % 2 === 0 ? p.amber : p.steel}
          stroke={p.rim}
          strokeWidth="1"
        />
      ))}
      {sel === 'valence-electrons' &&
        L_ELECTRONS.map(([x, y]) => (
          <circle key={`h${x}${y}`} cx={x} cy={y} r="10" fill="none" stroke={WHITE} strokeWidth="3" opacity=".9" />
        ))}
      {L_ELECTRONS.map(([x, y]) => (
        <circle key={`l${x}${y}`} cx={x} cy={y} r="6" fill={p.red} stroke={p.rim} strokeWidth="1.5" />
      ))}
    </g>
  )
}

// ---------- Physics: simple DC electric motor ----------

const COIL = 'M70 58 H130 V112 H70 Z'
const COMMUTATOR_LEFT = 'M98 127.15 A13 13 0 0 0 98 152.85'
const COMMUTATOR_RIGHT = 'M102 127.15 A13 13 0 0 1 102 152.85'

function motor(p: Palette, sel: string): ReactElement {
  return (
    <g>
      <path
        d="M46 78 H154 M46 120 H154"
        fill="none"
        stroke={p.steel}
        strokeWidth="1.5"
        strokeDasharray="3 4"
        opacity=".5"
      />

      {sel === 'magnet' && (
        <>
          <rect x="7" y="61" width="40" height="74" rx="6" fill={WHITE} opacity=".9" />
          <rect x="153" y="61" width="40" height="74" rx="6" fill={WHITE} opacity=".9" />
        </>
      )}
      <rect x="10" y="64" width="34" height="68" rx="4" fill={p.red} />
      <rect x="156" y="64" width="34" height="68" rx="4" fill={p.blue} />
      <text x="27" y="98" textAnchor="middle" dominantBaseline="central" fontSize="20" fontWeight="700" fill={WHITE}>
        N
      </text>
      <text x="173" y="98" textAnchor="middle" dominantBaseline="central" fontSize="20" fontWeight="700" fill={WHITE}>
        S
      </text>

      {sel === 'coil' && (
        <path d={COIL} fill="none" stroke={WHITE} strokeWidth="12" strokeLinejoin="round" opacity=".9" />
      )}
      <path d={COIL} fill="none" stroke={p.amber} strokeWidth="6" strokeLinejoin="round" />
      <path d="M78 66 H122 V104 H78 Z" fill="none" stroke={p.amber} strokeWidth="2" opacity=".6" />
      <path d="M100 112 V127" stroke={p.steel} strokeWidth="3" />

      {sel === 'commutator' && (
        <>
          <path d={COMMUTATOR_LEFT} fill="none" stroke={WHITE} strokeWidth="13" opacity=".9" />
          <path d={COMMUTATOR_RIGHT} fill="none" stroke={WHITE} strokeWidth="13" opacity=".9" />
        </>
      )}
      <path d={COMMUTATOR_LEFT} fill="none" stroke={p.teal} strokeWidth="7" />
      <path d={COMMUTATOR_RIGHT} fill="none" stroke={p.teal} strokeWidth="7" opacity=".7" />

      {sel === 'brushes' && (
        <>
          <rect x="53" y="132" width="37" height="16" rx="4" fill={WHITE} opacity=".9" />
          <rect x="110" y="132" width="37" height="16" rx="4" fill={WHITE} opacity=".9" />
        </>
      )}
      <rect x="56" y="135" width="31" height="10" rx="2" fill={p.blue} />
      <rect x="113" y="135" width="31" height="10" rx="2" fill={p.blue} />

      <path d="M56 140 H44 V186 H94 M144 140 H156 V186 H106" fill="none" stroke={p.ink} strokeWidth="2.5" />
      <path d="M94 176 V196" stroke={p.ink} strokeWidth="3" />
      <path d="M106 181 V191" stroke={p.ink} strokeWidth="5" />
    </g>
  )
}

// ---------- Computer Science: inside a computer ----------

function computer(p: Palette, sel: string): ReactElement {
  return (
    <g>
      {sel === 'motherboard' && <rect x="10" y="10" width="180" height="180" rx="13" fill={WHITE} opacity=".9" />}
      <rect x="14" y="14" width="172" height="172" rx="10" fill={p.boardFill} stroke={p.boardLine} strokeWidth="2" />
      <path
        d="M94 62 H118 M66 90 V116 M118 66 V116 H130 M96 140 H128"
        fill="none"
        stroke={p.trace}
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".7"
      />

      {sel === 'cpu' && <rect x="34" y="30" width="64" height="64" rx="9" fill={WHITE} opacity=".9" />}
      <rect x="38" y="34" width="56" height="56" rx="6" fill={p.chip} stroke={p.amber} strokeWidth="3" />
      <text x="66" y="50" textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="700" fill={p.amber}>
        CPU
      </text>

      {sel === 'ram' && <rect x="115" y="25" width="40" height="82" rx="6" fill={WHITE} opacity=".9" />}
      <rect x="120" y="30" width="10" height="72" rx="2" fill={p.blue} />
      <rect x="138" y="30" width="10" height="72" rx="2" fill={p.blue} />

      {sel === 'storage' && <rect x="30" y="112" width="92" height="54" rx="8" fill={WHITE} opacity=".9" />}
      <rect x="34" y="116" width="84" height="46" rx="4" fill={p.chip} stroke={p.teal} strokeWidth="3" />
      <text x="58" y="139" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="700" fill={p.teal}>
        SSD
      </text>

      <rect x="128" y="124" width="50" height="8" rx="2" fill={p.slot} />
      <rect x="128" y="140" width="50" height="8" rx="2" fill={p.slot} />
    </g>
  )
}

// ---------- what the Scan screen uses ----------

const bookDrawings: Record<string, { aria: string; draw: (p: Palette, sel: string) => ReactElement }> = {
  'carbon-atom': { aria: 'Textbook figure of a carbon atom', draw: atom },
  'dc-motor': { aria: 'Textbook figure of an electric motor', draw: motor },
  'computer-hardware': { aria: 'Textbook figure of the inside of a computer', draw: computer },
}

// The textbook-page version of a model's drawing, for the Scan screen. Returns null for unknown ids.
export function BookFigure({ modelId }: { modelId: string }) {
  if (!Object.prototype.hasOwnProperty.call(bookDrawings, modelId)) return null
  const { aria, draw } = bookDrawings[modelId]
  return (
    <svg aria-label={aria} role="img" viewBox="0 0 200 200">
      {draw(bookPalette, '')}
    </svg>
  )
}
