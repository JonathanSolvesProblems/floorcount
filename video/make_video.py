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
TAIL_AFTER_VOICE = 173.0            # the final turn runs to here (cut time)
END_CARD = 3.0
WALNUT = "0x1A1612"
SEG = "tmp/seg"
os.makedirs(SEG, exist_ok=True)
CARDS = ".design/brand/export/cards/"
D = "broll/dslr/"
TL = json.load(open("tmp/timeline-times.json"))
TERM_SUMMARY_AT = float(sys.argv[sys.argv.index("--term-at") + 1]) if "--term-at" in sys.argv else 24.0


def run(cmd):
    # segment renders are cached on their exact command, so a rerun only redoes what changed
    out = cmd[-1]
    stamp = out + ".cmd" if out.startswith(SEG + "/") and out.endswith(".mp4") else None
    if stamp and os.path.exists(out) and os.path.exists(stamp) and open(stamp, encoding="utf-8").read() == " ".join(cmd):
        return
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(" ".join(cmd))
        print(r.stderr[-4000:])
        raise SystemExit(1)
    if stamp:
        open(stamp, "w", encoding="utf-8").write(" ".join(cmd))


def ffdur(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                                capture_output=True, text=True).stdout.strip())


# ---------------------------------------------------------------- beats (cut time)
# (name, start, end, kind, params)
t_end_card = TL["end"]
BEATS = [
    ("A", 0.00, 4.77, "portrait", dict(src="broll/class-blurred.mp4", inp=0.0)),
    ("B", 4.77, 12.77, "clip", dict(src=D + "MVI_0693.MOV", inp=229.0)),
    ("C", 12.77, 24.83, "clip", dict(src=D + "MVI_0693.MOV", inp=277.0)),
    ("D", 24.83, 29.69, "clip", dict(src="broll/preview-02-again-half.mp4", inp=0.0)),
    ("E", 29.69, 34.23, "clip", dict(src="broll/preview-09-lens-studio-wide.mp4", inp=0.5)),
    ("E2", 34.23, 39.39, "clip", dict(src="broll/preview-01-basic-slow.mp4", inp=0.0)),
    ("F", 39.39, 44.69, "clip", dict(src="broll/floor-diagram.mp4", inp=0.0)),
    ("G", 44.69, 53.21, "clip", dict(src="broll/preview-11-count-hides.mp4", inp=0.0)),
    ("H1", 53.21, 56.43, "punch", dict(src="broll/preview-01-basic-slow.mp4", inp=0.0)),
    ("H2", 56.43, 61.81, "clip", dict(src="broll/preview-01-basic-slow.mp4", inp=1.8)),
    ("I", 61.81, 67.73, "clip", dict(src="broll/preview-04-step-card.mp4", inp=0.5)),
    ("J", 67.73, 73.41, "clip", dict(src="broll/preview-02-again-half.mp4", inp=6.0)),
    ("K", 73.41, 78.23, "clip", dict(src="broll/preview-03-next-step.mp4", inp=6.8)),
    ("L", 78.23, 82.99, "clip", dict(src="broll/preview-11-count-hides.mp4", inp=6.3)),
    ("M", 82.99, 85.89, "clip", dict(src="broll/preview-10-arrow.mp4", inp=2.3)),
    ("N1", 85.89, 90.93, "clip", dict(src="broll/preview-06-second-session.mp4", inp=1.0)),
    ("N2", 90.93, 94.37, "clip", dict(src="broll/preview-07-summary-last-time.mp4", inp=0.3)),
    ("O", 94.37, 110.19, "split", dict(left=D + "MVI_0693.MOV", linp=469.0, right="broll/preview-02-again-half.mp4", rinp=0.0)),
    ("P", 110.19, t_end_card, "clip", dict(src="broll/timeline.mp4", inp=0.0)),
    ("P2", t_end_card, 123.87, "clip", dict(src="broll/preview-03-next-step.mp4", inp=5.5)),
    ("Q1", 123.87, 131.55, "clip", dict(src="broll/web-03-design-brief.mp4", inp=1.0)),
    ("Q2", 131.55, 137.29, "clip", dict(src="broll/web-04-prompts.mp4", inp=2.0)),
    ("Q3", 137.29, 142.01, "clip", dict(src="broll/web-05-build-log.mp4", inp=1.0)),
    ("Q4", 142.01, 145.89, "clip", dict(src="broll/preview-08-leaf-run.mp4", inp=28.5)),
    ("Q5", 145.89, 149.53, "clip", dict(src="broll/web-02-ci-green.mp4", inp=4.0)),
    ("Q6", 149.53, 152.99, "terminal", dict(src="broll/terminal-tests-take6.mp4", inp=TERM_SUMMARY_AT - 1.5)),
    ("Q7", 152.99, 159.07, "image", dict(src=CARDS + "gallery-before-after-1500x1000.png")),
    ("R", 159.07, 167.97, "clip", dict(src="broll/preview-09-lens-studio-wide.mp4", inp=0.0)),
    ("S1", 167.97, 169.40, "clip", dict(src="broll/preview-05-right-turn-clean.mp4", inp=0.0)),
    ("S2", 169.40, TAIL_AFTER_VOICE, "clip", dict(src=D + "MVI_0694.MOV", inp=17.8)),
]
# joins: dissolves into/out of the cards and between the two home shots; everything else cuts
XFADE = {"TITLE->A": 0.5, "B->C": 0.5, "S2->END": 0.6}
TOTAL = TITLE + TAIL_AFTER_VOICE + END_CARD

ENC = ["-an", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-r", str(FPS)]
FIT = f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color={WALNUT},setsar=1"


def finish(dur):
    return f"fps={FPS},tpad=stop_mode=clone:stop_duration=4,trim=duration={dur:.3f},setpts=PTS-STARTPTS"


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


def render_segment(name, dur, kind, p, out):
    if kind == "clip":
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{p['inp']:.3f}", "-t", f"{dur + 2:.3f}", "-i", p["src"],
             "-vf", f"{FIT},{finish(dur)}", *ENC, out])
    elif kind == "portrait":
        run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-framerate", str(FPS), "-t", f"{dur + 1:.3f}", "-i", walnut_bg(),
             "-ss", f"{p['inp']:.3f}", "-t", f"{dur + 2:.3f}", "-i", p["src"],
             "-filter_complex", f"[1:v]scale=-2:1080[p];[0:v][p]overlay=(W-w)/2:0:shortest=1,setsar=1,{finish(dur)}[v]",
             "-map", "[v]", *ENC, out])
    elif kind == "punch":
        # a slow push into the count strip above the pad (source 1280x720, strip near x=640, y=230),
        # done with zoompan on a 2x supersampled frame so the move stays smooth
        n = int(dur * FPS)
        zp = (f"zoompan=z='1+0.6*on/{n}':d=1:x='min(max(1280-(iw/zoom)/2,0),iw-iw/zoom)'"
              f":y='min(max(460-(ih/zoom)/2,0),ih-ih/zoom)':s=1920x1080:fps={FPS}")
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{p['inp']:.3f}", "-t", f"{dur + 2:.3f}", "-i", p["src"],
             "-vf", f"fps={FPS},scale=2560:1440:flags=lanczos,{zp},setsar=1,{finish(dur)}", *ENC, out])
    elif kind == "split":
        run(["ffmpeg", "-v", "error", "-y",
             "-ss", f"{p['linp']:.3f}", "-t", f"{dur + 2:.3f}", "-i", p["left"],
             "-ss", f"{p['rinp']:.3f}", "-t", f"{dur + 2:.3f}", "-i", p["right"],
             "-filter_complex",
             f"[0:v]fps={FPS},crop=960:1080:700:0,setsar=1[l];"
             f"[1:v]fps={FPS},crop=640:720:320:0,scale=960:1080,setsar=1[r];"
             f"[l][r]hstack=shortest=1,drawbox=x=957:y=0:w=6:h=1080:color=0xF7EEDF@0.9:t=fill,{finish(dur)}[v]",
             "-map", "[v]", *ENC, out])
    elif kind == "image":
        n = int(dur * FPS)
        run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-framerate", str(FPS), "-t", f"{dur + 1:.3f}", "-i", p["src"],
             "-vf", f"scale=3240:2160:force_original_aspect_ratio=decrease,pad=3840:2160:(ow-iw)/2:(oh-ih)/2:color={WALNUT},"
                    f"zoompan=z='1+0.045*on/{n}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps={FPS},setsar=1,{finish(dur)}",
             *ENC, out])
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


PREVIEW_SPANS = [(24.83, 29.69), (34.23, 39.39), (44.69, 94.37), (t_end_card, 123.87), (167.97, 169.40)]
OVERLAYS = [
    ov("broll/ov-tag-class.png", 0.3, 4.6),
    ov("broll/ov-stat.png", 16.3, 24.3, 0.5),
    ov("broll/ov-wordmark.png", 28.0, 33.6),
    ov("broll/ov-tag-diagram.png", 39.6, 44.5),
    ov("broll/ov-src-campbell.png", 56.6, 61.6),
    ov("broll/ov-label-front.png", 94.5, 110.0),
    ov("broll/ov-label-yours.png", 94.5, 110.0),
    ov("broll/ov-src-versace-low.png", 95.6, 104.8),
    ov("broll/ov-src-leaf.png", 142.2, 145.7),
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
    return out


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
    run(["ffmpeg", "-v", "error", "-y", "-i", VOICE, "-af",
         "highpass=f=85:poles=2,afftdn=nr=6:nf=-50:nt=c,acompressor=threshold=-20dB:ratio=3:attack=8:release=120,"
         "loudnorm=I=-16:TP=-0.7:LRA=11", "-ar", str(sr), "-ac", "2", "tmp/voice-proc.wav"])
    voice = read_wav_f32("tmp/voice-proc.wav", sr)
    total = int(TOTAL * sr)
    mix = np.zeros((total, 2), np.float32)
    v0 = int(TITLE * sr)
    n = min(len(voice), total - v0)
    mix[v0:v0 + n] += voice[:n]
    # the Lens's own loop as the bed, from the Floorcount reveal to the end card
    loop = read_wav_f32("Assets/GeneratedSFX/FloorcountSalsa140.wav", sr)
    m_start, m_end = TITLE + 24.83, TOTAL - 0.6
    gain = 10 ** (-20.0 / 20)       # the loop sits at -15.5 LUFS; this puts the bed near -35.5
    s0, s1 = int(m_start * sr), int(m_end * sr)
    reps = int(np.ceil((s1 - s0) / len(loop)))
    bed = np.tile(loop, (reps, 1))[: s1 - s0] * gain
    env = np.ones(len(bed), np.float32)
    fi, fo = int(1.5 * sr), int(3.0 * sr)
    env[:fi] = np.linspace(0, 1, fi)
    env[-fo:] = np.linspace(1, 0, fo)
    mix[s0:s1] += bed * env[:, None]
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
