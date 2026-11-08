"""Every hard cut in the phone screen recording, as a before/after contact sheet for checking by eye.

  py tmp/cuts_sheet.py broll/measure-screen.mp4 tmp/cuts
"""
import json
import os
import subprocess
import sys

import numpy as np

src, outdir = sys.argv[1], sys.argv[2]
os.makedirs(outdir, exist_ok=True)
FPS, W, H = 4, 48, 27
raw = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", src, "-vf", f"fps={FPS},scale={W}:{H}:flags=area,format=gray",
     "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True, check=True).stdout
frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, H * W).astype(np.float32)
n = len(frames)
consec = np.array([0.0] + [float(np.mean(np.abs(frames[i] - frames[i - 1]))) for i in range(1, n)])
cuts = []
last = -10
for i in range(1, n):
    if consec[i] >= 14.0 and i - last >= FPS:  # at most one cut per second
        cuts.append(i / FPS)
        last = i
print(f"{len(cuts)} cuts")
json.dump(cuts, open(f"{outdir}/cuts.json", "w"))
tiles = []
for k, t in enumerate(cuts):
    a, b, o = f"{outdir}/c{k:02}_a.png", f"{outdir}/c{k:02}_b.png", f"{outdir}/c{k:02}.png"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t - 0.6:.2f}", "-i", src, "-frames:v", "1", "-vf", "scale=-1:120", a], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t + 0.4:.2f}", "-i", src, "-frames:v", "1", "-vf", "scale=-1:120", b], check=True)
    label = f"{k:02}  {int(t // 60)}m{t % 60:04.1f}s"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a, "-i", b, "-filter_complex",
                    f"[0]pad=iw+6:ih:0:0:black[l];[l][1]hstack,pad=iw:ih+22:0:22:black,drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='{label}':x=4:y=2:fontsize=18:fontcolor=yellow", o], check=True)
    tiles.append(o)
# sheets of 12 tiles, 3 columns
for s in range(0, len(tiles), 12):
    group = tiles[s:s + 12]
    rows = []
    for r in range(0, len(group), 3):
        row = group[r:r + 3]
        cmd = ["ffmpeg", "-v", "error", "-y"]
        for p in row:
            cmd += ["-i", p]
        rp = f"{outdir}/row{s}_{r}.png"
        if len(row) == 1:
            cmd += ["-c", "copy", rp]
        else:
            cmd += ["-filter_complex", f"hstack={len(row)}", rp]
        subprocess.run(cmd, check=True)
        rows.append(rp)
    cmd = ["ffmpeg", "-v", "error", "-y"]
    for p in rows:
        cmd += ["-i", p]
    sheet = f"{outdir}/sheet{s // 12:02}.png"
    if len(rows) == 1:
        cmd += ["-c", "copy", sheet]
    else:
        cmd += ["-filter_complex", f"vstack={len(rows)}", sheet]
    subprocess.run(cmd, check=True)
    print(sheet)
