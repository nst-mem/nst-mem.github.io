# TDD — Public arXiv Release of the NSTM Project Website

> Phase B plan for topic **`arxiv_release`**. Companion to `plans/analysis_arxiv_release.md`.
> Work happens on branch **`arxiv_public`** (snapshot `wacv_anon_submission` preserves the anon state).
> Three phases, ordered **pure-static → structure/integration → visual/content**. Each phase ends at a hard
> stop: I implement it + its tests, hand you the exact CLI command, and **wait for you to paste test output
> and say `go`** before the next phase.

## Test harness conventions

- Test scripts live in **`scripts/tests/`** (under `scripts/`, so `package_website.sh` already excludes them).
- Each is a **Python 3** script (`python scripts/tests/<name>.py`) that prints one `PASS: <check>` or
  `FAIL: <check> — <reason>` line per check, then a `SUMMARY: X passed, Y failed` line, and **exits non-zero
  if any check failed**. No checkbox criteria — assertions only.
- Tests read the **built `index.html`** and the standalone `gallery-*.html` files (the served surfaces).
- `build.sh` is re-run by the tester (or by you) before assertions that depend on a rebuild.
- Branding scan matches **exact phrases** (`Anonymous`, `WACV`, `Paper #707`, `anonymous submission`), never the
  bare substring `707`, so scene IDs like `ft_202307_20230707_…` are never flagged.

---

## Phase 1 — De-anonymization & content (pure-static) — ✅ DONE (20/20)

**Scope.** Replace all anonymous/WACV branding with real authors/affiliations/credits on every served surface.
No section reordering yet (keeps the diff isolated).

**Files modified**
- `sections/title.html` — remove "Anonymous WACV 2027 Submission — Paper #707"; add author list (names linked
  to `#`) + affiliations (¹University of Washington ²Google). No venue line, no footnote.
- `sections/links.html` — replace Paper + Supplemental buttons with one **arXiv** button (`href="#"` + TODO);
  keep Data Gallery.
- `build.sh` — rewrite the footer heredoc: author credit + "Website template adapted from Nerfies." link;
  remove both "anonymous" lines. (Head `<title>`/meta already brand-clean.)
- `gallery.html`, `gallery-nvs.html`, `gallery-ablations.html`, `gallery-comparisons.html`,
  `gallery-natural-memory.html`, `gallery-renderings.html` — replace each footer's anon line with the same
  de-anonymized footer.
- Rebuild `index.html` via `bash build.sh`.

**Unit tests** — `scripts/tests/test_phase1_deanon.py`
- `no_anon_index`: `index.html` contains zero of {`Anonymous`, `anonymous submission`, `WACV`, `Paper #707`}.
- `no_anon_galleries`: each of the 6 `gallery-*.html` contains zero of the same branding phrases.
- `authors_present`: all 11 surnames present in `index.html`
  (Elmieh, Tsai, Li, Kaza, Sun, Csapo, Behrouz, Deng, Lombardi, Seitz, Luo).
- `affiliations_present`: `index.html` contains both "University of Washington" and "Google".
- `arxiv_button`: `index.html` contains an `arXiv` link button **and** no button-link to
  `resources/main_paper.pdf` or `resources/supplemental_draft.pdf`.
- `data_gallery_button`: `index.html` still links to `gallery.html`.
- `nerfies_credit`: `index.html` footer contains a Nerfies credit string.
- `gallery_footers_credited`: each gallery footer contains an author credit token (e.g. "Elmieh").

**Run:** `python scripts/tests/test_phase1_deanon.py`
**STOP — wait for `go`.**

---

## Phase 2 — "Results Gallery" rename & reorder (static labels)

**Scope.** Rebrand the "Data Gallery" as the **Results Gallery**, relabel the five categories to match the
paper's experiments, and reorder them. **Filenames unchanged** (`gallery-*.html` stay) to avoid breaking links
— only displayed labels, `<title>`s, and card order change. Covers the 5 standalone sub-pages, the landing page
`gallery.html`, and the main-page link button (`links.html`). The main-page Results Gallery *section* cards are
built with these same labels/order in Phase 4.

**Label mapping (old → new) — filename unchanged:**
| File | Old display label | New display label |
|---|---|---|
| (top level) | Data Gallery | **Results Gallery** |
| `gallery-renderings.html` | Memory Persistence Test Renderings | **Memory Demos** |
| `gallery-comparisons.html` | Comparison Results by Timestep | **Memory Stress Test** |
| `gallery-natural-memory.html` | Long Sequence Natural Memory (Results) | **Memory from Natural Rotations** |
| `gallery-ablations.html` | Ablation Results | **Ablation Study** |
| `gallery-nvs.html` | General NVS Results | **General NVS** |

**Display order** (landing cards + Phase 4 section cards):
Memory Demos → Memory Stress Test → Memory from Natural Rotations → Ablation Study → General NVS.

**Files modified**
- `sections/links.html` — button label "Data Gallery" → "Results Gallery" (href unchanged); rebuild `index.html`.
- `gallery.html` — `<title>`, `<h1 class="dg-title">`, intro copy → "Results Gallery"; **reorder** the 5
  `.dg-landing-card`s into the new order; relabel each card title + description.
- The 5 sub-pages — `<title>` + `<h1 class="dg-title">` (+ subtitle) relabeled per the mapping; any back-link
  text "Data Gallery" → "Results Gallery".

**Unit tests** — `scripts/tests/test_phase2_galleries.py`  *(scope: the 6 standalone gallery pages + the
index.html link button; the main-page chip section is still the old one until Phase 3, so full index cleanliness
is asserted in Phase 4)*
- `button_relabeled`: `index.html` link button shows "Results Gallery".
- `no_data_gallery_pages`: "Data Gallery" appears in **none** of the 6 gallery pages.
- `new_labels_present`: each of the 5 new labels appears in `gallery.html`, and each sub-page `<h1>` uses its
  new label.
- `old_labels_absent`: none of the exact old labels
  ("Memory Persistence Test Renderings", "Comparison Results by Timestep",
  "Long Sequence Natural Memory", "Ablation Results", "General NVS Results") appears in any gallery page.
- `landing_order`: in `gallery.html` the 5 new labels appear in the specified order.
- `links_intact`: each landing card still hrefs its correct `gallery-*.html`.

**Run:** `python scripts/tests/test_phase2_galleries.py`
**STOP — wait for `go`.**

---

## Phase 3 — Structure & integrity (build + link/asset checks)

**Scope.** Reorder the page to the final 8-section layout, retire the 4+1 reviewer sections, and rename the
interactive viewer heading. Create the three new sections as **functional stubs** (correct `id` + heading +
placeholder body, no external assets yet) so the build resolves and order is testable. Heavy visual content
lands in Phase 3.

**Files modified / created / moved**
- `sections/_archive/` *(new dir)* — move `overview-graph.html`, `figures.html`, `ablation.html`,
  `additional-results.html`, `supplementary-pdf.html` here (`git mv`).
- `git mv sections/visual-results.html sections/memorization-results.html`; change the visible heading text to
  "Memorization Results" but **keep `id="visual-results"`** (so `js/video-player.js` selectors/anchors hold).
- `sections/teaser.html`, `sections/acknowledgements.html`, `sections/bibtex.html` *(new stubs)*.
- `sections/results-gallery.html` *(new)* — created from the body of `gallery-links.html`; old file removed
  from the build (move to `_archive/` too).
- `build.sh` — set `SECTIONS` to exactly:
  `title, links, hero-demo, abstract, teaser, memorization-results, results-gallery, acknowledgements, bibtex`.
- Rebuild `index.html`.

**Unit tests** — `scripts/tests/test_phase3_structure.py`
- `section_order`: the section `id`s appear in `index.html` in the exact expected order
  (`title, links, hero-demo, abstract, teaser, visual-results, results-gallery, acknowledgements, bibtex`).
- `removed_absent`: `index.html` contains none of the ids
  {`overview-graph`, `figures`, `ablation`, `additional-results`, `supplementary-pdf`, `gallery-links`}.
- `archive_populated`: `sections/_archive/` contains the 5 retired section files + old `gallery-links.html`.
- `viewer_renamed`: `index.html` contains heading text "Memorization Results" and still contains
  `id="visual-results"`.
- `assets_exist`: every `src=`/`href=` pointing at a local file in `index.html` resolves to an existing file
  on disk (data URIs, `#anchors`, and `http(s)` excluded).
- `anchors_resolve`: every in-page `href="#…"` (except the bare `#` placeholders) matches an element `id` in
  the built page.
- `gallery_links_intact`: the 6 gallery pages still load their referenced local assets (existence check).

**Run:** `python scripts/tests/test_phase3_structure.py`
**STOP — wait for `go`.**

---

## Phase 4 — Visual sections & content (most fragile, ships last)

**Scope.** Flesh out the new/edited sections with real content, assets, and styles.

**Files modified / created**
- `sections/hero-demo.html` — add **badge callouts** ("Minute-scale memory", "30 FPS synthesis",
  "O(1) real-time inference") around the video; render the **TL;DR** one-liner underneath as the caption.
- `sections/teaser.html` — `<img src="resources/teaser_nstm_pink.png">` + paper Fig 1 caption.
  **User-provided real Fig 1 asset** (2476×1475 memorization composite) already in `resources/`.
- `sections/results-gallery.html` — section heading **"Results Gallery"**; Quark-style **image cards**: an
  intro paragraph + one card per gallery (snapshot + title + "View result comparison …" caption), using the
  new labels **in order** (Memory Demos, Memory Stress Test, Memory from Natural Rotations, Ablation Study,
  General NVS), each linking to its `gallery-*.html`.
- `resources/gallery_thumbs/*.jpg` *(new)* — one poster frame per gallery, auto-extracted via `ffmpeg`
  (mid-clip frame from the first representative video in each gallery).
- `sections/acknowledgements.html` — visible placeholder text with a clear `TODO` marker.
- `sections/bibtex.html` — drafted `@article`/`@misc` entry in a `<pre class="citation">`,
  `eprint = {arXiv:XXXX.XXXXX}` TODO.
- `styles.css` — add: TL;DR/badge callout styles, `.results-card` grid, `pre.citation`/`.bibtex` block,
  `.acknowledgements` block (reuse `--color-*`, `.section-heading`, `.caption-text`).
- Rebuild `index.html`.

**Unit tests** — `scripts/tests/test_phase4_content.py`
- `tldr_present`: `index.html` hero section contains the TL;DR text and ≥3 badge callout elements.
- `teaser_asset`: `resources/teaser_nstm_pink.png` exists and is referenced by the teaser section.
- `results_heading`: the results-gallery section heading reads "Results Gallery".
- `results_cards`: results-gallery section contains 5 cards, each with an `<img>` whose `src` exists on disk
  and an `href` to the matching `gallery-*.html`.
- `results_order`: the 5 new labels appear in the results-gallery section in the specified order.
- `no_data_gallery_final`: "Data Gallery" appears nowhere in the built `index.html`.
- `thumbs_exist`: 5 files exist under `resources/gallery_thumbs/`.
- `bibtex_block`: `index.html` contains a `<pre class="citation">` with the paper title and an `eprint` field.
- `ack_block`: `index.html` contains an acknowledgements section with the `TODO` marker.
- `styles_added`: `styles.css` defines the new callout / `.results-card` / `pre.citation` / `.acknowledgements`
  rules.
- `rebuild_idempotent`: running `build.sh` twice yields a byte-identical `index.html`.

**Run:** `python scripts/tests/test_phase4_content.py`
Then **manual offline check** (per project testing rule): open `index.html` by double-click — verify section
order, badges, teaser, results cards, BibTeX, Acknowledgements render; no console errors; no network requests.
**STOP — wait for `go`.**

---

## Phase D — Journal (after Phase 3 approved)

Write `plans/journal_arxiv_release.md`: what shipped per phase, the de-anonymization surface closed, the
placeholders still pending real content, and how to resume (drop in real Fig 1, arXiv ID, ack text, author URLs).

---

## Resolved (no longer open)

1. **Placeholders ship intentionally** (arXiv `#`, `eprint XXXX.XXXXX`, author links `#`, placeholder Ack text)
   — confirmed intended "done" state. **Teaser is the real user-provided asset** `resources/teaser_nstm_pink.png`.
2. ffmpeg picks first existing NSTM/"Ours" clip per gallery; fall back to an existing `resources/` still — **OK**.
3. Nerfies credit wording: "Website template adapted from the Nerfies project page." — **OK**.
4. Retired sections → `git mv` to `sections/_archive/` — **OK**.
5. **No commits** — leave all changes uncommitted on `arxiv_public`; **user commits**.

---

## Phase E — Publish / clean-history (after content phases approved)

**Context.** Repo is **private** now (`github.com/nst-mem/nst-mem.github.io`). For the public arXiv release we want
a clean public surface with no anonymous/internal history exposed. (Internal-infra files were already purged from
history via `filter-branch`; this phase is about the *presentation* of the public repo.)

**Scope (executed only on your explicit go, as the final step).**
- Confirm repo visibility before any push; never push while private settings are intended.
- Read-only **secret/identity scan** of the working tree + history (emails, internal hostnames, absolute paths,
  `WACV`/`#707`/`ECCV` leftovers in dev docs).
- Decide **what the public repo contains**: exclude dev-only dirs from the published tree
  (`docs/`, `.agents/`, `plans/`, `arxiv_pdf/`, and optionally `sections/`, `build.sh`, `scripts/`) — or publish
  only the built deliverable.
- **Single-commit publish:** create an orphan branch (or a fresh repo) holding one initial commit of the final
  tree, so none of the 14 anonymous-era commits or author-email metadata are exposed.

**Unit tests** — `scripts/tests/test_phaseE_publish.py`
- `no_branding_tree`: no `Anonymous`/`WACV`/`Paper #707`/`ECCV` in the **published** file set.
- `no_dev_dirs`: the excluded dev-only dirs are absent from the published tree.
- `single_commit`: the publish branch has exactly one commit.
- `no_internal_paths`: scan for known internal hostname/path patterns returns zero hits.

**Run:** `python scripts/tests/test_phaseE_publish.py` — then you do the actual push.
**STOP — wait for `go`.**
