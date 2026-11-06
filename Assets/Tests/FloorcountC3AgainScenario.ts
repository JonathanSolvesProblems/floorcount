/**
 * Done criterion 3: pinching Again twice in a row drops the tempo one level and shows only
 * counts 1 to 4 of the step.
 *
 * The session starts at Slow, which is already the bottom level, so the scenario first earns
 * one tempo step up with a Got it, then pinches Again twice and checks the drop.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { audio, card, interactor, main, pad, pinch, restartSession } from "./FloorcountTestKit"

@component
export class FloorcountC3AgainScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1000)
    await restartSession()
    await sleep(600)

    const io = interactor()
    const m = main()
    const p = pad()
    const c = card()
    const a = audio()

    // Climb one tempo level so there is a level to drop from.
    await pinch("GotItButton", io)
    await sleep(300)
    expect(m.state.tempo).toBe(1)
    expect(a.bpm).toBe(170)
    const tempoBefore = m.state.tempo

    // One Again on its own changes neither the tempo nor the part of the step shown.
    await pinch("AgainButton", io)
    await sleep(300)
    expect(m.state.tempo).toBe(tempoBefore)
    expect(m.state.segment).toBe("full")

    // The second Again in a row drops the tempo and splits the step.
    await pinch("AgainButton", io)
    await sleep(400)
    print("[C3] tempo " + tempoBefore + " -> " + m.state.tempo + ", segment " + m.state.segment)
    expect(m.state.tempo).toBe(tempoBefore - 1)
    expect(a.bpm).toBe(140)
    expect(m.state.segment).toBe("first")

    // Only counts 1 to 4 are on the floor. Count 5 has its own footprint and must be gone;
    // counts 1 and 2 must still be there.
    expect(p.isShownOnFloor(5)).toBe(false)
    expect(p.isShownOnFloor(1)).toBe(true)
    expect(p.isShownOnFloor(2)).toBe(true)

    // Nothing lights outside counts 1 to 4 either.
    let outsideLit = 0
    const deadline = getTime() + 4
    while (getTime() < deadline) {
      for (const lit of p.litCounts) if (lit > 4) outsideLit++
      await sleep(40)
    }
    expect(outsideLit).toBe(0)

    // The card says so, and the count number is back (an Again always shows it).
    expect(c.lineText(2)).toBe("Counts 1 to 4 only")
    expect(m.state.countVisible).toBe(true)
    expect(m.state.againCounts[0]).toBe(2)
    print("[C3] passed: two Agains dropped Medium to Slow and left counts 1 to 4 on the floor")
  }
}
