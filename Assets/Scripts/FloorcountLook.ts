/**
 * FloorcountLook: the design tokens and the shared drawing helpers every Floorcount visual uses.
 *
 * Owns: the one ink (ivory) and the one accent (teal), the three brightnesses, the strike /
 * "and" / decay curve read off the beat, the imported textures and fonts, the cap-height to
 * Text.size conversion, and the small mesh builders (textured quads, a capsule, the turn arc).
 *
 * Every number here traces to .design/manifest.json or .design/brand/CHARTER.md. Nothing in
 * this file touches the session: it is look only, driven by a beat position pushed in.
 *
 * Must not: hold session state, read the scene, or decide when anything shows.
 */

import { isHold, COUNTS_PER_PHRASE } from "./FloorcountSteps"

/**
 * Materials, one per texture from .design/brand/export (ivory shapes on transparent).
 *
 * The base texture is bound in the material asset rather than at runtime: the unlit graph
 * shader keeps it behind the static define ENABLE_BASE_TEX, and a define is compiled into the
 * shader variant, so a `mainPass.baseTex = ...` on a material that was authored without it is
 * silently dropped. Each of these was created from UnlitMaterialPreset with the define on and
 * the texture bound; cloning one at runtime keeps both.
 */
export const MAT_FOOT_LEFT: Material = requireAsset("../Materials/FloorcountFootLeft.mat") as Material
export const MAT_FOOT_RIGHT: Material = requireAsset("../Materials/FloorcountFootRight.mat") as Material
export const MAT_CELL: Material = requireAsset("../Materials/FloorcountCell.mat") as Material
export const MAT_CELL_EMPTY: Material = requireAsset("../Materials/FloorcountCellEmpty.mat") as Material
export const MAT_PAD_BORDER: Material = requireAsset("../Materials/FloorcountPadBorder.mat") as Material
export const MAT_PARQUET: Material = requireAsset("../Materials/FloorcountParquet.mat") as Material
export const MAT_ARROW: Material = requireAsset("../Materials/FloorcountArrow.mat") as Material

/** The untextured unlit material, for the turn arc and the button capsules. */
export const BASE_MATERIAL: Material = requireAsset("../FloorcountUnlit.mat") as Material

// ── Type (charter law 11: one typeface, ExtraBold for numerals and button labels) ─────────
export const FONT_DISPLAY: Font = requireAsset("../Fonts/AtkinsonHyperlegibleNext-ExtraBold.ttf") as Font
export const FONT_BODY: Font = requireAsset("../Fonts/AtkinsonHyperlegibleNext-Medium.ttf") as Font

/**
 * Text.size for a wanted cap height in cm.
 *
 * One cm of em square is 43.886 size units in this project's text setup, and Atkinson
 * Hyperlegible Next puts its cap height (and its digits) at 0.668 of the em square, read from
 * the fonts' own OS/2 tables.
 */
const SIZE_PER_CM_OF_EM = 43.886
const CAP_HEIGHT_OF_EM = 0.668
export function sizeForCapCm(capCm: number): number {
  return (capCm / CAP_HEIGHT_OF_EM) * SIZE_PER_CM_OF_EM
}

// ── Colour: one ink, one accent (charter laws 2 and 3) ───────────────────────────────────
/** #F7EEDF. For geometry that carries no texture; the textures are already this ivory. */
export const IVORY = new vec3(0.9686, 0.9333, 0.8745)
/** Leave a texture's own ivory alone: baseColor multiplies the texture. */
export const TINT_IVORY = new vec3(1, 1, 1)
/**
 * The teal reserved for the 1. Over an ivory texture this tint draws #5FB4DF: the charter's
 * #5FB4E8 with its blue stopped at ivory's own, since a tint can only darken a channel.
 */
export const TINT_TEAL = new vec3(0.3846, 0.7563, 1.0)

// ── Brightness: alpha is the hierarchy (charter laws 2 and 4) ───────────────────────────
/** Everything unstruck. */
export const REST = 0.35
/** The half-beat rise before a count. */
export const AND = 0.6
/** The current count, and nothing else. */
export const STRIKE = 1.0
/** Pad border, and the "lost it here" ring. */
export const BORDER = 0.5
/** Parquet grain on the pad. */
export const GRAIN = 0.12
/** The capsule behind a button; charter law 16's ceiling for anything panel-like. */
export const PANEL = 0.3
/** The off-view arrow. */
export const ARROW = 0.6

/** brightness = REST + (STRIKE - REST) * exp(-4 t), t in beats (manifest motion_easing). */
const DECAY_K = 4
/** The rise happens this many beats before the count (manifest motion_beats.and_rise). */
const AND_RISE_BEATS = 0.5

/** Brightness of a struck light t beats after its strike. */
export function decayed(tBeats: number): number {
  if (tBeats >= 1) return REST
  return REST + (STRIKE - REST) * Math.exp(-DECAY_K * tBeats)
}

/**
 * Brightness for a thing that belongs to `counts`, at phrase position `p` (0 at count 1,
 * 7.999 at the end of count 8). Rises one step on the "and", strikes with no attack time on
 * the count, decays to rest over one beat. Holds never light (charter law 5), and a count the
 * session is not showing never lights either.
 */
export function brightnessFor(counts: number[], p: number, shown: (c: number) => boolean): number {
  let b = REST
  for (const c of counts) {
    if (isHold(c) || !shown(c)) continue
    const strikeAt = c - 1
    const since = (((p - strikeAt) % COUNTS_PER_PHRASE) + COUNTS_PER_PHRASE) % COUNTS_PER_PHRASE
    if (since < 1) {
      const d = decayed(since)
      if (d > b) b = d
    }
    const until = (((strikeAt - p) % COUNTS_PER_PHRASE) + COUNTS_PER_PHRASE) % COUNTS_PER_PHRASE
    if (until > 0 && until <= AND_RISE_BEATS && AND > b) b = AND
  }
  return b
}

// ── Meshes ──────────────────────────────────────────────────────────────────────────────

/**
 * Which v coordinate is the image's top row. Lens Studio samples with v = 0 at the image's
 * bottom row, so the top row is v = 1. Checked in the preview: with these the wrong way round
 * a sole print lands heel-first, toes pointing back at the dancer.
 */
const V_TOP = 1
const V_BOTTOM = 0

function builder(): MeshBuilder {
  const b = new MeshBuilder([
    { name: "position", components: 3 },
    { name: "normal", components: 3, normalized: true },
    { name: "texture0", components: 2 },
  ])
  b.topology = MeshTopology.Triangles
  b.indexType = MeshIndexType.UInt16
  return b
}

/** One quad: four corners given as [x, y, z, u, v], wound as a pair of triangles. */
function quad(b: MeshBuilder, n: number[], corners: number[][]): void {
  const start = b.getVerticesCount()
  for (const c of corners) b.appendVerticesInterleaved([c[0], c[1], c[2], n[0], n[1], n[2], c[3], c[4]])
  b.appendIndices([start, start + 1, start + 2, start, start + 2, start + 3])
}

/**
 * A decal lying on the floor: the XZ plane, facing +Y, centred on its object.
 *
 * The image's top row lands at -Z, which is the direction of travel, so a sole print's toes
 * point where the dancer is going. u runs with +X. `tiles` repeats the image over the quad as
 * a grid of whole tiles, each with its own 0..1 coordinates, so no texture wrap mode is needed.
 */
export function floorQuad(widthCm: number, lengthCm: number, tiles: number = 1): RenderMesh {
  const b = builder()
  const n = [0, 1, 0]
  const tw = widthCm / tiles
  const tl = lengthCm / tiles
  for (let ix = 0; ix < tiles; ix++) {
    for (let iz = 0; iz < tiles; iz++) {
      const x0 = -widthCm / 2 + ix * tw
      const x1 = x0 + tw
      const z0 = -lengthCm / 2 + iz * tl
      const z1 = z0 + tl
      quad(b, n, [
        [x0, 0, z0, 0, V_TOP],
        [x1, 0, z0, 1, V_TOP],
        [x1, 0, z1, 1, V_BOTTOM],
        [x0, 0, z1, 0, V_BOTTOM],
      ])
    }
  }
  b.updateMesh()
  return b.getMesh()
}

/**
 * A quad standing up for the user to read: the XY plane, facing +Z, centred on its object.
 * The image's top row lands at +Y.
 */
export function uprightQuad(widthCm: number, heightCm: number): RenderMesh {
  const b = builder()
  const n = [0, 0, 1]
  const w = widthCm / 2
  const h = heightCm / 2
  quad(b, n, [
    [-w, -h, 0, 0, V_BOTTOM],
    [w, -h, 0, 1, V_BOTTOM],
    [w, h, 0, 1, V_TOP],
    [-w, h, 0, 0, V_TOP],
  ])
  b.updateMesh()
  return b.getMesh()
}

/** A filled capsule in the XY plane facing +Z: a rectangle with semicircular ends (law 19). */
export function capsuleMesh(widthCm: number, heightCm: number, segments: number = 10): RenderMesh {
  const b = builder()
  const r = heightCm / 2
  const straight = Math.max(0, widthCm / 2 - r)
  const pts: number[][] = []
  for (let i = 0; i <= segments; i++) {
    const a = -Math.PI / 2 + (i / segments) * Math.PI
    pts.push([straight + Math.cos(a) * r, Math.sin(a) * r])
  }
  for (let i = 0; i <= segments; i++) {
    const a = Math.PI / 2 + (i / segments) * Math.PI
    pts.push([-straight + Math.cos(a) * r, Math.sin(a) * r])
  }
  fanXY(b, pts)
  b.updateMesh()
  return b.getMesh()
}

/** Fan a closed XY polygon from its centroid, facing +Z. */
function fanXY(b: MeshBuilder, pts: number[][]): void {
  let cx = 0
  let cy = 0
  for (const p of pts) {
    cx += p[0]
    cy += p[1]
  }
  cx /= pts.length
  cy /= pts.length
  const start = b.getVerticesCount()
  b.appendVerticesInterleaved([cx, cy, 0, 0, 0, 1, 0.5, 0.5])
  for (const p of pts) b.appendVerticesInterleaved([p[0], p[1], 0, 0, 0, 1, 0.5, 0.5])
  for (let i = 0; i < pts.length; i++) {
    b.appendIndices([start, start + 1 + i, start + 1 + ((i + 1) % pts.length)])
  }
}

/** Fan a closed XZ polygon from its centroid, facing +Y (a shape lying on the floor). */
function fanXZ(b: MeshBuilder, pts: number[][]): void {
  let cx = 0
  let cz = 0
  for (const p of pts) {
    cx += p[0]
    cz += p[1]
  }
  cx /= pts.length
  cz /= pts.length
  const start = b.getVerticesCount()
  b.appendVerticesInterleaved([cx, 0, cz, 0, 1, 0, 0.5, 0.5])
  for (const p of pts) b.appendVerticesInterleaved([p[0], 0, p[1], 0, 1, 0, 0.5, 0.5])
  for (let i = 0; i < pts.length; i++) {
    b.appendIndices([start, start + 1 + i, start + 1 + ((i + 1) % pts.length)])
  }
}

/**
 * The turn arc: one stroke on the floor, 1.5 cm wide at its start and tapering to a rounded
 * tip at the end it turns toward, both ends rounded. The taper is what shows the direction of
 * the spin now that the arrowhead is gone: a clave has rounded ends and a slight taper, and
 * charter law 19 allows no sharp point except a sole print's toes.
 */
export function arcStrokeMesh(
  centerX: number,
  centerZ: number,
  radius: number,
  startDeg: number,
  sweepDeg: number,
  clockwise: boolean,
  strokeCm: number = 1.5,
): RenderMesh {
  const b = builder()
  const dir = clockwise ? 1 : -1
  const steps = 32
  const halfStart = strokeCm / 2
  const halfEnd = strokeCm / 5
  const at = (deg: number, rr: number): number[] => {
    const a = (deg * Math.PI) / 180
    return [centerX + Math.sin(a) * rr, centerZ - Math.cos(a) * rr]
  }
  const halfAt = (t: number): number => halfStart + (halfEnd - halfStart) * t
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps
    const t1 = (i + 1) / steps
    const d0 = startDeg + dir * sweepDeg * t0
    const d1 = startDeg + dir * sweepDeg * t1
    const h0 = halfAt(t0)
    const h1 = halfAt(t1)
    const p0i = at(d0, radius - h0)
    const p1i = at(d1, radius - h1)
    const p1o = at(d1, radius + h1)
    const p0o = at(d0, radius + h0)
    const start = b.getVerticesCount()
    for (const p of [p0i, p1i, p1o, p0o]) b.appendVerticesInterleaved([p[0], 0, p[1], 0, 1, 0, 0.5, 0.5])
    b.appendIndices([start, start + 1, start + 2, start, start + 2, start + 3])
  }
  // Rounded ends.
  for (const end of [0, 1]) {
    const deg = startDeg + dir * sweepDeg * end
    const h = halfAt(end)
    const c = at(deg, radius)
    const pts: number[][] = []
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      pts.push([c[0] + Math.cos(a) * h, c[1] + Math.sin(a) * h])
    }
    fanXZ(b, pts)
  }
  b.updateMesh()
  return b.getMesh()
}

// ── Materials ───────────────────────────────────────────────────────────────────────────

/**
 * An unlit, alpha-blended clone of one of the materials above, so every drawn thing can carry
 * its own brightness. Brightness is the alpha of baseColor (law 2: alpha is brightness on an
 * additive display) and the colour is a tint multiplied into the texture, so an ivory texture
 * with TINT_IVORY stays exactly #F7EEDF.
 */
export function unlitClone(base: Material): Material {
  const m = base.clone()
  const pass = m.mainPass
  pass.blendMode = BlendMode.Normal
  pass.depthWrite = false
  pass.twoSided = true
  return m
}

/** Set a clone's tint and brightness in one call. */
export function setLook(mat: Material, tint: vec3, alpha: number): void {
  mat.mainPass.baseColor = new vec4(tint.x, tint.y, tint.z, alpha)
}
