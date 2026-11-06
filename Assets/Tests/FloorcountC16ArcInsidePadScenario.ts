/**
 * Both turn arcs stay on the pad, measured on the mesh the running Lens built.
 *
 * Each arc used to run about 5 cm past the pad's edge, which put a lit stroke on the floor
 * outside the only thing the dancer is meant to read as the practice area. Both are now rings
 * of radius 17 around the pivoting feet, and this measures the result rather than the numbers:
 * the arc's own bounding box against the inner edge of the pad's border.
 *
 * The border is drawn from `pad-border.png`, a 1.8 cm stroke lying just inside a 90 cm quad, so
 * its inner edge is 45 - 1.8 = 43.2 cm from the pad's centre. An arc inside that is inside the
 * drawn border with the border's own width to spare.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import {
  interactor,
  main,
  masterCurrentStep,
  objectNamed,
  restartSession,
  waitForStepIndex,
} from "./FloorcountTestKit"

/** Inner edge of the pad border, in cm from the pad's centre. */
const BORDER_INNER_CM = 43.2

@component
export class FloorcountC16ArcInsidePadScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1000)
    await restartSession()
    await sleep(600)

    const io = interactor()
    const m = main()

    // The basic step has no turn, so there is no arc to measure yet.
    expect(m.state.step.turn).toBe(null)

    await masterCurrentStep(io)
    expect(await waitForStepIndex(1, 15000)).toBe(true)
    await sleep(400)
    expect(m.state.step.id).toBe("rightTurn")
    this.measureArc("right turn")

    await masterCurrentStep(io)
    expect(await waitForStepIndex(2, 15000)).toBe(true)
    await sleep(400)
    expect(m.state.step.id).toBe("leftTurn")
    this.measureArc("left turn")

    print("[C16] passed: both turn arcs are inside the pad border's inner edge at " + BORDER_INNER_CM + " cm")
  }

  /**
   * Measure the TurnArc mesh's extent in the pad's own space.
   *
   * The arc object hangs straight off the pad with no rotation and no scale, only a 0.3 cm lift
   * off the floor to keep it above the border, so the mesh's local bounds are pad-space
   * centimetres once the object's own offset is added.
   */
  private measureArc(label: string): void {
    const spec = main().state.step.turn
    if (!spec) throw new Error("the " + label + " has no turn arc in its step data")

    const arc = objectNamed("TurnArc")
    const t = arc.getTransform()
    const rot = t.getLocalRotation()
    const scale = t.getLocalScale()
    const offset = t.getLocalPosition()
    // Spelled out, because the bounds below are only pad-space centimetres while it holds.
    expect(Math.abs(rot.w) > 0.9999).toBe(true)
    expect(Math.abs(scale.x - 1) < 0.0001).toBe(true)
    expect(Math.abs(scale.y - 1) < 0.0001).toBe(true)
    expect(Math.abs(scale.z - 1) < 0.0001).toBe(true)

    const visual = arc.getComponent("Component.RenderMeshVisual") as RenderMeshVisual
    expect(visual !== null && visual !== undefined).toBe(true)
    const lo = visual.localAabbMin()
    const hi = visual.localAabbMax()
    expect(lo !== null && hi !== null).toBe(true)

    const xMin = lo.x + offset.x
    const xMax = hi.x + offset.x
    const zMin = lo.z + offset.z
    const zMax = hi.z + offset.z
    const furthest = Math.max(Math.abs(xMin), Math.abs(xMax), Math.abs(zMin), Math.abs(zMax))
    print(
      "[C16] " + label + " arc: centre (" + spec.centerX + ", " + spec.centerZ + ") radius " + spec.radius +
        ", x " + xMin.toFixed(2) + " to " + xMax.toFixed(2) + " cm, z " + zMin.toFixed(2) + " to " +
        zMax.toFixed(2) + " cm, furthest from the pad's centre " + furthest.toFixed(2) + " cm of " + BORDER_INNER_CM,
    )

    // A mesh with no extent would pass every check below, so rule it out first.
    expect(xMax - xMin > 2 * spec.radius - 1).toBe(true)
    expect(furthest < BORDER_INNER_CM).toBe(true)
  }
}
