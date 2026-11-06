/**
 * Done criterion 5: pinching a footprint flashes it, and after the last step the step with the
 * most Agains replays once; then the floor clears and the step card shows each step's Again
 * count.
 *
 * Part A pinches a footprint. Part B drives a whole three-step session, giving the basic step
 * the only Again so the review step is known in advance.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import {
  card,
  interactor,
  main,
  masterCurrentStep,
  pad,
  pinch,
  restartSession,
  waitForPhase,
  waitForStepIndex,
} from "./FloorcountTestKit"

@component
export class FloorcountC5MarkAndSummaryScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1000)
    const io = interactor()
    const m = main()
    const p = pad()
    const c = card()

    // ---------------------------------------------------------------- part A: mark a count
    await restartSession()
    await sleep(600)
    expect(p.isFlashing(1)).toBe(false)

    await pinch("Footprint_C1", io)
    await sleep(200)
    print("[C5] after pinching Footprint_C1: flashing=" + p.isFlashing(1) + " marks=" + m.state.lostMarks[0].join(","))
    expect(p.isFlashing(1)).toBe(true)
    expect(m.state.lostMarks[0].indexOf(1) >= 0).toBe(true)
    // The flash is a 1.2 s pulse, so it is over well before the session work below.
    await sleep(1400)
    expect(p.isFlashing(1)).toBe(false)
    // The mark is remembered for the session.
    expect(m.state.isMarked(1)).toBe(true)

    // ---------------------------------------------------------------- part B: whole session
    await restartSession()
    await sleep(600)

    // Give the basic step the session's only Again, so it is the step that comes back.
    await pinch("AgainButton", io)
    await sleep(250)
    expect(m.state.againCounts[0]).toBe(1)

    await masterCurrentStep(io)
    expect(await waitForStepIndex(1, 15000)).toBe(true)
    await sleep(300)

    await masterCurrentStep(io)
    expect(await waitForStepIndex(2, 15000)).toBe(true)
    await sleep(300)

    await masterCurrentStep(io)

    // The step with the most Agains comes back once, at Full tempo.
    expect(await waitForPhase("review", 15000)).toBe(true)
    print("[C5] review step " + m.state.reviewStepIndex + " (" + m.state.step.id + ") at tempo " + m.state.tempo)
    expect(m.state.reviewStepIndex).toBe(0)
    expect(m.state.step.id).toBe("basic")
    expect(m.state.tempo).toBe(2)
    expect(p.isFloorVisible).toBe(true)

    // One 8-count later the floor clears and the summary shows.
    expect(await waitForPhase("summary", 15000)).toBe(true)
    await sleep(400)
    expect(p.isFloorVisible).toBe(false)
    expect(c.isSummary).toBe(true)
    expect(c.titleText).toBe("Practise again")

    const row0 = c.lineText(0)
    const row1 = c.lineText(1)
    const row2 = c.lineText(2)
    print("[C5] summary rows: " + row0 + " | " + row1 + " | " + row2)
    expect(row0.includes("Basic step")).toBe(true)
    expect(row0.includes("1 Again")).toBe(true)
    expect(row1.includes("Right turn")).toBe(true)
    expect(row1.includes("0 Agains")).toBe(true)
    expect(row2.includes("Left turn")).toBe(true)
    expect(row2.includes("0 Agains")).toBe(true)
    print("[C5] passed: footprint flash, review of the worst step, cleared floor and the Again counts")
  }
}
