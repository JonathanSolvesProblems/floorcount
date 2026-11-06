"""Render the Floorcount brand kit to PNG.

Writes the wordmark (one glyph redrawn) and every texture the Lens uses to .design/brand/export/.
Textures are ivory shapes at full opacity on a transparent ground; the Lens material sets the
brightness (alpha) and, on the 1, the teal tint. Run from the project root:

    py .design/render.py
"""
import pathlib
import re

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent
BRAND = ROOT / "brand"
OUT = BRAND / "export"
OUT.mkdir(parents=True, exist_ok=True)

IVORY = "#F7EEDF"
TEAL = "#5FB4E8"
FLOOR = "#1A1612"

# Dance-shoe sole print, 1 unit = 1 mm, toes up, left foot. The forefoot and the Cuban heel are
# separate pieces, which is what makes the print read as a dance shoe.
FOREFOOT = ("M58 4 C24 8 6 48 9 95 C11 125 26 148 30 165 C32 178 44 184 52 184 "
            "C62 184 72 178 72 165 C74 150 86 128 92 95 C97 52 86 8 58 4 Z")
HEEL = ("M30 200 C24 200 20 206 20 214 L20 250 C20 262 36 270 53 270 "
        "C70 270 86 262 86 250 L86 214 C86 206 82 200 76 200 Z")


def svg(view_box, body, w, h):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}" '
            f'width="{w}" height="{h}">{body}</svg>')


def foot(solid, mirror):
    t = ' transform="translate(100,0) scale(-1,1)"' if mirror else ""
    inner = f'<path d="{FOREFOOT}"/><path d="{HEEL}"/>'
    if solid:
        g = f'<g fill="{IVORY}"{t}>{inner}</g>'
    else:
        g = (f'<g fill="none" stroke="{IVORY}" stroke-width="20" stroke-linejoin="round"{t}>'
             f'{inner}</g>')
    # 120 x 290 mm box (10 mm of air around the 100 x 270 print) so the quad is 12 x 29 cm.
    return svg("-10 -8 120 290", g, 480, 1160)


def cell(empty):
    if empty:
        body = (f'<rect x="3" y="3" width="54" height="24" rx="12" fill="none" '
                f'stroke="{IVORY}" stroke-width="6"/>')
    else:
        body = f'<rect width="60" height="30" rx="15" fill="{IVORY}"/>'
    return svg("0 0 60 30", body, 480, 240)


def pad_border():
    # 1.8 cm stroke: the 1 cm line smeared in 720p video (blind critic, 2026-11-02).
    body = (f'<rect x="9" y="9" width="882" height="882" rx="40" fill="none" '
            f'stroke="{IVORY}" stroke-width="18"/>')
    return svg("0 0 900 900", body, 1800, 1800)


def parquet():
    rects = []
    for x, y, w, h in [(0, 0, 150, 50), (0, 50, 150, 50), (0, 100, 150, 50),
                       (150, 0, 50, 150), (200, 0, 50, 150), (250, 0, 50, 150),
                       (0, 150, 50, 150), (50, 150, 50, 150), (100, 150, 50, 150),
                       (150, 150, 150, 50), (150, 200, 150, 50), (150, 250, 150, 50)]:
        rects.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}"/>')
    body = f'<g fill="none" stroke="{IVORY}" stroke-width="2.5">{"".join(rects)}</g>'
    return svg("0 0 300 300", body, 600, 600)


def arrow():
    body = (f'<path d="M12 18 L30 42 L48 18" fill="none" stroke="{IVORY}" stroke-width="12" '
            f'stroke-linecap="round" stroke-linejoin="round"/>')
    return svg("0 0 60 60", body, 240, 240)


def favicon_dot():
    # At 32 px and below only the 1 survives reduction: the teal dot alone on the walnut square.
    body = (f'<rect width="64" height="64" rx="14" fill="{FLOOR}"/>'
            f'<rect x="14" y="24" width="36" height="16" rx="8" fill="{TEAL}"/>')
    return svg("0 0 64 64", body, 64, 64)


def favicon():
    cells = []
    for i in range(8):
        row, col = divmod(i, 4)
        x, y = 5.5 + col * 14, 22 + row * 15
        if i in (3, 7):
            cells.append(f'<rect x="{x + 0.75}" y="{y + 0.75}" width="9.5" height="3.5" rx="1.75" '
                         f'fill="none" stroke="{IVORY}" stroke-width="1.5"/>')
        else:
            fill = TEAL if i == 0 else IVORY
            op = "" if i == 0 else ' fill-opacity="0.8"'
            cells.append(f'<rect x="{x}" y="{y}" width="11" height="5" rx="2.5" fill="{fill}"{op}/>')
    body = f'<rect width="64" height="64" rx="14" fill="{FLOOR}"/>{"".join(cells)}'
    return svg("0 0 64 64", body, 64, 64)


def wordmark_variants():
    raw = (BRAND / "wordmark-raw.svg").read_text(encoding="utf-8")
    m = re.search(r'(<path id="g2" data-char="o"[^>]*?)d="([^"]+)"', raw)
    d = m.group(2)
    second_m = d.index("M", 1)
    outer_only = d[:second_m].strip()  # drop the counter: the struck note is solid
    struck = f'{m.group(1)}d="{outer_only}" fill="{TEAL}"'
    edited = raw[:m.start()] + struck + raw[m.end():]
    (BRAND / "wordmark.svg").write_text(edited, encoding="utf-8")
    # On an ivory ground the ink is walnut and the 1 is the ceiling wash itself (#4486B2), unlifted.
    dark_ink = (edited.replace(f'fill="{IVORY}"', f'fill="{FLOOR}"').replace(f"fill={IVORY}", f"fill={FLOOR}")
                .replace(f'fill="{TEAL}"', 'fill="#4486B2"'))
    (BRAND / "wordmark-dark-ink.svg").write_text(dark_ink, encoding="utf-8")
    return edited, dark_ink


def render(page, svg_text, path, w, h):
    html = (f'<html><body style="margin:0;background:transparent">'
            f'<div style="width:{w}px;height:{h}px">{svg_text}</div>'
            f'<style>svg{{width:{w}px;height:{h}px;display:block}}</style></body></html>')
    page.set_viewport_size({"width": w, "height": h})
    page.set_content(html)
    page.screenshot(path=str(path), omit_background=True, clip={"x": 0, "y": 0, "width": w, "height": h})
    print(f"{path.relative_to(ROOT)}  {w}x{h}")


def main():
    wm, wm_dark = wordmark_variants()
    icon = (BRAND / "icon.svg").read_text(encoding="utf-8")
    jobs = [
        (foot(True, False), "fp-left-solid.png", 480, 1160),
        (foot(False, True), "fp-right-outline.png", 480, 1160),
        (foot(True, True), "fp-right-solid.png", 480, 1160),
        (foot(False, False), "fp-left-outline.png", 480, 1160),
        (cell(False), "cell.png", 480, 240),
        (cell(True), "cell-empty.png", 480, 240),
        (pad_border(), "pad-border.png", 1800, 1800),
        (parquet(), "parquet.png", 600, 600),
        (arrow(), "arrow.png", 240, 240),
        (icon, "icon-512.png", 512, 512),
        (icon, "icon-180.png", 180, 180),
        (favicon_dot(), "favicon-16.png", 16, 16),
        (favicon_dot(), "favicon-32.png", 32, 32),
        (favicon(), "favicon-64.png", 64, 64),
        (wm, "wordmark-ivory.png", 1600, 242),
        (wm_dark, "wordmark-dark-ink.png", 1600, 242),
    ]
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch()
        except Exception:
            browser = p.chromium.launch(channel="msedge")
        page = browser.new_page()
        for text, name, w, h in jobs:
            render(page, text, OUT / name, w, h)
        browser.close()
    (BRAND / "favicon.svg").write_text(favicon_dot(), encoding="utf-8")
    (BRAND / "favicon-grid.svg").write_text(favicon(), encoding="utf-8")


if __name__ == "__main__":
    main()


