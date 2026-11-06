// The look's numbers: the one ink and one accent, the three brightnesses, and the curve every
// print and cell reads off the beat (rise on the "and", strike on the count, decay over a beat).
import test from "node:test"
import assert from "node:assert/strict"
import { Look } from "./load.mjs"

const { REST, AND, STRIKE, BORDER, GRAIN, PANEL, ARROW, IVORY, TINT_TEAL, decayed, brightnessFor, sizeForCapCm } = Look
const all = () => true
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps
const hex = (v) => [v.x, v.y, v.z].map((c) => Math.round(c * 255))

test("the brightnesses are the charter's: 35, 60 and 100 per cent", () => {
  assert.deepEqual([REST, AND, STRIKE], [0.35, 0.6, 1])
  assert.deepEqual([BORDER, GRAIN, PANEL, ARROW], [0.5, 0.12, 0.3, 0.6])
})

test("the ink is ivory #F7EEDF", () => {
  assert.deepEqual(hex(IVORY), [0xf7, 0xee, 0xdf])
})

test("the teal tint over an ivory texture is the charter's teal, as near as ivory allows", () => {
  // The charter's teal is #5FB4E8. The textures are ivory and a tint can only darken a channel,
  // so red and green land exactly and blue stops at ivory's own 0xDF: the Lens draws #5FB4DF.
  const out = [IVORY.x * TINT_TEAL.x, IVORY.y * TINT_TEAL.y, IVORY.z * TINT_TEAL.z].map((c) => Math.round(c * 255))
  assert.deepEqual(out, [0x5f, 0xb4, 0xdf])
  assert.ok(TINT_TEAL.x <= 1 && TINT_TEAL.y <= 1 && TINT_TEAL.z <= 1, "a tint never brightens a channel")
})

test("a strike has no attack and rings out to rest over exactly one beat", () => {
  assert.equal(decayed(0), STRIKE)
  assert.equal(decayed(1), REST)
  assert.equal(decayed(2.5), REST)
  assert.ok(near(decayed(0.5), REST + (STRIKE - REST) * Math.exp(-2)))
  let prev = decayed(0)
  for (let t = 0.05; t < 1; t += 0.05) {
    const d = decayed(t)
    assert.ok(d < prev, "still falling at " + t.toFixed(2))
    assert.ok(d > REST)
    prev = d
  }
})

test("a print is at full brightness exactly on its count", () => {
  for (const c of [1, 2, 3, 5, 6, 7]) assert.equal(brightnessFor([c], c - 1, all), STRIKE, "count " + c)
})

test("a print rises one step on the 'and', half a beat before its count, and not earlier", () => {
  assert.equal(brightnessFor([3], 1.5, all), AND)
  assert.equal(brightnessFor([3], 1.75, all), AND)
  assert.equal(brightnessFor([3], 1.4, all), REST)
  assert.equal(brightnessFor([3], 0.5, all), REST)
})

test("count 1's rise comes at the end of the phrase before it", () => {
  assert.equal(brightnessFor([1], 7.5, all), AND)
  assert.equal(brightnessFor([1], 7.9, all), AND)
  assert.equal(brightnessFor([1], 7.4, all), REST)
})

test("after its count a print follows the decay curve, then rests", () => {
  assert.ok(near(brightnessFor([2], 1.25, all), decayed(0.25)))
  assert.ok(near(brightnessFor([2], 1.9, all), decayed(0.9)))
  assert.equal(brightnessFor([2], 2, all), REST)
  assert.equal(brightnessFor([2], 4.2, all), REST)
})

test("holds are rests: nothing on 4 or 8 ever lights, at any moment of the phrase", () => {
  for (let p = 0; p < 8; p += 0.05) {
    assert.equal(brightnessFor([4], p, all), REST, "count 4 at " + p.toFixed(2))
    assert.equal(brightnessFor([8], p, all), REST, "count 8 at " + p.toFixed(2))
  }
})

test("a count the session is not showing never lights or rises", () => {
  const firstHalf = (c) => c <= 4
  for (let p = 0; p < 8; p += 0.05) assert.equal(brightnessFor([5], p, firstHalf), REST, "at " + p.toFixed(2))
  assert.equal(brightnessFor([2], 1, firstHalf), STRIKE)
})

test("a spot shared by two counts lights on each of them", () => {
  const home = [3, 6]
  assert.equal(brightnessFor(home, 2, all), STRIKE)
  assert.equal(brightnessFor(home, 5, all), STRIKE)
  assert.equal(brightnessFor(home, 4.6, all), AND)
  assert.ok(near(brightnessFor(home, 2.9, all), decayed(0.9)))
  assert.equal(brightnessFor(home, 3.5, all), REST)
})

test("when one of a shared spot's counts is not showing, only the other lights", () => {
  const firstHalf = (c) => c <= 4
  assert.equal(brightnessFor([3, 6], 2, firstHalf), STRIKE)
  assert.equal(brightnessFor([3, 6], 5, firstHalf), REST)
})

test("brightness never leaves the 35 to 100 per cent range", () => {
  for (const counts of [[1], [2, 7], [3, 6], [5], [4], [8]]) {
    for (let p = 0; p < 8; p += 0.01) {
      const b = brightnessFor(counts, p, all)
      assert.ok(b >= REST && b <= STRIKE, counts + " at " + p.toFixed(2) + ": " + b)
    }
  }
})

test("text size scales with the cap height asked for", () => {
  assert.ok(near(sizeForCapCm(14), (14 / 0.668) * 43.886, 1e-6))
  assert.ok(near(sizeForCapCm(6) / sizeForCapCm(3), 2, 1e-9))
})
