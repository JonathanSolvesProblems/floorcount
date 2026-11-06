/**
 * FloorcountSteps — footwork data for the three steps (pure data, no scene access).
 *
 * Owns: the brief's footwork tables (leader's part, On1, counts from the start position),
 * translated into floor spots on the pad. Coordinates are cm in the pad's local space:
 * +X = the dancer's right, -Z = forward (away from the dancer), origin = pad centre = home
 * position of the feet. yawDeg is the toe direction (0 = toes forward; positive = turned
 * counter-clockwise seen from above, i.e. to the dancer's left).
 *
 * Must not: read or write scene state. Changing these numbers changes the footwork.
 *
 * Several counts land on the same spot (e.g. in the basic, count 3 and count 6 both put the
 * left foot back home). A spot is drawn once and lights on each of its counts.
 */

export type Foot = "L" | "R"

export interface CountMove {
  /** 1..8 */
  count: number
  /** null = hold (counts 4 and 8): nothing lights. */
  foot: Foot | null
  x: number
  z: number
  yawDeg: number
  /** Short text for the step card / logs, from the brief. */
  label: string
}

export interface TurnArcSpec {
  /** Counts on which the arc shows (the turn counts). */
  counts: number[]
  /** "right" = clockwise seen from above, "left" = counter-clockwise. */
  direction: "right" | "left"
  centerX: number
  centerZ: number
  radius: number
  /** Arc sweep in degrees, starting angle measured clockwise from forward (-Z). */
  startDeg: number
  sweepDeg: number
}

export interface StepDef {
  id: string
  name: string
  moves: CountMove[]
  turn: TurnArcSpec | null
}

/** A floor spot shared by one or more counts of the same foot. */
export interface FootSpot {
  foot: Foot
  x: number
  z: number
  yawDeg: number
  counts: number[]
}

// Correctness invariants: the 8-count shape and the hold counts are salsa On1 structure.
export const COUNTS_PER_PHRASE = 8
export const HOLD_COUNTS = [4, 8]

// Spot geometry (cm). Home = feet side by side, 20 cm centre to centre.
const HOME_L = { x: -10, z: 0 }
const HOME_R = { x: 10, z: 0 }
const STEP = 30 // forward/back step length

const hold = (count: number): CountMove => ({ count, foot: null, x: 0, z: 0, yawDeg: 0, label: "hold" })

export const STEPS: StepDef[] = [
  {
    id: "basic",
    name: "Basic step",
    moves: [
      { count: 1, foot: "L", x: HOME_L.x, z: -STEP, yawDeg: 0, label: "left foot forward" },
      { count: 2, foot: "R", x: HOME_R.x, z: HOME_R.z, yawDeg: 0, label: "replace weight on right" },
      { count: 3, foot: "L", x: HOME_L.x, z: HOME_L.z, yawDeg: 0, label: "left foot back beside right" },
      hold(4),
      { count: 5, foot: "R", x: HOME_R.x, z: STEP, yawDeg: 0, label: "right foot back" },
      { count: 6, foot: "L", x: HOME_L.x, z: HOME_L.z, yawDeg: 0, label: "replace weight on left" },
      { count: 7, foot: "R", x: HOME_R.x, z: HOME_R.z, yawDeg: 0, label: "right foot back beside left" },
      hold(8),
    ],
    turn: null,
  },
  {
    id: "rightTurn",
    name: "Right turn",
    moves: [
      { count: 1, foot: "L", x: HOME_L.x, z: -STEP, yawDeg: 0, label: "left foot forward" },
      // Right foot steps forward and across (to the left of centre) as the dancer pivots a
      // half turn right: toes now point back.
      { count: 2, foot: "R", x: 2, z: -STEP, yawDeg: -180, label: "right foot forward and across, pivot half turn right" },
      { count: 3, foot: "L", x: HOME_L.x, z: HOME_L.z, yawDeg: 0, label: "left foot completes the turn, facing front" },
      hold(4),
      { count: 5, foot: "R", x: HOME_R.x, z: STEP, yawDeg: 0, label: "right foot back" },
      { count: 6, foot: "L", x: HOME_L.x, z: HOME_L.z, yawDeg: 0, label: "replace weight on left" },
      { count: 7, foot: "R", x: HOME_R.x, z: HOME_R.z, yawDeg: 0, label: "right foot back beside left" },
      hold(8),
    ],
    turn: { counts: [2, 3], direction: "right", centerX: -4, centerZ: -26, radius: 24, startDeg: -60, sweepDeg: 250 },
  },
  {
    id: "leftTurn",
    name: "Left turn",
    moves: [
      { count: 1, foot: "L", x: HOME_L.x, z: -STEP, yawDeg: 0, label: "left foot forward" },
      { count: 2, foot: "R", x: HOME_R.x, z: HOME_R.z, yawDeg: 0, label: "replace weight on right" },
      { count: 3, foot: "L", x: HOME_L.x, z: HOME_L.z, yawDeg: 0, label: "left foot back beside right" },
      hold(4),
      { count: 5, foot: "R", x: HOME_R.x, z: STEP, yawDeg: 0, label: "right foot back" },
      // Mirror of the right turn: left foot steps across (to the right of centre) as the
      // dancer pivots a half turn left: toes now point back.
      { count: 6, foot: "L", x: -2, z: STEP, yawDeg: 180, label: "left foot across, pivot half turn left" },
      { count: 7, foot: "R", x: HOME_R.x, z: HOME_R.z, yawDeg: 0, label: "right foot completes the turn" },
      hold(8),
    ],
    turn: { counts: [6, 7], direction: "left", centerX: 4, centerZ: 26, radius: 24, startDeg: 260, sweepDeg: 250 },
  },
]

/** Group a step's moves into unique floor spots (same foot, same place, same yaw). */
export function spotsFor(step: StepDef): FootSpot[] {
  const spots: FootSpot[] = []
  for (const m of step.moves) {
    if (m.foot === null) continue
    const found = spots.find(
      (s) => s.foot === m.foot && Math.abs(s.x - m.x) < 0.5 && Math.abs(s.z - m.z) < 0.5 && Math.abs(s.yawDeg - m.yawDeg) < 1,
    )
    if (found) found.counts.push(m.count)
    else spots.push({ foot: m.foot, x: m.x, z: m.z, yawDeg: m.yawDeg, counts: [m.count] })
  }
  return spots
}

export function isHold(count: number): boolean {
  return HOLD_COUNTS.indexOf(count) >= 0
}
