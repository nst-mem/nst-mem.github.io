---
name: render-latex-tables
description: How to render LaTeX tables as publication-quality PNG images without a TeX distribution
---

# Render LaTeX Tables as PNG Images

## When to Use
When you need to convert LaTeX table source (`.tex`) into PNG images for web embedding, and no LaTeX distribution (`pdflatex`, `xelatex`, etc.) is installed.

## Approach
Use **matplotlib's `ax.table()` API** to recreate the table programmatically. This avoids needing a TeX installation entirely.

### Script location
`resources/render_tables.py` — renders both the ablation and MVHumanNet experiment tables.

Run with:
```bash
python3 resources/render_tables.py
```

Outputs: `resources/ablations_exp.png`, `resources/mvhuman_net_experiments.png`

## Key Pitfalls

### 1. `visible_edges='open'` kills face colors
**Problem:** Setting `cell.visible_edges = 'open'` to hide cell borders also suppresses `facecolor` rendering in matplotlib ≤3.9. Cells appear white even when `cellColours` is set.

**Fix:** Instead of `visible_edges`, hide borders by setting:
```python
cell.set_edgecolor('white')
cell.set_linewidth(0)
```

### 2. Hardcoded `ax.plot()` rules misalign with the table
**Problem:** Drawing booktabs-style rules (top, midrule, bottom) at hardcoded Y coordinates causes misalignment whenever the table `bbox`, figure size, or cell heights change.

**Fix:** Dynamically compute rule positions from actual cell extents:
```python
table_bbox = table.get_window_extent(fig.canvas.get_renderer())
inv = ax.transAxes.inverted()

# Get header cell position
header_cell = table.get_celld()[(0, 0)]
hbox = header_cell.get_window_extent(fig.canvas.get_renderer())
top_y = inv.transform((0, hbox.y1))[1]
bot_y = inv.transform((0, hbox.y0))[1]
x_left = inv.transform((table_bbox.x0, 0))[0]
x_right = inv.transform((table_bbox.x1, 0))[0]

ax.plot([x_left, x_right], [top_y, top_y], color='black',
        linewidth=1.5, transform=ax.transAxes, clip_on=False)
```

### 3. Method name column truncation
**Problem:** `auto_set_font_size` and default column widths can truncate long method names.

**Fix:** Explicitly set `cell.set_width(0.25)` (or appropriate fraction) for the method column and disable auto font sizing with `table.auto_set_font_size(False)`.

---

## Verification

After running the script, verify the outputs:

### Expected Output Files

| File | Approximate Size | Used By |
|---|---|---|
| `resources/ablations_exp.png` | ~100 KB | `sections/ablation.html` (ablation carousel, slide 1) |
| `resources/mvhuman_net_experiments.png` | ~125 KB | `sections/figures.html` (figures carousel, slide 2) |

### Visual Checks

1. **Open each PNG** and verify:
   - Booktabs-style rules (top, midrule, bottom) align flush with the table edges
   - Color-coded cells (1st/2nd/3rd best) are visible and correctly highlighted
   - Method names in the first column are not truncated
   - Font is readable at the rendered size (~2400px wide)

2. **Check dimensions** match expectations:
   ```bash
   sips -g pixelWidth -g pixelHeight resources/ablations_exp.png resources/mvhuman_net_experiments.png
   ```

3. **Rebuild and preview** the website:
   ```bash
   bash build.sh
   open index.html
   ```
   Navigate to the Figures and Ablation sections to verify the tables render correctly inline.
