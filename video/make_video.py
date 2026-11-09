"""Assemble the Floorcount demo video:  py tmp/make_video.py [--segments] [--final]

Beats are keyed to the trimmed voice take (broll/voice-cut.wav). Each beat renders to its own
segment, the segments join (hard cuts, a few dissolves), overlays and captions go on top, and the
audio is mixed in numpy so the title card never carries exact digital silence.
"""
import json
import os
import struct
import subprocess
import sys

import numpy as np
from PIL import Image

from vidkit.transcribe import transcript_to_ass  # vidkit, my own demo-video tool, installed with pip

FPS = 30
TITLE = 2.0
VOICE = "broll/voice-cut.wav"
VOICE_LEN = 171.05
# "Salsa Island" by Steve Oxen, music used from https://www.FesliyanStudios.com (free for videos that are not
# monetised, credited on the end card). The track is 2:43, so salsa-island-loop.wav is it twice with a 3 s crossfade:
#   ffmpeg -i salsa-island.mp3 -i salsa-island.mp3 -filter_complex "acrossfade=d=3:c1=tri:c2=tri" -ar 48000 ...
# MUSIC_IN skips the first second; MUSIC_TRIM_DB brings its -14.1 LUFS to the -13.6 LUFS the gains below were set for
MUSIC = "broll/music/salsa-island-loop.wav"
MUSIC_IN, MUSIC_TRIM_DB = 1.0, 0.5
TAIL_AFTER_VOICE = 173.0            # the final turn runs to here (cut time)
END_CARD = 3.0
WALNUT = "0x1A1612"
SEG = "tmp/seg"
os.makedirs(SEG, exist_ok=True)
CARDS = ".design/brand/export/cards/"
D = "broll/dslr/"
TL = json.load(open("tmp/timeline-times.json"))
RECTS = json.load(open("tmp/web-rects.json"))   # from video/capture_pages.py
TERM_SUMMARY_AT = float(sys.argv[sys.argv.index("--term-at") + 1]) if "--term-at" in sys.argv else 24.0


def run(cmd):
    # segment renders are cached on their exact command plus the size and time of every input,
    # so a rerun only redoes what changed (the command alone missed a re-rendered input)
    out = cmd[-1]
    stamp = out + ".cmd" if out.startswith(SEG + "/") and out.endswith(".mp4") else None
    ins = [cmd[k + 1] for k, a in enumerate(cmd[:-1]) if a == "-i" and os.path.exists(cmd[k + 1])]
    key = " ".join(cmd) + "".join(f" |{p}:{os.path.getsize(p)}:{os.path.getmtime(p):.0f}" for p in ins)
    if stamp and os.path.exists(out) and os.path.exists(stamp) and open(stamp, encoding="utf-8").read() == key:
        return
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(" ".join(cmd))
        print(r.stderr[-4000:])
        raise SystemExit(1)
    if stamp:
        open(stamp, "w", encoding="utf-8").write(key)


def ffdur(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                                capture_output=True, text=True).stdout.strip())


# ---------------------------------------------------------------- beats (cut time)
# (name, start, end, kind, params)
t_end_card = TL["end"]
WINDOW_CROP = (1920, 990, 0, 60)     # w, h, x, y after FIT: drops the letterbox bar and the title bar; FIT re-pads
# captions get a plate on these: white pages, the terminal and the before-and-after card
BOXED = {"H2", "O1", "Q1", "Q2", "Q3", "Q5", "Q6", "Q7"}
BEATS = [
    # class, January 2026: only 8.65-12.75 s of the source (0.65-4.75 s into the blurred file) has
    # every frame right, partner always blurred and me always sharp; slowed to fill the beat
    ("A", 0.00, 4.77, "clip", dict(src="broll/class-2026-blurred-b.mp4", inp=0.65, speed=4.10 / 4.77)),
    # home shots: the desk corner (a VR headset on it) goes soft through corner_mask()
    ("B", 4.77, 12.77, "clip", dict(src=D + "MVI_0693.MOV", inp=229.0, mask=True)),
    ("C", 12.77, 24.83, "clip", dict(src=D + "MVI_0693.MOV", inp=277.0, mask=True)),
    ("D", 24.83, 29.69, "clip", dict(src="broll/preview-02-again-half.mp4", inp=0.0)),
    # the Lens Studio window: cropped below its title bar (project name and the unsaved asterisk)
    ("E", 29.69, 34.23, "clip", dict(src="broll/preview-09-lens-studio-wide.mp4", inp=0.5, crop=WINDOW_CROP)),
    ("E2", 34.23, 39.39, "clip", dict(src="broll/preview-01-basic-slow.mp4", inp=0.0)),
    ("F", 39.39, 44.69, "clip", dict(src="broll/floor-diagram.mp4", inp=0.0)),
    ("G", 44.69, 53.21, "clip", dict(src="broll/preview-11-count-hides.mp4", inp=0.0)),
    ("H1", 53.21, 56.43, "punch", dict(src="broll/preview-01-basic-slow.mp4", inp=0.0)),
    # the Dance Dojo article: headline and byline, then down to the quoted sentence at 2x
    ("H2", 56.43, 61.81, "page", dict(image="broll/web-09-dance-dojo.png",
                                       # the quote ends low in the frame, so the course links under it stay out of view
                                       keys=lambda R: [(0.0, 1.3, 800, 420), (1.0, 1.3, 800, 420),
                                                       (3.4, 2.0, 800, R["dojo"]["single biggest hurdle new dancers face"][0]["y"] + 14 - 170)],
                                       highlights=lambda R: [(3.3, R["dojo"]["single biggest hurdle new dancers face"])])),
    ("I", 61.81, 67.73, "clip", dict(src="broll/preview-04-step-card.mp4", inp=0.5)),
    ("J", 67.73, 73.41, "clip", dict(src="broll/preview-02-again-half.mp4", inp=6.0)),
    ("K", 73.41, 78.23, "clip", dict(src="broll/preview-03-next-step.mp4", inp=6.8)),
    ("L", 78.23, 82.99, "clip", dict(src="broll/preview-11-count-hides.mp4", inp=6.3)),
    ("M", 82.99, 85.89, "clip", dict(src="broll/preview-10-arrow.mp4", inp=2.3)),
    ("N1", 85.89, 90.93, "clip", dict(src="broll/preview-06-second-session.mp4", inp=1.0)),
    ("N2", 90.93, 95.50, "clip", dict(src="broll/preview-07-summary-last-time.mp4", inp=0.3)),
    # the PLOS ONE study: title and abstract, a slow push onto the abstract, "32 dancers" and the
    # result sentence lit as the voice reaches them
    ("O1", 95.50, 104.90, "page", dict(image="broll/web-08-plos-article.png",
                                        keys=lambda R: [(0.0, 1.1, 940, 800), (9.4, 1.35, 920, 780)],
                                        highlights=lambda R: [(1.3, R["plos"]["32 dancers"]),
                                                              (5.6, R["plos"]["The Back view consistently yielded superior outcomes"])])),
    # me at x=961 in the source (measured over the shot), so a 960-wide crop from 481 centres me
    ("O", 104.90, 110.19, "split", dict(left=D + "MVI_0693.MOV", linp=479.4, lx=481, right="broll/preview-02-again-half.mp4", rinp=10.4)),
    ("P", 110.19, t_end_card, "clip", dict(src="broll/timeline.mp4", inp=0.0)),
    ("P2", t_end_card, 123.87, "clip", dict(src="broll/preview-03-next-step.mp4", inp=5.5)),
    ("Q1", 123.87, 131.55, "clip", dict(src="broll/web-03-design-brief.mp4", inp=1.2)),   # after the file tree loads at 1.02 s
    ("Q2", 131.55, 137.29, "clip", dict(src="broll/web-04-prompts.mp4", inp=2.0)),
    ("Q3", 137.29, 142.01, "clip", dict(src="broll/web-05-build-log.mp4", inp=1.6)),   # after the file tree loads at 1.35 s and the page jumps
    ("Q4", 142.01, 145.89, "clip", dict(src="broll/preview-08-leaf-run.mp4", inp=28.5)),
    ("Q5", 145.89, 149.53, "clip", dict(src="broll/web-02-ci-green.mp4", inp=4.0)),
    ("Q6", 149.53, 152.99, "terminal", dict(src="broll/terminal-tests-take6.mp4", inp=TERM_SUMMARY_AT - 0.7)),   # "61 of 61" up for ~2.8 s
    ("Q7", 152.99, 159.07, "image", dict(src=CARDS + "gallery-before-after-1500x1000.png")),
    # the window for "Everything you've seen is the Lens Studio preview", then the pad itself under the limits
    ("R", 159.07, 163.2, "clip", dict(src="broll/preview-09-lens-studio-wide.mp4", inp=0.0, crop=WINDOW_CROP)),
    ("R2", 163.2, 167.97, "clip", dict(src="broll/preview-01-basic-slow.mp4", inp=0.5)),
    ("S1", 167.97, 169.40, "clip", dict(src="broll/preview-05-right-turn-clean.mp4", inp=0.0)),
    ("S2", 169.40, TAIL_AFTER_VOICE, "clip", dict(src=D + "MVI_0694.MOV", inp=17.8, mask=True)),
]
# joins: dissolves into/out of the cards and between the two home shots; everything else cuts
XFADE = {"TITLE->A": 0.5, "B->C": 0.5, "S2->END": 0.6}
TOTAL = TITLE + TAIL_AFTER_VOICE + END_CARD

ENC = ["-an", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-r", str(FPS)]
FIT = f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color={WALNUT},setsar=1"


def finish(dur):
    return f"fps={FPS},tpad=stop_mode=clone:stop_duration=4,trim=duration={dur:.3f},setpts=PTS-STARTPTS"


def corner_mask():
    # the lower-left desk corner of the home shots, feathered: where the blur and the dimming apply
    path = "tmp/mask-corner.png"
    if os.path.exists(path):
        return path
    from PIL import ImageDraw, ImageFilter
    m = Image.new("L", (1920, 1080), 0)
    ImageDraw.Draw(m).rectangle((0, 820, 520, 1080), fill=255)
    m.filter(ImageFilter.GaussianBlur(35)).save(path)
    return path


def walnut_bg():
    path = "tmp/bg-walnut.png"
    if os.path.exists(path):
        return path
    bg = Image.new("RGBA", (1920, 1080), (26, 22, 18, 255))
    tile = Image.open(".design/brand/export/parquet.png").convert("RGBA")
    tile = tile.resize((tile.width // 2, tile.height // 2))
    for y in range(0, 1080, tile.height):
        for x in range(0, 1920, tile.width):
            bg.alpha_composite(tile, (x, y))
    bg.alpha_composite(Image.new("RGBA", (1920, 1080), (26, 22, 18, 175)))
    bg.convert("RGB").save(path)
    return path


def smooth_zoom(out, dur, z1, cx, cy, ease, src=None, inp=0.0, image=None):
    """Zoom from 1 to z1 toward (cx, cy) (fractions of the frame), smoothstep-eased over `ease`
    seconds and held after. Each frame is one affine warp with float scale and offset, so the
    picture moves by fractions of a pixel instead of jumping a whole pixel at a time."""
    import cv2
    stamp = out + ".cmd"
    key = f"smooth_zoom {src} {inp} {image} {dur:.3f} {z1} {cx} {cy} {ease} v2"
    if os.path.exists(out) and os.path.exists(stamp) and open(stamp, encoding="utf-8").read() == key:
        return
    W, H = 1920, 1080
    n = int(round(dur * FPS))
    if image:
        im = cv2.imread(image)
        s = min(W / im.shape[1], H / im.shape[0])
        still = np.full((H * 2, W * 2, 3), (0x12, 0x16, 0x1A), np.uint8)   # walnut, BGR, at 2x
        big = cv2.resize(im, None, fx=s * 2, fy=s * 2, interpolation=cv2.INTER_LANCZOS4)
        y0, x0 = (H * 2 - big.shape[0]) // 2, (W * 2 - big.shape[1]) // 2
        still[y0:y0 + big.shape[0], x0:x0 + big.shape[1]] = big
        dec, fw, fh = None, W * 2, H * 2
    else:
        fw, fh = [int(v) for v in subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", src],
            capture_output=True, text=True).stdout.strip().split(",")[:2]]
        dec = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{inp:.3f}", "-t", f"{dur + 1:.3f}", "-i", src,
                                "-vf", f"fps={FPS}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", *ENC, out], stdin=subprocess.PIPE)
    frame = None
    for i in range(n):
        if dec:
            raw = dec.stdout.read(fw * fh * 3)
            if len(raw) == fw * fh * 3:
                frame = np.frombuffer(raw, np.uint8).reshape(fh, fw, 3)
        else:
            frame = still
        u = min(1.0, (i / FPS) / ease)
        u = u * u * (3 - 2 * u)
        z = 1 + (z1 - 1) * u
        base = W / fw                       # source pixels -> output pixels at zoom 1
        sc = base * z
        # keep the focus point drifting from the frame centre toward (cx, cy), clamped to the frame
        fx = (0.5 + (cx - 0.5) * u) * fw
        fy = (0.5 + (cy - 0.5) * u) * fh
        tx = W / 2 - fx * sc
        ty = H / 2 - fy * sc
        tx = min(0.0, max(W - fw * sc, tx))
        ty = min(0.0, max(H - fh * sc, ty))
        M = np.array([[sc, 0, tx], [0, sc, ty]], np.float64)
        img = cv2.warpAffine(frame, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        enc.stdin.write(img.tobytes())
    enc.stdin.close()
    enc.wait()
    if dec:
        dec.kill()
    open(stamp, "w", encoding="utf-8").write(key)


def page_move(out, dur, image, keys, highlights=(), css_scale=2):
    """A camera move over a web page captured at css_scale device pixels per CSS pixel
    (video/capture_pages.py). keys: (t, zoom, cx, cy) with zoom in output pixels per CSS pixel and
    (cx, cy) the CSS point at the frame's centre; smoothstep between keys, held after the last.
    highlights: (t_on, rects in CSS px), lit in the brand blue over 0.4 s."""
    import cv2
    stamp = out + ".cmd"
    key = f"page_move {image} {os.path.getsize(image)} {dur:.3f} {keys} {highlights} {css_scale} v1"
    if os.path.exists(out) and os.path.exists(stamp) and open(stamp, encoding="utf-8").read() == key:
        return
    W, H = 1920, 1080
    img = cv2.imread(image)
    half = cv2.resize(img, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
    n = int(round(dur * FPS))
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", *ENC, out], stdin=subprocess.PIPE)
    blue = (232, 180, 95)        # #5FB4E8 in BGR
    walnut = (18, 22, 26)

    def at(t):
        if t <= keys[0][0]:
            return keys[0][1:]
        for (t0, *a), (t1, *b) in zip(keys, keys[1:]):
            if t0 <= t <= t1:
                u = (t - t0) / (t1 - t0)
                u = u * u * (3 - 2 * u)
                return tuple(x + (y - x) * u for x, y in zip(a, b))
        return keys[-1][1:]

    for i in range(n):
        t = i / FPS
        zoom, cx, cy = at(t)
        src, sc = (half, zoom * 2 / css_scale) if zoom / css_scale < 0.75 else (img, zoom / css_scale)
        iw, ih = src.shape[1] * sc, src.shape[0] * sc
        tx = W / 2 - cx * zoom
        ty = H / 2 - cy * zoom
        tx = min(0.0, max(W - iw, tx)) if iw >= W else (W - iw) / 2
        ty = min(0.0, max(H - ih, ty)) if ih >= H else 0.0
        M = np.array([[sc, 0, tx], [0, sc, ty]], np.float64)
        frame = cv2.warpAffine(src, M, (W, H), flags=cv2.INTER_CUBIC if sc > 1 else cv2.INTER_LINEAR,
                               borderMode=cv2.BORDER_CONSTANT, borderValue=walnut)
        for t_on, rects in highlights:
            a = min(1.0, max(0.0, (t - t_on) / 0.4))
            if a <= 0:
                continue
            wash, line = frame.copy(), frame.copy()
            for r in rects:
                x0, y0 = int(r["x"] * zoom + tx) - 6, int(r["y"] * zoom + ty) - 4
                x1, y1 = int((r["x"] + r["w"]) * zoom + tx) + 6, int((r["y"] + r["h"]) * zoom + ty) + 4
                cv2.rectangle(wash, (x0, y0), (x1, y1), blue, -1)
                cv2.rectangle(line, (x0, y1 - 3), (x1, y1), blue, -1)
            frame = cv2.addWeighted(wash, 0.28 * a, frame, 1 - 0.28 * a, 0)
            frame = cv2.addWeighted(line, a, frame, 1 - a, 0)
        enc.stdin.write(frame.tobytes())
    enc.stdin.close()
    enc.wait()
    open(stamp, "w", encoding="utf-8").write(key)


def render_segment(name, dur, kind, p, out):
    if kind == "clip":
        sp = p.get("speed", 1.0)
        # slowed clips blend neighbouring frames back up to 30 fps instead of repeating frames
        slow = f"setpts=PTS/{sp:.4f},framerate=fps={FPS}," if sp != 1.0 else ""
        crop = f"crop={':'.join(str(v) for v in p['crop'])},{FIT}," if p.get("crop") else ""
        if p.get("mask"):
            # the masked corner is blurred and dimmed, the rest untouched (alphamerge reads the mask as alpha)
            run(["ffmpeg", "-v", "error", "-y", "-ss", f"{p['inp']:.3f}", "-t", f"{(dur + 2) * sp:.3f}", "-i", p["src"],
                 "-loop", "1", "-framerate", str(FPS), "-t", f"{dur + 2:.3f}", "-i", corner_mask(),
                 "-filter_complex",
                 f"[0:v]{slow}{FIT},{crop}fps={FPS}[v0];[v0]split[a][b];"
                 f"[b]gblur=sigma=26,eq=brightness=-0.07:saturation=0.8[bl];[bl][1:v]alphamerge[blm];"
                 f"[a][blm]overlay=0:0:shortest=1,{finish(dur)}[v]",
                 "-map", "[v]", *ENC, out])
        else:
            run(["ffmpeg", "-v", "error", "-y", "-ss", f"{p['inp']:.3f}", "-t", f"{(dur + 2) * sp:.3f}", "-i", p["src"],
                 "-vf", f"{slow}{FIT},{crop}{finish(dur)}", *ENC, out])
    elif kind == "portrait":
        run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-framerate", str(FPS), "-t", f"{dur + 1:.3f}", "-i", walnut_bg(),
             "-ss", f"{p['inp']:.3f}", "-t", f"{dur + 2:.3f}", "-i", p["src"],
             "-filter_complex", f"[1:v]scale=-2:1080[p];[0:v][p]overlay=(W-w)/2:0:shortest=1,setsar=1,{finish(dur)}[v]",
             "-map", "[v]", *ENC, out])
    elif kind == "punch":
        # a push into the count strip above the pad (source 1280x720, strip near x=640, y=230):
        # eased in over the first 1.6 s, then held. zoompan steps in whole pixels and shakes,
        # so the zoom is a sub-pixel affine warp per frame instead
        smooth_zoom(out, dur, src=p["src"], inp=p["inp"], z1=1.55, cx=640 / 1280, cy=230 / 720, ease=1.6)
    elif kind == "split":
        run(["ffmpeg", "-v", "error", "-y",
             "-ss", f"{p['linp']:.3f}", "-t", f"{dur + 2:.3f}", "-i", p["left"],
             "-ss", f"{p['rinp']:.3f}", "-t", f"{dur + 2:.3f}", "-i", p["right"],
             "-filter_complex",
             f"[0:v]fps={FPS},crop=960:1080:{p.get('lx', 700)}:0,setsar=1[l];"
             f"[1:v]fps={FPS},crop=640:720:320:0,scale=960:1080,setsar=1[r];"
             f"[l][r]hstack=shortest=1,drawbox=x=957:y=0:w=6:h=1080:color=0xF7EEDF@0.9:t=fill,{finish(dur)}[v]",
             "-map", "[v]", *ENC, out])
    elif kind == "image":
        # a slow centred push over the whole beat, as a sub-pixel warp (see smooth_zoom)
        smooth_zoom(out, dur, image=p["src"], z1=1.045, cx=0.5, cy=0.5, ease=dur)
    elif kind == "page":
        page_move(out, dur, p["image"], p["keys"](RECTS), p["highlights"](RECTS))
    elif kind == "terminal":
        # 1920x1066 capture of the terminal window: drop the title bar and the taskbar, keep 16:9 from the left
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{p['inp']:.3f}", "-t", f"{dur + 2:.3f}", "-i", p["src"],
             "-vf", f"crop=1735:976:0:34,scale=1920:1080:flags=lanczos,setsar=1,{finish(dur)}", *ENC, out])
    elif kind == "card":
        vf = f"{FIT},fps={FPS},trim=duration={dur:.3f},setpts=PTS-STARTPTS"
        if p.get("fade_in"):
            vf += f",fade=t=in:st=0:d={p['fade_in']}"
        if p.get("fade_out"):
            vf += f",fade=t=out:st={dur - p['fade_out']:.3f}:d={p['fade_out']}"
        run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-framerate", str(FPS), "-t", f"{dur + 1:.3f}", "-i", p["src"],
             "-vf", vf, *ENC, out])
    else:
        raise ValueError(kind)


def build_segments():
    items = [("TITLE", TITLE, "card", dict(src=CARDS + "title-card-1920x1080.png", fade_in=0.4))]
    for name, s, e, kind, p in BEATS:
        items.append((name, e - s, kind, p))
    items.append(("END", END_CARD, "card", dict(src=CARDS + "end-card-1920x1080.png", fade_out=0.8)))
    files = []
    for i, (name, dur, kind, p) in enumerate(items):
        nxt = items[i + 1][0] if i + 1 < len(items) else None
        tail = XFADE.get(f"{name}->{nxt}", 0.0)
        out = f"{SEG}/{i:02}_{name}.mp4"
        print(f"  {name:5} {dur:6.2f}s +{tail:.1f}  {kind}")
        render_segment(name, dur + tail, kind, p, out)
        files.append((name, dur, tail, out))
    return files


def join(files):
    # groups of hard cuts, then dissolves between the groups
    groups, cur = [], []
    for name, dur, tail, out in files:
        cur.append((name, dur, tail, out))
        if tail > 0:
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    gfiles = []
    for gi, g in enumerate(groups):
        # the concat filter re-encodes, so the timestamps come out continuous (the demuxer's
        # stream copy did not, and xfade then dropped most of the picture)
        inputs = []
        for _, _, _, out in g:
            inputs += ["-i", out]
        fc = "".join(f"[{k}:v]" for k in range(len(g))) + f"concat=n={len(g)}:v=1:a=0,setpts=PTS-STARTPTS[v]"
        gout = f"{SEG}/g{gi}.mp4"
        run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", fc, "-map", "[v]", *ENC, gout])
        planned = sum(d for _, d, _, _ in g)
        got = ffdur(gout)
        print(f"  group {gi}: {got:.2f} s, planned {planned:.2f} + tail {g[-1][2]:.1f}")
        gfiles.append((gout, planned, g[-1][2]))
    # chain xfades
    cur, cur_len = gfiles[0][0], gfiles[0][1]
    for gi in range(1, len(gfiles)):
        join_d = gfiles[gi - 1][2]
        nxt, nxt_len = gfiles[gi][0], gfiles[gi][1]
        out = f"{SEG}/x{gi}.mp4"
        run(["ffmpeg", "-v", "error", "-y", "-i", cur, "-i", nxt, "-filter_complex",
             f"[0:v]settb=AVTB,fps={FPS}[a];[1:v]settb=AVTB,fps={FPS}[b];"
             f"[a][b]xfade=transition=fade:duration={join_d}:offset={cur_len:.3f}[v]", "-map", "[v]", *ENC, out])
        cur, cur_len = out, cur_len + nxt_len
        print(f"  xfade {gi}: {ffdur(out):.2f} s, planned {cur_len:.2f}")
    assert abs(ffdur(cur) - TOTAL) < 0.2, f"joined length {ffdur(cur):.2f} != {TOTAL:.2f}"
    return cur


# ---------------------------------------------------------------- overlays (timeline time)
def ov(png, a, b, fade=0.4):
    return (png, a + TITLE, b + TITLE, fade)


PREVIEW_SPANS = [(24.83, 29.69), (34.23, 39.39), (44.69, 56.43), (61.81, 95.50), (t_end_card, 123.87), (163.2, 169.40)]
OVERLAYS = [
    ov("broll/ov-tag-class.png", 0.3, 4.6),
    ov("broll/ov-stat.png", 16.3, 24.3, 0.5),
    ov("broll/ov-tag-why.png", 17.5, 24.3),              # the problem in words, over the walk to the phone
    ov("broll/ov-wordmark.png", 28.0, 33.6),
    ov("broll/ov-tag-diagram.png", 39.6, 44.5),
    ov("broll/ov-src-campbell.png", 58.6, 61.6),         # once the page has left the byline
    ov("broll/ov-tag-again.png", 69.0, 73.3),            # "Two Agains in a row..."
    ov("broll/ov-tag-clean.png", 74.4, 78.1),            # "Three clean at full speed..."
    ov("broll/ov-src-plos.png", 97.4, 104.7),            # gone before the split frame at 104.90
    ov("broll/ov-label-front.png", 105.1, 110.0),
    ov("broll/ov-label-yours.png", 105.1, 110.0),
    ov("broll/ov-tag-clad.png", 132.0, 137.1),           # "Snap's CLAD built it..."
    ov("broll/ov-src-leaf.png", 142.1, 145.8),           # the whole LEAF shot: "18 LEAF scenarios test it in the preview"
    ov("broll/ov-tag-specs.png", 163.0, 167.8),          # "It hasn't run on glasses yet"
    ov("broll/ov-credit-music.png", TAIL_AFTER_VOICE + 0.3, TAIL_AFTER_VOICE + END_CARD - 0.7),
] + [ov("broll/ov-tag-preview.png", a + 0.2, b - 0.2, 0.3) for a, b in PREVIEW_SPANS]


# ---------------------------------------------------------------- captions
FIXES = [
    (["one", "in", "five."], ["1", "and", "5."]),
    (["in", "a", "year", "years", "ago."], ["in", "AR", "years", "ago."]),
    (["snaps", "clad"], ["Snap's", "CLAD"]),
    (["clad"], ["CLAD"]),
    (["leaf"], ["LEAF"]),
    (["devpost"], ["Devpost"]),
    (["would", "I", "tell", "it?"], ["what", "I", "tell", "it."]),
    (["the", "test", "catch"], ["the", "tests", "catch"]),
    (["floor", "count."], ["Floorcount."]),
    (["again", "or", "got", "it."], ["Again", "or", "Got", "it."]),
    (["two", "agains"], ["Two", "Agains"]),
    (["four", "and", "eight,"], ["4", "and", "8,"]),
    (["on", "the", "one"], ["on", "the", "1"]),
    (["finding", "the", "one"], ["finding", "the", "1"]),
    (["eight", "count."], ["8-count."]),
    (["eight", "counts,"], ["8-counts,"]),
    (["snap's", "ar"], ["Snap's", "AR"]),
]


def cut_time(t):
    if t < 2.55:
        return None
    if t < 64.15:
        return t - 2.55
    if t < 71.15:
        return None
    return t - 9.55


def captions(path):
    words = json.load(open("tmp/voice-words.json", encoding="utf-8"))["words"]
    toks = []
    for w in words:
        s, e = cut_time(w["start"]), cut_time(w["end"])
        if s is None or e is None:
            continue
        toks.append({"word": w["word"].strip(), "start": s + TITLE, "end": e + TITLE})
    i = 0
    out = []
    while i < len(toks):
        hit = None
        for pat, rep in FIXES:
            if [t["word"].lower() for t in toks[i:i + len(pat)]] == [p.lower() for p in pat]:
                hit = (pat, rep)
                break
        if not hit:
            out.append(toks[i])
            i += 1
            continue
        pat, rep = hit
        span = toks[i:i + len(pat)]
        s0, e0 = span[0]["start"], span[-1]["end"]
        if len(rep) == len(pat):
            for t, r in zip(span, rep):
                out.append({"word": r, "start": t["start"], "end": t["end"]})
        else:
            step = (e0 - s0) / len(rep)
            for k, r in enumerate(rep):
                out.append({"word": r, "start": s0 + k * step, "end": s0 + (k + 1) * step})
        i += len(pat)
    transcript = {"segments": [{"start": out[0]["start"], "end": out[-1]["end"], "text": "", "words": out}]}
    style = {
        "font": "Atkinson Hyperlegible Next", "size": 50, "spoken": "F7EEDF", "active": "5FB4E8",
        "outline": "1A1612", "back": "A0000000", "outline_w": 4, "shadow": 2, "margin_v": 58, "margin_h": 150,
        "words_per_line": 7, "play_res": (1920, 1080),
    }
    from pathlib import Path
    transcript_to_ass(transcript, Path(path), style)
    box_captions(path)
    return out


def ass_seconds(t):
    h, m, s = t.split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


def box_captions(path):
    # over the white pages, the terminal and the before-and-after card the outline alone is not enough:
    # those lines get a second style, the same type on a walnut plate (libass BorderStyle 4, one box per line)
    boxed = [(s + TITLE, e + TITLE) for name, s, e, _, _ in BEATS if name in BOXED]
    lines = []
    for ln in open(path, encoding="utf-8").read().splitlines():
        if ln.startswith("Style: Cap,"):
            lines.append(ln)
            f = ln[len("Style: "):].split(",")
            f[0], f[6], f[15], f[17] = "CapBox", "&H4012161A", "4", "0"   # name, BackColour (walnut, 75%), BorderStyle, Shadow
            ln = "Style: " + ",".join(f)
        elif ln.startswith("Dialogue: "):
            parts = ln.split(",", 9)
            t = ass_seconds(parts[1])
            if any(a <= t < b for a, b in boxed):
                parts[3] = "CapBox"
                ln = ",".join(parts)
        lines.append(ln)
    open(path, "w", encoding="utf-8").write("\n".join(lines) + "\n")


# ---------------------------------------------------------------- audio
def read_wav_f32(path, sr=48000):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(sr), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def write_wav_f32(path, data, sr=48000):
    pcm = data.astype("<f4").tobytes()
    with open(path, "wb") as fh:
        fh.write(b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVE")
        fh.write(b"fmt " + struct.pack("<IHHIIHH", 16, 3, 2, sr, sr * 8, 8, 32))
        fh.write(b"data" + struct.pack("<I", len(pcm)) + pcm)


def mix_audio(out_wav):
    sr = 48000
    # the cut file opens on 0.21 s of room and an intake before "So": fade through it so the voice starts on the word
    run(["ffmpeg", "-v", "error", "-y", "-i", VOICE, "-af",
         "afade=t=in:st=0:d=0.18,highpass=f=85:poles=2,afftdn=nr=6:nf=-50:nt=c,acompressor=threshold=-20dB:ratio=3:attack=8:release=120,"
         "loudnorm=I=-16:TP=-0.7:LRA=11", "-ar", str(sr), "-ac", "2", "tmp/voice-proc.wav"])
    voice = read_wav_f32("tmp/voice-proc.wav", sr)
    total = int(TOTAL * sr)
    mix = np.zeros((total, 2), np.float32)
    v0 = int(TITLE * sr)
    n = min(len(voice), total - v0)
    mix[v0:v0 + n] += voice[:n]
    # salsa under the whole video, ducked under the voice (track and credit: MUSIC above). At -13.6 LUFS after
    # the trim, OPEN_DB puts it near -22 LUFS on the cards and in long pauses, DUCK_DB near -33 under the voice
    OPEN_DB, DUCK_DB = -8.0, -21.5
    music = read_wav_f32(MUSIC, sr)[int(MUSIC_IN * sr):] * np.float32(10 ** (MUSIC_TRIM_DB / 20))
    if len(music) < total:
        music = np.concatenate([music, np.zeros((total - len(music), 2), np.float32)])
    music = music[:total]
    vtrack = np.zeros(total, np.float32)
    vtrack[v0:v0 + n] = np.mean(voice[:n] ** 2, axis=1)
    w20 = int(0.02 * sr)
    vrms = np.sqrt(np.convolve(vtrack, np.ones(w20) / w20, mode="same"))
    active = vrms > 10 ** (-42 / 20)
    # hold the duck through the gaps inside and between sentences: 0.3 s before a word, 1.2 s after
    pre, post = int(0.3 * sr), int(1.2 * sr)
    held = active.copy()
    starts = np.flatnonzero(active[1:] & ~active[:-1]) + 1
    ends = np.flatnonzero(active[:-1] & ~active[1:]) + 1
    for s in starts:
        held[max(0, s - pre):s] = True
    for e in ends:
        held[e:min(total, e + post)] = True
    gdb = np.where(held, DUCK_DB, OPEN_DB).astype(np.float32)
    ramp = int(0.35 * sr)                   # gain moves over 0.35 s, never a jump
    gdb = np.convolve(gdb, np.ones(ramp) / ramp, mode="same")
    genv = 10 ** (gdb / 20)
    fi = int(1.0 * sr)
    genv[:fi] *= np.linspace(0, 1, fi)
    fo = int(2.6 * sr)
    genv[-fo:] *= np.linspace(1, 0, fo) ** 1.5
    mix += music * genv[:, None]
    # inaudible dark floor wherever the mix is near silent, so no player ever sees exact zeros
    rng = np.random.default_rng(7)
    noise = rng.standard_normal((total, 2)).astype(np.float32)
    a = np.exp(-2 * np.pi * 200 / sr)
    from scipy.signal import lfilter
    for ch in range(2):       # one-pole lowpass at 200 Hz: dark noise, nothing hissy
        noise[:, ch] = lfilter([1 - a], [1, -a], noise[:, ch]).astype(np.float32)
    noise *= (10 ** (-84 / 20)) / (np.sqrt(np.mean(noise ** 2)) + 1e-12)
    win = int(0.01 * sr)
    rms = np.sqrt(np.convolve(np.mean(mix ** 2, axis=1), np.ones(win) / win, mode="same"))
    gate = (rms < 10 ** (-70 / 20)).astype(np.float32)
    ramp = int(0.05 * sr)
    gate = np.convolve(gate, np.ones(ramp) / ramp, mode="same")
    mix += noise * gate[:, None]
    # gentle fade at the very end
    fe = int(0.6 * sr)
    mix[-fe:] *= np.linspace(1, 0, fe)[:, None]
    mix = np.clip(mix, -0.98, 0.98)
    write_wav_f32(out_wav, mix, sr)


# ---------------------------------------------------------------- final
def final(video_in, out_mp4):
    captions("tmp/captions.ass")
    inputs = ["-i", video_in]
    fc = []
    cur = "[0:v]"
    for k, (png, a, b, fade) in enumerate(OVERLAYS):
        inputs += ["-loop", "1", "-framerate", str(FPS), "-t", f"{TOTAL:.3f}", "-i", png]
        fc.append(f"[{k + 1}:v]format=rgba,fade=t=in:st={a:.3f}:d={fade}:alpha=1,fade=t=out:st={b - fade:.3f}:d={fade}:alpha=1[o{k}]")
        fc.append(f"{cur}[o{k}]overlay=0:0:enable='between(t,{a - 0.05:.3f},{b + 0.05:.3f})'[v{k}]")
        cur = f"[v{k}]"
    fc.append(f"{cur}subtitles='tmp/captions.ass':fontsdir='tmp/fonts-captions'[vout]")
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "[vout]",
         "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS), "-an", "tmp/video-silent.mp4"])
    mix_audio("tmp/mix.wav")
    run(["ffmpeg", "-v", "error", "-y", "-i", "tmp/video-silent.mp4", "-i", "tmp/mix.wav", "-map", "0:v", "-map", "1:a",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", "-shortest", out_mp4])
    print("wrote", out_mp4, f"{ffdur(out_mp4):.2f} s")


if __name__ == "__main__":
    if "--final-only" not in sys.argv:
        files = build_segments()
        joined = join(files)
        print("joined", joined, f"{ffdur(joined):.2f} s (planned {TOTAL:.2f})")
        json.dump({"joined": joined}, open(f"{SEG}/joined.json", "w"))
    joined = json.load(open(f"{SEG}/joined.json"))["joined"]
    final(joined, "broll/floorcount-demo.mp4")
