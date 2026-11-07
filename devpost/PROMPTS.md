# Prompts

Every prompt a CLAD session was given, in order, word for word (local folder paths replaced with `<project>`). The planning interview that produced the brief is not here: its result is [design-brief.md](design-brief.md).

## 1 November: first build

```text
Read devpost/design-brief.md and build it for SPECS. Follow the brief closely. Get the basic flow working first, then add detail. Write and run LEAF tests for each done criterion, and tell me which pass.

Context for this run:
- Project root: the folder with ARSpec.esproj (SPECS Base Template). Lens Studio is open and the lens-studio MCP is connected. SpectaclesInteractionKit 2.0 and SpectaclesUIKit 2.0 are already installed.
- No SPECS device exists. Everything must run and be demonstrable in Lens Studio's preview (Interactive Preview, mouse = pinch).
- The practice music must be generated with CLAD's build-music skill (original salsa practice loop: clave on 1 and 5, tumbao-style bass/conga, piano montuno feel) at the brief's three tempos (140, 170, 190 BPM), one count per beat. The clave click can use build-sfx. No licensed music. Footprint timing must be driven from the same tempo the audio uses so lights stay on the beat.
- Footprints are flat light-coloured shapes on the floor (left foot cool blue, right foot warm orange); a simple code-built or primitive mesh is fine. Avoid black or dark content (additive display).
- Use the brief's footwork tables exactly (basic, right turn, left turn, On1, leader's part).
- Do not commit to git or initialise a repository. Do not edit devpost/design-brief.md or PHASE0.md.
- When done, report: what was built (scene objects and scripts, with paths), each of the six done criteria with its LEAF scenario file and PASS/FAIL, any criterion with no test, anything that deviated from the brief and why, and a preview screenshot path showing the pad with lit footprints.
```

## 2 November: build (continuing the session of 1 November)

```text
Read devpost/design-brief.md and build it for SPECS. Follow the brief closely. Get the basic flow working first, then add detail. Write and run LEAF tests for each done criterion, and tell me which pass.

Context for this run (a previous build session was cut off; this one continues it):

- Project root: this folder (ARSpec.esproj, SPECS Base Template). Lens Studio is open on it and the lens-studio MCP server is connected. SpectaclesInteractionKit 2.0 and SpectaclesUIKit 2.0 are installed.
- A previous CLAD run already wrote these and they are correct. Reuse them; do not rewrite them from scratch, only edit where wiring needs it:
  - Assets/Scripts/FloorcountSteps.ts (footwork data, matches the brief's tables), FloorcountState.ts (session rules), FloorcountMain.ts (orchestrator; expects @inputs stepCard, countDisplay, pad, audio, offViewArrow, cameraObject, worldRoot), FloorcountPadController.ts, FloorcountAudioController.ts, FloorcountStepCardUI.ts, FloorcountCountUI.ts, FloorcountOffViewArrow.ts. Read each one before building the scene so the scene matches what they expect.
  - Assets/GeneratedSFX/: FloorcountSalsa140.wav, FloorcountSalsa170.wav, FloorcountSalsa190.wav (practice loops at 140, 170 and 190 BPM, one count per beat), FloorcountClaveClick.wav, FloorcountUiTap.wav, FloorcountStepMastered.wav.
  - Assets/Icons/: check.png, pause.png, play_arrow.png, replay.png.
- The scene objects from that run were LOST because the project was never saved: Assets/Scene.scene is still the Base Template. So rebuild the scene (floor pad, footprints, turn arc, count number, step card with Again and Got it buttons, off-view arrow, audio sources) wired to those scripts, and SAVE THE PROJECT through the Editor API after each milestone: after the scene is wired, after the first successful preview run, and after the tests. Never finish without a save.
- No SPECS device exists. Everything must run and be demonstrable in Lens Studio's Interactive Preview, where the mouse acts as a pinch.
- Footprints are flat, light-coloured shapes on the floor: left foot cool blue, right foot warm orange. No black or dark content anywhere (additive display).
- If files named like "* 2.ts", "* 2.wav" or "* 2.png" appear in Assets/ (OneDrive duplicates), delete them and their .meta files before compiling; they break the TypeScript build with duplicate classes.
- Do not run git. Do not edit devpost/design-brief.md or PHASE0.md.
- When done, write devpost/build-report.md with: what was built (scene objects and scripts, with paths); each of the six done criteria with its LEAF scenario file and PASS or FAIL; any criterion with no test; anything that deviated from the brief and why; the path of a preview screenshot showing the pad with lit footprints, saved under devpost/shots/; and confirmation of the last project save. Plain, factual language; no marketing tone; no em-dashes.
```

## 2 November: design pass

```text
Apply the design notes in devpost/design-notes.md to the Floorcount Lens in this project, then re-run its LEAF tests and save the project.

Context:
- Project root: this folder (ARSpec.esproj). Lens Studio is open on it and the lens-studio MCP server is connected. The functional build is done: read devpost/build-report.md first to learn the scene objects, scripts and LEAF scenarios it created, then devpost/design-brief.md for the intent.
- The design is specified in devpost/design-notes.md, with the laws in .design/brand/CHARTER.md and every value in .design/manifest.json. Follow the notes exactly; where a note conflicts with the brief, the brief's done criteria and sizes win and the note's colours, textures, type, brightness and motion win.
- Assets to bring into the project (copy, do not move):
  - Fonts: .design/brand/fonts/AtkinsonHyperlegibleNext-ExtraBold.ttf and AtkinsonHyperlegibleNext-Medium.ttf into Assets/Fonts/. Use ExtraBold for numerals and button labels, Medium for all other text. Replace every Text component's font.
  - Textures: from .design/brand/export/ into Assets/Textures/Floorcount/: fp-left-solid.png and fp-right-outline.png (sole prints; each image is a 12 x 29 cm box with the 10 x 27 cm print centred, so the quad is 12 x 29 cm), cell.png and cell-empty.png (6 x 3 cm), pad-border.png (90 x 90 cm), parquet.png (tile at 30 cm, repeat 3 x 3 across the pad), arrow.png (6 x 6 cm).
  - All textures are ivory shapes on transparent. Use unlit materials with alpha blending; set brightness through the material's alpha (100% current count, 60% on the "and", 35% at rest) and tint the count-1 print and cell teal #5FB4E8. Never black, never dark fills.
- The count display: replace the single floating number with the clave strip (eight cells from cell.png, cells 4 and 8 from cell-empty.png, 1.5 cm gaps, 58.5 cm total, 40 cm above the pad's far edge, facing the user) plus the numeral above it (14 cm cap height, blank on 4 and 8). Drive the cells' brightness from the same beat clock as the footprints (FloorcountMain / FloorcountPadController).
- Motion: rise to 60% half a beat before the count, jump to 100% on the count, decay to 35% over one beat with brightness = 0.35 + 0.65 * exp(-4 t). Keep the brief's two-count fade between steps. Nothing else animates; remove any hover glow or pulsing.
- The step card: no opaque or dark panel. Ivory text on the air; the two buttons are 12 x 5 cm capsules with a 30% ivory capsule behind each, bright only during the answer window. Remove the Material icons from the Again and Got it buttons and the pause icon from the title (text only; the charter bans stock icon sets), remove the frosted panel background and the caption line under the buttons ("After each 8-count: Again or Got it"). Strings from .design/brand/voice.md: title "Basic step" / "Right turn" / "Left turn"; progress "Step 1 of 3"; tempo "Slow, 140" / "Medium, 170" / "Full, 190"; focus "Whole step" / "Counts 1 to 4 only" / "Counts 5 to 8 only" / "3 clean at Full" style; summary title "Practise again"; no exclamation marks, no praise. If a UI Kit component cannot drop its panel, build the card from Text components and two SIK Interactable capsule quads instead, keeping the object names the LEAF scenarios use.
- The count number: ivory, Atkinson ExtraBold, 14 cm, blank on holds; add the clave strip below it as described, and keep the CountNumber object name.
- Lens icon: if the project exposes an icon setting through the Editor API, set it to .design/brand/export/icon-512.png.
- Packages: this project is pinned to Spectacles Interaction Kit 2.0, Spectacles UI Kit 2.0 and LEAF 2.0.2. Do not install any package (the Asset Library's 4.x kits import from different folder names and break the whole TypeScript build), and never call the QueryRuntimeSceneTool MCP tool here (it silently installs a 4.x package). Verify runtime state with the LEAF scenarios in Assets/Tests/ and preview screenshots.
- The footprints are currently code-built flat meshes in FloorcountPadController (left blue, right orange); replace their look with the textured quads described above, keeping their SIK Interactable behaviour and their names (Footprint_C1 and so on), because the LEAF scenarios look them up by name.
- If files named like "* 2.ts" or "* 2.png" appear in Assets/ (OneDrive duplicates), delete them and their .meta files before compiling.
- Do not run git. Do not edit devpost/design-brief.md, devpost/design-notes.md or PHASE0.md.
- Save the project through the Editor API after the assets are in, after the scene changes, and after the tests.
- Then capture screenshots of the Interactive Preview at 1280 x 720 from the start position, looking down at the pad with a footprint lit (count 1, teal) and one with count 5 lit, plus one of the step card during the answer window, into devpost/shots/ with clear names.
- Write devpost/design-pass-report.md: every note applied or not applied and why; the LEAF results after the pass (each scenario PASS or FAIL); the screenshot paths; confirmation of the last save. Plain language, no marketing tone, no em-dashes.
```

## 2 and 3 November: step card fix

```text
Fix the Floorcount step card and refresh the outline textures, then re-run the LEAF tests and save. This continues the design pass described in devpost/design-pass-report.md; read it first, then .design/brand/CHARTER.md.

An earlier run of this same task was cut off by a usage limit after editing only `Assets/Scripts/FloorcountStepCardUI.ts` (last write 2 Nov 16:27); it never saved the scene. Start by recompiling and reading that file: finish its edits if they are sound, or repair it if it is half-written. Lens Studio was closed and reopened since, so the open project is the last saved state (2 Nov 16:03), which is good.

Context:
- Project root: this folder (ARSpec.esproj). Lens Studio is open on it; the lens-studio MCP server is connected.
- Packages are pinned (SIK 2.0, UI Kit 2.0, LEAF 2.0.2). Install nothing. Never call QueryRuntimeSceneTool.
- Keep every object name the LEAF scenarios look up (StepCard, AgainButton, GotItButton, TitleButton, CountNumber, Footprint_C1 and so on).
- If files named "* 2.*" appear in Assets/ (OneDrive duplicates), delete them and their .meta files before compiling.
- Do not run git. Do not edit devpost/design-brief.md, devpost/design-notes.md or PHASE0.md.

1. Textures. Three PNGs in Assets/Textures/Floorcount/ were overwritten on disk with thicker strokes so they survive 720p video: fp-right-outline.png, cell-empty.png, pad-border.png. Make sure Lens Studio has reimported them (refresh or reimport the assets) and that the materials in Assets/Materials/ still bind them. Nothing else about them changes.

2. The step card, from a blind review of devpost/shots/step-card-answer-window.png:
   - All four text lines (title, "Step 1 of 3", tempo, focus) must share one left edge. In the screenshot each line starts further right than the one above. Use left alignment with the same x anchor for every Text, and check it in a screenshot from the start position, not only in the editor.
   - The two buttons read as one phrase, "Again Got it": each label is wider than its capsule and the capsules nearly touch. Make each capsule fit its label with at least 1.5 cm of air on each side inside the capsule (widen the capsule from 12 cm as needed; the card may be up to 60 cm wide), and put 6 cm of space between the two capsules. Keep them equal in weight: neither is primary, by design.
   - Tempo line: "Slow, 140 BPM" / "Medium, 170 BPM" / "Full, 190 BPM".
   - Body lines (progress, tempo, focus) use the ExtraBold weight instead of Medium, so they hold against bright real backgrounds (the preview room's cream sofa and white curtains wash Medium out). The title stays Medium at its current size.
   - Add a paused state using words, not an icon: while the session is paused, the focus line reads "Paused. Pinch the title to go on." and returns to its normal text on resume. Add an assertion for it to an existing scenario or a new small one.

3. Re-run all LEAF scenarios and report each PASS or FAIL. Then capture, with the floorcount-hold-on-count helper, at 1280 x 720 on the same walnut-margin canvas as before:
   - devpost/shots/step-card-answer-window.png (overwrite): the card during the answer window, from where the dancer stands, no cursor over the buttons if you can move it aside.
   - devpost/shots/pad-count5-lit.png (overwrite): the pad on count 5 framed so the whole strip and the numeral (blank is fine only on 4 and 8; on 5 it shows 5) and the whole lit print are inside the frame.
   - devpost/shots/pad-count1-teal.png (overwrite) with the new thicker outlines.

4. Save the project through the Editor API after the textures, after the card, and after the tests. Append a section "Card fix, 2 November 2026" to devpost/design-pass-report.md with what changed, the LEAF results, and the last save time. Plain language, no em-dashes.
```

## 3 November: polish

```text
Three small changes to the Floorcount Lens, then re-run LEAF, re-capture, and save. Read devpost/design-pass-report.md (especially "Card fix" and "Things worth knowing") and .design/brand/CHARTER.md first.

Rules for this project, unchanged: packages are pinned (SIK 2.0, UI Kit 2.0, LEAF 2.0.2); install nothing; never call QueryRuntimeSceneTool or PreviewInteractTool (both silently install packages that break the build). Keep every object name the LEAF scenarios use. Delete any "* 2.*" OneDrive duplicates in Assets/ before compiling. Do not run git. Do not edit devpost/design-brief.md, devpost/design-notes.md or PHASE0.md.

1. The off-view arrow must not show while the step card is in view. Today it appears whenever the pad is out of view, including when the dancer has turned to read the card, where it sits under "Got it" and reads as a tick. New rule: show it only when the pad is out of view AND the step card is out of view (use the same angle test the pad uses, against the card's position). Extend floorcount-c6-off-view-arrow to assert both branches: hidden with the card on the view axis, shown with neither in view.

2. One weight on the step card. Set the title ("Basic step", "Right turn", "Left turn", "Practise again") in Atkinson Hyperlegible Next ExtraBold like the lines under it, keeping its size. Re-run the card fit so the left edge and the capsule air still hold (C7 asserts them).

3. A bigger clave strip, for 720p video. Cells from 6 x 3 cm to 8 x 4 cm, gaps from 1.5 to 2 cm (total 78 cm), same position above the pad's far edge, numeral above it unchanged in size. Update C2's width assertion (58.5 cm to 78 cm). The textures scale; nothing to re-export.

Then: run all LEAF scenarios and report PASS or FAIL for each. Capture at 1280 x 720 with tmp/compose_shot.py and the floorcount-hold-on-count helper, overwriting devpost/shots/pad-count1-teal.png, pad-count5-lit.png and step-card-answer-window.png. Before capturing, move the preview camera to a start position over clear floor in the preview room (no table, laptop or sofa under the 90 cm pad, at least 1 m of open floor in front), reset the Lens there (recenter pins the layout to the camera on frame 3), then aim. For the card shot, choose a heading where the background behind the card is the room's darker surfaces rather than the cream sofa or the white curtains, and keep the camera level enough that the card's left edge reads straight.

Save through the Editor API after the code changes and after the captures. Append a section "Polish, 3 November 2026" to devpost/design-pass-report.md: what changed, the LEAF table, where the camera stood for each shot, the last save time. Plain language, no em-dashes.
```

## 6 November: validation

```text
Validate the Floorcount Lens after a small set of code changes, then save. Keep this pass short: do not redesign or refactor anything.

Project root: this folder (ARSpec.esproj). Lens Studio is open on it; the lens-studio MCP server is connected.

Rules, unchanged: packages are pinned (SIK 2.0, UI Kit 2.0, LEAF 2.0.2); install nothing; never call QueryRuntimeSceneTool or PreviewInteractTool (both silently install packages that break the build). Keep every object name the LEAF scenarios use. Delete any "* 2.*" OneDrive duplicates in Assets/ before compiling. Do not run git. Do not edit devpost/design-brief.md, devpost/design-notes.md, PHASE0.md, README.md or anything under .design/.

What changed on disk since the last save (already written, review them, do not rewrite them):
- Assets/Scripts/FloorcountMain.ts: a one-answer-per-8-count guard (`answerGuard`, `canAnswer`, `takeAnswer`, `ignoredAnswers`, `answeredPhrase`), the buttons go back to rest once the 8-count's answer is in, and summary rows now read "lost it on 2 and 5" (`countsInWords`).
- Assets/Scripts/FloorcountStepCardUI.ts: the summary footer uses the ExtraBold face at the paused line's fitted size; the unused FONT_BODY import is gone.
- Assets/Tests/FloorcountTestKit.ts: `restartSession(answerGuard = false)` and `waitForBeat`.
- Assets/Tests/FloorcountC8AnswerGuardScenario.ts (new) and its entry in Assets/Tests/LeafIndex.ts.

Do, in order:
1. Recompile TypeScript. Fix compile errors only, with the smallest change.
2. Remove the four unused icon textures in Assets/Icons/ (check.png, pause.png, play_arrow.png, replay.png) through the asset manager, after confirming no script, material or scene object references them. Remove the empty folder if the API allows.
3. Set the project's Lens name to "Floorcount" (it is still "SpecsBaseTemplate" in ARSpec.esproj, under metaInfo.lensName) through the Editor API. Save, then read ARSpec.esproj to confirm the name persisted. If it does not persist, say so and leave the file alone.
4. Run every LEAF scenario in one sweep: c1 to c8 and the hold-on-count helper. Report PASS or FAIL for each, with C2's measured numbers and C8's printed lines. If C8 fails on timing, fix the scenario's waits (not the guard) and say what you changed. If another scenario fails because of the guard, the fix is in the test kit, not in Main.
5. Without LEAF, start the preview once and confirm from the log that the session starts at Slow, 140 BPM, with no errors or warnings from Floorcount scripts.
6. Save the project through the Editor API.
7. Append a section "Validation, 6 November 2026" to devpost/design-pass-report.md: what you checked, the LEAF table, the icon removal, whether the Lens name persisted, anything you had to change, and the last save time. Plain language, no em-dashes.
```

## 6 November: fresh-clone test

```text
Test that a fresh clone of the Floorcount repository opens, compiles and passes its LEAF tests in Lens Studio. Then put Lens Studio back on the working project. Change nothing in either project.

Paths:
- Working project (currently open in Lens Studio): <project>/ARSpec.esproj
- Fresh clone to test: <fresh clone>/ARSpec.esproj (made with `git clone` from the working repo's HEAD; it has no Cache/, Support/, Workspaces/ or .mcp.json, as a stranger's clone would not)

Rules: install no packages. Never call QueryRuntimeSceneTool or PreviewInteractTool (both silently install packages that break the build). Do not run git. Do not edit files in the working project. In the clone, edit nothing either; this is a read-only test of what a judge gets.

Steps:
1. Confirm the working project has no unsaved changes; save it through the Editor API if it does.
2. Open the clone's project in Lens Studio through the Editor API (a note from an earlier session: `model.openProject()` refuses while a project holds its own lock; `model.setEmptyProject()` then `model.openProject(path)` works). If the MCP connection drops when the project switches, wait and retry; if it does not come back, stop and report.
3. In the clone: wait for TypeScript to compile. Report any compile error verbatim. List the installed packages and their versions.
4. Start the preview and confirm from the log that the session starts ("Floorcount: session started, Basic step at Slow (140 BPM)") with no errors from Floorcount scripts.
5. Run all LEAF scenarios (c1 to c8 and the hold-on-count helper) and report PASS or FAIL for each.
6. Note anything a stranger would have to do by hand to get this far (a device profile to pick, a panel to open, a prompt to accept), in the order they would meet it. These become the README's "How to run it" steps, so be exact about menu and panel names as Lens Studio 5.23.2 shows them.
7. Re-open the working project the same way and confirm it is the open project again, with the session starting cleanly in the preview. This step matters most: do not finish with the clone open.
8. Write the result to <project>/devpost\clean-clone-test.md: date (6 November 2026), Lens Studio version, what was tested, the compile result, the package list, the LEAF table, the by-hand steps from step 6, and confirmation that the working project is open again. Plain language, no em-dashes. This one file is the only thing you write in the working project.
```

## 6 November: session memory and coverage

```text
Verify a set of code changes in the Floorcount Lens, write the LEAF scenarios listed below, capture three frames, and save. The code changes are already on disk; review them, do not redesign or rewrite them, and fix compile errors with the smallest change.

Project root: this folder (ARSpec.esproj). Lens Studio is open on it; the lens-studio MCP server is connected. Read devpost/design-pass-report.md sections "Things worth knowing", "Polish, 3 November 2026" and "Validation, 6 November 2026" first: they hold what earlier sessions learned about this preview.

Rules, unchanged: packages are pinned (SIK 2.0, UI Kit 2.0, LEAF 2.0.2); install nothing; never call QueryRuntimeSceneTool or PreviewInteractTool (both silently install packages that break the build). Keep every object name the scenarios use. Delete any "* 2.*" OneDrive duplicates in Assets/ before compiling. Do not run git. Do not edit devpost/design-brief.md, devpost/design-notes.md, PHASE0.md, README.md, anything under .design/ or anything under tests/. Refresh the preview before any scenario that times itself against the clock: the preview slows down the longer it runs. Save through the Editor API after compiling clean, after the scenarios, and at the end.

What changed on disk since the last save:
1. Turn arcs (Assets/Scripts/FloorcountSteps.ts). Both arcs were running 5 cm past the pad's edge. Each is now a ring of radius 17 around the pivoting feet, open where the toes point: right turn centre (-4, -24), start 50 degrees, sweep 250 clockwise; left turn centre (4, 24), start 120 degrees, sweep 250 the other way.
2. Session memory. A finished session is saved and the next practice picks up from it.
   - FloorcountState.ts: `countsInWords`, `summaryRowText`, `serializeSession`, `parseSaved`, and on the class `previous`, `setPrevious`, `previousLostCounts`, `previousAgains`, `answeredThisStep`.
   - FloorcountMain.ts: `SAVE_KEY`, `saveStore`, `loadSaved`, `saveSession`, `clearSaved`; `startSession` loads the saved session; `enterSummary` builds rows with `summaryRowText` and then saves; `loadCurrentStep` calls `pad.setPreviousMarks`; the focus line reads "Last time: lost it on 2 and 5" until the first answer on a step.
   - FloorcountPadController.ts: `markedBefore`, `setPreviousMarks`, `isPreviousMarkShown`, `ringBrightness`. A ring carried over from the last session draws at rest brightness (0.35); a ring earned this session at 0.5.
   - Check the storage calls against Support/StudioLib.d.ts (`global.persistentStorageSystem.store`, `getString`, `putString`, `remove`) and correct them if the API differs. Confirm by hand that a saved session survives a real preview reset, and say what you saw.
3. Assets/Tests/FloorcountTestKit.ts: `restartSession(answerGuard = false, keepSaved = false)` now clears the saved session unless told to keep it, so every scenario starts as a first session.
4. A comment in FloorcountLook.ts. Nothing to verify.

First: recompile, start the preview without LEAF and confirm "Floorcount: session started" with no Floorcount errors, then run the existing sweep (c1 to c8 and the helper). All must still pass before you add anything.

Then write these scenarios, each for a behaviour nothing asserts today, registered in Assets/Tests/LeafIndex.ts with ids `floorcount-c9-...` onward. Use the test kit; add small helpers to it if several scenarios need them. In priority order:
- c9 session memory. First session: no ring, focus line "Whole step", summary rows without "last time". Finish a short session with one Again on the basic step and count 5 pinched. Start again with the saved session kept: the count-5 print carries a ring at rest brightness (`isPreviousMarkShown(5)`, `ringBrightness(5)` about 0.35), the focus line reads "Last time: lost it on 5" and returns to normal after one answer. Finish again: the basic step's row ends ", 1 last time". End by clearing the saved session.
- c10 left turn. Reach step 3: the pivot print for count 6 exists and faces back, and the arc is at full on counts 6 and 7 and on no other count.
- c11 the halves. After two Agains only counts 1 to 4 are on the floor; one Got it shows only counts 5 to 8 and the card says "Counts 5 to 8 only"; another brings the whole step back.
- c12 the count display. After a Got it the numeral and the strip are hidden; after an Again they are back.
- c13 the "and". Around count 2, the count-2 print and cell 2 read about 0.6 in the half beat before the count, 1.0 at the strike and less after it, and the hold cells never rise above 0.35.
- c14 the mark ring and the wording. Pinching the prints for 2 and 5 leaves rings at 0.5 (`ringBrightness`), and on a first session the row ends ", lost it on 2 and 5".
- c15 restart from the summary. Pinching the title in the summary puts the session back at step 1, Slow, with the floor and the two buttons back.
- c16 the arcs in the running Lens. For the right turn and the left turn, the TurnArc mesh's bounds are inside the pad border's inner edge (43.2 cm from the pad's centre).
- c17 the teal law. Across all three steps, the only teal things are the count-1 print and cell 1.
If usage or time runs short, stop after c12, say which are missing, and save. A scenario that cannot be made to pass honestly is reported as failing, not weakened until it passes.

Captures, 1280 x 720 with tmp/compose_shot.py, camera at a start position over clear floor as in the Polish notes:
- devpost/shots/right-turn-arc.png: the right turn on count 2 with its arc at full.
- devpost/shots/last-time-rings.png: a second session, a print carrying last time's ring, the card in view if the frame allows.
- devpost/shots/summary-last-time.png: the summary card with rows ending "last time".

Last: clear the saved session so the project is left as a first session, save, and append a section "Session memory and coverage, 6 November 2026" to devpost/design-pass-report.md with: what you verified, anything you changed and why, the LEAF table for every scenario (PASS or FAIL), what you saw across a real preview reset, the capture paths, and the last save time. Plain language, no em-dashes.
```

## 6 November: finishing the coverage pass

```text
Finish a verification pass on the Floorcount Lens that an earlier session started and a usage limit cut off. Nothing below needs new design. Fix compile errors with the smallest change.

Project root: this folder (ARSpec.esproj). Lens Studio is open on it; the lens-studio MCP server is connected. Read devpost/design-pass-report.md sections "Things worth knowing", "Polish, 3 November 2026" and "Validation, 6 November 2026" first.

Rules, unchanged: packages are pinned (SIK 2.0, UI Kit 2.0, LEAF 2.0.2); install nothing; never call QueryRuntimeSceneTool or PreviewInteractTool (both silently install packages that break the build). Keep every object name the scenarios use. Delete any "* 2.*" OneDrive duplicates in Assets/ before compiling. Do not run git. Do not edit devpost/design-brief.md, devpost/design-notes.md, PHASE0.md, README.md, anything under .design/ or anything under tests/. Do not edit Assets/Scripts/ unless a scenario proves a real bug, and if so say what and why. Save through the Editor API after compiling clean, after the sweep, and at the end. Do not start with `cd`: the working directory is already the project, and a hook blocks it.

What the earlier session established, so do not redo it:
- It compiled clean, the Lens starts with no Floorcount errors, and c1 to c8 plus the helper passed on the new code at about 10:34.
- It wrote c9 to c17 and FloorcountCaptureScenario.ts, registered them, and each passed: c9 session memory (it outlasts the MCP call's timeout, so its result is read from the log, not from the tool), c10, c11, c12, c13, c14, c15, c16, c17.
- It changed a shared test-kit helper (masterCurrentStep), then re-ran: c1, c2, c3 passed, and C4 failed on every run.

The C4 failure, already diagnosed and fixed on disk: at Full tempo the fade between steps is 0.63 s and a simulated pinch costs about 0.95 s, so the fade could start and finish inside the pinch and C4's single look at the phase afterwards found "learning". Since this session's start C4 uses a new test-kit helper, `watchPhases`, which records every change of phase frame by frame and asserts the sequence learning/0, fading/0, learning/1. Review that change. If C4 still fails, read its "[C4]" print and find out why: do not loosen the assertion to make it pass, and report it as failing if it cannot be made to pass honestly.

Do, in this order:
1. Recompile, confirm the preview starts with "Floorcount: session started" and no Floorcount errors.
2. Run the whole sweep once, c1 to c17 and the helper, refreshing the preview before each timing-sensitive scenario (c2, c5, c8, c9, c13). The preview slows down the longer it runs. Run c5 and c8 twice each and report both results: they share the fragile path with C4. A scenario that fails once and passes on a retry is reported as exactly that, with the reason if you can find it.
3. Confirm by hand that a saved session survives a real preview reset, using the capture helper or a finished session, and say what you saw. Check the storage calls match Support/StudioLib.d.ts if the earlier session's log leaves any doubt.
4. Captures, 1280 x 720 with tmp/compose_shot.py, camera at a start position over clear floor as in the Polish notes, using the `floorcount-capture` scenario:
   - devpost/shots/right-turn-arc.png: the right turn on count 2 with its arc at full.
   - devpost/shots/last-time-rings.png: a second session, a print carrying last time's ring, the card in view if the frame allows.
   - devpost/shots/summary-last-time.png: the summary card with rows ending "last time".
   Look at each image before moving on. A frame that does not show what its name says is retaken or reported.
5. Clear the saved session so the project is left as a first session, and save.
6. Append a section "Session memory and coverage, 6 November 2026" to devpost/design-pass-report.md: what was verified, anything changed and why (the masterCurrentStep fix, the c13 freeze helper, the C4 change), the LEAF table for every scenario with PASS or FAIL and any retry, what you saw across a real preview reset, the capture paths, and the last save time. Plain language, no em-dashes, and no local user paths.

If usage or time runs short, the order of priority is: the sweep, then step 5, then step 6, then the captures. Save before stopping, and write down what is missing in the report section. If Lens Studio stops answering, a modal dialog may be open: say so and stop, do not wait on it.
```

## 6 November: preview capture for the video

```text
Capture preview footage of the Floorcount Lens for the submission video. Do not change how the Lens looks or behaves.

Read first: DEMO_SCRIPT.md (the shots), devpost/design-pass-report.md (sections "Things worth knowing", "Polish, 3 November 2026" and "Session memory and coverage, 6 November 2026"), broll/SHOTLIST.md.

Rules for this project: packages are pinned (SIK 2.0, UI Kit 2.0, LEAF 2.0.2); install nothing; never call QueryRuntimeSceneTool or PreviewInteractTool (both silently install packages that break the build). Do not edit Assets/Scripts/. Assets/Tests/FloorcountCaptureScenario.ts already exists and may be extended. Do not edit the brief, the notes, PHASE0.md, README.md or the submission. Do not run git. Do not start a shell command with `cd`: the working directory is already the project. Delete any "* 2.*" OneDrive duplicates in Assets/ before compiling. Save the project through the Editor API if you add a scenario.

Goal: real screen recordings of the preview, saved in broll/ (git-ignored), named preview-NN-what.mp4:
1. preview-01-basic-slow.mp4: the pad from the start position, about two 8-counts of the basic at Slow, prints lighting on their counts, the strip and numeral in frame.
2. preview-02-again-half.mp4: Again twice (use the capture scenario to press), the tempo drops, only counts 1 to 4 lit.
3. preview-03-next-step.mp4: Got it three times at Full, the two-count fade, the right turn loads with its arc on counts 2 and 3.
4. preview-04-step-card.mp4: the card during the answer window, from where the dancer stands.
5. preview-05-right-turn-clean.mp4: one full right-turn 8-count, nothing else on screen but the Lens in the room, for the final shot.
6. preview-06-second-session.mp4: a real second session. First finish a session in the preview with three Agains on the basic and the count-5 print pinched (drive it with the capture scenario, which may be extended for this; do not write the saved data by hand). The second session then has one Again on the basic, so the summary shows a real improvement. Then start again with the saved session kept and film the pad with the faint ring on the count-5 print, then the card reading "Last time: lost it on 5".
7. preview-07-summary-last-time.mp4: the end of that second session, the summary card with rows ending "last time". Hold 5 seconds. Retake the still devpost/shots/summary-last-time.png from this same held frame (1280 x 720 with tmp/compose_shot.py, as before): its basic row should read "Basic step: 1 Again, 3 last time".
8. preview-08-leaf-run.mp4: the whole Lens Studio window with the LEAF panel visible while three or four scenarios run and report PASS. This is the one clip where the editor UI should be in frame.
9. preview-09-lens-studio-wide.mp4: the whole Lens Studio window with the preview running the basic step, 8 seconds, for the line "all of this is the Lens Studio preview".
When the clips are done, clear the saved session (FloorcountMain.clearSaved) so the project is left as a first session, and save.

Method: write a capture-only LEAF scenario that drives each path by pressing the same SIK interactables the other scenarios press, with holds long enough to film. Record with ffmpeg (installed), capturing only the Lens Studio window or the preview panel region with gdigrab (title= or a fixed region of that window), never the whole desktop, the webcam or a microphone. If another window covers Lens Studio, bring Lens Studio forward; if it still cannot be captured, stop and report. Crop to the preview. 30 fps, H.264, yuv420p. Use the camera position from the Polish report: the start position over clear floor, Lens reset there, then aim. Keep the Lens Studio UI, the LEAF result banner and any cursor out of the crop if you can.

Audio: there is no loopback device listed. If you can capture system audio with a method that needs no install, do so. Otherwise record silent and write down, per clip, the frame where the music loop starts, so the WAV in Assets/GeneratedSFX/ can be laid in during the edit.

Look at one extracted frame from each clip before moving on. If a capture method does not work after two honest attempts, stop and report what failed; do not fake a clip from stills.

Finish by writing broll/PREVIEW-CLIPS.md: each file, its duration, what it shows, the camera position, audio status, and anything wrong with it. Plain language, no em-dashes.

If Lens Studio stops answering, a modal dialog may be open: say so and stop, do not wait on it.

Two things learned today: LEAF's panel prints "Loaded 19 scenario(s) from preview" when it is ready, and a run dispatched before that line is silently lost. If the preview goes silent, check PreviewPanelTool getConfig: "Preview is Paused" needs a refresh, resume does not revive it. A Quest 3S and a phone may be attached over adb, so pin LEAF to the preview first. Leave the project as a first session (clear the saved session) and save.
```

## 6 November: finishing the capture

```text
Finish a capture job an earlier session started. Keep this short: you have about 50 tool calls. Do not change how the Lens looks or behaves.

Project root: this folder (ARSpec.esproj). Lens Studio is open on it; the lens-studio MCP server is connected. Clips preview-01 to preview-07 are already in broll/ and are good: do not redo them.

Rules: install nothing; never call QueryRuntimeSceneTool or PreviewInteractTool. Do not run git. Do not start a shell command with `cd`. Do not edit anything under Assets/Scripts/, README.md, PHASE0.md or devpost/submission.md. Do not move or click the mouse, and do not use tmp/mouse.ps1. LEAF's panel prints "Loaded 19 scenario(s) from preview" when it is ready, and a run dispatched before that line is lost. Pin LEAF to the preview, not a device. If the preview goes silent, check PreviewPanelTool getConfig: "Preview is Paused" needs a refresh. Do not record the webcam, a microphone or the whole desktop: capture the Lens Studio window only, with ffmpeg gdigrab using title= or a fixed region of that window.

Do these, in order:
1. broll/preview-08-leaf-run.mp4: start a window recording in the background, then run floorcount-c1-start, floorcount-c3-again and floorcount-c7-step-card with run_leaf_scenario. The whole Lens Studio window in frame, with the preview running. If the LEAF panel is not visible and cannot be shown with the MCP tools (open_leaf_panel), film it anyway and say so. 25 to 40 seconds. H.264, yuv420p, 30 fps.
2. broll/preview-09-lens-studio-wide.mp4: the whole Lens Studio window with the preview running the basic step, 8 seconds, same settings.
3. Look at one extracted frame from each. Retake once if the window was covered. If it is still covered, stop and report; nothing else depends on these two.
4. Clear the saved session so the project is left as a first session: run floorcount-c9-session-memory, which ends by clearing it, on a fresh preview. Its result may have to be read from the log.
5. Save through the Editor API.
6. Write broll/PREVIEW-CLIPS.md: each file preview-01 to preview-09, its duration (use ffprobe), what it shows, audio status (all silent, the music is laid in during the edit), and anything wrong with it. Note for clips 01 to 07 that they were driven by the floorcount-capture scenario through the Lens's real answer guard. Plain language, no em-dashes, no local user paths.
```

## 6 November: LEAF on a fresh clone of the public repository

```text
Run the LEAF scenarios on a fresh clone of the public repository. Keep this tight: about 50 tool calls. Change nothing in the Lens.

Lens Studio is already open on the fresh clone at <fresh clone>/ (cloned from GitHub minutes ago) and the lens-studio MCP server is connected. Work only in that folder. Do not touch the working project.

Rules: install nothing; never call QueryRuntimeSceneTool or PreviewInteractTool. Do not run git. Do not start a shell command with `cd`. Do not move or click the mouse. Do not save the project: it is a throwaway clone. Do not edit any file.

LEAF's panel prints "Loaded 19 scenario(s) from preview" when it is ready, and a run dispatched before that line is lost. Pin LEAF to the preview, not a device (a phone and a headset may be attached). The preview slows down the longer it runs, so refresh it before the timing-sensitive scenarios (c2, c5, c8, c9, c13). If it goes silent, check PreviewPanelTool getConfig: "Preview is Paused" needs a refresh. A run that outlasts the MCP timeout may still have finished: read the result from the log.

1. Confirm the open project is the clone (Editor API project path) and that it compiled clean. If the wrong project is open, stop and say so.
2. Start the preview and confirm "Floorcount: session started" with no Floorcount errors.
3. Run floorcount-c1-start through floorcount-c17-teal-law once each, in order. Do not retry a failure more than once, and report any retry with its reason.
4. Finish with a plain report: the project path, the compile result, each scenario PASS or FAIL, and C2's sample count and BPM. Write nothing to disk.
```

## 6 November: four more preview clips

```text
Record four more preview clips of the Floorcount Lens for the submission video, then leave the project as it was. Do not change how the Lens looks or behaves. About 90 tool calls.

Project root: this folder (ARSpec.esproj). Lens Studio is open on it; the lens-studio MCP server is connected. Read broll/PREVIEW-CLIPS.md first: it says how the nine existing clips were made and what went wrong. Then read Assets/Tests/FloorcountCaptureScenario.ts, the capture helper you will extend, and the "Session memory and coverage" and "Validation" sections of devpost/design-pass-report.md for the camera positions.

Rules: install nothing; never call QueryRuntimeSceneTool or PreviewInteractTool. Do not run git. Do not start a shell command with `cd`. Do not move or click the mouse, and do not use tmp/mouse.ps1. Do not edit anything under Assets/Scripts/, or README.md, PHASE0.md, devpost/submission.md, or any existing clip. You may extend Assets/Tests/FloorcountCaptureScenario.ts with new `film-*` shots and nothing else. LEAF's panel prints "Loaded 19 scenario(s) from preview" when it is ready; a run dispatched before that line is lost. Pin LEAF to the preview, not a device. If the preview goes silent, PreviewPanelTool getConfig: "Preview is Paused" needs a refresh. Record with ffmpeg gdigrab over the Lens Studio window region only (the earlier clips used 1536x816 with the window maximised), never the webcam, a microphone or the whole desktop. 30 fps, H.264, yuv420p, silent. Look at one extracted frame from each clip before moving on, and retake once if it does not show what its name says.

The clips, each 1280x720 cropped to the preview like preview-01 to 07 unless said otherwise:
1. broll/preview-10-arrow.mp4, about 12 s. A first session running at Slow, camera on the pad as in preview-01. While recording, use MovePreviewCamera to turn the view up and away from both the pad and the step card, hold there 4 s so the arrow at the bottom of the view is on camera, then turn back down to the pad. Add a `film-running` shot to the capture scenario if you need one that only starts a session and leaves it running.
2. broll/preview-11-count-hides.mp4, about 14 s. Camera on the pad with the numeral and strip in frame. The session at Slow; the scenario waits for the answer window and pinches Got it once through the real guard, so the numeral and the strip hide while the prints keep lighting. Add a `film-got-it` shot for this.
3. broll/preview-12-left-turn.mp4, about 10 s. The third step, the left turn, running at Slow with its arc lighting on counts 6 and 7. A `film-left-turn` shot: master steps 1 and 2 with the guard off (not filmed), set the tempo back to Slow if the Lens allows it through its own rules or otherwise leave it at whatever tempo the rules give, turn the guard on, leave it running.
4. broll/preview-13-leaf-panel.mp4, about 30 s, the whole Lens Studio window at 1536x816. The LEAF panel's own tab on top (use the Editor API, IDockManager.activatePanels, as the last session did for the Preview tab), its list of scenarios visible, while floorcount-c1-start, floorcount-c3-again and floorcount-c7-step-card run and report PASS. If the preview stops rendering while its tab is hidden, the scenarios may still run; if they do not, say so, and film the LEAF tab for 8 s with its list and the results of the last run instead.

Then: clear the saved session so the project is left as a first session (run floorcount-c9-session-memory on a fresh preview, which ends by clearing it, or call clearSaved through the scenario), save through the Editor API, and append the four clips to broll/PREVIEW-CLIPS.md in the same format (duration from ffprobe, what it shows, what is wrong with it). Plain language, no em-dashes, no local user paths. If something cannot be captured after two honest tries, say so in the notes and move on; do not fake a clip from stills.
```

## 6 November: verifying the fixes from the code review

```text
Verify three small fixes in the Floorcount Lens, extend one LEAF scenario to cover them, run the whole sweep, and save. About 110 tool calls. Do not redesign anything; fix compile errors with the smallest change.

Project root: this folder (ARSpec.esproj). Lens Studio is open on it; the lens-studio MCP server is connected. Read devpost/design-pass-report.md, sections "Things worth knowing" and "Session memory and coverage, 6 November 2026", first.

Rules: packages are pinned (SIK 2.0, UI Kit 2.0, LEAF 2.0.2); install nothing; never call QueryRuntimeSceneTool or PreviewInteractTool. Do not run git. Do not start a shell command with `cd`. Do not move or click the mouse. Delete any "* 2.*" OneDrive duplicates in Assets/ before compiling. Do not edit devpost/design-brief.md, devpost/design-notes.md, README.md, devpost/submission.md, anything under .design/ or under tests/. Do not edit Assets/Scripts/ unless a scenario proves a bug in the three changes below, and if so say exactly what and why. LEAF's panel prints "Loaded 19 scenario(s) from preview" when it is ready; a run dispatched before that line is lost. Pin LEAF to the preview, not a device. Refresh the preview before c2, c5, c8, c9 and c13. If the preview goes silent, PreviewPanelTool getConfig: "Preview is Paused" needs a refresh. A run that outlasts the MCP timeout may still have finished; read its result from the log. Save through the Editor API after a clean compile, after the sweep, and at the end.

The three changes, already on disk, from an independent code review:
1. FloorcountMain.ts, the answer guard. An answer could be taken late in an 8-count (say on count 8) and another at the top of the next one, one beat later, which is two "in a row" with nothing danced between. `canAnswer` now also requires `COUNTS_PER_PHRASE - answerWindowCounts` beats (6) since the last answer (`answeredBeat`), and the capsules light from the same `canAnswer`, so bright means an answer would be taken. It also returns false while the music is paused.
2. FloorcountMain.ts `focusText` and FloorcountState.ts `reviewDue`: after the last step the fade line says "Once more at Full" only if a step has an Again to bring back; otherwise "Three steps done".
3. FloorcountState.ts `countsInWords`: more than three lost counts read as "4 counts" instead of a list that outgrows the card. FloorcountAudioController.ts: `startMusic` clears `useFallbackClock` so each track syncs to the player on its own. Nothing to verify in the preview for that last one beyond compiling and the sweep.

Do, in order:
1. Recompile, confirm "Floorcount: session started" with no Floorcount errors, save.
2. Extend Assets/Tests/FloorcountC8AnswerGuardScenario.ts (guard on, as it already runs) with two more checks, keeping everything it already asserts:
   a. Late answer, then the next window: wait for a count 7 or 8 of an 8-count from the second on, pinch Again there (it must be taken, `ignoredAnswers` unchanged), then wait for count 1 of the next 8-count and pinch Again again: it must be dropped (`ignoredAnswers` up by one, `state.againStreak` still 1) and `canAnswer` must be false while the capsules are at rest; then from count 7 of that 8-count on, `canAnswer` is true again. Print the beats it pinched on.
   b. Paused: wait for a window where `canAnswer` is true, pinch the title to pause, assert `canAnswer` is false and that a Got it is dropped (`ignoredAnswers` up by one, tempo unchanged), pinch the title to resume, and assert `canAnswer` comes back within the same or the next window.
   Use the test kit (`waitForCount`, `waitForBeat`, `pinch`); add a small helper to it only if needed.
3. Run the whole sweep: c1 to c17 and the two helpers, each once, refreshing before the timing-sensitive ones. Run c8 twice. A scenario that fails is reported as failing with its print; do not loosen an assertion to pass.
4. Check by hand, with the capture helper or a short session driven from a scenario, that the fade line after the last step of a session with no Agains reads "Three steps done" and with an Again reads "Once more at Full". Say what you saw.
5. Clear the saved session (floorcount-c9-session-memory ends by clearing it) so the project is left as a first session, and save.
6. Append a section "Review fixes, 6 November 2026" to devpost/design-pass-report.md: the three changes in a sentence each, what c8 now checks and the beats it printed, the LEAF table with PASS or FAIL for every scenario, what you saw in step 4, and the last save time. Plain language, no em-dashes, no local user paths.

If usage or time runs short: the sweep and the saves come first, then the report, then step 4, then the c8 extension (say so if it is missing).
```

## 6 November: answer-guard rerun

```text
Rerun one LEAF scenario on the Floorcount Lens now that the GPU is free, and record the result. About 25 tool calls. Change nothing in the Lens.

Project root: this folder (ARSpec.esproj). Lens Studio is open on it; the lens-studio MCP server is connected. Read the "Review fixes, 6 November 2026" section at the end of devpost/design-pass-report.md first: it explains that c8 failed only because the preview was throttled.

Rules: install nothing; never call QueryRuntimeSceneTool or PreviewInteractTool. Do not run git. Do not start a shell command with `cd`. Do not move or click the mouse. Do not edit anything except the report section named below. LEAF's panel prints "Loaded 19 scenario(s) from preview" when ready; a run dispatched before that is lost. Pin LEAF to the preview. A run that outlasts the MCP timeout may still have finished; read its result from the log.

1. Refresh the preview, wait for the panel's ready line, run floorcount-c2-beat and read its sample count from the log. If it is under 90 samples the preview is still throttled: write that number into the report section as "GPU still busy, c8 not rerun" and stop.
2. Otherwise refresh, then run floorcount-c8-answer-guard twice, refreshing between runs. Read every "[C8]" print from the Lens Studio log for both runs.
3. Append to the "Review fixes, 6 November 2026" section of devpost/design-pass-report.md a short subsection "c8 rerun" with the C2 sample count, each c8 run's result and its printed lines (the beats of the late answer and the dropped one, and the paused check). If c8 fails on a healthy preview, quote the failing assertion and say which part failed; do not edit the scenario or the Lens.
4. Clear the saved session if any scenario left one (floorcount-c9-session-memory clears it) and save through the Editor API.
```

## 6 November: final LEAF sweep on a fresh clone

```text
Run the LEAF scenarios on a fresh clone of the public repository. Keep this tight: about 60 tool calls. Change nothing in the Lens.

Lens Studio is already open on the fresh clone at <fresh clone>/ (cloned from GitHub minutes ago) and the lens-studio MCP server is connected. Work only in that folder. Do not touch the working project.

Rules: install nothing; never call QueryRuntimeSceneTool or PreviewInteractTool. Do not run git. Do not start a shell command with `cd`. Do not move or click the mouse. Do not save the project: it is a throwaway clone. Do not edit any file.

LEAF's panel prints "Loaded 19 scenario(s) from preview" when it is ready, and a run dispatched before that line is lost. Pin LEAF to the preview, not a device. The preview slows down the longer it runs, so refresh it before the timing-sensitive scenarios (c2, c5, c8, c9, c13). If it goes silent, check PreviewPanelTool getConfig: "Preview is Paused" needs a refresh. Check that the Lens Studio window is not minimised (IsIconic from PowerShell; restore with ShowWindow(handle, 9)), because a minimised window throttles rendering. A run that outlasts the MCP timeout may still have finished: read the result from the log.

1. Confirm the open project is the clone (Editor API `projectFile` or `projectDirectory`) and that it compiled clean. If the wrong project is open, stop and say so.
2. Start the preview and confirm "Floorcount: session started" with no Floorcount errors.
3. Run floorcount-c1-start through floorcount-c17-teal-law once each, in order, reading C2's sample count. If that count is under 90 the preview is throttled: say so.
4. Then run floorcount-c8-answer-guard twice more, three runs in all, refreshing before each. Read its "[C8]" prints for every run. It was changed today, so three runs matter here.
5. Do not retry any other failure more than once, and report any retry with its reason.
6. Finish with a plain report: the project path, the compile result, each scenario PASS or FAIL, C2's sample count and BPM, and for each c8 run the beats of the late answer and the dropped one. Write nothing to disk.
```
