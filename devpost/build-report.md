# Floorcount build report

Built from `devpost/design-brief.md` for SPECS, in Lens Studio 5.23.2, project `ARSpec.esproj`.
Everything below runs and was checked in Lens Studio's Interactive Preview on the SPECS 27
device profile, with the mouse acting as a pinch. No SPECS device was used.

Date: 2 November 2026.

## What was built

### Scripts

The behaviour scripts were written in an earlier session and were reused as they stood. Three
of them needed edits during wiring; those are listed under "Changes made to the scripts".

| Path | What it owns |
|---|---|
| `Assets/Scripts/FloorcountSteps.ts` | Footwork data for the three steps, as floor spots in pad-local cm. Matches the brief's footwork tables. |
| `Assets/Scripts/FloorcountState.ts` | Session rules: step, tempo level, which part of the step shows, Again and Got it streaks, Again totals, lost-count marks, phase. |
| `Assets/Scripts/FloorcountMain.ts` | Orchestrator. Owns the per-frame loop, the beat, the clave on counts 1 and 5, the answer window, the two-count fade, the one-8-count review and the summary. |
| `Assets/Scripts/FloorcountPadController.ts` | Pad outline, the current step's footprints (code-built flat meshes), the turn arc, and their lighting. Footprints are SIK Interactables. |
| `Assets/Scripts/FloorcountAudioController.ts` | The three practice loops, the clave, the tap and the mastered cue, played from the pad. Also the beat clock. |
| `Assets/Scripts/FloorcountStepCardUI.ts` | The UIKit step card: title button, step number, tempo, focus line, Again and Got it buttons, summary rows. |
| `Assets/Scripts/FloorcountCountUI.ts` | The floating count number. |
| `Assets/Scripts/FloorcountOffViewArrow.ts` | The chevron at the bottom of the view that points back to the pad. |

### Scene

`Assets/Scene.scene` was still the untouched Base Template at the start of this session, so the
whole layout below was rebuilt. Positions are local to `FloorcountWorld`, in cm, with the floor
150 cm below the eyes and -Z forward. `FloorcountMain` moves `FloorcountWorld` to the user's
start position and heading on frame 3.

```
Camera Object            Perspective, Device Tracking = World, + Audio Listener (added this session)
Lighting                 (Base Template)
SpectaclesInteractionKit (Base Template prefab)
FloorcountWorld                      (0, 0, 0)
├── FootprintPad                     (0, -150, -70)   FloorcountPadController
│     builds PadOutline, Footprints/Footprint_C*, TurnArc at runtime
├── PadSpeaker                       (0, -145, -70)   music and clave play from here
├── CountNumber                      (0, -110, -115)  FloorcountCountUI
├── StepCard                         (54, -55, -64)   FloorcountStepCardUI
├── CardSpeaker                      (54, -55, -64)   button taps play from here
├── FloorcountAudio                  (0, -150, -70)   FloorcountAudioController
├── OffViewArrow                     (0, 0, 0)        FloorcountOffViewArrow (sets its own world pose each frame)
└── FloorcountMain                   (0, 0, 0)        FloorcountMain
LeafIndex                            registers the six test scenarios
LEAF Plugin Bridge                   added by the LEAF panel
```

Layout against the brief: the pad is 90 x 90 cm centred 70 cm in front of the start position, a
faint outline only. Footprints are 27 cm long, left foot cool blue (0.55, 0.80, 1.00), right
foot warm orange (1.00, 0.72, 0.42), dim at 0.22 opacity, a 0.5 glow half a beat early, full on
the count. The count number is 14 cm tall and light. The step card is 30 cm wide with 12 cm
Again and Got it buttons, Again on the left. Nothing in the layout is black or dark.

### Assets

| Path | Notes |
|---|---|
| `Assets/FloorcountUnlit.mat` | Created this session from `UnlitMaterialPreset`. Cloned at runtime for every footprint, the pad outline, the turn arc and the off-view arrow. |
| `Assets/GeneratedSFX/FloorcountSalsa140.wav` | 13.714 s, exactly 32 beats at 140 BPM (four 8-counts). |
| `Assets/GeneratedSFX/FloorcountSalsa170.wav` | 11.294 s, exactly 32 beats at 170 BPM. |
| `Assets/GeneratedSFX/FloorcountSalsa190.wav` | 10.105 s, exactly 32 beats at 190 BPM. |
| `Assets/GeneratedSFX/FloorcountClaveClick.wav` | Clave on counts 1 and 5. |
| `Assets/GeneratedSFX/FloorcountUiTap.wav` | Button and footprint tap. |
| `Assets/GeneratedSFX/FloorcountStepMastered.wav` | Played when a step is mastered. |
| `Assets/Icons/replay.png`, `check.png`, `play_arrow.png`, `pause.png` | Step card icons. |

All of these already existed and were reused unchanged.

### Tests

| Path | Notes |
|---|---|
| `Assets/Tests/FloorcountTestKit.ts` | Shared lookups, session restart and waits. No assertions of its own. |
| `Assets/Tests/LeafIndex.ts` | Registers the six scenarios. |
| `Assets/Tests/FloorcountC1StartScenario.ts` … `FloorcountC6OffViewArrowScenario.ts` | One scenario per done criterion. |

## Done criteria

All six were run in the Lens Studio preview through the LEAF panel, in order, in a single
sweep on 2 November 2026 at 15:02 to 15:04 local time. The measured values below come from
that sweep's log.

| # | Criterion | Scenario file | LEAF id | Result |
|---|---|---|---|---|
| 1 | Pad on the floor about 70 cm in front, basic step's eight footprints at real size, music at Slow | `Assets/Tests/FloorcountC1StartScenario.ts` | `floorcount-c1-start` | **PASS** |
| 2 | Each footprint lights on its count in time with the music, nothing on 4 and 8, count number shows the count | `Assets/Tests/FloorcountC2BeatScenario.ts` | `floorcount-c2-beat` | **PASS** |
| 3 | Again twice in a row drops the tempo one level and shows only counts 1 to 4 | `Assets/Tests/FloorcountC3AgainScenario.ts` | `floorcount-c3-again` | **PASS** |
| 4 | Got it three times at Full tempo fades the footprints, loads the right turn, turn arc on the turn counts | `Assets/Tests/FloorcountC4NextStepScenario.ts` | `floorcount-c4-next-step` | **PASS** |
| 5 | Pinching a footprint flashes it; the worst step replays once; the floor clears and the card shows each step's Again count | `Assets/Tests/FloorcountC5MarkAndSummaryScenario.ts` | `floorcount-c5-mark-and-summary` | **PASS** |
| 6 | Looking up away from the pad shows an arrow at the bottom of the view pointing back to it | `Assets/Tests/FloorcountC6OffViewArrowScenario.ts` | `floorcount-c6-off-view-arrow` | **PASS** |

Every criterion has a test. None is untested.

### What each test measured

**1.** Pad measured 70.0 cm ahead of the camera and 150.0 cm below it. The footprint mesh
measured 27.0 cm long and the forward step is 30 cm from home. The basic step puts six counts
(1, 2, 3, 5, 6, 7) on the floor across four shared spots; counts 4 and 8 have no floor spot at
all. Tempo level 0, 140 BPM, music playing.

**2.** Sampled 138 times over 8.03 s. On every stepping count the footprint for that count was
lit (0 mismatches); on counts 4 and 8 nothing was lit (0 violations); the count number read the
current count on every sample (0 mismatches). All eight counts were reached. The counts
advanced at 140.0 BPM measured against the clock, which is the Slow loop's own tempo read from
the music's playback position. The clave fired 5 times in the window (counts 1 and 5).

**3.** One Got it raised Slow to Medium (170 BPM). A single Again changed neither tempo nor
segment. The second Again in a row dropped Medium back to Slow (140 BPM) and set the segment to
counts 1 to 4. Count 5's footprint left the floor, counts 1 and 2 stayed; over a further 4 s
nothing outside counts 1 to 4 ever lit. The card line read "Counts 1 to 4 only" and the Again
total for the step was 2.

**4.** Two Got its climbed to Full. The next three at Full moved the streak 1, 2, then into the
fading phase. After the two-count fade the session loaded step 2 of 3, "Right turn", including
the pivot footprint `Footprint_C2` that the basic step does not have. Sampling a whole phrase,
the turn arc was visible on counts 2 and 3 and on no other count.

**5.** Pinching `Footprint_C1` set it flashing and recorded count 1 as a lost mark for the
basic step; the flash cleared after its 1.2 s pulse and the mark stayed. Driving a whole session
with one Again on the basic step and none elsewhere, the review phase came back on step 0, the
basic step, at Full tempo with the footprints still on the floor. One 8-count later the floor
cleared, the card switched to summary mode with the title "Practise again", and the rows read
"Basic step: 1 Again", "Right turn: 0 Agains", "Left turn: 0 Agains".

**6.** With the preview head level, the pad sat 68.8 degrees off the view axis against a 24
degree threshold and the arrow was showing. Moving the pad to the authored floor position
relative to the view axis (65.0 degrees off) kept it showing, 60.0 cm ahead of the eye and 9.0
cm below the view centre, pointing at the pad with an agreement of 1.000 and a downward
component. Moving the pad onto the view axis (0.0 degrees off) hid it.

How criterion 6 is driven: a LEAF scenario cannot move the preview head, so the scenario moves
the floor layout instead. The arrow only reads where the pad is relative to where the camera
looks, so moving one is the same geometry as moving the other, and both branches are exercised
with the real 24 degree threshold. The scenario also asserts that the arrow's live state agrees
with wherever the preview head happens to be pointing, and it was run and passed from two
preview poses: head aimed at the pad (0.0 degrees, arrow hidden) and head level (68.8 degrees,
arrow showing).

### Not covered by a test

These are in the build but no assertion covers them:

- The soft glow half a beat before a footprint's count. The code path runs during criterion 2
  but the scenario only asserts the fully lit state.
- Pinching the card title to pause and resume, and pinching it again from the summary to
  restart the session.
- The spatial placement of the sound (music and clave from the pad, taps from the card). The
  Audio Listener is in place and no spatial warning is logged, but nothing asserts where the
  sound appears to come from.
- Whether the footprints and the card are comfortable to reach and read over a real session.
  Only real glasses can answer that.

## Changes made during the build

### Changes to the scripts

Three edits were needed to get the scene running. Nothing else in the behaviour scripts changed.

1. `FloorcountMain.ts`: the phase is now read into a local at the top of `tick()`. TypeScript
   narrowed `state.phase` to `"fading"` and then rejected the later comparison against
   `"summary"`, which failed the build.
2. `FloorcountAudioController.ts`: `startMusic` and `stopMusic` now check `audioTrack` before
   calling `isPlaying()` / `isPaused()`. On the first start there is no track yet and those
   calls threw `[AudioComponent] Audio player is not enabled`, which killed the session before
   the first beat.
3. `FloorcountAudioController.ts`: the beat clock was rewritten. See below.
4. `FloorcountMain.ts`: added a public `restart()` that calls the existing `startSession()`,
   so the tests can begin from a known session state. The summary's title button now calls it
   too, instead of calling `startSession()` directly.

### The beat clock

The original clock read `music.position` and added a whole loop's worth of beats whenever the
position jumped backwards. In the preview the audio player reports a lagging position for about
a second after `play()` and then snaps forward to the true position, and after a tempo change it
can report the previous track's position for a few frames. Both of those were read as loop wraps
and added 32 phantom beats each time. Measured, the count was running at up to 620 BPM against a
140 BPM track, and after a tempo change the fade's start beat could land far enough ahead that
the next step never loaded.

The clock now reads the position directly and counts completed loops, crediting a wrap only when
the position drops back from within 2 s of the end of the track. Immediately after `play()` it
holds at the start of the loop until the player reports a fresh position, for at most 1.5 s.
Measured after the change: 140.0, 140.1 and 140.2 BPM across three runs against the 140 BPM loop.

### Packages

LEAF 4.0.0 was installed and could not compile: it imports from `InteractionKit.lspkg`, the
folder name the 4.x Interaction Kit installs under, while this project has Spectacles
Interaction Kit 2.0 under `SpectaclesInteractionKit.lspkg`. The whole project failed to build,
not just LEAF. LEAF was replaced with 2.0.2, which matches SIK 2.0. SIK and UI Kit were left at
2.0 as they were, since the behaviour scripts are written against those import paths.

Calling the runtime scene query tool auto-installed `AiPreviewAgentInspect.lspkg` plus `Icons`
and `Motion`, and that package has the same 4.x import problem, so it also broke the build. All
three were removed and the runtime query tool was not used again. Runtime state was verified
through the LEAF scenarios and preview screenshots instead.

### Deviations from the brief

- **The count number's height.** The brief asks for it "floating 40 cm above the far edge of the
  pad, a little below eye level". Those two cannot both hold: 40 cm above the floor at the pad's
  far edge is about 110 cm below a standing eye line, not a little below it. The explicit
  measurement was used, so the number sits 40 cm above the floor at the far edge, where it reads
  as floating just above the footprints. This is visible in the screenshot below.
- **The user has to look down to see the pad.** This follows from the brief's own numbers rather
  than from a choice made here: a pad centred 70 cm ahead on the floor is about 65 degrees below
  a level view, and the SPECS field of view is about 37 x 32 degrees, so the pad, the count
  number and the step card cannot all be in view at once. The off-view arrow is what the brief
  specifies for this, and it works. Whether the hand-over from looking down to looking up feels
  right is the open question the brief already flags.
- **Eye height is assumed to be 150 cm.** The brief gives heights above the floor but the Lens
  has no floor plane to anchor to, so the layout hangs off the camera. 150 cm is the constant
  used; it is the vertical offset of `FootprintPad` under `FloorcountWorld` and changing it moves
  the whole floor layout together.
- **An Audio Listener was added to the Camera Object.** Not in the brief, but without it the
  preview logs a warning on every frame and the spatial sound from the pad does nothing.

Nothing else departs from the brief. The footwork, the tempos, the session rules, the colours
and the sizes are all as written.

## Screenshot

`devpost/shots/pad-lit-footprints.png`: the pad on the floor with its outline, the basic step's
footprints, the left foot lit in cool blue on count 1 with the other three spots dim, and the
count number reading 1 above the far edge of the pad. Captured from the Interactive Preview on
the SPECS 27 profile, 1590 x 1590.

`devpost/shots/step-card-and-arrow.png`: a second shot showing the step card with the title,
"Step 1 of 3", "Slow tempo, 140 BPM", the focus line and the Again and Got it buttons, with the
off-view arrow visible at the bottom pointing back down to the pad.

## Project save

The project was saved through the Editor API (`model.project.save()`) at each milestone: after
the scene was wired, after the first clean preview run, and after the LEAF suite passed. A final
save was taken at the end of the session, after the screenshots were captured, and it returned
successfully. Nothing in the project changed after that save.
