/**
 * Done criterion 2: each footprint lights on its count in time with the music, nothing lights
 * on 4 and 8, and the count display above the pad shows the current count.
 *
 * The beat clock is read from the music's own playback position (FloorcountAudioController),
 * so sampling the lit footprints against the reported count is what "in time with the music"
 * means here.
 *
 * Since the design pass the display is the clave strip plus the numeral, and holds are rests:
 * on 4 and 8 the numeral is blank and the strip's outlined cell stays at rest, so what the
 * display shows on a hold is that there is nothing to step. The scenario checks both halves of
 * that, and the strike / "and" / decay curve the brightness is driven by.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { AND, brightnessFor, decayed, REST, STRIKE } from "../Scripts/FloorcountLook"
import { audio, countUI, main, pad, restartSession } from "./FloorcountTestKit"

const SHOW_ALL = (): boolean => true
const near = (a: number, b: number): boolean => Math.abs(a - b) < 0.001

@component
export class FloorcountC2BeatScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1000)
    await restartSession()
    // The audio player reports a lagging position for about a second after play() and then
    // catches up, so let the clock settle before timing anything against it.
    await sleep(2500)

    const m = main()
    const p = pad()
    const c = countUI()
    const a = audio()

    const seen: boolean[] = [false, false, false, false, false, false, false, false, false]
    let litMismatch = 0
    let holdLit = 0
    let numberMismatch = 0
    let holdCellLit = 0
    let outOfRange = 0
    let brightestOwnCell = 0
    let samples = 0
    const beatStart = m.currentBeat
    const timeStart = getTime()
    const clavesStart = m.claveHits

    // Slow tempo is 140 BPM, so an 8-count lasts about 3.43 s. Sample a little over two.
    const deadline = getTime() + 8
    while (getTime() < deadline) {
      const count = m.currentCount
      if (count >= 1 && count <= 8) {
        samples++
        seen[count] = true
        const isHold = count === 4 || count === 8
        if (isHold) {
          if (p.litCounts.length > 0) holdLit++
          // A hold is a rest: the numeral is blank and nothing on the strip lights.
          if (c.text !== "") numberMismatch++
        } else {
          if (p.litCounts.indexOf(count) < 0) litMismatch++
          if (c.text !== String(count)) numberMismatch++
          const own = c.cellBrightness(count)
          if (own > brightestOwnCell) brightestOwnCell = own
        }
        // The strip's hold cells never leave rest, and no cell ever leaves the three
        // brightnesses' range.
        for (const h of [4, 8]) if (c.cellBrightness(h) > REST + 0.001) holdCellLit++
        for (let n = 1; n <= 8; n++) {
          const b = c.cellBrightness(n)
          if (b < REST - 0.001 || b > STRIKE + 0.001) outOfRange++
        }
      }
      await sleep(40)
    }

    const beatsElapsed = m.currentBeat - beatStart
    const secondsElapsed = getTime() - timeStart
    const measuredBpm = (beatsElapsed * 60) / secondsElapsed
    print(
      "[C2] " + samples + " samples over " + secondsElapsed.toFixed(2) + " s, " + beatsElapsed.toFixed(2) +
        " beats (" + measuredBpm.toFixed(1) + " BPM), litMismatch=" + litMismatch + " holdLit=" + holdLit +
        " numberMismatch=" + numberMismatch + " holdCellLit=" + holdCellLit + " outOfRange=" + outOfRange +
        " brightestOwnCell=" + brightestOwnCell.toFixed(2),
    )

    // Every count in the 8 was reached.
    for (let i = 1; i <= 8; i++) expect(seen[i]).toBe(true)

    // The footprint for the current count is lit on every stepping count.
    expect(litMismatch).toBe(0)
    // Nothing is lit on the hold counts.
    expect(holdLit).toBe(0)
    // The numeral reads the count on every stepping count and is blank on every hold.
    expect(numberMismatch).toBe(0)
    expect(c.isShown).toBe(true)

    // --- the clave strip (design notes, "The count display") ---
    // Eight 8 x 4 cm cells with 2 cm gaps, widened from 6 x 3 and 1.5 so a cell survives a
    // 720p video frame. Still inside the pad's 90 cm, which charter law 16 caps it at.
    expect(c.stripWidthCm).toBe(78)
    expect(c.isCellTeal(1)).toBe(true)
    for (let n = 2; n <= 8; n++) expect(c.isCellTeal(n)).toBe(false)
    // The holds' cells stay at rest and no cell ever goes outside rest..strike.
    expect(holdCellLit).toBe(0)
    expect(outOfRange).toBe(0)
    // A cell on its own count was caught well above rest. Sampling every 40 ms against a
    // 428 ms beat cannot be expected to land on the strike itself, so this is the decay.
    expect(brightestOwnCell > 0.7).toBe(true)

    // --- the curve the brightness is driven by: rise on the "and", strike, decay over a beat ---
    expect(near(decayed(0), STRIKE)).toBe(true)
    expect(near(decayed(1), REST)).toBe(true)
    expect(near(brightnessFor([2], 1.0, SHOW_ALL), STRIKE)).toBe(true)
    expect(near(brightnessFor([2], 0.5, SHOW_ALL), AND)).toBe(true)
    expect(near(brightnessFor([2], 0.25, SHOW_ALL), REST)).toBe(true)
    expect(near(brightnessFor([2], 2.0, SHOW_ALL), REST)).toBe(true)
    // Holds never light, whatever the beat is doing.
    for (const t of [2.5, 3.0, 3.5, 7.0, 7.5]) expect(near(brightnessFor([4], t, SHOW_ALL), REST)).toBe(true)
    // A count the session is not showing never lights either.
    expect(near(brightnessFor([5], 4.0, (n) => n <= 4), REST)).toBe(true)

    // In time with the music: the counts advanced at the Slow loop's own tempo, read from the
    // music's playback position. Allow 5 per cent for preview frame jitter.
    expect(a.bpm).toBe(140)
    expect(Math.abs(measuredBpm - 140) < 7).toBe(true)
    expect(a.isPlaying).toBe(true)

    // The clave marked counts 1 and 5 at least twice over two 8-counts.
    const claves = m.claveHits - clavesStart
    print("[C2] clave hits in the window: " + claves)
    expect(claves >= 3).toBe(true)
    print("[C2] passed: footprints light on their counts, holds stay dark, number follows the count")
  }
}
