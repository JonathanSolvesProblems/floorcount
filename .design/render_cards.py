"""Render the brand kit's card pages to PNG:  py .design/render_cards.py [name ...]

Each card is an HTML page in .design/brand/ drawn at a fixed size. The PNGs land in
.design/brand/export/cards/ and are what the video and the Devpost gallery use.
"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BRAND = Path(__file__).resolve().parent / "brand"
OUT = BRAND / "export" / "cards"

CARDS = {
    "title-card": ("title-card.html", 1920, 1080, "title-card-1920x1080.png"),
    "end-card": ("end-card.html", 1920, 1080, "end-card-1920x1080.png"),
    "thumbnail": ("thumbnail.html", 1500, 1000, "devpost-thumbnail-1500x1000.png"),
    "gallery-before-after": ("gallery-before-after.html", 1500, 1000, "gallery-before-after-1500x1000.png"),
    "gallery-how-it-was-made": ("gallery-how-it-was-made.html", 1500, 1000, "gallery-how-it-was-made-1500x1000.png"),
}


def main():
    names = sys.argv[1:] or list(CARDS)
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch()
        except Exception:
            browser = p.chromium.launch(channel="msedge")
        for name in names:
            page_file, w, h, out = CARDS[name]
            page = browser.new_page(viewport={"width": w, "height": h})
            page.goto((BRAND / page_file).as_uri())
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(300)
            page.screenshot(path=str(OUT / out), clip={"x": 0, "y": 0, "width": w, "height": h})
            page.close()
            print(f"{out}  {w}x{h}")
        browser.close()


if __name__ == "__main__":
    main()
