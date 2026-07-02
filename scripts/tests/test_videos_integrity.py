#!/usr/bin/env python3
"""Video integrity - every scene referenced by the front page and the Memory
Demos gallery must have its files on disk for all 5 models.

Player path scheme: videos/{model}/{sceneId}/{orbitGroup}/{orbitIndex}/{file}
- input.mp4 + rendered.mp4 for every model
- memory.mp4 for nstm & nstm_hires only

Scenes are parsed straight from js/video-player.js and gallery-renderings.html so
the test tracks whatever the site actually references.

Usage:  python scripts/tests/test_videos_integrity.py
"""
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODELS = ["nstm", "nstm_hires", "token_mem", "full_attn", "lact_nvs"]
MEMORY_MODELS = {"nstm", "nstm_hires"}

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


def scene_files_exist(sid, og, oi):
    missing = []
    for model in MODELS:
        base = os.path.join(REPO, "videos", model, sid, og, oi)
        needed = ["input.mp4", "rendered.mp4"]
        if model in MEMORY_MODELS:
            needed.append("memory.mp4")
        for f in needed:
            if not os.path.isfile(os.path.join(base, f)):
                missing.append(f"{model}/{sid}/{og}/{oi}/{f}")
    return missing


# --- Front page: parse SCENES from video-player.js (id + buildModels(id, og, oi)) ---
vp = read("js/video-player.js")
fp = re.findall(r"buildModels\('([^']+)',\s*'([^']+)',\s*'([^']+)'\)", vp)
check("frontpage_scene_count", len(fp) == 8, f"found {len(fp)}")
for sid, og, oi in fp:
    miss = scene_files_exist(sid, og, oi)
    check(f"fp:{sid}/{og}", not miss, f"missing {miss[:3]}")

# --- Gallery: parse SCENE_IDS from gallery-renderings.html ---
gh = read("gallery-renderings.html")
gal = re.findall(r"id:\s*'([^']+)',\s*label:\s*'[^']*',\s*og:\s*'([^']+)',\s*oi:\s*'([^']+)'", gh)
check("gallery_scene_count", len(gal) == 16, f"found {len(gal)}")
for sid, og, oi in gal:
    miss = scene_files_exist(sid, og, oi)
    check(f"gal:{sid}/{og}", not miss, f"missing {miss[:3]}")

# --- Hygiene: no near_backreveal folders and no combined.mp4 left in videos/ ---
nb = combined = 0
for root, dirs, files in os.walk(os.path.join(REPO, "videos")):
    if os.path.basename(root) == "near_backreveal":
        nb += 1
    combined += sum(1 for f in files if f == "combined.mp4")
check("no_near_backreveal", nb == 0, f"{nb} folders")
check("no_combined_mp4", combined == 0, f"{combined} files")

print(f"\nSUMMARY: {_passed} passed, {_failed} failed")
sys.exit(1 if _failed else 0)
