// Loads the transpiled scripts. FLOORCOUNT_BUILD points at another build (the planted-breaks
// runner uses it to load a deliberately broken copy).
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const dir = process.env.FLOORCOUNT_BUILD || path.join(here, ".build")
const require = createRequire(import.meta.url)

// FloorcountLook asks Lens Studio for its materials and fonts and builds three colours when it
// loads. Outside the Lens those two globals do not exist, so stand-ins are enough: the tests
// only use its numbers and its curve.
globalThis.requireAsset = (p) => ({ asset: p })
globalThis.vec3 = class {
  constructor(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }
}

export const Steps = require(path.join(dir, "FloorcountSteps.js"))
export const State = require(path.join(dir, "FloorcountState.js"))
export const Look = require(path.join(dir, "FloorcountLook.js"))
export const Floor = require(path.join(dir, "FloorcountFloor.js"))
