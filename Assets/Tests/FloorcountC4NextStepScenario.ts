/**
 * Done criterion 4: pinching Got it three times in a row at Full tempo fades the footprints
 * and loads the next step (right turn), and its turn arc appears on the turn counts.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { card, interactor, main, pad, pinch, restartSession, waitForStepIndex, watchPhases } from "./FloorcountTestKit"

@component
export class FloorcountC4NextStepScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1000)
    await restartSession()
    await sleep(600)

    const io = interactor()
    const m = main()
    const p = pad()
    const c = card()

    // Two Got its climb Slow -> Medium -> Full.
    await pinch("GotItButton", io)
    await sleep(250)
    await pinch("GotItButton", io)
    await sleep(250)
    expect(m.state.tempo).toBe(2)
    expect(m.state.phase).toBe("learning")

    // Three Got its in a row at Full tempo complete the step.
    await pinch("GotItButton", io)
    await sleep(200)
    expect(m.state.fullGotItStreak).toBe(1)
    await pinch("GotItButton", io)
    await sleep(200)
    expect(m.state.fullGotItStreak).toBe(2)
    expect(p.isFloorVisible).toBe(true)

    // The footprints fade out over two counts, then the next step loads. At Full tempo those two
    // counts are 0.63 s and a simulated pinch costs about 0.95 s, so the fade can start and finish
    // inside the pinch and one look at the phase afterwards proves nothing either way. Every frame
    // is watched instead, which also pins the order: the step never changes without a fade.
    const phases = watchPhases()
    await pinch("GotItButton", io)
    const reachedNext = await waitForStepIndex(1, 12000)
    await sleep(400)
    const seen = phases.stop()
    print("[C4] after the third Got it at Full, phases frame by frame: " + seen.join(" > "))
    expect(reachedNext).toBe(true)
    expect(seen.join(",")).toBe("learning/0,fading/0,learning/1")

    print("[C4] loaded step " + m.state.stepIndex + ": " + m.state.step.id)
    expect(m.state.stepIndex).toBe(1)
    expect(m.state.step.id).toBe("rightTurn")
    expect(c.titleText).toBe("Right turn")
    expect(c.lineText(0)).toBe("Step 2 of 3")

    // The right turn has its own pivot footprint on count 2 that the basic step does not.
    const names = p.footprintNames()
    expect(names.indexOf("Footprint_C2") >= 0).toBe(true)
    expect(p.isShownOnFloor(2)).toBe(true)

    // The turn arc shows on the turn counts (2 and 3) and on no others.
    const arcOn: boolean[] = [false, false, false, false, false, false, false, false, false]
    const counted: boolean[] = [false, false, false, false, false, false, false, false, false]
    const deadline = getTime() + 9
    while (getTime() < deadline) {
      const n = m.currentCount
      if (n >= 1 && n <= 8) {
        counted[n] = true
        if (p.arcVisible) arcOn[n] = true
      }
      await sleep(30)
    }
    const onCounts: number[] = []
    for (let i = 1; i <= 8; i++) if (arcOn[i]) onCounts.push(i)
    print("[C4] turn arc visible on counts: " + onCounts.join(", "))

    for (let i = 1; i <= 8; i++) expect(counted[i]).toBe(true)
    expect(onCounts.length > 0).toBe(true)
    for (const n of onCounts) expect(n === 2 || n === 3).toBe(true)
    expect(arcOn[1]).toBe(false)
    expect(arcOn[5]).toBe(false)
    expect(arcOn[8]).toBe(false)
    print("[C4] passed: three Got its at Full loaded the right turn and its arc shows on the turn counts")
  }
}
