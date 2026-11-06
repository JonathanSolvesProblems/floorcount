/**
 * FloorcountCountUI — the count display above the far edge of the pad: the clave strip, and the
 * numeral above it.
 *
 * Owns: eight capsule cells, one per count, filled for the stepping counts and outlined for the
 * holds, the 1 in teal and the rest ivory; and one ivory numeral at 14 cm cap height. Both read
 * the same beat the footprints do, so a cell strikes and rings out with its print. Holds are
 * rests: nothing lights and the numeral is blank (charter law 5).
 *
 * Public API (Main -> UI): updateBeat(beat, running, shown), setShown(on). Getters for tests:
 * text, isShown, cellBrightness.
 *
 * Must not: decide when the count shows (Main does, from the session rules).
 */

import { Billboard } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Billboard/Billboard"
import { COUNTS_PER_PHRASE, isHold } from "./FloorcountSteps"
import {
  brightnessFor,
  FONT_DISPLAY,
  IVORY,
  MAT_CELL,
  MAT_CELL_EMPTY,
  REST,
  setLook,
  sizeForCapCm,
  TINT_IVORY,
  TINT_TEAL,
  unlitClone,
  uprightQuad,
} from "./FloorcountLook"

// The strip: eight 8 x 4 cm cells with 2 cm gaps is 78 cm wide, inside the pad's 90 cm.
// The manifest's 6 x 3 cm cell was sized for the brand sheet; on a 720p video frame of the
// whole pad a cell came out about 20 px wide and the strip read as a dotted line.
const CELL_W_CM = 8
const CELL_H_CM = 4
const CELL_GAP_CM = 2
const STRIP_W_CM = COUNTS_PER_PHRASE * CELL_W_CM + (COUNTS_PER_PHRASE - 1) * CELL_GAP_CM
/**
 * Numeral cap height, unchanged by the strip's resize, and how far its centre sits above it.
 * The offset is built from the cell, so the taller cell keeps its air rather than crowding
 * the numeral: the gap between the top of a cell and the bottom of the numeral goes 3 to 4 cm.
 */
const NUMERAL_CAP_CM = 14
const NUMERAL_Y_CM = CELL_H_CM / 2 + CELL_GAP_CM * 2 + NUMERAL_CAP_CM / 2

@component
export class FloorcountCountUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">FloorcountCountUI – the clave strip and the count numeral</span>')
  @ui.separator

  private textComp!: Text
  private textObj!: SceneObject
  private stripObj!: SceneObject
  private cellMats: Material[] = []
  private shown = true

  get text(): string {
    return this.textComp ? this.textComp.text : ""
  }
  get isShown(): boolean {
    return this.shown
  }
  /** Brightness of a count's cell as last drawn, for tests. 0 before the first frame. */
  cellBrightness(count: number): number {
    const m = this.cellMats[count - 1]
    return m ? m.mainPass.baseColor.w : 0
  }
  /** Whether a count's cell is drawn in teal rather than ivory, for tests (law 3). */
  isCellTeal(count: number): boolean {
    const m = this.cellMats[count - 1]
    if (!m) return false
    const c = m.mainPass.baseColor
    return Math.abs(c.x - TINT_TEAL.x) < 0.01 && Math.abs(c.z - TINT_TEAL.z) < 0.01
  }
  /** Width of the whole strip in cm, for tests. */
  readonly stripWidthCm = STRIP_W_CM

  onAwake(): void {
    const root = this.getSceneObject()
    const billboard = root.createComponent(Billboard.getTypeName()) as Billboard
    billboard.xAxisEnabled = true
    billboard.yAxisEnabled = true

    // The strip: one cell per count, the holds outlined rather than filled (law 5).
    this.stripObj = global.scene.createSceneObject("ClaveStrip")
    this.stripObj.setParent(root)
    const cellMesh = uprightQuad(CELL_W_CM, CELL_H_CM)
    for (let i = 0; i < COUNTS_PER_PHRASE; i++) {
      const count = i + 1
      const cell = global.scene.createSceneObject("Cell" + count)
      cell.setParent(this.stripObj)
      const x = -STRIP_W_CM / 2 + CELL_W_CM / 2 + i * (CELL_W_CM + CELL_GAP_CM)
      cell.getTransform().setLocalPosition(new vec3(x, 0, 0))
      const mat = unlitClone(isHold(count) ? MAT_CELL_EMPTY : MAT_CELL)
      setLook(mat, count === 1 ? TINT_TEAL : TINT_IVORY, REST)
      const rmv = cell.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
      rmv.mesh = cellMesh
      rmv.mainMaterial = mat
      this.cellMats.push(mat)
    }

    // The numeral, on its own Canvas so the text renders in world space above the strip.
    const textRoot = global.scene.createSceneObject("CountNumeral")
    textRoot.setParent(root)
    textRoot.getTransform().setLocalPosition(new vec3(0, NUMERAL_Y_CM, 0))
    textRoot.createComponent("Component.Canvas")
    this.textObj = global.scene.createSceneObject("CountText")
    this.textObj.setParent(textRoot)
    const t = this.textObj.createComponent("Component.Text") as Text
    t.text = ""
    t.depthTest = true
    t.font = FONT_DISPLAY
    t.size = sizeForCapCm(NUMERAL_CAP_CM)
    t.horizontalAlignment = HorizontalAlignment.Center
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Overflow
    t.verticalOverflow = VerticalOverflow.Overflow
    t.layoutRect = Rect.create(-NUMERAL_CAP_CM, NUMERAL_CAP_CM, -NUMERAL_CAP_CM, NUMERAL_CAP_CM)
    t.textFill.color = new vec4(IVORY.x, IVORY.y, IVORY.z, 1)
    this.textComp = t
  }

  /**
   * Draw the strip and the numeral for a beat position, the same one the pad reads.
   * `shown` is the session's count filter, so a count that is not being practised never lights.
   */
  updateBeat(beat: number, running: boolean, shown: (count: number) => boolean): void {
    const p = ((beat % COUNTS_PER_PHRASE) + COUNTS_PER_PHRASE) % COUNTS_PER_PHRASE
    const count = running ? Math.floor(p) + 1 : 0

    for (let i = 0; i < this.cellMats.length; i++) {
      const c = i + 1
      const alpha = running ? brightnessFor([c], p, shown) : REST
      setLook(this.cellMats[i], c === 1 ? TINT_TEAL : TINT_IVORY, alpha)
    }

    // A hold is a rest, so the numeral is blank rather than dimmed.
    const label = count > 0 && !isHold(count) ? String(count) : ""
    if (this.textComp && this.textComp.text !== label) this.textComp.text = label
  }

  setShown(on: boolean): void {
    this.shown = on
    if (this.textObj && this.textObj.enabled !== on) this.textObj.enabled = on
    if (this.stripObj && this.stripObj.enabled !== on) this.stripObj.enabled = on
  }
}
