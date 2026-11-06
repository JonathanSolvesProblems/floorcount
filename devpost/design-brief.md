---
status: approved
---

# Design brief: Floorcount

<!-- Filled in by plan-lens from the learner's interview. Use the learner's words. Mark any value they didn't choose as (default). -->

## The one spatial moment
I'm practising salsa alone in my living room. I look down at the floor in front of me and see the footprints for the step I'm drilling, at real size, and each one lights up on its count as the music plays (1, 2, 3, hold on 4, 5, 6, 7, hold on 8), so I can find the 1 and stay on it without walking back to a video on my phone. (moment: Jonathan; layout and timing: default)

## Why it belongs on glasses
- Uses: draws in the world, leaves your body free, shares your view.
- Why it's better than the phone or laptop version: a phone tutorial faces me and is mirrored, so I flip every step in my head, lose the count, walk to the phone, scrub back and start again. Here the steps are on my own floor, from my own point of view, and the count is in the room with me, so I never stop dancing to check. (Jonathan's practice problem, from his own notes: "understanding salsa music beats". He has done salsa for a few years, took several classes at once and went through a phase of socials.)

## Product or overlay
- Type: product. Floorcount is a practice trainer; the footprints and the count are the experience.
- What the real version would sense: nothing. It does not watch my feet.
- Stand-in for the preview: none needed. I tell it how the 8-count went by pinching (see Hands and input), on glasses and in the preview alike.

## Where things live
- Where the user is looking during the main task: down and ahead at the floor, about 1 m in front of my feet, while learning a step; up and ahead once I have it.
- Footprint pad: on the floor, centred 70 cm in front of the start position, about 90 x 90 cm, a faint outline only. (default)
- Footprints: on the pad, real foot size, 27 x 10 cm each, left foot cool blue and right foot warm orange, light colours only. The next footprint glows softly half a beat before its count, then lights fully on the count. (default)
- Turn arc: a curved arrow drawn on the floor around the footprints on the counts where the step turns, showing the direction of the spin. (default)
- Count number: one large number (about 14 cm tall, light text), floating 40 cm above the far edge of the pad, a little below eye level, facing me. (default)
- Step card: a small panel 1 m away at about 95 cm high, to the right of the pad, showing the step name, "step 2 of 3" and the tempo (Slow / Medium / Full). (default)
- Again and Got it buttons: two big buttons (12 cm) on the step card, Again on the left, Got it on the right. (default)
- Sound: the practice music plays from a point on the pad, and a clave click marks counts 1 and 5 from the pad, so the count comes from the floor where the steps are. (default)

## Hands and input
- Got it: pinch the Got it button after an 8-count I danced clean.
- Again: pinch the Again button after an 8-count I lost.
- Mark where I lost it: pinch the footprint for the count I lost (that footprint flashes and is remembered for this session).
- Start / pause: pinch the step card's title. (default)
- Targets are big and highlight when aimed at.
- Voice (if any) and the button that does the same job: "again" = Again button, "got it" = Got it button, "lost it on five" = pinching footprint 5. Voice is a bonus; every action works with the buttons. (default)

## When things show
- Footprints: the current step's eight footprints show while I'm learning it. Each lights only on its count. After three clean 8-counts in a row at Full tempo, they fade out over two counts and the next step loads.
- Count number: shows the first time a step plays and after any Again; hides after a clean 8-count, so once I have it I'm dancing to the music, not the number.
- Turn arc: shows only on the turn counts of a turn step.
- Buttons: always there, dim during the 8-count and bright for the two counts after it, when the Lens is waiting for my answer. (default)
- What the Lens does after each 8-count: two Agains in a row on a step drops the tempo one level and shows only counts 1 to 4 until I pinch Got it, then counts 5 to 8, then the whole step again. Three Got its in a row at Full tempo moves to the next step. A Got it at a lower tempo raises the tempo one level. (default)
- Session end: after the last step, the step I pinched Again on most comes back once at Full tempo. Then the floor clears and the step card shows the three steps with how many Agains each took.
- If something needs attention out of view: if I look up and away from the pad while the footprints are still needed, a small arrow at the bottom of my view points back down to the pad, and the clave keeps playing from the floor. (default)

## Done criteria
Each one can be checked in Lens Studio's preview.
1. When the Lens starts, the footprint pad appears on the floor about 70 cm in front of me with the basic step's eight footprints at real size, and the practice music starts at Slow tempo.
2. Each footprint lights on its count in time with the music, nothing lights on 4 and 8, and the count number above the pad shows the current count.
3. Pinching Again twice in a row drops the tempo one level and shows only counts 1 to 4 of the step.
4. Pinching Got it three times in a row at Full tempo fades the footprints and loads the next step (right turn), and its turn arc appears on the turn counts.
5. Pinching a footprint flashes it, and after the last step the step with the most Agains replays once; then the floor clears and the step card shows each step's Again count.
6. Looking up away from the pad shows a small arrow at the bottom of the view pointing back to it.

## Out of scope
- Watching or judging my real feet.
- Partner work (leading and following), and dancing On2.
- Shines such as the Suzie Q, and the other dances I do (bachata, cha cha, merengue, hip-hop, breaking, West Coast swing).
- Saving progress between sessions.
- Licensed music: the practice track is generated.

## Risks and open questions
- Looking down while turning is bad salsa technique, and the glasses' view is narrow (about 37 x 32 degrees). The footprints are for learning a step; the count number and the clave are what should carry me once I look up. Only real glasses can say whether that hand-over feels right (feel unproven).
- The three steps' footwork is drafted from the standard On1 basic and was approved by Jonathan with this brief (2026-11-01). Default footwork, leader's part, counts from my start position:
  - Basic step: 1 left foot forward, 2 replace weight on right, 3 left foot back beside right, 4 hold, 5 right foot back, 6 replace weight on left, 7 right foot back beside left, 8 hold.
  - Right turn: 1 left foot forward, 2 right foot steps forward and across as I pivot a half turn right, 3 left foot completes the turn back to facing front, 4 hold, 5 to 8 as the basic.
  - Left turn: the mirror of the right turn: 1 to 4 as the basic, 5 right foot back, 6 left foot steps across as I pivot a half turn left, 7 right foot completes the turn, 8 hold.
- Voice may not work in the preview; the buttons carry every action.
- Whether my self-reported Again and Got it match what my feet really did is up to me.
- Tempos (default): Slow 140, Medium 170, Full 190 beats per minute, one count per beat.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
