"""Tile images into one contact sheet:  py tmp/tile.py <out.png> <cols> <img1> <img2> ..."""
import sys

from PIL import Image

out, cols, paths = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
TW, TH = 320, 200
rows = (len(paths) + cols - 1) // cols
sheet = Image.new("RGB", (cols * TW, rows * TH), (20, 20, 20))
for i, p in enumerate(paths):
    im = Image.open(p).convert("RGB")
    im.thumbnail((TW - 4, TH - 4))
    x = (i % cols) * TW + (TW - im.width) // 2
    y = (i // cols) * TH + (TH - im.height) // 2
    sheet.paste(im, (x, y))
sheet.save(out)
print(out, sheet.size)
