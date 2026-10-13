import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { USE_MOCK, type ContentPart, type ModelInfo } from '../api'
import { splitSharedMaterials, type Vec3 } from './glbSplit'

interface HeartViewerProps {
  model: ModelInfo
  parts: ContentPart[]
  selectedPartId: string
  onSelectPart: (partId: string) => void
  /** Called once if the .glb or WebGL does not work. ModelStage then shows the flat heart instead. */
  onFail: () => void
}

// The only place that maps content part ids to the mesh names inside heart.glb.
// All nine meshes in the file have a chip. (Checked by rendering each mesh on its own, step 2D.)
export const HEART_PART_TO_MESH: Record<string, string> = {
  veins: 'Veins', // thin blue-white vessels on the surface (the cardiac veins)
  aorta: 'Aorta',
  valves: 'Valves', // small cluster at the root of the great vessels, inside the heart
  'pulmonary-trunk': 'Pulmonary_trunk',
  'heart-muscle': 'Hart_basis', // the main muscle body
  'coronary-vessels': 'Arteries2', // red branching vessels on the surface
  'av-valves': 'Avvalves', // leaflets and strings between the chambers, inside the heart
  'atrial-appendage': 'Heartear', // the small ear-shaped pouch
  ligament: 'Ligament', // the thin yellow cord between the aorta and the pulmonary trunk
}
const MESH_TO_PART: Record<string, string> = Object.fromEntries(
  Object.entries(HEART_PART_TO_MESH).map(([part, mesh]) => [mesh, part]),
)

// Highlight: #14B8A6 at 40% strength as the glow, the other parts a little darker.
const GLOW: [number, number, number] = [0.078 * 0.4, 0.722 * 0.4, 0.651 * 0.4]
const OFF: [number, number, number] = [0, 0, 0]
const DIM = 0.6
const ZOOM_TO_PART = '95%'
const AIM = 0.5 // how far the camera target moves toward the part (0 = stay centred, 1 = part centre)
const TAP_SLOP = 6 // pixels: moving further than this is a drag, not a tap
const LABEL_EDGE = 4 // pixels of space kept between a label and the edge of the stage

// The bits of <model-viewer> that this file uses (the package's own types are not needed at build time).
interface ViewerMaterial {
  name: string
  ensureLoaded(): Promise<void> // materials load lazily: wait before reading or changing colours
  setEmissiveFactor(rgb: [number, number, number]): void
  pbrMetallicRoughness: {
    baseColorFactor: number[]
    setBaseColorFactor(rgba: [number, number, number, number]): void
  }
}

interface Vector3D {
  x: number
  y: number
  z: number
}

interface ViewerElement extends HTMLElement {
  model?: { materials: ViewerMaterial[] }
  materialFromPoint(clientX: number, clientY: number): ViewerMaterial | null
  getCameraOrbit(): { theta: number; phi: number; radius: number }
  getBoundingBoxCenter(): Vector3D
  jumpCameraToGoal(): void
  queryHotspot(name: string): { canvasPosition: Vector3D } | null
  positionAndNormalFromPoint(clientX: number, clientY: number): { position: Vector3D; normal: Vector3D } | null
  updateHotspot(config: { name: string; position?: string; normal?: string }): void
  cameraTarget: string
  cameraOrbit: string
}

const meters = (v: Vec3 | Vector3D) => (Array.isArray(v) ? `${v[0]}m ${v[1]}m ${v[2]}m` : `${v.x}m ${v.y}m ${v.z}m`)

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

// Until a label's real surface direction is known, it faces away from the middle of the heart.
function outwardNormal(c: Vec3, mid: Vec3): string {
  const d = [c[0] - mid[0], c[1] - mid[1], c[2] - mid[2]]
  const len = Math.hypot(d[0], d[1], d[2])
  return len < 1e-6 ? '0m 0m 1m' : `${d[0] / len}m ${d[1] / len}m ${d[2] / len}m`
}

// The real 3D heart. Loads <model-viewer> on demand so other screens stay small.
export default function HeartViewer({ model, parts, selectedPartId, onSelectPart, onFail }: HeartViewerProps) {
  const [src, setSrc] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [el, setEl] = useState<ViewerElement | null>(null)
  const [labelsOn, setLabelsOn] = useState(false) // component state only, nothing is saved
  const failed = useRef(false)
  const centers = useRef<Record<string, Vec3>>({})
  const baseColors = useRef<Map<string, number[]>>(new Map())
  const firstAim = useRef(true)
  const down = useRef<{ x: number; y: number } | null>(null)

  const fail = (why: string) => {
    if (failed.current) return
    failed.current = true
    console.warn(`Heart 3D model unavailable, showing the flat heart instead: ${why}`)
    onFail()
  }

  // Load <model-viewer> and the .glb. Mock mode uses the local file; real mode uses the URL from getModel.
  useEffect(() => {
    let alive = true
    let blobUrl: string | null = null
    const url = USE_MOCK ? `${import.meta.env.BASE_URL}models/heart.glb` : model.glbUrl
    ;(async () => {
      try {
        if (!url) throw new Error('no model URL')
        if (!webglAvailable()) throw new Error('WebGL is not available')
        await import('@google/model-viewer')
        const result = await splitSharedMaterials(url)
        if (result.isBlob) blobUrl = result.src
        if (!alive) return
        centers.current = result.centers
        setSrc(result.src)
      } catch (e) {
        if (alive) fail(e instanceof Error ? e.message : String(e))
      }
    })()
    return () => {
      alive = false
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.glbUrl])

  // When the model has loaded, remember each material's own colour so it can be dimmed and restored.
  useEffect(() => {
    if (!el) return
    let alive = true
    const onLoad = async () => {
      const materials = el.model?.materials ?? []
      try {
        await Promise.all(materials.map((m) => m.ensureLoaded()))
      } catch (e) {
        if (alive) fail(e instanceof Error ? e.message : String(e))
        return
      }
      if (!alive) return
      baseColors.current.clear()
      for (const m of materials) baseColors.current.set(m.name, [...m.pbrMetallicRoughness.baseColorFactor])
      firstAim.current = true
      setReady(true)
    }
    const onError = () => fail('the .glb could not be loaded')
    el.addEventListener('load', onLoad)
    el.addEventListener('error', onError)
    if (el.model) onLoad() // it may already have loaded before the listeners were added
    return () => {
      alive = false
      el.removeEventListener('load', onLoad)
      el.removeEventListener('error', onError)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el])

  // Highlight the selected part (teal glow, the rest a little darker) and move the camera toward it.
  useEffect(() => {
    if (!el || !ready || !el.model) return
    const mesh = HEART_PART_TO_MESH[selectedPartId]
    for (const m of el.model.materials) {
      const selected = !!mesh && m.name === mesh
      m.setEmissiveFactor(selected ? GLOW : OFF)
      const base = baseColors.current.get(m.name)
      if (base) {
        const k = mesh && !selected ? DIM : 1
        m.pbrMetallicRoughness.setBaseColorFactor([base[0] * k, base[1] * k, base[2] * k, base[3]])
      }
    }
    const { theta, phi } = el.getCameraOrbit()
    const c = mesh ? centers.current[mesh] : undefined
    if (c) {
      // Move only part of the way, so the whole heart stays in view.
      const mid = el.getBoundingBoxCenter()
      const at = [mid.x + (c[0] - mid.x) * AIM, mid.y + (c[1] - mid.y) * AIM, mid.z + (c[2] - mid.z) * AIM]
      el.cameraTarget = `${at[0]}m ${at[1]}m ${at[2]}m`
    } else {
      el.cameraTarget = 'auto'
    }
    el.cameraOrbit = `${theta}rad ${phi}rad ${c ? ZOOM_TO_PART : '100%'}`
    if (firstAim.current) {
      firstAim.current = false
      el.jumpCameraToGoal() // no swoop on the first frame
    }
  }, [el, ready, selectedPartId])

  // The parts that get a floating label: every part with a mesh whose centre is known.
  const labelled = parts.filter((p) => {
    const mesh = HEART_PART_TO_MESH[p.id]
    return !!mesh && !!centers.current[mesh]
  })
  const mid: Vec3 = (() => {
    const all = Object.values(centers.current)
    if (!all.length) return [0, 0, 0]
    return [0, 1, 2].map((i) => all.reduce((sum, c) => sum + c[i], 0) / all.length) as Vec3
  })()

  // Labels hide when their part faces away from the camera. <model-viewer> does that from each hotspot's
  // normal, so once the model is on screen, find a real surface normal for each part: look for the part's
  // own surface next to the label's spot. Parts that cannot be seen from outside (the two valve meshes)
  // keep the "away from the middle" direction. The anchor stays at the centre of the mesh.
  useEffect(() => {
    if (!el || !ready) return
    const timer = window.setTimeout(() => {
      const box = el.getBoundingClientRect()
      for (const p of labelled) {
        const mesh = HEART_PART_TO_MESH[p.id]
        const slot = `hotspot-${p.id}`
        const q = el.queryHotspot(slot)
        if (!q) continue
        let normal: Vector3D | null = null
        for (let r = 0; r <= 150 && !normal; r += 5) {
          const steps = r === 0 ? 1 : 12
          for (let k = 0; k < steps && !normal; k++) {
            const a = (k / steps) * Math.PI * 2
            const x = box.left + q.canvasPosition.x + Math.cos(a) * r
            const y = box.top + q.canvasPosition.y + Math.sin(a) * r
            if (x < box.left || x > box.right || y < box.top || y > box.bottom) continue
            if (el.materialFromPoint(x, y)?.name === mesh) normal = el.positionAndNormalFromPoint(x, y)?.normal ?? null
          }
        }
        if (normal) el.updateHotspot({ name: slot, position: meters(centers.current[mesh]), normal: meters(normal) })
      }
    }, 450)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, ready])

  // Keep every label inside the stage, and keep the labels that are showing from sitting on top of each
  // other: a label near an edge is nudged back, and one that overlaps another moves to the nearest free
  // slot above or below. The selected label is placed first, so it keeps its spot.
  useEffect(() => {
    if (!el || !ready) return
    let raf = 0
    const GAP = 2
    const clamp = () => {
      raf = 0
      const w = el.clientWidth
      const h = el.clientHeight
      const items: { node: HTMLElement; x: number; y: number; hw: number; hh: number; sel: boolean; shown: boolean }[] = []
      el.querySelectorAll<HTMLElement>('.heart-label').forEach((node) => {
        const q = el.queryHotspot(node.getAttribute('slot') ?? '')
        const pill = node.firstElementChild as HTMLElement | null
        if (!q || !pill) return
        const sel = node.classList.contains('sel')
        items.push({
          node,
          x: q.canvasPosition.x,
          y: q.canvasPosition.y,
          hw: pill.offsetWidth / 2,
          hh: pill.offsetHeight / 2,
          sel,
          shown: sel || (node.classList.contains('show') && node.hasAttribute('data-visible')),
        })
      })
      const inX = (it: { hw: number }, x: number) => Math.min(Math.max(x, it.hw + LABEL_EDGE), w - it.hw - LABEL_EDGE)
      const inY = (it: { hh: number }, y: number) => Math.min(Math.max(y, it.hh + LABEL_EDGE), h - it.hh - LABEL_EDGE)
      const placed: { x: number; y: number; hw: number; hh: number }[] = []
      const order = [...items].sort((a, b) => Number(b.sel) - Number(a.sel) || a.y - b.y)
      for (const it of order) {
        const px = inX(it, it.x)
        let py = inY(it, it.y)
        if (it.shown) {
          const free = (y: number) =>
            !placed.some((o) => Math.abs(o.x - px) < o.hw + it.hw + GAP && Math.abs(o.y - y) < o.hh + it.hh + GAP)
          if (!free(py)) {
            // Look for the nearest free slot above or below, inside the stage.
            const lo = it.hh + LABEL_EDGE
            const hi = h - it.hh - LABEL_EDGE
            for (let d = 4; d <= h; d += 4) {
              if (py + d <= hi && free(py + d)) {
                py += d
                break
              }
              if (py - d >= lo && free(py - d)) {
                py -= d
                break
              }
            }
          }
          placed.push({ x: px, y: py, hw: it.hw, hh: it.hh })
        }
        it.node.style.setProperty('--dx', `${px - it.x}px`)
        it.node.style.setProperty('--dy', `${py - it.y}px`)
      }
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(clamp)
    }
    el.addEventListener('camera-change', schedule)
    schedule()
    const late = window.setTimeout(schedule, 600) // once more after the camera has settled
    return () => {
      el.removeEventListener('camera-change', schedule)
      window.clearTimeout(late)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [el, ready, labelsOn, selectedPartId])

  // A tap (not a drag) on the model selects the part under the finger, if it has a chip.
  function onPointerDown(e: PointerEvent) {
    down.current = { x: e.clientX, y: e.clientY }
  }

  function onPointerUp(e: PointerEvent) {
    const start = down.current
    down.current = null
    if (!el || !start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_SLOP) return
    const hit = el.materialFromPoint(e.clientX, e.clientY)
    const partId = hit ? MESH_TO_PART[hit.name] : undefined
    if (partId && parts.some((p) => p.id === partId)) onSelectPart(partId)
  }

  // The Labels button must not count as a tap on the model underneath it.
  const stop = (e: PointerEvent) => e.stopPropagation()

  return (
    <div className="heart-viewer" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      {src && (
        <model-viewer
          ref={(node) => setEl(node as ViewerElement | null)}
          src={src}
          alt="3D model of the human heart. Drag to turn it, pinch to zoom, tap a part to select it."
          camera-controls
          touch-action="pan-y"
          interaction-prompt="none"
          environment-image="neutral"
          shadow-intensity="0"
          exposure="1.1"
          interpolation-decay="110"
          field-of-view="28deg"
          camera-orbit="0deg 78deg 100%"
          loading="eager"
          style={{ width: '100%', height: '100%', background: 'transparent' }}
        >
          {labelled.map((p) => {
            const mesh = HEART_PART_TO_MESH[p.id]
            const c = centers.current[mesh]
            const selected = p.id === selectedPartId
            return (
              <div
                key={p.id}
                slot={`hotspot-${p.id}`}
                className={`heart-label${labelsOn || selected ? ' show' : ''}${selected ? ' sel' : ''}`}
                data-position={meters(c)}
                data-normal={outwardNormal(c, mid)}
                data-visibility-attribute="visible"
                aria-hidden="true"
              >
                <span className="heart-label-pill">
                  <i style={{ background: p.color }} />
                  {p.nameEn}
                </span>
              </div>
            )
          })}
        </model-viewer>
      )}
      {ready && labelled.length > 0 && (
        <button
          type="button"
          className={`heart-labels-btn${labelsOn ? ' on' : ''}`}
          aria-pressed={labelsOn}
          onPointerDown={stop}
          onPointerUp={stop}
          onClick={() => setLabelsOn((v) => !v)}
        >
          Labels
        </button>
      )}
      {!ready && (
        <div className="heart-loading" role="status">
          <span className="heart-spinner" aria-hidden="true" />
          <span className="sr-only">Loading the 3D heart</span>
        </div>
      )}
    </div>
  )
}
