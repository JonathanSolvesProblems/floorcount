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
 *  - `fade-line`: the line the card fades on after the last step, both ways round. A session
 *    with an Again to bring back says "Once more at Full"; one with none says "Three steps
 *    done". It holds the second of the two frames.
 *
 * The two memory shots build their own first session rather than relying on one being saved, so
 * each is repeatable from any starting state. Both leave a saved session behind; clear it with
 * floorcount-c9-session-memory, or by hand, to put the project back to a first session.
 *
 * It asserts only that the frame it is holding is the one that was asked for, so a screenshot
 * taken after it cannot be of the wrong thing.
 *
 * The `film-*` shots are for the submission video rather than for a screenshot. They leave the
 * session RUNNING instead of frozen, because what the camera has to see is the music playing and
 * the prints lighting, so each one ends by handing a live session back.
 *
 * Each is a single run, setup and filmed action together, because LEAF resets the Lens before
 * every run and the reset re-pins the floor layout to wherever the preview camera is standing.
 * A clip whose action has to be filmed as it happens is therefore recorded across the whole run
 * and trimmed afterwards. The ones that press answer through `answerWhenDue`, which waits for
 * the Lens's own one-answer-per-8-count guard, so what is on camera is the Lens as it ships
 * rather than the test kit's unguarded pressing.
 *
 *  - `film-basic`: a first session at Slow with nothing answered.
 *  - `film-half`: a Got it up to Medium, then Again twice, which drops the tempo back to Slow
 *    and leaves counts 1 to 4 on the floor.
 *  - `film-full`: two Got its up to Full, then three clean ones, the two-count fade, and the
 *    right turn loading with its arc.
 *  - `film-session-a`: plays and finishes a whole first session that takes three Agains on the
 *    basic step and loses count 5, then pinches the summary's title to start the next practice,
 *    so the second session has read its memory back off persistent storage.
 *  - `film-session-b-finish`: one Again on the basic step and then out to the summary, so every
 *    row carries last session's number. Run it only after `film-session-a`.
 *  - `film-got-it`: a first session at Slow held long enough for the camera to read the numeral
 *    and the clave strip, then one Got it taken through the Lens's real answer guard, so the
 *    count display hides while the prints keep lighting. Left running.
 *  - `film-left-turn`: the third step, the left turn, left running at Slow with the whole step on
 *    the floor. The two steps before it are mastered with the guard off, because that part is not
 *    filmed; the guard goes back on before the session is handed over.
 *
 * `film-basic` is the shot for a session that only has to start and keep running, so nothing
 * extra was added for that.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { ScenarioConfig } from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { nextFrame, sleep } from "Leaf.lspkg/Utils/common/Utils"
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {
  audio,
  card,
  countUI,
  finishSession,
  freezeNearStrikeOf,
  freezeOnCount,
  interactor,
  main,
  masterCurrentStep,
  objectNamed,
  pad,
  pinch,
  restartSession,
  unfreeze,
  watchPhases,
  waitForStepIndex,
} from "./FloorcountTestKit"
import { TEMPO_FULL, TEMPO_MEDIUM, TEMPO_NAMES, TEMPO_SLOW } from "../Scripts/FloorcountState"

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
    else if (shot === "fade-line") await this.fadeLine(io)
    else if (shot === "film-basic") await this.filmBasic()
    else if (shot === "film-half") {
      await this.filmHalfSetup(io)
      await this.filmHalfPress(io)
    } else if (shot === "film-full") {
      await this.filmFullSetup(io)
      await this.filmFullPress(io)
    }
    else if (shot === "film-session-a") await this.filmSessionA(io)
    else if (shot === "film-session-b-finish") await this.filmSessionBFinish(io)
    else if (shot === "film-got-it") await this.filmGotIt(io)
    else if (shot === "film-left-turn") await this.filmLeftTurn(io)
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

  /**
   * The line the card fades on after the last step, both ways round.
   *
   * After the last step it is the worst step that comes back at Full, not a new one, and a
   * session with no Agains has nothing to bring back. The line is only up for the two-count
   * fade, 0.63 s at Full, so each run stops the beat the instant the fade starts and holds it.
   * The no-Agains frame is the one left on screen.
   */
  private async fadeLine(io: DefaultLeafInteractor): Promise<void> {
    const withAgain = await this.heldFadeLine(io, true)
    print("[capture] fade-line, one Again on the basic step: '" + withAgain + "'")
    expect(withAgain).toBe("Once more at Full")

    const clean = await this.heldFadeLine(io, false)
    print("[capture] fade-line, no Agains: '" + clean + "'")
    expect(clean).toBe("Three steps done")
  }

  /** One whole session on Got its, plus an Again if asked, with the last fade held. */
  private async heldFadeLine(io: DefaultLeafInteractor, oneAgain: boolean): Promise<string> {
    const m = main()
    const c = card()
    // The guard is off: nothing here is filmed, and with it on every answer costs an 8-count.
    await restartSession(false)
    await sleep(600)
    if (oneAgain) {
      await pinch("AgainButton", io)
      await sleep(250)
      expect(m.state.againCounts[0]).toBe(1)
    }
    for (let i = 0; i < 2; i++) {
      await masterCurrentStep(io)
      expect(await waitForStepIndex(i + 1, 15000)).toBe(true)
      await sleep(300)
    }
    expect(m.state.stepIndex).toBe(2)

    const freeze = this.freezeOnFade()
    await masterCurrentStep(io)
    const deadline = getTime() + 5
    while (getTime() < deadline && !freeze.done()) await sleep(50)
    expect(freeze.done()).toBe(true)
    expect(m.state.phase).toBe("fading")
    expect(m.state.stepIndex).toBe(2)
    expect(m.state.againCounts[0]).toBe(oneAgain ? 1 : 0)
    return c.lineText(2)
  }

  /**
   * Stop the music the moment the session starts fading, watching every frame.
   *
   * The fade advances with the beat, so a paused beat holds it. A frame at a time rather than a
   * sleep: the fade lasts 0.63 s at Full and a simulated pinch is longer than that, so a look
   * taken after the pinch returns can miss it entirely.
   */
  private freezeOnFade(): { done: () => boolean } {
    const m = main()
    let frozen = false
    const look = async (): Promise<void> => {
      const deadline = getTime() + 30
      while (getTime() < deadline && !frozen) {
        if (m.state.phase === "fading") {
          audio().pause()
          frozen = true
          return
        }
        await nextFrame()
      }
    }
    look()
    return { done: () => frozen }
  }

  // ---------------------------------------------------------------- the film shots

  /** A first session at Slow, nothing answered, left running for the camera. */
  private async filmBasic(): Promise<void> {
    const m = main()
    await restartSession(true)
    await sleep(900)
    print("[capture] film-basic: " + m.state.step.name + " at " + TEMPO_NAMES[m.state.tempo] + ", count " + m.currentCount)
    expect(m.state.step.id).toBe("basic")
    expect(m.state.tempo).toBe(TEMPO_SLOW)
    expect(m.state.segment).toBe("full")
  }

  /** One Got it, which takes the music to Medium. The tempo can only drop from above Slow. */
  private async filmHalfSetup(io: DefaultLeafInteractor): Promise<void> {
    const m = main()
    await restartSession(true)
    await sleep(600)
    await this.answerWhenDue("GotItButton", io)
    await sleep(900)
    print("[capture] film-half-setup: " + TEMPO_NAMES[m.state.tempo] + ", segment " + m.state.segment)
    expect(m.state.tempo).toBe(TEMPO_MEDIUM)
  }

  /** Again twice: the tempo drops a level and the floor keeps counts 1 to 4 only. */
  private async filmHalfPress(io: DefaultLeafInteractor): Promise<void> {
    const m = main()
    const p = pad()
    expect(m.state.tempo).toBe(TEMPO_MEDIUM)
    await this.answerWhenDue("AgainButton", io)
    print("[capture] film-half-press: first Again, " + TEMPO_NAMES[m.state.tempo] + ", segment " + m.state.segment)
    await this.answerWhenDue("AgainButton", io)
    await sleep(900)
    print(
      "[capture] film-half-press: second Again, " + TEMPO_NAMES[m.state.tempo] + ", segment " +
        m.state.segment + ", counts shown " + [1, 2, 3, 5, 6, 7].filter((c) => m.state.isCountShown(c)).join(""),
    )
    expect(m.state.tempo).toBe(TEMPO_SLOW)
    expect(m.state.segment).toBe("first")
    expect(p.isFloorVisible).toBe(true)
    // Hold the session on screen for the rest of the take.
    await sleep(14000)
  }

  /** Two Got its, which take the music Slow to Medium to Full. */
  private async filmFullSetup(io: DefaultLeafInteractor): Promise<void> {
    const m = main()
    await restartSession(true)
    await sleep(600)
    await this.answerWhenDue("GotItButton", io)
    await this.answerWhenDue("GotItButton", io)
    await sleep(900)
    print("[capture] film-full-setup: " + TEMPO_NAMES[m.state.tempo] + ", " + m.state.fullGotItStreak + " clean at Full")
    expect(m.state.tempo).toBe(TEMPO_FULL)
    expect(m.state.stepIndex).toBe(0)
  }

  /** Three clean 8-counts at Full: the prints fade over two counts and the right turn loads. */
  private async filmFullPress(io: DefaultLeafInteractor): Promise<void> {
    const m = main()
    const p = pad()
    expect(m.state.tempo).toBe(TEMPO_FULL)
    const watch = watchPhases()
    for (let i = 0; i < 3; i++) await this.answerWhenDue("GotItButton", io)
    expect(await waitForStepIndex(1, 15000)).toBe(true)
    print("[capture] film-full-press: phases " + watch.stop().join(" > ") + ", step " + m.state.step.id)
    expect(m.state.step.id).toBe("rightTurn")

    // The arc is a per-frame flag, so which counts carry it has to be sampled, the way C4 does.
    const arcOn: boolean[] = [false, false, false, false, false, false, false, false, false]
    const deadline = getTime() + 9
    while (getTime() < deadline) {
      const n = m.currentCount
      if (n >= 1 && n <= 8 && p.arcVisible) arcOn[n] = true
      await sleep(30)
    }
    const onCounts: number[] = []
    for (let i = 1; i <= 8; i++) if (arcOn[i]) onCounts.push(i)
    print("[capture] film-full-press: turn arc on counts " + onCounts.join(", "))
    expect(onCounts.length > 0).toBe(true)
    for (const n of onCounts) expect(n === 2 || n === 3).toBe(true)
    // Hold the right turn on screen for the rest of the take.
    await sleep(6000)
  }

  /**
   * A whole first session that takes three Agains on the basic step and loses count 5, then the
   * summary's own title button to start the next practice. What the second session knows it has
   * read back out of persistent storage, the same way it would the next time the Lens is opened.
   */
  private async filmSessionA(io: DefaultLeafInteractor): Promise<void> {
    const m = main()
    const p = pad()
    const c = card()
    // The guard is off for the drive: nothing in this part is filmed, and with it on the three
    // steps would take an 8-count per answer. The filmed shots put it back on.
    await restartSession(false)
    await sleep(900)

    // Lose count 5 first, while the whole step is still on the floor.
    expect(await freezeOnCount(5)).toBe(true)
    await pinch("Footprint_C5", io)
    await sleep(250)
    expect(m.state.lostMarks[0].join(",")).toBe("5")
    unfreeze()
    await sleep(500)

    for (let i = 0; i < 3; i++) {
      await pinch("AgainButton", io)
      await sleep(250)
    }
    expect(m.state.againCounts[0]).toBe(3)

    expect(await finishSession(io)).toBe(true)
    await sleep(700)
    expect(c.isSummary).toBe(true)
    print("[capture] film-session-a: first session " + [c.lineText(0), c.lineText(1), c.lineText(2)].join(" | "))

    // Pinch the summary's title, which is how the Lens itself starts the next practice.
    await pinch("TitleButton", io)
    await sleep(1500)
    m.answerGuard = true
    print(
      "[capture] film-session-a: second session, previous lost " + m.state.previousLostCounts(0).join(" and ") +
        ", previous Agains " + m.state.previousAgains(0) + ", focus '" + c.lineText(2) + "', ring on 5 " +
        p.ringBrightness(5).toFixed(2),
    )
    expect(m.state.phase).toBe("learning")
    expect(m.state.stepIndex).toBe(0)
    expect(m.state.previousAgains(0)).toBe(3)
    expect(p.isPreviousMarkShown(5)).toBe(true)
    expect(p.isPreviousMarkShown(1)).toBe(false)
    expect(c.lineText(2)).toBe("Last time: lost it on 5")
  }

  /** One Again on the basic step, then out to the summary, which now reads against last time. */
  private async filmSessionBFinish(io: DefaultLeafInteractor): Promise<void> {
    const m = main()
    const c = card()
    expect(m.state.previousAgains(0)).toBe(3)
    m.answerGuard = false
    await pinch("AgainButton", io)
    await sleep(300)
    expect(m.state.againCounts[0]).toBe(1)

    expect(await finishSession(io)).toBe(true)
    await sleep(900)
    const rows = [c.lineText(0), c.lineText(1), c.lineText(2)]
    print("[capture] film-session-b-finish: " + rows.join(" | "))
    expect(c.isSummary).toBe(true)
    for (const row of rows) expect(row.indexOf("last time") > 0).toBe(true)
    expect(rows[0]).toBe("Basic step: 1 Again, 3 last time")
    // The summary is a still frame; hold it while the camera is on it.
    await sleep(12000)
  }

  /**
   * A first session at Slow, held while the camera reads the numeral and the strip, then one Got
   * it through the Lens's own answer guard. The Got it is a clean 8-count, so the count display
   * goes and the prints carry the beat on their own for the rest of the take.
   */
  private async filmGotIt(io: DefaultLeafInteractor): Promise<void> {
    const m = main()
    // Held from here, the way C12 holds them: these are the two objects the count display
    // switches off, and they have to be looked up while they are still enabled.
    const numeral = objectNamed("CountText")
    const strip = objectNamed("ClaveStrip")
    await restartSession(true)
    await sleep(600)
    expect(m.state.step.id).toBe("basic")
    expect(m.state.tempo).toBe(TEMPO_SLOW)
    expect(m.state.countVisible).toBe(true)
    expect(numeral.enabled).toBe(true)
    expect(strip.enabled).toBe(true)

    // Hold the count on screen first: that is the half of the take it has to be in.
    await sleep(4000)
    await this.answerWhenDue("GotItButton", io)
    await sleep(700)
    print(
      "[capture] film-got-it: after the Got it, countVisible " + m.state.countVisible + ", numeral " +
        numeral.enabled + ", strip " + strip.enabled + ", " + TEMPO_NAMES[m.state.tempo],
    )
    expect(m.state.countVisible).toBe(false)
    expect(numeral.enabled).toBe(false)
    expect(strip.enabled).toBe(false)
    // The prints keep lighting on the beat while the camera is on them.
    await sleep(7000)
  }

  /**
   * The left turn, the third step, left running at Slow with the whole step on the floor.
   *
   * Nothing is pressed to set the tempo: every step loads at the session's start tempo with the
   * whole step showing, so mastering the two steps before it is all it takes. Those two are
   * driven with the guard off, because they are not filmed and with it on each answer would cost
   * an 8-count; the guard goes back on before the session is handed over.
   */
  private async filmLeftTurn(io: DefaultLeafInteractor): Promise<void> {
    const m = main()
    const p = pad()
    await restartSession(false)
    await sleep(600)
    await masterCurrentStep(io)
    expect(await waitForStepIndex(1, 15000)).toBe(true)
    await sleep(400)
    await masterCurrentStep(io)
    expect(await waitForStepIndex(2, 15000)).toBe(true)
    await sleep(600)
    print(
      "[capture] film-left-turn: " + m.state.step.name + " at " + TEMPO_NAMES[m.state.tempo] +
        ", segment " + m.state.segment,
    )
    expect(m.state.step.id).toBe("leftTurn")
    expect(m.state.tempo).toBe(TEMPO_SLOW)
    expect(m.state.segment).toBe("full")

    // The arc is a per-frame flag, so which counts carry it has to be sampled, the way C4 does.
    const arcOn: boolean[] = [false, false, false, false, false, false, false, false, false]
    const deadline = getTime() + 5
    while (getTime() < deadline) {
      const n = m.currentCount
      if (n >= 1 && n <= 8 && p.arcVisible) arcOn[n] = true
      await sleep(30)
    }
    const onCounts: number[] = []
    for (let i = 1; i <= 8; i++) if (arcOn[i]) onCounts.push(i)
    print("[capture] film-left-turn: turn arc on counts " + onCounts.join(", "))
    expect(onCounts.length > 0).toBe(true)
    for (const n of onCounts) expect(n === 6 || n === 7).toBe(true)

    // Hand a live session back with the guard on, the way the Lens ships.
    m.answerGuard = true
  }

  /**
   * Answer the way a dancer does with the Lens as it ships: wait until the one-answer-per-8-count
   * guard would take it, then pinch. Without the wait the guard drops the press and the clip
   * shows a button being pinched and nothing happening.
   */
  private async answerWhenDue(
    name: string,
    io: DefaultLeafInteractor,
    timeoutMs: number = 20000,
  ): Promise<void> {
    const m = main()
    const deadline = getTime() + timeoutMs / 1000
    while (getTime() < deadline && !m.canAnswer) await sleep(40)
    expect(m.canAnswer).toBe(true)
    await pinch(name, io)
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
