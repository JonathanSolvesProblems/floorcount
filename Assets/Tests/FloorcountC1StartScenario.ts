/**
 * Done criterion 1: when the Lens starts, the footprint pad appears on the floor about 70 cm
 * in front of me with the basic step's eight footprints at real size, and the practice music
 * starts at Slow tempo.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils"
import { audio, cameraObject, main, pad, padObject, restartSession } from "./FloorcountTestKit"

const FOOT_LENGTH_CM = 27
const STEP_LENGTH_CM = 30

@component
export class FloorcountC1StartScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    await restartSession()
    await sleep(600)

    const m = main()
    const p = pad()
    const a = audio()

    // --- the pad is on the floor about 70 cm in front of the user ---
    const camPos = cameraObject().getTransform().getWorldPosition()
    const padPos = padObject().getTransform().getWorldPosition()
    const forwardCm = Math.sqrt(
      (padPos.x - camPos.x) * (padPos.x - camPos.x) + (padPos.z - camPos.z) * (padPos.z - camPos.z),
    )
    print("[C1] pad is " + forwardCm.toFixed(1) + " cm ahead, " + (camPos.y - padPos.y).toFixed(1) + " cm below the eyes")
    expect(Math.abs(forwardCm - 70) < 5).toBe(true)
    expect(camPos.y - padPos.y > 100).toBe(true)
    expect(p.isFloorVisible).toBe(true)

    // --- the basic step, with every stepping count on the floor and no hold counts ---
    expect(m.state.step.id).toBe("basic")
    expect(m.state.stepIndex).toBe(0)
    for (const c of [1, 2, 3, 5, 6, 7]) {
      expect(p.isShownOnFloor(c)).toBe(true)
    }
    // Counts 4 and 8 are holds: the footwork table gives them no floor spot at all.
    const allCounts: number[] = []
    for (const spot of p.footprintCounts()) for (const c of spot) allCounts.push(c)
    expect(allCounts.indexOf(4)).toBe(-1)
    expect(allCounts.indexOf(8)).toBe(-1)
    expect(allCounts.length).toBe(6)

    // --- real foot size: the drawn sole is 27 cm long ---
    // The sole print is a texture: a 27 cm print centred in a 12 x 29 cm box with 1 cm of
    // transparent margin at each end, so the quad on the floor measures 29 cm and the sole
    // drawn inside it measures 27. The quad is drawn at scale 1, so cm of mesh are cm of floor.
    const firstFoot = findSceneObjectByName("Foot")
    expect(firstFoot === null || firstFoot === undefined).toBe(false)
    const rmv = firstFoot.getComponent("Component.RenderMeshVisual") as RenderMeshVisual
    const quadCm = rmv.mesh.aabbMax.z - rmv.mesh.aabbMin.z
    const scale = firstFoot.getTransform().getWorldScale()
    print(
      "[C1] sole print quad " + quadCm.toFixed(1) + " cm at scale " + scale.z.toFixed(2) +
        ", print inside it " + p.printLengthCm + " cm",
    )
    expect(Math.abs(quadCm - p.footQuadLengthCm) < 0.5).toBe(true)
    expect(Math.abs(scale.z - 1) < 0.01).toBe(true)
    expect(Math.abs(p.printLengthCm - FOOT_LENGTH_CM) < 0.5).toBe(true)
    expect(Math.abs(quadCm * scale.z - p.printLengthCm - 2) < 0.5).toBe(true)

    // --- one ink and one accent: teal is on the print that lands on 1, and nowhere else ---
    expect(p.isFootTeal(1)).toBe(true)
    for (const c of [2, 3, 5, 6, 7]) expect(p.isFootTeal(c)).toBe(false)
    print("[C1] teal is on count 1's print only")

    // --- the pad is a bordered square with a parquet grain and nothing else on it ---
    const border = findSceneObjectByName("PadBorder")
    const grain = findSceneObjectByName("PadGrain")
    expect(border !== null && border.enabled).toBe(true)
    expect(grain !== null && grain.enabled).toBe(true)

    // The forward step is a real 30 cm stride away from home.
    const c1 = findSceneObjectByName("Footprint_C1").getTransform().getWorldPosition()
    const home = findSceneObjectByName("Footprint_C3_6").getTransform().getWorldPosition()
    expect(Math.abs(c1.distance(home) - STEP_LENGTH_CM) < 2).toBe(true)

    // --- the music is playing at Slow tempo ---
    expect(m.state.tempo).toBe(0)
    expect(a.bpm).toBe(140)
    expect(a.isPlaying).toBe(true)
    print("[C1] passed: pad placed, basic step laid out, music at Slow (" + a.bpm + " BPM)")
  }
}
