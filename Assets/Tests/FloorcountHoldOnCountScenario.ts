/**
 * A capture helper, not a done-criterion test.
 *
 * Holds the session on one count so a screenshot can be taken of a known frame. It waits for
 * the strike of the count given in the `count` parameter, then pauses the music, which freezes
 * the beat clock: the pad, the clave strip and the step card all keep drawing that one beat,
 * so the lit footprint stays lit and the answer window stays open. Refresh the preview to
 * start the session running again.
 *
 * Asserts nothing about the design. It does check that the frame it froze on is the one that
 * was asked for, so a screenshot taken after it cannot be of the wrong count.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { ScenarioConfig } from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { COUNTS_PER_PHRASE } from "../Scripts/FloorcountSteps"
import { audio, card, countUI, main, pad, restartSession } from "./FloorcountTestKit"

/** How far into the count the freeze may land, in beats. The strike decays fast. */
const MAX_FRAC = 0.06

@component
export class FloorcountHoldOnCountScenario extends Scenario {
  async run(config?: ScenarioConfig): Promise<void> {
    const target = config && config.getNumber("count") !== undefined ? config.getNumber("count") : 1
    const m = main()
    const a = audio()

    await restartSession()
    // The audio player reports a lagging position for about a second after play().
    await sleep(2500)

    // Wait for the wanted count, from the second 8-count on so the answer window is live.
    const deadline = getTime() + 30
    let frozenFrac = 1
    while (getTime() < deadline) {
      const beat = m.currentBeat
      if (beat >= COUNTS_PER_PHRASE) {
        const p = ((beat % COUNTS_PER_PHRASE) + COUNTS_PER_PHRASE) % COUNTS_PER_PHRASE
        const frac = p - Math.floor(p)
        if (Math.floor(p) + 1 === target && frac < MAX_FRAC) {
          frozenFrac = frac
          break
        }
      }
      await sleep(8)
    }
    a.pause()
    await sleep(250)

    print(
      "[hold] frozen on count " + m.currentCount + " at " + frozenFrac.toFixed(3) + " into the beat: " +
        "print " + pad().footBrightness(target).toFixed(2) + ", cell " + countUI().cellBrightness(target).toFixed(2) +
        ", numeral '" + countUI().text + "', buttons bright " + card().buttonsBright,
    )
    expect(m.currentCount).toBe(target)
    expect(frozenFrac < MAX_FRAC).toBe(true)
  }
}
