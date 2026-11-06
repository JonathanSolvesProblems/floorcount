/**
 * One answer per 8-count, the way the Lens ships.
 *
 * The brief has the dancer pinch Again or Got it "after an 8-count". Before this guard three
 * quick pinches of Got it cleared a step nobody had danced, and a double pinch counted twice.
 * This scenario runs with the guard on and checks that an answer is not taken during the first
 * 8-count, that it is taken after one has played, and that further pinches in the same 8-count
 * are dropped until the next one.
 *
 * Not a done criterion from devpost/design-brief.md. It covers the rule behind criteria 3 and 4:
 * "twice in a row" and "three times in a row" mean 8-counts, not pinches.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { COUNTS_PER_PHRASE } from "../Scripts/FloorcountSteps"
import { FloorcountMain } from "../Scripts/FloorcountMain"
import { audio, interactor, main, pinch, restartSession, waitForBeat } from "./FloorcountTestKit"

/** Which 8-count since the music last started the session is in. */
function phraseOf(m: FloorcountMain): number {
  return Math.floor(m.currentBeat / COUNTS_PER_PHRASE)
}

/**
 * Wait until the music is just inside an 8-count numbered `minPhrase` or later.
 *
 * A burst of pinches has to stay inside one 8-count for the drop count to mean anything, so
 * it needs the whole 8-count ahead of it. Waiting for an absolute beat is not enough: the
 * audio player reports a lagging position for about a second after play() and then catches
 * up in one jump, so a wait for "past beat 8" can first be satisfied near the end of that
 * 8-count and leave the burst straddling the next one.
 */
async function waitForPhraseStart(minPhrase: number, timeoutMs: number): Promise<boolean> {
  const m = main()
  const deadline = getTime() + timeoutMs / 1000
  while (getTime() < deadline) {
    const phrase = phraseOf(m)
    if (phrase >= minPhrase && m.currentBeat - phrase * COUNTS_PER_PHRASE < 1) return true
    await sleep(20)
  }
  return false
}

@component
export class FloorcountC8AnswerGuardScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1000)
    await restartSession(true)
    await sleep(300)

    const io = interactor()
    const m = main()
    const a = audio()
    expect(m.answerGuard).toBe(true)

    // During the first 8-count nothing has been danced yet, so a Got it is not taken.
    expect(m.currentBeat < 8).toBe(true)
    expect(m.canAnswer).toBe(false)
    await pinch("GotItButton", io)
    await sleep(200)
    print("[C8] first 8-count: tempo " + m.state.tempo + ", dropped " + m.ignoredAnswers)
    expect(m.state.tempo).toBe(0)
    expect(m.ignoredAnswers).toBe(1)

    // Once a whole 8-count has played, the Got it is taken: Slow goes to Medium.
    expect(await waitForBeat(8.2, 9000)).toBe(true)
    expect(m.canAnswer).toBe(true)
    await pinch("GotItButton", io)
    await sleep(300)
    expect(m.state.tempo).toBe(1)
    expect(a.bpm).toBe(170)

    // The music started over at Medium, so the next answer waits for an 8-count again.
    expect(m.canAnswer).toBe(false)
    expect(await waitForPhraseStart(1, 12000)).toBe(true)

    // Two pinches of Again inside one 8-count: the first is taken, the second is dropped.
    //
    // Two rather than three. A Medium 8-count lasts 2.82 s and one simulated pinch costs about
    // 0.8 s in the preview, so a burst of three outlasts the 8-count it is meant to sit inside:
    // the later pinches then land in a genuinely new 8-count, which the guard is right to take.
    // Two is the smallest burst that still shows an extra pinch being dropped.
    const burstPhrase = phraseOf(m)
    const droppedBefore = m.ignoredAnswers
    await pinch("AgainButton", io)
    await pinch("AgainButton", io)
    // Read the 8-count the moment the burst ends, before the settling sleep below: the music
    // keeps running through that sleep, so reading it afterwards can show the next 8-count
    // even when both pinches landed inside this one.
    const burstEndPhrase = phraseOf(m)
    await sleep(200)
    print(
      "[C8] two pinches in one 8-count: Agains " + m.state.againCounts[0] + ", dropped " +
        (m.ignoredAnswers - droppedBefore) + ", beat " + m.currentBeat.toFixed(1) + ", 8-count " +
        burstPhrase + " -> " + burstEndPhrase,
    )
    // Only meaningful if both pinches really landed inside the one 8-count.
    expect(burstEndPhrase).toBe(burstPhrase)
    expect(m.state.againCounts[0]).toBe(1)
    expect(m.ignoredAnswers - droppedBefore).toBe(1)
    expect(m.state.tempo).toBe(1)
    expect(m.state.segment).toBe("full")

    // In the next 8-count a second Again is taken, and two in a row drop the tempo and split the step.
    expect(await waitForPhraseStart(burstPhrase + 1, 12000)).toBe(true)
    expect(m.canAnswer).toBe(true)
    await pinch("AgainButton", io)
    await sleep(300)
    expect(m.state.againCounts[0]).toBe(2)
    expect(m.state.tempo).toBe(0)
    expect(m.state.segment).toBe("first")

    print("[C8] passed: one answer per 8-count, none before the first has played")
  }
}
