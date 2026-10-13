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
// Meshes not listed here (Hart_basis, Avvalves, Ligament, Heartear, Arteries2) have no chip:
// they are drawn normally and cannot be selected.
export const HEART_PART_TO_MESH: Record<string, string> = {
  veins: 'Veins',
  aorta: 'Aorta',
  valves: 'Valves',
  'pulmonary-trunk': 'Pulmonary_trunk',
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

interface ViewerElement extends HTMLElement {
  model?: { materials: ViewerMaterial[] }
  materialFromPoint(clientX: number, clientY: number): ViewerMaterial | null
  getCameraOrbit(): { theta: number; phi: number; radius: number }
  getBoundingBoxCenter(): { x: number; y: number; z: number }
  jumpCameraToGoal(): void
  cameraTarget: string
  cameraOrbit: string
}

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

// The real 3D heart. Loads <model-viewer> on demand so other screens stay small.
export default function HeartViewer({ model, parts, selectedPartId, onSelectPart, onFail }: HeartViewerProps) {
  const [src, setSrc] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [el, setEl] = useState<ViewerElement | null>(null)
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
        />
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
