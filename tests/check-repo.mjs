// Repository checks that need no Lens Studio. Run from the repository root: node tests/check-repo.mjs
//
// 1. No tracked binary is a Git LFS pointer. Lens Studio ships a .gitattributes that sends
//    Assets/ and Packages/ to LFS; a pointer file in a ZIP download is a project that will not open.
// 2. Every LEAF scenario file in Assets/Tests is registered in LeafIndex.ts, and the other way round.
// 3. No tracked text carries a local user path.
// 4. No string the Lens shows ends in an exclamation mark or praises (the charter's voice law).
import fs from "node:fs"
import { execSync } from "node:child_process"

const files = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter(Boolean)
const problems = []

// 1. LFS pointers
const binary = /\.(png|jpg|wav|ttf|lspkg|hdr)$/i
for (const f of files.filter((f) => binary.test(f))) {
  const head = fs.readFileSync(f).subarray(0, 40).toString("latin1")
  if (head.startsWith("version https://git-lfs")) problems.push("Git LFS pointer, not a file: " + f)
}

// 2. LEAF scenarios and their index
const index = fs.readFileSync("Assets/Tests/LeafIndex.ts", "utf8")
const scenarioFiles = files
  .filter((f) => /^Assets\/Tests\/Floorcount.*Scenario\.ts$/.test(f))
  .map((f) => f.replace(/^Assets\/Tests\//, "").replace(/\.ts$/, ""))
const registered = [...index.matchAll(/typename:\s*(\w+)\.getTypeName\(\)/g)].map((m) => m[1])
for (const s of scenarioFiles) if (!registered.includes(s)) problems.push("Scenario not registered in LeafIndex.ts: " + s)
for (const r of registered) if (!scenarioFiles.includes(r)) problems.push("LeafIndex.ts registers a scenario with no file: " + r)
const ids = [...index.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1])
if (new Set(ids).size !== ids.length) problems.push("LeafIndex.ts has a duplicate scenario id")

// 3. Local paths
const text = /\.(md|ts|js|mjs|json|html|svg|py|yml)$/i
for (const f of files.filter((f) => text.test(f) && !f.startsWith("Packages/") && !f.startsWith("Plugins/"))) {
  const body = fs.readFileSync(f, "utf8")
  if (/[A-Za-z]:[\\/]Users[\\/]/.test(body)) problems.push("Local user path in " + f)
}

// 4. The voice, in the strings the Lens shows
const shown = /(?:return|text\s*=|setLine\([^,]+,|showSummary\([^)]*,)\s*"([^"]*)"/g
for (const f of files.filter((f) => /^Assets\/Scripts\/.*\.ts$/.test(f))) {
  for (const m of fs.readFileSync(f, "utf8").matchAll(shown)) {
    if (/!\s*$|\b(great|nice|awesome|perfect)\b/i.test(m[1])) problems.push('Off the voice in ' + f + ': "' + m[1] + '"')
  }
}

if (problems.length) {
  console.error(problems.join("\n"))
  process.exit(1)
}
console.log(
  "ok: " + files.filter((f) => binary.test(f)).length + " binaries are real files, " +
    scenarioFiles.length + " LEAF scenarios registered, no local paths, voice holds",
)
