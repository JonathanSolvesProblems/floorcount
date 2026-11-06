// Planted breaks: proof that the unit tests catch the bugs they claim to.
//
// Each entry below breaks one rule in a copy of the Lens's source (the real files are never
// touched), rebuilds that copy, and runs the whole suite against it. A break is "caught" when
// the suite fails. A break that survives means a rule nothing is testing, and this script exits
// non-zero. Only breaks that change behaviour are planted; a change that cannot alter any
// output would survive by definition and prove nothing.
//
// Usage: node planted-breaks.mjs [--json]
import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { build } from "./build.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const scripts = path.join(here, "..", "..", "Assets", "Scripts")
const read = (name) => fs.readFileSync(path.join(scripts, name), "utf8")

const S = "FloorcountState.ts"
const T = "FloorcountSteps.ts"
const L = "FloorcountLook.ts"

/** [file, what the break does, text to find, replacement, which occurrence (1-based, default 1)] */
const BREAKS = [
  [S, "two Agains no longer split the step (needs three)", "this.againStreak >= this.againsToDrop", "this.againStreak > this.againsToDrop"],
  [S, "two Agains raise the tempo instead of dropping it", "this.tempo--", "this.tempo++"],
  [S, "two Agains show counts 5 to 8 instead of 1 to 4", 'this.segment = "first"', 'this.segment = "second"'],
  [S, "an Again no longer restarts the row of clean 8-counts", "this.fullGotItStreak = 0", "this.fullGotItStreak = this.fullGotItStreak", 2],
  [S, "an Again no longer brings the count back", "this.countVisible = true", "this.countVisible = false", 2],
  [S, "a Got it no longer hides the count", "this.countVisible = false", "this.countVisible = true"],
  [S, "after counts 1 to 4 the step skips counts 5 to 8", 'this.segment = "second"', 'this.segment = "full"'],
  [S, "a Got it at Full tries to raise the tempo again", "this.tempo < TEMPO_FULL", "this.tempo <= TEMPO_FULL"],
  [S, "a Got it raises the tempo two levels", "this.tempo++", "this.tempo += 2"],
  [S, "three clean 8-counts no longer clear the step (needs four)", "this.fullGotItStreak >= this.gotItsToAdvance", "this.fullGotItStreak > this.gotItsToAdvance"],
  [S, "answers are taken while the prints fade", 'return this.phase === "learning"', 'return this.phase !== "summary"'],
  [S, "the last step loads a step that does not exist", "this.stepIndex < STEPS.length - 1", "this.stepIndex <= STEPS.length - 1"],
  [S, "the next step keeps the old tempo", "this.tempo = this.startTempo", "this.tempo = this.tempo", 2],
  [S, "the next step starts on half the step", 'this.segment = "full"', 'this.segment = "first"', 3],
  [S, "a tie for most Agains picks the later step, and a clean session gets a review", "this.againCounts[i] > bestCount", "this.againCounts[i] >= bestCount"],
  [S, "the review plays at Slow", "this.tempo = TEMPO_FULL", "this.tempo = TEMPO_SLOW"],
  [S, "the first half shows counts 1 to 3 only", "return count <= 4", "return count < 4"],
  [S, "the second half shows counts 6 to 8 only", "return count >= 5", "return count > 5"],
  [S, "a lost count is marked twice", "if (marks.indexOf(count) < 0) marks.push(count)", "marks.push(count)"],
  [S, "lost counts are listed backwards", ".sort((a, b) => a - b)", ".sort((a, b) => b - a)"],
  [S, "counts are joined with commas only", '" and " + counts[counts.length - 1]', '", " + counts[counts.length - 1]'],
  [S, "a row forgets the comparison when last time was clean", "if (previousAgains >= 0) return", "if (previousAgains > 0) return"],
  [S, "a row with a comparison still lists the lost counts", 'return line + ", " + previousAgains + " last time"', "void 0"],
  [S, "a save from another format version is accepted", "data.v !== 1", "data.v === 0"],
  [S, "a save for other steps is accepted", "r.name !== STEPS[i].name", "false"],
  [S, "a save may claim a hold was lost", "if (stepping.indexOf(c) < 0) return null", "void c"],
  [S, "a save may carry a negative count of Agains", "r.agains < 0 || ", ""],
  [S, "a last session for fewer steps is kept", "rows && rows.length === STEPS.length ? rows : null", "rows ? rows : null"],
  [S, "callers can edit last session's lost counts", "return row ? row.lostCounts.slice() : []", "return row ? row.lostCounts : []"],
  [S, "an Again does not count as an answer on the step", "this.answeredThisStep = true", "this.answeredThisStep = false"],
  [S, "a new step starts as already answered", "this.answeredThisStep = false", "this.answeredThisStep = true", 2],

  [T, "count 8 stops being a hold", "export const HOLD_COUNTS = [4, 8]", "export const HOLD_COUNTS = [4]"],
  [T, "isHold misses count 4", "HOLD_COUNTS.indexOf(count) >= 0", "HOLD_COUNTS.indexOf(count) > 0"],
  [T, "the forward and back steps are 25 cm", "const STEP = 30", "const STEP = 25"],
  [T, "the left foot's home is 2 cm out", "const HOME_L = { x: -10, z: 0 }", "const HOME_L = { x: -12, z: 0 }"],
  [T, "the right turn's pivot print faces forward", "yawDeg: -180", "yawDeg: 0"],
  [T, "the right turn's arc shows on count 2 only", "counts: [2, 3]", "counts: [2]"],
  [T, "the left turn's arc is marked as a right turn", 'direction: "left"', 'direction: "right"'],
  [T, "the left turn's crossing print lands on the wrong side", "x: -2, z: STEP", "x: 2, z: STEP"],
  [T, "a hold gets a floor spot", "if (m.foot === null) continue", ""],
  [T, "the right turn's arc runs past the pad's edge again", "radius: 17", "radius: 24"],
  [T, "the right turn's arc closes in front of the toes", "startDeg: 50", "startDeg: -60"],

  [L, "light decays at half the rate", "const DECAY_K = 4", "const DECAY_K = 2"],
  [L, "the rise starts a whole beat early", "const AND_RISE_BEATS = 0.5", "const AND_RISE_BEATS = 1"],
  [L, "rest is 30 per cent", "export const REST = 0.35", "export const REST = 0.3"],
  [L, "the rise is 70 per cent", "export const AND = 0.6", "export const AND = 0.7"],
  [L, "a struck light never quite returns to rest", "if (tBeats >= 1) return REST", ""],
  [L, "holds light up", "if (isHold(c) || !shown(c)) continue", "if (!shown(c)) continue"],
  [L, "counts the session is not showing light up", "if (isHold(c) || !shown(c)) continue", "if (isHold(c)) continue"],
  [L, "text is sized from the wrong cap height", "const CAP_HEIGHT_OF_EM = 0.668", "const CAP_HEIGHT_OF_EM = 0.7"],
  [L, "the teal is the wrong green", "new vec3(0.3846, 0.7563, 1.0)", "new vec3(0.3846, 0.6, 1.0)"],
  [L, "the ink is pure white", "new vec3(0.9686, 0.9333, 0.8745)", "new vec3(1, 1, 1)"],
]

function plant(source, find, replace, nth = 1) {
  let at = -1
  for (let i = 0; i < nth; i++) {
    at = source.indexOf(find, at + 1)
    if (at < 0) return null
  }
  return source.slice(0, at) + replace + source.slice(at + find.length)
}

const sources = { [S]: read(S), [T]: read(T), [L]: read(L) }
const root = path.join(here, ".breaks")
fs.rmSync(root, { recursive: true, force: true })

// The unbroken build must pass first, or "the suite fails" means nothing.
const clean = spawnSync(process.execPath, ["--test"], { cwd: here, encoding: "utf8" })
if (clean.status !== 0) {
  console.error("The suite fails on the real source. Fix that before planting breaks.")
  process.exit(2)
}

const results = []
BREAKS.forEach(([file, what, find, replace, nth], i) => {
  const broken = plant(sources[file], find, replace, nth)
  if (broken === null) {
    results.push({ file, what, outcome: "NOT PLANTED" })
    return
  }
  const dir = build(path.join(root, String(i + 1)), { [file]: broken })
  const run = spawnSync(process.execPath, ["--test"], {
    cwd: here,
    encoding: "utf8",
    env: { ...process.env, FLOORCOUNT_BUILD: dir },
  })
  results.push({ file, what, outcome: run.status === 0 ? "SURVIVED" : "caught" })
})
fs.rmSync(root, { recursive: true, force: true })

const caught = results.filter((r) => r.outcome === "caught").length
if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ planted: results.length, caught, results }, null, 2))
} else {
  for (const r of results) console.log((r.outcome + "       ").slice(0, 12) + r.file.replace("Floorcount", "").replace(".ts", "").padEnd(7) + r.what)
  console.log("\n" + caught + " of " + results.length + " planted breaks caught")
}
process.exit(caught === results.length ? 0 : 1)
