---
description: Convert a PDF figure to PNG using qlmanage (macOS)
---

> **⚠️ Do NOT use `sips` for PDF→PNG conversion.** `sips` can silently crop PDFs — it doesn't always respect the full media box.

1. Convert using `qlmanage`:
```bash
qlmanage -t -s 2400 -o /tmp/ resources/MY_FIGURE.pdf
```
Output will be at `/tmp/MY_FIGURE.pdf.png`.

2. Copy to `resources/`:
```bash
cp /tmp/MY_FIGURE.pdf.png resources/MY_FIGURE.png
```

3. Verify dimensions match the PDF's aspect ratio:
```bash
sips -g pixelWidth -g pixelHeight resources/MY_FIGURE.png
```
If the dimensions look wrong (cropped or stretched), try increasing the `-s` value or using a different conversion tool.

4. Reference in HTML:
```html
<div class="figure-container">
  <img src="resources/MY_FIGURE.png" alt="Description">
  <p class="caption-text">Caption text.</p>
</div>
```
