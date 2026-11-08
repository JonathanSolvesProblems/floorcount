"""Checks on the rendered demo:  py tmp/check_video.py broll/floorcount-demo.mp4

Duration, audio packet timing, sample rate, loudness, black frames, exact-silence windows at the
head, frozen beats, and a contact sheet with one frame from the middle of every beat.
"""
import json
import subprocess
import sys

import numpy as np

sys.argv.append("--term-at")
sys.argv.append("17.1")
sys.path.insert(0, "video")
from make_video import BEATS, TITLE, TOTAL  # noqa: E402

path = sys.argv[1]


def sh(cmd):
    return subprocess.run(cmd, capture_output=True, text=True).stdout + subprocess.run(cmd, capture_output=True, text=True).stderr


dur = float(sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).strip())
print(f"duration {dur:.2f} s (planned {TOTAL:.2f}); under 3:00: {dur < 180}")
print("audio:", sh(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_name,sample_rate,channels,start_time", "-of", "csv=p=0", path]).strip())
print("video:", sh(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height,r_frame_rate,start_time", "-of", "csv=p=0", path]).strip())
pk = sh(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "packet=duration", "-of", "csv=p=0", path]).split()
vals, counts = np.unique(np.array([int(float(p.strip(","))) for p in pk if p.strip(",")]), return_counts=True)
print("audio packet durations:", dict(zip(vals.tolist(), counts.tolist())))
lo = sh(["ffmpeg", "-hide_banner", "-i", path, "-af", "ebur128=framelog=quiet", "-f", "null", "-"])
print("loudness:", [l.strip() for l in lo.splitlines() if "I:" in l or "LRA:" in l or "Peak:" in l][:3])
bl = sh(["ffmpeg", "-hide_banner", "-i", path, "-vf", "blackdetect=d=0.3:pix_th=0.06", "-an", "-f", "null", "-"])
print("black frames:", [l for l in bl.splitlines() if "black_start" in l] or "none")
# exact-silence windows in the first 6 s and the last 4 s
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", "48000", "-"], capture_output=True).stdout
a = np.frombuffer(raw, np.float32)
win = 480
head = a[: 6 * 48000].reshape(-1, win)
tail = a[-4 * 48000:][: (4 * 48000 // win) * win].reshape(-1, win)
print("exact-silence 10 ms windows: head", int((np.abs(head).max(axis=1) == 0).sum()), "tail", int((np.abs(tail).max(axis=1) == 0).sum()))
first_voice = next((i / 48000 for i in range(0, len(a), 480) if np.abs(a[i:i + 480]).max() > 0.02), None)
print(f"first signal above -34 dBFS at {first_voice:.2f} s (voice should start near {TITLE + 0.2:.2f})")
# frozen beats: scene-change count per beat
sc = sh(["ffmpeg", "-hide_banner", "-i", path, "-vf", "select='gt(scene,0.0005)',metadata=print:file=-", "-an", "-f", "null", "-"])
times = [float(l.split("pts_time:")[1].split()[0]) for l in sc.splitlines() if "pts_time:" in l]
times = np.array(times)
frozen = []
for name, s, e, kind, p in BEATS:
    n = int(((times > s + TITLE) & (times < e + TITLE)).sum())
    if n == 0 and e - s > 2:
        frozen.append(name)
print("beats with no motion:", frozen or "none")
# contact sheet: the middle of every beat
tiles = []
for i, (name, s, e, kind, p) in enumerate(BEATS):
    t = TITLE + (s + e) / 2
    o = f"tmp/chk_{i:02}.png"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", path, "-frames:v", "1", "-vf",
                    f"scale=480:270,drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='{name} {t:.1f}s':x=6:y=6:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6", o], check=True)
    tiles.append(o)
subprocess.run(["py", "-3", "tmp/tile.py", "tmp/check-sheet.png", "5", *tiles], check=True)
print("sheet tmp/check-sheet.png")
