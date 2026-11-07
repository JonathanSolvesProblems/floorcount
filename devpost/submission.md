# Devpost submission

Final values only, one field per block. `[X]` means Jonathan still has to supply it. Nothing here states a rewind number until `devpost/phone-vs-glasses.md` exists.

## Project name

```
Floorcount
```

## Tagline

```
The salsa count lights up on your own floor, so you stop walking back to the video.
```

## About the project

```markdown
Floorcount is a salsa practice Lens for SPECS. It draws a step's footprints on the floor in front of you at real size and lights each one on its beat, so you practise from where you stand, not from a video that faces you.

## Inspiration

I've done salsa for a few years: several classes a week for a while, then a phase of going out to social dance nights. At home my practice list is short: left turn, right turn, the basic, and "understanding salsa music beats", which has been on that list for a long time.

A class shows you a step once a week. The rest of the week it's me and a tutorial on my phone. The video faces me, so every step is mirrored and I flip it in my head. I lose the count, walk over, scrub back and start again.

## What it does

Salsa is counted in eights. In the On1 style you step on 1, 2, 3, hold on 4, step on 5, 6, 7 and hold on 8. Floorcount puts that count where your feet go: a 90 cm square on the floor with the step's sole prints at real size, left feet solid and right feet outlined. Each print lights on its count and nothing lights on the holds. A wooden click marks 1 and 5 from the floor, and above the far edge a large numeral and a strip of eight cells show where you are, with the 1 in blue.

After each 8-count you pinch Again or Got it while the capsules are lit, one answer per 8-count. Two Agains in a row drop the music one tempo (Slow is 140 BPM, Medium 170, Full 190) and show only counts 1 to 4, then 5 to 8, then the whole step. Three clean 8-counts at Full move you on. A Got it hides the numeral and the strip and an Again brings them back, because the aim is dancing to the music with your eyes up. Pinch the print for a count you lost and it keeps a ring. At the end, the step you struggled with most comes back once, then you see your Agains per step.

The Lens remembers your last practice. Next time the counts you lost carry a fainter ring, the card names them until your first answer, and the summary puts each step beside last time.

Three steps so far: the basic and the right and left turns, all for the leader, the partner who steps forward on 1. The music is generated, so there's no licensed track.

## The view from where you stand

A phone has nowhere to go when you're dancing. It sits on a shelf facing you, and you walk back to it. On glasses the step is on the floor in front of you, facing the way you face, and both hands are free.

The angle matters. In a preregistered PLOS ONE study this year, 32 dancers learned a routine from video filmed behind the dancer, in front, and in front mirrored. The view from behind did best, most of all for less trained dancers (Versace et al., 2026, doi.org/10.1371/journal.pone.0355860). Tutorials are filmed from the front. Footprints at your feet show the step the way the behind view does.

The display is about 37 by 32 degrees and a pad at your feet sits about 65 degrees below a level gaze, so the pad, the numeral and the card never fit in view together. The Lens is built around that: the click comes from the floor, the count hides once you don't need it, and if you look away from everything an arrow points back to the pad.

## What's new about it

Footprints on the floor are about a century old as a way to teach dance: Arthur Murray mailed numbered paper footprints to students from around 1920. In 2017 an iPhone app, Dance Reality, put animated footprints on the floor through the phone's camera (I know it from launch coverage; it's no longer on the App Store and I haven't used it). Paper can't keep time, and a phone has to be held up between you and your feet. Floorcount is worn, keeps time with the music, treats the holds as rests, and changes the practice from what you tell it.

## How I built it

I planned it with the Devpost Learn skill pack. The `plan-lens` interview turned my answers into `devpost/design-brief.md`: one moment, where everything sits, and six done criteria I could check in the preview.

Snap's CLAD built it from that brief in Lens Studio 5.23.2 through the Lens Studio MCP: 23 sessions and 940 MCP calls, counted from the sessions' own transcripts in `devpost/BUILD_LOG.md`, with every prompt in `devpost/PROMPTS.md`. What the MCP was used for most: `run_leaf_scenario` 286 times, `PreviewPanelTool` 120, `MovePreviewCamera` 120, `RunAndCollectLogsTool` 104, `ExecuteEditorCode` 93 (scene edits and every save) and `RecompileTypeScriptTool` 64. CLAD's `specs-experience-builder` agent did the first build; the CLAD skills on the record are `scene-construction`, `editor-api` and `materials` for the scene, the LEAF skills for the tests, and `build-music` and `build-sfx` for the audio. Spectacles Interaction Kit's `Interactable` takes every pinch, and the sound plays from the pad's position.

CLAD caught a mistake in my brief on the first build. I'd asked for the count to float "40 cm above the far edge of the pad, a little below eye level". It pointed out those can't both be true, since 40 cm off the floor is about 110 cm below a standing eye, kept the measurement, and wrote the conflict into its report.

LEAF runs one scenario per done criterion plus eleven for what the criteria miss, such as the memory of the last practice and the rule that the blue is only ever on the 1. All 17 pass on a fresh clone of the repository. The beat test sampled the Lens 121 times over 8 seconds and found no wrong print, nothing lit on a hold, and 140.6 BPM against the 140 BPM loop. The session rules and the footwork data also run without Lens Studio: 78 unit tests on every push, plus a script that slips 54 deliberate bugs into that code one at a time and fails if any gets through. None does.

The first build worked and looked generic: blue and orange cartoon feet, a frosted panel, stock icons. I wrote design rules (`.design/brand/`) and CLAD applied them. The look comes from the clave, the two wooden sticks that keep time in salsa. The pad is laid out like its grid, and a print flares on its beat and dims over the next one, like a struck note. On this display black is see-through and brightness is opacity, so everything is one ivory at a few set brightnesses, with blue only for the 1.

## Challenges

The preview reports a stale audio position for about a second after the music starts, and the first beat clock read that as the loop restarting. The count ran at up to 620 BPM against a 140 BPM track until CLAD rewrote the clock.

The first build was never saved and its scene was lost, so every session since saves at each milestone.

One scenario failed on every run while the Lens was fine. At Full, the fade between steps lasts 0.63 seconds and a simulated pinch takes about 0.95, so the fade started and ended inside the pinch, and the test looked only once, afterwards. It now watches every frame.

## What I learned

The brief said you answer "after an 8-count", and nothing enforced it until a scenario pinched twice in a row and both counted. Now the Lens takes one answer per 8-count and a scenario checks it.

Preview scenarios miss things a plain unit test catches. A unit test on the footwork data found both turn arcs running 5 cm past the pad's edge, which the eight scenarios that existed then had passed over.

## What's next

Trying it on real glasses. Then shines (solo footwork like the Suzie Q), then bachata.

## What it can't do yet

It has only run in the Lens Studio preview, driven by mouse clicks or by LEAF pressing the same buttons; nobody has danced with it on glasses. Comfort, real hand tracking and the switch from looking down at the pad to dancing eyes up are untested. It doesn't see your feet: Again and Got it are your word, so it can't tell you you're wrong. The pad is placed from a fixed 150 cm eye height, not a tracked floor. The click marks 1 and 5 and isn't the full clave rhythm. It covers three steps, the leader's part, On1.

## Who did what

I chose the idea and the steps (my own practice list), set the design rules and decided what stayed. I worked with AI coding agents throughout: the planning interview, the design rules and every prompt came out of sessions I directed, and Snap's CLAD built and tested the Lens in Lens Studio through the MCP.
```

## Built with

```
lens-studio, clad, lens-studio-mcp, spectacles-interaction-kit, leaf, typescript, github-actions, node.js
```

## Image gallery (upload in this order, with these captions)

```
1. .design/brand/export/cards/devpost-thumbnail-1500x1000.png
   (thumbnail, 3:2, no caption)

2. devpost/shots/pad-count1-teal.png
   Count 1. The 1 is the only blue in the Lens: the left foot's print and the first cell. Lens Studio preview.

3. devpost/shots/pad-count5-lit.png
   Count 5. Left feet solid, right feet outlined; the cells for 4 and 8 stay empty because those are holds. Lens Studio preview.

4. devpost/shots/right-turn-arc.png
   The right turn on count 2. The arc appears only on the two counts that turn. Lens Studio preview.

5. devpost/shots/step-card-answer-window.png
   After each 8-count you answer Again or Got it. Two Agains slow the music and halve the step. Lens Studio preview.

6. devpost/shots/last-time-rings.png
   The next practice opens with last time's lost counts ringed and named on the card. Lens Studio preview.

7. devpost/shots/summary-last-time.png
   The end of the second practice: each step's Agains next to last time's. Lens Studio preview.

8. .design/brand/export/cards/gallery-before-after-1500x1000.png
   The first build worked and looked like a default. The second is after the design rules were applied.

9. .design/brand/export/cards/gallery-how-it-was-made-1500x1000.png
   From brief to tests: six done criteria first, then the MCP calls that built it, then the scenarios and unit tests that check it.
```

## Links

```
Repository: https://github.com/JonathanSolvesProblems/floorcount
Video (public YouTube, under 3 minutes): [X]
```

## Disclosure of pre-existing work

```
Created during the Submission Period. Pre-existing parts: Snap's Spectacles Interaction Kit, Spectacles UI Kit, LEAF, Icons, Motion and Bitmoji 3D packages, the Lens Studio SPECS Base Template, and the Atkinson Hyperlegible Next typeface (SIL Open Font License).
```
