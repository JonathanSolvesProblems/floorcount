"""The Floorcount YouTube Short, 1080x1920:  py video/make_short.py

Built from the demo's own narration (tmp/voice-proc.wav, written by make_video.py) and its source clips. The story:
learning salsa at a dance school (the class clip), so Floorcount, a Lens for Specs that puts the step on your floor,
the count, the answers that change the lesson, the front view against your own view, and the right turn on the 1. The first half second is the vertical thumbnail
(tmp/short/thumbnail-short.jpg, from the youtube-thumbnail skill), so that is the frame to pick at upload.

Every voice cut lands at the quietest 10 ms between words, with a 30 ms fade, and the windows are joined by a
short breath. Captions sit on a plate under the picture panel, clear of the Shorts overlay. Output:
broll/floorcount-short.mp4.
"""
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.argv = [sys.argv[0]]
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_video as mv  # noqa: E402  (helpers and the caption fixes; importing it renders nothing)

OUT = "tmp/short"
SEG = OUT + "/seg"
W, H, FPS = 1080, 1920, 30
VY, VH = 120, 1350          # the picture panel: under the status bar, above the caption plate
CARD = 0.5                  # the thumbnail, held as the first frame
LEAD = 0.42                 # the voice starts under the card
GAP = 0.35                  # breath between windows
TAIL = 1.6                  # held picture after the last word, fading out
D = "broll/dslr/"
P = "broll/"
MD = ".design/brand/fonts/AtkinsonHyperlegibleNext-Medium.ttf"
FLOOR, INK = (26, 22, 18), (247, 238, 223)
ENC = ["-an", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-r", str(FPS)]
SR = 48000

# narration windows, in cut time (the demo's voice timeline)
WINDOWS = [
    (0.21, 4.23),       # So for the past couple of years, I've been learning salsa at a dance school.
    (24.69, 38.87),     # So this inspired this application, which is called Floorcount. It is a Lens for Specs...
    (44.69, 55.91),     # Each sole print lights up on its count... And a wooden click marks 1 and 5.
    (61.81, 77.75),     # After every 8-count... Again or Got it. Two Agains... Three clean...
    (105.11, 109.71),   # A tutorial gives you the front view. This gives you yours, with your hands free.
    (167.97, 170.45),   # Right turn, on the 1. Floorcount.
]

os.makedirs(SEG, exist_ok=True)
words = [tuple(w) for w in json.load(open("tmp/words-cut.json"))]


def ffmpeg(args):
    r = subprocess.run(["ffmpeg", "-v", "error", "-y", *args], capture_output=True, text=True)
    if r.returncode:
        print(" ".join(args)[:600]); print(r.stderr[-3000:]); raise SystemExit(1)


# ---------------------------------------------------------------- voice: cut in measured silence
voice = mv.read_wav_f32("tmp/voice-proc.wav", SR)
mono = voice.mean(axis=1)
hop = int(0.01 * SR)
rms = np.sqrt(np.convolve(mono ** 2, np.ones(hop) / hop, mode="same"))


def quietest(lo, hi):
    a, b = max(0, int(lo * SR)), min(len(rms) - 1, int(hi * SR))
    if b <= a:
        return lo
    return (a + int(np.argmin(rms[a:b]))) / SR


def prev_end(t):
    return max([e for s, e, _ in words if e <= t + 0.01] or [t - 0.4])


def next_start(t):
    return min([s for s, e, _ in words if s >= t - 0.01] or [t + 0.6])


cuts = []
for s, e in WINDOWS:
    a = quietest(max(prev_end(s - 0.02), s - 0.4), s - 0.02)
    b = quietest(e + 0.04, min(next_start(e + 0.02), e + 0.6))
    cuts.append((a, b))

total = LEAD + sum(b - a for a, b in cuts) + GAP * (len(cuts) - 1) + TAIL
n = int(total * SR)
vtrack = np.zeros((n, 2), np.float32)
place = []                                   # (short time of the cut start, cut start in cut time, cut end)
t = LEAD
fade = int(0.03 * SR)
for a, b in cuts:
    piece = voice[int(a * SR):int(b * SR)].copy()
    piece[:fade] *= np.linspace(0, 1, fade)[:, None]
    piece[-fade:] *= np.linspace(1, 0, fade)[:, None]
    i = int(t * SR)
    vtrack[i:i + len(piece)] += piece[: n - i]
    place.append((t, a, b))
    t += (b - a) + GAP
VOICE_END = t - GAP


def short_time(ct):
    """A cut-time moment to its place in the Short."""
    for ts, a, b in place:
        if a - 0.05 <= ct <= b + 0.05:
            return ts + (ct - a)
    raise ValueError(ct)


def word_start(text, after):
    return next(s for s, e, w in words if s >= after and w.lower().strip(".,?") == text)


# ---------------------------------------------------------------- shots
# (cut-time anchor where the shot starts, kind, params). The first shot after the card starts at CARD.
SHOTS = [
    # the class: only 0.65-4.75 s of the blurred file has every frame right (see blur_dancers.py), slowed so the
    # 5.15 s shot never reads past 4.75 s (4.1 s / 5.15 s = 0.796)
    (0.21, "dslr", dict(src=P + "class-2026-blurred-b.mp4", inp=0.65, x0=560, speed=0.79, tag="Salsa class, January 2026")),
    (24.69, "preview", dict(src=P + "preview-02-again-half.mp4", inp=0.0)),
    (29.69, "preview", dict(src=P + "preview-01-basic-slow.mp4", inp=0.0)),
    (34.23, "preview", dict(src=P + "preview-11-count-hides.mp4", inp=0.0)),
    (53.21, "preview", dict(src=P + "preview-01-basic-slow.mp4", inp=3.5)),
    (61.81, "preview", dict(src=P + "preview-04-step-card.mp4", inp=0.5, x0=380)),
    (67.73, "preview", dict(src=P + "preview-02-again-half.mp4", inp=6.0, tag="After two Agains: Slow, counts 1 to 4 only.")),
    (73.33, "preview", dict(src=P + "preview-03-next-step.mp4", inp=6.8, tag="Three clean 8-counts at Full: the right turn loads.")),
    (105.11, "stacked", dict(top=D + "MVI_0693.MOV", tinp=478.6, tx=97, bottom=P + "preview-02-again-half.mp4", binp=10.0)),
    (167.97, "preview", dict(src=P + "preview-05-right-turn-clean.mp4", inp=0.0)),
    (word_start("floor", 168.5), "dslr", dict(src=D + "MVI_0694.MOV", inp=17.8, x0=600)),
]

starts = [CARD] + [max(CARD, short_time(anchor) - 0.12) for anchor, _, _ in SHOTS[1:]]
ends = starts[1:] + [total]


def font(size):
    return ImageFont.truetype(MD, size)


def tag(d, lines, x, y, size=34, align="left"):
    f = font(size)
    tw = max(d.textlength(s, font=f) for s in lines)
    th = size * 1.25 * len(lines)
    pad = 20
    if align == "right":
        x -= tw + 2 * pad
    d.rounded_rectangle((x, y, x + tw + 2 * pad, y + th + 2 * pad - 6), 22, fill=FLOOR + (236,))
    yy = y + pad - 4
    for s in lines:
        d.text((x + pad, yy), s, font=f, fill=INK + (240,))
        yy += size * 1.25


def background():
    path = OUT + "/bg.png"
    if not os.path.exists(path):
        bg = Image.new("RGBA", (W, H), FLOOR + (255,))
        tile = Image.open(".design/brand/export/parquet.png").convert("RGBA")
        tile = tile.resize((tile.width // 2, tile.height // 2))
        for y in range(0, H, tile.height):
            for x in range(0, W, tile.width):
                bg.alpha_composite(tile, (x, y))
        bg.alpha_composite(Image.new("RGBA", (W, H), FLOOR + (190,)))
        bg.convert("RGB").save(path)
    return path


def overlay_png(k, kind, p):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if kind == "stacked":
        d.rectangle((0, VY + VH // 2 - 3, W, VY + VH // 2 + 3), fill=INK + (230,))
        tag(d, ["Front view. A tutorial faces you."], 36, VY + VH // 2 - 92)   # low, clear of my head
        tag(d, ["Your view, from where you stand."], 36, VY + VH - 168)   # low, clear of the count numeral
        tag(d, ["Lens Studio preview"], 36, VY + VH - 88, 28)
    elif kind == "preview":
        tag(d, ["Lens Studio preview"], 36, VY + VH - 88, 28)
        if p.get("tag"):
            tag(d, [p["tag"]], 36, VY + 28, 32)
    elif p.get("tag"):
        tag(d, [p["tag"]], 36, VY + 28, 32)
    path = f"{SEG}/ov{k:02}.png"
    img.save(path)
    return path


def finish(dur):
    return f"fps={FPS},tpad=stop_mode=clone:stop_duration=4,trim=duration={dur:.3f},setpts=PTS-STARTPTS"


def render(k, kind, p, dur):
    out = f"{SEG}/{k:02}.mp4"
    bg = ["-loop", "1", "-framerate", str(FPS), "-t", f"{dur + 1:.3f}", "-i", background()]
    if kind == "card":
        ffmpeg(["-loop", "1", "-framerate", str(FPS), "-t", f"{dur + 1:.3f}", "-i", OUT + "/thumbnail-short.jpg",
                "-vf", f"scale={W}:{H},setsar=1,{finish(dur)}", *ENC, out])
        return out
    ov = ["-loop", "1", "-framerate", str(FPS), "-t", f"{dur + 1:.3f}", "-i", overlay_png(k, kind, p)]
    if kind == "stacked":
        src = ["-ss", f"{p['tinp']:.3f}", "-t", f"{dur + 2:.3f}", "-i", p["top"],
               "-ss", f"{p['binp']:.3f}", "-t", f"{dur + 2:.3f}", "-i", p["bottom"]]
        mask = ["-loop", "1", "-framerate", str(FPS), "-t", f"{dur + 2:.3f}", "-i", mv.corner_mask()]
        half = VH // 2
        # the desk corner (a VR headset sat on it) blurred and dimmed, as in the long cut, before the crop
        fc = (f"[1:v]fps={FPS},scale=1920:1080,setsar=1,split[a][b];"
              f"[b]gblur=sigma=26,eq=brightness=-0.07:saturation=0.8[bl];[bl][4:v]alphamerge[blm];"
              f"[a][blm]overlay=0:0:shortest=1,crop=1728:1080:{p['tx']}:0,scale={W}:{half}:flags=lanczos,setsar=1[t];"
              f"[2:v]fps={FPS},crop=1152:720:64:0,scale={W}:{half}:flags=lanczos,setsar=1[b2];"
              f"[t][b2]vstack[v];[0:v][v]overlay=0:{VY}[x];[x][3:v]overlay=0:0,{finish(dur)}[o]")
        ffmpeg([*bg, *src, *ov, *mask, "-filter_complex", fc, "-map", "[o]", *ENC, out])
        return out
    if kind == "preview":       # 1280x720 source: a 4:5 window, 2x up
        crop = f"crop=576:720:{p.get('x0', 352)}:0"
    else:                       # 1920x1080 camera: a 4:5 window around me
        crop = f"crop=864:1080:{p.get('x0', 528)}:0"
    sp = p.get("speed", 1.0)
    slow = f"setpts=PTS/{sp:.4f},framerate=fps={FPS}," if sp != 1.0 else ""
    src = ["-ss", f"{p['inp']:.3f}", "-t", f"{(dur + 2) * sp:.3f}", "-i", p["src"]]
    fc = (f"[1:v]{slow}fps={FPS},{crop},scale={W}:{VH}:flags=lanczos,setsar=1[v];"
          f"[0:v][v]overlay=0:{VY}[x];[x][2:v]overlay=0:0,{finish(dur)}[o]")
    ffmpeg([*bg, *src, *ov, "-filter_complex", fc, "-map", "[o]", *ENC, out])
    return out


segs = [render(0, "card", {}, CARD)]
for k, ((_, kind, p), s, e) in enumerate(zip(SHOTS, starts, ends), start=1):
    print(f"  shot {k:2} {kind:8} {s:6.2f}-{e:6.2f}  {p.get('src', p.get('top', ''))}")
    segs.append(render(k, kind, p, e - s))

inputs = []
for s in segs:
    inputs += ["-i", s]
fc = "".join(f"[{i}:v]" for i in range(len(segs))) + f"concat=n={len(segs)}:v=1:a=0,setpts=PTS-STARTPTS[v]"
ffmpeg([*inputs, "-filter_complex", fc, "-map", "[v]", *ENC, OUT + "/joined.mp4"])

# ---------------------------------------------------------------- captions
toks = []
for ts, a, b in place:
    for s, e, w in words:
        if s >= a - 0.02 and e <= b + 0.05:
            toks.append({"word": w, "start": max(CARD, ts + (s - a)), "end": ts + (e - a)})
out_toks, i = [], 0
while i < len(toks):
    hit = None
    for pat, rep in mv.FIXES:
        if [x["word"].lower() for x in toks[i:i + len(pat)]] == [q.lower() for q in pat]:
            hit = (pat, rep)
            break
    if not hit:
        out_toks.append(toks[i]); i += 1; continue
    pat, rep = hit
    span = toks[i:i + len(pat)]
    if len(rep) == len(pat):
        out_toks += [{"word": r, "start": x["start"], "end": x["end"]} for x, r in zip(span, rep)]
    else:
        s0, e0 = span[0]["start"], span[-1]["end"]
        step = (e0 - s0) / len(rep)
        out_toks += [{"word": r, "start": s0 + j * step, "end": s0 + (j + 1) * step} for j, r in enumerate(rep)]
    i += len(pat)
style = {"font": "Atkinson Hyperlegible Next", "size": 64, "spoken": "F7EEDF", "active": "5FB4E8", "outline": "1A1612",
         "back": "40000000", "outline_w": 4, "shadow": 0, "margin_v": 1920 - (VY + VH) - 170, "margin_h": 70,
         "words_per_line": 4, "play_res": (W, H)}
from pathlib import Path  # noqa: E402
mv.transcript_to_ass({"segments": [{"start": out_toks[0]["start"], "end": out_toks[-1]["end"], "text": "",
                                    "words": out_toks}]}, Path(OUT + "/captions.ass"), style)

# ---------------------------------------------------------------- audio: the demo's salsa, ducked under the voice
music = mv.read_wav_f32(mv.MUSIC, SR)[int(mv.MUSIC_IN * SR):][:n] * np.float32(10 ** (mv.MUSIC_TRIM_DB / 20))
if len(music) < n:
    music = np.concatenate([music, np.zeros((n - len(music), 2), np.float32)])
w20 = int(0.02 * SR)
env = np.sqrt(np.convolve(vtrack.mean(axis=1) ** 2, np.ones(w20) / w20, mode="same"))
active = 20 * np.log10(env + 1e-9) > -42
pre, post = int(0.3 * SR), int(1.2 * SR)
held = np.convolve(active.astype(np.float32), np.ones(pre + post), mode="full")[post:post + n] > 0
gdb = np.where(held, -21.5, -8.0).astype(np.float32)
ramp = int(0.35 * SR)
gdb = np.convolve(gdb, np.ones(ramp) / ramp, mode="same")
gdb[: ramp // 2] = gdb[ramp // 2]
gdb[-ramp // 2:] = gdb[-ramp // 2 - 1]
music *= (10 ** (gdb / 20))[:, None]
music[: int(0.25 * SR)] *= np.linspace(0, 1, int(0.25 * SR))[:, None]
fo = int(2.0 * SR)
music[-fo:] *= (np.linspace(1, 0, fo) ** 1.5)[:, None]
mix = vtrack + music
mix += np.random.default_rng(1).normal(0, 6e-5, mix.shape).astype(np.float32)   # no exact digital silence
mix = np.clip(mix, -0.98, 0.98)
mv.write_wav_f32(OUT + "/mix.wav", mix, SR)

ffmpeg(["-i", OUT + "/joined.mp4", "-i", OUT + "/mix.wav", "-filter_complex",
        f"[0:v]subtitles='{OUT}/captions.ass':fontsdir='tmp/fonts-captions',fade=t=out:st={total - 0.8:.3f}:d=0.8[v]",
        "-map", "[v]", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
        "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", "-ar", str(SR), "-movflags", "+faststart",
        "-t", f"{total:.3f}", "broll/floorcount-short.mp4"])
print(f"wrote broll/floorcount-short.mp4  {total:.2f} s, voice ends {VOICE_END:.2f} s")
