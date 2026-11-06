/**
 * FloorcountOffViewArrow — a small arrow at the bottom of the view pointing back to the pad.
 *
 * Owns: the chevron texture on a 6 cm quad placed in front of the camera, low in the view and
 * rolled to point toward the pad, ivory at 60 per cent and never animated (laws 10 and 17).
 * Shows only while the footprints are needed (Main sets `needed`) and the dancer is reading
 * neither of the Lens's two surfaces: the pad and the step card both have to be out of view.
 *
 * Expects @inputs: the camera SceneObject, the pad SceneObject, an unlit base material.
 * Main hands it the step card (`cardTarget`) after that.
 *
 * Must not: change session state. It only reads where the camera and pad are.
 */

import { ARROW, MAT_ARROW, setLook, TINT_IVORY, unlitClone, uprightQuad } from "./FloorcountLook"

/** The chevron is drawn in a 6 x 6 cm box (design notes, "The arrow"). */
const ARROW_SIZE_CM = 6

@component
export class FloorcountOffViewArrow extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">FloorcountOffViewArrow – points back to the pad when it is out of view</span>')
  @ui.separator
  @ui.group_start("References")
  @input
  @hint("The camera (the user's head).")
  cameraObject!: SceneObject
  @input
  @hint("The footprint pad the arrow points to.")
  target!: SceneObject
  @ui.group_end
  @ui.separator
  @ui.group_start("Settings")
  @input
  @widget(new SliderWidget(10, 60, 1))
  @hint("Show the arrow only when the pad and the step card are both more than this many degrees from where you look.")
  showAngleDeg: number = 24
  @input
  @widget(new SliderWidget(-20, 0, 0.5))
  @hint("How far below the centre of the view the arrow sits (cm at 60 cm in front).")
  viewDropCm: number = -9
  @ui.group_end

  /** Set by Main: true while the footprints are on the floor (learning, fading, review). */
  needed = true
  /**
   * Set by Main: the step card, the other thing in the Lens a dancer can be reading.
   * Until it is set the card counts as out of view, so the arrow behaves as it did before.
   */
  cardTarget: SceneObject | null = null
  /** True while the arrow is drawn (for tests). */
  showing = false
  /** World-space direction the arrow points, projected in the view plane (for tests). */
  pointing: vec3 = vec3.zero()
  /** The two angles the show rule last read, in degrees (for tests). */
  padAngleDeg = 0
  cardAngleDeg = 0

  private visual!: SceneObject
  private mat!: Material
  private readonly distanceCm = 60

  onAwake(): void {
    this.visual = global.scene.createSceneObject("ArrowVisual")
    this.visual.setParent(this.getSceneObject())
    // The chevron is drawn pointing down in its image, so the quad is turned half a revolution
    // to point along +Y: the roll below then aims it from +Y toward the pad.
    this.visual.getTransform().setLocalRotation(quat.angleAxis(Math.PI, vec3.forward()))
    const rmv = this.visual.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    rmv.mesh = uprightQuad(ARROW_SIZE_CM, ARROW_SIZE_CM)
    this.mat = unlitClone(MAT_ARROW)
    this.mat.mainPass.depthTest = false
    setLook(this.mat, TINT_IVORY, ARROW)
    rmv.mainMaterial = this.mat
    this.visual.enabled = false
    this.createEvent("LateUpdateEvent").bind(() => this.tick())
  }

  private tick(): void {
    if (!this.cameraObject || !this.target) return
    const cam = this.cameraObject.getTransform()
    const camPos = cam.getWorldPosition()
    const fwd = cam.back // camera looks down its local -Z
    const up = cam.up
    const right = cam.right
    const toPad = this.target.getTransform().getWorldPosition().sub(camPos).normalize()
    // Same angle test for both surfaces: the arrow is for a dancer who is reading neither.
    // Turning to the card used to show it, where it sat under "Got it" and read as a tick.
    this.padAngleDeg = this.angleFromView(fwd, camPos, this.target)
    this.cardAngleDeg = this.cardTarget ? this.angleFromView(fwd, camPos, this.cardTarget) : 180
    const show = this.needed && this.padAngleDeg > this.showAngleDeg && this.cardAngleDeg > this.showAngleDeg
    this.showing = show
    if (this.visual.enabled !== show) this.visual.enabled = show
    if (!show) return

    // Direction to the pad in the view plane (right/up), so the chevron points at it.
    let px = toPad.dot(right)
    let py = toPad.dot(up)
    const len = Math.sqrt(px * px + py * py)
    if (len < 0.0001) {
      px = 0
      py = -1
    } else {
      px /= len
      py /= len
    }
    this.pointing = right.uniformScale(px).add(up.uniformScale(py))

    const t = this.getSceneObject().getTransform()
    const pos = camPos.add(fwd.uniformScale(this.distanceCm)).add(up.uniformScale(this.viewDropCm)).add(right.uniformScale(px * 4))
    t.setWorldPosition(pos)
    // Face the camera, then roll the chevron (built pointing local +Y) toward the pad.
    const facing = quat.lookAt(fwd.uniformScale(-1), up)
    const roll = quat.angleAxis(Math.atan2(-px, py), vec3.forward())
    t.setWorldRotation(facing.multiply(roll))
  }

  /** Degrees between where the camera looks and the direction to an object's centre. */
  private angleFromView(fwd: vec3, camPos: vec3, obj: SceneObject): number {
    const to = obj.getTransform().getWorldPosition().sub(camPos).normalize()
    return (Math.acos(Math.max(-1, Math.min(1, fwd.dot(to)))) * 180) / Math.PI
  }
}
