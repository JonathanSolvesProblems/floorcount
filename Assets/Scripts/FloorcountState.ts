/**
 * FloorcountState: the practice session's rules (pure logic, no scene access).
 *
 * Owns: current step, tempo level, which part of the step shows (whole / counts 1-4 /
 * counts 5-8), Again and Got it streaks, Again totals per step, lost-count marks, and the
 * session phase (learning -> fading -> review -> summary).
 *
 * Rules from the brief:
 *  - Two Agains in a row drop the tempo one level and show only counts 1-4 until Got it,
 *    then counts 5-8, then the whole step again.
 *  - A Got it at a lower tempo raises the tempo one level.
 *  - Three Got its in a row at Full tempo fade the footprints and load the next step.
 *  - After the last step, the step with the most Agains comes back once at Full tempo,
 *    then the floor clears and the summary shows each step's Again count.
 *  - The count number shows the first time a step plays and after any Again, and hides
 *    after a clean 8-count (Got it).
 *
 * Must not: touch audio, meshes or UI. Main reads the returned events and drives the view.
 */

import { STEPS, StepDef } from "./FloorcountSteps"

export type Segment = "full" | "first" | "second"
export type Phase = "learning" | "fading" | "review" | "summary"

export const TEMPO_SLOW = 0
export const TEMPO_MEDIUM = 1
export const TEMPO_FULL = 2
export const TEMPO_NAMES = ["Slow", "Medium", "Full"]

export interface StateChange {
  tempoChanged: boolean
  segmentChanged: boolean
  stepCompleted: boolean
  ignored: boolean
}

export interface StepSummary {
  name: string
  agains: number
  lostCounts: number[]
}

/** "2", "2 and 5", "2, 5 and 7": counts the way the teacher says them (voice.md). */
export function countsInWords(counts: number[]): string {
  if (counts.length <= 1) return counts.join("")
  // Past three counts the list outgrows the card (law 13: nothing longer than two lines at
  // 1 m), and a dancer who lost four of six counts needs the step again, not the list.
  if (counts.length > 3) return counts.length + " counts"
  return counts.slice(0, -1).join(", ") + " and " + counts[counts.length - 1]
}

/**
 * One row of the end-of-session summary.
 *
 * On a first session a row names the counts that were lost. Once there is a last session to
 * compare with, the row carries that comparison instead: the lost counts are not dropped, they
 * are saved, and the next session shows them as rings on the floor where they belong.
 * `previousAgains` is -1 when there is no last session.
 */
export function summaryRowText(row: StepSummary, previousAgains: number): string {
  const line = row.name + ": " + row.agains + (row.agains === 1 ? " Again" : " Agains")
  if (previousAgains >= 0) return line + ", " + previousAgains + " last time"
  if (row.lostCounts.length > 0) return line + ", lost it on " + countsInWords(row.lostCounts)
  return line
}

/** What a finished session leaves for the next one, as text for persistent storage. */
export function serializeSession(rows: StepSummary[]): string {
  return JSON.stringify({ v: 1, rows })
}

/**
 * Read a saved session back. Anything missing, malformed or from another set of steps counts
 * as no saved session, so a bad save can never break the start of a practice.
 */
export function parseSaved(text: string | null | undefined): StepSummary[] | null {
  if (!text) return null
  let data: any
  try {
    data = JSON.parse(text)
  } catch (e) {
    return null
  }
  if (!data || data.v !== 1 || !Array.isArray(data.rows) || data.rows.length !== STEPS.length) return null
  const rows: StepSummary[] = []
  for (let i = 0; i < STEPS.length; i++) {
    const r = data.rows[i]
    if (!r || r.name !== STEPS[i].name) return null
    if (typeof r.agains !== "number" || r.agains < 0 || Math.floor(r.agains) !== r.agains) return null
    if (!Array.isArray(r.lostCounts)) return null
    const stepping = STEPS[i].moves.filter((m) => m.foot !== null).map((m) => m.count)
    for (const c of r.lostCounts) if (stepping.indexOf(c) < 0) return null
    rows.push({ name: r.name, agains: r.agains, lostCounts: r.lostCounts.slice() })
  }
  return rows
}

export class FloorcountState {
  phase: Phase = "learning"
  stepIndex = 0
  tempo = TEMPO_SLOW
  segment: Segment = "full"
  againStreak = 0
  fullGotItStreak = 0
  countVisible = true
  againCounts: number[] = []
  lostMarks: number[][] = []
  reviewStepIndex = -1
  /** What the last finished session left, or null on a first session. Survives reset(). */
  previous: StepSummary[] | null = null
  /** True once an Again or a Got it has been taken on the step now on the floor. */
  answeredThisStep = false

  constructor(
    private readonly startTempo: number = TEMPO_SLOW,
    private readonly againsToDrop: number = 2,
    private readonly gotItsToAdvance: number = 3,
  ) {
    this.reset()
  }

  reset(): void {
    this.phase = "learning"
    this.stepIndex = 0
    this.tempo = this.startTempo
    this.segment = "full"
    this.againStreak = 0
    this.fullGotItStreak = 0
    this.countVisible = true
    this.againCounts = STEPS.map(() => 0)
    this.lostMarks = STEPS.map(() => [])
    this.reviewStepIndex = -1
    this.answeredThisStep = false
  }

  /** Hand in what the last finished session left (see parseSaved), or null for none. */
  setPrevious(rows: StepSummary[] | null): void {
    this.previous = rows && rows.length === STEPS.length ? rows : null
  }

  /** Counts lost on a step in the last finished session; empty on a first session. */
  previousLostCounts(stepIndex: number): number[] {
    const row = this.previous ? this.previous[stepIndex] : null
    return row ? row.lostCounts.slice() : []
  }

  /** Agains a step took in the last finished session, or -1 on a first session. */
  previousAgains(stepIndex: number): number {
    const row = this.previous ? this.previous[stepIndex] : null
    return row ? row.agains : -1
  }

  get stepCount(): number {
    return STEPS.length
  }

  /** The step currently on the floor (the review step during review). */
  get step(): StepDef {
    const i = this.phase === "review" ? this.reviewStepIndex : this.stepIndex
    return STEPS[Math.max(0, Math.min(STEPS.length - 1, i))]
  }

  get displayStepIndex(): number {
    return this.phase === "review" ? this.reviewStepIndex : this.stepIndex
  }

  /** True when the counts are 1..4 / 5..8 / all visible for the given count. */
  isCountShown(count: number): boolean {
    if (this.segment === "first") return count <= 4
    if (this.segment === "second") return count >= 5
    return true
  }

  get acceptsAnswers(): boolean {
    return this.phase === "learning"
  }

  /** Whether the end of the last step brings a step back for review: any step with an Again. */
  get reviewDue(): boolean {
    for (let i = 0; i < this.againCounts.length; i++) if (this.againCounts[i] > 0) return true
    return false
  }

  again(): StateChange {
    const change: StateChange = { tempoChanged: false, segmentChanged: false, stepCompleted: false, ignored: false }
    if (!this.acceptsAnswers) {
      change.ignored = true
      return change
    }
    this.answeredThisStep = true
    this.againCounts[this.stepIndex]++
    this.againStreak++
    this.fullGotItStreak = 0
    this.countVisible = true
    if (this.againStreak >= this.againsToDrop) {
      this.againStreak = 0
      if (this.tempo > TEMPO_SLOW) {
        this.tempo--
        change.tempoChanged = true
      }
      if (this.segment !== "first") {
        this.segment = "first"
        change.segmentChanged = true
      }
    }
    return change
  }

  gotIt(): StateChange {
    const change: StateChange = { tempoChanged: false, segmentChanged: false, stepCompleted: false, ignored: false }
    if (!this.acceptsAnswers) {
      change.ignored = true
      return change
    }
    this.answeredThisStep = true
    this.againStreak = 0
    this.countVisible = false
    if (this.segment === "first") {
      this.segment = "second"
      change.segmentChanged = true
      return change
    }
    if (this.segment === "second") {
      this.segment = "full"
      change.segmentChanged = true
      return change
    }
    if (this.tempo < TEMPO_FULL) {
      this.tempo++
      this.fullGotItStreak = 0
      change.tempoChanged = true
      return change
    }
    this.fullGotItStreak++
    if (this.fullGotItStreak >= this.gotItsToAdvance) {
      this.phase = "fading"
      change.stepCompleted = true
    }
    return change
  }

  /** Called by Main once the fade-out has finished. Loads the next step, the review, or the summary. */
  finishFade(): void {
    if (this.phase !== "fading") return
    if (this.stepIndex < STEPS.length - 1) {
      this.stepIndex++
      this.tempo = this.startTempo
      this.segment = "full"
      this.againStreak = 0
      this.fullGotItStreak = 0
      this.countVisible = true // first time this step plays
      this.answeredThisStep = false
      this.phase = "learning"
      return
    }
    // Last step done: the step with the most Agains comes back once at Full tempo.
    let best = -1
    let bestCount = 0
    for (let i = 0; i < this.againCounts.length; i++) {
      if (this.againCounts[i] > bestCount) {
        bestCount = this.againCounts[i]
        best = i
      }
    }
    if (best < 0) {
      this.phase = "summary"
      return
    }
    this.reviewStepIndex = best
    this.tempo = TEMPO_FULL
    this.segment = "full"
    this.countVisible = false
    this.phase = "review"
  }

  /** Called by Main after the review's single 8-count. */
  finishReview(): void {
    if (this.phase === "review") this.phase = "summary"
  }

  markLost(count: number): void {
    const i = this.displayStepIndex
    const marks = this.lostMarks[i]
    if (marks.indexOf(count) < 0) marks.push(count)
  }

  isMarked(count: number): boolean {
    return this.lostMarks[this.displayStepIndex].indexOf(count) >= 0
  }

  summary(): StepSummary[] {
    return STEPS.map((s, i) => ({
      name: s.name,
      agains: this.againCounts[i],
      lostCounts: this.lostMarks[i].slice().sort((a, b) => a - b),
    }))
  }
}
