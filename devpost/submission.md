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
## Inspiration

I've done salsa for a few years, several classes at once for a while, then a phase of socials. At home my practice list is short: left turn, right turn, the basic, and "understanding salsa music beats", which has been on that list for a long time.

Practising alone means a tutorial on the phone. The video faces you, so every step is mirrored and you flip it in your head. You lose the count, walk over, scrub back and start again.

## What it does

Floorcount puts the count where your feet go. A 90 cm square sits on your floor with the step's sole prints on it at real size, left feet solid and right feet outlined. Each print lights on its count, nothing lights on 4 and 8 because those are holds, and a clave clicks on 1 and 5 from the floor. Above the far edge there's one large numeral and a strip of eight cells, with the 1 in teal.

After each 8-count you pinch Again or Got it. Two Agains in a row slow the music one level and show only counts 1 to 4 until you get them, then 5 to 8, then the whole step. Three clean at Full moves to the next step. You can also pinch the print for the count you lost. At the end, the step with the most Agains comes back once, then the floor clears and you get a count of Agains per step.

The number hides once you have a step, so you end up dancing to the music with your eyes up. If you look away from both the pad and the card, a small arrow points back to the floor.

Three steps for now: the On1 basic, the right turn and the left turn, leader's part. The music is generated at 140, 170 and 190 BPM, so there's no licensed track.

## How I built it

I planned it with the Devpost skill pack. `plan-lens` wrote `devpost/design-brief.md` with one spatial moment, where each thing lives and six done criteria I could check in the preview.

Snap's CLAD built it from that brief in Lens Studio 5.23.2 through the Lens Studio MCP. Spectacles Interaction Kit handles every pinch, `build-music` and `build-sfx` made the audio, and the sound plays spatially from the pad. LEAF runs one scenario per done criterion, plus one for the step card: 7 of 7 pass in the preview. The beat test samples the Lens 148 times over 8 seconds and found no wrong print, nothing lit on a hold, and 140.4 BPM against the 140 BPM loop.

The design rules are in `.design/brand/`. The look comes from the clave, salsa's timekeeper: the pad is its grid, each print a struck note, and the light decays over one beat like hardwood. On this display black is transparent and alpha is brightness, so there's one ivory ink at three brightnesses and one teal for the 1.

## Challenges

The preview reports a stale audio position for about a second after play, and that was read as the loop wrapping. The count ran at up to 620 BPM against a 140 BPM track until CLAD rewrote the beat clock.

A pad 70 cm ahead on the floor is about 65 degrees below a level gaze and the glasses see about 37 by 32 degrees, so the pad, the numeral and the card are never all in view at once. That's why the arrow exists.

## What's next

Testing on real glasses, which I haven't done. Everything here ran in the Lens Studio preview, so comfort over a session, real hand tracking and the hand-over from looking down at the pad to dancing eyes up are unproven. The Lens doesn't watch your feet: Again and Got it are your own report. After that, shines like the Suzie Q, then bachata.
```

## Built with

```
lens-studio, clad, lens-studio-mcp, spectacles-interaction-kit, leaf, typescript
```

## Links

```
Repository: [X]
Video (public YouTube, under 3 minutes): [X]
```

## Disclosure of pre-existing work

```
Created during the Submission Period. Pre-existing parts: Snap's Spectacles Interaction Kit, Spectacles UI Kit and LEAF packages, the Lens Studio SPECS Base Template, and the Atkinson Hyperlegible Next typeface (SIL Open Font License).
```
