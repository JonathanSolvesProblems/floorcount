/**
 * Session memory: a finished session is saved, and the next practice picks up from it.
 *
 * Part A is a first session: no print carries a ring, the focus line is the ordinary one, and
 * the summary rows name the counts that were lost rather than comparing with a session before.
 * It finishes with one Again on the basic step and count 5 pinched, which is what part B then
 * has to remember.
 *
 * Part B starts again with the save kept. Count 5's print carries last session's ring at rest
 * brightness, fainter than one earned this session; the focus line says where it went wrong
 * last time and gives that slot back to the ordinary focus text after the first answer; and the
 * basic step's summary row ends with the comparison instead of the lost counts.
 *
 * The scenario clears the saved session at the end, so the project is left as a first session.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { BORDER, REST } from "../Scripts/FloorcountLook"
import {
  card,
  finishSession,
  interactor,
  main,
  pad,
  pinch,
  restartSession,
} from "./FloorcountTestKit"

/** Counts of the basic step that have a print of their own or share one. */
const STEPPING = [1, 2, 3, 5, 6, 7]

@component
export class FloorcountC9SessionMemoryScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1000)
    const io = interactor()
    const m = main()
    const p = pad()
    const c = card()

    // ---------------------------------------------------------------- part A: a first session
    await restartSession()
    await sleep(700)

    // Nothing carries a ring and nothing is remembered from before.
    for (const n of STEPPING) {
      expect(p.isMarkRingShown(n)).toBe(false)
      expect(p.isPreviousMarkShown(n)).toBe(false)
      expect(p.ringBrightness(n)).toBe(0)
    }
    expect(m.state.previous).toBe(null)
    expect(m.state.previousAgains(0)).toBe(-1)
    print("[C9] first session: no rings, previous=" + m.state.previous)

    // The focus line is the ordinary one, not a comparison.
    expect(c.lineText(2)).toBe("Whole step")

    // One Again on the basic step, and count 5 pinched as the count that was lost. Count 5's
    // print is its own spot in the basic step, so the pinch can only report count 5.
    await pinch("AgainButton", io)
    await sleep(250)
    expect(m.state.againCounts[0]).toBe(1)
    await pinch("Footprint_C5", io)
    await sleep(250)
    expect(m.state.lostMarks[0].indexOf(5) >= 0).toBe(true)
    expect(p.isMarkRingShown(5)).toBe(true)

    expect(await finishSession(io)).toBe(true)
    await sleep(500)
    const firstRows = [c.lineText(0), c.lineText(1), c.lineText(2)]
    print("[C9] first session rows: " + firstRows.join(" | "))
    // A first session has nothing to compare with, so it names the counts instead.
    for (const row of firstRows) expect(row.indexOf("last time") < 0).toBe(true)
    expect(firstRows[0]).toBe("Basic step: 1 Again, lost it on 5")

    // ---------------------------------------------------------------- part B: the next practice
    await restartSession(false, true)
    await sleep(700)

    // Count 5's print carries the ring it earned last session, at rest brightness.
    print(
      "[C9] second session: previousLost=" + m.state.previousLostCounts(0).join(",") +
        " previousAgains=" + m.state.previousAgains(0) +
        " ring(5)=" + p.ringBrightness(5).toFixed(3) + " ring(1)=" + p.ringBrightness(1).toFixed(3),
    )
    expect(m.state.previousAgains(0)).toBe(1)
    expect(p.isPreviousMarkShown(5)).toBe(true)
    expect(Math.abs(p.ringBrightness(5) - REST) < 0.01).toBe(true)
    // Measurably fainter than a ring earned this session, which is what tells the two apart.
    expect(p.ringBrightness(5) < BORDER - 0.01).toBe(true)
    // No other count carries one.
    for (const n of [1, 2, 3, 6, 7]) expect(p.isPreviousMarkShown(n)).toBe(false)

    // The focus line says where it went wrong, until the first answer on the step.
    expect(m.state.answeredThisStep).toBe(false)
    expect(c.lineText(2)).toBe("Last time: lost it on 5")
    await pinch("AgainButton", io)
    await sleep(300)
    print("[C9] focus line after one answer: '" + c.lineText(2) + "'")
    expect(m.state.answeredThisStep).toBe(true)
    expect(c.lineText(2)).toBe("Whole step")

    expect(await finishSession(io)).toBe(true)
    await sleep(500)
    const secondRows = [c.lineText(0), c.lineText(1), c.lineText(2)]
    print("[C9] second session rows: " + secondRows.join(" | "))
    // The comparison takes the place of the lost counts once there is a session to compare with.
    expect(secondRows[0].endsWith(", 1 last time")).toBe(true)
    expect(secondRows[0]).toBe("Basic step: 1 Again, 1 last time")
    expect(secondRows[1]).toBe("Right turn: 0 Agains, 0 last time")

    // ---------------------------------------------------------------- leave a first session
    m.clearSaved()
    await sleep(150)
    expect(m.state.previous).toBe(null)
    print("[C9] passed: a finished session is remembered, drawn as a faint ring, said in the focus line and compared in the summary")
  }
}
