/**
 * Done criterion 6: looking up away from the pad shows a small arrow at the bottom of the view
 * pointing back to it.
 *
 * A LEAF scenario cannot move the preview head, so it moves the floor layout instead: the only
 * thing the arrow reads is where the pad and the step card sit relative to where the camera
 * looks, and moving one is the same geometry as moving the other. The scenario places the pad
 * in the authored "on the floor, 70 cm ahead" relationship to a level head (the pad is then 65
 * degrees below the view axis, which is what looking up away from it means), checks the arrow,
 * and then checks both halves of the show rule: with the card brought onto the view axis the
 * arrow hides even though the pad is still away, and with neither on the axis it shows. The
 * layout and the card are put back where they were at the end.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils"
import { arrow, cameraObject, cardObject, main, pad, padObject, restartSession } from "./FloorcountTestKit"

/** Angle in degrees between where the camera looks and the direction to an object's centre. */
function angleFromViewDeg(obj: SceneObject): number {
  const cam = cameraObject().getTransform()
  const fwd = cam.back // the camera looks down its local -Z
  const to = obj.getTransform().getWorldPosition().sub(cam.getWorldPosition()).normalize()
  const d = Math.max(-1, Math.min(1, fwd.dot(to)))
  return (Math.acos(d) * 180) / Math.PI
}

function angleToPadDeg(): number {
  return angleFromViewDeg(padObject())
}

function angleToCardDeg(): number {
  return angleFromViewDeg(cardObject())
}

@component
export class FloorcountC6OffViewArrowScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1000)
    await restartSession()
    await sleep(600)

    const a = arrow()
    const m = main()
    const p = pad()
    const threshold = a.showAngleDeg

    // The arrow is only wanted while the footprints are still on the floor.
    expect(p.isFloorVisible).toBe(true)
    expect(a.needed).toBe(true)
    // Main hands the arrow the step card at startup; without it the card half of the rule
    // would silently never fire and every assertion below would still pass.
    expect(a.cardTarget !== null).toBe(true)

    const card = cardObject()
    const cardTransform = card.getTransform()
    const cardLocalStart = cardTransform.getLocalPosition()

    const world = findSceneObjectByName("FloorcountWorld")
    if (!world) throw new Error("FloorcountWorld not found")
    const worldTransform = world.getTransform()
    const worldStart = worldTransform.getWorldPosition()
    // The pad hangs off the layout root by a fixed offset; move the root to move the pad.
    const padOffset = padObject().getTransform().getWorldPosition().sub(worldStart)

    const cam = cameraObject().getTransform()
    const camPos = cam.getWorldPosition()
    const fwd = cam.back
    const up = cam.up
    const right = cam.right

    // The arrow's state already agrees with wherever the preview head happens to look.
    await sleep(150)
    const liveAngle = angleToPadDeg()
    const liveCardAngle = angleToCardDeg()
    print(
      "[C6] as previewed, the pad is " + liveAngle.toFixed(1) + " deg and the card " +
        liveCardAngle.toFixed(1) + " deg off the view axis, threshold " + threshold + " deg",
    )
    expect(a.showing).toBe(liveAngle > threshold && liveCardAngle > threshold)

    // --- neither in view: pad on the floor 70 cm ahead, card where the layout puts it ---
    const padDown = camPos.add(fwd.uniformScale(70)).add(up.uniformScale(-150))
    worldTransform.setWorldPosition(padDown.sub(padOffset))
    await sleep(250)
    const awayAngle = angleToPadDeg()
    const awayCardAngle = angleToCardDeg()
    print(
      "[C6] pad moved to the floor ahead: pad " + awayAngle.toFixed(1) + " deg, card " +
        awayCardAngle.toFixed(1) + " deg off axis, showing=" + a.showing,
    )
    expect(awayAngle > threshold).toBe(true)
    expect(awayCardAngle > threshold).toBe(true)
    expect(a.showing).toBe(true)

    // It sits at the bottom of the view, an arm's length ahead, not on the view axis.
    const rel = a.getSceneObject().getTransform().getWorldPosition().sub(camPos)
    const drop = rel.dot(up)
    const ahead = rel.dot(fwd)
    print("[C6] arrow sits " + ahead.toFixed(1) + " cm ahead and " + drop.toFixed(1) + " cm below the view centre")
    expect(drop < 0).toBe(true)
    expect(ahead > 40).toBe(true)
    expect(ahead < 80).toBe(true)

    // It points back toward the pad: its in-view direction matches the pad's.
    const toPad = padObject().getTransform().getWorldPosition().sub(camPos).normalize()
    let px = toPad.dot(right)
    let py = toPad.dot(up)
    const len = Math.sqrt(px * px + py * py)
    px /= len
    py /= len
    const agreement = a.pointing.dot(right.uniformScale(px).add(up.uniformScale(py)))
    print("[C6] pointing agreement with the direction to the pad: " + agreement.toFixed(3))
    expect(agreement > 0.95).toBe(true)
    // The pad is below the user, so the arrow points downward in the view.
    expect(a.pointing.dot(up) < 0).toBe(true)

    // --- reading the card, pad still away: the arrow gets out of the way ---
    // This is the branch the polish added. The card is the other thing in the Lens worth
    // turning to, and the arrow used to sit under "Got it" while the dancer read it, where a
    // chevron that close to a button reads as a tick rather than as a way back to the floor.
    cardTransform.setWorldPosition(camPos.add(fwd.uniformScale(150)))
    await sleep(250)
    const readAngle = angleToPadDeg()
    const readCardAngle = angleToCardDeg()
    print(
      "[C6] card moved onto the view axis: pad " + readAngle.toFixed(1) + " deg, card " +
        readCardAngle.toFixed(1) + " deg off axis, showing=" + a.showing,
    )
    expect(readCardAngle < threshold).toBe(true)
    // The pad has not moved: it is the card alone that hides the arrow.
    expect(readAngle > threshold).toBe(true)
    expect(a.showing).toBe(false)

    // Put the card back and the arrow comes back with it, so nothing else did the hiding.
    cardTransform.setLocalPosition(cardLocalStart)
    await sleep(250)
    print("[C6] card back on the layout: card " + angleToCardDeg().toFixed(1) + " deg off axis, showing=" + a.showing)
    expect(a.showing).toBe(true)

    // --- looking straight at the pad: the arrow gets out of the way ---
    const padAhead = camPos.add(fwd.uniformScale(150))
    worldTransform.setWorldPosition(padAhead.sub(padOffset))
    await sleep(250)
    const atAngle = angleToPadDeg()
    const atCardAngle = angleToCardDeg()
    print(
      "[C6] pad moved onto the view axis: pad " + atAngle.toFixed(1) + " deg, card " +
        atCardAngle.toFixed(1) + " deg off axis, showing=" + a.showing,
    )
    expect(atAngle < threshold).toBe(true)
    // The card rode along with the layout and is still away, so the pad alone hides it here.
    expect(atCardAngle > threshold).toBe(true)
    expect(a.showing).toBe(false)

    // Put the layout and the card back where the Lens placed them.
    worldTransform.setWorldPosition(worldStart)
    cardTransform.setLocalPosition(cardLocalStart)
    await sleep(250)
    expect(m.state.phase).toBe("learning")
    print(
      "[C6] passed: the arrow shows below the view pointing back to the pad while neither the " +
        "pad nor the card is in view, and hides as soon as either one is",
    )
  }
}
