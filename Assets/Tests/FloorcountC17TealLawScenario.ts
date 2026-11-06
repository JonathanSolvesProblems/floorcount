/**
 * Charter law 3: the teal is on exactly one thing, the count-1 print and cell 1 of the strip.
 *
 * C1 and C2 each check one half of this on one step: C1 that no print but count 1's is teal in
 * the basic step, C2 that no cell but cell 1 is. Neither says anything about the other two
 * steps, and neither can say that nothing *else* in the Lens is teal, which is what the law
 * actually claims.
 *
 * So this walks the whole scene on each of the three steps and reads the tint of every drawn
 * thing, then names what came back teal. The expected answer is two objects: the "Foot" under
 * count 1's print, and "Cell1". Teal means this teal, the tint reserved for the 1, matched the
 * way the pad and the strip match it: on the red and blue channels, since those are what tell
 * it apart from ivory.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { TINT_TEAL } from "../Scripts/FloorcountLook"
import {
  countUI,
  interactor,
  main,
  masterCurrentStep,
  pad,
  restartSession,
  waitForStepIndex,
} from "./FloorcountTestKit"

/** Counts of a step that carry a print, in the order a step's spots are built. */
const STEPPING = [1, 2, 3, 5, 6, 7]

function isTeal(c: vec4): boolean {
  return Math.abs(c.x - TINT_TEAL.x) < 0.01 && Math.abs(c.z - TINT_TEAL.z) < 0.01
}

/** Full path of a SceneObject, so a reported name says which print it belongs to. */
function pathOf(o: SceneObject): string {
  const parts: string[] = []
  let cur: SceneObject | null = o
  let guard = 0
  while (cur && guard < 12) {
    parts.unshift(cur.name)
    cur = cur.getParent()
    guard++
  }
  return parts.join("/")
}

/**
 * Every drawn thing in the scene whose tint is the teal, by path.
 *
 * Not every material in a scene carries a baseColor (the packages bring their own shaders), and
 * reading one that does not is not a finding about the Lens, so a material that cannot be read
 * is skipped rather than failing the walk.
 */
function tealVisuals(): string[] {
  const found: string[] = []
  const visit = (o: SceneObject): void => {
    const visuals = o.getComponents("Component.RenderMeshVisual") as RenderMeshVisual[]
    for (const v of visuals) {
      try {
        const mat = v.mainMaterial
        if (!mat) continue
        const colour = mat.mainPass.baseColor
        if (colour && isTeal(colour)) found.push(pathOf(o))
      } catch (e) {
        // No readable baseColor on this material.
      }
    }
    const texts = o.getComponents("Component.Text") as Text[]
    for (const t of texts) {
      try {
        if (t.textFill && isTeal(t.textFill.color)) found.push(pathOf(o) + " (text)")
      } catch (e) {
        // No readable fill colour.
      }
    }
    for (let i = 0; i < o.getChildrenCount(); i++) visit(o.getChild(i))
  }
  for (let i = 0; i < global.scene.getRootObjectsCount(); i++) visit(global.scene.getRootObject(i))
  return found
}

@component
export class FloorcountC17TealLawScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1000)
    await restartSession()
    await sleep(700)

    const io = interactor()
    const m = main()

    for (let step = 0; step < 3; step++) {
      if (step > 0) {
        await masterCurrentStep(io)
        expect(await waitForStepIndex(step, 15000)).toBe(true)
        await sleep(600)
      }
      this.checkStep(m.state.step.id)
    }
    print("[C17] passed: on all three steps the only teal in the scene is count 1's print and cell 1")
  }

  private checkStep(stepId: string): void {
    const p = pad()
    const cu = countUI()

    // The two things the law allows.
    expect(p.isFootTeal(1)).toBe(true)
    expect(cu.isCellTeal(1)).toBe(true)
    // And nothing else among the prints and the cells.
    for (const n of STEPPING) if (n !== 1) expect(p.isFootTeal(n)).toBe(false)
    for (let n = 2; n <= 8; n++) expect(cu.isCellTeal(n)).toBe(false)

    // The whole scene, not only the things this scenario thought to name.
    const teal = tealVisuals()
    print("[C17] " + stepId + ": teal in the scene is " + teal.join(" + "))
    expect(teal.length).toBe(2)
    let footTeal = 0
    let cellTeal = 0
    for (const path of teal) {
      if (path.indexOf("Footprint_C1/Foot") >= 0) footTeal++
      else if (path.indexOf("/Cell1") >= 0) cellTeal++
    }
    expect(footTeal).toBe(1)
    expect(cellTeal).toBe(1)
  }
}
