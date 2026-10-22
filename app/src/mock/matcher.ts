// MOCK ONLY: stands in for the server's image recognition (roadmap step 3) for the one demo diagram.
// It compares the colours of the photo with the colours of public/scan-pics/magnetic-bulb.png
// (the generator figure: a red magnet, a blue magnet, a little green). It does not understand shapes,
// so a very similar red-and-blue picture would also pass. The real server replaces this entirely.

const REFERENCE_URL = '/scan-pics/magnetic-bulb.png'
const SIDE = 96 // photos are shrunk to this many pixels on the long side before counting colours

// Share of the coloured pixels that fall in each colour family. Orange and yellow are left out on purpose:
// wood, skin and paper are orange, so they would drown out the red and blue of the figure.
export interface Signature {
  red: number
  green: number
  blue: number
  purple: number
  colorful: number // coloured pixels as a share of ALL pixels (grey, white, black and orange do not count)
  redBlob: Patch | null
  blueBlob: Patch | null
  side: number // longest side of the shrunk picture, in pixels
}

const EMPTY: Signature = { red: 0, green: 0, blue: 0, purple: 0, colorful: 0, redBlob: null, blueBlob: null, side: SIDE }

// Biggest group of touching pixels in a mask (4-neighbour flood fill).
function biggestBlob(mask: Uint8Array, w: number, h: number): Patch | null {
  const seen = new Uint8Array(w * h)
  let best: Patch | null = null
  for (let start = 0; start < w * h; start++) {
    if (!mask[start] || seen[start]) continue
    const stack = [start]
    seen[start] = 1
    let area = 0
    let sx = 0
    let sy = 0
    let x0 = w
    let x1 = 0
    let y0 = h
    let y1 = 0
    while (stack.length) {
      const p = stack.pop() as number
      const x = p % w
      const y = (p - x) / w
      area++
      sx += x
      sy += y
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
      const next = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]
      for (const q of next) {
        if (q >= 0 && mask[q] && !seen[q]) {
          seen[q] = 1
          stack.push(q)
        }
      }
    }
    if (!best || area > best.px) {
      best = { area: area / (w * h), fill: area / ((x1 - x0 + 1) * (y1 - y0 + 1)), cx: sx / area, cy: sy / area, px: area }
    }
  }
  return best
}

// The biggest solid patch of one colour (the red magnet, the blue magnet).
interface Patch {
  area: number // share of the whole picture
  fill: number // how much of its bounding box it fills (a solid block is high, scattered specks are low)
  cx: number
  cy: number
  px: number // area in pixels of the shrunk picture
}

// Score needed to count as "the same diagram" (1 is identical colours), plus floors for red and blue.
export const MATCH_SCORE = 0.8
const MIN_RED = 0.15
const MIN_BLUE = 0.25
const MIN_COLORFUL = 0.01
// The two magnets must be real solid patches of similar size that sit close together (in magnet sizes).
const MIN_BLOB_AREA = 0.005
const MIN_BLOB_FILL = 0.35
const SIZE_RATIO: [number, number] = [0.4, 2.5]
const SEPARATION: [number, number] = [1.2, 4]

export function signatureOf(source: CanvasImageSource, width: number, height: number): Signature {
  const k = SIDE / Math.max(width, height)
  const w = Math.max(1, Math.round(width * k))
  const h = Math.max(1, Math.round(height * k))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return EMPTY
  ctx.drawImage(source, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h).data
  let red = 0
  let green = 0
  let blue = 0
  let purple = 0
  const redMask = new Uint8Array(w * h)
  const blueMask = new Uint8Array(w * h)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255
    const g = data[i + 1] / 255
    const b = data[i + 2] / 255
    const max = Math.max(r, g, b)
    const delta = max - Math.min(r, g, b)
    if (max < 0.3 || delta / max < 0.3) continue // too dark, grey or washed out
    let hue: number
    if (delta === 0) hue = 0
    else if (max === r) hue = ((g - b) / delta + 6) % 6
    else if (max === g) hue = (b - r) / delta + 2
    else hue = (r - g) / delta + 4
    hue *= 60
    if (hue >= 20 && hue < 80) continue // orange and yellow
    if (hue >= 340 || hue < 20) {
      red++
      redMask[i / 4] = 1
    } else if (hue < 170) green++
    else if (hue < 260) {
      blue++
      blueMask[i / 4] = 1
    } else purple++
  }
  const total = red + green + blue + purple
  if (total === 0) return EMPTY
  return {
    red: red / total,
    green: green / total,
    blue: blue / total,
    purple: purple / total,
    colorful: total / (w * h),
    redBlob: biggestBlob(redMask, w, h),
    blueBlob: biggestBlob(blueMask, w, h),
    side: Math.max(w, h),
  }
}

export function similarity(a: Signature, b: Signature): number {
  return Math.min(a.red, b.red) + Math.min(a.green, b.green) + Math.min(a.blue, b.blue) + Math.min(a.purple, b.purple)
}

// Two solid, similar-sized patches (red and blue) close together, like the N and S magnets.
export function magnetsLookRight(sig: Signature): boolean {
  const r = sig.redBlob
  const b = sig.blueBlob
  if (!r || !b) return false
  if (r.area < MIN_BLOB_AREA || b.area < MIN_BLOB_AREA) return false
  if (r.fill < MIN_BLOB_FILL || b.fill < MIN_BLOB_FILL) return false
  const ratio = r.px / b.px
  if (ratio < SIZE_RATIO[0] || ratio > SIZE_RATIO[1]) return false
  const apart = Math.hypot(r.cx - b.cx, r.cy - b.cy) / Math.sqrt((r.px + b.px) / 2)
  return apart >= SEPARATION[0] && apart <= SEPARATION[1]
}

export function looksLikeDiagram(sig: Signature, reference: Signature): { matched: boolean; score: number } {
  const score = similarity(sig, reference)
  const colours = score >= MATCH_SCORE && sig.red >= MIN_RED && sig.blue >= MIN_BLUE && sig.colorful >= MIN_COLORFUL
  return { matched: colours && magnetsLookRight(sig), score }
}

let reference: Promise<Signature> | null = null

function loadReference(): Promise<Signature> {
  if (!reference) {
    reference = new Promise<Signature>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(signatureOf(img, img.naturalWidth, img.naturalHeight))
      img.onerror = () => reject(new Error('The reference diagram could not be loaded'))
      img.src = REFERENCE_URL
    })
    reference.catch(() => {
      reference = null // try again next time
    })
  }
  return reference
}

/** Does this photo show the demo diagram? Looks at the whole photo and at its centre, where the frame box is. */
export async function matchesDemoDiagram(photo: Blob): Promise<{ matched: boolean; score: number }> {
  const ref = await loadReference()
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(photo)
  } catch {
    return { matched: false, score: 0 }
  }
  try {
    const whole = looksLikeDiagram(signatureOf(bitmap, bitmap.width, bitmap.height), ref)
    if (whole.matched) return whole
    // The centre 70% (where the "fit one diagram inside the box" frame is), so a busy background matters less.
    const cw = Math.round(bitmap.width * 0.7)
    const ch = Math.round(bitmap.height * 0.7)
    const crop = document.createElement('canvas')
    crop.width = cw
    crop.height = ch
    crop.getContext('2d')?.drawImage(bitmap, (bitmap.width - cw) / 2, (bitmap.height - ch) / 2, cw, ch, 0, 0, cw, ch)
    const centre = looksLikeDiagram(signatureOf(crop, cw, ch), ref)
    return centre.score > whole.score ? centre : whole
  } finally {
    bitmap.close()
  }
}
