# TDD — 360 NVS Demos page + gallery restructure

Topic slug: `360_demos`. Branch: `arxiv_public`. Date: 2026-07-14.

## Goal (from user)

The user has better 360° spin videos and wants to (1) drop the old 360 spins from the index
and Demos pages, (2) add a dedicated **360 Demos** gallery page reusing the same interactive
player, (3) surface two of the new 360 scenes on the index player, and (4) restructure the
Results-Gallery cards/captions: rename **Demos → 1-Minute Demos** and add a new **360 Demos** card.

## Established facts (from exploration)

- New 360 source: `imgrid_download/<srcModel>/360_rotation/<sceneId>/360_rotation/orbit_1/{input,rendered,combined,memory}.mp4`.
  `memory.mp4` present only for `memaux_256x256` and `memaux_512x512`. All 5 models have input+rendered.
- Served layout consumed by `js/video-player.js` (`vp()`): `videos/<model>/<sceneId>/<og>/<oi>/<file>`.
- Model dir mapping (source → served):
  | source | served | memory? |
  |---|---|---|
  | memaux_256x256 | nstm | yes |
  | memaux_512x512 | nstm_hires | yes |
  | cut3r | token_mem | no |
  | lvsm | full_attn | no |
  | lact | lact_nvs | no |
- All **7 requested scenes** verified complete across all 5 models (0 files missing).
- `combined.mp4` is not consumed by the player (input/rendered/memory only) → not copied.

## Decisions (baked in)

- **Served orbit-group** for the new spins: `og = "360_rotation"`, `oi = "orbit_1"`.
  So dest = `videos/<served>/<sceneId>/360_rotation/orbit_1/<file>`.
- **Copy** (not reference) the files into `videos/` — that is the deliverable-served location;
  `imgrid_download/` is a dev download dir excluded from the packaged zip.
- New page filename: `360-renderings.html` (standalone, not built from `sections/`).
- 360 Demos card image: reuse `resources/gallery_thumbs/memory_demos.jpg` (per user "for now").

## The 7 scenes for the 360 page (og=360_rotation, oi=orbit_1)

| sceneId | label |
|---|---|
| ft_202307_20230707_00017_01 | Large Pattern 360 |
| ft_202307_20230709_00007_02 | Text 360 |
| ft_202307_20230714_00032_02 | Large Text 360 |
| lg_202307_20230705_00015_02 | Leaf Logo 360 |
| lg_202307_20230716_00018_02 | Plaid 360 |
| lg_202307_20230719_00007_01 | Basketball 360 |
| lg_202307_20230720_00036_02 | Ribbon 360 |

---

## Phase 1 — Data: copy new 360 videos into `videos/`

**Files created:** `scripts/copy_360_videos.sh` (runner) writes the served tree; new files under
`videos/<model>/<sceneId>/360_rotation/orbit_1/`.

Runner loops the 7 scenes × 5 models, copies `input.mp4`+`rendered.mp4` (and `memory.mp4` for the
two memaux→nstm/nstm_hires), creating dest dirs. Idempotent (overwrite ok).

**Test (`scripts/tests/test_360_videos.sh`, CLI pass/fail):** for each of 7 scenes × 5 models,
assert `videos/<served>/<id>/360_rotation/orbit_1/input.mp4` and `rendered.mp4` exist; for
nstm & nstm_hires also assert `memory.mp4`. Print `PASS`/`FAIL` per check and a final
`RESULT: N passed, M failed` line; exit non-zero if any fail.
- Pass criteria: `84/84 files present` (70 input+rendered, 14 memory), exit 0.

## Phase 2 — New page `360-renderings.html`

**File created:** `360-renderings.html` — duplicate of `gallery-renderings.html` with:
- `<title>` and `<h1 class="dg-title">` = **360 Demos**; subtitle = *Showcase clips of 360°
  Novel-View-Synthesis spins.*
- `window.VP_SCENES` = the 7 scenes above, each `{ id, label, og:'360_rotation', oi:'orbit_1' }`.
- Same player markup (example-selector, 5-model strip, analysis-box, playback), favicon, back-link.
- Reuses `js/video-player.js` unchanged.

**Test (manual, documented in verification):** open page, selector lists all 7 labels; default
model loads Input|Rendered; second model → swipe; memory toggle for nstm/nstm_hires; no console
`null` errors.

## Phase 3 — Index player: swap in two new 360 scenes

**File modified:** `js/video-player.js` `DEFAULT_SCENE_DEFS`.
- Remove `Cartoon` (`lg_202307_20230720_00038_01`, NVS) and `360 Spin`
  (`lg_202306_20230629_00015_02`, NVS).
- Append as the **last two slots**: `Text 360` (`ft_202307_20230709_00007_02`) and
  `Basketball 360` (`lg_202307_20230719_00007_01`), both `og:'360_rotation'`.
- Result: 8 scenes (Ladder, Infinity, Ribbon, Leaf Logo, Basketball, Large Pattern, Text 360,
  Basketball 360).

**Test:** index selector shows those 8 labels; Text 360 & Basketball 360 play (depends on Phase 1).

## Phase 4 — Demos page cleanup + rename to "1-Minute Demos"

**File modified:** `gallery-renderings.html`.
- Remove the 4 NVS scenes from `window.VP_SCENES`: `360 Spin`, `Logo 360`, `Cartoon`, `Robe 360`
  (leaving the 12 `reverse` scenes).
- `<title>` and `<h1>` → **1-Minute Demos**; subtitle → *Showcase clips of minute-long memory
  recall.*

## Phase 5 — Results-Gallery cards + captions

**Files modified:** `sections/results-gallery.html`, `index.html` (mirror), `gallery.html`.
- Rename the Demos card: title `Demos` → `1-Minute Demos`; desc
  `Showcase clips of minute-long memory recall and 360° spins.` →
  `Showcase clips of minute-long memory recall.`
- Add a new **360 Demos** card (placed right after 1-Minute Demos), `href="360-renderings.html"`,
  img `resources/gallery_thumbs/memory_demos.jpg`, desc
  `Showcase clips of 360° Novel-View-Synthesis spins.`
- Update the intro blurb reference "Demos showcase long-horizon recall" → "1-Minute Demos …"
  in both `sections/results-gallery.html`/`index.html` and `gallery.html` subtitle.
- Rebuild: `bash build.sh` regenerates `index.html` from sections (also re-sync manually if the
  build classifier is unavailable).

---

## Verification (end-to-end)

1. `bash scripts/tests/test_360_videos.sh` → `RESULT: 84 passed, 0 failed`, exit 0.
2. Open `360-renderings.html`: 7 scenes, player works, memory toggle, swipe compare.
3. Open `index.html`: last two selector chips are Text 360 & Basketball 360 and they play;
   Cartoon/360 Spin gone.
4. Open `gallery-renderings.html`: titled "1-Minute Demos", 12 scenes, no 360 scenes.
5. Open `index.html` + `gallery.html`: Results Gallery shows "1-Minute Demos" + new "360 Demos"
   cards with correct captions; General NVS/others unchanged.
6. Console: no missing-file (404) or null errors on any page.

## Unresolved questions / execution risks

1. **Delete old NVS video files?** Step 1 removes the old 360 spins from the *pages*. The
   underlying files (`videos/*/lg_202306_20230629_00015_02/NVS`, `ft_202310_20231014_00011_01/NVS`,
   `lg_202307_20230720_00038_01/NVS`, `ft_202308_20230824_00002_02/NVS`) can stay on disk (unused)
   or be deleted. Delisting is safe/reversible; deletion is destructive. **Default: delist only,
   leave files.** Confirm if you want them deleted from `videos/`.
2. **orbit-group name** `360_rotation` for the served path — OK, or prefer `NVS`/other?
3. **Copy ~84 files into `videos/`** (duplicating imgrid_download) — confirm that's acceptable vs.
   referencing imgrid_download directly (which likely won't ship in the zip).
4. Index selector labels for the two new slots: exactly `Text 360` and `Basketball 360`?
5. Intro-blurb wording: change "Demos showcase long-horizon recall" to "1-Minute Demos showcase
   long-horizon recall", or reword since there are now two demo cards?
