# NSTM Website — Design Guidelines

High-level visual direction for the Neural Space-Time Memory project page.
For paper details, see [`resources/main_paper.pdf`](resources/main_paper.pdf).

---

## 1. Design Philosophy

**"Let the results speak."** The website is a stage for the research — not a design showcase. Every visual decision should serve clarity, comparison, and trust.

| Principle | What it means |
|-----------|---------------|
| **Content-first** | Figures and videos are the primary visual elements. Chrome, decoration, and ornamentation are removed. |
| **Effortless comparison** | A reader should be able to compare models at a glance without clicking. Interactive tools deepen, not gate, understanding. |
| **Academic credibility** | Clean, structured layout signals rigor. Novelty comes from the work itself, not flashy animations. |
| **Offline & portable** | Everything self-contained in a zip — zero external dependencies at runtime. |

---

## 2. Visual Tone

**Clean, airy, and white.** Inspired by the modern academic project page template popularized by [Nerfies](https://nerfies.github.io/) and adopted by [Quark](https://quark-3d.github.io/), [MegaSaM](https://mega-sam.github.io/), and [Generative Image Dynamics](https://generative-dynamics.github.io/).

- **Background**: Pure white. Figures have white backgrounds and should blend seamlessly — no borders, shadows, or card frames around content.
- **Mood**: Calm, spacious, and authoritative. The page should feel like reading a well-typeset paper, not browsing a product landing page.
- **Density**: Low. Prefer vertical scrolling with generous section breaks over cramming content.

---

## 3. Typography

| Role | Direction |
|------|-----------|
| **Headings** | Modern geometric sans-serif (e.g., *Google Sans*, *Inter*, *Outfit*). Bold weight, large size, dark color. |
| **Body text** | Highly readable sans-serif (e.g., *Noto Sans*, *Inter*). Regular weight, ~16–18px, generous line-height (~1.6). |
| **Captions** | Slightly smaller body font, medium gray. Italicized figure labels where appropriate (e.g., _"Fig. 3: …"_). |
| **Code / math** | Monospaced for any inline notation. Keep math minimal on the website — point readers to the paper. |

> All fonts must be bundled locally for offline use.

---

## 4. Color Palette

Keep it restrained. Color should highlight, not decorate.

| Usage | Direction |
|-------|-----------|
| **Page background** | White (`#FFFFFF`) |
| **Primary text** | Near-black (`#363636`) |
| **Secondary text** | Medium gray (`#6B7280`) — captions, descriptions |
| **Accent** | One subtle blue (for active selections, interactive highlights). Consider the teal-blue family to evoke a "technical" feel without being distracting. |
| **Action buttons** | Dark / near-black with white text, rounded pill shape (matches Nerfies convention). |
| **Errors / warnings** | Avoid. This is a static showcase, not an app. |

---

## 5. Layout & Spacing

- **Centered, narrow container**: Content width ~960–1100px. Wider only for full-bleed hero videos.
- **Section rhythm**: Large vertical padding between sections (80–120px). Each section should feel like a "page" within the scroll.
- **Section separation**: Whitespace alone — no horizontal rules, colored bars, or dividers.
- **Responsive**: Single-column reflow on mobile. Figures and videos scale to full width. The 3-column overview graph stacks vertically.

---

## 6. Media Principles

### Video
- **Hero demo**: Full-width, autoplay, loop, muted, no visible controls. This is the first thing a visitor sees — it must immediately convey the core contribution.
- **Result videos**: Autoplay, loop, muted. Minimal controls (appear on hover). No borders or player chrome.
- **Background matching**: Video backgrounds should be white or transparent to blend seamlessly with the page.
- **Synchronization**: When comparing models side-by-side, all videos must be frame-locked to a shared clock. Scrubbing one video scrubs all.

### Figures & Images
- **No frames**: Images sit directly on the white background. No borders, box-shadows, or hover effects.
- **Full-width for key figures**: Important comparison figures (e.g., qualitative results) should span the full content width.
- **Captions below**: Centered, in secondary text color. Match the paper's caption style.

### PDFs
- Embedded using a simple viewer (`<embed>` or `<iframe>`). Sized to fill the content width with a comfortable reading height.

---

## 7. Interactive Components

Keep interactivity purposeful and learnable.

| Component | Guideline |
|-----------|-----------|
| **Example Selector** | Horizontal card carousel. Thumbnail + short description. Active card has a subtle highlight (e.g., border accent or slight scale). |
| **Model Selector** | Clickable regions over a pre-rendered side-by-side video. Selected models get a visible indicator (glow, checkmark, or colored border). Multi-select supported. |
| **Analysis / Comparison** | Single-select shows one model output alongside input. Multi-select triggers a swipe/slider divider. Transitions should be instant — no fancy animations. |
| **Hover states** | Subtle opacity or scale changes. Never jarring. |
| **Navigational links** | Dark pill buttons with icons (paper, supplemental, gallery). Consistent with the academic template convention. |

---

## 8. Content Hierarchy (Top to Bottom)

Follow the standard academic project page flow. Each section should be one self-contained file for modularity.

1. **Title + Submission Info** — bold title, anonymous submission line
2. **Action Links** — paper PDF, supplemental, video gallery
3. **Hero Demo Video** — full-width, autoplay, immediately shows the core result
4. **Abstract** — clean paragraph, centered
5. **Visual Results** — the interactive 3-tier viewer (main attraction)
6. **Overview Graph** — 3-column: camera setup, architecture, scaling teaser
7. **Figures** — full-width images from the paper with captions
8. **Ablation Study** — figures + HTML tables
9. **Supplementary PDF** — embedded viewer
10. **Video Gallery** _(separate page)_ — simple grid of all videos, organized by category

---

## 9. Reference Templates

These sites exemplify the target aesthetic and can be used as design references:

| Site | Why it's relevant |
|------|-------------------|
| [Nerfies](https://nerfies.github.io/) | Gold-standard academic template. Clean Bulma layout, video carousels, comparison sliders. |
| [Quark](https://quark-3d.github.io/) | Strong hero video, similar NVS topic, clean structure. |
| [MegaSaM](https://mega-sam.github.io/) | Compact, effective TL;DR bar pattern, good use of whitespace. |
| [Generative Image Dynamics](https://generative-dynamics.github.io/) | Excellent video-heavy page with seamless integration. |
| [Flash Cache](https://benattal.github.io/flash-cache/) | Good interactive comparison viewer. |
| [Mip-Splatting](https://niujinshuchong.github.io/mip-splatting/) | Effective side-by-side result presentation. |

---

## 10. Anti-Patterns (What to Avoid)

- ❌ Colored or gradient backgrounds
- ❌ Card-style containers with borders and shadows around figures
- ❌ Heavy animations, parallax scrolling, or page transitions
- ❌ Dense multi-column text layouts
- ❌ External CDN dependencies (must work offline)
- ❌ Complex navigation menus — a single scrollable page is sufficient
- ❌ Placeholder images or "lorem ipsum" — every element should carry real content
