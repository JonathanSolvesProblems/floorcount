/**
 * A capture helper, not a done-criterion test. Sets up one of the three frames the 6 November
 * pass had to publish and then holds the Lens there, the way floorcount-hold-on-count holds a
 * frame of the basic step.
 *
 * The `shot` parameter picks which:
 *
 *  - `right-turn-count2`: the right turn held on count 2, with its arc at full.
 *  - `last-time-rings`: a second practice, with last session's rings on counts 2 and 5 of the
 *    basic step and the focus line saying where it went wrong, held on count 2.
 *  - `summary-last-time`: the summary of a second practice, so every row carries a comparison.
 *
 * The two memory shots build their own first session rather than relying on one being saved, so
 * each is repeatable from any starting state. Both leave a saved session behind; clear it with
 * floorcount-c9-session-memory, or by hand, to put the project back to a first session.
 *
 * It asserts only that the frame it is holding is the one that was asked for, so a screenshot
 * taken after it cannot be of the wrong thing.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { ScenarioConfig } from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {
  card,
  countUI,
  finishSession,
  freezeNearStrikeOf,
  freezeOnCount,
  interactor,
  main,
  masterCurrentStep,
  pad,
  pinch,
  restartSession,
  unfreeze,
  waitForStepIndex,
} from "./FloorcountTestKit"

/** How far into the count a freeze may land, in beats. The strike decays fast. */
const MAX_FRAC = 0.06

@component
export class FloorcountCaptureScenario extends Scenario {
  async run(config?: ScenarioConfig): Promise<void> {
    const shot = (config && config.get("shot")) || "right-turn-count2"
    await sleep(1000)
    const io = interactor()

    if (shot === "right-turn-count2") await this.rightTurnCount2(io)
    else if (shot === "last-time-rings") await this.lastTimeRings(io)
    else if (shot === "summary-last-time") await this.summaryLastTime(io)
    else throw new Error("unknown shot '" + shot + "'")
  }

  // ---------------------------------------------------------------- the shots

  /** The right turn, held on count 2, arc at full. */
  private async rightTurnCount2(io: DefaultLeafInteractor): Promise<void> {
    const m = main()
    const p = pad()
    await restartSession()
    await sleep(600)
    await masterCurrentStep(io)
    expect(await waitForStepIndex(1, 15000)).toBe(true)
    expect(m.state.step.id).toBe("rightTurn")
    await sleep(2500)

    await this.freezeOnStrikeOf(2)
    print(
      "[capture] right turn held on count " + m.currentCount + ": print " + p.footBrightness(2).toFixed(2) +
        ", arc at full " + p.arcVisible + ", cell " + countUI().cellBrightness(2).toFixed(2),
    )
    expect(m.currentCount).toBe(2)
    expect(p.arcVisible).toBe(true)
  }

  /** A second practice of the basic step, held on count 2, with last session's rings showing. */
  private async lastTimeRings(io: DefaultLeafInteractor): Promise<void> {
    const m = main()
    const p = pad()
    const c = card()
    await this.aFirstSessionLosingTwoAndFive(io)

    // Start again, keeping what that session left.
    await restartSession(false, true)
    await sleep(2500)
    print(
      "[capture] second practice: previous lost " + m.state.previousLostCounts(0).join(" and ") +
        ", focus line '" + c.lineText(2) + "', rings " + p.ringBrightness(2).toFixed(2) + " / " +
        p.ringBrightness(5).toFixed(2),
    )
    expect(p.isPreviousMarkShown(2)).toBe(true)
    expect(p.isPreviousMarkShown(5)).toBe(true)
    expect(c.lineText(2)).toBe("Last time: lost it on 2 and 5")

    await this.freezeOnStrikeOf(2)
    expect(m.currentCount).toBe(2)
    // The focus line only holds until the first answer, and nothing has been answered.
    expect(c.lineText(2)).toBe("Last time: lost it on 2 and 5")
    expect(p.isPreviousMarkShown(2)).toBe(true)
  }

  /** The summary of a second practice, so every row ends with a comparison. */
  private async summaryLastTime(io: DefaultLeafInteractor): Promise<void> {
    const c = card()
    await this.aFirstSessionLosingTwoAndFive(io)

    await restartSession(false, true)
    await sleep(700)
    // One Again on the basic step, so the comparison is between two different numbers.
    await pinch("AgainButton", io)
    await sleep(300)
    expect(await finishSession(io)).toBe(true)
    await sleep(600)

    const rows = [c.lineText(0), c.lineText(1), c.lineText(2)]
    print("[capture] summary rows: " + rows.join(" | "))
    expect(c.isSummary).toBe(true)
    for (const row of rows) expect(row.indexOf("last time") > 0).toBe(true)
    expect(rows[0]).toBe("Basic step: 1 Again, 0 last time")
  }

  // ---------------------------------------------------------------- shared setup

  /**
   * Run and finish one session that loses counts 2 and 5 of the basic step, so the next one has
   * something to remember. The beat is frozen for the pinches: count 7 is danced on count 2's
   * spot and the pad reports whichever of a print's counts lit most recently.
   */
  private async aFirstSessionLosingTwoAndFive(io: DefaultLeafInteractor): Promise<void> {
    const m = main()
    await restartSession()
    await sleep(2500)
    expect(await freezeOnCount(3)).toBe(true)
    // Named for both its counts: the basic step dances count 7 on count 2's spot.
    await pinch("Footprint_C2_7", io)
    await sleep(200)
    await pinch("Footprint_C5", io)
    await sleep(250)
    expect(m.state.lostMarks[0].join(",")).toBe("2,5")
    unfreeze()
    await sleep(400)
    expect(await finishSession(io)).toBe(true)
    await sleep(400)
  }

  /** Stop the beat within MAX_FRAC of a count's strike, so the frame shows it struck. */
  private async freezeOnStrikeOf(count: number): Promise<void> {
    const frac = await freezeNearStrikeOf(count, MAX_FRAC)
    print("[capture] frozen on count " + main().currentCount + " at " + frac.toFixed(3) + " into the beat")
    expect(frac < MAX_FRAC).toBe(true)
  }
}
