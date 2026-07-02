#!/usr/bin/env python3
"""Phase 2 tests - "Results Gallery" rename & reorder.

Scope: the 6 standalone gallery pages + the index.html link button. (The main-page
chip section is still the old one until Phase 3, so full index cleanliness is
asserted in Phase 4.)

Usage:  python scripts/tests/test_phase2_galleries.py
"""
import os
import subprocess
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
LANDING = "gallery.html"
SUBPAGES = {
    "gallery-renderings.html": "Memory Demos",
    "gallery-comparisons.html": "Memory Stress Test",
    "gallery-natural-memory.html": "Memory from Natural Rotations",
    "gallery-ablations.html": "Ablation Study",
    "gallery-nvs.html": "General NVS",
}
GALLERY_FILES = [LANDING] + list(SUBPAGES)
NEW_ORDER = ["Memory Demos", "Memory Stress Test",
             "Memory from Natural Rotations", "Ablation Study", "General NVS"]
OLD_LABELS = [
    "Memory Persistence Test Renderings", "Comparison Results by Timestep",
    "Comparison by Timestep", "Long Sequence Natural Memory",
    "Ablation Results", "General NVS Results", "Data Gallery",
]

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


# 0. Build so index.html reflects the new links.html button label.
build = subprocess.run(["bash", "build.sh"], cwd=REPO, capture_output=True, text=True)
check("build_ok", build.returncode == 0, build.stderr.strip()[:200])

index = read("index.html")

# 1. Link button relabeled in index.html
check("button_relabeled", "Results Gallery" in index)

# 2. No "Data Gallery" anywhere in the gallery pages
for g in GALLERY_FILES:
    check(f"no_data_gallery_{g}", "Data Gallery" not in read(g))

# 3. New labels present: all 5 on the landing page, and each sub-page's own label
landing = read(LANDING)
for label in NEW_ORDER:
    check(f"landing_has_{label}", label in landing)
for page, label in SUBPAGES.items():
    check(f"subpage_label_{page}", label in read(page))

# 4. Old labels absent across every gallery page
for g in GALLERY_FILES:
    text = read(g)
    hits = [lbl for lbl in OLD_LABELS if lbl in text]
    check(f"old_labels_absent_{g}", not hits, f"found {hits}")

# 5. Landing cards appear in the required order
positions = [landing.find(f'results-card-title">{lbl}') for lbl in NEW_ORDER]
check("landing_order",
      all(p != -1 for p in positions) and positions == sorted(positions),
      f"positions={positions}")

# 6. Landing links resolve to each gallery-*.html
for page in SUBPAGES:
    check(f"link_intact_{page}", f'href="{page}"' in landing)

print(f"\nSUMMARY: {_passed} passed, {_failed} failed")
sys.exit(1 if _failed else 0)
