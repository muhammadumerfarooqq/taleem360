// Gives every mesh in a .glb its own material, named after the mesh.
//
// Why: heart.glb has only two materials ("Veins" is shared by 8 meshes), so a tap or a highlight
// on one part would hit all of them. This reads the .glb, copies the shared material once per
// mesh in the JSON part of the file (the binary mesh data is not touched) and hands back a blob URL.
// The file on disk is never changed. A .glb that already has one material per part passes through
// as it is. The only network request is the .glb itself, the same one <model-viewer> would make.

const MAGIC = 0x46546c67 // "glTF"
const JSON_CHUNK = 0x4e4f534a // "JSON"

interface Gltf {
  nodes?: { name?: string; mesh?: number; translation?: number[]; scale?: number[]; children?: number[] }[]
  meshes?: { name?: string; primitives: { material?: number; attributes: Record<string, number> }[] }[]
  materials?: { name?: string }[]
  accessors?: { min?: number[]; max?: number[] }[]
}

export type Vec3 = [number, number, number]

export interface SplitResult {
  /** URL to give <model-viewer>: a blob URL if materials were split, otherwise the original URL. */
  src: string
  /** True when `src` is a blob URL that the caller must revoke. */
  isBlob: boolean
  /** Centre of each mesh (by node name), in the model's own coordinates. Used to aim the camera. */
  centers: Record<string, Vec3>
}

function meshCenters(gltf: Gltf): Record<string, Vec3> {
  const out: Record<string, Vec3> = {}
  for (const node of gltf.nodes ?? []) {
    if (node.mesh === undefined || !node.name) continue
    const prim = gltf.meshes?.[node.mesh]?.primitives[0]
    const acc = prim ? gltf.accessors?.[prim.attributes.POSITION] : undefined
    if (!acc?.min || !acc.max) continue
    const s = node.scale ?? [1, 1, 1]
    const t = node.translation ?? [0, 0, 0]
    out[node.name] = [0, 1, 2].map((i) => ((acc.min![i] + acc.max![i]) / 2) * s[i] + t[i]) as Vec3
  }
  return out
}

export async function splitSharedMaterials(url: string): Promise<SplitResult> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not load the model (${res.status})`)
  const buf = await res.arrayBuffer()

  const view = new DataView(buf)
  const isGlb = buf.byteLength > 20 && view.getUint32(0, true) === MAGIC && view.getUint32(16, true) === JSON_CHUNK
  if (!isGlb) return { src: url, isBlob: false, centers: {} } // let <model-viewer> report what is wrong

  const jsonLength = view.getUint32(12, true)
  const jsonEnd = 20 + jsonLength
  const gltf = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLength))) as Gltf
  const centers = meshCenters(gltf)

  // Count how many primitives use each material.
  const uses = new Map<number, number>()
  for (const mesh of gltf.meshes ?? [])
    for (const p of mesh.primitives) if (p.material !== undefined) uses.set(p.material, (uses.get(p.material) ?? 0) + 1)

  const materials = gltf.materials ?? []
  let changed = false
  for (const mesh of gltf.meshes ?? []) {
    mesh.primitives.forEach((p, i) => {
      if (p.material === undefined || (uses.get(p.material) ?? 0) < 2) return
      const copy = JSON.parse(JSON.stringify(materials[p.material]))
      const base = mesh.name ?? `mesh${materials.length}`
      copy.name = mesh.primitives.length > 1 ? `${base}_${i}` : base
      materials.push(copy)
      p.material = materials.length - 1
      changed = true
    })
  }
  if (!changed) return { src: url, isBlob: false, centers }
  // The shared originals are now unused. Rename them so no name appears twice.
  for (const [index, count] of uses) if (count >= 2) materials[index].name = `${materials[index].name ?? 'material'}_shared`
  gltf.materials = materials

  // Write the new JSON back, padded with spaces to a multiple of 4 bytes, then the untouched rest.
  const json = new TextEncoder().encode(JSON.stringify(gltf))
  const padded = new Uint8Array(Math.ceil(json.length / 4) * 4).fill(0x20)
  padded.set(json)
  const rest = new Uint8Array(buf, jsonEnd)
  const out = new Uint8Array(20 + padded.length + rest.length)
  out.set(new Uint8Array(buf, 0, 20))
  out.set(padded, 20)
  out.set(rest, 20 + padded.length)
  const dv = new DataView(out.buffer)
  dv.setUint32(8, out.length, true) // total length
  dv.setUint32(12, padded.length, true) // JSON chunk length
  const blob = new Blob([out], { type: 'model/gltf-binary' })
  return { src: URL.createObjectURL(blob), isBlob: true, centers }
}
