/**
 * When the count display goes away and when it comes back.
 *
 * The brief's rule is that the count shows the first time a step plays and after any Again, and
 * hides after a clean 8-count, so a dancer who has it stops being counted at. C2 asserts what
 * the display reads while it is up; nothing asserted that it ever goes down.
 *
 * Both halves of the display are checked on the objects themselves, not only on the component's
 * own flag: the numeral is a Text on `CountText` and the eight cells hang off `ClaveStrip`, and
 * hiding one without the other would leave half a display in the air.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { countUI, interactor, main, objectNamed, pinch, restartSession } from "./FloorcountTestKit"

@component
export class FloorcountC12CountDisplayScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1000)
    await restartSession()
    await sleep(700)

    const io = interactor()
    const m = main()
    const cu = countUI()
    // Held from here on: these are the two objects setShown switches, and they have to be
    // looked up while they are still enabled.
    const numeral = objectNamed("CountText")
    const strip = objectNamed("ClaveStrip")

    // The first time a step plays, the count is there.
    print("[C12] at the start: countVisible=" + m.state.countVisible + " numeral=" + numeral.enabled + " strip=" + strip.enabled)
    expect(m.state.countVisible).toBe(true)
    expect(cu.isShown).toBe(true)
    expect(numeral.enabled).toBe(true)
    expect(strip.enabled).toBe(true)

    // A Got it is a clean 8-count: the numeral and the strip both go.
    await pinch("GotItButton", io)
    await sleep(400)
    print("[C12] after a Got it: countVisible=" + m.state.countVisible + " numeral=" + numeral.enabled + " strip=" + strip.enabled)
    expect(m.state.countVisible).toBe(false)
    expect(cu.isShown).toBe(false)
    expect(numeral.enabled).toBe(false)
    expect(strip.enabled).toBe(false)

    // An Again brings both back.
    await pinch("AgainButton", io)
    await sleep(400)
    print("[C12] after an Again: countVisible=" + m.state.countVisible + " numeral=" + numeral.enabled + " strip=" + strip.enabled)
    expect(m.state.countVisible).toBe(true)
    expect(cu.isShown).toBe(true)
    expect(numeral.enabled).toBe(true)
    expect(strip.enabled).toBe(true)
    // And it is drawing again, not merely enabled.
    expect(await this.numeralReadsACount()).toBe(true)
    print("[C12] passed: a Got it hides the numeral and the strip, an Again puts them back")
  }

  /** Wait for the numeral to carry a stepping count's digit again. */
  private async numeralReadsACount(): Promise<boolean> {
    const cu = countUI()
    const deadline = getTime() + 5
    while (getTime() < deadline) {
      const t = cu.text
      if (t.length === 1 && t !== "4" && t !== "8") return true
      await sleep(25)
    }
    return false
  }
}
