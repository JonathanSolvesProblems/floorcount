"""The Devpost gallery: eight 1500x1000 images in devpost/preview/.  py video/gallery.py

Frames come from the video's segment renders (tmp/seg, written by make_video.py: full frame, before captions and
tags), cropped to 3:2 and tagged in the video's style. Every Lens shot carries "Lens Studio preview", as in the video.
The first and last are the brand cards from .design/brand/export/cards/.
"""
import os
import shutil
import subprocess

from PIL import Image, ImageDraw, ImageFont

MD = ".design/brand/fonts/AtkinsonHyperlegibleNext-Medium.ttf"
FLOOR, INK = (26, 22, 18), (247, 238, 223)
OUT = "devpost/preview"
W, H = 1500, 1000
CARDS = ".design/brand/export/cards/"


def frame(seg, t):
    path = f"tmp/gallery-{os.path.basename(seg)}-{t}.png"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", seg, "-frames:v", "1", path], check=True)
    return Image.open(path).convert("RGB")


def crop32(im, x0):
    # 1920x1080 -> the 1620x1080 window starting at x0 -> 1500x1000
    return im.crop((x0, 0, x0 + 1620, 1080)).resize((W, H), Image.LANCZOS)


def tag(im, lines, x, y, size=30, align="left"):
    d = ImageDraw.Draw(im, "RGBA")
    f = ImageFont.truetype(MD, size)
    tw = max(d.textlength(s, font=f) for s in lines)
    th = size * 1.25 * len(lines)
    pad = 18
    if align == "right":
        x = x - (tw + 2 * pad)
    d.rounded_rectangle((x, y, x + tw + 2 * pad, y + th + 2 * pad - 6), 20, fill=FLOOR + (236,))
    yy = y + pad - 4
    for s in lines:
        d.text((x + pad, yy), s, font=f, fill=INK + (240,))
        yy += size * 1.25
    return im


def preview(im):
    return tag(im, ["Lens Studio preview"], W - 44, 40, 26, align="right")


def overlay(im, png, x0):
    # an overlay drawn for the 1920x1080 video, cut and scaled the same way as the frame
    ov = Image.open(png).convert("RGBA").crop((x0, 0, x0 + 1620, 1080)).resize((W, H), Image.LANCZOS)
    base = im.convert("RGBA")
    base.alpha_composite(ov)
    return base.convert("RGB")


os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))

shutil.copy(CARDS + "devpost-thumbnail-1500x1000.png", f"{OUT}/1-floorcount.png")

# the problem: the measured practice card over the walk to the phone (the desk corner is already blurred in the segment)
im = overlay(crop32(frame("tmp/seg/03_C.mp4", 8.0), 300), "broll/ov-stat.png", 300)
tag(im, ["The tutorial faces me. Every restart is a walk to the phone."], 40, 40)
im.save(f"{OUT}/2-the-problem.png")

im = preview(crop32(frame("tmp/seg/08_G.mp4", 5.0), 150))
tag(im, ["Each sole print lights on its count. A click marks 1 and 5."], 40, 900)
im.save(f"{OUT}/3-the-count-on-the-floor.png")

im = preview(crop32(frame("tmp/seg/11_I.mp4", 3.5), 0))
tag(im, ["After every 8-count, one pinch: Again or Got it."], 40, 900)
im.save(f"{OUT}/4-again-or-got-it.png")

im = preview(crop32(frame("tmp/seg/13_K.mp4", 2.5), 150))
tag(im, ["Three clean 8-counts at Full: the right turn loads."], 40, 900)
im.save(f"{OUT}/5-the-right-turn.png")

im = preview(crop32(frame("tmp/seg/16_N1.mp4", 4.6), 150))
tag(im, ["Next practice, it remembers the count I lost."], 40, 900)
im.save(f"{OUT}/6-it-remembers.png")

# the split frame: from each 960-wide half the centred 810x1080, scaled to 750x1000, so nothing is cut top or bottom
sp = frame("tmp/seg/19_O.mp4", 3.0)
im = Image.new("RGB", (W, H), FLOOR)
im.paste(sp.crop((75, 0, 885, 1080)).resize((750, 1000), Image.LANCZOS), (0, 0))
im.paste(sp.crop((1035, 0, 1845, 1080)).resize((750, 1000), Image.LANCZOS), (750, 0))
ImageDraw.Draw(im).rectangle((747, 0, 752, H), fill=INK)
tag(im, ["Front view. A tutorial faces you."], 40, 40, 28)
tag(im, ["Your view, from where you stand."], 790, 300, 28)      # clear floor between the strip and the pad
tag(im, ["Lens Studio preview"], W - 44, 40, 26, align="right")
im.save(f"{OUT}/7-your-view.png")

shutil.copy(CARDS + "gallery-how-it-was-made-1500x1000.png", f"{OUT}/8-how-it-was-made.png")

for f in sorted(os.listdir(OUT)):
    p = os.path.join(OUT, f)
    print(f, Image.open(p).size, f"{os.path.getsize(p) // 1024} KB")
