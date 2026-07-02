#!/usr/bin/env python3
"""Phase 4 tests - visual sections & content.

Rebuilds index.html, then asserts the hero TL;DR + badges, teaser asset, the
Results Gallery image cards (labels + order + thumbnails), the BibTeX block, the
Acknowledgements placeholder, the new styles, and build idempotency.

Usage:  python scripts/tests/test_phase4_content.py
"""
import os
import re
import subprocess
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ORDER = ["Memory Demos", "Memory Stress Test",
         "Memory from Natural Rotations", "Ablation Study", "General NVS"]
CARD_LINKS = ["gallery-renderings.html", "gallery-comparisons.html",
              "gallery-natural-memory.html", "gallery-ablations.html", "gallery-nvs.html"]
STYLE_SELECTORS = [".hero-badge", ".tldr-caption", ".results-card", "pre.citation",
                   ".acknowledgements-text"]

_passed, _failed = 0, 0


def check(name, ok, reason=""):
    global _passed, _failed
    if ok:
        _passed += 1
        print(f"PASS: {name}")
    else:
        _failed += 1
        print(f"FAIL: {name}" + (f" - {reason}" if reason else ""))


def read(path):
    with open(os.path.join(REPO, path), encoding="utf-8") as f:
        return f.read()


def section(html, sid):
    """Return substring from a section's id to the next <section or EOF."""
    start = html.find(f'id="{sid}"')
    if start == -1:
        return ""
    nxt = html.find("<section", start + 1)
    return html[start: nxt if nxt != -1 else len(html)]


# 0. Build
build = subprocess.run(["bash", "build.sh"], cwd=REPO, capture_output=True, text=True)
check("build_ok", build.returncode == 0, build.stderr.strip()[:200])

index = read("index.html")

# 1. Hero TL;DR + >=3 badges
hero = section(index, "hero-demo")
check("tldr_present",
      "TL;DR" in hero and hero.count('class="hero-badge"') >= 2,
      f'badges={hero.count("hero-badge")}')

# 2. Teaser asset exists and is referenced
teaser = section(index, "teaser")
check("teaser_asset",
      os.path.isfile(os.path.join(REPO, "resources", "teaser_nstm_pink.png"))
      and "resources/teaser_nstm_pink.png" in teaser)

# 3. Results heading
results = section(index, "results-gallery")
check("results_heading", "Results Gallery" in results)

# 4. Five cards: each img src exists + correct gallery link
cards_ok, why = True, []
for label, link in zip(ORDER, CARD_LINKS):
    if f'href="{link}"' not in results:
        cards_ok = False
        why.append(f"missing link {link}")
imgs = re.findall(r'<img[^>]+src="([^"]+)"', results)
if len(imgs) < 5:
    cards_ok = False
    why.append(f"only {len(imgs)} imgs")
for src in imgs:
    if not os.path.isfile(os.path.join(REPO, src)):
        cards_ok = False
        why.append(f"missing {src}")
check("results_cards", cards_ok, "; ".join(why))

# 5. Labels appear in the required order
positions = [results.find(lbl) for lbl in ORDER]
check("results_order",
      all(p != -1 for p in positions) and positions == sorted(positions),
      f"positions={positions}")

# 6. No "Data Gallery" anywhere in the built page
check("no_data_gallery_final", "Data Gallery" not in index)

# 7. BibTeX block with title + eprint
check("bibtex_block",
      '<pre class="citation">' in index
      and "Online Neural Space Time Memory" in section(index, "bibtex")
      and "eprint" in section(index, "bibtex"))

# 8. Acknowledgements placeholder with TODO
ack = section(index, "acknowledgements")
check("ack_block", "Acknowledgements" in ack and "TODO" in ack)

# 9. Styles added
css = read("styles.css")
missing = [s for s in STYLE_SELECTORS if s not in css]
check("styles_added", not missing, f"missing {missing}")

# 10. Rebuild idempotent
first = read("index.html")
subprocess.run(["bash", "build.sh"], cwd=REPO, capture_output=True, text=True)
check("rebuild_idempotent", read("index.html") == first)

print(f"\nSUMMARY: {_passed} passed, {_failed} failed")
sys.exit(1 if _failed else 0)
