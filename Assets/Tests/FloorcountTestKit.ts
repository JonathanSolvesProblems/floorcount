/**
 * FloorcountTestKit: shared lookups and session helpers for the LEAF scenarios.
 *
 * Owns: finding the Floorcount components in the live scene, restarting the session so each
 * scenario starts from a known state, and the small waits the scenarios keep repeating
 * (wait for a count, wait for a phase).
 *
 * Must not: assert anything. The scenarios own their expectations.
 */

import { findSceneObjectByName, nextFrame, sleep } from "Leaf.lspkg/Utils/common/Utils"
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import { findInteractablesByName } from "Leaf.lspkg/Interactors/InteractableUtils"
import { COUNTS_PER_PHRASE } from "../Scripts/FloorcountSteps"
import { FloorcountMain } from "../Scripts/FloorcountMain"
import { FloorcountPadController } from "../Scripts/FloorcountPadController"
import { FloorcountCountUI } from "../Scripts/FloorcountCountUI"
import { FloorcountStepCardUI } from "../Scripts/FloorcountStepCardUI"
import { FloorcountAudioController } from "../Scripts/FloorcountAudioController"
import { FloorcountOffViewArrow } from "../Scripts/FloorcountOffViewArrow"
import { Phase } from "../Scripts/FloorcountState"

/** The SceneObject a Floorcount component lives on; throws with a clear name if it is gone. */
function host(objectName: string): SceneObject {
  const obj = findSceneObjectByName(objectName)
  if (!obj) throw new Error("Scene object '" + objectName + "' not found")
  return obj
}

function required<T>(c: T | null, objectName: string): T {
  if (!c) throw new Error("Floorcount script not found on '" + objectName + "'")
  return c
}

export function main(): FloorcountMain {
  return required(host("FloorcountMain").getComponent(FloorcountMain.getTypeName()), "FloorcountMain")
}

export function pad(): FloorcountPadController {
  return required(host("FootprintPad").getComponent(FloorcountPadController.getTypeName()), "FootprintPad")
}

export function countUI(): FloorcountCountUI {
  return required(host("CountNumber").getComponent(FloorcountCountUI.getTypeName()), "CountNumber")
}

export function card(): FloorcountStepCardUI {
  return required(host("StepCard").getComponent(FloorcountStepCardUI.getTypeName()), "StepCard")
}

export function audio(): FloorcountAudioController {
  return required(host("FloorcountAudio").getComponent(FloorcountAudioController.getTypeName()), "FloorcountAudio")
}

export function arrow(): FloorcountOffViewArrow {
  return required(host("OffViewArrow").getComponent(FloorcountOffViewArrow.getTypeName()), "OffViewArrow")
}

export function padObject(): SceneObject {
  const o = findSceneObjectByName("FootprintPad")
  if (!o) throw new Error("FootprintPad not found")
  return o
}

/** Any SceneObject by name, including ones the pad and the card build at runtime. */
export function objectNamed(name: string): SceneObject {
  const o = findSceneObjectByName(name)
  if (!o) throw new Error("Scene object '" + name + "' not found")
  return o
}

/** A named object somewhere under `parent`. Every footprint has its own "Foot" and "MarkRing". */
export function childNamed(parent: SceneObject, name: string): SceneObject {
  const o = findSceneObjectByName(name, parent)
  if (!o) throw new Error("'" + name + "' not found under '" + parent.name + "'")
  return o
}

/**
 * Whether a pinch target is there to be pinched: the Interactable exists and both it and its
 * place in the hierarchy are enabled. The summary disables the two answer buttons, so this is
 * how a scenario tells "the buttons are back" from "the buttons are merely still in the scene".
 */
export function isTargetEnabled(name: string): boolean {
  return findInteractablesByName(name, undefined, true).length > 0
}

export function cardObject(): SceneObject {
  const o = findSceneObjectByName("StepCard")
  if (!o) throw new Error("StepCard not found")
  return o
}

export function cameraObject(): SceneObject {
  const o = findSceneObjectByName("Camera Object")
  if (!o) throw new Error("Camera Object not found")
  return o
}

/**
 * Put the session back at step 1, Slow tempo, whole step, nothing marked.
 *
 * The one-answer-per-8-count guard is switched off unless asked for: the scenarios for the
 * session rules (C3, C4, C5) press Again and Got it back to back to walk the rules, and with
 * the guard on each press would have to wait out an 8-count of music. C8 runs with it on and
 * asserts the guard itself. A Lens reset puts it back on, which is how the Lens ships.
 */
export async function restartSession(answerGuard: boolean = false, keepSaved: boolean = false): Promise<void> {
  const m = main()
  m.answerGuard = answerGuard
  // The layout stays at its fixed height for every scenario: c1 and c6 measure the authored
  // relationship to the eye, and the preview's floor, if its depth answers at all, is not the
  // one those numbers were written for. C18 feeds floor readings by hand and asserts the rule.
  m.settleOnFloor = false
  m.resetFloor()
  // Every scenario starts as a first session unless it is the one testing the memory of the
  // last: a session another scenario finished must not leak rings or "last time" rows into it.
  if (!keepSaved) m.clearSaved()
  m.restart()
  await sleep(400)
}

/** Wait until the music has played `beat` beats since it last started, or give up after timeoutMs. */
export async function waitForBeat(beat: number, timeoutMs: number): Promise<boolean> {
  const m = main()
  const deadline = getTime() + timeoutMs / 1000
  while (getTime() < deadline) {
    if (m.currentBeat >= beat) return true
    await sleep(20)
  }
  return m.currentBeat >= beat
}

export function interactor(): DefaultLeafInteractor {
  return new DefaultLeafInteractor()
}

/** Pinch a named interactable (footprint, Again, Got it, the card title). */
export async function pinch(name: string, who: DefaultLeafInteractor): Promise<void> {
  const target = findInteractablesByName(name, undefined, true)[0]
  if (!target) throw new Error("Interactable '" + name + "' not found or not enabled")
  await who.trigger(target)
  await sleep(150)
}

/** Wait until the session reaches a phase, or give up after timeoutMs. */
export async function waitForPhase(phase: Phase, timeoutMs: number): Promise<boolean> {
  const m = main()
  const deadline = getTime() + timeoutMs / 1000
  while (getTime() < deadline) {
    if (m.state.phase === phase) return true
    await sleep(60)
  }
  return m.state.phase === phase
}

/**
 * Record each change of phase and step, frame by frame, until stop() is called.
 *
 * Use this when something can start and finish inside a simulated pinch (about 0.95 s), where one
 * look at the state afterwards cannot see it. stop() returns entries like "fading/0": the phase,
 * then the step index.
 */
export function watchPhases(): { stop: () => string[] } {
  const m = main()
  const seen: string[] = []
  let watching = true
  const look = async (): Promise<void> => {
    while (watching) {
      const now = m.state.phase + "/" + m.state.stepIndex
      if (seen[seen.length - 1] !== now) seen.push(now)
      await nextFrame()
    }
  }
  look()
  return {
    stop: () => {
      watching = false
      return seen
    },
  }
}

/** Wait until the session is learning the step at `index`, or give up after timeoutMs. */
export async function waitForStepIndex(index: number, timeoutMs: number): Promise<boolean> {
  const m = main()
  const deadline = getTime() + timeoutMs / 1000
  while (getTime() < deadline) {
    if (m.state.phase === "learning" && m.state.stepIndex === index) return true
    await sleep(60)
  }
  return m.state.phase === "learning" && m.state.stepIndex === index
}

/** Wait until the running count is `count`, or give up after timeoutMs. */
export async function waitForCount(count: number, timeoutMs: number): Promise<boolean> {
  const m = main()
  const deadline = getTime() + timeoutMs / 1000
  while (getTime() < deadline) {
    if (m.currentCount === count) return true
    await sleep(20)
  }
  return m.currentCount === count
}

/**
 * Drive one step from its fresh state to "mastered" with Got it pinches only.
 *
 * Stops as soon as this step is done, whether that shows up as the phase leaving "learning" or
 * as the next step having loaded already. Watching only the phase is not enough: the fade
 * between steps lasts two counts, which at Full tempo is 0.63 s, and a simulated pinch costs
 * about 0.95 s, so the loop can look once before the step completes and again after the next
 * step is already up, see "learning" both times, and spend the rest of its pinches answering
 * for a step the caller has not got to yet.
 */
export async function masterCurrentStep(who: DefaultLeafInteractor): Promise<void> {
  const m = main()
  const from = m.state.stepIndex
  let guard = 0
  while (m.state.phase === "learning" && m.state.stepIndex === from && guard < 12) {
    guard++
    await pinch("GotItButton", who)
    await sleep(120)
  }
}

/**
 * Drive the session from the step it is on all the way to the summary, with Got its only.
 *
 * Whatever Agains the caller has already pinched stay on the record, so the step with the most
 * of them still comes back for its one 8-count at Full before the summary; waiting for the
 * summary phase covers that review whether or not there is one.
 */
export async function finishSession(who: DefaultLeafInteractor, timeoutMs: number = 40000): Promise<boolean> {
  const m = main()
  let guard = 0
  // Driven off the live step rather than a counted loop, so it does the right thing from
  // whichever step the caller left the session on.
  while (m.state.phase === "learning" && guard <= m.state.stepCount) {
    guard++
    const from = m.state.stepIndex
    await masterCurrentStep(who)
    if (from < m.state.stepCount - 1) {
      if (!(await waitForStepIndex(from + 1, 15000))) return false
      await sleep(250)
    }
  }
  return await waitForPhase("summary", timeoutMs)
}

/**
 * Stop the beat clock with the running count at `count`, and leave it stopped.
 *
 * Pausing the music freezes the beat, which is what makes a pinch deterministic. Several of a
 * step's counts share one print (in the basic step count 7 is danced on count 2's spot) and the
 * pad reports whichever of a print's counts lit most recently, so without a known beat a pinch
 * of that print can register either count. A simulated pinch costs about 0.8 s, two beats at
 * Slow, so waiting for the right count and pinching straight away is not enough on its own.
 */
export async function freezeOnCount(count: number, timeoutMs: number = 20000): Promise<boolean> {
  const m = main()
  if (!(await waitForCount(count, timeoutMs))) return false
  audio().pause()
  await sleep(150)
  return m.currentCount === count
}

/** Let the beat run again after freezeOnCount. */
export function unfreeze(): void {
  audio().resume()
}

/**
 * Stop the beat clock within `maxFrac` of a count's strike, and return how far past it landed.
 *
 * This is how a scenario reads a struck value rather than a decayed one, and holds it for as
 * long as it is needed. The wait only considers beats from the second 8-count on, so the answer
 * window is live and the audio clock has settled.
 *
 * The wait is on `nextFrame` rather than on `sleep`. A sleep resolves through a delayed callback
 * and in this preview those come round about every 140 ms against a 429 ms beat, which is a
 * third of a beat: at that spacing the beat positions a scenario can even see fall on a coarse
 * grid, and landing on one near a strike is a matter of luck over tens of seconds. Waiting a
 * frame at a time puts every drawn frame within reach.
 *
 * Returns 1 (and leaves the music paused anyway) if no close enough reading turned up in time,
 * so the caller can fail on the number rather than hang.
 */
export async function freezeNearStrikeOf(
  count: number,
  maxFrac: number = 0.08,
  timeoutMs: number = 60000,
): Promise<number> {
  const m = main()
  const deadline = getTime() + timeoutMs / 1000
  let landed = 1
  let closest = 1
  while (getTime() < deadline) {
    const beat = m.currentBeat
    if (beat >= COUNTS_PER_PHRASE) {
      const p = ((beat % COUNTS_PER_PHRASE) + COUNTS_PER_PHRASE) % COUNTS_PER_PHRASE
      const frac = p - Math.floor(p)
      if (Math.floor(p) + 1 === count) {
        if (frac < closest) closest = frac
        if (frac < maxFrac) {
          landed = frac
          break
        }
      }
    }
    await nextFrame()
  }
  audio().pause()
  await sleep(250)
  if (landed === 1) {
    print("Floorcount test kit: never saw count " + count + " within " + maxFrac + " of its strike; closest was " + closest.toFixed(3))
  }
  return landed
}
