#!/bin/bash
# build.sh — Assembles index.html from section fragments.
#
# Usage: bash build.sh
#
# This script reads the section placeholder files from sections/ and injects
# them into index.html. Run this after editing any section file.
#
# The assembled index.html is a self-contained static page that works
# when double-clicked (file:// protocol) with zero dependencies.

set -e
cd "$(dirname "$0")"

SECTIONS=(
  "sections/title.html"
  "sections/links.html"
  "sections/hero-demo.html"
  "sections/abstract.html"
  "sections/teaser.html"
  "sections/memorization-results.html"
  "sections/results-gallery.html"
  "sections/acknowledgements.html"
  "sections/bibtex.html"
)

cat > index.html << 'HEAD_EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Online Neural Space Time Memory for Dynamic Novel View Synthesis</title>
  <meta name="description" content="Neural Space-Time Memory (NSTM) — Real-time novel view synthesis with minute-scale persistent memory. Supplementary materials and interactive results.">

  <!-- Bundled CSS (offline-safe) -->
  <link rel="stylesheet" href="vendor/bulma/bulma.min.css">
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="data-gallery.css">

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="resources/favicon.svg">

  <!-- Force page to open at top (prevent browser scroll-restoration) -->
  <script>
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.addEventListener('DOMContentLoaded', function () { window.scrollTo(0, 0); });
  </script>
</head>
<body>

HEAD_EOF

for section in "${SECTIONS[@]}"; do
  if [ -f "$section" ]; then
    echo "  <!-- ===== $(basename "$section" .html) ===== -->" >> index.html
    cat "$section" >> index.html
    echo "" >> index.html
  else
    echo "  <!-- WARNING: $section not found -->" >> index.html
  fi
done

cat >> index.html << 'FOOT_EOF'
  <!-- ===== Footer ===== -->
  <footer class="site-footer">
    <div class="content-width">
      <p>Website template adapted from the <a href="https://nerfies.github.io/">Nerfies</a> project page.</p>
    </div>
  </footer>

  <!-- Scripts (loaded after content for fast rendering) -->
  <script src="js/gallery-carousel.js"></script>
  <script src="js/video-player.js"></script>

</body>
</html>
FOOT_EOF

echo "✓ index.html assembled from ${#SECTIONS[@]} sections."
