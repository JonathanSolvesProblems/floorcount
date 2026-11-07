/**
 * One answer per 8-count, the way the Lens ships.
 *
 * The brief has the dancer pinch Again or Got it "after an 8-count". Before this guard three
 * quick pinches of Got it cleared a step nobody had danced, and a double pinch counted twice.
 * This scenario runs with the guard on and checks that an answer is not taken during the first
 * 8-count, that it is taken after one has played, and that further pinches in the same 8-count
 * are dropped until the next one.
 *
 * It also covers the two things the guard learned from the code review:
 *
 *  - An answer taken late in an 8-count is not followed by one at the top of the next, a beat
 *    later, with nothing danced between them: the guard keeps a whole window's worth of counts
 *    between answers, and the capsules stay at rest while it does.
 *  - Paused is paused. While the music is held nothing is being danced, so nothing is answered,
 *    and the guard opens again once the session goes on.
 *
 * Not a done criterion from devpost/design-brief.md. It covers the rule behind criteria 3 and 4:
 * "twice in a row" and "three times in a row" mean 8-counts, not pinches.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { nextFrame, sleep } from "Leaf.lspkg/Utils/common/Utils"
import { COUNTS_PER_PHRASE } from "../Scripts/FloorcountSteps"
import { FloorcountMain } from "../Scripts/FloorcountMain"
import { audio, card, interactor, main, pinch, restartSession, waitForBeat, waitForCount } from "./FloorcountTestKit"

/** Which 8-count since the music last started the session is in. */
function phraseOf(m: FloorcountMain): number {
  return Math.floor(m.currentBeat / COUNTS_PER_PHRASE)
}

/** The count 1..8 a beat falls on. */
function countOfBeat(beat: number): number {
  const p = ((beat % COUNTS_PER_PHRASE) + COUNTS_PER_PHRASE) % COUNTS_PER_PHRASE
  return Math.floor(p) + 1
}

/**
 * Record the beat each answer lands on, frame by frame, until stop() is called.
 *
 * A simulated pinch runs SIK's hover, select and release over several frames, so the beat the
 * Lens takes an answer on is not the beat the scenario called pinch() on. This reads it off the
 * Lens: an Again that is taken shows up as againCounts changing, one the guard drops as
 * ignoredAnswers changing. The two arrays are the live ones, so they can be read mid-run.
 */
function answerWatcher(m: FloorcountMain): { taken: number[]; dropped: number[]; stop: () => void } {
  const taken: number[] = []
  const dropped: number[] = []
  let lastAgains = m.state.againCounts[0]
  let lastDropped = m.ignoredAnswers
  let watching = true
  const look = async (): Promise<void> => {
    while (watching) {
      if (m.state.againCounts[0] !== lastAgains) {
        lastAgains = m.state.againCounts[0]
        taken.push(m.currentBeat)
      }
      if (m.ignoredAnswers !== lastDropped) {
        lastDropped = m.ignoredAnswers
        dropped.push(m.currentBeat)
      }
      await nextFrame()
    }
  }
  look()
  return {
    taken,
    dropped,
    stop: () => {
      watching = false
    },
  }
}

/**
 * Wait until the music is `pos` to `pos + width` beats into an 8-count numbered 1 or later.
 *
 * A frame at a time rather than on a sleep: a sleep resolves through a delayed callback, which
 * in a slow preview comes round less often than a count, and a position inside the 8-count
 * cannot be waited for on a grid coarser than the window being aimed at.
 */
async function waitForPhrasePosition(pos: number, width: number, timeoutMs: number): Promise<boolean> {
  const m = main()
  const deadline = getTime() + timeoutMs / 1000
  while (getTime() < deadline) {
    const beat = m.currentBeat
    const phrase = Math.floor(beat / COUNTS_PER_PHRASE)
    const p = beat - phrase * COUNTS_PER_PHRASE
    if (phrase >= 1 && p >= pos && p < pos + width) return true
    await nextFrame()
  }
  return false
}

/** Wait until the guard would take an answer, or give up after timeoutMs. */
async function waitForCanAnswer(timeoutMs: number): Promise<boolean> {
  const m = main()
  const deadline = getTime() + timeoutMs / 1000
  while (getTime() < deadline) {
    if (m.canAnswer) return true
    await sleep(20)
  }
  return m.canAnswer
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
    const c = card()
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

    // ---------------------------------------------------------------- late answer, then the next window
    //
    // An answer may be pinched anywhere in an 8-count, so one taken on count 7 or 8 must not be
    // followed by another at the top of the next 8-count one beat later: that would be two
    // "in a row" with nothing danced between them. The guard keeps
    // COUNTS_PER_PHRASE - answerWindowCounts beats between answers, and the capsules read from
    // the same rule, so they stay at rest while an answer would be dropped.
    //
    // The tempo drop above restarted the music, so the 8-count numbering starts over and the
    // second 8-count is again the first that can be answered.
    //
    // A pinch is aimed rather than assumed. SIK's hover, select and release take several frames,
    // so the Lens takes an answer well after the scenario asks for it: about one and a half
    // beats on a preview that is keeping up, over four on one that is not. Each attempt reads
    // the beat the Lens actually took its answer on, takes that lag off the next attempt's
    // starting position, and stops once one lands late enough in an 8-count for the top of the
    // next 8-count to still be inside the guard's window. An extra Again at Slow with the step
    // already split moves nothing but its own count.
    const watch = answerWatcher(m)
    /** Where in the 8-count the answer should land: late in count 8. */
    const LANDING = 7.4
    const window = COUNTS_PER_PHRASE - m.answerWindowCounts
    let lag = 1.5
    let lateBeat = -1
    let latePhrase = -1
    let streakAfterLate = -1
    let againsAfterLate = -1
    let droppedBeforeLate = 0
    for (let attempt = 1; attempt <= 4 && lateBeat < 0; attempt++) {
      expect(await waitForCanAnswer(14000)).toBe(true)
      expect(await waitForPhrasePosition(Math.max(0.1, LANDING - lag), 1.2, 14000)).toBe(true)
      const calledBeat = m.currentBeat
      const takenBefore = watch.taken.length
      droppedBeforeLate = m.ignoredAnswers
      await pinch("AgainButton", io)
      await sleep(200)
      // Wherever it landed, the guard had to take it: an 8-count has played and the last answer
      // is further back than the window.
      expect(watch.taken.length).toBe(takenBefore + 1)
      expect(m.ignoredAnswers).toBe(droppedBeforeLate)
      const beat = watch.taken[watch.taken.length - 1]
      const phrase = Math.floor(beat / COUNTS_PER_PHRASE)
      const pos = beat - phrase * COUNTS_PER_PHRASE
      lag = Math.max(0.2, beat - calledBeat)
      print(
        "[C8] aim " + attempt + ": pinched on beat " + calledBeat.toFixed(2) + ", taken on beat " +
          beat.toFixed(2) + " (count " + countOfBeat(beat) + " of 8-count " + phrase + "), lag " +
          lag.toFixed(2) + " beats",
      )
      if (pos >= 7 && COUNTS_PER_PHRASE - pos + lag < window) {
        lateBeat = beat
        latePhrase = phrase
        streakAfterLate = m.state.againStreak
        againsAfterLate = m.state.againCounts[0]
      }
    }
    expect(lateBeat >= 0).toBe(true)
    expect(countOfBeat(lateBeat) >= 7).toBe(true)

    // The very next 8-count, a beat or two of music after the answer, so the next one is dropped
    // and the capsules are at rest even though this may be the two-count answer window. A pinch
    // can use up that whole beat or two by itself, so this looks at the 8-count straight after
    // the answer, wherever in it the pinch left the session. Waiting for the top of an 8-count
    // can miss this one and land on the one after, 8 beats on, where the guard has rightly
    // opened again.
    while (Math.floor(m.currentBeat / COUNTS_PER_PHRASE) <= latePhrase) await nextFrame()
    await nextFrame() // let the capsules take this frame's answer window
    expect(Math.floor(m.currentBeat / COUNTS_PER_PHRASE)).toBe(latePhrase + 1)
    expect(m.currentBeat - lateBeat < window).toBe(true)
    expect(m.canAnswer).toBe(false)
    expect(c.buttonsBright).toBe(false)
    const droppedBeforeTop = m.ignoredAnswers
    await pinch("AgainButton", io)
    await sleep(200)
    const topBeat = watch.dropped.length > 0 ? watch.dropped[watch.dropped.length - 1] : -1
    print(
      "[C8] late answer taken on beat " + lateBeat.toFixed(2) + " (count " + countOfBeat(lateBeat) +
        " of 8-count " + latePhrase + "), the next one dropped on beat " + topBeat.toFixed(2) +
        " (count " + countOfBeat(topBeat) + " of 8-count " + Math.floor(topBeat / COUNTS_PER_PHRASE) +
        "), " + (topBeat - lateBeat).toFixed(2) + " beats apart against the " +
        (COUNTS_PER_PHRASE - m.answerWindowCounts) + " the guard asks for",
    )
    expect(m.ignoredAnswers).toBe(droppedBeforeTop + 1)
    expect(m.state.againCounts[0]).toBe(againsAfterLate)
    expect(m.state.againStreak).toBe(streakAfterLate)
    expect(m.state.tempo).toBe(0)
    expect(m.state.segment).toBe("first")
    // The two answers landed in different 8-counts, so only the window between them can have
    // dropped the second: the old rule, one answer per 8-count, would have taken it.
    expect(Math.floor(topBeat / COUNTS_PER_PHRASE)).toBe(latePhrase + 1)
    expect(topBeat - lateBeat < window).toBe(true)

    // Later in the same 8-count the window has been danced through and the guard opens again.
    expect(await waitForCount(7, 12000)).toBe(true)
    expect(m.canAnswer).toBe(true)
    watch.stop()

    // ---------------------------------------------------------------- paused
    //
    // Nothing is being danced while the session is held, so nothing is being answered.
    const tempoBeforePause = m.state.tempo
    const segmentBeforePause = m.state.segment
    const droppedBeforePause = m.ignoredAnswers
    await pinch("TitleButton", io)
    await sleep(250)
    expect(a.isPaused).toBe(true)
    expect(c.isPaused).toBe(true)
    expect(m.canAnswer).toBe(false)
    expect(c.buttonsBright).toBe(false)
    await pinch("GotItButton", io)
    await sleep(250)
    print(
      "[C8] paused on beat " + m.currentBeat.toFixed(2) + ": canAnswer " + m.canAnswer +
        ", dropped " + (m.ignoredAnswers - droppedBeforePause) + ", tempo " + m.state.tempo +
        ", segment " + m.state.segment,
    )
    expect(m.ignoredAnswers).toBe(droppedBeforePause + 1)
    expect(m.state.tempo).toBe(tempoBeforePause)
    expect(m.state.segment).toBe(segmentBeforePause)

    // Going on again brings the guard back, in this 8-count or the next.
    await pinch("TitleButton", io)
    await sleep(250)
    expect(a.isPaused).toBe(false)
    expect(c.isPaused).toBe(false)
    const resumedBeat = m.currentBeat
    // 9 s is over two 8-counts at Slow (3.43 s each), so "this one or the next" fits twice over.
    expect(await waitForCanAnswer(9000)).toBe(true)
    print(
      "[C8] resumed on beat " + resumedBeat.toFixed(2) + ", canAnswer back on beat " +
        m.currentBeat.toFixed(2),
    )

    print("[C8] passed: one answer per 8-count, a window between answers, none while paused")
  }
}
