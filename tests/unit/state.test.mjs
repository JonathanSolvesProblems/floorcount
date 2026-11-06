// The session rules: what an Again or a Got it does, and how a session ends.
import test from "node:test"
import assert from "node:assert/strict"
import { State } from "./load.mjs"

const { FloorcountState, TEMPO_SLOW, TEMPO_MEDIUM, TEMPO_FULL, TEMPO_NAMES } = State
const fresh = () => new FloorcountState()
const times = (n, fn) => {
  let last
  for (let i = 0; i < n; i++) last = fn()
  return last
}
/** Got its from a fresh step until it is cleared: two to climb to Full, three clean at Full. */
const clearStep = (s) => times(5, () => s.gotIt())

test("a session starts on the basic step, at Slow, whole step, count showing", () => {
  const s = fresh()
  assert.equal(s.phase, "learning")
  assert.equal(s.stepIndex, 0)
  assert.equal(s.step.name, "Basic step")
  assert.equal(s.tempo, TEMPO_SLOW)
  assert.equal(s.segment, "full")
  assert.equal(s.countVisible, true)
  assert.deepEqual(s.againCounts, [0, 0, 0])
  assert.equal(s.stepCount, 3)
  assert.deepEqual(TEMPO_NAMES, ["Slow", "Medium", "Full"])
})

test("one Again changes neither the tempo nor the part of the step shown", () => {
  const s = fresh()
  s.gotIt() // up to Medium, so there is a level to drop from
  const change = s.again()
  assert.equal(s.tempo, TEMPO_MEDIUM)
  assert.equal(s.segment, "full")
  assert.deepEqual([change.tempoChanged, change.segmentChanged], [false, false])
  assert.equal(s.againCounts[0], 1)
})

test("two Agains in a row drop the tempo one level and show counts 1 to 4 only", () => {
  const s = fresh()
  s.gotIt()
  s.again()
  const change = s.again()
  assert.equal(s.tempo, TEMPO_SLOW)
  assert.equal(s.segment, "first")
  assert.deepEqual([change.tempoChanged, change.segmentChanged], [true, true])
  for (let c = 1; c <= 8; c++) assert.equal(s.isCountShown(c), c <= 4, "count " + c)
})

test("at Slow, two Agains still split the step but the tempo has nowhere to drop to", () => {
  const s = fresh()
  s.again()
  const change = s.again()
  assert.equal(s.tempo, TEMPO_SLOW)
  assert.equal(change.tempoChanged, false)
  assert.equal(s.segment, "first")
})

test("a Got it between two Agains breaks the row", () => {
  const s = fresh()
  s.gotIt()
  s.again()
  s.gotIt()
  s.again()
  assert.equal(s.segment, "full")
  assert.equal(s.againCounts[0], 2)
})

test("the halves come back in order: counts 1 to 4, then 5 to 8, then the whole step", () => {
  const s = fresh()
  times(2, () => s.again())
  assert.equal(s.segment, "first")
  s.gotIt()
  assert.equal(s.segment, "second")
  for (let c = 1; c <= 8; c++) assert.equal(s.isCountShown(c), c >= 5, "count " + c)
  s.gotIt()
  assert.equal(s.segment, "full")
  for (let c = 1; c <= 8; c++) assert.equal(s.isCountShown(c), true)
  assert.equal(s.tempo, TEMPO_SLOW, "working through the halves does not raise the tempo")
})

test("a Got it below Full raises the tempo one level", () => {
  const s = fresh()
  let change = s.gotIt()
  assert.equal(s.tempo, TEMPO_MEDIUM)
  assert.equal(change.tempoChanged, true)
  change = s.gotIt()
  assert.equal(s.tempo, TEMPO_FULL)
  assert.equal(change.tempoChanged, true)
  assert.equal(s.fullGotItStreak, 0, "climbing to Full is not a clean 8-count at Full")
})

test("three Got its in a row at Full clear the step, and not two", () => {
  const s = fresh()
  times(2, () => s.gotIt())
  s.gotIt()
  s.gotIt()
  assert.equal(s.phase, "learning")
  assert.equal(s.fullGotItStreak, 2)
  const change = s.gotIt()
  assert.equal(change.stepCompleted, true)
  assert.equal(s.phase, "fading")
})

test("an Again at Full starts the row of three over", () => {
  const s = fresh()
  times(2, () => s.gotIt())
  times(2, () => s.gotIt())
  s.again()
  assert.equal(s.fullGotItStreak, 0)
  times(2, () => s.gotIt())
  assert.equal(s.phase, "learning")
  s.gotIt()
  assert.equal(s.phase, "fading")
})

test("the count hides after a Got it and comes back after an Again", () => {
  const s = fresh()
  s.gotIt()
  assert.equal(s.countVisible, false)
  s.again()
  assert.equal(s.countVisible, true)
})

test("no answer is taken while the prints are fading", () => {
  const s = fresh()
  clearStep(s)
  assert.equal(s.acceptsAnswers, false)
  assert.equal(s.again().ignored, true)
  assert.equal(s.gotIt().ignored, true)
  assert.equal(s.againCounts[0], 0)
})

test("after the fade the next step loads from scratch: Slow, whole step, count showing", () => {
  const s = fresh()
  clearStep(s)
  s.finishFade()
  assert.equal(s.phase, "learning")
  assert.equal(s.stepIndex, 1)
  assert.equal(s.step.name, "Right turn")
  assert.equal(s.tempo, TEMPO_SLOW)
  assert.equal(s.segment, "full")
  assert.equal(s.countVisible, true)
  assert.equal(s.fullGotItStreak, 0)
})

test("finishFade does nothing unless a step has just been cleared", () => {
  const s = fresh()
  s.finishFade()
  assert.equal(s.stepIndex, 0)
  assert.equal(s.phase, "learning")
})

test("a session with no Agains ends in the summary, with no review", () => {
  const s = fresh()
  for (let i = 0; i < 3; i++) {
    clearStep(s)
    s.finishFade()
  }
  assert.equal(s.phase, "summary")
})

test("the step with the most Agains comes back once at Full, then the summary", () => {
  const s = fresh()
  clearStep(s)
  s.finishFade()
  // Three Agains on the right turn: the first two split it, the third lands in the first half.
  times(3, () => s.again())
  times(2, () => s.gotIt()) // back through the halves
  clearStep(s)
  s.finishFade()
  s.again() // one on the left turn
  clearStep(s)
  s.finishFade()
  assert.equal(s.phase, "review")
  assert.equal(s.reviewStepIndex, 1)
  assert.equal(s.step.name, "Right turn")
  assert.equal(s.displayStepIndex, 1)
  assert.equal(s.tempo, TEMPO_FULL)
  assert.equal(s.segment, "full")
  assert.equal(s.acceptsAnswers, false)
  s.finishReview()
  assert.equal(s.phase, "summary")
})

test("when two steps tie for the most Agains, the earlier one comes back", () => {
  const s = fresh()
  s.again()
  clearStep(s)
  s.finishFade()
  s.again()
  clearStep(s)
  s.finishFade()
  clearStep(s)
  s.finishFade()
  assert.equal(s.phase, "review")
  assert.equal(s.reviewStepIndex, 0)
})

test("finishReview does nothing outside the review", () => {
  const s = fresh()
  s.finishReview()
  assert.equal(s.phase, "learning")
})

test("a lost count is marked once, on the step it was lost on", () => {
  const s = fresh()
  s.markLost(5)
  s.markLost(2)
  s.markLost(5)
  assert.deepEqual(s.lostMarks[0], [5, 2])
  assert.equal(s.isMarked(5), true)
  assert.equal(s.isMarked(3), false)
  clearStep(s)
  s.finishFade()
  assert.equal(s.isMarked(5), false, "the right turn has its own marks")
})

test("the summary lists every step with its Agains and its lost counts in order", () => {
  const s = fresh()
  s.again()
  s.markLost(7)
  s.markLost(2)
  const rows = s.summary()
  assert.deepEqual(rows.map((r) => r.name), ["Basic step", "Right turn", "Left turn"])
  assert.deepEqual(rows[0], { name: "Basic step", agains: 1, lostCounts: [2, 7] })
  assert.deepEqual(rows[1], { name: "Right turn", agains: 0, lostCounts: [] })
})

test("reset puts everything back", () => {
  const s = fresh()
  times(2, () => s.again())
  s.markLost(3)
  clearStep(s)
  s.reset()
  assert.equal(s.phase, "learning")
  assert.equal(s.stepIndex, 0)
  assert.equal(s.tempo, TEMPO_SLOW)
  assert.equal(s.segment, "full")
  assert.deepEqual(s.againCounts, [0, 0, 0])
  assert.deepEqual(s.lostMarks, [[], [], []])
})

// ---- What a finished session leaves for the next one ----

const { countsInWords, summaryRowText, serializeSession, parseSaved } = State
const lastTime = () => [
  { name: "Basic step", agains: 0, lostCounts: [] },
  { name: "Right turn", agains: 4, lostCounts: [2, 5] },
  { name: "Left turn", agains: 1, lostCounts: [6] },
]

test("counts are said the way a teacher says them", () => {
  assert.equal(countsInWords([]), "")
  assert.equal(countsInWords([2]), "2")
  assert.equal(countsInWords([2, 5]), "2 and 5")
  assert.equal(countsInWords([2, 5, 7]), "2, 5 and 7")
})

test("on a first session a summary row names the counts that were lost", () => {
  assert.equal(summaryRowText({ name: "Basic step", agains: 1, lostCounts: [] }, -1), "Basic step: 1 Again")
  assert.equal(summaryRowText({ name: "Left turn", agains: 0, lostCounts: [] }, -1), "Left turn: 0 Agains")
  assert.equal(
    summaryRowText({ name: "Right turn", agains: 4, lostCounts: [2, 5] }, -1),
    "Right turn: 4 Agains, lost it on 2 and 5",
  )
})

test("with a last session to compare to, a row carries the comparison instead", () => {
  assert.equal(summaryRowText({ name: "Right turn", agains: 2, lostCounts: [5] }, 4), "Right turn: 2 Agains, 4 last time")
  assert.equal(summaryRowText({ name: "Basic step", agains: 1, lostCounts: [] }, 0), "Basic step: 1 Again, 0 last time")
})

test("no summary row ever ends in an exclamation mark or praise", () => {
  for (const prev of [-1, 0, 3]) {
    const text = summaryRowText({ name: "Right turn", agains: 0, lostCounts: [] }, prev)
    assert.ok(!/[!]|great|nice|perfect/i.test(text), text)
  }
})

test("a finished session survives being saved and read back", () => {
  assert.deepEqual(parseSaved(serializeSession(lastTime())), lastTime())
})

test("a missing or damaged save counts as a first session", () => {
  const good = JSON.parse(serializeSession(lastTime()))
  const broken = (change) => {
    const copy = JSON.parse(JSON.stringify(good))
    change(copy)
    return JSON.stringify(copy)
  }
  assert.equal(parseSaved(null), null)
  assert.equal(parseSaved(undefined), null)
  assert.equal(parseSaved(""), null)
  assert.equal(parseSaved("not json {"), null)
  assert.equal(parseSaved("null"), null)
  assert.equal(parseSaved(broken((d) => (d.v = 2))), null, "another format version")
  assert.equal(parseSaved(broken((d) => d.rows.pop())), null, "a step missing")
  assert.equal(parseSaved(broken((d) => (d.rows[1].name = "Cross body lead"))), null, "another set of steps")
  assert.equal(parseSaved(broken((d) => (d.rows[1].agains = -1))), null, "a negative count of Agains")
  assert.equal(parseSaved(broken((d) => (d.rows[1].agains = 1.5))), null, "half an Again")
  assert.equal(parseSaved(broken((d) => (d.rows[1].agains = "4"))), null, "Agains as text")
  assert.equal(parseSaved(broken((d) => (d.rows[1].lostCounts = "2,5"))), null, "lost counts as text")
  assert.equal(parseSaved(broken((d) => (d.rows[1].lostCounts = [4]))), null, "a hold cannot be lost")
  assert.equal(parseSaved(broken((d) => (d.rows[1].lostCounts = [9]))), null, "there is no count 9")
})

test("a first session has nothing from last time", () => {
  const s = fresh()
  assert.equal(s.previous, null)
  assert.deepEqual(s.previousLostCounts(1), [])
  assert.equal(s.previousAgains(1), -1)
})

test("the last session's Agains and lost counts are there for each step, and outlive a reset", () => {
  const s = fresh()
  s.setPrevious(lastTime())
  assert.deepEqual(s.previousLostCounts(1), [2, 5])
  assert.equal(s.previousAgains(1), 4)
  assert.equal(s.previousAgains(0), 0)
  s.previousLostCounts(1).push(7)
  assert.deepEqual(s.previousLostCounts(1), [2, 5], "callers get a copy")
  s.reset()
  assert.equal(s.previousAgains(1), 4)
  s.setPrevious(null)
  assert.equal(s.previousAgains(1), -1)
})

test("a last session for a different number of steps is ignored", () => {
  const s = fresh()
  s.setPrevious(lastTime().slice(0, 2))
  assert.equal(s.previous, null)
})

test("the Lens knows whether the step on the floor has had an answer yet", () => {
  const s = fresh()
  assert.equal(s.answeredThisStep, false)
  s.again()
  assert.equal(s.answeredThisStep, true)
  const t = fresh()
  t.gotIt()
  assert.equal(t.answeredThisStep, true)
  times(4, () => t.gotIt())
  t.finishFade()
  assert.equal(t.stepIndex, 1)
  assert.equal(t.answeredThisStep, false, "a new step starts unanswered")
  t.again()
  t.reset()
  assert.equal(t.answeredThisStep, false)
})

test("the two thresholds are settings, not constants", () => {
  const s = new FloorcountState(TEMPO_SLOW, 3, 2)
  times(2, () => s.again())
  assert.equal(s.segment, "full", "with againsToDrop 3, two Agains do not split the step")
  s.again()
  assert.equal(s.segment, "first")
  const t = new FloorcountState(TEMPO_FULL, 2, 2)
  t.gotIt()
  assert.equal(t.phase, "learning")
  t.gotIt()
  assert.equal(t.phase, "fading", "with gotItsToAdvance 2, two clean 8-counts clear the step")
})
