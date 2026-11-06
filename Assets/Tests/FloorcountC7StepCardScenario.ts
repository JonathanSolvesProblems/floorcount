/**
 * The step card's own test, from the design pass of 2 November.
 *
 * Checks the four things that pass changed and nothing was asserting: the four lines share
 * one left edge, each answer capsule fits its label with air around it, the two capsules
 * stand far enough apart to read as two targets, and the focus line says in words when the
 * session is held.
 *
 * Not a done criterion from devpost/design-brief.md. The criteria are C1 to C6; this covers
 * the look, and the pause and resume the build report listed as untested.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { audio, card, interactor, pinch, restartSession } from "./FloorcountTestKit"

/** Air each side of a label inside its capsule, in cm. */
const MIN_AIR_CM = 1.5
/** Clear space between the two capsules, in cm, so they never read as one phrase. */
const MIN_GAP_CM = 6
/** Charter law 13's floor: no text under 2.5 cm cap height at 1 m. */
const MIN_CAP_CM = 2.5
/** How far apart two left edges may be and still count as one, in cm. */
const EDGE_TOL_CM = 0.05
/** Floating-point slack, in cm. The fit lands on these numbers exactly, not past them. */
const EPS = 0.01

@component
export class FloorcountC7StepCardScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1000)
    await restartSession()
    await sleep(600)

    const io = interactor()
    const c = card()
    const a = audio()

    // One left edge, measured on the drawn ink rather than on the layout box. A bigger line
    // starts a bigger fraction of its own size inside its box, so four boxes on one edge
    // still draw four different edges; it is the ink a dancer sees.
    const edges = [0, 1, 2, 3].map((i) => c.lineInkLeftCm(i))
    print("[C7] line ink left edges " + edges.map((e) => e.toFixed(2)).join(" / ") + " cm")
    for (const e of edges) expect(Math.abs(e - edges[0]) < EDGE_TOL_CM).toBe(true)
    // Every line carries text, so those four edges are four real lines and not empty boxes.
    for (let i = 0; i < 4; i++) expect(c.lineWidthCm(i) > 0).toBe(true)

    // The button row starts on that same edge. Without this the lines can be in order among
    // themselves while the capsules sit 10 cm off to one side, which is how the card looked
    // before the fix and what no earlier assertion would have caught.
    print("[C7] capsule left edge " + c.capsuleLeftCm.toFixed(2) + " cm")
    expect(Math.abs(c.capsuleLeftCm - edges[0]) < EDGE_TOL_CM).toBe(true)

    // Each capsule fits its own label with room to spare, and the pair stands apart.
    print(
      "[C7] capsule " + c.capsuleWidth.toFixed(1) + " cm, air " + c.labelAirCm(0).toFixed(2) +
        " / " + c.labelAirCm(1).toFixed(2) + " cm, gap " + c.capsuleGapCm.toFixed(2) + " cm",
    )
    expect(c.labelAirCm(0) >= MIN_AIR_CM - EPS).toBe(true)
    expect(c.labelAirCm(1) >= MIN_AIR_CM - EPS).toBe(true)
    expect(c.capsuleGapCm >= MIN_GAP_CM - EPS).toBe(true)

    // The tempo line carries its unit.
    expect(c.lineText(1)).toBe("Slow, 140 BPM")

    // Pinching the title holds the session, and the focus line says so in words. No glyph:
    // the charter bans the stock icon set, and with the music stopped and the counts frozen
    // nothing else on the card would show the session is held.
    const focusBefore = c.lineText(2)
    expect(c.isPaused).toBe(false)
    await pinch("TitleButton", io)
    await sleep(300)
    print(
      "[C7] paused: audio " + a.isPaused + ", focus line '" + c.lineText(2) + "' at " +
        c.pausedCapHeightCm.toFixed(2) + " cm cap",
    )
    expect(a.isPaused).toBe(true)
    expect(c.isPaused).toBe(true)
    expect(c.lineText(2)).toBe(c.pausedLineText)
    expect(c.pausedCapHeightCm >= MIN_CAP_CM - EPS).toBe(true)

    // Pinching it again goes on, and the focus text comes back exactly as it was.
    await pinch("TitleButton", io)
    await sleep(300)
    print("[C7] resumed: audio paused " + a.isPaused + ", focus line '" + c.lineText(2) + "'")
    expect(a.isPaused).toBe(false)
    expect(c.isPaused).toBe(false)
    expect(c.lineText(2)).toBe(focusBefore)

    print("[C7] passed: one left edge, capsules fitted and apart, paused line in words")
  }
}
