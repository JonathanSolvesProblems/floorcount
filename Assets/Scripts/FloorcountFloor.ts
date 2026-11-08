/**
 * FloorcountFloor: the rule that settles the pad onto the real floor.
 *
 * The pad starts at a fixed 150 cm below the eye. The glasses see the room, so the first time the
 * wearer looks down at the pad, FloorcountMain casts a ray through the pad's centre into the
 * world-query depth and collects where it meets an upward-facing surface. This file decides when
 * those hits are good enough to trust and how far to move the layout. It touches no scene and no
 * Lens global, so the unit tests run it in plain Node.
 */

/** Hits needed before the pad moves. One noisy depth reading must not move it. */
export const FLOOR_SAMPLES = 3

/** The last hits must agree to within this many cm (highest minus lowest). */
export const FLOOR_AGREE_CM = 4

/**
 * The most the pad may move, up or down, in cm. Standing eye heights sit within about 30 cm of
 * the 150 cm the layout assumes; a sofa seat or a coffee table is 40 cm or more above the floor,
 * so a hit on one is refused rather than lifting the pad onto the furniture.
 */
export const FLOOR_MAX_SHIFT_CM = 30

/** A surface counts as floor when its normal points at least this much straight up. */
export const FLOOR_MIN_NORMAL_UP = 0.9

/** Whether a hit's surface faces up enough to be floor, from the y of its unit normal. */
export function isFloorHit(normalY: number): boolean {
  return normalY >= FLOOR_MIN_NORMAL_UP
}

/**
 * How far to move the pad up (positive) or down (negative), in cm, so it sits on the floor the
 * hits found; or null while there are too few hits, while the last ones disagree, or when they
 * found something too far from where the floor should be.
 *
 * @param hitYs world heights of the floor hits so far, oldest first
 * @param padY the pad's current world height
 */
export function floorShift(hitYs: number[], padY: number): number | null {
  if (hitYs.length < FLOOR_SAMPLES) return null
  const last = hitYs.slice(-FLOOR_SAMPLES)
  let lo = last[0]
  let hi = last[0]
  let sum = 0
  for (const y of last) {
    if (y < lo) lo = y
    if (y > hi) hi = y
    sum += y
  }
  if (hi - lo > FLOOR_AGREE_CM) return null
  const mean = sum / last.length
  const shift = mean - padY
  if (Math.abs(shift) > FLOOR_MAX_SHIFT_CM) return null
  return shift
}
