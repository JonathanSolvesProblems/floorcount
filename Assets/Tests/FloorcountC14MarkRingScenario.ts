/**
 * The mark ring, and the wording of the row it ends up in.
 *
 * The 2 November report listed this as the gap: C5 asserts that a pinch is recorded and that
 * the print flashes, and nothing asserted the ring the print then carries, or that the counts
 * come out of the summary in the teacher's wording. Both are checked here: two prints pinched,
 * two rings at 50 per cent, and a row ending "lost it on 2 and 5" rather than "2, 5".
 *
 * The beat is frozen for the pinches. In the basic step count 7 is danced on count 2's spot, so
 * that print is named `Footprint_C2_7` for both of them, and the pad reports whichever of a
 * print's counts lit most recently: a pinch on the wrong beat records count 7, not count 2.
 *
 * This scenario finishes a session and therefore leaves one saved, which the captures want and
 * which no other scenario can see: every one of them starts by clearing the save.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { BORDER } from "../Scripts/FloorcountLook"
import { countsInWords } from "../Scripts/FloorcountState"
import {
  card,
  finishSession,
  freezeOnCount,
  interactor,
  main,
  pad,
  pinch,
  restartSession,
  unfreeze,
} from "./FloorcountTestKit"

@component
export class FloorcountC14MarkRingScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1000)
    await restartSession()
    await sleep(2500)

    const io = interactor()
    const m = main()
    const p = pad()
    const c = card()

    // Count 3 is a safe beat to pinch count 2's print on: of that print's two counts, 2 is one
    // beat back and 7 is four, so the pad reports 2. The print is named for both of them.
    expect(await freezeOnCount(3)).toBe(true)

    await pinch("Footprint_C2_7", io)
    await sleep(200)
    await pinch("Footprint_C5", io)
    await sleep(300)
    print("[C14] marks after the two pinches: " + m.state.lostMarks[0].join(", "))
    expect(m.state.lostMarks[0].indexOf(2) >= 0).toBe(true)
    expect(m.state.lostMarks[0].indexOf(5) >= 0).toBe(true)
    expect(m.state.lostMarks[0].length).toBe(2)

    unfreeze()
    // The flash is a 1.2 s strike that rings out; let it finish so what is measured is the
    // ring at its own brightness and not the tail of the flash.
    await sleep(1600)
    expect(p.isFlashing(2)).toBe(false)
    expect(p.isFlashing(5)).toBe(false)

    print("[C14] ring brightness: 2 -> " + p.ringBrightness(2).toFixed(3) + ", 5 -> " + p.ringBrightness(5).toFixed(3))
    expect(p.isMarkRingShown(2)).toBe(true)
    expect(p.isMarkRingShown(5)).toBe(true)
    expect(Math.abs(p.ringBrightness(2) - BORDER) < 0.01).toBe(true)
    expect(Math.abs(p.ringBrightness(5) - BORDER) < 0.01).toBe(true)
    // A ring earned this session, not one carried over from a session before.
    expect(p.isPreviousMarkShown(2)).toBe(false)
    expect(p.isPreviousMarkShown(5)).toBe(false)
    // No other print carries one.
    for (const n of [1, 3, 6]) expect(p.isMarkRingShown(n)).toBe(false)

    // The wording: "2 and 5", the way the teacher says a pair of counts.
    expect(countsInWords([2, 5])).toBe("2 and 5")

    expect(await finishSession(io)).toBe(true)
    await sleep(500)
    const row = c.lineText(0)
    print("[C14] basic step's summary row: '" + row + "'")
    expect(row.endsWith(", lost it on 2 and 5")).toBe(true)
    expect(row).toBe("Basic step: 0 Agains, lost it on 2 and 5")
    print("[C14] passed: a pinched print keeps a ring at 50 per cent and the row says where it went wrong, in words")
  }
}
