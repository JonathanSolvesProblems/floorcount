/**
 * FloorcountStepCardUI — the step card to the right of the pad.
 *
 * Owns: ivory text on the air (no panel, charter law 16) with the step name, "Step N of 3", the
 * tempo and what part of the step is showing, plus the two pinch targets: Again on the left and
 * Got it on the right, each a capsule at 30 per cent ivory, bright only during the two-count
 * answer window. At session end the three lines show each step's Again count and the title
 * becomes "Practise again".
 *
 * It is built from Text components and SIK Interactables rather than UI Kit: UI Kit's Button
 * and BackPlate draw their own plate and their own hover state, which laws 10 and 16 do not
 * allow, and the object names below are the ones the LEAF scenarios pinch by name.
 *
 * Public API (Main -> UI): setStep, setTempo, setFocus, setPaused, setAnswerWindow,
 * showSummary, showPractice. Events (UI -> Main): onTitle, onAgain, onGotIt.
 *
 * Must not: hold session state or decide anything. It renders what Main pushes in.
 */

import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import { Billboard } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Billboard/Billboard"
import Event, { PublicApi } from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {
  BASE_MATERIAL,
  capsuleMesh,
  FONT_DISPLAY,
  IVORY,
  PANEL,
  REST,
  setLook,
  sizeForCapCm,
  STRIKE,
  TINT_IVORY,
  unlitClone,
} from "./FloorcountLook"

/**
 * Cap heights in cm at the card's 1 m distance.
 *
 * The manifest's scale (6.75 for the step name, 4.5 for the progress, 10 for a button label)
 * is a brand-sheet scale and does not survive contact with this card: "Basic step" at 6.75 cm
 * draws 53 cm wide, wider than the glasses can show at 1 m, and a 10 cm label cannot sit on a
 * 5 cm capsule at all. These keep the manifest's order and its 3 cm body size, and set the
 * rest to the largest that fits the card while staying above charter law 13's 2.5 cm floor.
 */
const CAP_TITLE = 5
const CAP_PROGRESS = 3.5
const CAP_LINE = 3
const CAP_BUTTON = 3
/** The summary's rows are the longest strings on the card, so they sit at the 2.5 cm floor. */
const CAP_SUMMARY = 2.5
/** Buttons: height from the manifest's sizes_cm.button_height. Width is fitted to the label. */
const BUTTON_H_CM = 5
/** Smallest a capsule may be, from the brief. It only ever grows from here, never shrinks. */
const BUTTON_MIN_W_CM = 12
/** Air between a label's ink and the inside of its capsule, each side, in cm. */
const BUTTON_AIR_CM = 1.5
/** Clear space between the two capsules, in cm, so they never read as one phrase. */
const BUTTON_GAP_CM = 6
/**
 * How wide the whole card is allowed to get, in cm. panelWidthCm sets where the lines start;
 * this bounds how far right anything may run from there. Two thirds of the 90 cm pad, so
 * charter law 16 ("never wider than the pad") holds with room to spare.
 */
const CARD_MAX_W_CM = 60
/** Vertical places of the card's lines, in cm from the card's own origin. */
const Y_TITLE = 14
const Y_PROGRESS = 6
const Y_TEMPO = 0.5
const Y_FOCUS = -4.5
const Y_BUTTONS = -13
/**
 * The paused state in words rather than a glyph: the charter bans the stock icon set, and with
 * the music stopped and the counts frozen nothing else on the card says the session is held.
 * It takes the focus line's slot and the focus text comes back on resume.
 */
const PAUSED_LINE = "Paused. Pinch the title to go on."

/** One answer button: its target object, its capsule and its label, kept so the fit can resize them. */
interface AnswerButton {
  obj: SceneObject
  collider: ColliderComponent
  visual: RenderMeshVisual
  label: Text
  labelWidthCm: number
}

@component
export class FloorcountStepCardUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">FloorcountStepCardUI – step card with Again and Got it</span>')
  @ui.separator
  @ui.group_start("Settings")
  @input
  @widget(new SliderWidget(24, 90, 0.5))
  @hint("Width the card's lines are laid out in, in cm. Never wider than the pad (law 16).")
  panelWidthCm: number = 60
  @input
  @widget(new SliderWidget(8, 14, 0.5))
  @hint("Smallest width of the Again and Got it capsules in cm; they grow to fit their label.")
  buttonWidthCm: number = BUTTON_MIN_W_CM
  @input
  @hint("Label of the left button.")
  againLabel: string = "Again"
  @input
  @hint("Label of the right button.")
  gotItLabel: string = "Got it"
  @ui.group_end

  private _onTitle = new Event<void>()
  private _onAgain = new Event<void>()
  private _onGotIt = new Event<void>()
  get onTitle(): PublicApi<void> {
    return this._onTitle.publicApi()
  }
  get onAgain(): PublicApi<void> {
    return this._onAgain.publicApi()
  }
  get onGotIt(): PublicApi<void> {
    return this._onGotIt.publicApi()
  }

  private titleTextComp!: Text
  private lines: Text[] = []
  private footer!: Text
  private buttons: AnswerButton[] = []
  private buttonCapsules: Material[] = []
  private paused = false
  private summaryMode = false
  private titleLabel = ""
  /** The focus text Main last pushed in, held so resuming can put it back. */
  private focusLabel = ""
  private capsuleWidthCm = BUTTON_MIN_W_CM
  /** The one left edge every line and the button row start from, in the card's own space. */
  private leftEdgeCm = -BUTTON_MIN_W_CM
  private fitted = false
  private fitAttempts = 0
  /** Cap height the paused line ends up at, measured on the first frame (see fitPausedLine). */
  private pausedCapCm = CAP_LINE
  /** Throwaway Text used once to measure the paused line; destroyed after the fit. */
  private pausedProbe: Text | null = null

  /** For tests: the button bright state and current strings. */
  buttonsBright = false
  get titleText(): string {
    return this.titleLabel
  }
  lineText(i: number): string {
    return this.lines[i] ? this.lines[i].text : ""
  }
  get isSummary(): boolean {
    return this.summaryMode
  }
  get isPaused(): boolean {
    return this.paused
  }

  // --- For tests: the measurements the design pass is judged on. ---

  /**
   * Left edge of a line's layout box in the card's own space, where 0 is the title and 1 to 3
   * are the progress, tempo and focus lines. All four must be the same number: that is what
   * "the four lines share one left edge" means in the Lens, before the camera's perspective
   * leans the card's verticals in a screenshot.
   */
  lineLeftEdgeCm(i: number): number {
    const t = i === 0 ? this.titleTextComp : this.lines[i - 1]
    if (!t) return NaN
    return this.holderXCm(t) + t.layoutRect.left
  }

  /**
   * How far a Text's own origin sits from the card's, in cm along the card's x.
   *
   * The title hangs off its pinch target and the three body lines off a shared CardText
   * object, so a line's place in the card is its holder's x plus that holder's parent's.
   */
  private holderXCm(t: Text): number {
    const holder = t.getSceneObject().getParent()
    const x = holder ? holder.getTransform().getLocalPosition().x : 0
    const parent = holder ? holder.getParent() : null
    const parentX = parent && parent !== this.getSceneObject() ? parent.getTransform().getLocalPosition().x : 0
    return parentX + x
  }

  /**
   * Left edge of a line's drawn ink, in the same space as lineLeftEdgeCm.
   *
   * lineLeftEdgeCm is the box a line was given; this is where its first glyph actually lands
   * inside that box, which is what a screenshot shows. With every line left-aligned in a box
   * with the same left edge the four agree to within a glyph's side bearing, a few millimetres.
   */
  lineInkLeftCm(i: number): number {
    const t = i === 0 ? this.titleTextComp : this.lines[i - 1]
    if (!t) return NaN
    const min = t.localAabbMin()
    if (!min) return NaN
    return this.holderXCm(t) + min.x
  }

  /** Rendered width of a line's text in cm, 0 before the text mesh exists. */
  lineWidthCm(i: number): number {
    const t = i === 0 ? this.titleTextComp : this.lines[i - 1]
    return t ? this.textWidthCm(t) : 0
  }

  /** Width of each answer capsule in cm, after the fit. Both are the same. */
  get capsuleWidth(): number {
    return this.capsuleWidthCm
  }

  /**
   * Left edge of the Again capsule, in the same space as lineInkLeftCm.
   *
   * The button row starts on the lines' left edge, so the card reads as one left-aligned
   * block rather than four lines with a stray pair of targets under them.
   */
  get capsuleLeftCm(): number {
    if (this.buttons.length === 0) return NaN
    return this.buttons[0].obj.getTransform().getLocalPosition().x - this.capsuleWidthCm / 2
  }

  /** Clear space between the two capsules in cm, measured from their edges. */
  get capsuleGapCm(): number {
    if (this.buttons.length < 2) return 0
    const a = this.buttons[0].obj.getTransform().getLocalPosition().x
    const b = this.buttons[1].obj.getTransform().getLocalPosition().x
    return Math.abs(b - a) - this.capsuleWidthCm
  }

  /** Air in cm between a label's ink and the inside of its capsule, on one side. */
  labelAirCm(i: number): number {
    const b = this.buttons[i]
    if (!b) return 0
    return (this.capsuleWidthCm - b.labelWidthCm) / 2
  }

  /** Cap height the paused line is drawn at, in cm. Never below charter law 13's 2.5 cm. */
  get pausedCapHeightCm(): number {
    return this.pausedCapCm
  }

  /** The words the focus line carries while the session is held. */
  get pausedLineText(): string {
    return PAUSED_LINE
  }

  onAwake(): void {
    const root = this.getSceneObject()
    const billboard = root.createComponent(Billboard.getTypeName()) as Billboard
    billboard.xAxisEnabled = false
    billboard.yAxisEnabled = true

    const innerW = this.panelWidthCm
    this.leftEdgeCm = -innerW / 2
    // The title doubles as the start / pause target (brief, "Hands and input").
    const titleTarget = this.target(root, "TitleButton", new vec3(0, Y_TITLE, 0), innerW, CAP_TITLE + 2)
    // One weight on the card: the title is ExtraBold like the lines under it, at its own size.
    // Two weights read as two voices, and size already says which line is the title.
    this.titleTextComp = this.addText(titleTarget.obj, "TitleText", "Basic step", CAP_TITLE, FONT_DISPLAY, innerW, false)
    this.titleLabel = "Basic step"
    titleTarget.interactable.onTriggerEnd.add(() => this._onTitle.invoke())

    const textRoot = global.scene.createSceneObject("CardText")
    textRoot.setParent(root)
    // The three body lines are ExtraBold: at 3 to 3.5 cm against a sunlit wall or a cream sofa
    // the Medium weight washes out on an additive display, and brightness is already spoken
    // for as the count hierarchy (law 4), so weight is what is left to hold the line.
    this.lines.push(this.addText(textRoot, "Line1", "Step 1 of 3", CAP_PROGRESS, FONT_DISPLAY, innerW, false, Y_PROGRESS))
    this.lines.push(this.addText(textRoot, "Line2", "Slow, 140 BPM", CAP_LINE, FONT_DISPLAY, innerW, false, Y_TEMPO))
    this.lines.push(this.addText(textRoot, "Line3", "Whole step", CAP_LINE, FONT_DISPLAY, innerW, false, Y_FOCUS))
    this.focusLabel = "Whole step"
    // Shown only by the summary; the practice-mode caption the brief had here is gone.
    this.footer = this.addText(textRoot, "Footer", "", CAP_LINE, FONT_DISPLAY, innerW, false, Y_BUTTONS)
    // Measured once on the first frame, then thrown away: the paused line is the longest
    // string the card ever shows in practice and its size has to be fitted, not guessed.
    // Drawn at zero alpha rather than disabled: a disabled object builds no text mesh, and
    // without a mesh there is nothing to measure.
    this.pausedProbe = this.addText(textRoot, "PausedProbe", PAUSED_LINE, CAP_LINE, FONT_DISPLAY, innerW, false, Y_FOCUS)
    this.pausedProbe.textFill.color = new vec4(IVORY.x, IVORY.y, IVORY.z, 0)

    this.buttons.push(this.addAnswerButton("AgainButton", this.againLabel, () => this._onAgain.invoke()))
    this.buttons.push(this.addAnswerButton("GotItButton", this.gotItLabel, () => this._onGotIt.invoke()))
    this.layoutButtons()
    this.setAnswerWindow(false)

    // A Text has no mesh until it has been laid out once, so the lines and the labels can
    // only be measured from the first frame on. The fit runs then and the card settles
    // before anything shows.
    this.createEvent("OnStartEvent").bind(() => this.tryFit())
    const update = this.createEvent("UpdateEvent")
    update.bind(() => {
      if (this.fitted || this.fitAttempts > 10) return
      this.tryFit()
    })
  }

  // ---------------------------------------------------------------- public API

  setStep(name: string, index: number, total: number): void {
    this.titleLabel = name
    if (!this.summaryMode) this.titleTextComp.text = name
    this.setLine(0, "Step " + (index + 1) + " of " + total)
  }

  /** "Slow, 140 BPM" (voice.md: tempo is Slow, Medium or Full, and a count is a numeral). */
  setTempo(name: string, bpm: number): void {
    this.setLine(1, name + ", " + bpm + " BPM")
  }

  /** The focus line. While the session is paused the paused words hold the slot instead. */
  setFocus(text: string): void {
    this.focusLabel = text
    if (!this.paused) this.showFocusLine()
  }

  /**
   * Paused in words, not a glyph (law 14's voice, and the charter bans the stock icon set).
   * The focus line carries it so the card gains no fifth line, and the focus text comes back
   * on resume even if Main pushed a new one in while the session was held.
   */
  setPaused(paused: boolean): void {
    if (this.paused === paused) return
    this.paused = paused
    if (this.summaryMode) return
    this.showFocusLine()
  }

  /** Bright for the two counts after an 8-count (waiting for an answer), at rest during it. */
  setAnswerWindow(bright: boolean): void {
    this.buttonsBright = bright
    const b = bright ? STRIKE : REST
    for (const m of this.buttonCapsules) setLook(m, TINT_IVORY, PANEL * b)
    for (const btn of this.buttons) btn.label.textFill.color = new vec4(IVORY.x, IVORY.y, IVORY.z, b)
  }

  showSummary(rows: string[], footer: string): void {
    this.summaryMode = true
    this.titleLabel = "Practise again"
    this.titleTextComp.text = "Practise again"
    // A row that also names the counts the dancer lost is the longest line the card ever
    // carries, so the rows drop to the charter's smallest legal cap height while it is up.
    for (const t of this.lines) t.size = sizeForCapCm(CAP_SUMMARY)
    for (let i = 0; i < this.lines.length; i++) this.setLine(i, rows[i] ?? "")
    // The footer is a sentence the length of the paused line, so it takes that line's fitted
    // size, and the card's one weight.
    this.footer.size = sizeForCapCm(this.pausedCapCm)
    this.footer.text = footer
    for (const b of this.buttons) b.obj.enabled = false
  }

  showPractice(): void {
    this.summaryMode = false
    this.lines[0].size = sizeForCapCm(CAP_PROGRESS)
    this.lines[1].size = sizeForCapCm(CAP_LINE)
    this.showFocusLine()
    for (const b of this.buttons) b.obj.enabled = true
    this.footer.text = ""
  }

  // ---------------------------------------------------------------- building

  /**
   * Draw the focus line as it should stand right now: the paused words while the session is
   * held, the focus text Main pushed in otherwise.
   *
   * The paused sentence is longer than any focus string, so it also carries its own cap
   * height, measured once at startup by fitPausedLine. Everything that changes the paused
   * flag or the focus text comes through here, so the two can never disagree.
   */
  private showFocusLine(): void {
    const line = this.lines[2]
    if (!line) return
    line.size = sizeForCapCm(this.paused ? this.pausedCapCm : CAP_LINE)
    line.text = this.paused ? PAUSED_LINE : this.focusLabel
  }

  private setLine(i: number, text: string): void {
    if (this.lines[i]) this.lines[i].text = text
  }

  /** A pinch target: a box collider and an SIK Interactable on an object LEAF can find by name. */
  private target(
    parent: SceneObject,
    name: string,
    pos: vec3,
    widthCm: number,
    heightCm: number,
  ): { obj: SceneObject; interactable: Interactable; collider: ColliderComponent } {
    const so = global.scene.createSceneObject(name)
    so.setParent(parent)
    so.getTransform().setLocalPosition(pos)
    const collider = so.createComponent("Physics.ColliderComponent") as ColliderComponent
    collider.shape = this.boxOf(widthCm, heightCm)
    collider.fitVisual = false
    const interactable = so.createComponent(Interactable.getTypeName()) as Interactable
    return { obj: so, interactable, collider }
  }

  private boxOf(widthCm: number, heightCm: number): BoxShape {
    const box = Shape.createBoxShape()
    box.size = new vec3(widthCm, heightCm, 2)
    return box
  }

  private addAnswerButton(name: string, label: string, onClick: () => void): AnswerButton {
    const made = this.target(
      this.getSceneObject(),
      name,
      new vec3(0, Y_BUTTONS, 0),
      BUTTON_MIN_W_CM,
      BUTTON_H_CM,
    )
    const so = made.obj
    const capsule = global.scene.createSceneObject("Capsule")
    capsule.setParent(so)
    const rmv = capsule.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    rmv.mesh = capsuleMesh(BUTTON_MIN_W_CM, BUTTON_H_CM)
    const mat = unlitClone(BASE_MATERIAL)
    setLook(mat, TINT_IVORY, PANEL * REST)
    rmv.mainMaterial = mat
    this.buttonCapsules.push(mat)
    const text = this.addText(so, name + "Label", label, CAP_BUTTON, FONT_DISPLAY, BUTTON_MIN_W_CM, true, 0, 0.4)
    made.interactable.onTriggerEnd.add(onClick)
    return { obj: so, collider: made.collider, visual: rmv, label: text, labelWidthCm: 0 }
  }

  /**
   * Measure the drawn text, then settle the whole card on it: capsule width, the one left
   * edge, and the cap height of the paused line. Returns false while nothing has a mesh yet.
   *
   * Both capsules take the width the wider label needs: neither answer is primary, so neither
   * may read as the bigger target. The card is then made as wide as the widest thing on it,
   * and the left edge put at half that to the left of the card's origin, so a block of
   * left-aligned lines still sits over the place in the room the card was put rather than
   * hanging off to one side of it. Nothing here depends on the layout boxes it goes on to
   * set, since the lines overflow their boxes rather than wrapping in them, so one pass is
   * enough and the numbers do not drift on a second.
   */
  private tryFit(): boolean {
    this.fitAttempts++
    let widestLabel = 0
    for (const b of this.buttons) {
      const w = this.textWidthCm(b.label)
      if (w <= 0) return false
      b.labelWidthCm = w
      if (w > widestLabel) widestLabel = w
    }
    // How far inside its own box each line's ink starts, read against the box the mesh was
    // actually built with. This has to happen before layoutLines moves the boxes: a Text's
    // mesh lags a layoutRect change by a frame, so measuring after would compare a new box
    // against an old mesh and push every line sideways by the difference.
    const bearings = this.lineTexts().map((t) => this.inkBearingCm(t))

    const cap = Math.min(this.panelWidthCm, CARD_MAX_W_CM)
    // The pair plus its gap may not outgrow the card.
    const roomForOne = (cap - BUTTON_GAP_CM) / 2
    this.capsuleWidthCm = Math.min(roomForOne, Math.max(this.buttonWidthCm, widestLabel + 2 * BUTTON_AIR_CM))

    // The widest thing on the card is either the button row or one of the four lines. The
    // paused line is left out of it: it is longer than all of them and it would drag the
    // whole card sideways every time the session is held. It shrinks to fit instead.
    let contentW = 2 * this.capsuleWidthCm + BUTTON_GAP_CM
    for (let i = 0; i < 4; i++) {
      const w = this.lineWidthCm(i)
      if (w <= 0) return false
      if (w > contentW) contentW = w
    }
    this.leftEdgeCm = -Math.min(cap, contentW) / 2

    this.layoutLines(cap)
    this.alignInk(bearings)
    this.layoutButtons()
    this.fitPausedLine(cap)
    this.fitted = true
    print(
      "Floorcount card: labels " + this.buttons.map((b) => b.labelWidthCm.toFixed(1)).join(" / ") +
        " cm, capsule " + this.capsuleWidthCm.toFixed(1) + " cm, air " +
        this.buttons.map((_, i) => this.labelAirCm(i).toFixed(1)).join(" / ") + " cm, gap " +
        this.capsuleGapCm.toFixed(1) + " cm, paused line at " + this.pausedCapCm.toFixed(2) +
        " cm cap. Card " + contentW.toFixed(1) + " cm wide, every line and the button row from " +
        this.leftEdgeCm.toFixed(2) + " cm. Ink bearings " +
        bearings.map((b) => b.toFixed(2)).join(" / ") + " cm, taken off; line widths " +
        [0, 1, 2, 3].map((i) => this.lineWidthCm(i).toFixed(1)).join(" / ") +
        " cm. (Measured edges are in the C7 scenario: the text mesh here is a frame behind.)",
    )
    return true
  }

  /**
   * Give every line the same layout box, so every line starts on the same vertical.
   *
   * The box runs the full width of the card from the shared left edge. The lines overflow it
   * rather than wrapping in it, so the right edge only has to be somewhere past the longest
   * line; it is the left edge that does the work.
   */
  private layoutLines(cap: number): void {
    const left = this.leftEdgeCm
    this.setLineRect(this.titleTextComp, left, cap, CAP_TITLE)
    this.setLineRect(this.lines[0], left, cap, CAP_PROGRESS)
    this.setLineRect(this.lines[1], left, cap, CAP_LINE)
    this.setLineRect(this.lines[2], left, cap, CAP_LINE)
    this.setLineRect(this.footer, left, cap, CAP_LINE)
    if (this.pausedProbe) this.setLineRect(this.pausedProbe, left, cap, CAP_LINE)
  }

  private setLineRect(t: Text, left: number, cap: number, capCm: number): void {
    t.layoutRect = Rect.create(left, left + cap, -capCm, capCm)
  }

  /** The card's four lines, title first, in the order lineLeftEdgeCm indexes them. */
  private lineTexts(): Text[] {
    return [this.titleTextComp, this.lines[0], this.lines[1], this.lines[2]]
  }

  /**
   * How far inside its own layout box a Text's ink starts, in cm, or NaN before it has a mesh.
   *
   * Measured, not assumed: it comes out a constant fraction of the line's own size, about
   * -0.24 of the cap height, so a bigger line hangs further out to the left than a smaller
   * one. Reading it rather than hard-coding it keeps this right if a size or the face changes.
   */
  private inkBearingCm(t: Text): number {
    const min = t ? t.localAabbMin() : null
    return min ? min.x - t.layoutRect.left : NaN
  }

  /**
   * Nudge each line so its drawn ink, not its layout box, starts on the shared left edge.
   *
   * Four lines on one box edge still draw four different edges, because each one's ink starts
   * a fraction of its own size away from that edge; the title, being the biggest, overhangs
   * the rest by about 5 mm. That is small, but it is exactly the fault this pass is fixing,
   * and the title is the line a reader's eye uses to find the edge. Taking each line's own
   * bearing back off its holder puts all four on one vertical.
   */
  private alignInk(bearings: number[]): void {
    const texts = this.lineTexts()
    for (let i = 0; i < texts.length; i++) {
      const t = texts[i]
      const bearing = bearings[i]
      const holder = t ? t.getSceneObject().getParent() : null
      if (!holder || isNaN(bearing)) continue
      const p = holder.getTransform().getLocalPosition()
      // layoutLines has just put every box's left edge on leftEdgeCm, so cancelling the
      // bearing is all that is left to put the ink there too.
      holder.getTransform().setLocalPosition(new vec3(-bearing, p.y, p.z))
    }
  }

  /**
   * Choose the cap height the paused line is drawn at and drop the probe.
   *
   * It is a sentence, not a label, and at the body size it runs past the card. Shrinking it
   * to fit is the only lever left: the string is fixed and it may not wrap, since the line
   * below it is the buttons. It never goes under charter law 13's 2.5 cm floor, so if the
   * sentence still overflows at 2.5 the print above says so rather than the card quietly
   * breaking the law.
   */
  private fitPausedLine(cap: number): void {
    const probe = this.pausedProbe
    if (!probe) return
    const w = this.textWidthCm(probe)
    if (w > 0) {
      const fits = (CAP_LINE * cap) / w
      this.pausedCapCm = Math.max(CAP_SUMMARY, Math.min(CAP_LINE, fits))
      print(
        "Floorcount card: paused line '" + PAUSED_LINE + "' measures " + w.toFixed(1) +
          " cm at " + CAP_LINE + " cm cap, drawn at " + this.pausedCapCm.toFixed(2) + " cm cap = " +
          ((w * this.pausedCapCm) / CAP_LINE).toFixed(1) + " cm wide against a " + cap + " cm card.",
      )
    }
    probe.getSceneObject().destroy()
    this.pausedProbe = null
  }

  /**
   * Place and size the two capsules from capsuleWidthCm.
   *
   * The pair starts on the same left edge as the four text lines, so the card reads as one
   * left-aligned block rather than a left-aligned text with a centred pair of targets under
   * it. Growing the capsules outward from a centre would have pushed the left one past the
   * start of every line above it.
   */
  private layoutButtons(): void {
    const w = this.capsuleWidthCm
    const left = this.leftEdgeCm
    for (let i = 0; i < this.buttons.length; i++) {
      const b = this.buttons[i]
      const x = left + w / 2 + i * (w + BUTTON_GAP_CM)
      b.obj.getTransform().setLocalPosition(new vec3(x, Y_BUTTONS, 0))
      b.collider.shape = this.boxOf(w, BUTTON_H_CM)
      b.visual.mesh = capsuleMesh(w, BUTTON_H_CM)
      b.label.layoutRect = Rect.create(-w / 2, w / 2, -CAP_BUTTON, CAP_BUTTON)
    }
  }

  /** Width of a Text's drawn ink in cm, or 0 before its mesh has been built. */
  private textWidthCm(t: Text): number {
    const min = t.localAabbMin()
    const max = t.localAabbMax()
    if (!min || !max) return 0
    const w = max.x - min.x
    return w > 0 && w < 1000 ? w : 0
  }

  /**
   * One line of ivory text on its own Canvas, left-aligned unless it labels a button.
   *
   * Every line passes the same widthCm and sits at local x = 0, so every layout box has its
   * left edge at the same -widthCm / 2 and the four lines start on one vertical. A screenshot
   * taken with the head tipped down still shows them leaning, because a world vertical
   * converges toward the nadir off the view axis; that is the camera, not the layout, and
   * lineLeftEdgeCm asserts the layout.
   */
  private addText(
    parent: SceneObject,
    name: string,
    text: string,
    capCm: number,
    font: Font,
    widthCm: number,
    centred: boolean,
    y: number = 0,
    z: number = 0.2,
  ): Text {
    const holder = global.scene.createSceneObject(name + "Root")
    holder.setParent(parent)
    holder.getTransform().setLocalPosition(new vec3(0, y, z))
    holder.createComponent("Component.Canvas")
    const so = global.scene.createSceneObject(name)
    so.setParent(holder)
    const t = so.createComponent("Component.Text") as Text
    t.text = text
    t.depthTest = true
    t.font = font
    t.size = sizeForCapCm(capCm)
    t.horizontalAlignment = centred ? HorizontalAlignment.Center : HorizontalAlignment.Left
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Overflow
    t.verticalOverflow = VerticalOverflow.Overflow
    t.layoutRect = Rect.create(-widthCm / 2, widthCm / 2, -capCm, capCm)
    t.textFill.color = new vec4(IVORY.x, IVORY.y, IVORY.z, 1)
    return t
  }
}
