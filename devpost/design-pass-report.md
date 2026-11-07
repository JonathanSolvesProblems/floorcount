# Floorcount design pass report

Applying `devpost/design-notes.md` to the built Lens, in Lens Studio 5.23.2, project `ARSpec.esproj`.
Everything below was checked in the Interactive Preview on the SPECS 27 device profile. No SPECS
device was used.

Date: 2 November 2026.

## What changed, in one paragraph

The footprints, the pad, the count display and the off-view arrow are now the drawn artwork from
`.design/brand/export/`, not code-built shapes, and everything in the Lens is ivory with teal on the
1 and nothing else. The single floating number became the clave strip with the numeral above it. The
step card lost its panel, its icons and its caption line and is now ivory text on the air with two
capsule targets. All colour, brightness and motion comes from one shared module,
`Assets/Scripts/FloorcountLook.ts`, which holds the tokens from `.design/manifest.json` and the
strike-and-decay curve that the prints, the cells and the arc all read.

## Note by note

### Colour and brightness (charter laws 1 to 5)

| Note | Applied | How, or why not |
|---|---|---|
| One ink, ivory `#F7EEDF`; remove every other colour | Yes | The cool-blue and warm-orange foot colours and the pale-yellow arc colour are gone, along with the `@input` fields that held them. Ivory is `IVORY` in `FloorcountLook.ts`. Textures are already ivory, so their materials carry a white tint and the texture's own ivory comes through unchanged. |
| Brightness is the hierarchy: 100 / 60 / 35 per cent | Yes | `STRIKE`, `AND`, `REST` in `FloorcountLook.ts`, set as the alpha of `baseColor`. Checked by test C2: over 148 samples no cell ever left the 35 to 100 range. |
| Teal `#5FB4E8` on exactly one thing: the count-1 cell and the count-1 print | Yes | Checked by C1 (`isFootTeal(1)` true, every other count false) and C2 (`isCellTeal(1)` true, cells 2 to 8 false). Nothing else in the Lens is teal. |
| Holds: nothing lights, the strip shows an outlined cell, no dimmed numeral | Yes | Cells 4 and 8 use `cell-empty.png` and never leave rest. The numeral is blank on 4 and 8 rather than dimmed. This changed what C2 asserts, see "The one test assertion I changed" below. |
| Nothing black, nothing darker than 40 per cent luminance | Yes | Every drawn thing in the Lens is ivory or teal at some alpha. The only dark colour anywhere is `#1A1612`, used in the margins of the screenshots, which the charter reserves for surfaces outside the Lens. |

### Footprints (laws 6 and 7)

| Note | Applied | How, or why not |
|---|---|---|
| Sole prints from `fp-left-solid.png` and `fp-right-outline.png` | Yes | Each print is a textured quad on the floor. The code-built foot mesh is gone. |
| Left solid, right outlined, at every brightness | Yes | The texture decides the foot, never the colour. |
| 27 x 10 cm, toes toward the direction of travel | Yes, with a measurement worth knowing | Each quad is 12 x 29 cm as the notes describe. The toes point the right way, but only after a fix: Lens Studio samples textures with v = 0 at the image's **bottom** row, so the first build landed every print heel-first. See "Things worth knowing". |
| Lit, "and" and rest are the same texture at 100 / 60 / 35, ivory or teal | Yes | One material clone per print, alpha driven by the beat. |
| Pinched mark: flash to 100 per cent once, then rest with a 1 cm ivory ring at 50 per cent | Yes | The old six-cycle pulse is gone; a pinch now strikes once and decays on the same curve as a count. The ring is a second quad of the same print scaled to stand 1 cm outside it, drawn at 50 per cent while the count stays marked. No red. |

**Measured, and not quite as specified.** The two print images are not the same size inside their
boxes. In a 12 x 29 cm box at 40 px/cm, the solid left print's ink measures 8.5 x 26.6 cm and the
outlined right print's ink measures 10.0 x 28.1 cm, because its stroke sits outside the 27 cm path.
Both are centred in their box, so they sit correctly on the floor, but the right print reads about
5 per cent longer and 18 per cent wider than the left. I kept the 12 x 29 cm quads the notes specify
rather than scaling one print to match the other. If the two should read identically, the fix
belongs in the export, not in the Lens.

### The pad (law 8)

| Note | Applied | How, or why not |
|---|---|---|
| 90 x 90 cm, 4 cm corner radius, 1 cm ivory border at 50 per cent, `pad-border.png` | Yes | One 90 x 90 cm quad on the floor. The object is now called `PadBorder` rather than `PadOutline`. |
| Parquet grain `parquet.png` tiled at 30 cm, ivory at 12 per cent | Yes | Built as a 3 by 3 grid of 30 cm quads, each with its own 0 to 1 coordinates, in a new `PadGrain` object. A tiled UV would have needed a Repeat wrap mode on the texture asset, and nine quads needs no import setting at all. |
| Nothing else on the pad: no grid, no centre mark | Yes | |
| Turn arc: ivory, 1.5 cm stroke, 100 per cent on its counts, 35 per cent otherwise, capsule-ended | Mostly | Colour, widths and the two brightnesses are as written, and the arc no longer rises on the "and" (that rise would have made it read as visible on count 1, which the done criterion forbids). The shape differs: instead of a plain capsule-ended stroke, it tapers from 1.5 cm to 0.3 cm and both ends are rounded. The brief asks the arc to show the direction of the spin and the old build did that with an arrowhead, which law 19 bans as a sharp point. A rounded taper keeps the direction readable and keeps the law. It is also what law 19's own reason describes: the claves have rounded ends and a slight taper. |

### The count display (law 18)

| Note | Applied | How, or why not |
|---|---|---|
| Strip 40 cm above the far edge of the pad, facing the user, numeral above it | Yes | The `CountNumber` object keeps its name and its position (0, -110, -115), which is 40 cm above the floor at the pad's far edge. The strip sits at that height and the numeral's centre is 11.5 cm above it. |
| Eight capsule cells 6 x 3 cm, gap 1.5 cm, 58.5 cm wide, `cell.png` and `cell-empty.png` for 4 and 8 | Yes | C2 asserts the strip measures 58.5 cm. |
| Cell 1 teal, the rest ivory; the current count at 100 per cent, others at 35 per cent | Yes | Driven by the same `brightnessFor` call the prints use, from the same beat, so a cell and its print strike together. |
| Numeral 14 cm cap height, Atkinson ExtraBold, ivory, one digit, blank on 4 and 8 | Yes | Cap height is computed from the font's own metrics: Atkinson Hyperlegible Next puts its cap height at 0.668 of the em square, read from the OS/2 table of both weights. |

### Type (laws 11 to 13)

| Note | Applied | How, or why not |
|---|---|---|
| Import both fonts into `Assets/Fonts/`, use them for every Text | Yes | They were already imported. Every Text component in the Lens now sets `font` explicitly: ExtraBold for the numeral and the two button labels, Medium for everything else. No Text is left on the default face. |
| No text under 2.5 cm cap height at 1 m | Yes | The smallest is 2.5 cm, used only by the summary rows. |
| No text block over two lines | Yes | Every line is one line. |

**The manifest's type scale on the step card is the one place I did not follow the notes literally.**
The manifest asks for a 6.75 cm step name, a 4.5 cm progress line and a 10 cm button label. Measured
in the preview, "Basic step" at 6.75 cm cap height draws about 53 cm wide and runs off both sides of
the glasses' field of view at 1 m, and a 10 cm cap height label cannot sit on a 5 cm capsule at all.
That scale was authored for the brand sheet, which is a flat board, not for a card a metre away. I
kept its order and its 3 cm body size and set the rest to the largest that fits:

| Role | Manifest | Used | Why |
|---|---|---|---|
| Step name | 6.75 cm | 5 cm | "Practise again" at 5 cm is 55 cm wide, which fits the 60 cm card. |
| Progress line | 4.5 cm | 3.5 cm | Keeps it clearly above the body size. |
| Tempo and focus | 3 cm | 3 cm | Unchanged. |
| Button label | 10 cm | 3 cm | 10 cm cannot fit a 12 x 5 cm capsule. 3 cm is above law 13's 2.5 cm floor and sits comfortably in a 5 cm capsule. |
| Summary rows | 4.5 cm | 2.5 cm while the summary is up | "Right turn: 4 Agains, lost it on 2 and 5" is the longest string the card ever carries. At 2.5 cm, law 13's floor, it fits the card; at anything larger it would be wider than the pad, which law 16 forbids. |

The card's layout width went from 30 cm to 60 cm for the same reason. That is still two thirds of the
pad, so law 16 ("never wider than the pad") holds.

### The step card (laws 14 to 17)

| Note | Applied | How, or why not |
|---|---|---|
| No opaque or dark panel | Yes | The UI Kit `BackPlate` is gone and so is the rest of UI Kit on this card. |
| Ivory text on the air, left-aligned, 95 cm high, 1 m away, right of the pad | Yes | The `StepCard` object keeps its name and its position (54, -55, -64), which is 95 cm above the floor and 1 m from the start position. |
| Two capsules 12 x 5 cm, Again left and Got it right, 30 per cent ivory capsule behind each | Yes | The capsule is a built rounded-rectangle mesh, so the ends are true semicircles rather than a stretched texture. |
| Bright only during the two-count answer window, 35 per cent otherwise; no hover glow, no pulsing | Yes | Label alpha 100 or 35 per cent, capsule alpha 30 per cent times the same factor, so the capsule never exceeds law 16's 30 per cent ceiling. |
| Remove the Material icons and the pause icon | Yes | All four `Assets/Icons/*.png` references are gone. The files are still on disk and nothing references them; I left them for you to delete rather than removing assets you did not ask me to remove. |
| Remove the frosted panel background and the caption under the buttons | Yes | The string "After each 8-count: Again or Got it" is gone. The Text object it lived in is still there and now only carries the summary's one instruction line, "Pinch the title to practise again"; during practice it is empty. Without it nothing would say how to restart from the summary. |
| Strings from `voice.md` | Yes | Listed below. |

Strings now on the card:

- Title: "Basic step" / "Right turn" / "Left turn", and "Practise again" at the end.
- Progress: "Step 1 of 3".
- Tempo: "Slow, 140" / "Medium, 170" / "Full, 190" (was "Slow tempo, 140 BPM").
- Focus: "Whole step" / "Counts 1 to 4 only" / "Counts 5 to 8 only" / "2 of 3 clean at Full" /
  "Next: right turn" / "Once more at Full".
- Summary rows: "Basic step: 1 Again", "Right turn: 0 Agains", and ", lost it on 2, 5" appended when
  there are marks.

Two strings were off the voice and are fixed. The fading line read "Got it! Next step coming up",
which is praise and ends in an exclamation mark, both banned; it now reads "Next: right turn", which
is `voice.md`'s own sample line 4. The review line read "Once more at Full tempo (most Agains)" and
now reads "Once more at Full". There is no "!" anywhere in the Lens.

**One thing the card lost.** With the pause glyph gone, nothing on the card shows that the session is
paused. The music stopping and the counts freezing are the only feedback. The notes ban the stock
icon set and give no replacement, so I left it rather than inventing a string.

### Motion (laws 9 and 10)

| Note | Applied | How, or why not |
|---|---|---|
| Rise 35 to 60 per cent on the "and", strike 100 per cent with no attack, decay `0.35 + 0.65 * exp(-4t)` over one beat | Yes | One function, `brightnessFor`, used by the prints and the cells. C2 asserts the curve directly: `decayed(0)` is 1.0, `decayed(1)` is 0.35, the value half a beat before a count is 0.60, a quarter beat before is 0.35, and a hold stays at 0.35 at every beat position. |
| The two-count fade between steps stays | Yes | Untouched. |
| Nothing else animates | Yes | Three things were removed: the footprints brightened by 0.2 when the hand aimed at them, the off-view arrow pulsed on a sine, and a pinched footprint pulsed six times. The brief asks for targets that "highlight when aimed at", which laws 10 and 19 do not allow; SIK's own cursor still shows where the hand is pointing. |

### The arrow (law 17)

| Note | Applied | How, or why not |
|---|---|---|
| `arrow.png`, ivory at 60 per cent, 6 cm, bottom of the view only while the pad is out of view, no bounce | Yes | Checked in the preview: with the head level the chevron sits low in the view pointing down at the pad, rounded ends, no movement. The code-built chevron mesh and the pulse are gone. |

### Check before saving

- Pad with lit footprints from the start position at 1280 x 720: done, see below.
- No colour other than ivory and teal in the scene: yes.
- No panel wider than the pad: the card lays out in 60 cm against the pad's 90 cm, and there is no
  panel at all, only the two 12 cm capsules.
- No text with "!": yes.

### Lens icon

Attempted, applies, does not persist. The Editor API does expose an icon setting:
`model.project.metaInfo.setIcon(path)`. Calling it with `.design/brand/export/icon-512.png` works in
the running session (`isIconSet` goes true, `iconPath` becomes `Cache/icon.png`, and that file is now
byte-for-byte the brand icon, SHA-256 `35d78c36...`). But `project.save()` puts `isIconSet` back to
false and `iconHash` in `ARSpec.esproj` stays empty, so the setting is not written to the project.
The Lens icon appears to be publish metadata that only the Publish dialog writes. It needs setting
there by hand before submitting.

## LEAF results after the pass

All seven scenarios were run in the Lens Studio preview through the LEAF panel, in order, in a single
sweep on 2 November 2026 between 16:04 and 16:06 local time. The measured values are from that
sweep's log.

| # | Scenario | LEAF id | Result |
|---|---|---|---|
| 1 | Pad on the floor 70 cm ahead, the basic step's prints at real size, music at Slow | `floorcount-c1-start` | **PASS** |
| 2 | Each print lights on its count in time with the music, nothing on 4 and 8, the display follows the count | `floorcount-c2-beat` | **PASS** |
| 3 | Again twice drops the tempo and shows counts 1 to 4 only | `floorcount-c3-again` | **PASS** |
| 4 | Got it three times at Full loads the right turn and its arc shows on the turn counts | `floorcount-c4-next-step` | **PASS** |
| 5 | Pinching a print flashes it; the worst step replays; the floor clears and the card shows each step's Agains | `floorcount-c5-mark-and-summary` | **PASS** |
| 6 | Looking away from the pad shows an arrow pointing back to it | `floorcount-c6-off-view-arrow` | **PASS** |
| - | Capture helper, holds the session on one count for a screenshot | `floorcount-hold-on-count` | **PASS** (not a done criterion) |

What the sweep measured:

- **C1.** Pad 70.0 cm ahead and 150.0 cm below the eyes. The sole print's quad measures 29.0 cm at
  scale 1.00 with the 27 cm print inside it. Teal is on count 1's print and on no other. `PadBorder`
  and `PadGrain` both present and enabled. Six counts on the floor, none on 4 or 8, 30 cm stride.
  Tempo level 0, 140 BPM, music playing.
- **C2.** 148 samples over 8.01 s, 18.75 beats, measured 140.4 BPM against the 140 BPM loop. Zero
  mismatches on lit prints, zero on the hold counts, zero on the numeral, zero cells lit on a hold,
  zero brightness values outside 35 to 100 per cent, and the brightest a cell reached on its own
  count was 0.99. Six clave hits. The motion curve asserted exactly, as above.
- **C3.** One Got it raised Slow to Medium, one Again changed nothing, the second Again dropped back
  to Slow and set counts 1 to 4; nothing outside 1 to 4 lit over a further 4 s; the card read
  "Counts 1 to 4 only".
- **C4.** Three Got its at Full moved to fading, then loaded step 2, "Right turn", with its pivot
  print `Footprint_C2`; sampling a whole phrase, the arc was visible on counts 2 and 3 and no others.
- **C5.** Pinching `Footprint_C1` set it flashing and recorded the mark, which survived the flash.
  Driving a whole session, the review came back on the basic step at Full with the floor still up,
  then the floor cleared, the title became "Practise again" and the rows read "Basic step: 1 Again",
  "Right turn: 0 Agains", "Left turn: 0 Agains".
- **C6.** With the preview head level the pad was 65.0 degrees off the view axis against the 24 degree
  threshold and the arrow was showing, 60.0 cm ahead and 9.0 cm below the view centre, pointing at
  the pad with an agreement of 1.000. Moving the pad onto the view axis hid it.

### The one test assertion I changed

C2 used to assert the count number reads the current count on every count including 4 and 8. The
notes and charter law 5 say a hold is a rest and the numeral is blank on 4 and 8, which contradicts
that. I applied the note and changed the assertion: the numeral now has to read the count on every
stepping count **and** be blank on every hold, and the strip's hold cells have to stay at rest. Both
halves are asserted, so the criterion is still tested, but the brief's done criterion 2 as written
("the count number above the pad shows the current count") is now true on the six stepping counts and
deliberately not on the two holds.

Nothing else in the scenarios changed except C1, where the real-size check had to move from the old
code-built mesh to the textured quad. It now measures the quad at 29.0 cm, checks the object's world
scale is 1 so centimetres of mesh are centimetres of floor, and checks the print inside the box is
27 cm with 1 cm of transparent margin at each end.

### Still not covered by a test

Unchanged from the build report, plus one more:

- The spatial placement of the sound.
- Pinching the card title to pause and resume.
- Whether the footprints and the card are comfortable over a real session. Only real glasses can say.
- **New:** nothing asserts the 1 cm mark ring is drawn after a pinch, only that the mark is recorded
  and the flash runs. `isMarkRingShown` exists on the pad controller if you want to add it.

## Screenshots

In `devpost/shots/`, each 1280 x 720:

| Path | What it shows |
|---|---|
| `devpost/shots/pad-count1-teal.png` | From the start position looking down at the pad on count 1: the numeral "1", the clave strip with the teal cell 1 struck, and the left-foot sole print struck in teal at the forward spot, with the home pair at rest. |
| `devpost/shots/pad-count5-lit.png` | The same view tipped further down, on count 5: the strip's cell 5 struck in ivory, cell 1 teal at rest, and the right foot's outlined print struck at the back spot. |
| `devpost/shots/step-card-answer-window.png` | The step card during the answer window: "Basic step", "Step 1 of 3", "Slow, 140", "Whole step", and the Again and Got it capsules bright. No panel, no icons, no caption. |

How they were made, so they can be reproduced. The SPECS 27 preview renders a square 1590 x 1590
frame, so each image is that frame scaled to 720 high and centred on a 1280 x 720 canvas; the side
margins are `#1A1612`, the brand's ground colour for surfaces outside the Lens. The top 80 rows are
cropped because LEAF draws its result banner there and it does not clear. Each shot is a real frame
of a running session, not a mock-up: the `floorcount-hold-on-count` scenario waits for the strike of
the count you ask for and then pauses the music, which freezes the beat clock so the pad, the strip
and the card all keep drawing that one beat. The count-1 freeze also opens the answer window, which
is why the card shot has its buttons bright. The thick ivory hook below the buttons in the card shot
is SIK's own mouse cursor in the Interactive Preview, not part of the Lens.

The two shots from the functional build, `pad-lit-footprints.png` and `step-card-and-arrow.png`, are
still in the folder. They show the Lens before this pass and `devpost/build-report.md` refers to them.

## Things worth knowing

**The base texture would not bind at runtime.** `FloorcountUnlit.mat` is built on the project's unlit
graph shader, which keeps its base texture behind a static define, `ENABLE_BASE_TEX`, that was off.
Setting `mainPass.ENABLE_BASE_TEX` and `mainPass.baseTex` from a Lens script reports success and does
nothing: the define is compiled into the shader variant, so the assignment lands on a plain
JavaScript property instead of a shader uniform, and every quad drew as a flat colour fill. The fix
was to author the binding instead of setting it at runtime. There are now seven material assets in
`Assets/Materials/`, one per texture, each created from `UnlitMaterialPreset` with the define enabled
and the texture bound through asset-graphql. The scripts clone one of these per drawn thing and only
ever change `baseColor`. Blend mode, depth write and two-sidedness are still set at runtime, which
works because they are real pass properties.

**Texture v runs bottom-up.** Lens Studio samples a texture with v = 0 at the image's bottom row. The
first build mapped v = 0 to the image's top and every sole print came out heel-first with its toes
pointing back at the dancer. This is a single constant in `FloorcountLook.ts` and the comment there
says what it cost to find.

**A duplicate that was a rename.** `asset-graphql`'s `duplicateAsset` renamed `FloorcountUnlit.mat`
to the new name and left the copy sharing the source's asset id, rather than making an independent
copy. I put the name back and deleted the stray copy before going on, and used
`createAssetFromPreset` instead. `Assets/FloorcountUnlit.mat` is unchanged and still has its original
id `81dcfcd5-11f4-4e97-9c41-9e98b3cf7976`.

**Packages were not touched.** Spectacles Interaction Kit 2.0.0, Spectacles UI Kit 2.0.0 and LEAF
2.0.2 are installed, as before. Nothing was installed and `QueryRuntimeSceneTool` was never called.
The step card no longer imports UI Kit, but the package is left installed.

**No OneDrive duplicates.** `Assets/` and `Packages/` were checked for files named "* 2.ts" or
"* 2.png"; there are none.

**The scene was barely touched.** No object was moved, added or removed by hand. Every name a LEAF
scenario looks up is unchanged: `FootprintPad`, `CountNumber`, `StepCard`, `FloorcountAudio`,
`OffViewArrow`, `FloorcountMain`, `Footprint_C1`, `Footprint_C2`, `Footprint_C3_6`, `Foot`,
`AgainButton`, `GotItButton`, `TitleButton`. Inside the pad, `PadOutline` is now `PadBorder`, there
is a new `PadGrain`, and `MarkHalo` is now `MarkRing`; no test refers to those. Several `@input`
fields were removed from the components (the foot colours, the arc colour, the dim opacities, the
caption string, and the base material references, which are now resolved by path). The scene's old
values for them are simply ignored.

## Files

New:

- `Assets/Scripts/FloorcountLook.ts`: the tokens, the brightness curve, the mesh builders, the
  fonts and the materials. Everything visual reads from here.
- `Assets/Materials/Floorcount{FootLeft,FootRight,Cell,CellEmpty,PadBorder,Parquet,Arrow}.mat`
- `Assets/Tests/FloorcountHoldOnCountScenario.ts`: the screenshot helper.

Changed: `FloorcountPadController.ts`, `FloorcountCountUI.ts`, `FloorcountStepCardUI.ts`,
`FloorcountOffViewArrow.ts`, `FloorcountMain.ts`, `Assets/Tests/FloorcountC1StartScenario.ts`,
`Assets/Tests/FloorcountC2BeatScenario.ts`, `Assets/Tests/LeafIndex.ts`.

Unchanged: `FloorcountSteps.ts`, `FloorcountState.ts`, `FloorcountAudioController.ts`, the four other
scenarios, the test kit, and every sound file. No footwork, tempo or session rule changed in this
pass.

## Saves

The project was saved through the Editor API (`model.project.save()`) at each milestone: after the
seven material assets were created, after the scene and script changes, after the LEAF sweep, twice
more during the Lens icon attempt, and once at the end. The last save returned successfully at 16:07
local time on 2 November 2026 and reported
`ARSpec.esproj`. After it I recompiled
and refreshed the preview once to confirm the saved project still runs clean: it registered all seven
scenarios, started the session at Slow 140 BPM and logged no errors. That changed no project file,
so nothing in the project has changed since the last save.

## Card fix, 2 November 2026

The heading is the one I was asked for. The work in it actually ran on **3 November 2026**: the first
attempt was cut off partway through editing `FloorcountStepCardUI.ts` on 2 November and this is the
session that finished it. Every time below is local time on 3 November unless it says otherwise.

### Where the cut-off run stopped

`Assets/Scripts/FloorcountStepCardUI.ts` was half-written. `setFocus` and `setPaused` both called a
`showFocusLine` method that did not exist, and that was the only thing the compiler objected to.
Everything else that run had written was sound, so I kept it and wrote the missing method rather than
starting the file again. `showFocusLine` is now the single place that decides what the focus line
says: the paused words while the session is held, the focus text Main pushed in otherwise.
`showPractice` goes through it too, so the two can never disagree.

### The textures were already reimported

Nothing to do. Lens Studio picked up all three the minute they changed on disk, while it was still
open on 2 November:

| Texture | Cached copy | Compressed texture rebuilt |
|---|---|---|
| `fp-right-outline.png` | byte-identical to disk, SHA-256 `4f06d011...` | 16:13, 2 November |
| `pad-border.png` | byte-identical to disk, SHA-256 `3cae7904...` | 16:12, 2 November |
| `cell-empty.png` | byte-identical to disk, SHA-256 `65ee6a6c...` | 16:12, 2 November |

The materials still bind them, by the same asset ids they had before: `f0726ba2` into
`FloorcountFootRight.mat`, `dfe8af23` into `FloorcountCellEmpty.mat`, `51bc262c` into
`FloorcountPadBorder.mat`. Overwriting a PNG in place keeps the asset id, so no binding could have
broken. The thicker strokes are visible in both pad screenshots: compare the empty cells 4 and 8 in
the strip, and the outlined right prints, against the versions from 2 November.

### Two faults behind the screenshot, neither of them in the strings

**The scene still said the card was 30 cm wide.** The script's default and the 2 November report both
say 60, but the value saved in the scene was still 30, so 30 is what the Lens ran with. On a 30 cm
card there is room for two capsules of (30 - 6) / 2 = 12 cm, which is the floor the capsules were
already at, while the labels measure 13.8 and 13.7 cm. Each label was therefore 0.9 cm wider than its
own capsule on each side, which is exactly the "Again Got it" fault: the ink overflowed both capsules
and the two capsules nearly touched. I set the scene's `panelWidthCm` to 60.

**The ink alignment measured a stale mesh.** A Text's mesh lags a `layoutRect` change by a frame. The
fit was setting the new layout boxes and then measuring the ink in the same frame, so it compared a
new box against an old mesh and pushed every line 10.23 cm to the right of the capsules. The card's
four lines stayed in order among themselves, which is why it was not obvious, but the button row sat
10 cm off to the left of them. The fix is to read each line's ink bearing against the box its mesh
was actually built with, before the boxes move, then take that bearing off. It is a one-pass fit with
no stale state and it does not drift on a second pass.

### What the card measures now

Measured in a running session by the new `floorcount-c7-step-card` scenario, in the card's own space:

| | Value |
|---|---|
| Labels | 13.8 cm (Again), 13.7 cm (Got it) |
| Capsules | 16.8 cm each, both the same so neither reads as the bigger target |
| Air inside each capsule | 1.50 cm and 1.52 cm per side, against the 1.5 cm asked for |
| Clear space between the capsules | 6.00 cm |
| Card width | 39.5 cm, set by the button row, under the 60 cm allowed and the pad's 90 |
| Left edge of all four lines | -19.76 cm |
| Left edge of the Again capsule | -19.76 cm |

The card is now made as wide as the widest thing on it, and the block is centred on the card's place
in the room, so a left-aligned block still sits over where the card was put instead of hanging off to
one side of it.

The ink bearings taken off the four lines are -1.21, -0.85, -0.72 and -0.72 cm, a constant -0.242 of
each line's own cap height. That is why aligning the layout boxes alone was not enough: the title,
being the biggest, hung about 5 mm further left than the lines under it.

### The screenshot still leans, and that is the camera

Measured on the published `step-card-answer-window.png`, the first column of ink in each line is at
x = 405, 417, 423 and 429. That is 24 px of convergence across the four lines on a 1280 x 720 canvas.
It is not a layout fault. The card is an upright plane read by a camera pitched 36.5 degrees down, so
a world vertical leans toward the nadir. The eye-to-line distances are 93.2, 97.0, 99.9 and 102.7 cm
and the offsets go as one over the distance, which predicts the last line at x = 433 against the 429
measured. In the card's own space all four sit on one edge, to the millimetre, which is what C7
asserts. What changed is the cause: before the fix the lines were centred, so each line's left edge
depended on its own width and the four stair-stepped by a different amount each.

If a dead straight edge in the screenshot matters more than a correct one in the room, the only
honest way to get it is to shoot the card from level with it rather than from the dancer's eyeline,
and that is a different shot from the one asked for.

### The rest of the card

- Tempo line reads "Slow, 140 BPM", "Medium, 170 BPM", "Full, 190 BPM".
- The three body lines (progress, tempo, focus) are ExtraBold. The title stays Medium at 5 cm.
- Paused, in words: while the session is held the focus line reads "Paused. Pinch the title to go
  on." and the focus text comes back on resume. The sentence measures 71.8 cm at the 3 cm body size,
  so it is drawn at 2.51 cm cap height, which fills the 60 cm card exactly and stays just above
  charter law 13's 2.5 cm floor. It is the one line that runs the full width of the card, and it is
  left out of the card's own width so that holding the session does not drag the whole block sideways.

### LEAF results

Eight scenarios, run in the Lens Studio preview through the LEAF panel, in order, after the final code
change. All eight pass.

| # | Scenario | LEAF id | Result |
|---|---|---|---|
| 1 | Pad on the floor 70 cm ahead, the basic step's prints at real size, music at Slow | `floorcount-c1-start` | **PASS** |
| 2 | Each print lights on its count in time with the music, nothing on 4 and 8, the display follows the count | `floorcount-c2-beat` | **PASS** |
| 3 | Again twice drops the tempo and shows counts 1 to 4 only | `floorcount-c3-again` | **PASS** |
| 4 | Got it three times at Full loads the right turn and its arc shows on the turn counts | `floorcount-c4-next-step` | **PASS** |
| 5 | Pinching a print flashes it; the worst step replays; the floor clears and the card shows each step's Agains | `floorcount-c5-mark-and-summary` | **PASS** |
| 6 | Looking away from the pad shows an arrow pointing back to it | `floorcount-c6-off-view-arrow` | **PASS** |
| 7 | **New.** One left edge, capsules fitted and apart, paused line in words | `floorcount-c7-step-card` | **PASS** |
| - | Capture helper, holds the session on one count for a screenshot | `floorcount-hold-on-count` | **PASS** (not a done criterion) |

What the sweep measured, where it differs from 2 November:

- **C2.** 125 samples over 8.02 s, 18.64 beats, 139.4 BPM against the 140 BPM loop. Zero mismatches on
  lit prints, hold counts, the numeral and the hold cells, zero brightness values outside 35 to 100
  per cent, and the brightest a cell reached on its own count was 0.99.
- **C6.** Pad 65.0 degrees off the view axis against the 24 degree threshold, arrow showing 60.0 cm
  ahead and 9.0 cm below the view centre, pointing agreement 1.000, and it hides once the pad is back
  on the axis.
- **C7, new.** The seven numbers in the table above, then: pinching the title pauses the audio and
  turns the focus line into "Paused. Pinch the title to go on." at 2.51 cm cap, and pinching it again
  resumes and puts "Whole step" back.

C7 closes two of the gaps the 2 November report listed under "Still not covered by a test": pinching
the card title to pause and resume, and the card's own measurements. The others are unchanged.

### Screenshots

All three overwritten, each 1280 x 720, each the square 1590 x 1590 preview frame with its top 80 rows
cropped off the LEAF banner, scaled to 720 high and centred on a `#1A1612` canvas. The compositing step
is `tmp/compose_shot.py` so it can be repeated.

| Path | What it shows | Camera |
|---|---|---|
| `devpost/shots/step-card-answer-window.png` | The card during the answer window: "Basic step", "Step 1 of 3", "Slow, 140 BPM", "Whole step" on one left edge, and the two fitted capsules bright | From the start position, turned to the card |
| `devpost/shots/pad-count1-teal.png` | Count 1: the numeral, the strip with cell 1 teal and struck, the left sole print struck in teal, and the thicker outlines on cells 4 and 8 and on the right prints | From the start position, looking down at the pad |
| `devpost/shots/pad-count5-lit.png` | Count 5: the whole strip, the numeral "5", and the whole lit right print, all inside the frame | 75 cm behind the start position |

**Why the count-5 shot is not from the start position.** From where the dancer stands, the top of the
numeral sits 38.5 degrees below the horizon and the near edge of count 5's print sits 80.3 degrees
below it, because that print is at the near edge of the pad, almost under the dancer's own feet. That
is a 41.8 degree span and the preview's frame covers 36.3 degrees, so the two cannot be in one frame
from there. The 2 November shot resolved it by cutting the numeral off entirely. I stepped the camera
back 75 cm instead, which brings the span to 32.7 degrees, and turned 6 degrees left so the step card
stopped bleeding into the top right corner. The background behind the pad is a different part of the
preview room as a result.

### Things worth knowing

**The ivory hook below the buttons is the off-view arrow, not a cursor.** The 2 November report called
it "SIK's own mouse cursor in the Interactive Preview, not part of the Lens". That was wrong. It is
`OffViewArrow`, drawn because the dancer has turned away from the pad to read the card, which is
charter law 17 doing its job, and C6 asserts the same element in the same place. I framed the card
shot so it sits clear below the capsules rather than touching the Again capsule as it did before.

**A preview tool installed two packages without asking.** `PreviewInteractTool`, which I tried once to
move the cursor aside, silently wrote `AiPreviewAgentInspect.lspkg` and `AiPreviewAgentInteract.lspkg`
into `Packages/` and left the preview unable to compile. I removed both through `assetManager.remove`.
The saved scene never referenced them: it was written at 08:10:49, the packages landed at 08:11:19,
and the file contains no reference to either. Installed packages are back to the pinned set,
Spectacles Interaction Kit 2.0.0, Spectacles UI Kit 2.0.0 and LEAF 2.0.2, alongside the Bitmoji 3D,
Icons and Motion packages that were already there, and every package file on disk still pre-dates
3 November. `QueryRuntimeSceneTool` was never called.

**The Lens recenters onto the preview camera.** `FloorcountMain.recenter` moves the whole floor layout
to the preview camera's position and heading on frame 3 of every Lens reset. Anything that resets the
Lens, including each LEAF run, therefore re-pins the layout to wherever the camera is pointing at that
moment. To capture a known frame the camera has to be at the start position when the Lens resets, and
only then aimed at the subject. Aiming first puts every authored coordinate 40 degrees out.

### Files

Changed: `Assets/Scripts/FloorcountStepCardUI.ts`, `Assets/Tests/LeafIndex.ts`, and the `panelWidthCm`
input on the `StepCard` object in `Assets/Scene.scene` (30 to 60).

New: `Assets/Tests/FloorcountC7StepCardScenario.ts`, `tmp/compose_shot.py`.

Unchanged: every other script, every scenario, every texture, every material, every sound. No object
was added, removed or renamed, and every name the LEAF scenarios look up is still there.

### Saves

Saved through the Editor API (`model.project.save()`) four times, all on 3 November 2026, local time:
07:46:01 after checking the textures, 07:54:55 after the card, 08:10:49 after the LEAF sweep, and
**08:17:19 last**, after the screenshots. `ARSpec.esproj` and `Assets/Scene.scene` were both written at
08:17:18 and the saved scene carries `panelWidthCm: 60.000000`. The only thing done after that save was
deleting the intermediate capture PNGs out of `tmp/`, which is outside the project's assets and
git-ignored, so nothing in the project has changed since.

## Polish, 3 November 2026

Three changes, in the same session as the card fix above and a little later the same morning. All
times below are local time on 3 November.

### 1. The arrow stays away while the card is being read

The off-view arrow showed whenever the pad was out of view. Turning to read the step card counts as
the pad being out of view, so the arrow appeared under "Got it", close enough to the capsule to read
as a tick rather than as a way back to the floor. The 3 November note above spotted it in the
screenshot and framed around it; this removes the cause.

The rule is now that both of the Lens's surfaces have to be away: the arrow shows only when the pad
**and** the step card are each more than `showAngleDeg` (24 degrees) off the view axis. It is the
same angle test on both, now in one `angleFromView` helper in `FloorcountOffViewArrow.ts`, and the
two angles it last read are kept on the component as `padAngleDeg` and `cardAngleDeg` for the test.

The arrow learns about the card from Main, not from a new `@input`. Main already holds a reference
to both and already pushes `needed` into the arrow every frame, so `offViewArrow.cardTarget` is set
once in `FloorcountMain.onAwake` beside the other wiring. That keeps the saved scene untouched: no
object reference had to be added to `OffViewArrow` in `Assets/Scene.scene`. Until the field is set
the card counts as out of view, so the component on its own behaves exactly as it did before.

`floorcount-c6-off-view-arrow` now covers both branches, and asserts first that Main did the wiring,
so the card half of the rule cannot silently never fire. Measured in the sweep:

| What the scenario did | Pad | Card | Arrow |
|---|---|---|---|
| Pad put on the floor 70 cm ahead, card left on the layout | 65.0 deg | 84.8 deg | **shown** |
| Card moved onto the view axis, pad not touched | 65.0 deg | 0.0 deg | **hidden** |
| Card put back on the layout | 65.0 deg | 84.8 deg | **shown** |
| Pad moved onto the view axis, card riding along with the layout | 0.0 deg | 45.6 deg | **hidden** |

Rows two and three are the new pair: the pad does not move between them, so it is the card alone
that hides the arrow and the card alone that brings it back. Row four keeps the old branch and now
also checks the card is still away, so the pad alone is what hides it there. The scenario saves the
card's local position at the start and puts it back at the end, next to the layout root it already
restored.

### 2. One weight on the step card

The title was the last thing on the card in Medium while the three lines under it were ExtraBold.
It is now ExtraBold as well, at the same 5 cm cap height. Two weights on a four-line card read as
two voices, and size already says which line is the title.

The fit runs on the first frame as it did before and settles on the same numbers, because the
heavier title measures 39.5 cm, the same width as the button row that was already setting the card:

| | Value | Against 3 November |
|---|---|---|
| Labels | 13.8 cm (Again), 13.7 cm (Got it) | unchanged |
| Capsules | 16.8 cm each | unchanged |
| Air inside each capsule | 1.50 cm and 1.52 cm per side | unchanged |
| Clear space between the capsules | 6.00 cm | unchanged |
| Card width | 39.5 cm | unchanged |
| Left edge of all four lines, and of the Again capsule | -19.76 cm | unchanged |
| Title line width | 39.5 cm | wider, it is the heavier face |

C7 asserts the left edge and the capsule air and passes on both. The ink bearings the fit takes off
the four lines are still -1.21, -0.85, -0.72 and -0.72 cm, a constant -0.242 of each line's own cap
height: the two weights of Atkinson Hyperlegible Next carry the same side bearing in proportion to
their size, so changing the face did not move the edge.

### 3. A bigger clave strip

The cells go from 6 by 3 cm to 8 by 4 cm and the gaps from 1.5 to 2 cm, so the strip measures
78 cm across instead of 58.5. It is still well inside the pad's 90 cm, which charter law 16 caps it
at, and the strip sits where it sat: `CountNumber` has not moved, so the strip is still 40 cm above
the floor at the pad's far edge. The numeral keeps its 14 cm cap height. Its centre rises from 11.5
to 13 cm above the strip, because that offset is built out of the cell rather than written down, so
the air between the top of a cell and the bottom of the numeral stays proportional and goes from 3
to 4 cm. The textures are scaled by the quad, so nothing was re-exported.

The reason is the 720p video. At the old size a cell came out about 20 px wide in a frame that holds
the whole pad, and eight of them read as a dotted line rather than as the clave's grid. C2's width
assertion went from 58.5 to 78 cm with it.

### LEAF results

Eight scenarios, run in the Lens Studio preview through the LEAF panel, in order, in one sweep
between 08:28 and 08:30. All eight pass.

| # | Scenario | LEAF id | Result |
|---|---|---|---|
| 1 | Pad on the floor 70 cm ahead, the basic step's prints at real size, music at Slow | `floorcount-c1-start` | **PASS** |
| 2 | Each print lights on its count in time with the music, nothing on 4 and 8, the display follows the count | `floorcount-c2-beat` | **PASS** |
| 3 | Again twice drops the tempo and shows counts 1 to 4 only | `floorcount-c3-again` | **PASS** |
| 4 | Got it three times at Full loads the right turn and its arc shows on the turn counts | `floorcount-c4-next-step` | **PASS** |
| 5 | Pinching a print flashes it; the worst step replays; the floor clears and the card shows each step's Agains | `floorcount-c5-mark-and-summary` | **PASS** |
| 6 | The arrow shows only while neither the pad nor the step card is in view | `floorcount-c6-off-view-arrow` | **PASS** |
| 7 | One left edge, capsules fitted and apart, paused line in words | `floorcount-c7-step-card` | **PASS** |
| helper | Capture helper, holds the session on one count for a screenshot | `floorcount-hold-on-count` | **PASS** (not a done criterion) |

What the sweep measured:

- **C1.** Pad 70.0 cm ahead and 150.0 cm below the eyes, sole print quad 29.0 cm at scale 1.00 with
  the 27 cm print inside it, teal on count 1's print and on no other.
- **C2.** 125 samples over 8.04 s, 18.75 beats, 140.0 BPM against the 140 BPM loop. Zero mismatches
  on lit prints, hold counts, the numeral and the hold cells, zero brightness values outside 35 to
  100 per cent, the brightest a cell reached on its own count 0.99, five clave hits, and the strip
  measured at its new 78 cm.
- **C3.** Tempo Medium back down to Slow on the second Again, counts 1 to 4 only.
- **C4.** Fading after the third Got it at Full, then `rightTurn` loaded, arc visible on counts 2
  and 3 and no others.
- **C5.** Pinching `Footprint_C1` set it flashing and recorded the mark; the review came back on
  step 0 at Full; the rows read "Basic step: 1 Again", "Right turn: 0 Agains", "Left turn: 0 Agains".
- **C6.** The four rows in the table above.
- **C7.** All four line ink edges at -19.76 cm and the Again capsule's left edge at -19.76 cm;
  capsule 16.8 cm, air 1.50 and 1.52 cm, gap 6.00 cm; pinching the title paused the audio and turned
  the focus line into "Paused. Pinch the title to go on." at 2.51 cm cap, and pinching again put
  "Whole step" back.
- **Capture helper.** Froze on count 1 at 0.019 of the way into the beat, print at 0.95, cell at
  0.95, numeral "1", buttons bright.

### Screenshots, and where the camera stood

All three overwritten, each 1280 x 720, each the square 1590 x 1590 preview frame with its top 80
rows cropped off the LEAF banner, scaled to 720 high and centred on a `#1A1612` canvas through
`tmp/compose_shot.py`. Preview-camera coordinates below are the ones the Inspector and
`MovePreviewCamera` use, where the default camera is the origin at eye height and the floor is 150 cm
below it.

**The start position: (-120, 0, -215), facing -Z.** This is on the rug to the left of the round
coffee table, with the sofa behind. I checked the pad's whole footprint from there, looking straight
down at it before the Lens was reset: nothing but rug from 32 to 167 cm ahead, no table, no laptop,
no sofa under any part of the 90 cm pad. The Lens was reset at that pose for each of the three shots,
by running `floorcount-hold-on-count` there, so the layout pinned to it on frame 3 before the camera
was aimed.

**How much open floor is in front, measured rather than claimed.** From the dancer there are 198 cm
of clear floor before the sideboard along the far wall. The pad takes 25 to 115 cm of it, so 83 cm
is left between the pad's far edge and the sideboard, not the metre asked for. That is the most this
preview room has: the sofa sits directly behind the start position, the coffee table starts 70 cm to
the right, and the walkway down the left of the sofa measures about 75 cm. Turning the start
heading 25 degrees to the left would buy 103 cm by running the pad diagonally across the room, and I
decided a pad square to the room was worth more than the extra 20 cm.

| Path | Camera | Why there |
|---|---|---|
| `devpost/shots/pad-count1-teal.png` | (-120, 0, -160), pitched 42 degrees down: the start position, 55 cm back, same heading | From the start position itself the numeral's top lands in the top 80 rows, which is where the LEAF banner sits and where the compositing crops. Stepping back brings the span from the top of the numeral to the near prints from 40 to 32 degrees, which fits the preview's 36.2 degree frame with the banner rows taken off. |
| `devpost/shots/pad-count5-lit.png` | (-120, 0, -145), pitched 41 degrees down: 70 cm back, same heading | Count 5's print is at the near edge of the pad, 80 degrees below the horizon from where the dancer stands, so it and the numeral cannot share a frame from there. This is the same reason the 3 November shot stepped back 75 cm. |
| `devpost/shots/step-card-answer-window.png` | (90, 0, -279), looking along -X and 17.8 degrees down | Level with the card in z and 2.1 m to its right, so the line of sight runs across the room into the dark partition wall. The card sits entirely on that wall. The cream sofa only clips the bottom left corner and the white curtains are out of frame. |

The count-1 shot carries the numeral "1", the whole eight-cell strip with cell 1 teal and struck,
cells 4 and 8 outlined, and count 1's left sole print struck in teal with the home pair at rest
below it. The count-5 shot carries the numeral "5", cell 5 struck in ivory with cell 1 teal at rest,
and the right foot's outlined print struck at the near spot, with the whole pad in frame.

**The card's left edge, measured on the published PNG.** The first column of ink in each of the four
lines is at x = 508, 508, 508 and 509 on the 1280 x 720 canvas. That is a 1 px spread, against 24 px
on 2 November's card shot, which was taken with the camera pitched 36.5 degrees down. The layout did
not change between the two; the camera did. A world vertical leans toward the nadir in proportion to
the tangent of the pitch, and this shot is pitched 17.8 degrees. The "Again" label's own ink starts
13 px further right, which is its 1.5 cm of capsule air plus the glyph's side bearing, not a fifth
edge.

**No arrow in the card shot.** The 3 November report had to frame the card so the off-view arrow sat
clear below the capsules. It is simply not in this frame, because the card is what the camera is
looking at. That is change 1 doing its job, and it is the same thing C6's second row asserts.

### Things worth knowing

**`MovePreviewCamera`'s `rotate` gimbals at yaw 180.** Resetting the camera, turning it 180 degrees
and then pitching it down 25 degrees left it pointing straight at the floor, and two 90 degree turns
did the same. Rotating only the yaw from a level camera is fine, and `lookAt` with coordinates is
reliable at any heading. Every aim in this session was done with `lookAt`.

**The preview's frame is 36.2 degrees across.** Measured rather than assumed, against something whose
size the Lens knows: the 78 cm strip spans 0.627 of the frame width at 190 cm, which gives a half
angle of 18.1 degrees. Every framing decision above is that number plus the 80 cropped rows, which
cost another 1.7 degrees off the top.

**The arrow is the fastest way to see the Lens is alive.** While scouting the room with the layout
pinned somewhere else, the chevron was in almost every frame, pointing back at the pad. It is a good
reminder that `needed` stays true for the whole practice session, so the only thing standing between
the arrow and the screenshot is the angle test this pass just tightened.

### Files

Changed: `Assets/Scripts/FloorcountOffViewArrow.ts`, `Assets/Scripts/FloorcountMain.ts`,
`Assets/Scripts/FloorcountStepCardUI.ts`, `Assets/Scripts/FloorcountCountUI.ts`,
`Assets/Tests/FloorcountC6OffViewArrowScenario.ts`, `Assets/Tests/FloorcountC2BeatScenario.ts`,
`Assets/Tests/FloorcountTestKit.ts` (a `cardObject()` lookup beside the `padObject()` one).

New, all in the git-ignored `tmp/`: `leaf_prints.py` (pulls one sweep's scenario prints out of the
Lens Studio log), `shrink.py`, `montage.py`, `measure_edge.py` (the left-edge measurement above).

Unchanged: `Assets/Scene.scene` apart from the save itself. No object was added, removed or renamed,
no `@input` was wired or changed, and every name the LEAF scenarios look up is still there. No
texture, material, font or sound was touched. Packages are the pinned set, Spectacles Interaction Kit
2.0.0, Spectacles UI Kit 2.0.0 and LEAF 2.0.2; nothing was installed, and neither
`QueryRuntimeSceneTool` nor `PreviewInteractTool` was called. `Assets/` and `Packages/` were checked
for OneDrive's "* 2.*" duplicates before compiling and after the sweep; there are none.

### Saves

Saved through the Editor API (`model.project.save()`) twice, both on 3 November 2026, local time:
08:30:56 after the code changes and the LEAF sweep, and **08:51:19 last**, after the three captures.
`ARSpec.esproj` was written at 08:51:19 and `Assets/Scene.scene` at 08:30:56, the scene being
untouched by the captures. The only thing done after the last save was deleting the scratch PNGs out
of `tmp/`, which is outside the project's assets and git-ignored, so nothing in the project has
changed since.

## Validation, 6 November 2026

A short validation pass over the answer-guard changes, not a design pass. Nothing was redesigned
and no scene object was added, removed or renamed.

### What I checked

- **TypeScript compiles.** `RecompileTypeScriptTool` succeeded on the first run, with no errors to
  fix. The four files that changed on disk before this pass (`FloorcountMain.ts`,
  `FloorcountStepCardUI.ts`, `FloorcountTestKit.ts` and the new
  `Assets/Tests/FloorcountC8AnswerGuardScenario.ts`) were reviewed and left as written.
- **The preview starts clean.** Started without LEAF: the log reads
  `Floorcount: session started, Basic step at Slow (140 BPM)`, and no Floorcount script logged an
  error or a warning. The one warning in the window is the LEAF plugin saving its own panel state.
- **Every LEAF scenario, c1 to c8 plus the hold-on-count helper.** Table below.
- **No OneDrive duplicates.** `Assets/` and `Packages/` were checked for "* 2.*" files before
  compiling and again after the sweep. There are none.
- **Packages are the pinned set.** Spectacles Interaction Kit 2.0.0, Spectacles UI Kit 2.0.0 and
  LEAF 2.0.2. Nothing was installed, and neither `QueryRuntimeSceneTool` nor `PreviewInteractTool`
  was called.

### The LEAF sweep

| # | Scenario | Result | Time |
|---|---|---|---|
| 1 | `floorcount-c1-start` | **PASS** | 2.8 s |
| 2 | `floorcount-c2-beat` | **PASS** | 15.7 s, on the second attempt |
| 3 | `floorcount-c3-again` | **PASS** | 49.5 s |
| 4 | `floorcount-c4-next-step` | **PASS** | 16.2 s |
| 5 | `floorcount-c5-mark-and-summary` | **PASS** | 60.3 s, on the second attempt |
| 6 | `floorcount-c6-off-view-arrow` | **PASS** | 3.6 s |
| 7 | `floorcount-c7-step-card` | **PASS** | 3.9 s |
| 8 | `floorcount-c8-answer-guard` | **PASS** | 11.2 s |
| - | `floorcount-hold-on-count` | **PASS** | 24.3 s |

**C2's measured numbers.** 131 samples over 8.05 s, 18.75 beats, 139.8 BPM against the 140 BPM loop.
Zero mismatches on lit prints, hold counts, the numeral and the hold cells, zero brightness values
outside 35 to 100 per cent, the brightest a cell reached on its own count 0.99, five clave hits, and
the strip measuring 78 cm. These match the 2 and 3 November sweeps, so the beat clock and the
display are unchanged by the guard.

**C8's printed lines.**

```text
[C8] first 8-count: tempo 0, dropped 1
[C8] two pinches in one 8-count: Agains 1, dropped 1, beat 12.2, 8-count 1 -> 1
[C8] passed: one answer per 8-count, none before the first has played
```

The first line is the guard refusing a Got it before any 8-count has played. The second is the rule
itself: of two pinches inside one 8-count the first is taken and the second is dropped, and both
landed in 8-count 1.

**The preview gets slower the longer it runs, and three scenarios feel it.** C2, C5 and C8 all time
their assertions against the wall clock, and all three failed partway through the first sweep, then
passed on a freshly refreshed preview. The clearest measurement is C2's own sampling window: it is
written to run for 8 seconds, and in a degraded preview it reported 22 to 27 seconds for the same
loop, taking 12 to 93 samples instead of the 131 it takes when the preview keeps up. The content
assertions never failed once, in any run: lit prints, hold counts, the numeral, the hold cells and
the brightness range came back with zero mismatches every time. Only the numbers derived from
elapsed time broke, which is why a stalled run reported the 140 BPM loop as 53 BPM. Refreshing the
preview before a timing-sensitive scenario is the working practice. This is worth knowing before the
demo recording: record on a freshly started preview.

### What I had to change

Only `Assets/Tests/FloorcountC8AnswerGuardScenario.ts`. `FloorcountMain.ts` and the test kit were
not touched, and the guard itself was not changed: in every failing run it behaved correctly, and
the scenario's own timing assumptions were what broke.

- **The burst starts at the top of an 8-count instead of after an absolute beat.** Two helpers were
  added, `phraseOf` and `waitForPhraseStart`. Waiting for "past beat 8" is not enough, because the
  audio player reports a lagging position for about a second after `play()` and then catches up in
  one jump, so the wait can first be satisfied near the end of that 8-count and leave the burst
  straddling the next one. When that happened the second Again landed in a genuinely new 8-count and
  the guard was right to take it, which read as a guard failure.
- **The burst is two pinches, not three.** A Medium 8-count lasts 2.82 s and one simulated pinch
  costs about 0.8 s in the preview, so three pinches outlast the 8-count they are meant to sit
  inside. Two is the smallest burst that still shows an extra pinch being dropped, and the dropped
  count the scenario expects went from 2 to 1 with it.
- **The 8-count is read the moment the burst ends.** It used to assert `currentBeat < 16` after a
  200 ms settling sleep, by which time the music had often moved into the next 8-count even though
  both pinches landed inside this one. The phrase is now sampled right after the last pinch and
  compared to the phrase the burst started in.

### The icons

The four unused Material icons are gone. `Assets/Icons/check.png`, `pause.png`, `play_arrow.png` and
`replay.png` were deleted through the asset manager, by texture id, after confirming nothing refers
to them: no script, material or scene object holds their ids, and the only mentions anywhere in the
project were two lines in `devpost/` prose. Their `.meta` files went with them. The folder was then
empty, and it was removed through the Editor API (`FileSystem.remove`) after reading it to confirm
it held nothing. `Packages/Icons.lspkg` is a different thing and was not touched.

### The Lens name did not persist

It is still `SpecsBaseTemplate` in `ARSpec.esproj`, under `metaInfo.lensName`, and I left the file
alone as asked.

`editor.d.ts` declares `MetaInfo.lensName` as a writable `string`, and `ExecuteEditorCode` reports
the assignment as succeeding, but it has no effect. `project.metaInfo` hands back a fresh object on
every access, so the write lands on a detached copy: assigning through a held reference and reading
that same reference gives `Floorcount`, while reading `project.metaInfo.lensName` straight afterwards
still gives `SpecsBaseTemplate`. Saving and re-reading `ARSpec.esproj` confirmed it. There is no
`setLensName` method on `MetaInfo`, and there is no transaction API in `editor.d.ts` to wrap the
write in. Set it by hand in Project Settings before submitting, and treat it as a go-live step.

### Saves

Saved through the Editor API (`model.project.save()`), **last at 09:50:10 on 6 November 2026**, local
time. `ARSpec.esproj` was written at 09:50:10. `Assets/Scene.scene` still carries 09:14:06 from the
first save of the session, the scene being untouched by this pass. Nothing in the project has changed
since the last save.

## Session memory and coverage, 6 November 2026

The second half of the 6 November validation, finishing a pass that a usage limit cut off. No design
work, no scene change, and no script change: everything below is a check, a measurement or a
screenshot. All times are local time on 6 November.

### What was verified

- **TypeScript compiles.** `RecompileTypeScriptTool` reported `succeeded`. The first call timed out
  at the MCP transport while Lens Studio was blocked on an `adb` poll, and the retry a minute later
  succeeded; nothing was wrong with the code.
- **The preview starts clean.** After a refresh the log reads
  `Floorcount: session started, Basic step at Slow (140 BPM)` and no Floorcount script logged an
  error or a warning. The only warnings in the window belong to the LEAF plugin saving its panel
  state and to Lens Studio polling attached Android devices.
- **Every LEAF scenario, c1 to c17 plus the hold-on-count helper and the capture helper.** Table
  below. All pass.
- **A saved session survives a real preview reset.** Measured two ways, below.
- **The storage calls match the type definitions.** `FloorcountMain` reaches persistent storage
  through `global.persistentStorageSystem`, then `.store`, then `getString`, `putString` and
  `remove`. `Support/StudioLib.d.ts` declares `persistentStorageSystem` as a global, `store` as a
  `GeneralDataStore`, and all three methods with exactly those signatures. Nothing is off-contract.
- **No OneDrive duplicates.** `Assets/` and `Packages/` were checked for "* 2.*" files before
  compiling and again after the sweep. There are none.
- **Packages are the pinned set.** Spectacles Interaction Kit 2.0.0, Spectacles UI Kit 2.0.0 and
  LEAF 2.0.2. Nothing was installed, and neither `QueryRuntimeSceneTool` nor `PreviewInteractTool`
  was called. LEAF was pinned to the preview rather than to a device before the sweep, because a
  Quest 3S and later a phone were attached over adb and the panel's target is sticky.

### What changed, and why

Nothing was changed in this session. The three test-side changes below were already on disk when it
started, made by the session the limit cut off. Each was reviewed here and each is kept.

- **`masterCurrentStep` in the test kit stops on either signal.** It used to loop while the phase
  was still "learning", which is wrong at Full tempo: the fade between steps lasts two counts, 0.63
  s, and a simulated pinch costs about 0.95 s, so the loop could look once before the step completed
  and again after the next step had loaded, see "learning" both times, and spend the caller's
  remaining pinches answering for a step the caller had not reached. It now also stops when the step
  index moves off the one it started on. This is the right fix: the helper's job is to master *one*
  step, so the step index is the thing it should be watching.
- **The c13 freeze helper waits on frames, not on sleeps.** `freezeNearStrikeOf` needs to stop the
  beat within a fraction of a count's strike. A `sleep` in this preview resolves about every 140 ms
  against a 429 ms beat, so the beat positions a scenario could even observe fell on a coarse grid
  and landing near a strike was luck over tens of seconds. Waiting a frame at a time puts every
  drawn frame within reach. It returns 1 rather than hanging if no close reading turns up, so the
  caller fails on a number instead of timing out.
- **C4 watches every frame instead of looking once.** This is the change the cut-off session was
  asked to review, and it is sound. The old scenario pinched the third Got it and then took one look
  at the phase, which at Full tempo proves nothing either way: the fade can start and finish inside
  the pinch, so a single look afterwards finds "learning" whether the fade happened or not, and C4
  failed on every run for that reason. It now uses a new test-kit helper, `watchPhases`, which
  records phase and step index on every frame and appends only on a change. C4 asserts the exact
  sequence `learning/0, fading/0, learning/1`. That is **stricter** than what it replaced, not
  looser: the old check could not see the fade at all, and the new one fails if the fade is missing,
  if it happens twice, or if the step changes without one. In this sweep C4 printed exactly
  `learning/0 > fading/0 > learning/1` and passed. The assertion was not relaxed to get there.

### The LEAF sweep

One sweep, run in the Lens Studio preview through the LEAF panel, between 13:57 and 14:10. The
preview was refreshed before each timing-sensitive scenario (c2, c5, c8, c9, c13). c5 and c8 were
run twice each, as they share the fragile timing path with C4.

| # | Scenario | Result | Note |
|---|---|---|---|
| 1 | `floorcount-c1-start` | **PASS** | |
| 2 | `floorcount-c2-beat` | **PASS** | on the second attempt, see below |
| 3 | `floorcount-c3-again` | **PASS** | |
| 4 | `floorcount-c4-next-step` | **PASS** | the `watchPhases` change, first green run |
| 5 | `floorcount-c5-mark-and-summary` | **PASS** | run twice, passed both |
| 6 | `floorcount-c6-off-view-arrow` | **PASS** | |
| 7 | `floorcount-c7-step-card` | **PASS** | |
| 8 | `floorcount-c8-answer-guard` | **PASS** | run twice, passed both |
| 9 | `floorcount-c9-session-memory` | **PASS** | and again at 14:27 as the clearing step |
| 10 | `floorcount-c10-left-turn` | **PASS** | |
| 11 | `floorcount-c11-halves` | **PASS** | |
| 12 | `floorcount-c12-count-display` | **PASS** | |
| 13 | `floorcount-c13-the-and` | **PASS** | |
| 14 | `floorcount-c14-mark-ring` | **PASS** | |
| 15 | `floorcount-c15-restart-from-summary` | **PASS** | |
| 16 | `floorcount-c16-arc-inside-pad` | **PASS** | |
| 17 | `floorcount-c17-teal-law` | **PASS** | |
| helper | `floorcount-hold-on-count` | **PASS** | not a done criterion |
| helper | `floorcount-capture` | **PASS** | all three shots, not a done criterion |

**C2's one retry was a lost dispatch, not a failure.** The first attempt produced no output at all:
no assertion failed, the scenario body never ran. `RunAndCollectLogsTool` in refresh mode fires two
Lens resets a fraction of a second apart, and the run was dispatched after the first reset's
`session started` print, which put it into the second reset and threw the request away. Waiting for
the LEAF panel's own `Loaded 19 scenario(s) from preview` line before dispatching avoided it for the
rest of the sweep. This is worth knowing because it looks exactly like a hang.

What the sweep measured, in the scenarios' own prints:

- **C2.** 154 samples over 8.01 s, 18.75 beats, 140.5 BPM against the 140 BPM loop. Zero mismatches
  on lit prints, hold counts, the numeral and the hold cells, zero brightness values out of range,
  brightest own cell 0.99, seven clave hits. 154 samples is a healthy preview; a degraded one took
  12 to 93 on 6 November morning.
- **C4.** Phases frame by frame after the third Got it at Full: `learning/0 > fading/0 >
  learning/1`. Step 1 loaded as `rightTurn`, turn arc visible on counts 2 and 3 and no others.
- **C5.** Pinching `Footprint_C1` set it flashing and recorded the mark; the review came back on
  step 0 at Full; rows read "Basic step: 1 Again", "Right turn: 0 Agains", "Left turn: 0 Agains".
- **C8.** Both runs: the guard refused a Got it before any 8-count had played, and of two pinches
  inside one 8-count the first was taken and the second dropped, at beat 10.9 and beat 10.7, both
  landing in 8-count 1.
- **C9.** First session no rings and `previous` null; second session `previousLost=5`,
  `previousAgains=1`, ring on count 5 at 0.350 and none on count 1; second session rows all carrying
  a "last time" comparison.
- **C10.** Left turn loaded, count 6's toes pointing (0.00, 0.00, 1.00) in pad space, arc at full on
  counts 6 and 7 only.
- **C11.** Whole step lights 1, 2, 3, 5, 6, 7; first half 1, 2, 3; second half 5, 6, 7; whole step
  back again.
- **C12.** A Got it hides the numeral and the strip, an Again puts them back.
- **C13.** 356 samples, one every 0.108 beats; frozen 0.016 beats past count 2's strike with the
  print at 0.960 against a curve that says 0.960; worst hold cell 0.350; nothing off the curve.
- **C14.** Marks on 2 and 5, both rings at 0.500, row reads "Basic step: 0 Agains, lost it on 2 and
  5".
- **C15.** At the summary the title is "Practise again" with the floor and both buttons off;
  pinching it returns to step 0 at Slow with the floor and both answers back.
- **C16.** Right turn arc furthest point 35.68 cm from the pad centre, left turn 35.23 cm, both
  inside the border's inner edge at 43.2 cm.
- **C17.** On all three steps the only teal in the scene is count 1's print and cell 1.

### A saved session across a real preview reset

Checked by hand, not by a scenario asserting against itself. The capture helper's `last-time-rings`
shot was run first, which plays and finishes one session losing counts 2 and 5 and leaves it in
persistent storage. Then the preview was reset for real, which tears the Lens down and builds it
again from cold, so anything that comes back has been read off storage rather than held in memory.

**What the fresh Lens said about itself.** The step card measures and logs its own width at startup.
On a first session it reports `Card 39.5 cm wide` with line widths `39.5 / 28.9 / 33.1 / 25.7 cm`.
After the reset, with the session saved, the same print read `Card 62.1 cm wide` with line widths
`39.5 / 28.9 / 33.1 / 62.1 cm`, and every line laid out from -30.00 cm instead of -19.76 cm. The
fourth line is the focus line, and it grew from 25.7 cm to 62.1 cm because it was carrying "Last
time: lost it on 2 and 5" rather than "Whole step". The card widened to fit last session's result.

**What it looked like.** Looking down at the pad in that cold-booted Lens, counts 2 and 5 each
carried the faint ivory halo that marks where it went wrong last time, and no other print did. The
ring is a slightly larger copy of the foot mesh drawn just under the print, so it reads as an
outline hugging the silhouette; at this size it is clearly a second shape and not an edge of the
print. Count 3's print beside it is a plain solid shape with no halo at all.

**And the other direction.** After `floorcount-c9-session-memory` cleared the save and the preview
was reset again, the same startup print was back to `Card 39.5 cm wide` and `25.7 cm` on the fourth
line. So the round trip was observed in both directions on a cold Lens: written and read back, then
removed and gone.

### The captures

Three frames, each 1280 x 720, each the square 1590 x 1590 preview frame with its top 80 rows
cropped off the LEAF banner, scaled to 720 high and centred on a `#1A1612` canvas through
`tmp/compose_shot.py`. Each was looked at before moving on. Preview-camera coordinates are the ones
the Inspector and `MovePreviewCamera` use, where the default camera is the origin at eye height and
the floor is 150 cm below it. For every shot the Lens was reset with the camera at the 3 November
start position, (-120, 0, -215) facing -Z, so the layout pinned over the clear rug before the camera
was aimed.

| Path | Camera | What it shows |
|---|---|---|
| `devpost/shots/right-turn-arc.png` | (-120, 0, -145), looking at (-120, -131, -296), about 41 degrees down | The right turn held on count 2, arc at full, print and cell both at 0.97. The whole pad over clear floor, the numeral "2", cell 1 teal and cell 2 struck. The Again capsule clips the top right corner. |
| `devpost/shots/last-time-rings.png` | (-132, 0, -100), looking at (-74, -112, -293) | A second practice held on count 2. Counts 2 and 5 both carry last time's ring, and the card reads "Step 1 of 3", "Slow, 140 BPM" and the full line "Last time: lost it on 2 and 5". |
| `devpost/shots/summary-last-time.png` | (90, 0, -279), looking at (-120, -67, -279), about 17.8 degrees down | The summary card, whole, on the plain partition wall: "Practise again", then three rows each ending in a comparison, then "Pinch the title to practise again". |

**The card and the whole pad do not fit in one frame, and `last-time-rings` is the compromise.** The
preview's frame is 36.2 degrees across and the pad alone already spans most of it, with the card up
and to the right of the pad. Framed on the pad alone the rings are large and obvious but nothing in
the picture says the session is a second one. Framed to include the card, the title "Basic step"
falls in the 80 rows the compositing crops and the left end of the clave strip runs off the left
edge. The published frame is the second of those, because the line "Last time: lost it on 2 and 5"
is what makes the shot mean what its name says, and both rings are still clearly readable in it. The
clipped title and the cropped strip end are known and deliberate. A pad-only version of the same
held frame was looked at and rejected on those grounds.

### Things worth knowing

**The preview panel can pause itself, and a resume is not enough.** Partway through, the preview
stopped producing any log output for about four minutes. There was no modal dialog: checked with UI
Automation, the only Lens Studio window was the main one. `PreviewPanelTool` with `getConfig`
reported `inputType: "Preview is Paused"`. Calling `resume` returned success and changed nothing;
the Lens only came back after a `refresh`, which put the input type back to `Interactive` on the
Sunlit Room scene and re-registered all 19 scenarios. A silent preview is worth one `getConfig`
before anything is concluded about the Lens.

**Two scenario runs in this session outlasted the MCP call timeout** and one Editor tool call did
too, while Lens Studio was blocked on an `adb` poll. Both attached Android devices, a Quest 3S and
later a phone, are polled every three seconds and the poll sometimes times out. When a call comes
back as a transport timeout the work usually finished anyway, and the result is in the log.

### Files

Changed in this session: `devpost/design-pass-report.md`, this section, and the three new PNGs under
`devpost/shots/`. No TypeScript, no scene object, no material, texture, font or sound was touched.
No `@input` was wired or changed, and every name the LEAF scenarios look up is still there.

### Saves

Saved through the Editor API (`model.project.save()`) four times: 13:57:04 after the clean compile,
14:10:52 after the LEAF sweep, 14:28:25 after the saved session was cleared, and **14:30:48 last**.
`ARSpec.esproj` was written at 14:30:48. `Assets/Scene.scene` still carries 10:48:44 from earlier in
the day, the scene being untouched by this pass.

The project is left as a first session: the saved session was cleared with
`floorcount-c9-session-memory`, which ends by calling `clearSaved()` and asserting `previous` is
null, and the clear was then confirmed on a cold Lens by the card measuring 39.5 cm again. The only
things written after the last save are this section and the screenshots, both outside the Lens
project's assets, so nothing in the project itself has changed since.

**Still outstanding, and not done here.** The Lens name in `ARSpec.esproj` is still
`SpecsBaseTemplate`; it cannot be set through the Editor API, as the 6 November morning note
explains, and remains a by-hand go-live step in Project Settings.

## Review fixes, 6 November 2026

Verifying three small changes an independent code review left on disk, extending one LEAF
scenario to cover them, and running the whole sweep. No design work, no scene change, and no
change to `Assets/Scripts/`: everything below is a check, a measurement or a test-side edit. All
times are local time on 6 November, evening.

### The three changes

1. **The answer guard also keeps a window between answers.** `canAnswer` in `FloorcountMain.ts`
   now asks for `COUNTS_PER_PHRASE - answerWindowCounts` beats, six, since the last answer as well
   as a new 8-count, so an answer taken on count 8 cannot be followed by another on the next
   count 1 with nothing danced between them; it also returns false while the music is paused, and
   the capsules light from the same `canAnswer`, so bright means an answer would be taken.
2. **The fade line after the last step tells the truth.** `focusText` and `FloorcountState`'s
   `reviewDue` say "Once more at Full" only when some step has an Again to bring back, and
   "Three steps done" when none has.
3. **Two smaller ones.** `countsInWords` reads more than three lost counts as "4 counts" rather
   than a list that outgrows the card, and `startMusic` clears `useFallbackClock` so each track
   gets its own chance to sync to the audio player instead of inheriting one slow start.

The unit tests cover the second and third directly: `tests/unit/state.test.mjs` passes 32 of 32,
and `tests/unit/planted-breaks.mjs` catches 54 of 54, among them "a session with Agains claims it
has no review" and "four lost counts are still spelled out".

### What c8 now checks

`floorcount-c8-answer-guard` keeps everything it asserted before and adds two checks, both with
the guard on, as the Lens ships:

- **A late answer, then the next 8-count.** It pinches Again late in an 8-count, reads the beat
  the Lens actually took the answer on, then waits for count 1 of the next 8-count and pinches
  again. The second has to be dropped, `againStreak` must not move, `canAnswer` has to be false
  with the capsules at rest, and from count 7 of that 8-count on `canAnswer` has to be true
  again. It also asserts the two answers landed in different 8-counts and under six beats apart,
  which is what makes the drop a decision of the new rule rather than of the old one.
- **Paused.** With `canAnswer` true it pinches the title to hold the session, asserts `canAnswer`
  goes false and that a Got it is dropped with neither the tempo nor the segment moving, then
  pinches the title again and asserts the guard comes back.

The aim is measured rather than assumed. A simulated pinch runs SIK's hover, select and release
over several frames, so the Lens takes an answer well after the scenario asks for it. Each
attempt reads the beat of its own answer, takes that lag off the next attempt's starting position
and tries again, up to four times.

**The new checks did not get to run, and the scenario fails before them.** On this evening's
preview c8 stops in the part it already had: the burst of two pinches that has to sit inside one
8-count. Four attempts, the preview refreshed before each:

```text
[C8] first 8-count: tempo 0, dropped 1
[C8] two pinches in one 8-count: Agains 1, dropped 1, beat 19.2, 8-count 1 -> 2
[C8] two pinches in one 8-count: Agains 2, dropped 0, beat 3.9, 8-count 1 -> 0
[C8] two pinches in one 8-count: Agains 2, dropped 0, beat 2.9, 8-count 1 -> 0
[C8] two pinches in one 8-count: Agains 1, dropped 1, beat 18.6, 8-count 1 -> 2
```

The first line is the guard refusing a Got it before any 8-count has played, and it passed every
time. The four under it are the burst, and the number that fails is the 8-count the burst ended
in: it starts at the top of 8-count 1 and ends in 8-count 2, or, where the second Again was taken
and dropped the tempo, in the restarted 8-count 0. In the two runs reading "Agains 1, dropped 1"
the guard did the right thing, dropping the second pinch even though it had crossed into a new
8-count, which is the new rule working. What fails is the scenario's own premise, that both
pinches landed inside one 8-count, and nothing was loosened to get past it.

**Why, measured.** A Medium 8-count lasts 2.82 s. A simulated pinch on this preview costs about
1.9 s against the 0.8 s it costs on a preview that is keeping up, so two of them need about 3.8 s
and cannot fit. The frame rate is the cause and C2 is the meter: it reports how many samples it
took in its 8 s window, and in this sweep it took 41, 26, 21 and 43, against 125 to 154 on 2, 3
and 6 November. The Lens is unchanged and C2's content assertions came back clean every time, so
this is a preview that cannot be pinched fast enough rather than a Lens behaving differently.

The cause is outside Lens Studio: another application on the machine held about 77 per cent of
the GPU's 3D engine for the whole session, sampled five times over six seconds, leaving Lens
Studio about 23 per cent. Restoring the Lens Studio window, which was minimised, doubled the
frame rate on its own, 21 samples to 43, and is worth doing before any timing-sensitive run. c8
needs the GPU back to pass, and both it and the two new checks are worth re-running when the
machine is quiet.

### The LEAF sweep

One sweep in the Lens Studio preview through the LEAF panel, between 18:41 and 19:11, pinned to
the preview rather than to a device. The preview was refreshed before c2, c5, c8, c9 and c13, and
every run was dispatched only after the panel's own "Loaded 19 scenario(s) from preview" line.

| # | Scenario | Result | Note |
|---|---|---|---|
| 1 | `floorcount-c1-start` | **PASS** | 2.8 s |
| 2 | `floorcount-c2-beat` | **PASS** | 12.3 s, and three more times as the frame-rate meter |
| 3 | `floorcount-c3-again` | **PASS** | 15.6 s |
| 4 | `floorcount-c4-next-step` | **PASS** | 23.7 s, phases `learning/0 > fading/0 > learning/1` |
| 5 | `floorcount-c5-mark-and-summary` | **PASS** | on the second attempt, 44.2 s |
| 6 | `floorcount-c6-off-view-arrow` | **PASS** | 4.0 s |
| 7 | `floorcount-c7-step-card` | **PASS** | 8.0 s |
| 8 | `floorcount-c8-answer-guard` | **FAIL** | four attempts, all in the pre-existing burst check, above |
| 9 | `floorcount-c9-session-memory` | **PASS** | 109.3 s, and again at the end as the clearing step, 83.4 s |
| 10 | `floorcount-c10-left-turn` | **PASS** | 40.9 s |
| 11 | `floorcount-c11-halves` | **PASS** | 43.3 s |
| 12 | `floorcount-c12-count-display` | **PASS** | 10.2 s |
| 13 | `floorcount-c13-the-and` | **PASS** | 18.9 s |
| 14 | `floorcount-c14-mark-ring` | **PASS** | 64.1 s |
| 15 | `floorcount-c15-restart-from-summary` | **PASS** | 66.2 s |
| 16 | `floorcount-c16-arc-inside-pad` | **PASS** | 30.5 s |
| 17 | `floorcount-c17-teal-law` | **PASS** | 35.5 s |
| helper | `floorcount-hold-on-count` | **PASS** | on the second attempt, 20.8 s |
| helper | `floorcount-capture`, `right-turn-count2` | **PASS** | 50.4 s |
| helper | `floorcount-capture`, `fade-line` | **PASS** | 97.7 s, the new shot, below |

Both scenarios that needed a second attempt failed the first time on the clock rather than on the
Lens. C5 pinches a print and looks for the flash 200 ms later: the mark was recorded, but the
pinch logged at 18:42:39.831 and the check read it at 18:42:41.042, 11 ms past the end of the
1.2 s flash. The hold-on-count helper froze a beat late and reported count 8 where count 1 was
asked for. Both passed on a freshly refreshed preview with nothing changed.

What the sweep measured, where it adds to the earlier ones:

- **C1.** Pad 70.0 cm ahead and 150.0 cm below the eyes, sole print quad 29.0 cm at scale 1.00
  with the 27 cm print inside it, teal on count 1's print and on no other.
- **C2.** 140.0 to 140.5 BPM against the 140 BPM loop in every run, zero mismatches on lit
  prints, hold counts, the numeral and the hold cells, zero brightness values out of range.
- **C6.** The arrow showing with the pad 65.0 degrees and the card 50.3 degrees off the view
  axis, and hidden as soon as either one comes back on it.
- **C7.** Capsules 16.8 cm with 1.50 and 1.52 cm of air and a 6.00 cm gap; holding the session
  turns the focus line into "Paused. Pinch the title to go on." at 2.51 cm cap, and going on puts
  "Whole step" back.
- **C13.** Frozen 0.068 beats past count 2's strike with the print and the cell both at 0.844
  against a curve that says 0.844, nothing off the curve, worst hold cell 0.350.
- **C16.** Right turn arc 35.68 cm from the pad's centre at its furthest, left turn 35.23 cm,
  both inside the border's inner edge at 43.2 cm.
- **C17.** On all three steps the only teal in the scene is count 1's print and cell 1.

### The fade line after the last step, checked by hand

A new shot on the capture helper, `fade-line`, drives two whole sessions and holds the last fade
of each. The line is only up for the two-count fade, 0.63 s at Full, which is shorter than one
simulated pinch, so the shot watches every frame and stops the beat the instant the fade starts;
a stopped beat holds the fade, because the fade advances with the music. It then reads the card's
own focus line.

What it read, in the preview, driving all three steps both ways round:

- With one Again on the basic step: **"Once more at Full"**.
- With no Agains at all: **"Three steps done"**.

Both are the card's own text, read off the Text component drawing it while the frame is held, and
both are asserted by the shot, so it fails rather than prints if either changes. The screenshot
taken after the run framed the preview room's wall rather than the card, because the preview
camera was left where the last Lens reset pinned the layout, so the line was read from the live
card rather than from a picture of it.

### Files

Changed: `Assets/Tests/FloorcountC8AnswerGuardScenario.ts`, the two new checks and their helpers;
`Assets/Tests/FloorcountCaptureScenario.ts`, the `fade-line` shot; and this section. Nothing under
`Assets/Scripts/` was touched, because no scenario proved a bug in any of the three changes. No
scene object was added, removed or renamed, no `@input` was wired or changed, and no texture,
material, font or sound was touched. Packages are the pinned set, Spectacles Interaction Kit
2.0.0, Spectacles UI Kit 2.0.0 and LEAF 2.0.2; nothing was installed, and neither
`QueryRuntimeSceneTool` nor `PreviewInteractTool` was called. `Assets/` was checked for OneDrive's
"* 2.*" duplicates before compiling and again after the sweep; there are none.

### Saves

Saved through the Editor API (`model.project.save()`) three times: 18:36:49 after the first clean
compile, 18:40:40 after the scenario edits compiled, and **19:11:16 last**, after the sweep and
after the saved session was cleared. The project is left as a first session:
`floorcount-c9-session-memory` ran last and ends by clearing the save and asserting `previous` is
null. The only thing written after the last save is this section, which is outside the Lens
project's assets, so nothing in the project itself has changed since.
