# I planted 52 bugs in my AR Lens to find out if my tests were lying

Draft for DEV. Not published. Tags: `ar`, `testing`, `typescript`, `hackathon`.

---

I practise salsa at home with a tutorial on my phone. The video faces me, so every step is mirrored. I lose the count, walk over, scrub back and start again.

For the Learn AR with SPECS hackathon I built Floorcount, a Lens for Snap's glasses that puts the count on the floor: sole prints at real size on a 90 cm pad, each one lighting on its beat, from where I stand. Snap's CLAD agents built it in Lens Studio through the Lens Studio MCP, from a brief with six done criteria. Each criterion got a LEAF scenario that runs the Lens in the preview and checks it.

All of them passed. The Lens was still wrong in ways none of them saw.

## What the preview tests missed

The right turn has an arc on the floor that shows which way to turn. I moved the footwork data into plain TypeScript so it could run under Node, and wrote a test that says every drawn thing stays inside the pad. It failed straight away. Both turn arcs ran 5 cm past the pad's edge. Every preview scenario had passed over it, because none of them measured it and at a glance it looked fine.

The brief said you answer Again or Got it "after an 8-count". Nothing enforced that. A scenario that pinched twice in a row had both pinches counted, so two quick clicks could skip half a step. Now the Lens takes one answer per 8-count, and a scenario holds it there.

## Do the tests catch anything?

A passing test tells you nothing if it would also pass with the bug in. So I wrote a script that plants bugs in the three pure files (the footwork data, the session rules, the brightness curve), one at a time: flip a comparison, change a count, drop a line. It reruns the suite after each one. A planted bug that the tests miss fails the run.

52 planted bugs, 77 tests. All 52 are caught, and the run is part of CI, so a test that stops catching its bug fails the build.

It is a small version of mutation testing, written by hand because the interesting mutations are the ones that mean something in salsa. "Count 8 stops being a hold" is one of them. So is "two Agains raise the tempo instead of dropping it".

## Four things that went wrong along the way

The first build was never saved. Lens Studio closed and the scene was gone. Every session since saves through the Editor API at each milestone.

The preview reports a stale audio position for about a second after play. The first beat clock read that as the loop wrapping and ran the count at up to 620 BPM against a 140 BPM track.

One test failed on every run while the Lens was fine. At full tempo the fade between steps lasts 0.63 seconds and a simulated pinch takes about 0.95, so the fade could start and finish inside the pinch, and the test only looked once, afterwards. It watches every frame now and checks the order, which is a stricter test than the one it replaced.

A fresh clone looked like it hung for half an hour on "Loading Icon Atlas". It was a permission dialog for an editor plugin, sitting behind the agent's session where nothing could click it. The MCP stops answering while a modal is up. Reading the window through Windows accessibility showed two buttons.

## What I'd keep

Write "done" as something a test can check, before any code. Then move whatever logic you can out of the engine and test it without the engine. The preview tells you the Lens runs. It doesn't tell you the Lens is right.

Code and the build log: https://github.com/JonathanSolvesProblems/floorcount
