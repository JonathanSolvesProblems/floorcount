/**
 * FloorcountPadController — the footprint pad on the floor.
 *
 * Owns: the pad's ivory border and parquet grain, the current step's sole prints (one textured
 * quad per floor spot, left solid and right outlined), the turn arc, and their brightness each
 * frame: rest at 35 per cent, a rise to 60 on the "and", a strike at 100 on the count and a
 * decay back to rest over one beat, with nothing lit on the hold counts (4 and 8). Footprints
 * are pinchable (SIK Interactable): pinching strikes them once and reports the count to Main.
 *
 * Expects @inputs: an unlit base material (cloned per visual). Lives on the authored
 * "FootprintPad" SceneObject; that object's transform is where the pad sits.
 *
 * Must not: decide which step or segment is current (FloorcountMain pushes that in), or keep
 * session state. Marks are pushed in by Main; this only renders them.
 */

import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import Event, { PublicApi } from "SpectaclesInteractionKit.lspkg/Utils/Event"
import { COUNTS_PER_PHRASE, FootSpot, isHold, spotsFor, StepDef, TurnArcSpec } from "./FloorcountSteps"
import {
  arcStrokeMesh,
  BASE_MATERIAL,
  BORDER,
  brightnessFor,
  decayed,
  floorQuad,
  GRAIN,
  MAT_FOOT_LEFT,
  MAT_FOOT_RIGHT,
  MAT_PAD_BORDER,
  MAT_PARQUET,
  REST,
  setLook,
  STRIKE,
  TINT_IVORY,
  TINT_TEAL,
  unlitClone,
} from "./FloorcountLook"

/**
 * The sole-print textures are 12 x 29 cm boxes with the 27 cm print centred in them, so the
 * drawn sole is real foot size with a 1 cm margin at each end of its quad.
 */
const FOOT_QUAD_WIDTH_CM = 12
const FOOT_QUAD_LENGTH_CM = 29
const PRINT_LENGTH_CM = 27
const PRINT_WIDTH_CM = 10
/** The "lost it here" ring stands 1 cm outside the print on every side. */
const MARK_RING_CM = 1
const PAD_SIZE_CM = 90
const PARQUET_TILE_CM = 30
const FLASH_SECONDS = 1.2

interface SpotView {
  spot: FootSpot
  root: SceneObject
  visualMat: Material
  ringObj: SceneObject
  ringMat: Material
  interactable: Interactable
  flashUntil: number
  marked: boolean
  lit: boolean
  /** Teal is reserved for the print that lands on count 1 (charter law 3). */
  isUno: boolean
}

@component
export class FloorcountPadController extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">FloorcountPadController – sole prints, pad border and turn arc</span>')
  @ui.separator

  private _onFootprintPinched = new Event<number>()
  /** Fires with the count of the pinched footprint (the count it most recently lit on). */
  get onFootprintPinched(): PublicApi<number> {
    return this._onFootprintPinched.publicApi()
  }

  private footprintsRoot!: SceneObject
  private borderObj!: SceneObject
  private borderMat!: Material
  private grainObj!: SceneObject
  private grainMat!: Material
  private arcObj: SceneObject | null = null
  private arcMat: Material | null = null
  private arcSpec: TurnArcSpec | null = null
  private views: SpotView[] = []
  private leftMesh!: RenderMesh
  private rightMesh!: RenderMesh
  private shown: (count: number) => boolean = () => true
  private fade = 1
  private floorVisible = true

  /** Current count 1..8 from the last update (0 before the first beat). */
  activeCount = 0
  /** Counts of the footprints struck in the last update. */
  litCounts: number[] = []
  arcVisible = false

  /** Size of a sole print's quad, and of the print drawn inside it, for tests. */
  readonly footQuadLengthCm = FOOT_QUAD_LENGTH_CM
  readonly printLengthCm = PRINT_LENGTH_CM
  readonly printWidthCm = PRINT_WIDTH_CM

  onAwake(): void {
    this.leftMesh = floorQuad(FOOT_QUAD_WIDTH_CM, FOOT_QUAD_LENGTH_CM)
    this.rightMesh = floorQuad(FOOT_QUAD_WIDTH_CM, FOOT_QUAD_LENGTH_CM)

    // The pad: a faint parquet grain inside an ivory border, and nothing else (law 8).
    this.grainObj = this.child(this.getSceneObject(), "PadGrain")
    this.grainMat = unlitClone(MAT_PARQUET)
    setLook(this.grainMat, TINT_IVORY, GRAIN)
    this.addVisual(this.grainObj, floorQuad(PAD_SIZE_CM, PAD_SIZE_CM, PAD_SIZE_CM / PARQUET_TILE_CM), this.grainMat)

    this.borderObj = this.child(this.getSceneObject(), "PadBorder")
    this.borderObj.getTransform().setLocalPosition(new vec3(0, 0.2, 0))
    this.borderMat = unlitClone(MAT_PAD_BORDER)
    setLook(this.borderMat, TINT_IVORY, BORDER)
    this.addVisual(this.borderObj, floorQuad(PAD_SIZE_CM, PAD_SIZE_CM), this.borderMat)

    this.footprintsRoot = this.child(this.getSceneObject(), "Footprints")
  }

  /** Replace the footprints and arc with a step's. */
  loadStep(step: StepDef): void {
    for (const v of this.views) v.root.destroy()
    this.views = []
    if (this.arcObj) this.arcObj.destroy()
    this.arcObj = null
    this.arcMat = null
    this.arcSpec = step.turn

    for (const spot of spotsFor(step)) this.views.push(this.buildSpot(spot))
    if (step.turn) {
      const t = step.turn
      this.arcObj = this.child(this.getSceneObject(), "TurnArc")
      this.arcObj.getTransform().setLocalPosition(new vec3(0, 0.3, 0))
      this.arcMat = unlitClone(BASE_MATERIAL)
      setLook(this.arcMat, TINT_IVORY, REST)
      this.addVisual(
        this.arcObj,
        arcStrokeMesh(t.centerX, t.centerZ, t.radius, t.startDeg, t.sweepDeg, t.direction === "right"),
        this.arcMat,
      )
      this.arcObj.enabled = this.floorVisible
    }
    this.fade = 1
    this.activeCount = 0
    this.litCounts = []
    this.arcVisible = false
  }

  /** Which counts are shown (whole step, counts 1-4, or counts 5-8). */
  setCountFilter(shown: (count: number) => boolean): void {
    this.shown = shown
  }

  setMarks(counts: number[]): void {
    for (const v of this.views) v.marked = v.spot.counts.some((c) => counts.indexOf(c) >= 0)
  }

  /** 1 = fully visible, 0 = faded out. Used for the two-count fade between steps. */
  setFade(f: number): void {
    this.fade = Math.max(0, Math.min(1, f))
  }

  /** Show or clear the whole floor (pad, footprints, arc). */
  setFloorVisible(on: boolean): void {
    this.floorVisible = on
    this.borderObj.enabled = on
    this.grainObj.enabled = on
    this.footprintsRoot.enabled = on
    if (this.arcObj) this.arcObj.enabled = on
  }

  get isFloorVisible(): boolean {
    return this.floorVisible
  }

  /** Names of the footprint SceneObjects, for tests and debugging. */
  footprintNames(): string[] {
    return this.views.map((v) => v.root.name)
  }

  /** Spot counts (per footprint), for tests. */
  footprintCounts(): number[][] {
    return this.views.map((v) => v.spot.counts.slice())
  }

  isFlashing(count: number): boolean {
    const now = getTime()
    return this.views.some((v) => v.spot.counts.indexOf(count) >= 0 && v.flashUntil > now)
  }

  isShownOnFloor(count: number): boolean {
    return this.views.some((v) => v.root.enabled && v.spot.counts.indexOf(count) >= 0)
  }

  flash(count: number): void {
    for (const v of this.views) if (v.spot.counts.indexOf(count) >= 0) v.flashUntil = getTime() + FLASH_SECONDS
  }

  /** True while a count's print carries its "lost it here" ring, for tests. */
  isMarkRingShown(count: number): boolean {
    return this.views.some((v) => v.spot.counts.indexOf(count) >= 0 && v.ringObj.enabled)
  }

  /** Brightness a count's print was last drawn at, for tests. 0 if it has no print. */
  footBrightness(count: number): number {
    for (const v of this.views) if (v.spot.counts.indexOf(count) >= 0) return v.visualMat.mainPass.baseColor.w
    return 0
  }

  /** Whether a count's print is drawn in teal rather than ivory, for tests (law 3). */
  isFootTeal(count: number): boolean {
    for (const v of this.views) {
      if (v.spot.counts.indexOf(count) < 0) continue
      const c = v.visualMat.mainPass.baseColor
      return Math.abs(c.x - TINT_TEAL.x) < 0.01 && Math.abs(c.z - TINT_TEAL.z) < 0.01
    }
    return false
  }

  /** Render the brightness for a beat position (beats since the loop started, count 1 at 0). */
  updateBeat(beat: number, running: boolean): void {
    const p = ((beat % COUNTS_PER_PHRASE) + COUNTS_PER_PHRASE) % COUNTS_PER_PHRASE
    const count = running ? Math.floor(p) + 1 : 0
    this.activeCount = count
    const lit: number[] = []
    const now = getTime()

    for (const v of this.views) {
      const visibleCounts = v.spot.counts.filter((c) => this.shown(c))
      const visible = this.floorVisible && visibleCounts.length > 0
      if (v.root.enabled !== visible) v.root.enabled = visible
      if (!visible) {
        v.lit = false
        if (v.ringObj.enabled) v.ringObj.enabled = false
        continue
      }

      let alpha = running ? brightnessFor(v.spot.counts, p, this.shown) : REST
      v.lit = running && count > 0 && !isHold(count) && visibleCounts.indexOf(count) >= 0
      if (v.lit) lit.push(count)

      // A pinched print strikes once and rings out, the same curve as a count (law 9).
      if (v.flashUntil > now) {
        const t = (FLASH_SECONDS - (v.flashUntil - now)) / FLASH_SECONDS
        alpha = Math.max(alpha, decayed(t))
      }

      setLook(v.visualMat, v.isUno ? TINT_TEAL : TINT_IVORY, alpha * this.fade)

      const ringOn = v.marked
      if (v.ringObj.enabled !== ringOn) v.ringObj.enabled = ringOn
      if (ringOn) setLook(v.ringMat, v.isUno ? TINT_TEAL : TINT_IVORY, BORDER * this.fade)
    }
    this.litCounts = lit

    setLook(this.borderMat, TINT_IVORY, BORDER * this.fade)
    setLook(this.grainMat, TINT_IVORY, GRAIN * this.fade)

    // The turn arc: full on its own counts, at rest otherwise (design notes, "The pad").
    let arcAlpha = REST
    if (this.arcSpec && this.floorVisible && running) {
      const turnShown = this.arcSpec.counts.filter((c) => this.shown(c))
      if (turnShown.indexOf(count) >= 0) arcAlpha = STRIKE
    }
    this.arcVisible = arcAlpha >= STRIKE
    if (this.arcMat) setLook(this.arcMat, TINT_IVORY, arcAlpha * this.fade)
  }

  // ---------------------------------------------------------------- building

  private buildSpot(spot: FootSpot): SpotView {
    const root = this.child(this.footprintsRoot, "Footprint_C" + spot.counts.join("_"))
    root.getTransform().setLocalPosition(new vec3(spot.x, 0, spot.z))
    // Collider on the unit-scale, identity-rotation root; generous so it is easy to aim at.
    const collider = root.createComponent("Physics.ColliderComponent") as ColliderComponent
    const box = Shape.createBoxShape()
    box.size = new vec3(FOOT_QUAD_WIDTH_CM + 2, 3, FOOT_QUAD_LENGTH_CM + 2)
    collider.shape = box
    collider.fitVisual = false
    const interactable = root.createComponent(Interactable.getTypeName()) as Interactable

    const isUno = spot.counts.indexOf(1) >= 0
    const footMat = spot.foot === "L" ? MAT_FOOT_LEFT : MAT_FOOT_RIGHT
    const mesh = spot.foot === "L" ? this.leftMesh : this.rightMesh
    // Leaf visuals carry the yaw, so the toes point the way the dancer travels.
    const rot = quat.angleAxis((spot.yawDeg * Math.PI) / 180, vec3.up())

    const ringObj = this.child(root, "MarkRing")
    ringObj.getTransform().setLocalPosition(new vec3(0, 0.1, 0))
    ringObj.getTransform().setLocalRotation(rot)
    ringObj.getTransform().setLocalScale(
      new vec3(
        (PRINT_WIDTH_CM + MARK_RING_CM * 2) / PRINT_WIDTH_CM,
        1,
        (PRINT_LENGTH_CM + MARK_RING_CM * 2) / PRINT_LENGTH_CM,
      ),
    )
    const ringMat = unlitClone(footMat)
    setLook(ringMat, TINT_IVORY, BORDER)
    this.addVisual(ringObj, mesh, ringMat)
    ringObj.enabled = false

    const visual = this.child(root, "Foot")
    visual.getTransform().setLocalPosition(new vec3(0, 0.4, 0))
    visual.getTransform().setLocalRotation(rot)
    const visualMat = unlitClone(footMat)
    setLook(visualMat, isUno ? TINT_TEAL : TINT_IVORY, REST)
    this.addVisual(visual, mesh, visualMat)

    const view: SpotView = {
      spot,
      root,
      visualMat,
      ringObj,
      ringMat,
      interactable,
      flashUntil: 0,
      marked: false,
      lit: false,
      isUno,
    }
    interactable.onTriggerEnd.add(() => this._onFootprintPinched.invoke(this.countForPinch(spot)))
    return view
  }

  /** For a spot shared by several counts, report the one that lit most recently. */
  private countForPinch(spot: FootSpot): number {
    if (spot.counts.length === 1) return spot.counts[0]
    const cur = this.activeCount > 0 ? this.activeCount : 1
    let best = spot.counts[0]
    let bestAgo = 99
    for (const c of spot.counts) {
      const ago = (cur - c + COUNTS_PER_PHRASE) % COUNTS_PER_PHRASE
      if (ago < bestAgo) {
        bestAgo = ago
        best = c
      }
    }
    return best
  }

  private child(parent: SceneObject, name: string): SceneObject {
    const o = global.scene.createSceneObject(name)
    o.setParent(parent)
    return o
  }

  private addVisual(obj: SceneObject, mesh: RenderMesh, mat: Material): RenderMeshVisual {
    const rmv = obj.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    rmv.mesh = mesh
    rmv.mainMaterial = mat
    return rmv
  }
}
