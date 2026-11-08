"""Capture the two source articles for the video's page moves:  py video/capture_pages.py

Each page is screenshotted at 2 device pixels per CSS pixel, so a 2x zoom in the video is still 1:1,
after stripping what is not the article: fixed and sticky bars, embedded players, sidebars. The CSS
positions of the sentences the voice quotes go to tmp/web-rects.json for make_video.py to highlight.
"""
import json

from playwright.sync_api import sync_playwright

PAGES = {
    "plos": ("https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0355860", "broll/web-08-plos-article.png", 2400,
             ["Enhancing dance learning", "32 dancers", "The Back view consistently yielded superior outcomes"]),
    "dojo": ("https://thedancedojo.com/blog/how-salsa-music-is-counted/", "broll/web-09-dance-dojo.png", None,
             ["How Salsa Music Is Counted", "Robin Campbell", "single biggest hurdle new dancers face"]),
}

STRIP = """() => {
  // exact class names only: the body and the article's own wrapper carry "sidebar" in their class lists
  document.querySelectorAll('body iframe, body aside, body .sidebar, body #sidebar, body .widget-area, body #secondary').forEach(e => e.remove());
  for (const e of Array.from(document.querySelectorAll('body *'))) {
    const pos = getComputedStyle(e).position;
    if (pos === 'fixed' || pos === 'sticky') e.remove();
  }
  window.scrollTo(0, 0);
}"""

FIND = """(needles) => {
  const out = {};
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (n.parentElement && ['SCRIPT', 'STYLE'].includes(n.parentElement.tagName)) continue;
    for (const s of needles) {
      const i = n.textContent.indexOf(s);
      if (i < 0 || out[s]) continue;
      const r = document.createRange();
      r.setStart(n, i); r.setEnd(n, Math.min(n.textContent.length, i + s.length));
      const rects = Array.from(r.getClientRects()).map(b => ({x: b.x + scrollX, y: b.y + scrollY, w: b.width, h: b.height}));
      if (rects.length && rects[0].w > 0) out[s] = rects;
    }
  }
  return out;
}"""

rects = {}
with sync_playwright() as p:
    try:
        browser = p.chromium.launch()
    except Exception:
        browser = p.chromium.launch(channel="msedge")
    for name, (url, out, clip_h, needles) in PAGES.items():
        page = browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=2)
        page.goto(url, wait_until="load", timeout=90000)
        page.wait_for_timeout(3000)
        page.evaluate(STRIP)
        page.wait_for_timeout(500)
        rects[name] = page.evaluate(FIND, needles)
        height = page.evaluate("document.documentElement.scrollHeight")
        clip = {"x": 0, "y": 0, "width": 1920, "height": min(clip_h or height, height)}
        page.screenshot(path=out, full_page=True, clip=clip)
        print(name, out, "page height", height, "captured", clip["height"], "CSS px")
        for s, r in rects[name].items():
            print(f"   {s!r}: " + ", ".join(f"({v['x']:.0f},{v['y']:.0f} {v['w']:.0f}x{v['h']:.0f})" for v in r))
        page.close()
    browser.close()
json.dump(rects, open("tmp/web-rects.json", "w"), indent=1)
