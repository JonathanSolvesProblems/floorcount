// The rule that settles the pad onto the real floor (FloorcountFloor.ts).
import test from "node:test"
import assert from "node:assert/strict"
import { Floor } from "./load.mjs"

const { floorShift, isFloorHit, FLOOR_SAMPLES, FLOOR_AGREE_CM, FLOOR_MAX_SHIFT_CM } = Floor

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} is not ${b}`)

test("the pad does not move on fewer hits than it needs", () => {
  assert.equal(FLOOR_SAMPLES, 3)
  assert.equal(floorShift([], -145), null)
  assert.equal(floorShift([-150], -145), null)
  assert.equal(floorShift([-150, -150], -145), null)
})

test("three agreeing hits move the pad to their mean", () => {
  close(floorShift([-151, -150, -149], -145), -5)
  close(floorShift([-130, -131, -129], -145), 15)
})

test("hits that disagree by more than the limit move nothing", () => {
  assert.equal(FLOOR_AGREE_CM, 4)
  assert.equal(floorShift([-150, -154.5, -150], -145), null)
  close(floorShift([-150, -154, -152], -145), -7)
})

test("only the latest hits count, so an early bad reading does not block the floor", () => {
  close(floorShift([-90, -200, -150, -150, -150], -145), -5)
})

test("a surface too far from the expected floor is refused, both ways", () => {
  assert.equal(FLOOR_MAX_SHIFT_CM, 30)
  close(floorShift([-115, -115, -115], -145), 30)
  close(floorShift([-175, -175, -175], -145), -30)
  // a sofa seat about 45 cm above the floor
  assert.equal(floorShift([-100, -100, -100], -145), null)
  assert.equal(floorShift([-180, -180, -180], -145), null)
})

test("only upward-facing surfaces count as floor", () => {
  assert.equal(isFloorHit(1), true)
  assert.equal(isFloorHit(0.9), true)
  assert.equal(isFloorHit(0.6), false)
  assert.equal(isFloorHit(0), false)
  assert.equal(isFloorHit(-1), false)
})
