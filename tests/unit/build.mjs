// Transpiles the Lens's pure-logic scripts to CommonJS so plain Node can load them.
//
// Types are stripped, nothing is type-checked here: Lens Studio's own compiler does that. The
// three files below touch no scene, so they run outside the Lens once two globals are stubbed
// (see lens-stubs.cjs). Usage: node build.mjs [outDir] [sourceOverrideDir]
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const here = path.dirname(fileURLToPath(import.meta.url))
const scripts = path.join(here, "..", "..", "Assets", "Scripts")
export const SOURCES = ["FloorcountSteps.ts", "FloorcountState.ts", "FloorcountLook.ts", "FloorcountFloor.ts"]

export function build(outDir = path.join(here, ".build"), overrides = {}) {
  fs.mkdirSync(outDir, { recursive: true })
  for (const name of SOURCES) {
    const source = overrides[name] ?? fs.readFileSync(path.join(scripts, name), "utf8")
    const out = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
      fileName: name,
    })
    fs.writeFileSync(path.join(outDir, name.replace(/\.ts$/, ".js")), out.outputText)
  }
  // A package.json so Node treats the output as CommonJS inside this ESM package.
  fs.writeFileSync(path.join(outDir, "package.json"), '{"type":"commonjs"}\n')
  return outDir
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  build(process.argv[2])
}
