// A very small 3D engine for the sample models: shaded solids drawn as SVG, no libraries.
// It only turns a scene description into flat shapes (polygons, circles, paths) for one camera angle.
// Step 2 replaces all of this with the real <model-viewer> and .glb files, so keep it simple.
//
// World: x to the right, y up, z towards the viewer. Camera space is the same after the model is
// turned by yaw (around y) and pitch (around x). Output is in a 200 x 200 box, like the old flat art.

export type V3 = [number, number, number]

export interface View {
  yaw: number
  pitch: number
  zoom: number
}

interface Base {
  key: string
  depth: number // camera-space z: bigger is nearer. Layer 1 is drawn far to near.
  layer: 0 | 1 // 0: ground and board, drawn first in the order added. 1: everything else, sorted by depth
}

export type Prim =
  | (Base & { kind: 'poly'; pts: string; fill: string; stroke: string; sw: number })
  | (Base & { kind: 'sphere'; cx: number; cy: number; r: number; color: string; ring: boolean })
  | (Base & { kind: 'path'; d: string; stroke: string; sw: number; opacity: number; dash?: string })
  | (Base & { kind: 'shadow'; cx: number; cy: number; rx: number; ry: number })
  | (Base & { kind: 'glow'; cx: number; cy: number; r: number; opacity: number })
  | (Base & { kind: 'text'; text: string; matrix: string; size: number; fill: string; opacity: number })

export interface SceneOut {
  prims: Prim[]
  anchors: Record<string, [number, number]> // part id -> hotspot position in the 200 x 200 box
  colors: string[] // sphere colours used (the renderer needs one gradient for each)
}

const DIST = 5 // camera distance: gives a gentle perspective
const LIGHT: V3 = norm([-0.35, 0.65, 0.68]) // from the upper left, in front

// ---------- small vector helpers ----------

function norm(v: V3): V3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function rotY(v: V3, a: number): V3 {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c]
}
function rotX(v: V3, a: number): V3 {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c]
}

// ---------- colour helpers ----------

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Brightness b (0..1+) darkens the colour, lift (0..1) then mixes it towards white.
function shade(hex: string, b: number, lift = 0): string {
  const [r, g, bl] = rgb(hex)
  const f = (v: number) => {
    const d = v * b
    return Math.round(clamp(d + (255 - d) * lift, 0, 255))
  }
  return `rgb(${f(r)},${f(g)},${f(bl)})`
}

export function sphereGradientId(color: string): string {
  return `sg${color.slice(1)}`
}

// The three stops of a sphere's gradient: highlight, body, shadow.
export function sphereStops(color: string): [string, string, string] {
  return [shade(color, 1, 0.62), shade(color, 1), shade(color, 0.42)]
}

// ---------- the drawing context ----------

class Ctx {
  prims: Prim[] = []
  colors = new Set<string>()
  private n = 0

  constructor(
    readonly view: View,
    private center: V3,
    private scale: number,
    private selected: string,
  ) {}

  private cam(p: V3): V3 {
    const q: V3 = [p[0] - this.center[0], p[1] - this.center[1], p[2] - this.center[2]]
    return rotX(rotY(q, this.view.yaw), this.view.pitch)
  }
  private camN(n: V3): V3 {
    return rotX(rotY(n, this.view.yaw), this.view.pitch)
  }
  private persp(c: V3): number {
    return DIST / (DIST - c[2])
  }
  private scr(c: V3): [number, number] {
    const s = this.scale * this.view.zoom * this.persp(c)
    return [100 + c[0] * s, 100 - c[1] * s]
  }
  private key(): string {
    this.n += 1
    return `p${this.n}`
  }
  isSel(part: string): boolean {
    return part !== '' && part === this.selected
  }

  /** Where a point of the model appears in the 200 x 200 box (for hotspots). */
  anchor(p: V3): [number, number] {
    return this.scr(this.cam(p))
  }

  private face(
    pts: V3[],
    normal: V3,
    color: string,
    part: string,
    layer: 0 | 1,
    spin: number,
  ): void {
    const world = spin ? pts.map((p) => rotY(p, spin)) : pts
    const nw = spin ? rotY(normal, spin) : normal
    const cp = world.map((p) => this.cam(p))
    const n = this.camN(nw)
    const p0 = cp[0]
    // Skip faces that point away from the camera.
    if (n[0] * -p0[0] + n[1] * -p0[1] + n[2] * (DIST - p0[2]) <= 0) return
    const b = 0.4 + 0.6 * Math.max(0, dot(n, LIGHT))
    const sel = this.isSel(part)
    const depth = cp.reduce((s, p) => s + p[2], 0) / cp.length
    this.prims.push({
      kind: 'poly',
      key: this.key(),
      layer,
      depth,
      pts: cp.map((p) => this.scr(p).map((v) => v.toFixed(1)).join(',')).join(' '),
      fill: shade(color, b, sel ? 0.16 : 0),
      stroke: sel ? '#FFFFFF' : shade(color, b * 0.6),
      sw: sel ? 1.3 : 0.35,
    })
  }

  box(o: { c: V3; s: V3; color: string; top?: string; part?: string; layer?: 0 | 1; spin?: number }): void {
    const [cx, cy, cz] = o.c
    const [hx, hy, hz] = [o.s[0] / 2, o.s[1] / 2, o.s[2] / 2]
    const P = (a: number, b: number, c: number): V3 => [cx + a * hx, cy + b * hy, cz + c * hz]
    const part = o.part ?? ''
    const layer = o.layer ?? 1
    const spin = o.spin ?? 0
    const f = (pts: V3[], n: V3, color: string) => this.face(pts, n, color, part, layer, spin)
    f([P(1, -1, -1), P(1, -1, 1), P(1, 1, 1), P(1, 1, -1)], [1, 0, 0], o.color)
    f([P(-1, -1, 1), P(-1, -1, -1), P(-1, 1, -1), P(-1, 1, 1)], [-1, 0, 0], o.color)
    f([P(-1, 1, -1), P(1, 1, -1), P(1, 1, 1), P(-1, 1, 1)], [0, 1, 0], o.top ?? o.color)
    f([P(-1, -1, 1), P(1, -1, 1), P(1, -1, -1), P(-1, -1, -1)], [0, -1, 0], o.color)
    f([P(-1, -1, 1), P(-1, 1, 1), P(1, 1, 1), P(1, -1, 1)], [0, 0, 1], o.color)
    f([P(1, -1, -1), P(1, 1, -1), P(-1, 1, -1), P(-1, -1, -1)], [0, 0, -1], o.color)
  }

  /** Upright cylinder, or a slice of one (a0..a1) or a hollow one (rIn > 0). */
  cyl(o: {
    c: V3
    r: number
    h: number
    color: string
    top?: string
    part?: string
    layer?: 0 | 1
    spin?: number
    segs?: number
    a0?: number
    a1?: number
    rIn?: number
  }): void {
    const segs = o.segs ?? 14
    const a0 = o.a0 ?? 0
    const a1 = o.a1 ?? Math.PI * 2
    const rIn = o.rIn ?? 0
    const full = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6
    const y0 = o.c[1] - o.h / 2
    const y1 = o.c[1] + o.h / 2
    const part = o.part ?? ''
    const layer = o.layer ?? 1
    const spin = o.spin ?? 0
    const pt = (r: number, a: number, y: number): V3 => [o.c[0] + r * Math.cos(a), y, o.c[2] + r * Math.sin(a)]
    const ang = (j: number) => a0 + ((a1 - a0) * j) / segs
    const f = (pts: V3[], n: V3, color: string) => this.face(pts, n, color, part, layer, spin)

    for (let j = 0; j < segs; j++) {
      const aj = ang(j)
      const ak = ang(j + 1)
      const am = (aj + ak) / 2
      f([pt(o.r, aj, y0), pt(o.r, ak, y0), pt(o.r, ak, y1), pt(o.r, aj, y1)], [Math.cos(am), 0, Math.sin(am)], o.color)
      if (rIn > 0) {
        f([pt(rIn, aj, y0), pt(rIn, ak, y0), pt(rIn, ak, y1), pt(rIn, aj, y1)], [-Math.cos(am), 0, -Math.sin(am)], o.color)
      }
    }
    const cap = (y: number): V3[] => {
      const out: V3[] = []
      for (let j = 0; j <= segs; j++) out.push(pt(o.r, ang(j), y))
      if (rIn > 0) for (let j = segs; j >= 0; j--) out.push(pt(rIn, ang(j), y))
      else if (!full) out.push([o.c[0], y, o.c[2]])
      return out
    }
    f(cap(y1), [0, 1, 0], o.top ?? o.color)
    f(cap(y0), [0, -1, 0], o.color)
    if (!full) {
      f([pt(rIn, a0, y0), pt(o.r, a0, y0), pt(o.r, a0, y1), pt(rIn, a0, y1)], [Math.sin(a0), 0, -Math.cos(a0)], o.color)
      f([pt(rIn, a1, y0), pt(o.r, a1, y0), pt(o.r, a1, y1), pt(rIn, a1, y1)], [-Math.sin(a1), 0, Math.cos(a1)], o.color)
    }
  }

  sphere(o: { c: V3; r: number; color: string; part?: string; layer?: 0 | 1 }): void {
    const p = this.cam(o.c)
    const [x, y] = this.scr(p)
    this.colors.add(o.color)
    this.prims.push({
      kind: 'sphere',
      key: this.key(),
      layer: o.layer ?? 1,
      depth: p[2],
      cx: x,
      cy: y,
      r: o.r * this.scale * this.view.zoom * this.persp(p),
      color: o.color,
      ring: this.isSel(o.part ?? ''),
    })
  }

  /** A circle in space, drawn as a near half and a far half so the nucleus can sit between them. */
  orbit(o: { c: V3; r: number; u: V3; v: V3; color: string; sw: number; part: string }): void {
    const N = 72
    const pts: V3[] = []
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2
      const w: V3 = [
        o.c[0] + o.r * (Math.cos(a) * o.u[0] + Math.sin(a) * o.v[0]),
        o.c[1] + o.r * (Math.cos(a) * o.u[1] + Math.sin(a) * o.v[1]),
        o.c[2] + o.r * (Math.cos(a) * o.u[2] + Math.sin(a) * o.v[2]),
      ]
      pts.push(this.cam(w))
    }
    const mid = this.cam(o.c)[2]
    const front = pts.map((p) => p[2] >= mid)
    let start = 0
    for (let i = 0; i < N; i++) {
      if (front[i] !== front[(i + N - 1) % N]) {
        start = i
        break
      }
    }
    const runs: V3[][] = []
    let cur: V3[] = []
    for (let k = 0; k <= N; k++) {
      const i = (start + k) % N
      const prev = (start + k - 1 + N) % N
      if (k > 0 && front[i] !== front[prev]) {
        cur.push(pts[i]) // share the boundary point so the halves meet
        runs.push(cur)
        cur = []
      }
      cur.push(pts[i])
    }
    if (cur.length > 1) runs.push(cur)
    const sel = this.isSel(o.part)
    for (const run of runs) {
      const isFront = run.reduce((s, p) => s + p[2], 0) / run.length >= mid
      const d = 'M' + run.map((p) => this.scr(p).map((v) => v.toFixed(1)).join(' ')).join(' L')
      const depth = run.reduce((s, p) => s + p[2], 0) / run.length
      if (sel) {
        this.prims.push({ kind: 'path', key: this.key(), layer: 1, depth: depth - 0.001, d, stroke: '#FFFFFF', sw: o.sw + 3.5, opacity: 0.85 })
      }
      this.prims.push({
        kind: 'path',
        key: this.key(),
        layer: 1,
        depth,
        d,
        stroke: o.color,
        sw: o.sw,
        opacity: isFront ? 1 : 0.55,
      })
    }
  }

  /** A line drawn on the flat ground, e.g. a track on the circuit board. */
  trace(o: { pts: [number, number][]; y: number; color: string; width: number; dash?: string }): void {
    const sp = o.pts.map(([x, z]) => this.scr(this.cam([x, o.y, z])))
    const d = 'M' + sp.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L')
    this.prims.push({
      kind: 'path',
      key: this.key(),
      layer: 0,
      depth: 0,
      d: sp.length === 1 ? d + ' l0.01 0' : d,
      stroke: o.color,
      sw: o.width * this.scale * this.view.zoom,
      opacity: 1,
      dash: o.dash,
    })
  }

  /** A line floating in space (e.g. a magnetic field line). */
  line(o: { a: V3; b: V3; color: string; sw: number; opacity: number; dash?: string; bias?: number }): void {
    const pa = this.cam(o.a)
    const pb = this.cam(o.b)
    const [x0, y0] = this.scr(pa)
    const [x1, y1] = this.scr(pb)
    this.prims.push({
      kind: 'path',
      key: this.key(),
      layer: 1,
      depth: (pa[2] + pb[2]) / 2 + (o.bias ?? 0),
      d: `M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)}`,
      stroke: o.color,
      sw: o.sw,
      opacity: o.opacity,
      dash: o.dash,
    })
  }

  /** Text lying flat on a horizontal surface (read from above, like print on a chip). */
  flatText(o: { text: string; c: V3; size: number; fill: string; angle?: number }): void {
    const c = o.c
    const a = o.angle ?? 0
    const ex: V3 = [Math.cos(a), 0, -Math.sin(a)]
    const ez: V3 = [Math.sin(a), 0, Math.cos(a)]
    const p0 = this.cam(c)
    const px = this.cam([c[0] + ex[0], c[1], c[2] + ex[2]])
    const pz = this.cam([c[0] + ez[0], c[1], c[2] + ez[2]])
    const [e, f] = this.scr(p0)
    const [x1, y1] = this.scr(px)
    const [x2, y2] = this.scr(pz)
    const up = this.camN([0, 1, 0])
    this.prims.push({
      kind: 'text',
      key: this.key(),
      layer: 1,
      depth: p0[2] + 0.002,
      text: o.text,
      matrix: `matrix(${(x1 - e).toFixed(2)} ${(y1 - f).toFixed(2)} ${(x2 - e).toFixed(2)} ${(y2 - f).toFixed(2)} ${e.toFixed(1)} ${f.toFixed(1)})`,
      size: o.size,
      fill: o.fill,
      opacity: clamp(up[2] * 4, 0, 1),
    })
  }

  /** A soft light halo around a lit object. Drawn just behind it so the object stays crisp. */
  glow(o: { c: V3; r: number; opacity: number }): void {
    const p = this.cam(o.c)
    const [x, y] = this.scr(p)
    this.prims.push({
      kind: 'glow',
      key: this.key(),
      layer: 1,
      depth: p[2] - 0.15,
      cx: x,
      cy: y,
      r: o.r * this.scale * this.view.zoom * this.persp(p),
      opacity: o.opacity,
    })
  }

  /** A soft shadow on the floor under a floating object. */
  floorShadow(o: { y: number; r: number }): void {
    const p = this.cam([0, o.y, 0])
    const [x, y] = this.scr(p)
    const rx = o.r * this.scale * this.view.zoom * this.persp(p)
    this.prims.push({ kind: 'shadow', key: this.key(), layer: 0, depth: 0, cx: x, cy: y, rx, ry: rx * Math.sin(this.view.pitch) })
  }

  finish(): Prim[] {
    const ground = this.prims.filter((p) => p.layer === 0)
    const solid = this.prims.filter((p) => p.layer === 1).sort((a, b) => a.depth - b.depth)
    return [...ground, ...solid]
  }
}

// ---------- the three scenes ----------

type Anchors = Record<string, V3>

interface SceneDef {
  yaw0: number
  pitch0: number
  center: V3
  scale: number
  build: (c: Ctx, t: number, power: number) => Anchors
}


// Chemistry: a carbon atom. Nucleus of 6 protons and 6 neutrons, 2 electrons in the K shell, 4 in the L shell.
function ringBasis(n: V3): [V3, V3] {
  const nn = norm(n)
  const helper: V3 = Math.abs(nn[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
  const u = norm(cross(helper, nn))
  return [u, cross(nn, u)]
}

const K_RADIUS = 0.42
const L_RADIUS = 0.95
const [K_U, K_V] = ringBasis([0.5, 0.78, 0.45])
const [L_U, L_V] = ringBasis([-0.16, 0.93, 0.33])
const ringPoint = (r: number, u: V3, v: V3, a: number): V3 => [
  r * (Math.cos(a) * u[0] + Math.sin(a) * v[0]),
  r * (Math.cos(a) * u[1] + Math.sin(a) * v[1]),
  r * (Math.cos(a) * u[2] + Math.sin(a) * v[2]),
]

const PHI = (1 + Math.sqrt(5)) / 2
const NUCLEUS_POINTS: V3[] = (
  [
    [0, 1, PHI],
    [0, 1, -PHI],
    [0, -1, PHI],
    [0, -1, -PHI],
    [1, PHI, 0],
    [1, -PHI, 0],
    [-1, PHI, 0],
    [-1, -PHI, 0],
    [PHI, 0, 1],
    [PHI, 0, -1],
    [-PHI, 0, 1],
    [-PHI, 0, -1],
  ] as V3[]
).map((p) => {
  const q = norm(p)
  return [q[0] * 0.2, q[1] * 0.2, q[2] * 0.2] as V3
})

const atomScene: SceneDef = {
  yaw0: 0.4,
  pitch0: 0.4,
  center: [0, 0, 0],
  scale: 78,
  build(c, t) {
    c.floorShadow({ y: -1.12, r: 0.85 })
    c.orbit({ c: [0, 0, 0], r: L_RADIUS, u: L_U, v: L_V, color: '#14B8A6', sw: 2.6, part: 'l-shell' })
    c.orbit({ c: [0, 0, 0], r: K_RADIUS, u: K_U, v: K_V, color: '#5B86F0', sw: 2.6, part: 'k-shell' })
    NUCLEUS_POINTS.forEach((p, i) => {
      c.sphere({ c: p, r: 0.11, color: i % 2 === 0 ? '#FFB020' : '#9FB0C4', part: 'nucleus' })
    })
    for (let j = 0; j < 2; j++) {
      c.sphere({ c: ringPoint(K_RADIUS, K_U, K_V, t * 0.9 + j * Math.PI), r: 0.075, color: '#7FA2F5', part: 'k-shell' })
    }
    const valence: V3[] = []
    for (let j = 0; j < 4; j++) {
      const p = ringPoint(L_RADIUS, L_U, L_V, t * 0.35 + (j * Math.PI) / 2)
      valence.push(p)
      c.sphere({ c: p, r: 0.09, color: '#E0566F', part: 'valence-electrons' })
    }
    return {
      nucleus: [0, 0, 0],
      'k-shell': ringPoint(K_RADIUS, K_U, K_V, -0.9),
      'l-shell': ringPoint(L_RADIUS, L_U, L_V, 2.35),
      'valence-electrons': valence[0],
    }
  },
}

// Physics: a hand-turned electricity generator with a bulb. The coil, axle, handle and slip rings spin;
// the magnets, brushes, wires and bulb stay still. The bulb glows brighter and dimmer as the coil turns.
const generatorScene: SceneDef = {
  yaw0: -0.55,
  pitch0: 0.4,
  center: [0, -0.52, 0.18],
  scale: 74,
  build(c, t, power) {
    const spin = t * 2.4
    const FLOOR = -0.96
    // base plate
    c.box({ c: [0, FLOOR - 0.04, 0.2], s: [2.5, 0.08, 1.8], color: '#1D2D45', layer: 0 })

    // magnets (north on the left, south on the right) and a few field lines between them
    const magnetY = FLOOR + 0.65
    c.box({ c: [-0.98, magnetY, 0], s: [0.36, 1.3, 0.7], color: '#E0566F', part: 'magnet' })
    c.box({ c: [0.98, magnetY, 0], s: [0.36, 1.3, 0.7], color: '#5B86F0', part: 'magnet' })
    c.flatText({ text: 'N', c: [-0.98, magnetY + 0.65 + 0.002, 0], size: 0.26, fill: '#FFFFFF' })
    c.flatText({ text: 'S', c: [0.98, magnetY + 0.65 + 0.002, 0], size: 0.26, fill: '#FFFFFF' })
    for (const y of [-0.55, -0.1, 0.25]) {
      c.line({ a: [-0.8, y, 0], b: [0.8, y, 0], color: '#9FB0C4', sw: 1.2, opacity: 0.45, dash: '3 4' })
    }

    // slip rings: two hollow rings on the axle that turn with the coil
    const yA = -0.46
    const yB = -0.64
    for (const y of [yA, yB]) {
      c.cyl({ c: [0, y, 0], r: 0.17, h: 0.1, rIn: 0.09, color: '#14B8A6', top: '#5EEAD4', segs: 12, spin, part: 'slip-rings' })
    }

    // axle and the hand crank on top
    c.cyl({ c: [0, -0.1, 0], r: 0.04, h: 1.2, color: '#9FB0C4', segs: 10, spin })
    c.box({ c: [0.2, 0.46, 0], s: [0.4, 0.05, 0.05], color: '#3B5BDB', spin })
    c.cyl({ c: [0.38, 0.46, 0], r: 0.05, h: 0.16, color: '#3B5BDB', segs: 8, spin })

    // coil (two layers of wire)
    const y0 = -0.22
    const y1 = 0.3
    for (const z of [-0.05, 0.05]) {
      c.box({ c: [-0.5, (y0 + y1) / 2, z], s: [0.045, y1 - y0, 0.045], color: '#FFB020', part: 'coil', spin })
      c.box({ c: [0.5, (y0 + y1) / 2, z], s: [0.045, y1 - y0, 0.045], color: '#FFB020', part: 'coil', spin })
      c.box({ c: [0, y0, z], s: [1.045, 0.045, 0.045], color: '#FFB020', part: 'coil', spin })
      c.box({ c: [0, y1, z], s: [1.045, 0.045, 0.045], color: '#FFB020', part: 'coil', spin })
    }

    // brushes (fixed), one on each slip ring
    c.box({ c: [0.295, yA, 0.1], s: [0.25, 0.1, 0.1], color: '#4A74D8', part: 'brushes' })
    c.box({ c: [0.345, yB, -0.1], s: [0.35, 0.1, 0.1], color: '#4A74D8', part: 'brushes' })

    // wires from the brushes along the base to the bulb
    const wireY = FLOOR + 0.12
    const wire = '#E8EEF5'
    c.box({ c: [0.42, (yA + wireY) / 2, 0.1], s: [0.035, yA - wireY, 0.035], color: wire })
    c.box({ c: [0.42, wireY, 0.41], s: [0.035, 0.035, 0.62], color: wire })
    c.box({ c: [0.52, (yB + wireY) / 2, -0.1], s: [0.035, yB - wireY, 0.035], color: wire })
    c.box({ c: [0.52, wireY, 0.31], s: [0.035, 0.035, 0.82], color: wire })

    // bulb: lamp holder, screw base, neck and a round glass globe with a filament.
    // power 0 = off (clear glass, dark filament), 1 = lit (yellow glow), 2 = very bright (white-hot, big halo, rays).
    const bx = 0.47
    const bz = 0.82
    const holderTop = FLOOR + 0.2
    c.box({ c: [bx, FLOOR + 0.1, bz], s: [0.34, 0.2, 0.2], color: '#EC4899', part: 'bulb' })
    c.cyl({ c: [bx, holderTop + 0.05, bz], r: 0.085, h: 0.1, color: '#B8C2CF', top: '#DDE5EE', segs: 10, part: 'bulb' })
    c.cyl({ c: [bx, holderTop + 0.115, bz], r: 0.09, h: 0.03, color: '#8DA2BA', segs: 10, part: 'bulb' })
    const neckY = holderTop + 0.19
    const globeY = neckY + 0.2
    const glass = power === 0 ? '#D6E6F2' : power === 1 ? '#FFE566' : '#FFF8C4'
    c.cyl({ c: [bx, neckY, bz], r: 0.07, h: 0.09, color: power === 0 ? '#C4D6E6' : '#FFD93D', segs: 10, part: 'bulb' })
    if (power > 0) {
      const pulse = 0.93 + 0.07 * Math.sin(t * 9)
      c.glow({ c: [bx, globeY, bz], r: (power === 2 ? 0.66 : 0.44) * pulse, opacity: power === 2 ? 0.95 : 0.7 })
      c.glow({ c: [bx, globeY, bz], r: (power === 2 ? 0.34 : 0.26) * pulse, opacity: 1 })
    }
    c.sphere({ c: [bx, globeY, bz], r: 0.19, color: glass, part: 'bulb' })
    const fil = power === 0 ? '#5B6B7D' : '#FF8A00'
    const fz = bz + 0.04
    c.line({ a: [bx - 0.045, neckY + 0.04, fz], b: [bx - 0.045, globeY - 0.02, fz], color: fil, sw: 1.4, opacity: 1, bias: 0.3 })
    c.line({ a: [bx + 0.045, neckY + 0.04, fz], b: [bx + 0.045, globeY - 0.02, fz], color: fil, sw: 1.4, opacity: 1, bias: 0.3 })
    c.line({ a: [bx - 0.045, globeY - 0.02, fz], b: [bx - 0.015, globeY + 0.03, fz], color: fil, sw: 1.8, opacity: 1, bias: 0.3 })
    c.line({ a: [bx - 0.015, globeY + 0.03, fz], b: [bx + 0.015, globeY - 0.02, fz], color: fil, sw: 1.8, opacity: 1, bias: 0.3 })
    c.line({ a: [bx + 0.015, globeY - 0.02, fz], b: [bx + 0.045, globeY + 0.03, fz], color: fil, sw: 1.8, opacity: 1, bias: 0.3 })
    if (power === 2) {
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2 + t * 0.6
        const r0 = 0.3
        const r1 = 0.4 + 0.05 * Math.sin(t * 8 + k)
        c.line({
          a: [bx + r0 * Math.cos(a), globeY + r0 * Math.sin(a), bz],
          b: [bx + r1 * Math.cos(a), globeY + r1 * Math.sin(a), bz],
          color: '#FFD93D',
          sw: 1.8,
          opacity: 0.95,
          bias: 0.4,
        })
      }
    }

    return {
      magnet: [-0.98, magnetY + 0.3, 0.36],
      coil: [0, y1 + 0.03, 0],
      'slip-rings': [-0.12, yB - 0.02, 0.15],
      brushes: [0.4, yA + 0.07, 0.1],
      bulb: [bx, FLOOR + 0.12, bz + 0.13],
    }
  },
}

// Computer Science: the inside of a computer, seen from above.
const computerScene: SceneDef = {
  yaw0: -0.6,
  pitch0: 0.55,
  center: [0, -0.4, 0],
  scale: 66,
  build(c, t) {
    void t
    const TOP = -0.6
    // the motherboard and its tracks
    c.box({ c: [0, TOP - 0.05, 0], s: [2.1, 0.1, 1.8], color: '#1E7F5C', part: 'motherboard', layer: 0 })
    const track = '#46C79B'
    const tracks: [number, number][][] = [
      [[0.12, -0.4], [0.45, -0.4], [0.5, -0.3], [0.5, 0.25]],
      [[0.12, -0.15], [0.3, -0.15], [0.3, 0.45]],
      [[-0.35, 0.18], [-0.35, 0.38]],
      [[-0.9, -0.8], [-0.9, 0.3], [-0.75, 0.38]],
      [[-0.6, -0.75], [0.6, -0.75], [0.9, -0.5]],
      [[0.9, -0.5], [0.9, 0.5]],
    ]
    tracks.forEach((pts) => c.trace({ pts, y: TOP + 0.001, color: track, width: 0.018 }))
    for (const [x, z] of [[0.12, -0.4], [0.5, 0.25], [0.3, 0.45], [-0.75, 0.38], [0.9, 0.5]] as [number, number][]) {
      c.trace({ pts: [[x, z]], y: TOP + 0.001, color: '#F2D27A', width: 0.05 })
    }

    // CPU: socket, green package and metal lid with its name printed on it
    c.box({ c: [-0.35, TOP + 0.02, -0.25], s: [0.95, 0.04, 0.95], color: '#232C3A', part: 'motherboard' })
    c.box({ c: [-0.35, TOP + 0.06, -0.25], s: [0.8, 0.04, 0.8], color: '#2E8B62', part: 'cpu' })
    c.box({ c: [-0.35, TOP + 0.13, -0.25], s: [0.6, 0.1, 0.6], color: '#AEB9C7', top: '#CBD4DF', part: 'cpu' })
    c.flatText({ text: 'CPU', c: [-0.35, TOP + 0.182, -0.38], size: 0.2, fill: '#33404F' })

    // RAM: two sticks standing in their slots, with memory chips on both sides
    for (const x of [0.62, 0.8]) {
      c.box({ c: [x, TOP + 0.03, -0.1], s: [0.09, 0.06, 1.1], color: '#232C3A', part: 'motherboard' })
      c.box({ c: [x, TOP + 0.24, -0.1], s: [0.05, 0.42, 1.0], color: '#2F5FD0', part: 'ram' })
      for (const z of [-0.42, -0.2, 0.02, 0.24]) {
        c.box({ c: [x, TOP + 0.3, -0.1 + z + 0.1], s: [0.068, 0.16, 0.16], color: '#1A1F2B', part: 'ram' })
      }
    }

    // storage: a flat SSD with a label on top
    c.box({ c: [-0.45, TOP + 0.03, 0.55], s: [1.0, 0.06, 0.38], color: '#2B3A4D', part: 'storage' })
    c.box({ c: [-0.35, TOP + 0.066, 0.55], s: [0.7, 0.012, 0.3], color: '#14B8A6', part: 'storage' })
    c.flatText({ text: 'SSD', c: [-0.35, TOP + 0.074, 0.55], size: 0.15, fill: '#0B2B28' })
    c.box({ c: [-0.97, TOP + 0.03, 0.55], s: [0.1, 0.06, 0.3], color: '#D9B650', part: 'storage' })

    // a long expansion slot, a chipset and a row of capacitors on the board
    c.box({ c: [0.38, TOP + 0.03, 0.8], s: [0.9, 0.06, 0.1], color: '#232C3A', part: 'motherboard' })
    c.box({ c: [0.3, TOP + 0.04, 0.32], s: [0.26, 0.08, 0.26], color: '#3A4658', top: '#556176', part: 'motherboard' })
    ;[0.1, 0.28, 0.46, 0.64, 0.82].forEach((x, i) => {
      c.cyl({ c: [x, TOP + 0.07, -0.8], r: 0.05, h: 0.14, color: i % 2 ? '#2B3A4D' : '#8DA2BA', top: '#C9D2DE', segs: 10, part: 'motherboard' })
    })

    return {
      cpu: [-0.35, TOP + 0.185, -0.1],
      ram: [0.71, TOP + 0.46, -0.1],
      storage: [-0.8, TOP + 0.075, 0.55],
      motherboard: [0.85, TOP, 0.42],
    }
  },
}

const scenes: Record<string, SceneDef> = {
  'carbon-atom': atomScene,
  generator: generatorScene,
  'computer-hardware': computerScene,
}

export function hasScene(modelId: string): boolean {
  return Object.prototype.hasOwnProperty.call(scenes, modelId)
}

/** The camera angle a model starts at. */
export function startView(modelId: string): View {
  const def = hasScene(modelId) ? scenes[modelId] : atomScene
  return { yaw: def.yaw0, pitch: def.pitch0, zoom: 1 }
}

/** Everything to draw for one model at one camera angle and moment in time (seconds). */
export function buildScene(modelId: string, view: View, t: number, selectedPartId: string, power = 1): SceneOut {
  const def = hasScene(modelId) ? scenes[modelId] : atomScene
  const ctx = new Ctx(view, def.center, def.scale, selectedPartId)
  const raw = def.build(ctx, t, power)
  const anchors: Record<string, [number, number]> = {}
  for (const id of Object.keys(raw)) anchors[id] = ctx.anchor(raw[id])
  return { prims: ctx.finish(), anchors, colors: Array.from(ctx.colors) }
}
