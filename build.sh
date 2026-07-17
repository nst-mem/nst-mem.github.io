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
  "sections/demos-360.html"
  "sections/method.html"
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

  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){if(w.location.protocol.indexOf('http')!==0)return;w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-PMWQR5VC');</script>
  <!-- End Google Tag Manager -->

  <title>NSTM: Online Neural Space Time Memory for Dynamic Novel View Synthesis</title>
  <meta name="description" content="Neural Space-Time Memory (NSTM) — Real-time novel view synthesis with minute-scale persistent memory. Supplementary materials and interactive results.">

  <!-- Canonical + social preview (Open Graph / Twitter) -->
  <link rel="canonical" href="https://nst-mem.github.io/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Neural Space-Time Memory (NSTM)">
  <meta property="og:url" content="https://nst-mem.github.io/">
  <meta property="og:title" content="NSTM: Online Neural Space Time Memory for Dynamic Novel View Synthesis">
  <meta property="og:description" content="Neural Space-Time Memory (NSTM): real-time, minute-scale novel view synthesis from multi-view video. Interactive results, comparisons, and ablations.">
  <meta property="og:image" content="https://nst-mem.github.io/resources/teaser_nstm_pink_og.jpg">
  <meta property="og:image:alt" content="NSTM teaser: real-time novel view synthesis with minute-scale memory.">
  <meta property="og:video" content="https://nst-mem.github.io/videos/annotated_hero_og.mp4">
  <meta property="og:video:secure_url" content="https://nst-mem.github.io/videos/annotated_hero_og.mp4">
  <meta property="og:video:type" content="video/mp4">
  <meta property="og:video:width" content="1280">
  <meta property="og:video:height" content="720">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="NSTM: Online Neural Space Time Memory for Dynamic Novel View Synthesis">
  <meta name="twitter:description" content="Neural Space-Time Memory (NSTM): real-time, minute-scale novel view synthesis from multi-view video. Interactive results, comparisons, and ablations.">
  <meta name="twitter:image" content="https://nst-mem.github.io/resources/teaser_nstm_pink_og.jpg">

  <!-- Bundled CSS (offline-safe) -->
  <link rel="stylesheet" href="vendor/bulma/bulma.min.css">
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="data-gallery.css">

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="resources/memory_block_64x64.png">

  <!-- Force page to open at top (prevent browser scroll-restoration) -->
  <script>
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.addEventListener('DOMContentLoaded', function () { window.scrollTo(0, 0); });
  </script>

  <!-- Structured data (schema.org ScholarlyArticle) for search engines / Scholar. -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "name": "Online Neural Space Time Memory for Dynamic Novel View Synthesis",
    "alternateName": "NSTM",
    "url": "https://nst-mem.github.io/",
    "sameAs": "https://arxiv.org/abs/2607.15271",
    "identifier": "arXiv:2607.15271",
    "image": "https://nst-mem.github.io/resources/teaser_nstm_pink_og.jpg",
    "description": "Neural Space-Time Memory (NSTM): real-time, minute-scale novel view synthesis from multi-view video. Interactive results, comparisons, and ablations.",
    "datePublished": "2026",
    "inLanguage": "en",
    "publisher": { "@type": "Organization", "name": "arXiv" },
    "author": [
      { "@type": "Person", "name": "Baback Elmieh", "url": "https://scholar.google.com/citations?user=k2pFAJ4AAAAJ&hl=en", "affiliation": [ { "@type": "Organization", "name": "University of Washington" }, { "@type": "Organization", "name": "Google" } ] },
      { "@type": "Person", "name": "Lynn Tsai", "affiliation": { "@type": "Organization", "name": "Google" } },
      { "@type": "Person", "name": "Zeman Li", "url": "https://sites.google.com/usc.edu/zemanli/", "affiliation": { "@type": "Organization", "name": "Google" } },
      { "@type": "Person", "name": "Srinivas Kaza", "url": "https://kaza.io/portfolio", "affiliation": { "@type": "Organization", "name": "Google" } },
      { "@type": "Person", "name": "Tiancheng Sun", "url": "https://www.kevinkingo.com", "affiliation": { "@type": "Organization", "name": "Google" } },
      { "@type": "Person", "name": "Gabor Csapo", "url": "https://gaborcsapo.com/", "affiliation": { "@type": "Organization", "name": "Google" } },
      { "@type": "Person", "name": "Ali Behrouz", "url": "https://abehrouz.github.io/", "affiliation": { "@type": "Organization", "name": "Google" } },
      { "@type": "Person", "name": "Yuan Deng", "url": "https://sites.google.com/view/yuandeng/home", "affiliation": { "@type": "Organization", "name": "Google" } },
      { "@type": "Person", "name": "Stephen Lombardi", "url": "https://stephenlombardi.github.io/", "affiliation": { "@type": "Organization", "name": "Google" } },
      { "@type": "Person", "name": "Steven M. Seitz", "url": "https://homes.cs.washington.edu/~seitz/", "affiliation": { "@type": "Organization", "name": "Google" } },
      { "@type": "Person", "name": "Xuan Luo", "url": "https://roxanneluo.github.io/", "affiliation": { "@type": "Organization", "name": "Google" } }
    ]
  }
  </script>
</head>
<body>
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PMWQR5VC"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->

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
