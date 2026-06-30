# Analysis — Public arXiv Release of the NSTM Project Website

> Phase A analysis doc for the `analysis-tdd-journal` workflow. Topic slug: **`arxiv_release`**.
> Approved in plan mode. Next: `plans/tdd_arxiv_release.md` (Phase B) — **after** the open questions below
> are answered. No implementation until the TDD is approved.

## Context

The site at `nst-mem.github.io` was built as an **anonymous WACV 2027 supplement** (Paper #707) to give reviewers
interactive demos. We are repurposing it as the **public project page for the arXiv release** of
*"Online Neural Space Time Memory for Dynamic Novel View Synthesis"* (Baback Elmieh et al., UW × Google).

Two goals: (1) **de-anonymize** every served surface and add real authors/affiliations/credits; (2) **restructure**
into a lean, Google-house-style page (modeled on quark-3d.github.io and ZipMap) with a new order, a TL;DR, a
teaser, a BibTeX block, and an Acknowledgements block — dropping the reviewer-oriented results/ablation sections
(that content lives in the paper + Data Gallery).

## How the site is built (confirmed)

- `build.sh` concatenates `sections/*.html` (the `SECTIONS` array) into `index.html`, wrapping with a baked-in
  `<head>` heredoc and a baked-in `<footer>` heredoc. **Edit sections + build.sh, never index.html.**
- The 6 gallery pages (`gallery.html`, `gallery-nvs.html`, `gallery-ablations.html`, `gallery-comparisons.html`,
  `gallery-natural-memory.html`, `gallery-renderings.html`) are **standalone** — each has its own `<footer>`.
- Tooling on this machine: `ffmpeg`, ImageMagick `magick`, `pdftotext`. `pdftoppm` is **not** installed
  (teaser asset will be user-provided).

## Paper facts (for de-anonymization)

- **Title:** Online Neural Space Time Memory for Dynamic Novel View Synthesis
- **Authors:** Baback Elmieh¹², Lynn Tsai², Zeman Li², Srinivas Kaza², Tiancheng Sun², Gabor Csapo²,
  Ali Behrouz², Yuan Deng², Stephen Lombardi², Steve Seitz¹², Xuan Luo²
- **Affiliations:** ¹University of Washington  ²Google
- Paper Acknowledgements are placeholder "Lorem ipsum" → ships as marked placeholder.
- No BibTeX in PDF → drafted; arXiv `eprint` left as `TODO`.

## Resolved decisions

1. Remove `overview-graph`, `figures`, `ablation`, `additional-results`, and `supplementary-pdf` from the page.
2. Link buttons: single **arXiv** (placeholder href) + **Data Gallery**. Drop local Paper/Supplemental buttons.
3. Drafted placeholders for TL;DR + BibTeX; clearly-marked placeholder Acknowledgements.
4. Author block: real authors + affiliations; **no venue line; no internship footnote (skipped for now)**;
   Nerfies footer credit; author names linked to `#` placeholders. No corresponding-author email.
5. Results Gallery → Quark-style image cards (snapshot per gallery via `ffmpeg` + intro paragraph + captions).
6. Teaser: user-provided Fig 1 asset; section built around a placeholder.
7. Hero: badge callouts + TL;DR rendered underneath as the caption.
8. **Branching:** snapshot current anon state as `wacv_anon_submission`; all work on `arxiv_public`. *(done)*
9. arXiv: placeholder `href="#"` + `eprint = {arXiv:XXXX.XXXXX}` (TODO markers).
10. Acknowledgements: **visible** placeholder text + `TODO` marker.
11. Snapshots: **auto-pick** the first representative video per gallery; mid-clip frame via `ffmpeg`.
12. Removed sections: **move to `sections/_archive/`** (recoverable), drop from `SECTIONS`.
13. `#visual-results` id **kept** (heading-only rename to "Memorization Results").
14. **"Data Gallery" → "Results Gallery"** rebrand; the 5 categories relabeled to the paper's experiments and
    reordered. **Filenames unchanged** (only display labels / `<title>` / card order change). Mapping:
    Memory Persistence Test Renderings → **Memory Demos**; Comparison by Timestep → **Memory Stress Test**;
    Long Sequence Natural Memory → **Memory from Natural Rotations**; Ablation Results → **Ablation Study**;
    General NVS Results → **General NVS**. Order: Memory Demos → Memory Stress Test →
    Memory from Natural Rotations → Ablation Study → General NVS.

## Final page order (8 sections + footer)

1. `title.html` — authors/affiliations/footnote, de-anonymized
2. `links.html` — arXiv + Data Gallery
3. `hero-demo.html` — badge callouts + TL;DR caption
4. `abstract.html` — keep
5. `teaser.html` *(new)* — Fig 1 (user asset) + caption
6. `memorization-results.html` — rename of `visual-results.html` (heading only; keep `#visual-results` id)
7. `results-gallery.html` — rebuild of `gallery-links.html` (image cards)
8. `acknowledgements.html` *(new)* — placeholder
9. `bibtex.html` *(new)* — drafted BibTeX
   + footer (build.sh heredoc): authors + Nerfies credit, no "anonymous"

Deleted from build: `overview-graph`, `figures`, `ablation`, `additional-results`, `supplementary-pdf`.

## Acceptance criteria (become the TDD tests)

- Zero `anonymous`/`WACV`/`#707`/`Paper #707`/`submission` (branding sense) in any served file
  (`index.html`, `gallery-*.html`); scene-ID `707` excluded.
- `index.html` has the 8 sections in order; none of the 5 removed section ids present.
- Authors + both affiliations + internship footnote present in `index.html`.
- arXiv + Data Gallery buttons present; no `main_paper.pdf`/`supplemental_draft.pdf` button links.
- Every local asset referenced by served pages exists; every internal href resolves.
- TL;DR, BibTeX `<pre>`, Acknowledgements block present.
- All 6 gallery footers de-anonymized.

## Do NOT touch

Scene IDs containing `707` (`ft_202307_20230707_…`) in `js/video-player.js`, `gallery-renderings.html`,
`scripts/demo_rendering_names.txt`, `resources/render_tables.py`.

## Open questions — all resolved

1. Venue line → **None**.
2. arXiv → **placeholder** href + `eprint`.
3. Internship footnote → **skipped**; author links → **`#` placeholders**.
4. Acknowledgements → **visible placeholder + TODO**.
5. Results-gallery snapshots → **auto-pick** first representative video per gallery.
6. Removed files → **move to `sections/_archive/`**.
7. `#visual-results` id → **kept** (heading-only rename).
