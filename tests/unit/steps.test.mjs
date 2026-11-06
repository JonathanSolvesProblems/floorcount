// The footwork data: three On1 steps, leader's part, as floor spots on the pad.
import test from "node:test"
import assert from "node:assert/strict"
import { Steps } from "./load.mjs"

const { STEPS, spotsFor, isHold, HOLD_COUNTS, COUNTS_PER_PHRASE } = Steps
const byId = (id) => STEPS.find((s) => s.id === id)
const move = (step, count) => step.moves.find((m) => m.count === count)
const STEPPING = [1, 2, 3, 5, 6, 7]

test("there are three steps, in the order they are practised", () => {
  assert.deepEqual(STEPS.map((s) => s.name), ["Basic step", "Right turn", "Left turn"])
})

test("a phrase is eight counts and the holds are 4 and 8", () => {
  assert.equal(COUNTS_PER_PHRASE, 8)
  assert.deepEqual(HOLD_COUNTS, [4, 8])
  for (let c = 1; c <= 8; c++) assert.equal(isHold(c), c === 4 || c === 8, "count " + c)
})

for (const step of STEPS) {
  test(step.name + ": eight moves, counts 1 to 8 in order", () => {
    assert.deepEqual(step.moves.map((m) => m.count), [1, 2, 3, 4, 5, 6, 7, 8])
  })

  test(step.name + ": no foot moves on 4 or 8, and one does on every other count", () => {
    for (const m of step.moves) {
      if (m.count === 4 || m.count === 8) assert.equal(m.foot, null, "count " + m.count)
      else assert.ok(m.foot === "L" || m.foot === "R", "count " + m.count)
    }
  })

  test(step.name + ": the feet alternate, left right left, then right left right", () => {
    assert.deepEqual(STEPPING.map((c) => move(step, c).foot), ["L", "R", "L", "R", "L", "R"])
  })

  test(step.name + ": count 1 is the left foot forward (On1, leader)", () => {
    const m = move(step, 1)
    assert.equal(m.foot, "L")
    assert.equal(m.z, -30)
    assert.equal(m.yawDeg, 0)
  })

  test(step.name + ": every print stays on the 90 cm pad", () => {
    for (const m of step.moves) {
      if (!m.foot) continue
      assert.ok(Math.abs(m.x) + 5 <= 45, "x of count " + m.count)
      assert.ok(Math.abs(m.z) + 13.5 <= 45, "z of count " + m.count)
    }
  })

  test(step.name + ": every stepping count has exactly one floor spot, and no hold has one", () => {
    const counts = spotsFor(step).flatMap((s) => s.counts).sort((a, b) => a - b)
    assert.deepEqual(counts, STEPPING)
  })

  test(step.name + ": every move says what it is", () => {
    for (const m of step.moves) assert.ok(m.label.length > 0)
    assert.equal(move(step, 4).label, "hold")
    assert.equal(move(step, 8).label, "hold")
  })
}

test("basic step: forward on 1, back on 5, home in between, feet 20 cm apart", () => {
  const b = byId("basic")
  assert.deepEqual([move(b, 1).x, move(b, 1).z], [-10, -30])
  assert.deepEqual([move(b, 2).x, move(b, 2).z], [10, 0])
  assert.deepEqual([move(b, 3).x, move(b, 3).z], [-10, 0])
  assert.deepEqual([move(b, 5).x, move(b, 5).z], [10, 30])
  assert.deepEqual([move(b, 6).x, move(b, 6).z], [-10, 0])
  assert.deepEqual([move(b, 7).x, move(b, 7).z], [10, 0])
  assert.equal(move(b, 2).x - move(b, 3).x, 20)
  assert.equal(b.turn, null)
})

test("basic step: six counts land on four spots, the home spots shared", () => {
  const spots = spotsFor(byId("basic"))
  assert.equal(spots.length, 4)
  const key = (s) => s.foot + ":" + s.counts.join(",")
  assert.deepEqual(spots.map(key).sort(), ["L:1", "L:3,6", "R:2,7", "R:5"])
})

test("right turn: the right foot crosses and faces back on 2, and the arc shows on 2 and 3", () => {
  const r = byId("rightTurn")
  const two = move(r, 2)
  assert.equal(two.foot, "R")
  assert.equal(two.z, -30)
  assert.ok(Math.abs(two.x) < 5, "the crossing foot lands near the centre line")
  assert.equal(Math.abs(two.yawDeg), 180)
  assert.equal(r.turn.direction, "right")
  assert.deepEqual(r.turn.counts, [2, 3])
  // The second half of a right turn is the basic's.
  const b = byId("basic")
  for (const c of [5, 6, 7]) assert.deepEqual([move(r, c).x, move(r, c).z], [move(b, c).x, move(b, c).z])
})

test("right turn: the crossing print is its own spot, facing back", () => {
  const spot = spotsFor(byId("rightTurn")).find((s) => s.counts.includes(2))
  assert.deepEqual(spot.counts, [2])
  assert.equal(Math.abs(spot.yawDeg), 180)
})

test("left turn: the mirror of the right turn, on 6 and 7", () => {
  const l = byId("leftTurn")
  const r = byId("rightTurn")
  const six = move(l, 6)
  assert.equal(six.foot, "L")
  assert.equal(six.z, 30)
  assert.equal(Math.abs(six.yawDeg), 180)
  assert.equal(six.x, -move(r, 2).x)
  assert.equal(six.z, -move(r, 2).z)
  assert.equal(l.turn.direction, "left")
  assert.deepEqual(l.turn.counts, [6, 7])
  // The first half of a left turn is the basic's.
  const b = byId("basic")
  for (const c of [1, 2, 3]) assert.deepEqual([move(l, c).x, move(l, c).z], [move(b, c).x, move(b, c).z])
})

// The arc's centre line, sampled along its sweep the way FloorcountLook draws it: angles are
// clockwise from forward (-Z), and a left turn sweeps the other way.
function arcPoints(t) {
  const dir = t.direction === "right" ? 1 : -1
  const pts = []
  for (let i = 0; i <= 100; i++) {
    const a = ((t.startDeg + dir * t.sweepDeg * (i / 100)) * Math.PI) / 180
    pts.push([t.centerX + Math.sin(a) * t.radius, t.centerZ - Math.cos(a) * t.radius])
  }
  return pts
}

test("a turn arc stays inside the pad's border along its whole sweep", () => {
  // The border's inner edge is 43.2 cm from the centre (90 cm pad, 1.8 cm stroke).
  for (const id of ["rightTurn", "leftTurn"]) {
    const t = byId(id).turn
    assert.ok(t.sweepDeg > 180 && t.sweepDeg < 360, id + " sweep")
    for (const [x, z] of arcPoints(t)) {
      assert.ok(Math.abs(x) <= 43.2, id + " x " + x.toFixed(1))
      assert.ok(Math.abs(z) <= 43.2, id + " z " + z.toFixed(1))
    }
  }
})

test("a turn arc is open where the pivoting print's toes point, so the print passes through the gap", () => {
  // Right turn: the forward prints' toes are at z = -43.5. Left turn: the mirror, at +43.5.
  const cases = [["rightTurn", -1], ["leftTurn", 1]]
  for (const [id, sign] of cases) {
    const t = byId(id).turn
    const beyond = arcPoints(t).filter(([, z]) => sign * z > sign * t.centerZ + t.radius * 0.7)
    assert.equal(beyond.length, 0, id + ": no part of the arc crosses in front of the toes")
  }
})

test("a turn arc circles the print that pivots", () => {
  const cases = [["rightTurn", 2], ["leftTurn", 6]]
  for (const [id, count] of cases) {
    const step = byId(id)
    const m = move(step, count)
    const d = Math.hypot(m.x - step.turn.centerX, m.z - step.turn.centerZ)
    assert.ok(d < step.turn.radius, id + ": the pivot print is inside the arc")
  }
})

test("the left turn's arc is the right turn's, turned half a revolution and reversed", () => {
  const r = byId("rightTurn").turn
  const l = byId("leftTurn").turn
  assert.equal(l.centerX, -r.centerX)
  assert.equal(l.centerZ, -r.centerZ)
  assert.equal(l.radius, r.radius)
  assert.equal(l.sweepDeg, r.sweepDeg)
})
