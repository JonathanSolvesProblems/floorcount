# Floorcount

A salsa practice Lens for SPECS. The count lights up on your own floor, so you stop walking back to the phone.

Built for Learn AR with SPECS (Devpost Learn, with Snap's CLAD), November 2026.

## The moment

I practise salsa alone at home. The tutorial is on my phone. It faces me, so every step is mirrored; I lose the count, walk over, scrub back, and start again. Floorcount puts the count where my feet are: eight footprints at real size on a bordered square on the floor, each one lighting on its count, a clave clicking on 1 and 5 from the floor, and a strip of eight cells above the far edge that shows where in the phrase I am. The number hides once I have the step, so I dance eyes up, to the music.

## What it does

- Three steps from my own practice list: the basic, the right turn, the left turn (On1, leader's part).
- Each 8-count ends with two targets at hip height: **Again** or **Got it**. Two Agains in a row slow the music one level and show only counts 1 to 4 until I get them, then 5 to 8, then the whole step. Three clean at Full tempo moves to the next step. At the end, the step I pinched Again on most comes back once, then the floor clears and the card shows each step's Again count.
- Pinch the footprint for the count you lost, and the Lens remembers it for the session.
- Look away from the pad and a small arrow at the bottom of the view points back; the clave keeps going.
- The practice music is generated, at 140, 170 and 190 BPM, so there is no licensed track.

## How it was planned and built

1. **Planned with the Devpost skill pack.** The `plan-lens` interview wrote [devpost/design-brief.md](devpost/design-brief.md): the one spatial moment, where each thing lives, how the hands act on it, six done criteria that can be checked in the preview.
2. **Built by CLAD through the Lens Studio MCP.** Snap's `specs-experience-builder` agent built the scene in Lens Studio 5.23.2 from the brief, with Spectacles Interaction Kit 2.0 and UI Kit 2.0 for every interaction, generated music and sound (`build-music`, `build-sfx`), and the Editor API to save the project at each milestone. The full account, including the beat clock it had to rewrite because the preview's audio position lags for a second after play, is in [devpost/build-report.md](devpost/build-report.md).
3. **Tested with LEAF.** One scenario per done criterion in `Assets/Tests/`, run in the preview, plus one for the step card: 7 of 7 pass. Criterion 2 was sampled 138 times over 8 seconds: the right footprint lit on every stepping count, nothing lit on 4 or 8, and the count ran at 140.0 BPM against the 140 BPM loop.
4. **Designed as its own thing.** The look is derived from the clave, salsa's timekeeper: the pad is the clave's grid, each footprint a struck note, the light the strike, decaying like hardwood, holds as rests. One ivory ink at three brightnesses, teal on the 1 only, left feet solid and right feet outlined, every edge a capsule. The brand sheet is [.design/brand/index.html](.design/brand/index.html); the laws every surface obeys are in [.design/brand/CHARTER.md](.design/brand/CHARTER.md); the design notes CLAD applied are in [devpost/design-notes.md](devpost/design-notes.md).

## Try it in the preview

Open `ARSpec.esproj` in Lens Studio 5.23.2 or later, choose the SPECS preview, and switch to Interactive Preview. Move with WASD, Q and E for down and up, right-drag to look. A click is a pinch. Stand where the Lens puts you, look down at the pad, and pinch Again or Got it after each 8-count. The LEAF panel runs the six scenarios.

## Limits

- Everything here ran in Lens Studio's preview. No SPECS device was used, so comfort over a real session, real hand tracking and the hand-over from looking down at the pad to dancing eyes up are unproven.
- The Lens does not watch your feet. Again and Got it are your own report.
- Eye height is a constant (150 cm); the pad hangs off the camera, not off a tracked floor.
- A pad 70 cm ahead on the floor is about 65 degrees below a level gaze, and the glasses see about 37 by 32 degrees, so the pad, the count and the card are never all in view at once. The arrow is what brings you back.

## Repository

- `devpost/`: the brief, the build report, the design notes, the design-pass report, screenshots.
- `.design/`: the brand kit (sheet, charter, voice, manifest, exported textures, fonts) and the found details it came from.
- `Assets/`: scripts, scene, tests, generated audio, textures.
- `DEMO_SCRIPT.md`: the shot list for the video.

Typeface: Atkinson Hyperlegible Next (Braille Institute, SIL Open Font License). Reference photos from Wikimedia Commons, credited in `.design/refs/credits.json`.



