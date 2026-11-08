"""Count rewinds and pauses in the phone screen recording of the tutorial practice.

  py tmp/count_rewinds.py broll/measure-screen.mp4 tmp/rewinds.json

A rewind is a hard cut in the recording after which the next two seconds of frames match a
stretch of the recording from 3 s to 3 min earlier (the tutorial replaying footage already
seen). A pause is 2 s or more of an unchanging screen. Every event gets a timestamp so it can
be checked against the frames by eye.
"""
import json
import subprocess
import sys

import numpy as np

src, out = sys.argv[1], sys.argv[2]
FPS, W, H = 2, 48, 27
raw = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", src, "-vf", f"fps={FPS},scale={W}:{H}:flags=area,format=gray",
     "-f", "rawvideo", "-pix_fmt", "gray", "-"],
    capture_output=True, check=True).stdout
frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, H * W).astype(np.float32)
n = len(frames)
print(f"{n} frames at {FPS} fps = {n / FPS:.0f} s")


def dist(a, b):
    return float(np.mean(np.abs(a - b)))


consec = np.array([0.0] + [dist(frames[i], frames[i - 1]) for i in range(1, n)])
JUMP, MATCH, STILL = 18.0, 7.0, 1.0

# pauses: runs of still frames >= 2 s
pauses = []
i = 1
while i < n:
    if consec[i] < STILL:
        j = i
        while j < n and consec[j] < STILL:
            j += 1
        if (j - i) / FPS >= 2.0:
            pauses.append({"t": round(i / FPS, 1), "seconds": round((j - i) / FPS, 1)})
        i = j
    else:
        i += 1

# rewinds: a cut, then the next 2 s of frames match a sequence 3 s to 180 s earlier
rewinds = []
last = -10
SEQ = 2 * FPS
for i in range(1, n - SEQ):
    if consec[i] < JUMP or i - last < 2 * FPS:
        continue
    best = None
    for j in range(max(0, i - 180 * FPS), i - 3 * FPS):
        d = np.mean([dist(frames[i + k], frames[j + k]) for k in range(SEQ)])
        if d < MATCH and (best is None or d < best[1]):
            best = (j, d)
    if best:
        rewinds.append({"t": round(i / FPS, 1), "back_to": round(best[0] / FPS, 1),
                        "seconds_back": round((i - best[0]) / FPS, 1), "match": round(best[1], 1)})
        last = i

json.dump({"duration_s": n / FPS, "rewinds": rewinds, "pauses": pauses}, open(out, "w"), indent=1)
print(f"rewinds: {len(rewinds)}")
for r in rewinds:
    print(f"  at {r['t']:6.1f} s  back {r['seconds_back']:5.1f} s  (match {r['match']})")
print(f"pauses >= 2 s: {len(pauses)}, total {sum(p['seconds'] for p in pauses):.0f} s")
for p in pauses:
    print(f"  at {p['t']:6.1f} s  for {p['seconds']:5.1f} s")
