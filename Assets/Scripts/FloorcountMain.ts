/**
 * FloorcountMain: orchestrates the practice session.
 *
 * Owns: the FloorcountState instance and the per-frame loop: read the beat from the music's
 * playback clock, light the footprints, update the count number, play the clave on counts
 * 1 and 5, brighten the buttons for the two counts after each 8-count, run the two-count
 * fade between steps, the one-8-count review, and the end-of-session summary.
 *
 * Expects @inputs (wired by the bootstrap): the step card UI, the count UI, the pad
 * controller, the audio controller, the off-view arrow, the camera, and the authored
 * "FloorcountWorld" root that holds the floor layout.
 *
 * Must not: build UI or text (the *UI modules do), or own footwork data (FloorcountSteps).
 */

import {
  countsInWords,
  FloorcountState,
  parseSaved,
  Phase,
  serializeSession,
  StepSummary,
  summaryRowText,
  TEMPO_NAMES,
  TEMPO_FULL,
} from "./FloorcountState"

/** Where a finished session is kept so the next practice can pick up from it. */
const SAVE_KEY = "floorcount.lastSession"
import { COUNTS_PER_PHRASE, STEPS } from "./FloorcountSteps"
import { FloorcountStepCardUI } from "./FloorcountStepCardUI"
import { FloorcountCountUI } from "./FloorcountCountUI"
import { FloorcountPadController } from "./FloorcountPadController"
import { FloorcountAudioController } from "./FloorcountAudioController"
import { FloorcountOffViewArrow } from "./FloorcountOffViewArrow"

@component
export class FloorcountMain extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">FloorcountMain: salsa footwork practice session</span>')
  @ui.separator
  @ui.group_start("References")
  @input
  @hint("Step card UI (Again / Got it / title).")
  stepCard!: FloorcountStepCardUI
  @input
  @hint("Floating count number above the pad.")
  countDisplay!: FloorcountCountUI
  @input
  @hint("Footprint pad controller.")
  pad!: FloorcountPadController
  @input
  @hint("Music, clave and cue playback; also the beat clock.")
  audio!: FloorcountAudioController
  @input
  @hint("Arrow that points back to the pad when neither the pad nor the step card is in view.")
  offViewArrow!: FloorcountOffViewArrow
  @input
  @hint("The camera (the user's head at the start position).")
  cameraObject!: SceneObject
  @input
  @hint("Root of the floor layout; moved to the start position when the Lens starts.")
  worldRoot!: SceneObject
  @ui.group_end
  @ui.separator
  @ui.group_start("Settings")
  @input
  @hint("Move the layout so the pad is in front of where the user stands when the Lens starts.")
  recenterOnStart: boolean = true
  @input
  @widget(new SliderWidget(1, 4, 1))
  @hint("Counts after each 8-count during which the buttons are bright (waiting for an answer).")
  answerWindowCounts: number = 2
  @input
  @widget(new SliderWidget(1, 4, 1))
  @hint("Counts the footprints take to fade out before the next step loads.")
  fadeCounts: number = 2
  @input
  @widget(new SliderWidget(1, 5, 1))
  @hint("Agains in a row that drop the tempo and split the step into halves.")
  againsToDrop: number = 2
  @input
  @widget(new SliderWidget(1, 6, 1))
  @hint("Got its in a row at Full tempo that move on to the next step.")
  gotItsToAdvance: number = 3
  @ui.group_end

  state!: FloorcountState
  /** Beats since the current loop started (count 1 = beat 0). */
  currentBeat = 0
  /** Current count 1..8 (0 when stopped). */
  currentCount = 0
  /** Count transitions seen, for tests: [count, beat] pairs, newest last (capped). */
  readonly countLog: number[][] = []
  /** Times the clave was triggered, for tests. */
  claveHits = 0
  /**
   * One answer per 8-count. An Again or a Got it is taken only once a whole 8-count has played
   * since the music last started, and only once per 8-count after that. Without this, three
   * quick pinches of Got it clear a step nobody danced, and a double pinch from noisy hand
   * tracking counts twice. The scenarios that exercise the session rules switch it off so they
   * can press without waiting; floorcount-c8-answer-guard covers the guard itself.
   */
  answerGuard = true
  /** Answers the guard dropped since the session started, for tests. */
  ignoredAnswers = 0

  /** The 8-count (since the music last started) of the last answer taken; -1 for none. */
  private answeredPhrase = -1
  private lastBeatIndex = -1
  private fadeStartBeat = 0
  private frame = 0
  private ready = false

  onAwake(): void {
    if (!this.stepCard || !this.countDisplay || !this.pad || !this.audio || !this.offViewArrow) {
      print("FloorcountMain: a required @input is not wired (stepCard, countDisplay, pad, audio, offViewArrow).")
      return
    }
    this.state = new FloorcountState(0, this.againsToDrop, this.gotItsToAdvance)
    // The arrow is already wired to the pad; the card is the other surface it has to stay
    // out of the way of, and Main is the one component that holds a reference to both.
    this.offViewArrow.cardTarget = this.stepCard.getSceneObject()
    this.stepCard.onAgain.add(() => this.onAgain())
    this.stepCard.onGotIt.add(() => this.onGotIt())
    this.stepCard.onTitle.add(() => this.onTitle())
    this.pad.onFootprintPinched.add((count) => this.onFootprintPinched(count))
    this.createEvent("OnStartEvent").bind(() => this.startSession())
    this.createEvent("UpdateEvent").bind(() => this.tick())
  }

  // ---------------------------------------------------------------- session flow

  /** Start the session over from the first step. Used by the summary's title button and by tests. */
  restart(): void {
    this.startSession()
  }

  /**
   * Forget the last finished session, in storage and in this one. The scenarios call it so each
   * starts from a first-session state; nothing in the Lens itself offers it, because a finished
   * session simply replaces the one before.
   */
  clearSaved(): void {
    const store = this.saveStore()
    try {
      if (store) store.remove(SAVE_KEY)
    } catch (e) {
      print("Floorcount: could not clear the saved session: " + e)
    }
    this.state.setPrevious(null)
    this.pad.setPreviousMarks([])
  }

  /** The Lens's persistent store, or null where there is none. */
  private saveStore(): GeneralDataStore | null {
    const system = global.persistentStorageSystem
    return system && system.store ? system.store : null
  }

  /** What the last finished session left, or null. A bad or missing save is a first session. */
  private loadSaved(): StepSummary[] | null {
    try {
      const store = this.saveStore()
      return store ? parseSaved(store.getString(SAVE_KEY)) : null
    } catch (e) {
      print("Floorcount: could not read the saved session: " + e)
      return null
    }
  }

  private saveSession(rows: StepSummary[]): void {
    try {
      const store = this.saveStore()
      if (store) store.putString(SAVE_KEY, serializeSession(rows))
    } catch (e) {
      print("Floorcount: could not save the session: " + e)
    }
  }

  private startSession(): void {
    this.state.reset()
    this.state.setPrevious(this.loadSaved())
    this.ignoredAnswers = 0
    this.pad.setFloorVisible(true)
    this.stepCard.showPractice()
    this.stepCard.setPaused(false)
    this.loadCurrentStep()
    this.ready = true
    print("Floorcount: session started, " + this.state.step.name + " at " + TEMPO_NAMES[this.state.tempo] + " (" + this.audio.bpm + " BPM)")
  }

  private loadCurrentStep(): void {
    const s = this.state
    this.pad.loadStep(s.step)
    this.pad.setCountFilter((c) => s.isCountShown(c))
    this.pad.setMarks(s.lostMarks[s.displayStepIndex])
    // The counts lost on this step last practice carry a faint ring from the start.
    this.pad.setPreviousMarks(s.previousLostCounts(s.displayStepIndex))
    this.pad.setFade(1)
    this.restartMusic()
    this.refreshCard()
  }

  private restartMusic(): void {
    this.audio.startMusic(this.state.tempo)
    this.lastBeatIndex = -1
    this.currentBeat = 0
    this.answeredPhrase = -1
    this.stepCard.setPaused(false)
  }

  /** Whether an Again or a Got it would be taken right now (see answerGuard). */
  get canAnswer(): boolean {
    if (!this.ready || !this.state.acceptsAnswers) return false
    if (!this.answerGuard) return true
    const phrase = Math.floor(this.currentBeat / COUNTS_PER_PHRASE)
    return phrase >= 1 && phrase !== this.answeredPhrase
  }

  /** Take this 8-count's answer, or drop it if one is not due. */
  private takeAnswer(): boolean {
    if (!this.canAnswer) {
      this.ignoredAnswers++
      return false
    }
    this.answeredPhrase = Math.floor(this.currentBeat / COUNTS_PER_PHRASE)
    return true
  }

  private refreshCard(): void {
    const s = this.state
    this.stepCard.setStep(s.step.name, s.displayStepIndex, s.stepCount)
    this.stepCard.setTempo(TEMPO_NAMES[s.tempo], this.audio.tempoBpm[s.tempo])
    this.stepCard.setFocus(this.focusText())
    this.countDisplay.setShown(s.countVisible && s.phase !== "summary")
  }

  /** The focus line, in the teacher's voice (.design/brand/voice.md): short, no praise. */
  private focusText(): string {
    const s = this.state
    if (s.phase === "review") return "Once more at Full"
    if (s.phase === "fading") {
      const next = s.stepIndex + 1
      // After the last step it is the worst step that comes back, at Full, not a new one.
      return next < s.stepCount ? "Next: " + STEPS[next].name.toLowerCase() : "Once more at Full"
    }
    if (s.segment === "first") return "Counts 1 to 4 only"
    if (s.segment === "second") return "Counts 5 to 8 only"
    // Until the first answer on a step, say where it was lost last practice.
    const lostBefore = s.previousLostCounts(s.displayStepIndex)
    if (s.phase === "learning" && !s.answeredThisStep && lostBefore.length > 0) {
      return "Last time: lost it on " + countsInWords(lostBefore)
    }
    if (s.tempo === TEMPO_FULL) return s.fullGotItStreak + " of " + this.gotItsToAdvance + " clean at Full"
    return "Whole step"
  }

  private enterSummary(): void {
    this.audio.stopMusic()
    this.pad.setFloorVisible(false)
    this.countDisplay.setShown(false)
    const finished = this.state.summary()
    // Each row is compared with the session before, then this one takes its place for next time.
    const rows = finished.map((r, i) => summaryRowText(r, this.state.previousAgains(i)))
    this.saveSession(finished)
    this.stepCard.showSummary(rows, "Pinch the title to practise again")
    this.stepCard.setAnswerWindow(false)
    print("Floorcount: session complete. " + rows.join(" | "))
  }

  // ---------------------------------------------------------------- input

  private onAgain(): void {
    if (!this.takeAnswer()) return
    this.audio.playTap()
    const change = this.state.again()
    if (change.ignored) return
    if (change.tempoChanged) this.restartMusic()
    this.refreshCard()
  }

  private onGotIt(): void {
    if (!this.takeAnswer()) return
    this.audio.playTap()
    const change = this.state.gotIt()
    if (change.ignored) return
    if (change.stepCompleted) {
      this.audio.playMastered()
      this.fadeStartBeat = this.currentBeat
    }
    if (change.tempoChanged) this.restartMusic()
    this.refreshCard()
  }

  private onTitle(): void {
    if (!this.ready) return
    this.audio.playTap()
    if (this.state.phase === "summary") {
      this.restart()
      return
    }
    if (this.audio.isPaused) {
      this.audio.resume()
      this.stepCard.setPaused(false)
    } else {
      this.audio.pause()
      this.stepCard.setPaused(true)
    }
  }

  private onFootprintPinched(count: number): void {
    if (!this.ready || this.state.phase === "summary") return
    this.audio.playTap()
    this.state.markLost(count)
    this.pad.flash(count)
    this.pad.setMarks(this.state.lostMarks[this.state.displayStepIndex])
    print("Floorcount: marked lost on count " + count + " (" + this.state.step.name + ")")
  }

  // ---------------------------------------------------------------- frame loop

  private tick(): void {
    this.frame++
    if (this.frame === 3 && this.recenterOnStart) this.recenter()
    if (!this.ready) return
    const s = this.state
    // Read the phase once per frame. Keeping it in a local also stops the narrowing below
    // from hiding the phase changes that finishFade / finishReview make mid-tick.
    const phase: Phase = s.phase
    if (phase === "summary") {
      this.offViewArrow.needed = false
      return
    }

    const beat = this.audio.currentBeat()
    this.currentBeat = beat
    const running = this.audio.isPlaying || this.audio.isPaused
    const p = ((beat % COUNTS_PER_PHRASE) + COUNTS_PER_PHRASE) % COUNTS_PER_PHRASE
    const count = Math.floor(p) + 1
    this.currentCount = count

    const beatIndex = Math.floor(beat)
    if (beatIndex !== this.lastBeatIndex && !this.audio.isPaused) {
      this.lastBeatIndex = beatIndex
      if (count === 1 || count === 5) {
        this.audio.playClave()
        this.claveHits++
      }
      this.countLog.push([count, beat])
      if (this.countLog.length > 64) this.countLog.shift()
    }
    // The strip, the numeral and the prints all read the one beat, so they strike together.
    this.countDisplay.updateBeat(beat, running, (c) => s.isCountShown(c))
    this.pad.updateBeat(beat, running)

    const phraseIndex = Math.floor(beat / COUNTS_PER_PHRASE)
    const waiting = phase === "learning" && phraseIndex >= 1 && p < this.answerWindowCounts
    // Bright means "waiting for your answer": once this 8-count's answer is in, back to rest.
    const answered = this.answerGuard && phraseIndex === this.answeredPhrase
    this.stepCard.setAnswerWindow(waiting && !answered)
    this.offViewArrow.needed = this.pad.isFloorVisible

    if (phase === "fading") {
      const f = (beat - this.fadeStartBeat) / this.fadeCounts
      this.pad.setFade(1 - f)
      if (f >= 1) {
        s.finishFade()
        if (s.phase === "summary") this.enterSummary()
        else this.loadCurrentStep()
      }
    } else if (phase === "review" && beat >= COUNTS_PER_PHRASE) {
      s.finishReview()
      this.enterSummary()
    }
  }

  /** Place the floor layout relative to where the user stands and faces at the start. */
  private recenter(): void {
    if (!this.cameraObject || !this.worldRoot) return
    const cam = this.cameraObject.getTransform()
    const pos = cam.getWorldPosition()
    const d = cam.back
    const yaw = Math.atan2(-d.x, -d.z)
    const t = this.worldRoot.getTransform()
    t.setWorldPosition(pos)
    t.setWorldRotation(quat.angleAxis(yaw, vec3.up()))
  }
}
