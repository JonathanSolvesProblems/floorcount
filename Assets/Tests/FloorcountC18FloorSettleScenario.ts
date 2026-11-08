/**
 * The pad settles onto the real floor. On glasses, FloorcountMain reads the floor under the pad
 * through the world query and moves the whole layout to stand on it. The preview has no floor to
 * read, so this scenario feeds the readings by hand and checks the rule the Lens applies to
 * them: a wall is not a floor; two readings move nothing; three in a row that agree move the pad
 * and the card together by their mean, once; a surface too far from where the floor should be
 * (a sofa seat) is refused; readings that disagree wait for ones that agree; and the layout can
 * be put back.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { FLOOR_SAMPLES } from "../Scripts/FloorcountFloor"
import { cardObject, main, padObject, restartSession } from "./FloorcountTestKit"

const near = (a: number, b: number, tol: number = 0.5): boolean => Math.abs(a - b) < tol

@component
export class FloorcountC18FloorSettleScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    // restartSession leaves the automatic query off, so the preview's own depth, if it answers,
    // cannot add readings to the ones fed here.
    await restartSession()
    const m = main()
    expect(m.floorSettled).toBe(false)
    expect(FLOOR_SAMPLES).toBe(3)

    const padY0 = padObject().getTransform().getWorldPosition().y
    const cardY0 = cardObject().getTransform().getWorldPosition().y
    const cardAbovePad = cardY0 - padY0
    // The real floor, 6 cm lower than where the pad was placed.
    const floorY = padY0 - 6
    print("[C18] pad placed at y " + padY0.toFixed(1) + ", card " + cardAbovePad.toFixed(1) + " cm above it, floor fed at " + floorY.toFixed(1))

    // --- a wall is not a floor: readings whose surface does not face up are not even kept ---
    m.feedFloorHit(floorY, 0)
    m.feedFloorHit(floorY, 0.3)
    m.feedFloorHit(floorY, 0.6)
    expect(m.floorHitYs.length).toBe(0)
    expect(m.floorSettled).toBe(false)

    // --- two readings move nothing; the third, agreeing, settles the whole layout ---
    m.feedFloorHit(floorY + 1, 1)
    m.feedFloorHit(floorY - 1, 1)
    expect(m.floorSettled).toBe(false)
    expect(near(padObject().getTransform().getWorldPosition().y, padY0)).toBe(true)
    m.feedFloorHit(floorY, 1)
    const padY1 = padObject().getTransform().getWorldPosition().y
    const cardY1 = cardObject().getTransform().getWorldPosition().y
    print("[C18] after three readings: settled " + m.floorSettled + ", moved " + m.floorShiftCm.toFixed(1) + " cm, pad at y " + padY1.toFixed(1))
    expect(m.floorSettled).toBe(true)
    expect(near(m.floorShiftCm, -6)).toBe(true)
    expect(near(padY1, floorY)).toBe(true)
    // The card came down with the pad: it is still the same height above it.
    expect(near(cardY1 - padY1, cardAbovePad)).toBe(true)

    // --- settled is settled: a later stray reading moves nothing ---
    m.feedFloorHit(floorY + 25, 1)
    m.feedFloorHit(floorY + 25, 1)
    m.feedFloorHit(floorY + 25, 1)
    expect(near(padObject().getTransform().getWorldPosition().y, floorY)).toBe(true)

    // --- put back ---
    m.resetFloor()
    expect(m.floorSettled).toBe(false)
    expect(m.floorHitYs.length).toBe(0)
    expect(near(padObject().getTransform().getWorldPosition().y, padY0)).toBe(true)
    expect(near(cardObject().getTransform().getWorldPosition().y, cardY0)).toBe(true)

    // --- a sofa seat 45 cm above the floor is refused, however steadily it reads ---
    for (let i = 0; i < FLOOR_SAMPLES + 1; i++) m.feedFloorHit(padY0 + 45, 1)
    expect(m.floorSettled).toBe(false)
    expect(near(padObject().getTransform().getWorldPosition().y, padY0)).toBe(true)
    m.resetFloor()

    // --- readings that disagree wait for ones that agree ---
    m.feedFloorHit(padY0 - 10, 1)
    m.feedFloorHit(padY0 - 2, 1)
    m.feedFloorHit(padY0 - 10, 1)
    expect(m.floorSettled).toBe(false)
    m.feedFloorHit(padY0 - 10, 1)
    m.feedFloorHit(padY0 - 10, 1)
    expect(m.floorSettled).toBe(true)
    expect(near(m.floorShiftCm, -10)).toBe(true)
    expect(near(padObject().getTransform().getWorldPosition().y, padY0 - 10)).toBe(true)
    m.resetFloor()
    expect(near(padObject().getTransform().getWorldPosition().y, padY0)).toBe(true)

    print("[C18] passed: wall ignored, three agreeing readings settle pad and card together, sofa refused, disagreement waits, reset restores")
  }
}
