/**
 * The halves, end to end. C3 covers the first half only, and nothing asserted the way back:
 * two Agains cut the step to counts 1 to 4, one Got it swaps to counts 5 to 8, and a second
 * Got it brings the whole step back.
 *
 * What is on the floor is checked by what lights rather than by which prints are enabled,
 * because a print can carry two counts: in the basic step count 7 is danced on count 2's spot
 * and count 6 on count 3's, so those prints stay on the floor for the half that holds their
 * other count. Only counts 1 and 5 have a print of their own, and the brightness curve is what
 * actually refuses to light a count the session is not practising.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { card, interactor, main, pad, pinch, restartSession } from "./FloorcountTestKit"

/** Watch a whole phrase and report every count whose print was struck in it. */
async function litCountsOver(seconds: number): Promise<number[]> {
  const m = main()
  const p = pad()
  const lit: boolean[] = [false, false, false, false, false, false, false, false, false]
  const seen: boolean[] = [false, false, false, false, false, false, false, false, false]
  const deadline = getTime() + seconds
  while (getTime() < deadline) {
    if (m.currentCount >= 1 && m.currentCount <= 8) seen[m.currentCount] = true
    for (const n of p.litCounts) if (n >= 1 && n <= 8) lit[n] = true
    await sleep(25)
  }
  const out: number[] = []
  for (let i = 1; i <= 8; i++) if (lit[i]) out.push(i)
  // A phrase the sampler never saw all of would make the result meaningless.
  for (let i = 1; i <= 8; i++) if (!seen[i]) throw new Error("the sampler missed count " + i)
  return out
}

@component
export class FloorcountC11HalvesScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1000)
    await restartSession()
    await sleep(2500)

    const io = interactor()
    const m = main()
    const p = pad()
    const c = card()

    // The whole step to start with: every stepping count lights.
    const whole = await litCountsOver(6)
    print("[C11] whole step lights counts: " + whole.join(", "))
    expect(whole.join(",")).toBe("1,2,3,5,6,7")

    // ---------------------------------------------------------------- counts 1 to 4 only
    await pinch("AgainButton", io)
    await sleep(250)
    await pinch("AgainButton", io)
    await sleep(400)
    expect(m.state.segment).toBe("first")
    expect(c.lineText(2)).toBe("Counts 1 to 4 only")
    // Count 5 is the only count of the second half with a print of its own, and it is gone.
    expect(p.isShownOnFloor(5)).toBe(false)
    expect(p.isShownOnFloor(1)).toBe(true)

    const first = await litCountsOver(6)
    print("[C11] first half lights counts: " + first.join(", "))
    expect(first.join(",")).toBe("1,2,3")

    // ---------------------------------------------------------------- counts 5 to 8 only
    await pinch("GotItButton", io)
    await sleep(400)
    expect(m.state.segment).toBe("second")
    expect(c.lineText(2)).toBe("Counts 5 to 8 only")
    // Count 1 is the only count of the first half with a print of its own, and it is gone.
    expect(p.isShownOnFloor(1)).toBe(false)
    expect(p.isShownOnFloor(5)).toBe(true)

    const second = await litCountsOver(6)
    print("[C11] second half lights counts: " + second.join(", "))
    expect(second.join(",")).toBe("5,6,7")

    // ---------------------------------------------------------------- the whole step back
    await pinch("GotItButton", io)
    await sleep(400)
    expect(m.state.segment).toBe("full")
    expect(c.lineText(2)).toBe("Whole step")
    expect(p.isShownOnFloor(1)).toBe(true)
    expect(p.isShownOnFloor(5)).toBe(true)

    const back = await litCountsOver(6)
    print("[C11] whole step back, lights counts: " + back.join(", "))
    expect(back.join(",")).toBe("1,2,3,5,6,7")
    print("[C11] passed: two Agains cut the step to its first half, a Got it swaps halves, and another brings the whole step back")
  }
}
