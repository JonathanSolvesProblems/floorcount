# Design notes for CLAD: Floorcount

Apply after the functional build passes its LEAF tests. These are design notes in the sense of the brief's "After the build" section: what to change, in design terms, so the Lens obeys `.design/brand/CHARTER.md`. The brief's done criteria and sizes stand; only the values the brief marked `(default)` change here. Re-run the LEAF scenarios after applying, and save the project.

## Colour and brightness (charter laws 1 to 5)
- There is one ink, ivory `#F7EEDF`. Remove every other colour from footprints, text, outlines and the pad.
- Brightness is the hierarchy. Alpha is brightness on the additive display: the current count at 100%, the "and" (half a beat before a count) at 60%, everything else at rest, 35%.
- Teal `#5FB4E8` goes on exactly one thing at a time: the count-1 cell of the strip and the footprint that lands on count 1. Nowhere else: not on buttons, not on text, not on the arc.
- Holds (counts 4 and 8): nothing lights. The strip shows an empty (outlined) cell. No dimmed numeral, no greyed footprint.
- Nothing black, nothing darker than 40% luminance, anywhere in the Lens.

## Footprints (laws 6, 7)
- Replace the footprint shapes with the dance-shoe sole prints: textures in `.design/brand/export/`, `fp-left-solid.png` for every left-foot print and `fp-right-outline.png` for every right-foot print. Keep 27 x 10 cm, toes toward the direction of travel, on the floor.
- Left feet are solid, right feet are outlined, at every brightness. Colour never codes a foot. Remove the blue and orange materials.
- Lit, "and" and rest states are the same texture at different alpha (100 / 60 / 35%), tinted ivory, or teal for the count-1 footprint.
- The pinched "lost it here" mark: the footprint flashes to 100% once, then rests with a 1 cm ivory ring around it at 50%. No red.

## The pad (law 8)
- A 90 x 90 cm square, 4 cm corner radius, with a 1 cm ivory border at 50%: texture `pad-border.png`.
- Inside it, the parquet grain `parquet.png` tiled at 30 cm, ivory at 12%. Nothing else drawn on the pad: no grid, no centre mark.
- The turn arc: ivory 1.5 cm stroke at 100% only on its counts, 35% otherwise, capsule-ended. Not teal.

## The count display (law 18)
- Above the far edge of the pad, 40 cm up, facing the user: the clave strip, then the numeral above it.
- The strip: eight capsule cells 6 x 3 cm, gap 1.5 cm (58.5 cm wide in total), built from `cell.png` (filled capsule) and `cell-empty.png` (outlined capsule, for 4 and 8). Cell 1 teal, the rest ivory; the current count's cell at 100%, others at 35%.
- The numeral: 14 cm cap height, Atkinson Hyperlegible Next ExtraBold, ivory, one digit, centred over the strip. Blank on 4 and 8 (holds are rests). Shown and hidden across the session exactly as the brief says.

## Type (laws 11 to 13)
- Import `.design/brand/fonts/AtkinsonHyperlegibleNext-ExtraBold.ttf` and `-Medium.ttf` into `Assets/Fonts/` and use them for every Text component. ExtraBold for numerals and button labels, Medium for everything else.
- No text under 2.5 cm cap height at 1 m. No text block over two lines.

## The step card (laws 14 to 17)
- No opaque or dark panel. The step name (6.75 cm, Medium), the progress line (4.5 cm) and the tempo (3 cm) are ivory text on the air, left-aligned, at 95 cm height and 1 m away, to the right of the pad.
- The two buttons: capsules 12 x 5 cm, "Again" left and "Got it" right, label 10 cm cap height ExtraBold, a 30% ivory capsule behind each. Bright (100%) only during the two-count answer window; 35% otherwise. No hover glow, no pulsing.
- Strings, from `.design/brand/voice.md`: step names "Basic step", "Right turn", "Left turn"; progress "Whole step", "Counts 1 to 4 only", "Counts 5 to 8 only", "3 clean at Full" style counts; tempo "Slow", "Medium", "Full"; summary rows like "Right turn: 4 Agains, lost it on 2 and 5". No exclamation marks, no praise, no emoji.

## Motion (laws 9, 10)
- A footprint and its cell rise from 35% to 60% on the "and" (half a beat before their count), jump to 100% on the count with no attack time, then decay to 35% over one beat: brightness = 0.35 + 0.65 * exp(-4 t), t in beats.
- The two-count fade between steps stays as the brief says. Nothing else animates.

## The arrow (law 17)
- The off-view arrow is a chevron texture `arrow.png`, ivory at 60%, 6 cm, at the bottom edge of the view only while the pad is out of view. No bounce.

## Check before saving
- Pad with lit footprints visible from the start position at 1280 x 720: screenshot to `devpost/shots/`.
- No colour other than ivory and teal in the scene. No panel wider than the pad. No text with "!".
