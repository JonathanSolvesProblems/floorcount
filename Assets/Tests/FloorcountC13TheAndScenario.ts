/**
 * The "and": the half-beat rise before a count, measured on the running Lens.
 *
 * C2 asserts the brightness curve as a function, by calling brightnessFor with beat positions it
 * chooses. This asserts the same shape on what is actually drawn: the print for count 2 and
 * cell 2 of the clave strip, read against the beat clock the music drives, from count 1 through
 * the rise to count 2, its strike, and the beat after it. The hold cells are watched throughout,
 * because the rise is the one thing that could light a count nobody steps on.
 *
 * Every sample reads the beat and the brightnesses with no await between them, so they are from
 * the same frame: Main sets the beat and then pushes it into the pad and the display inside one
 * synchronous tick, and nothing can run in the middle of that.
 *
 * Each sample is then checked against the brightness the charter asks for at that exact beat
 * position: rest until half a beat before the count, the "and" at 60 per cent through that half
 * beat, and the strike decaying from 100 per cent over the beat that follows. Checking it
 * pointwise rather than band by band is what makes the result independent of how fast the
 * sampler runs, which in this preview is about every 140 ms against a 429 ms beat.
 *
 * The strike itself is read from a frozen frame rather than from a sample, because at that
 * sampling rate the first reading after the strike is already well down the decay. The beat is
 * stopped within a twentieth of a beat of the strike and the struck value read there, then
 * checked against what the curve says for exactly that position. Nothing can read a clean 1.0:
 * the alpha is set once per frame and 1.0 lasts an instant.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { AND, brightnessFor, decayed, REST, STRIKE } from "../Scripts/FloorcountLook"
import { COUNTS_PER_PHRASE } from "../Scripts/FloorcountSteps"
import { countUI, freezeNearStrikeOf, main, pad, restartSession } from "./FloorcountTestKit"

/** Count 2 strikes at this phrase position (count 1 is at 0). */
const STRIKE_AT = 1
/** The rise starts this many beats before the count (manifest motion_beats.and_rise). */
const AND_RISE = 0.5

interface Sample {
  beat: number
  p: number
  foot: number
  cell: number
}

const SHOW_ALL = (): boolean => true

/**
 * What count 2's print and cell should be drawn at, for a phrase position in count 1 or count 2.
 *
 * Nothing else on the pad shares count 2's print except count 7, whose own rise and decay are
 * four beats away, so over this stretch the two read the same curve.
 */
function expected(p: number): number {
  if (p < STRIKE_AT - AND_RISE) return REST
  if (p < STRIKE_AT) return AND
  return decayed(p - STRIKE_AT)
}

/** Median gap between consecutive frames, in beats: one frame of the running preview. */
function frameBeatsOf(samples: Sample[]): number {
  const gaps: number[] = []
  for (let i = 1; i < samples.length; i++) {
    const d = samples[i].beat - samples[i - 1].beat
    if (d > 0.0005) gaps.push(d)
  }
  if (gaps.length === 0) return 0
  gaps.sort((a, b) => a - b)
  return gaps[Math.floor(gaps.length / 2)]
}

@component
export class FloorcountC13TheAndScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1000)
    await restartSession()
    // The audio player reports a lagging position for about a second after play().
    await sleep(2500)

    const m = main()
    const p = pad()
    const cu = countUI()

    const samples: Sample[] = []
    let worstHoldCell = 0
    const deadline = getTime() + 12
    while (getTime() < deadline) {
      // One frame's worth of state, read together.
      const beat = m.currentBeat
      const foot = p.footBrightness(2)
      const cell = cu.cellBrightness(2)
      const hold4 = cu.cellBrightness(4)
      const hold8 = cu.cellBrightness(8)
      const pos = ((beat % COUNTS_PER_PHRASE) + COUNTS_PER_PHRASE) % COUNTS_PER_PHRASE
      samples.push({ beat, p: pos, foot, cell })
      if (hold4 > worstHoldCell) worstHoldCell = hold4
      if (hold8 > worstHoldCell) worstHoldCell = hold8
      await sleep(8)
    }

    const frameBeats = frameBeatsOf(samples)

    // --- every sample over counts 1 and 2 against the curve the charter asks for ---
    const around = samples.filter((s) => s.p < STRIKE_AT + 1)
    let off = 0
    let atRest = 0
    let atAnd = 0
    let decaying = 0
    for (const s of around) {
      const want = expected(s.p)
      if (Math.abs(s.foot - want) > 0.02 || Math.abs(s.cell - want) > 0.02) off++
      if (s.p < STRIKE_AT - AND_RISE) atRest++
      else if (s.p < STRIKE_AT) atAnd++
      else decaying++
    }

    // --- how far the brightness had fallen by the back half of count 2's own beat ---
    let brightestAfter = 0
    for (const s of samples) {
      if (s.p >= STRIKE_AT + 0.4 && s.p <= STRIKE_AT + 0.9) {
        if (s.foot > brightestAfter) brightestAfter = s.foot
        if (s.cell > brightestAfter) brightestAfter = s.cell
      }
    }

    print(
      "[C13] " + samples.length + " samples, one every " + frameBeats.toFixed(3) + " beats; over counts 1 and 2: " +
        atRest + " at rest, " + atAnd + " on the 'and', " + decaying + " decaying, off the curve " + off +
        "; brightest in the back half of count 2's beat " + brightestAfter.toFixed(3) +
        "; worst hold cell " + worstHoldCell.toFixed(3),
    )

    // Enough of each part of the curve to mean anything.
    expect(atRest >= 2).toBe(true)
    expect(atAnd >= 2).toBe(true)
    expect(decaying >= 4).toBe(true)
    expect(frameBeats > 0).toBe(true)

    // Rest, then 60 per cent through the half beat before the count, then the strike decaying:
    // what is drawn is the curve, at every beat position sampled.
    expect(off).toBe(0)

    // Less after the strike, still above rest: a decay, not a step down.
    expect(brightestAfter > REST).toBe(true)
    expect(brightestAfter < decayed(0.4) + 0.01).toBe(true)

    // The rise never reaches a count nobody steps on (charter law 5).
    expect(worstHoldCell <= REST + 0.001).toBe(true)

    // --- the strike, read off a frozen frame ---
    const frac = await freezeNearStrikeOf(2, 0.08)
    const struckFoot = p.footBrightness(2)
    const struckCell = cu.cellBrightness(2)
    const onTheCurve = decayed(frac)
    print(
      "[C13] frozen " + frac.toFixed(3) + " beats past count 2's strike: print " + struckFoot.toFixed(3) +
        ", cell " + struckCell.toFixed(3) + ", the curve says " + onTheCurve.toFixed(3) +
        " (the authored strike is " + STRIKE.toFixed(1) + ")",
    )
    expect(frac < 0.08).toBe(true)
    expect(m.currentCount).toBe(2)
    // The authored strike is 100 per cent, and what is drawn a fraction of a beat later is
    // exactly what the curve puts there, nowhere near the "and" it rose from.
    expect(brightnessFor([2], STRIKE_AT, SHOW_ALL)).toBe(STRIKE)
    expect(Math.abs(struckFoot - onTheCurve) < 0.01).toBe(true)
    expect(Math.abs(struckCell - onTheCurve) < 0.01).toBe(true)
    expect(struckFoot > AND + 0.1).toBe(true)
    expect(struckCell > AND + 0.1).toBe(true)
    expect(struckFoot > brightestAfter).toBe(true)
    print("[C13] passed: count 2 rises to the 'and', strikes at full and decays, and the hold cells stay at rest")
  }
}
