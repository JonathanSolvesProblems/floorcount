/**
 * FloorcountTestKit — shared lookups and session helpers for the LEAF scenarios.
 *
 * Owns: finding the Floorcount components in the live scene, restarting the session so each
 * scenario starts from a known state, and the small waits the scenarios keep repeating
 * (wait for a count, wait for a phase).
 *
 * Must not: assert anything. The scenarios own their expectations.
 */

import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils"
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import { findInteractablesByName } from "Leaf.lspkg/Interactors/InteractableUtils"
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
export async function restartSession(answerGuard: boolean = false): Promise<void> {
  const m = main()
  m.answerGuard = answerGuard
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

/** Drive one step from its fresh state to "mastered" with Got it pinches only. */
export async function masterCurrentStep(who: DefaultLeafInteractor): Promise<void> {
  const m = main()
  let guard = 0
  while (m.state.phase === "learning" && guard < 12) {
    guard++
    await pinch("GotItButton", who)
    await sleep(120)
  }
}
