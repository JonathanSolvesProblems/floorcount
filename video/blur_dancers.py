"""Blur every head but Jonathan's in a landscape class clip.

  tmp/venv-yolo/Scripts/python video/blur_dancers.py <source.mp4> <start_s> <seconds> <out.mp4>

A face detector misses heads that are turned away, so this works from body pose instead: YOLO pose
finds every person and their nose, eyes, ears and shoulders, ByteTrack keeps an id on each, and a head
box is built from those keypoints whichever way the person faces. Jonathan is the person in the
purple sweater, scored on the colour of the torso between the shoulders and hips and smoothed over
the track. Every other head is pixelated and blurred under a generous feathered ellipse, and a lost
track keeps its last box for half a second so nobody flashes into view between detections.
Writes a verification grid next to the output.
"""
import subprocess
import sys

import cv2
import numpy as np
from ultralytics import YOLO

src, start, secs, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
W, H, FPS = 1920, 1080, 30
HOLD = 15  # frames a lost head keeps its blur

dec = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-t", f"{secs:.3f}", "-i", src,
     "-vf", f"fps={FPS},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
    stdout=subprocess.PIPE)
enc = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS),
     "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", out],
    stdin=subprocess.PIPE)

model = YOLO("tmp/yolov8m-pose.pt")  # downloads on first use
purple = {}     # track id -> running purple score
last = {}       # track id -> (head box, frames since seen)
grid, n = [], 0


def purple_score(img, k):
    pts = [k[i] for i in (5, 6, 11, 12) if k[i][2] > 0.3]
    if len(pts) < 3:
        return None
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    x0, x1 = int(min(xs)), int(max(xs)); y0, y1 = int(min(ys)), int(max(ys))
    if x1 - x0 < 6 or y1 - y0 < 6:
        return None
    patch = cv2.cvtColor(img[max(y0, 0):y1, max(x0, 0):x1], cv2.COLOR_BGR2HSV).reshape(-1, 3).astype(int)
    # dark purple: hue 120-170 (OpenCV scale), some saturation, not black
    m = (patch[:, 0] >= 115) & (patch[:, 0] <= 172) & (patch[:, 1] > 40) & (patch[:, 2] > 25)
    return float(m.mean())


def head_box(k, box):
    sh = [k[i] for i in (5, 6) if k[i][2] > 0.3]
    face = [k[i] for i in (0, 1, 2, 3, 4) if k[i][2] > 0.3]
    bw = box[2] - box[0]
    if len(sh) == 2:
        sw = abs(sh[0][0] - sh[1][0])
        size = max(sw * 1.25, bw * 0.55, 60)
        cx = (sh[0][0] + sh[1][0]) / 2
        cy = (sh[0][1] + sh[1][1]) / 2 - size * 0.55
    else:
        size = max(bw * 0.6, 60)
        cx = (box[0] + box[2]) / 2
        cy = box[1] + size * 0.45
    if face:
        fx = np.mean([p[0] for p in face]); fy = np.mean([p[1] for p in face])
        cx, cy = (cx + 2 * fx) / 3, (cy + 2 * fy) / 3
    # never above the person's own box by more than a little
    cy = max(cy, box[1] + size * 0.3)
    return (cx, cy, size * 0.62, size * 0.78)  # centre, half-width, half-height


def blur(img, heads):
    if not heads:
        return img
    b = cv2.GaussianBlur(img, (0, 0), 30)
    small = cv2.resize(b, (W // 40, H // 40), interpolation=cv2.INTER_AREA)
    b = cv2.resize(small, (W, H), interpolation=cv2.INTER_NEAREST)
    b = cv2.GaussianBlur(b, (0, 0), 8)
    mask = np.zeros((H, W), np.uint8)
    for (cx, cy, rx, ry) in heads:
        cv2.ellipse(mask, (int(cx), int(cy)), (int(rx), int(ry)), 0, 0, 360, 255, -1)
    mask = cv2.GaussianBlur(mask, (0, 0), 7).astype(np.float32)[:, :, None] / 255.0
    mask = np.clip(mask * 1.6, 0, 1)  # solid core, soft edge
    return (img * (1 - mask) + b * mask).astype(np.uint8)


while True:
    raw = dec.stdout.read(W * H * 3)
    if len(raw) < W * H * 3:
        break
    img = np.frombuffer(raw, np.uint8).reshape(H, W, 3).copy()
    r = model.track(img, persist=True, verbose=False, conf=0.2, imgsz=1280, tracker="bytetrack.yaml")[0]
    seen = {}
    if r.boxes is not None and len(r.boxes):
        ids = r.boxes.id.int().tolist() if r.boxes.id is not None else [-(i + 1) for i in range(len(r.boxes))]
        for tid, box, k in zip(ids, r.boxes.xyxy.tolist(), r.keypoints.data.tolist()):
            s = purple_score(img, k)
            if s is not None:
                purple[tid] = 0.8 * purple.get(tid, s) + 0.2 * s
            seen[tid] = head_box(k, box)
    # Jonathan: the visible track with the highest purple score, if it is clearly purple
    jon = max(seen, key=lambda t: purple.get(t, 0), default=None)
    if jon is not None and purple.get(jon, 0) < 0.12:
        jon = None
    for tid, hb in seen.items():
        last[tid] = (hb, 0)
    heads = []
    for tid in list(last):
        hb, age = last[tid]
        if tid == jon:
            continue
        if tid not in seen:
            if age >= HOLD:
                del last[tid]
                continue
            last[tid] = (hb, age + 1)
        # do not let a held box sit on Jonathan's face
        if jon is not None:
            jx, jy = seen[jon][0], seen[jon][1]
            if tid not in seen and np.hypot(hb[0] - jx, hb[1] - jy) < seen[jon][2]:
                continue
        heads.append(hb)
    img = blur(img, heads)
    enc.stdin.write(img.tobytes())
    if n % 6 == 0:
        grid.append(cv2.resize(img, (W // 5, H // 5), interpolation=cv2.INTER_AREA))
    n += 1

enc.stdin.close()
enc.wait()
print(f"{n} frames -> {out}")
cols = 6
rows = (len(grid) + cols - 1) // cols
sheet = np.zeros((rows * (H // 5), cols * (W // 5), 3), np.uint8)
for i, f in enumerate(grid):
    rr, c = divmod(i, cols)
    sheet[rr * (H // 5):(rr + 1) * (H // 5), c * (W // 5):(c + 1) * (W // 5)] = f
cv2.imwrite(out.replace(".mp4", "-grid.jpg"), sheet, [cv2.IMWRITE_JPEG_QUALITY, 85])
