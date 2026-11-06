/**
 * The third step, which nothing asserted before: C4 covers the right turn and stops there.
 *
 * The left turn is the right turn mirrored, so its pivot lands on count 6 rather than count 2
 * and its arc shows on counts 6 and 7. The pivot print is the one thing on the floor that is
 * turned: at count 6 the dancer has spun half a turn left, so that print's toes point back at
 * the dancer instead of away.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import {
  childNamed,
  interactor,
  main,
  masterCurrentStep,
  objectNamed,
  pad,
  restartSession,
  waitForStepIndex,
} from "./FloorcountTestKit"

@component
export class FloorcountC10LeftTurnScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1000)
    await restartSession()
    await sleep(600)

    const io = interactor()
    const m = main()
    const p = pad()

    // Two steps mastered to reach the left turn.
    for (const next of [1, 2]) {
      await masterCurrentStep(io)
      print(
        "[C10] mastered step " + (next - 1) + ": phase " + m.state.phase + ", tempo " + m.state.tempo +
          ", clean at Full " + m.state.fullGotItStreak + ", dropped answers " + m.ignoredAnswers,
      )
      const reached = await waitForStepIndex(next, 20000)
      if (!reached) {
        print("[C10] step " + next + " was never reached: phase " + m.state.phase + ", step " + m.state.stepIndex)
      }
      expect(reached).toBe(true)
      await sleep(400)
    }

    print("[C10] loaded step " + m.state.stepIndex + ": " + m.state.step.id)
    expect(m.state.stepIndex).toBe(2)
    expect(m.state.step.id).toBe("leftTurn")

    // The pivot print is count 6's, and it is the left turn's own: the basic step dances count
    // 6 on count 3's spot and has no print of its own for it.
    const names = p.footprintNames()
    print("[C10] prints on the floor: " + names.join(", "))
    expect(names.indexOf("Footprint_C6") >= 0).toBe(true)
    expect(p.isShownOnFloor(6)).toBe(true)

    // It faces back. The drawn sole's toes point along the visual's own -Z (the texture's top
    // row lands there), so after the half turn left that direction is +Z, back at the dancer.
    const foot = childNamed(objectNamed("Footprint_C6"), "Foot")
    const toes = foot.getTransform().getLocalRotation().multiplyVec3(new vec3(0, 0, -1))
    print("[C10] count 6's toes point (" + toes.x.toFixed(2) + ", " + toes.y.toFixed(2) + ", " + toes.z.toFixed(2) + ") in pad space")
    expect(toes.z > 0.95).toBe(true)
    expect(Math.abs(toes.x) < 0.05).toBe(true)
    // Every other print still faces the way the dancer travels.
    for (const other of ["Footprint_C1", "Footprint_C3", "Footprint_C5"]) {
      const d = childNamed(objectNamed(other), "Foot").getTransform().getLocalRotation().multiplyVec3(new vec3(0, 0, -1))
      expect(d.z < -0.95).toBe(true)
    }

    // The arc is at full on the turn counts (6 and 7) and on no others.
    const arcOn: boolean[] = [false, false, false, false, false, false, false, false, false]
    const seen: boolean[] = [false, false, false, false, false, false, false, false, false]
    const deadline = getTime() + 9
    while (getTime() < deadline) {
      const n = m.currentCount
      if (n >= 1 && n <= 8) {
        seen[n] = true
        if (p.arcVisible) arcOn[n] = true
      }
      await sleep(30)
    }
    const onCounts: number[] = []
    for (let i = 1; i <= 8; i++) if (arcOn[i]) onCounts.push(i)
    print("[C10] turn arc at full on counts: " + onCounts.join(", "))

    for (let i = 1; i <= 8; i++) expect(seen[i]).toBe(true)
    expect(onCounts.length).toBe(2)
    expect(arcOn[6]).toBe(true)
    expect(arcOn[7]).toBe(true)
    for (const n of [1, 2, 3, 4, 5, 8]) expect(arcOn[n]).toBe(false)
    print("[C10] passed: the left turn loads, its pivot print for count 6 faces back, and its arc is at full on 6 and 7 only")
  }
}
