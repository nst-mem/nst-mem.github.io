# Website Update Map — ECCV 2026 → WACV 2027

**Date:** 2026-06-25
**Status:** Mapping complete — awaiting review before any website edits
**Repo:** `nst-mem.github.io` (branch `update-website-latest`)
**Goal:** Update the project website so it reflects the **WACV 2027** version of the paper (post-rejection resubmission with reviewer-feedback edits), instead of the current **ECCV 2026** anonymous-submission content.

---

## 1. Summary

The live site is the **ECCV 2026 anonymous submission** (title "Neural Space-Time Memory", "Anonymous ECCV 2026 Submission — Paper #5217", no authors). The WACV paper differs in: **title**, **venue/branding**, **abstract wording**, **almost every figure**, **both tables**, and **both embedded PDFs**. Galleries/videos are **unchanged** (baselines and scene sets are the same).

This document maps **every website surface → its source-of-truth → current (ECCV) value → target (WACV) value → required action**, plus a per-figure regeneration appendix and a risk list. It is the spec that will drive the actual edit pass (not done yet).

### Decisions (locked during brainstorming)
- **Branding:** stay **anonymous**, rebrand `ECCV 2026 / #5217` → `WACV 2027 / #707`.
- **Figures:** **regenerate** PNGs from the WACV LaTeX/PDF sources (toolchain verified: `pdftoppm`, `pdfcrop`, `pdflatex`/`latexmk`, ImageMagick `convert`, `gs`).
- **Galleries/videos:** **out of scope** (unchanged).
- **Stop point:** deliver this mapping doc, then pause for review.

---

## 2. Website edit model (important)

Per `AGENTS.md`: **do not edit `index.html` directly.** `index.html` is assembled by `build.sh` from `sections/*.html`. After editing section files (or `build.sh`), run `bash build.sh`.

- **`build.sh`** owns the `<title>` (L34), `<meta name=description>` (L35), and the **footer** branding (L69–L70).
- **`sections/*.html`** own the per-section content (title hero, abstract, figures, captions, links).
- **Gallery pages** (`gallery*.html`) are **standalone** HTML (NOT built from `sections/`) — each carries its own `<title>` and branding line and must be edited individually.
- **`resources/`** holds the figure PNGs (rendered from PDFs), the two embedded PDFs, and a dev-reference markdown (`nstm_main_paper.md`).

---

## 3. Master mapping table

### 3A. Branding / venue strings  (anonymous, ECCV 2026 #5217 → WACV 2027 #707)

| # | Location (file:line) | Current value | Target value | Action |
|---|---|---|---|---|
| B1 | `build.sh:34` `<title>` | `Neural Space-Time Memory` | `Online Neural Space-Time Memory` *(see §6 title note)* | Edit `build.sh`, rebuild |
| B2 | `build.sh:35` meta description | "Neural Space-Time Memory (NSTM) — Real-time novel view synthesis…" | Update product line if title changes; venue-neutral text is fine | Edit `build.sh`, rebuild |
| B3 | `build.sh:69` footer | `Anonymous ECCV 2026 Submission — Paper #5217` | `Anonymous WACV 2027 Submission — Paper #707` | Edit `build.sh`, rebuild |
| B4 | `build.sh:70` footer | "…supplementary material for our anonymous submission." | unchanged (still anonymous) | none |
| B5 | `sections/title.html:7` hero `<h1>` | `Neural Space-Time Memory` | new displayed title *(see §6)* | Edit section, rebuild |
| B6 | `sections/title.html:9` subtitle | `Anonymous ECCV 2026 Submission — Paper #5217` | `Anonymous WACV 2027 Submission — Paper #707` | Edit section, rebuild |
| B7 | `gallery.html:6,8` + `:88` | title + `…ECCV 2026 … #5217` | WACV equivalents | Edit standalone file |
| B8 | `gallery-nvs.html:7` + `:30` | title + branding | WACV equivalents | Edit standalone file |
| B9 | `gallery-ablations.html:7` + `:29` | title + branding | WACV equivalents | Edit standalone file |
| B10 | `gallery-comparisons.html:7` + `:30` | title + branding | WACV equivalents | Edit standalone file |
| B11 | `gallery-natural-memory.html:7` + `:29` | title + branding | WACV equivalents | Edit standalone file |
| B12 | `gallery-renderings.html:7` + `:31` | title + branding | WACV equivalents | Edit standalone file |

> Note: `gallery-renderings.html:42,50` contain `707` **inside scene IDs** (`202307`, `00007`) — **not** branding. Leave untouched.

**Recommended:** centralize the venue string so future changes touch one place — but that's an optional refactor, not required.

### 3B. Text surfaces

| # | Location | Current (ECCV) | Target (WACV) | Action |
|---|---|---|---|---|
| T1 | `sections/abstract.html:8–30` | ECCV abstract ("…Recognizing that…", "…Extensive evaluations on unconstrained, dynamic human motion demonstrate…") | WACV `abstract.tex` ("…Given that…", "…using cross-view attention…", "Our method demonstrates real-time, state-of-the-art performance on scenes with dynamic human motion as well as minute-scale online memorization.") | Replace prose to match `overleaf_project/sections/abstract.tex` |
| T2 | `sections/hero-demo.html:7–11` demo caption | logo-on-back memory demo description | still accurate (demo unchanged) | Review only; likely none |
| T3 | `sections/figures.html` captions (Fig.3 L16, Fig.4 L24, Table1 L32) | generic prose ("reflective surfaces and fine-grained textures", "catastrophic forgetting") | align to WACV claims (qualitative: "recalls T-shirt patterns and hair styles; LVSM hallucinates, LaCT-NVS OOD errors, Token-Mem fails to recall back views"; stability: "drift or collapse to stateless prior") | Edit captions (see §5 for WACV caption text) |
| T4 | `sections/overview-graph.html` captions (Arch L21, Training L33, Camera L57, Scaling L69) | custom prose | verify against **new** figures; Architecture caption describes an "NSTM Layer (right)" panel — confirm the v-WACV architecture figure still has that layout | Review + edit if figure layout changed |
| T5 | `sections/ablation.html` captions (L14, L22) | "averaged over 60 timesteps in 390 MVHumanNet eval scenes" | **matches WACV `ablations_exp.tex` exactly** | No text change (image must still be regenerated — see F8) |
| T6 | `sections/visual-results.html` (model strip + analysis text) | 5 labels: NSTM, NSTM 512×512, Token-Mem, LVSM, LACT-NVS; per-scene analysis prose | baselines unchanged ✓; review analysis prose for stale claims | Review only; structurally unchanged |

### 3C. Figures (regenerate from WACV sources — see §4 for recipes)

Source PDFs live in `overleaf_project/sections/figures/`. Targets overwrite files in `nst-mem.github.io/resources/`.

| # | Website PNG (target) | Used in | WACV source PDF | Changed? |
|---|---|---|---|---|
| F1 | `architecture_v2.png` | overview-graph slide 1 | `neural_space_time_memory_architecture.pdf` | Yes — regenerate |
| F2 | `training_regime_v6.png` | overview-graph slide 2 | `training_diagram_v8.pdf` | Yes (v6→v8) — regenerate |
| F3 | `camera_setup.png` | overview-graph | `camera_setup.pdf` | Verify; regenerate to be safe |
| F4 | `teaser_graph.png` | overview-graph (Runtime Scaling) | `teaser_graph.pdf` | Verify; regenerate to be safe |
| F5 | `qualitative_results_v3.png` | figures slide 1 (Fig.3) | `qualitative_results_v8.pdf` | Yes (v3→v8) — regenerate |
| F6 | `stability.png` | figures slide 2 (Fig.4) | `stability_vert_v1.pdf` | Yes (new vertical layout) — regenerate |

> Optional: rename targets to drop stale version suffixes (`_v3`, `_v6`) and update the `<img src>` references. Not required; keeping names avoids touching HTML.

### 3D. Tables (regenerate — no standalone PDF; compile or crop)

| # | Website PNG (target) | Used in | WACV source | Method |
|---|---|---|---|---|
| F7 | `mvhuman_net_experiments.png` | figures slide 3 (Table 1) | `sections/tables/mvhuman_net_experiments_arxiv_v5.tex` | Compile standalone, or crop Table 1 region from `paper.pdf` |
| F8 | `ablations_exp.png` | ablation slide 2 (Table 2) | `sections/tables/ablations_exp.tex` | Compile standalone, or crop from `paper.pdf` |
| F9 | `ablations.png` | ablation slide 1 (Table 2 & Fig.5) | `sections/figures/ablation_v3.pdf` | Regenerate from PDF (this is the qualitative ablation figure) |

> WACV ablation table row names: `LaCT-NVS Baseline`, `LaCT-NVS w/ L₂`, `LaCT-NVS w/ L₂ w/ Mem Caching`, `Ours wo/ L_mem`, `Ours wo/ Mem Caching`, `Ours w/ Mem Caching`. Main table rows: `LVSM`, `LaCT-NVS`, `Token-Mem`, `Ours`, horizons t=4/30/60.

### 3E. PDFs

| # | Target file (referenced by HTML) | Current | Replace with | Source |
|---|---|---|---|---|
| P1 | `resources/main_paper.pdf` (linked `links.html:8`, `index.html:50`) | ECCV main, 19 pp, "Neural Space Time Memory" | WACV main, **16 pp**, "Online Neural Space Time Memory…", anon WACV #707 | `NSTM/paper.pdf` |
| P2 | `resources/supplemental_draft.pdf` (linked `links.html:16`; embedded `supplementary-pdf.html:6`, `index.html:472`) | ECCV supp, 5 pp | WACV supplemental, **4 pp**, anon WACV #707 | `NSTM/nst-mem.github.io/supplemental_draft.pdf` (the renamed `Neural_Space_Time_Memory (3).pdf`, currently at repo root, **unreferenced**) |
| P3 | repo-root `supplemental_draft.pdf` | the WACV supp, but **not referenced anywhere** | — | After P2, **delete** this leftover (or it stays as dead weight) |

### 3F. Dev/reference (not user-facing, but keep consistent)

| # | File | Current | Action |
|---|---|---|---|
| R1 | `resources/nstm_main_paper.md` | **stale** — ECCV anon #5217 content, uses "Full-Attn" instead of "LVSM", old data splits | Regenerate/update from WACV paper. Used by `AGENTS.md` and content-generation agents as the paper source-of-truth; leaving it stale risks future edits reintroducing ECCV content. |

---

## 4. Figure regeneration appendix

General recipe (render PDF → PNG at a DPI that matches the current PNG's pixel width, optional trim):

```bash
# DPI = target_px_width / (source_pt_width / 72)
SRC=overleaf_project/sections/figures
DST=nst-mem.github.io/resources
pdftoppm -png -r <DPI> "$SRC/<source>.pdf" /tmp/out      # -> /tmp/out-1.png
convert /tmp/out-1.png -trim +repage "$DST/<target>.png"  # optional trim of whitespace
```

Per-figure parameters (source page sizes measured; current PNG dimensions measured):

| Target PNG | Current px | Source PDF (pts) | Suggested `-r` (DPI) | Approx output px | Notes |
|---|---|---|---|---|---|
| `architecture_v2.png` | 6046×2418 | 607×227 | **720** | ~6070×2270 | vector-heavy → high DPI for crispness |
| `training_regime_v6.png` | 2400×1198 | 571×223 | **300** | ~2380×930 | new aspect (v8 wider/shorter) |
| `camera_setup.png` | 1818×2400 | 440×581 | **300** | ~1834×2421 | — |
| `teaser_graph.png` | 278×278 | 278×278 | **72** (or 144 for 2×) | 278×278 (or 556×556) | tiny on page; 2× optional |
| `qualitative_results_v3.png` | 1959×1291 | 1960×1291 | **72** | 1960×1291 | PDF embeds raster at 1:1 |
| `stability.png` | 1912×1651 | 1604×1651 | **72** | 1604×1651 | new vertical layout → narrower |
| `ablations.png` | 2956×1335 | 2956×1335 | **72** | 2956×1335 | from `ablation_v3.pdf` |
| `mvhuman_net_experiments.png` | 2849×625 | — (table .tex) | n/a | match width ~2849 | compile standalone or crop `paper.pdf` |
| `ablations_exp.png` | 1920×599 | — (table .tex) | n/a | match width ~1920 | compile standalone or crop `paper.pdf` |

**Table rendering option (standalone compile):** wrap the table `.tex` in a minimal `standalone`/`article` doc that `\input`s the project preamble + color defs (`\definecolor{best}{HTML}{FFC7CE}` etc.), compile with `pdflatex`, `pdfcrop`, then `pdftoppm`. **Crop option:** locate Table 1 / Table 2 pages in `paper.pdf` and crop the region with `pdftoppm -r 300` + `convert -crop`. Crop is faster; standalone compile is cleaner/higher-fidelity.

After regenerating all figures, **rebuild** (`bash build.sh`) only matters if `<img src>` names change; raw PNG overwrites need no rebuild.

---

## 5. WACV target caption text (for §3B edits)

- **Qualitative (Fig.3):** *MVHumanNet++ Qualitative Results. Comparison with LVSM, Token-Mem (CUT3R), and LaCT-NVS after 1 minute of continuous video. NSTM accurately recalls T-shirt patterns and hair styles. LVSM hallucinates unseen regions, LaCT-NVS suffers OOD errors, and Token-Mem fails to recall back views.*
- **Stability (Fig.4):** *Memory Stress Test Over Time. The back view is shown at T=0; for later timestamps only frontal views are given and the model must synthesize the occluded back. NSTM maintains high-fidelity recall while baselines drift or collapse to a stateless prior.*
- **Table 1:** *Memory Stress Test Comparison on MVHumanNet++. Memory-retention quality across 360 scenes and three durations (t=4/30/60), measured at the last timestep. NSTM holds 20+ mPSNR across all durations; LaCT-NVS drops 5.47 dB and Token-Mem 1.56 dB from t=4→t=60; stateless LVSM stays ~flat.*
- **Architecture:** LaTeX caption is minimal ("Neural Space Time Memory"); keep the site's richer prose but **verify panel layout** against the regenerated figure.
- **Training regime:** WACV caption matches the site's "Memory Supervision / Synthesis Supervision" description — keep, verify against new figure.
- **Ablation table (Table 2):** *Ablation study of our model. Metrics averaged over 60 timesteps in 390 MVHumanNet++ eval scenes.* (site already matches)

---

## 6. Risks & open items

1. **Year mismatch (2026 vs 2027).** Both WACV PDFs print **"WACV 2026 Submission #707"** in their headers, but per the team the target is **WACV 2027** (the 2026 string is a known mistake to be fixed on recompile). **The website will say WACV 2027** while the embedded PDFs still say 2026 until recompiled. *Action: team recompiles `paper.pdf`/supplemental with the correct year before final; until then expect a visible mismatch.*
2. **"CONFIDENTIAL REVIEW COPY — DO NOT DISTRIBUTE."** Both WACV PDFs carry this review watermark (plus the anonymized header). Hosting a "do not distribute" review copy on a public GitHub Pages site is self-contradictory. *Precedent:* the ECCV site already used a review copy (with line numbers). *Options:* (a) accept the precedent and ship the review PDFs; (b) compile a clean arxiv-style PDF (`\usepackage[pagenumbers]{wacv}`, no `review`) for the site. **Decision needed.**
3. **Displayed title length.** Full WACV title is "Online Neural Space Time Memory for Dynamic Novel View Synthesis." The site brand is "Neural Space-Time Memory." *Decision needed:* use the full title, a shortened hero title + full title elsewhere, or keep "Neural Space-Time Memory" as the brand. (Map currently assumes "Online Neural Space-Time Memory" for the hero; confirm.)
4. **Supplemental built from v2, main appendix from v3.** `supplemental_wacv.tex` inputs `additional_method_v2` while `main_wacv.tex`'s embedded appendix uses `additional_method_v3`. The standalone 4-page supplemental PDF may therefore lag the main paper's appendix. *Action: team should rebuild the supplemental from v3 for consistency; then re-export to the site.*
5. **360 vs 390 scenes.** The main results table cites **360** scenes; the ablation table cites **390**. This is an in-paper discrepancy (not a website bug) — flagging so the team can reconcile; the website should mirror whatever the final paper says.
6. **Architecture/qualitative caption accuracy.** Site captions are hand-written and may describe ECCV-era figure layouts or make claims ("reflective surfaces") not in the WACV paper. Re-verify each caption against the regenerated figure during the edit pass.

---

## 7. Out of scope (this update)

- `data_gallery/`, `videos/`, and all gallery **video content** (baselines and scene sets unchanged).
- Gallery page **structure/JS** (only their title + branding strings change — §3A).
- Site design system, CSS, fonts, build mechanics.

---

## 8. Suggested execution order (for the later edit pass)

1. **Branding** (§3A) — `build.sh`, `sections/title.html`, 6 gallery pages → `bash build.sh`.
2. **PDFs** (§3E) — copy `paper.pdf`→`resources/main_paper.pdf`; copy WACV supp→`resources/supplemental_draft.pdf`; delete root leftover.
3. **Abstract** (§3B/T1) — replace prose.
4. **Figures** (§3C/§4) — regenerate F1–F6, F9 from PDFs.
5. **Tables** (§3D) — regenerate F7, F8 (compile or crop).
6. **Captions** (§3B/T3–T4) — update to WACV claims; verify vs regenerated figures.
7. **Dev reference** (§3F/R1) — refresh `nstm_main_paper.md`.
8. Resolve the **§6 decisions** (title, watermark, year) — ideally before step 1.
9. Rebuild, open `index.html`, visual-check every section + gallery page.
