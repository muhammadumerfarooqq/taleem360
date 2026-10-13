import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type WheelEvent } from 'react'
import type { ContentPart, ModelInfo } from '../api'
import { buildScene, sphereGradientId, sphereStops, startView, type Prim, type View } from './scene3d'

interface Stage3DProps {
  model: ModelInfo
  parts: ContentPart[]
  selectedPartId: string
  onSelectPart: (partId: string) => void
}

interface Touch {
  x: number
  y: number
  sx: number
  sy: number
  drag: boolean
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const MIN_ZOOM = 0.7
const MAX_ZOOM = 1.35
const FRAME = 1 / 24 // about 24 frames a second is smooth enough and kinder to low-end phones

function drawPrim(p: Prim) {
  switch (p.kind) {
    case 'poly':
      return (
        <polygon key={p.key} points={p.pts} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} strokeLinejoin="round" />
      )
    case 'sphere':
      return (
        <g key={p.key}>
          <circle cx={p.cx} cy={p.cy} r={p.r} fill={`url(#${sphereGradientId(p.color)})`} />
          {p.ring && <circle cx={p.cx} cy={p.cy} r={p.r + 2.5} fill="none" stroke="#FFFFFF" strokeWidth="1.6" opacity=".9" />}
        </g>
      )
    case 'path':
      return (
        <path
          key={p.key}
          d={p.d}
          fill="none"
          stroke={p.stroke}
          strokeWidth={p.sw}
          strokeOpacity={p.opacity}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={p.dash}
        />
      )
    case 'shadow':
      return <ellipse key={p.key} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill="url(#shadow3d)" />
    case 'text':
      return (
        <text
          key={p.key}
          transform={p.matrix}
          fontSize={p.size}
          fontWeight="700"
          textAnchor="middle"
          dominantBaseline="central"
          fill={p.fill}
          fillOpacity={p.opacity}
        >
          {p.text}
        </text>
      )
  }
}

// The 3D stand-in for the viewer: a lit, shaded model you can turn with a finger or the mouse.
// Same props as ModelStage. Step 2 swaps both for the real <model-viewer>.
export default function Stage3D({ model, parts, selectedPartId, onSelectPart }: Stage3DProps) {
  const [, setTick] = useState(0)
  const view = useRef<View>(startView(model.id))
  const clock = useRef(0) // seconds since the stage appeared
  const lastTouch = useRef(-100) // clock time of the last drag, tap or key press
  const pointers = useRef<Map<number, Touch>>(new Map())
  const pinch = useRef(0)
  const still = useRef(false) // true when the person asked their device for less motion

  // A different model starts from its own camera angle.
  useEffect(() => {
    view.current = startView(model.id)
    clock.current = 0
    lastTouch.current = -100
    setTick((n) => (n + 1) % 1000000)
  }, [model.id])

  useEffect(() => {
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    still.current = reduce
    if (reduce) return
    let raf = 0
    let last = performance.now()
    let acc = 0
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      clock.current += dt
      acc += dt
      if (acc < FRAME) return
      acc = 0
      setTick((n) => (n + 1) % 1000000)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const bump = () => setTick((n) => (n + 1) % 1000000)

  // While nobody touches it, the model sways gently from side to side so it never looks like a picture.
  const swayNow = () =>
    still.current ? 0 : clamp((clock.current - lastTouch.current - 3) / 1.5, 0, 1) * 0.4 * Math.sin(clock.current * 0.45)

  // Called on any interaction: keeps the angle where it is and pauses the sway.
  const touch = () => {
    view.current.yaw += swayNow()
    lastTouch.current = clock.current
  }

  const pinchDistance = () => {
    const [a, b]: Touch[] = Array.from<Touch>(pointers.current.values())
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, drag: false })
    if (pointers.current.size === 2) pinch.current = pinchDistance()
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const p = pointers.current.get(e.pointerId)
    if (!p) return
    const dx = e.clientX - p.x
    const dy = e.clientY - p.y
    p.x = e.clientX
    p.y = e.clientY
    if (pointers.current.size >= 2) {
      const d = pinchDistance()
      if (pinch.current > 0 && d > 0) {
        touch()
        view.current.zoom = clamp((view.current.zoom * d) / pinch.current, MIN_ZOOM, MAX_ZOOM)
        bump()
      }
      pinch.current = d
      return
    }
    // A short wobble is still a tap on a hotspot. Only a real drag takes over the pointer.
    if (!p.drag) {
      if (Math.hypot(p.x - p.sx, p.y - p.sy) < 6) return
      p.drag = true
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // some browsers refuse capture for synthetic events; dragging still works without it
      }
    }
    touch()
    view.current.yaw += dx * 0.012
    view.current.pitch = clamp(view.current.pitch + dy * 0.008, 0.05, 0.9)
    bump()
  }

  function onPointerEnd(e: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId)
    pinch.current = 0
  }

  function onWheel(e: WheelEvent<HTMLDivElement>) {
    touch()
    view.current.zoom = clamp(view.current.zoom * (e.deltaY < 0 ? 1.08 : 0.93), MIN_ZOOM, MAX_ZOOM)
    bump()
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const v = view.current
    let handled = true
    if (e.key === 'ArrowLeft') v.yaw -= 0.12
    else if (e.key === 'ArrowRight') v.yaw += 0.12
    else if (e.key === 'ArrowUp') v.pitch = clamp(v.pitch - 0.06, 0.05, 0.9)
    else if (e.key === 'ArrowDown') v.pitch = clamp(v.pitch + 0.06, 0.05, 0.9)
    else if (e.key === '+' || e.key === '=') v.zoom = clamp(v.zoom * 1.1, MIN_ZOOM, MAX_ZOOM)
    else if (e.key === '-') v.zoom = clamp(v.zoom * 0.9, MIN_ZOOM, MAX_ZOOM)
    else handled = false
    if (handled) {
      touch()
      e.preventDefault()
      bump()
    }
  }

  const shown: View = {
    yaw: view.current.yaw + swayNow(),
    pitch: view.current.pitch,
    zoom: view.current.zoom,
  }
  const scene = buildScene(model.id, shown, clock.current, selectedPartId)

  return (
    <div
      className="stage-art stage3d"
      role="group"
      aria-label={`${model.title}, a 3D model. Drag to turn it, or use the arrow keys.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onWheel={onWheel}
      onKeyDown={onKeyDown}
    >
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <radialGradient id="shadow3d">
            <stop offset="0" stopColor="#000000" stopOpacity=".55" />
            <stop offset="1" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          {scene.colors.map((color) => {
            const [hi, mid, lo] = sphereStops(color)
            return (
              <radialGradient key={color} id={sphereGradientId(color)} cx=".36" cy=".32" r=".75">
                <stop offset="0" stopColor={hi} />
                <stop offset=".5" stopColor={mid} />
                <stop offset="1" stopColor={lo} />
              </radialGradient>
            )
          })}
        </defs>
        {scene.prims.map(drawPrim)}
      </svg>

      {parts.map((part) => {
        const a = Object.prototype.hasOwnProperty.call(scene.anchors, part.id) ? scene.anchors[part.id] : undefined
        if (!a) return null
        const active = part.id === selectedPartId
        const left = a[0] / 2 // the 200 x 200 box is the whole stage, so half the value is a percent
        const top = a[1] / 2
        return (
          <span key={part.id}>
            {active && (
              <span
                className="hotspot-label"
                style={
                  left > 62
                    ? { right: `calc(${100 - left}% + 16px)`, top: `${top}%`, transform: 'translateY(-50%)' }
                    : { left: `calc(${left}% + 16px)`, top: `${top}%`, transform: 'translateY(-50%)' }
                }
              >
                {part.nameEn}
              </span>
            )}
            <button
              type="button"
              className={`hotspot${active ? ' active' : ''}`}
              style={{ left: `${left}%`, top: `${top}%`, ['--part' as string]: part.color }}
              aria-label={part.nameEn}
              aria-pressed={active}
              onClick={() => {
                touch()
                onSelectPart(part.id)
              }}
            >
              <span className="hotspot-dot" />
            </button>
          </span>
        )
      })}
    </div>
  )
}
