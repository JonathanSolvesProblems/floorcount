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

After each 8-count you pinch Again or Got it, and the Lens takes one answer per 8-count. Two Agains in a row slow the music one level and show only counts 1 to 4 until you get them, then 5 to 8, then the whole step. Three clean 8-counts at Full move to the next step. You can also pinch the print for the count you lost. At the end, the step with the most Agains comes back once, then the floor clears and you get a count of Agains per step.

The Lens keeps your last practice. Next time, the counts you lost carry a fainter ring, the card says "Last time: lost it on 2 and 5" until you answer, and the end card puts each step's Agains beside last time's.

The number hides once you have a step, so you end up dancing to the music with your eyes up. If you look away from both the pad and the card, a small arrow points back to the floor.

Three steps for now: the On1 basic, the right turn and the left turn, leader's part. The music is generated at 140, 170 and 190 BPM, so there's no licensed track.

## Who it's for

People learning partner-dance footwork who practise alone between classes. That's me. A class shows you the step once a week. The rest of the week you're on your own with a phone.

## Why glasses

Dancing uses the whole body, so a phone has nowhere to go. It sits on a shelf facing me and I walk back to it. The glasses put the step on the floor from where I'm standing, at real size, facing the way I face, with both hands free.

Where you watch from matters. A preregistered study in PLOS ONE this year had 32 dancers learn a choreography from video in three views. The view from behind the dancer, which is the learner's own view, beat both front views, mirrored or not, and helped the less trained dancers most (Versace et al., 2026, doi.org/10.1371/journal.pone.0355860). A tutorial facing you is a front view. The pad is the view from where you stand.

The display is small, about 37 by 32 degrees, and a pad at my feet is about 65 degrees below a level gaze. I can't see the pad, the count and the card at once, so the Lens doesn't ask me to. The clave sounds from the floor and the count hides once I stop needing it. If I look away from everything, an arrow points back to the pad.

## How it's different

Footprints on the floor are a hundred years old. Arthur Murray sold them by mail from about 1920: numbered paper prints you laid out at home. In 2017 an iPhone app, Dance Reality, drew animated footprints on the floor through the phone's camera (I know it from its App Store listing and launch coverage, I haven't used it). Paper can't keep time, and a phone has to be held up between your eyes and your feet while you dance.

Floorcount is worn, so the prints are on the floor and nothing is in my hands. It also counts the way salsa is counted: on 4 and 8 no print lights and the cell stays an outline, because a hold is a rest.

It changes with how I'm doing. Two Agains slow the music and cut the step in half, and three clean 8-counts at full tempo move on. Once I have a step the numeral and the strip hide, because the goal is dancing to the music with my eyes up, not following lights.

## How I built it

I planned it with the Devpost skill pack. `plan-lens` wrote `devpost/design-brief.md` with one spatial moment, where each thing lives and six done criteria I could check in the preview.

Snap's CLAD built it from that brief in Lens Studio 5.23.2 through the Lens Studio MCP: 14 sessions and 712 MCP calls, counted from the sessions' own transcripts in `devpost/BUILD_LOG.md`, with every prompt in `devpost/PROMPTS.md`. Spectacles Interaction Kit handles every pinch, `build-music` and `build-sfx` made the audio, and the sound plays spatially from the pad.

LEAF runs one scenario per done criterion, then eleven more for what the criteria leave out, like the session memory and the rule that only the 1 is ever teal: 17 of 17 pass in the preview. The beat test sampled the Lens 154 times over 8 seconds and found no wrong print, nothing lit on a hold, and 140.5 BPM against the 140 BPM loop.

The rules of a session (when to slow down, when to halve the step, when to move on) and the footwork data are plain TypeScript with no Lens Studio in them, so 77 unit tests run on every push. I also planted 52 bugs in that code, one at a time, to check the tests catch each one. They catch all 52.

The first build worked and looked like a default: blue and orange cartoon feet, a frosted panel, stock icons. So I wrote design rules, in `.design/brand/`, and had CLAD apply them as design notes. The look comes from the clave, salsa's timekeeper: the pad is its grid, each print a struck note, and the light decays over one beat like hardwood. On this display black is transparent and alpha is brightness, so there's one ivory ink at three brightnesses and one teal for the 1.

## Challenges

The preview reports a stale audio position for about a second after play, and that was read as the loop wrapping. The count ran at up to 620 BPM against a 140 BPM track until CLAD rewrote the beat clock.

A pad 70 cm ahead on the floor is about 65 degrees below a level gaze and the glasses see about 37 by 32 degrees, so the pad, the numeral and the card are never all in view at once. That's why the arrow exists.

The first build was never saved, and the scene was lost. Every CLAD session since saves through the Editor API at each milestone.

One scenario started failing on every run while the Lens was fine. At full tempo the fade between steps lasts 0.63 seconds and a simulated pinch takes about 0.95, so the fade could start and finish inside the pinch, and the test only looked once, afterwards. Now it watches every frame and checks the order: learning, fading, next step.

## What I learned

Write "done" as something a test can check. The brief said you answer "after an 8-count", and nothing enforced it until a scenario pinched twice in a row and both pinches counted. Now the Lens takes one answer per 8-count and a test holds it there.

Tests in the preview don't see everything. A unit test on the footwork data found both turn arcs running 5 cm past the pad's edge, which eight preview scenarios had passed over.

## What's next

Testing on real glasses, which I haven't done. After that, shines like the Suzie Q, then bachata.

## Limits, plainly

Every Lens shot in the video is the Lens Studio preview with simulated hand input: a mouse click, or a LEAF scenario pressing the same targets. It hasn't run on SPECS hardware, so comfort over a session, real hand tracking and the hand-over from looking down at the pad to dancing eyes up are unproven. The Lens doesn't watch my feet: Again and Got it are my own report, so it responds to what I tell it and can't tell me I'm wrong. I'm the only person who has practised with it. Leader's part, On1, three steps.

## Created by

Solo project. The idea and the steps are mine, they're my own practice list, and I made the calls on what to keep. I worked with AI coding agents throughout. The planning interview, the design rules and the prompts were written in sessions I directed, and Snap's CLAD built and tested the Lens in Lens Studio through the MCP.
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
   Count 1: the left foot's print strikes in teal, the only colour in the Lens (Lens Studio preview).

3. devpost/shots/pad-count5-lit.png
   Count 5. Left feet are solid, right feet outlined, and nothing lights on 4 and 8 because they are holds.

4. devpost/shots/right-turn-arc.png
   The right turn on count 2. The arc shows only on the counts that turn.

5. devpost/shots/step-card-answer-window.png
   After each 8-count: Again or Got it. Two Agains slow the music and show half the step.

6. devpost/shots/last-time-rings.png
   The next practice: the counts lost last time carry a fainter ring, and the card says which.

7. devpost/shots/summary-last-time.png
   The end of a practice, each step against last time.

8. .design/brand/export/cards/gallery-before-after-1500x1000.png
   The first build worked and looked like a default. The second is after the design rules were applied.

9. .design/brand/export/cards/gallery-how-it-was-made-1500x1000.png
   Planned with the Devpost Learn skill pack, built by CLAD through the Lens Studio MCP, tested in the preview and on every push.
```

## Links

```
Repository: https://github.com/JonathanSolvesProblems/floorcount
Video (public YouTube, under 3 minutes): [X]
```

## Disclosure of pre-existing work

```
Created during the Submission Period. Pre-existing parts: Snap's Spectacles Interaction Kit, Spectacles UI Kit, LEAF, Icons and Motion packages, the Lens Studio SPECS Base Template, and the Atkinson Hyperlegible Next typeface (SIL Open Font License).
```

## Sources for the page's claims

Not a Devpost field. Kept here so each claim on the page can be traced.

- Viewing perspective study: Versace et al., "Enhancing dance learning by optimising instructional perspective: A preregistered study on the effect of dancers' viewing perspective, cognitive load and expertise", PLOS ONE 21(9), 2026. https://doi.org/10.1371/journal.pone.0355860
- Arthur Murray's mail-order footprints, about 1920: https://www.fundinguniverse.com/company-histories/arthur-murray-international-inc-history/
- Dance Reality, 2017: https://www.geekwire.com/2017/dance-reality-app-helps-users-get-footwork-augmented-reality-thanks-apples-arkit/ and https://apps.apple.com/us/app/dance-reality/id1277367395
- Session and MCP call counts: `devpost/BUILD_LOG.md`, regenerated from the session transcripts.
- LEAF results: `devpost/design-pass-report.md`, section "Session memory and coverage, 6 November 2026".
- Unit tests and planted breaks: `npm test` and `npm run breaks` in `tests/unit/`.
