# Devpost submission

Final values only, one field per block. `[X]` means Jonathan still has to supply it. The practice numbers come from `devpost/phone-vs-glasses.md`.

## Project name

```
Floorcount: salsa steps that light up on your floor
```

## Tagline

```
A salsa practice Lens for Specs: the step's footprints light up on your own floor on the beat, and the lesson changes after every 8-count, so you stop walking back to the video.
```

## About the project

```markdown
Floorcount is a salsa practice Lens for SPECS. It draws a step's footprints on the floor in front of you at real size and lights each one on its beat, so you practise from where you stand, not from a video that faces you.

It's for salsa learners practising alone between classes: the hours when a tutorial on a phone is the only teacher in the room.

## Inspiration

I've done salsa for a few years: several classes a week for a while, then a phase of going out to social dance nights. At home my practice list is short: left turn, right turn, the basic, and "understanding salsa music beats", which has been on that list for a long time.

A class shows you a step once a week. The rest of the week it's me and a tutorial on my phone. The video faces me, so every step is mirrored and I flip it in my head. I lose the count, walk over, scrub back and start again.

I measured one of those practices for the video: 13 minutes with a 4:28 right-turn tutorial, played three times through, two walks to the phone to restart it, and 4 minutes of music to actually dance to. The rest was the instructor talking, watched three times over ([how it was measured](https://github.com/JonathanSolvesProblems/floorcount/blob/main/devpost/phone-vs-glasses.md)).

## What it does

Salsa is counted in eights. In the On1 style you step on 1, 2, 3, hold on 4, step on 5, 6, 7 and hold on 8. Floorcount puts that count where your feet go: a 90 cm square pad on the floor, 70 cm in front of you, with the step's sole prints at real size, left feet solid and right feet outlined. Each print lights on its count and nothing lights on the holds. A wooden click marks 1 and 5 from the floor, the two counts a teacher calls to the class. Robin Campbell, who runs the online salsa school The Dance Dojo, calls hearing where the 1 falls "the single biggest hurdle new dancers face" ([The Dance Dojo, 2026](https://thedancedojo.com/blog/how-salsa-music-is-counted/)), so the click marks it rather than playing the clave pattern, which is syncopated and is what beginners lose the count to. Above the far edge a large numeral and a strip of eight cells show where you are, with the 1 in blue.

To your right at hip height, a step card names the step and holds two buttons, Again and Got it. They light up for the first two counts after each 8-count, and you pinch one: Got it if you danced that 8-count cleanly, Again if you didn't. Every step starts Slow (140 BPM). On the whole step, each Got it raises the tempo, to Medium (170) and then Full (190), and three Got its in a row at Full move you to the next step. Two Agains in a row drop the tempo one level (at Slow it stays put) and show only counts 1 to 4; from there each Got it brings back the next half, counts 5 to 8, then the whole step. A Got it hides the numeral and the strip and an Again brings them back, because the aim is dancing to the music with your eyes up. Pinch the print for a count you lost and it keeps a ring. At the end, the step with the most Agains comes back once (if you had any), then you see your Agains per step.

The Lens remembers your last practice. Next time the counts you lost carry a fainter ring, the step card names them until your first answer, and the summary at the end puts each step beside last time.

Three steps so far: the basic and the right and left turns, where an arc on the floor shows the turn. All three are On1, the salsa style where the first step lands on count 1, and the leader's part: the partner who steps forward on that 1. The Lens's practice music is generated with CLAD's build-music skill, so the Lens needs no licensed track.

## The view from where you stand

A phone has nowhere to go when you're dancing. It sits on a shelf facing you, and you walk back to it. On glasses the step is on the floor in front of you, facing the way you face, and both hands are free.

The angle matters. In a preregistered PLOS ONE study this year, 32 dancers learned a routine from video filmed behind the dancer, in front, and in front mirrored. The view from behind did best, most of all for less trained dancers ([Versace et al., 2026](https://doi.org/10.1371/journal.pone.0355860)). Most home tutorials face the viewer, which is the front view. My reasoning, not the study's: footprints at your feet give you the step from your own position, which is closer to the behind view than to a video facing you.

The display is about 37 by 32 degrees and a pad 70 cm ahead on the floor sits about 65 degrees below a level gaze, so the pad, the numeral and the card never fit in view together. The Lens is built around that: the click comes from the floor, the count hides once you don't need it, and if you look away from everything an arrow points back to the pad.

It also uses the one thing glasses have that a phone on a shelf doesn't: they see the room. The pad is placed 150 cm below the eye to begin with, then the Lens reads the depth under it through Snap's WorldQueryModule and, once three readings agree and face up, settles the whole layout onto the floor it found, card included. A wall is ignored and a sofa seat is refused. The preview has no depth to read, so there the pad keeps its fixed height, and a scenario feeds the readings by hand to prove the rule.

So for this job the glasses do three things a laptop or a phone can't: see the floor and settle on it, draw the step at real size where your feet go, and leave your hands and eyes free, with two pinches and a count that comes from the floor.

## What's new about it

Footprints on the floor are about a century old as a way to teach dance: [Arthur Murray](https://www.fundinguniverse.com/company-histories/arthur-murray-international-inc-history/) mailed numbered paper footprints to students from around 1920. In 2017 an iPhone app, [Dance Reality](https://www.uploadvr.com/arkit-app-uses-virtual-footsteps-show-dance/), put animated footprints on the floor through the phone's camera (I know it from launch coverage; it's no longer on the App Store and I haven't used it). Paper can't keep time, and a phone has to be held up between you and your feet. Floorcount is meant to be worn: the prints keep time with the music, the holds stay dark, and the practice slows down or moves on depending on how you answer.

## How I built it

The plan came first. I answered the Devpost Learn skill pack's `plan-lens` questions, and the [design brief](https://github.com/JonathanSolvesProblems/floorcount/blob/main/devpost/design-brief.md) it wrote fixed one moment, where everything sits, and six done criteria that a test in the preview could check.

Snap's CLAD built it from that brief in Lens Studio 5.23.2 through the Lens Studio MCP: 28 sessions and 1095 MCP calls, counted from the sessions' own transcripts in the [build log](https://github.com/JonathanSolvesProblems/floorcount/blob/main/devpost/BUILD_LOG.md), with every prompt in [PROMPTS.md](https://github.com/JonathanSolvesProblems/floorcount/blob/main/devpost/PROMPTS.md). Most of those calls ran LEAF scenarios (Snap's test framework for Lenses), moved the preview camera and drove the preview; the per-tool counts are in the build log. CLAD's `specs-experience-builder` agent did the first build; the CLAD skills it used are `scene-construction`, `editor-api` and `materials` for the scene, the LEAF skills for the tests, and `build-music` and `build-sfx` for the audio. Spectacles Interaction Kit's `Interactable` takes every pinch, and the sound plays from the pad's position.

My brief contradicted itself, and the first build found it. I'd asked for the count to float "40 cm above the far edge of the pad, a little below eye level". 40 cm off the floor is about 110 cm below a standing eye, so CLAD kept the measurement and flagged the conflict in its [build report](https://github.com/JonathanSolvesProblems/floorcount/blob/main/devpost/build-report.md).

LEAF runs one scenario per done criterion plus twelve for what the criteria miss, such as the memory of the last practice and the rule that the blue is only ever on the 1. All 18 pass on a fresh clone of the repository. The beat test sampled the Lens 130 times over 8 seconds and found no wrong print, nothing lit on a hold, and 140.4 BPM against the 140 BPM loop. The session rules and the footwork data also run without Lens Studio: 84 unit tests on every push, and to check those tests are worth something, a script plants 61 bugs in that code, one at a time, and fails the build if the tests let any of them through.

The first build worked and looked generic: blue and orange cartoon feet, a frosted panel, stock icons. I wrote [design rules](https://github.com/JonathanSolvesProblems/floorcount/tree/main/.design/brand) and CLAD applied them. The look comes from the clave, the two wooden sticks that keep time in salsa. The pad is laid out like a percussion part written in boxes, one per count: a print flares on its beat and dims over the next one, like a struck clave, and the holds on 4 and 8 are its rests. On this display black is see-through and brightness is opacity, so everything is one ivory at a few set brightnesses, with blue only for the 1.

## Challenges

The preview reports a stale audio position for about a second after the music starts, and the first beat clock read that as the loop restarting. The count ran at up to 620 BPM against a 140 BPM track until CLAD rewrote the clock.

The first build was never saved and its scene was lost, so every session since saves at each milestone.

One scenario failed on every run while the Lens was fine. At Full, the fade between steps lasts 0.63 seconds and a simulated pinch takes about 0.95, so the fade started and ended inside the pinch, and the test looked only once, afterwards. It now watches every frame.

## What I learned

On glasses, nothing is ever all in view. The pad is 65 degrees below where you look and the display is about 37 by 32 degrees, so I stopped designing a screen and started deciding what each place in the room is for: the floor for the step, the card at hip height for answers, sound from the pad, and an arrow only when everything is out of view.

On this display black is see-through. The first build's dark frosted panel would have been a hole in the room, so the step card became text on the air with two buttons.

Tests have to be specific. The brief said you answer "after an 8-count", and nothing enforced it until a scenario pinched twice in a row and both counted. And preview scenarios miss things a plain unit test catches. A unit test on the footwork data found both turn arcs running 5 cm past the pad's edge, which the eight scenarios that existed then had passed over.

## What's next

Trying it on real glasses. Then shines (solo footwork like the Suzie Q), then bachata.

## What it can't do yet

I haven't had SPECS hardware, so every test and every shot is Lens Studio's preview, where a mouse click or a LEAF scenario stands in for a pinch. Nobody has danced with it on glasses yet. Comfort, real hand tracking and the switch from looking down at the pad to dancing eyes up are untested. It doesn't see your feet: Again and Got it are your word, so it can't tell you you're wrong. The floor settle has only run on readings a test fed in, since the preview has no depth. It covers three steps, the leader's part, On1.

## Who did what

I chose the idea and the steps (my own practice list), set the design rules and decided what stayed. I worked with AI coding agents throughout, directing each session: they helped me answer the planning interview, write the design rules and write the prompts, and Snap's CLAD did the building and testing in Lens Studio, through the MCP.
```

## Built with

```
lens-studio, clad, lens-studio-mcp, spectacles-interaction-kit, leaf, typescript, github-actions, node.js
```

## Image gallery (upload in this order, with these captions)

```
1. devpost/preview/1-floorcount.png
   (also the thumbnail) Floorcount: the salsa count, on your own floor. A practice Lens for SPECS.

2. devpost/preview/2-the-problem.png
   One real practice with a phone tutorial, measured: 13 minutes, the same 4:28 video three times, two walks to the phone, 4 minutes of music to dance to.

3. devpost/preview/3-the-count-on-the-floor.png
   Count 1. Each sole print lights on its count, the holds on 4 and 8 stay dark, and the 1 is the only blue. Lens Studio preview.

4. devpost/preview/4-again-or-got-it.png
   The step card at hip height. After every 8-count you pinch Again or Got it, and the tempo and the step change with your answers. Lens Studio preview.

5. devpost/preview/5-the-right-turn.png
   Three clean 8-counts at Full and the right turn loads, with an arc on the floor for the turn. Lens Studio preview.

6. devpost/preview/6-it-remembers.png
   The next practice opens with the count you lost last time named on the card and ringed on the pad. Lens Studio preview.

7. devpost/preview/7-your-view.png
   A tutorial gives you the front view. Floorcount gives you the step from where you stand, hands free. Lens Studio preview on the right.

8. devpost/preview/8-how-it-was-made.png
   Six done criteria from the plan-lens brief, 1095 Lens Studio MCP calls across 28 CLAD sessions, 18 LEAF scenarios, 84 unit tests.
```

## Links

```
Repository: https://github.com/JonathanSolvesProblems/floorcount
Video (public YouTube, under 3 minutes): https://www.youtube.com/watch?v=n4pGnXYn0ys
Write-up: https://jonathanandrei.com/blog/floorcount-salsa-steps-on-your-floor-specs-lens/
```

## Disclosure of pre-existing work

```
Created during the Submission Period. Pre-existing parts: Snap's Spectacles Interaction Kit, Spectacles UI Kit, LEAF, Icons, Motion and Bitmoji 3D packages, the Lens Studio SPECS Base Template, and the Atkinson Hyperlegible Next typeface (SIL Open Font License).
```
