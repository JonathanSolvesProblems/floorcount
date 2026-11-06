/**
 * Restarting from the summary, which is the only way out of it.
 *
 * The summary's one instruction line says "Pinch the title to practise again", and until now
 * nothing asserted that pinching it does. C7 covers the title as a pause target during practice;
 * in the summary the same target has to start a new session instead, which means the floor comes
 * back, the step goes back to the first one at Slow, and the two answer buttons the summary
 * disabled are pinchable again.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { TEMPO_SLOW } from "../Scripts/FloorcountState"
import {
  audio,
  card,
  countUI,
  finishSession,
  interactor,
  isTargetEnabled,
  main,
  pad,
  pinch,
  restartSession,
} from "./FloorcountTestKit"

@component
export class FloorcountC15RestartFromSummaryScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1000)
    await restartSession()
    await sleep(600)

    const io = interactor()
    const m = main()
    const p = pad()
    const c = card()
    const a = audio()
    const cu = countUI()

    // Drive a clean session to the summary. With no Agains anywhere there is no review step,
    // so the floor clears straight after the last step fades.
    expect(await finishSession(io)).toBe(true)
    await sleep(500)

    print(
      "[C15] at the summary: title '" + c.titleText + "', floor " + p.isFloorVisible +
        ", buttons enabled " + isTargetEnabled("AgainButton") + "/" + isTargetEnabled("GotItButton") +
        ", music playing " + a.isPlaying,
    )
    expect(c.isSummary).toBe(true)
    expect(c.titleText).toBe("Practise again")
    expect(c.lineText(2)).toBe("Left turn: 0 Agains")
    expect(p.isFloorVisible).toBe(false)
    expect(cu.isShown).toBe(false)
    // The summary takes the two answers away: there is nothing to answer about.
    expect(isTargetEnabled("AgainButton")).toBe(false)
    expect(isTargetEnabled("GotItButton")).toBe(false)
    // The title is the one thing still pinchable.
    expect(isTargetEnabled("TitleButton")).toBe(true)

    // ---------------------------------------------------------------- pinch the title
    await pinch("TitleButton", io)
    await sleep(800)

    print(
      "[C15] after pinching the title: step " + m.state.stepIndex + " (" + m.state.step.id + "), phase " +
        m.state.phase + ", tempo " + m.state.tempo + " (" + a.bpm + " BPM), floor " + p.isFloorVisible +
        ", buttons enabled " + isTargetEnabled("AgainButton") + "/" + isTargetEnabled("GotItButton"),
    )
    // Back at step 1, at Slow, learning the whole step.
    expect(m.state.phase).toBe("learning")
    expect(m.state.stepIndex).toBe(0)
    expect(m.state.step.id).toBe("basic")
    expect(m.state.tempo).toBe(TEMPO_SLOW)
    expect(a.bpm).toBe(140)
    expect(m.state.segment).toBe("full")
    expect(m.state.againCounts[0]).toBe(0)

    // The card is a practice card again.
    expect(c.isSummary).toBe(false)
    expect(c.titleText).toBe("Basic step")
    expect(c.lineText(0)).toBe("Step 1 of 3")
    expect(c.lineText(1)).toBe("Slow, 140 BPM")

    // The floor and the two buttons are back.
    expect(p.isFloorVisible).toBe(true)
    expect(p.isShownOnFloor(1)).toBe(true)
    expect(p.isShownOnFloor(5)).toBe(true)
    expect(isTargetEnabled("AgainButton")).toBe(true)
    expect(isTargetEnabled("GotItButton")).toBe(true)
    // And they work: an Again lands on the new session's record.
    await pinch("AgainButton", io)
    await sleep(300)
    expect(m.state.againCounts[0]).toBe(1)
    print("[C15] passed: pinching the title in the summary puts the session back at step 1 at Slow, with the floor and both answers back")
  }
}
