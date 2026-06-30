#!/usr/bin/env python3
"""Phase 1 tests - de-anonymization of all served surfaces.

Runs `bash build.sh`, then asserts no anonymous/WACV branding remains and that
real authors, affiliations, the arXiv button, and the Nerfies credit are present.

Usage:  python scripts/tests/test_phase1_deanon.py
Exit code is non-zero if any check fails.
"""
import os
import re
import subprocess
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
GALLERIES = [
    "gallery.html", "gallery-nvs.html", "gallery-ablations.html",
    "gallery-comparisons.html", "gallery-natural-memory.html", "gallery-renderings.html",
]
BRANDING = ["anonymous", "wacv", "paper #707"]
SURNAMES = ["Elmieh", "Tsai", "Li", "Kaza", "Sun", "Csapo",
            "Behrouz", "Deng", "Lombardi", "Seitz", "Luo"]

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


def found_branding(text):
    low = text.lower()
    return [b for b in BRANDING if b in low]


# 0. Build must succeed (Phase 1 changed title/links/footer).
build = subprocess.run(["bash", "build.sh"], cwd=REPO,
                       capture_output=True, text=True)
check("build_ok", build.returncode == 0, build.stderr.strip()[:200])

index = read("index.html")

# 1. No branding in index.html
hits = found_branding(index)
check("no_anon_index", not hits, f"found {hits}")

# 2. No branding in any gallery page
for g in GALLERIES:
    hits = found_branding(read(g))
    check(f"no_anon_{g}", not hits, f"found {hits}")

# 3. All authors present
missing = [s for s in SURNAMES if s not in index]
check("authors_present", not missing, f"missing {missing}")

# 4. Both affiliations present
check("affiliations_present",
      "University of Washington" in index and "Google" in index)

# 5. arXiv button present; no leftover PDF button links
check("arxiv_button",
      ">arXiv" in index or "arXiv\n" in index or "arXiv<" in index or "arXiv " in index,
      "no arXiv link label found")
check("no_pdf_buttons",
      'href="resources/main_paper.pdf"' not in index
      and 'href="resources/supplemental_draft.pdf"' not in index,
      "a Paper/Supplemental PDF button link still present")

# 6. Data Gallery button intact
check("data_gallery_button", 'href="gallery.html"' in index)

# 7. Nerfies credit present in footer
check("nerfies_credit", "nerfies.github.io" in index.lower())

# 8. Each gallery footer carries an author credit token
for g in GALLERIES:
    check(f"footer_credit_{g}", "Elmieh" in read(g))

print(f"\nSUMMARY: {_passed} passed, {_failed} failed")
sys.exit(1 if _failed else 0)
