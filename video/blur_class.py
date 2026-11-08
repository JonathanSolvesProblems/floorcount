"""Blur every face but Jonathan's in the class clip.

  py tmp/blur_class.py <source.mp4> <start_s> <seconds> <out.mp4>

Every frame: YuNet finds faces; the one nearest Jonathan's last known head is his and stays sharp;
every other detection is blurred. On top of that, MIL trackers follow the heads of the people who
are turned away (the detector cannot see a face that is not there, but it comes back when they
turn), and those boxes are blurred regardless. The union is blurred with a feathered ellipse.
Writes a verification grid next to the output.
"""
import subprocess
import sys

import cv2
import numpy as np

src, start, secs, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
W, H, FPS = 1080, 1920, 30
MODEL = "tmp/yunet/face_detection_yunet_2023mar.onnx"  # from github.com/opencv/opencv_zoo, models/face_detection_yunet

# Boxes at the first frame (t = 20.0 s), read off the full frame by eye: x, y, w, h
JON0 = (320, 730, 160, 190)
OTHERS0 = [
    (0, 830, 170, 190),    # partner's head, left edge
    (590, 900, 100, 120),  # background dancer, back of head
    (730, 890, 90, 110),   # background dancer with glasses
]

dec = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-t", f"{secs:.3f}", "-i", src,
     "-vf", f"fps={FPS},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
    stdout=subprocess.PIPE)
enc = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS),
     "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", out],
    stdin=subprocess.PIPE)

det = cv2.FaceDetectorYN.create(MODEL, "", (W, H), 0.55, 0.3, 50)
trackers = []
jon = JON0
frames_kept = []
n = 0


def center(b):
    return (b[0] + b[2] / 2, b[1] + b[3] / 2)


def grow(b, f):
    cx, cy = center(b)
    w, h = b[2] * f, b[3] * f
    return (int(cx - w / 2), int(cy - h / 2), int(w), int(h))


def blur_boxes(img, boxes):
    if not boxes:
        return img
    blurred = cv2.GaussianBlur(img, (0, 0), 28)
    small = cv2.resize(blurred, (W // 24, H // 24), interpolation=cv2.INTER_AREA)
    blurred = cv2.resize(small, (W, H), interpolation=cv2.INTER_NEAREST)
    blurred = cv2.GaussianBlur(blurred, (0, 0), 6)
    mask = np.zeros((H, W), np.uint8)
    for (x, y, w, h) in boxes:
        cv2.ellipse(mask, (int(x + w / 2), int(y + h / 2)), (max(int(w / 2), 8), max(int(h / 2), 8)), 0, 0, 360, 255, -1)
    mask = cv2.GaussianBlur(mask, (0, 0), 9).astype(np.float32) / 255.0
    mask = mask[:, :, None]
    return (img * (1 - mask) + blurred * mask).astype(np.uint8)


while True:
    raw = dec.stdout.read(W * H * 3)
    if len(raw) < W * H * 3:
        break
    img = np.frombuffer(raw, np.uint8).reshape(H, W, 3).copy()
    if n == 0:
        for b in OTHERS0:
            t = cv2.TrackerMIL_create()
            t.init(img, b)
            trackers.append(t)
    _, faces = det.detect(img)
    faces = [] if faces is None else [tuple(int(v) for v in f[:4]) for f in faces]
    # Jonathan: the detection nearest his last box, if it is close enough
    jc = center(jon)
    best = None
    for f in faces:
        d = np.hypot(center(f)[0] - jc[0], center(f)[1] - jc[1])
        if d < 140 and (best is None or d < best[0]):
            best = (d, f)
    if best:
        jon = best[1]
    boxes = [grow(f, 1.7) for f in faces if f is not jon and f != jon]
    for t in trackers:
        ok, b = t.update(img)
        if ok:
            b = tuple(int(v) for v in b)
            # never let a tracker drift onto Jonathan's face
            if np.hypot(center(b)[0] - center(jon)[0], center(b)[1] - center(jon)[1]) > 110:
                boxes.append(grow(b, 1.35))
    img = blur_boxes(img, boxes)
    enc.stdin.write(img.tobytes())
    if n % 4 == 0:
        frames_kept.append(cv2.resize(img, (W // 6, H // 6), interpolation=cv2.INTER_AREA))
    n += 1

enc.stdin.close()
enc.wait()
print(f"{n} frames -> {out}")
cols = 12
rows = (len(frames_kept) + cols - 1) // cols
grid = np.zeros((rows * (H // 6), cols * (W // 6), 3), np.uint8)
for i, f in enumerate(frames_kept):
    r, c = divmod(i, cols)
    grid[r * (H // 6):(r + 1) * (H // 6), c * (W // 6):(c + 1) * (W // 6)] = f
cv2.imwrite(out.replace(".mp4", "-grid.png"), grid)
