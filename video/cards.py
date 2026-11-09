"""Overlays and cards for the Floorcount video, in the brand kit's palette and type.

  py tmp/cards.py

Writes to broll/: ov-*.png (1920x1080 RGBA overlays), timeline.mp4 and floor-diagram.mp4.
"""
import json
import math
import os
import subprocess

from PIL import Image, ImageDraw, ImageFont

BRAND = ".design/brand"
XB = BRAND + "/fonts/AtkinsonHyperlegibleNext-ExtraBold.ttf"
BD = BRAND + "/fonts/AtkinsonHyperlegibleNext-Bold.ttf"
MD = BRAND + "/fonts/AtkinsonHyperlegibleNext-Medium.ttf"
FLOOR = (26, 22, 18)
INK = (247, 238, 223)
TEAL = (95, 180, 232)
W, H = 1920, 1080
os.makedirs("broll", exist_ok=True)


def font(path, size):
    return ImageFont.truetype(path, size)


def ink(a=255):
    return INK + (a,)


def plate(draw, box, alpha=200, radius=26):
    draw.rounded_rectangle(box, radius, fill=FLOOR + (alpha,))


def text_w(draw, s, f):
    return draw.textlength(s, font=f)


def new():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


# ---------- small tags and source plates ----------
def tag(path, lines, x, y, size=28, align="left", alpha=236, fontpath=MD):
    # near-opaque: at 190 the text of a white page (the two articles, GitHub) read through the plate
    img, d = new()
    f = font(fontpath, size)
    tw = max(text_w(d, s, f) for s in lines)
    th = size * 1.25 * len(lines)
    pad = 18
    if align == "right":
        x = x - (tw + 2 * pad)
    plate(d, (x, y, x + tw + 2 * pad, y + th + 2 * pad - 6), alpha, 20)
    yy = y + pad - 4
    for s in lines:
        d.text((x + pad, yy), s, font=f, fill=ink(235))
        yy += size * 1.25
    img.save(path)


tag("broll/ov-tag-preview.png", ["Lens Studio preview"], W - 60, 48, 28, align="right")
tag("broll/ov-tag-diagram.png", ["Diagram. The preview has no depth, so this part is for the glasses, not yet tested on them."], W - 60, 48, 28, align="right")
tag("broll/ov-src-campbell.png", ["Source: Robin Campbell, The Dance Dojo, 2026"], 60, 48, 28)
tag("broll/ov-src-versace.png", ["Source: Versace et al., PLOS ONE, 2026. 32 dancers, three views; the back view came out ahead."], 60, 48, 28)
tag("broll/ov-src-measured.png", ["Measured from this practice's screen recording. devpost/phone-vs-glasses.md"], 60, 48, 26)
tag("broll/ov-label-front.png", ["Front view. A tutorial faces you."], 60, 48, 30)
tag("broll/ov-label-yours.png", ["Your view. Floorcount, from where you stand."], W // 2 + 60, 48, 30)
tag("broll/ov-src-leaf.png", ["LEAF: Snap's test framework for Lenses. 18 scenarios here, all passing."], 60, 48, 28)
# the states the voice names, labelled while they are on screen (the change itself is subtle in the preview)
tag("broll/ov-tag-why.png", ["The tutorial faces me. Every restart is a walk to the phone."], 60, 48, 28)
tag("broll/ov-tag-again.png", ["After two Agains: Slow, counts 1 to 4 only."], 60, 48, 28)
tag("broll/ov-tag-clean.png", ["After three clean 8-counts at Full: the right turn loads."], 60, 48, 28)
tag("broll/ov-tag-clad.png", ["CLAD: Snap's coding agent for Lens Studio.",
                              "It built the scene, the scripts and the tests from the brief, through the Lens Studio MCP."], 60, 48, 28)
tag("broll/ov-src-plos.png", ["Versace et al., PLOS ONE, September 2026"], W - 60, 48, 28, align="right")
tag("broll/ov-tag-specs.png", ["Have Specs? Clone the repo, open it in Lens Studio 5.23 and push it to your glasses.",
                               "github.com/JonathanSolvesProblems/floorcount"], 60, 250, 28)   # below the count numeral and the strip
tag("broll/ov-tag-class.png", ["Salsa class, January 2026"], 60, 48, 28)

# music credit, under the end card's text column (CC BY 4.0 asks for title, author, source, licence)
img, d = new()
d.text((700, 960), "Music: “Salsa Island” by Steve Oxen, used from FesliyanStudios.com",
       font=font(MD, 26), fill=ink(165))
img.save("broll/ov-credit-music.png")
tag("broll/ov-src-versace-low.png", ["Source: Versace et al., PLOS ONE, 2026. 32 dancers, three views; the back view came out ahead."], 60, 130, 26)

# ---------- wordmark lower third for the reveal ----------
img, d = new()
wm = Image.open(BRAND + "/export/wordmark-ivory.png").convert("RGBA")
scale = 560 / wm.width
wm = wm.resize((560, int(wm.height * scale)), Image.LANCZOS)
plate(d, (60, 40, 60 + wm.width + 56, 40 + wm.height + 44), 170, 28)
img.alpha_composite(wm, (88, 62))
img.save("broll/ov-wordmark.png")

# ---------- the stat card for the opener ----------
img, d = new()
x0, y0, x1, y1 = 1190, 100, 1880, 730
plate(d, (x0, y0, x1, y1), 215, 30)
f_small = font(MD, 26)
f_big = font(XB, 104)
f_mid = font(MD, 34)
f_num = font(XB, 50)
f_row = font(MD, 30)
f_foot = font(MD, 22)
d.text((x0 + 40, y0 + 34), "ONE PRACTICE, MEASURED", font=f_small, fill=ink(150))
d.text((x0 + 36, y0 + 70), "13 min", font=f_big, fill=ink())
d.text((x0 + 40, y0 + 190), "with a phone tutorial", font=f_mid, fill=ink(220))
rows = [("3×", "the same 4:28 video"), ("2", "walks to the phone to restart it"), ("4 min", "of music to dance to")]
yy = y0 + 262
for num, txt in rows:
    d.text((x0 + 40, yy), num, font=f_num, fill=ink())
    d.text((x0 + 40 + 160, yy + 12), txt, font=f_row, fill=ink(220))
    yy += 84
d.line((x0 + 40, y1 - 100, x1 - 40, y1 - 100), fill=ink(60), width=2)
d.text((x0 + 40, y1 - 84), "From the phone's screen recording of this practice.", font=f_foot, fill=ink(150))
d.text((x0 + 40, y1 - 54), "devpost/phone-vs-glasses.md", font=f_foot, fill=ink(150))
img.save("broll/ov-stat.png")

# ---------- timeline card, animated ----------
words = json.load(open("tmp/voice-words.json", encoding="utf-8"))["words"]


def word_start(text, after):
    for w in words:
        if w["start"] >= after and w["word"].strip().lower().strip(".,?") == text:
            return w["start"]
    raise KeyError(text)


CUT = 9.55  # seconds removed before this part of the voice
t_card0 = 119.74 - CUT          # "Dance teachers..."
t_1920 = word_start("1920s", 119) - CUT
t_2017 = word_start("phones", 119) - CUT
t_2026 = word_start("what's", 127) - CUT
t_end = word_start("changes", 127) - CUT
FPS = 30
cols = [
    ("1920", ["Arthur Murray's mail-order lessons:", "footprint diagrams on paper"], "Funding Universe, company history", t_1920),
    ("2017", ["Dance Reality puts footprints", "on the floor through an iPhone"], "UploadVR, 16 July 2017", t_2017),
    ("2026", ["Floorcount: on your real floor,", "and it changes after every 8-count"], "Lens Studio preview, this build", t_2026),
]
n = int(round((t_end - t_card0) * FPS)) + 2
frames_dir = "tmp/timeline-frames"
os.makedirs(frames_dir, exist_ok=True)
parquet = Image.open(BRAND + "/export/parquet.png").convert("RGBA")
bg = Image.new("RGBA", (W, H), FLOOR + (255,))
# tile the parquet faintly, as the cards do
tile = parquet.resize((parquet.width // 2, parquet.height // 2))
for yy in range(0, H, tile.height):
    for xx in range(0, W, tile.width):
        bg.alpha_composite(tile, (xx, yy))
veil = Image.new("RGBA", (W, H), FLOOR + (170,))
bg.alpha_composite(veil)
f_year = font(XB, 96)
f_body = font(MD, 34)
f_src = font(MD, 22)
f_head = font(MD, 28)
colw = (W - 2 * 120) // 3


def ease(u):
    u = max(0.0, min(1.0, u))
    return 1 - (1 - u) ** 3


for i in range(n):
    t = t_card0 + i / FPS
    fr = bg.copy()
    d = ImageDraw.Draw(fr)
    d.text((120, 150), "FOOTPRINTS FOR DANCERS, THREE TIMES", font=f_head, fill=ink(150))
    for k, (year, body, src, t_on) in enumerate(cols):
        u = ease((t - t_on) / 0.45)
        if u <= 0:
            continue
        layer, dl = new()
        x = 120 + k * colw
        y = 330 + int((1 - u) * 24)
        a = int(255 * u)
        dl.text((x, y), year, font=f_year, fill=ink(a))
        if k == 2:
            dl.rounded_rectangle((x, y + 120, x + 120, y + 132), 6, fill=TEAL + (a,))
        else:
            dl.rounded_rectangle((x, y + 120, x + 120, y + 132), 6, fill=ink(int(a * 0.35)))
        yy = y + 170
        for s in body:
            dl.text((x, yy), s, font=f_body, fill=ink(int(a * 0.9)))
            yy += 46
        dl.text((x, yy + 18), src, font=f_src, fill=ink(int(a * 0.55)))
        fr.alpha_composite(layer)
    fr.convert("RGB").save(f"{frames_dir}/f{i:04}.png")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", f"{frames_dir}/f%04d.png",
                "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "broll/timeline.mp4"], check=True)
print(f"timeline.mp4 {n / FPS:.2f} s; starts at cut {t_card0:.2f}, cut away at {t_end:.2f}")
json.dump({"start": t_card0, "end": t_end}, open("tmp/timeline-times.json", "w"))

# ---------- floor settle diagram, animated (5.0 s) ----------
secs = 5.0
n = int(secs * FPS)
frames_dir = "tmp/floor-frames"
os.makedirs(frames_dir, exist_ok=True)
f_lab = font(MD, 30)
f_lab_s = font(MD, 24)
eye = (430, 340)
floor_y = 800
fixed_y = 690
pad_x0, pad_x1 = 1000, 1480
hits = [(1060, floor_y), (1240, floor_y), (1420, floor_y)]
hit_t = [0.6, 1.3, 2.0]
settle_t0, settle_t1 = 2.4, 3.3
for i in range(n):
    t = i / FPS
    fr = Image.new("RGBA", (W, H), FLOOR + (255,))
    d = ImageDraw.Draw(fr)
    # floor and the fixed-height line
    d.line((160, floor_y, W - 160, floor_y), fill=ink(120), width=4)
    d.text((160, floor_y + 16), "the real floor", font=f_lab, fill=ink(150))
    for xx in range(900, 1600, 28):
        d.line((xx, fixed_y, xx + 14, fixed_y), fill=ink(70), width=3)
    d.text((1510, fixed_y - 40), "fixed start: 150 cm below the eye", font=f_lab_s, fill=ink(120))
    # the head: a circle for the eye and a stroke for the body
    d.ellipse((eye[0] - 26, eye[1] - 26, eye[0] + 26, eye[1] + 26), outline=ink(230), width=5)
    d.line((eye[0], eye[1] + 26, eye[0], floor_y), fill=ink(60), width=3)
    d.text((eye[0] - 110, eye[1] - 80), "the glasses", font=f_lab, fill=ink(200))
    # rays and readings
    for (hx, hy), ht in zip(hits, hit_t):
        if t < ht:
            continue
        u = ease((t - ht) / 0.35)
        ex = eye[0] + (hx - eye[0]) * u
        ey = eye[1] + 20 + (hy - eye[1] - 20) * u
        d.line((eye[0], eye[1] + 20, ex, ey), fill=TEAL + (160,), width=3)
        if u >= 1:
            d.ellipse((hx - 9, hy - 9, hx + 9, hy + 9), fill=TEAL + (255,))
    if t >= hit_t[-1] + 0.3:
        d.text((1000, floor_y + 60), "three floor readings, within 4 cm of each other", font=f_lab, fill=ink(220))
    # the pad
    u = ease((t - settle_t0) / (settle_t1 - settle_t0))
    py = fixed_y + (floor_y - fixed_y) * u
    d.rounded_rectangle((pad_x0, py - 14, pad_x1, py + 2), 8, outline=ink(255), width=4)
    d.text((pad_x0, py - 56), "the pad", font=f_lab, fill=ink(220))
    if u >= 1:
        d.text((1000, floor_y + 104), "the pad moves once, onto the floor", font=f_lab, fill=ink(220))
    d.text((160, 120), "On the glasses: WorldQueryModule", font=font(XB, 44), fill=ink())
    d.text((160, 180), "FloorcountFloor.ts, settled when three readings agree", font=f_lab_s, fill=ink(150))
    fr.convert("RGB").save(f"{frames_dir}/f{i:04}.png")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", f"{frames_dir}/f%04d.png",
                "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "broll/floor-diagram.mp4"], check=True)
print("floor-diagram.mp4 5.0 s")
