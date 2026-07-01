#!/usr/bin/env python3
"""Phase 3 tests - structure & integrity.

Rebuilds index.html, then asserts the final section order, that retired sections
are gone and archived, the viewer was renamed (id kept), and that every local
asset/anchor referenced by the served pages resolves.

Usage:  python scripts/tests/test_phase3_structure.py
"""
import os
import re
import subprocess
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
EXPECTED_ORDER = ["title", "links", "hero-demo", "abstract", "teaser",
                  "visual-results", "results-gallery", "acknowledgements", "bibtex"]
REMOVED_IDS = ["overview-graph", "figures", "ablation", "additional-results",
               "supplementary-pdf", "gallery-links"]
ARCHIVE_FILES = ["overview-graph.html", "figures.html", "ablation.html",
                 "additional-results.html", "supplementary-pdf.html", "gallery-links.html"]
GALLERIES = ["gallery.html", "gallery-nvs.html", "gallery-ablations.html",
             "gallery-comparisons.html", "gallery-natural-memory.html", "gallery-renderings.html"]
REF_RE = re.compile(r'(?:src|href)="([^"]+)"')

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


def local_refs(text):
    out = []
    for ref in REF_RE.findall(text):
        if ref.startswith(("http://", "https://", "//", "mailto:", "data:")):
            continue
        if ref == "#":
            continue
        out.append(ref)
    return out


# 0. Build
build = subprocess.run(["bash", "build.sh"], cwd=REPO, capture_output=True, text=True)
check("build_ok", build.returncode == 0, build.stderr.strip()[:200])

index = read("index.html")

# 1. Section order
positions = [index.find(f'id="{sid}"') for sid in EXPECTED_ORDER]
check("section_order",
      all(p != -1 for p in positions) and positions == sorted(positions),
      f"positions={positions}")

# 2. Removed section ids absent
still = [sid for sid in REMOVED_IDS if f'id="{sid}"' in index]
check("removed_absent", not still, f"still present {still}")

# 3. Archive populated
missing = [f for f in ARCHIVE_FILES
           if not os.path.isfile(os.path.join(REPO, "sections", "_archive", f))]
check("archive_populated", not missing, f"missing {missing}")

# 4. Viewer renamed, id kept
check("viewer_renamed",
      "Memorization Results" in index and 'id="visual-results"' in index)

# 5. Every local asset referenced by index.html exists
bad = []
for ref in local_refs(index):
    path = ref.split("#")[0].split("?")[0]
    if path and not os.path.exists(os.path.join(REPO, path)):
        bad.append(ref)
check("assets_exist", not bad, f"missing {bad}")

# 6. In-page anchors resolve to an element id
anchors = [r[1:] for r in REF_RE.findall(index) if r.startswith("#") and len(r) > 1]
unresolved = [a for a in anchors if f'id="{a}"' not in index]
check("anchors_resolve", not unresolved, f"unresolved {unresolved}")

# 7. Gallery pages' static local assets exist
gbad = []
for g in GALLERIES:
    for ref in local_refs(read(g)):
        path = ref.split("#")[0].split("?")[0]
        if path and not os.path.exists(os.path.join(REPO, path)):
            gbad.append(f"{g}:{ref}")
check("gallery_assets_exist", not gbad, f"missing {gbad}")

print(f"\nSUMMARY: {_passed} passed, {_failed} failed")
sys.exit(1 if _failed else 0)
