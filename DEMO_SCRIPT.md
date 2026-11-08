# Floorcount: demo script

Two cuts from one shot list. The core cut is about 90 seconds. The full cut adds three beats (the memory of the last practice, why glasses, the limits) and runs about 2 minutes 15. The event allows 3 minutes, and reviewers do not run the project, so the video is the only place they see it work and the only place they see how it was built. I'd submit the full cut.

Everything in the Lens is a recording of Lens Studio's Interactive Preview. The only real footage is me at home. No other people, no third-party logos or app branding on screen (the rules ban third-party trademarks), and no licensed music: the only music is the practice loop the Lens generates.

`N` and `M` in the opener come from `devpost/phone-vs-glasses.md`, measured on a real practice. They are never guessed. If the file does not exist, the opener drops that sentence.

| Time (full cut) | Cut | Shot | Voice |
|---|---|---|---|
| 0:00 to 0:02 | core | Title card. | (none) |
| 0:02 to 0:14 | core | My room. A propped-up phone plays a salsa tutorial (screen out of focus, audio muted). I start a right turn, lose the count, walk to the phone and scrub back. | "This is how I practise salsa at home. The video faces me, so every step is mirrored. I lose the count, walk over, scrub back and start again. N times in M minutes." |
| 0:14 to 0:32 | core | Lens Studio preview. The pad on the floor 70 cm ahead with the basic step's sole prints at real size. Music at Slow. Prints light on 1, 2, 3, hold, 5, 6, 7, hold. The numeral and the strip of eight cells above the far edge, the 1 in blue, 4 and 8 empty. | "Floorcount puts the count on my own floor. Each print lights on its beat, from where I stand. Nothing lights on 4 and 8, because those are holds. The clave comes from the floor." |
| 0:32 to 0:48 | core | `preview-02`: a Got it takes the music up to Medium, then Again after one 8-count and again after the next. The music drops back to Slow and only counts 1 to 4 stay lit. | "After each 8-count I tell it how that went. Again, twice in a row, and it slows the music and gives me half the step." |
| 0:48 to 1:03 | core | Got it after each of three clean 8-counts at Full. The basic's prints fade over two counts and the right turn loads, with its arc on counts 2 and 3. I look up and away: the arrow at the bottom of the view points back to the pad. | "Three clean at full speed and it moves on. When I get it, the number hides, so I'm dancing eyes up, to the music. If I look away, an arrow points back." |
| 1:03 to 1:15 | full | A second session. The print I lost last time carries a faint ring and the card reads "Last time: lost it on 5". Cut to the summary: each step's Agains beside last time's. | "Next practice, it remembers. The count I lost last time has a ring on it, and at the end I see this session against the last one." |
| 1:15 to 1:28 | full | Split frame. Left: the tutorial's view, a dancer facing the camera (my own footage, no third-party video). Right: the pad from where I stand. A source line on screen: Versace et al., PLOS ONE, 2026. | "Why glasses. A study this year had 32 dancers learn a routine from three camera angles, and the view from behind, the dancer's own view, came out ahead. A tutorial is the front view. This one is mine." |
| 1:28 to 1:53 | core | The build, all real: the plan-lens brief in `devpost/`, a CLAD prompt from `devpost/PROMPTS.md`, Lens Studio's LEAF panel running the scenarios, a terminal running `npm test` and `npm run breaks`, the before and after slide. | "I planned it with the Devpost skill pack: one interview, one brief, six done criteria. Snap's CLAD built it in Lens Studio through the MCP. LEAF runs the scenarios in the preview. The session rules also run as unit tests on every push, and I planted 54 bugs to check the tests catch them. The first build looked like a default, so I wrote design rules and CLAD applied them." |
| 1:53 to 2:03 | full | The pad in the preview, wide, the Lens Studio window visible around it. | "All of this is the Lens Studio preview. It hasn't run on the glasses yet, and it doesn't watch my feet. It goes on what I tell it." |
| 2:03 to 2:13 | core | A full right-turn 8-count in the preview, each print lighting on its count. Cut to me doing the same turn in my room, eyes up, no phone in frame. | "Right turn, on the one. Floorcount." |
| 2:13 to 2:16 | core | End card. | (none) |

Final shot: the turn, done, in my own room. Not a number being revealed.

The core cut drops the three "full" rows and shortens the build beat to its first three sentences.

Cards: `.design/brand/export/cards/title-card-1920x1080.png` before the opener and `end-card-1920x1080.png` after the final shot. Both come from the brand kit (`.design/brand/`), so the video opens and closes on the same wordmark, strip and walnut floor the Lens icon uses. The before and after slide is `gallery-before-after-1500x1000.png` in the same folder.

## What I have to record myself

1. The opener: a real practice with the tutorial on the phone, filmed wide enough to see me walk to it. This take is also the measurement for `devpost/phone-vs-glasses.md`.
2. The final shot: one clean right turn, eyes up, no phone in frame.
3. For the split frame: ten seconds of me doing the basic facing the camera.
4. The voice, read from the Voice column in one take per row.

Everything else is captured from Lens Studio and the terminal.

## Checks before recording

Nothing in the climax comes from a seed or fixture. The LEAF run shown is a real run. The footwork on screen is the brief's footwork. The phone in the opener shows no readable branding. The number in the opener traces to `devpost/phone-vs-glasses.md`. Every number spoken is on the Devpost page with its source. The second-session beat is a real second session: the saved one is made by finishing a first session in the preview, not by writing the saved data by hand.
