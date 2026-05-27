/* ==========================================================================
   DataGallery — Reusable video gallery component
   Zero dependencies. Works offline via file:// protocol.
   ========================================================================== */

/**
 * Initialize a data gallery on the page.
 *
 * @param {Object} config
 * @param {string}   config.containerId        — id of the DOM element to render into
 * @param {Array}    config.models             — [{id, label, pathPrefix}]
 * @param {Array}    config.scenes             — [{id, file}] or [{id, files: {modelId: filename}}]
 * @param {string}  [config.gridCols]          — CSS class override (e.g. 'dg-grid--cols-6')
 * @param {Function}[config.pathResolver]      — (model, scene) => videoPath
 * @param {Array}   [config.tabs]              — [{id, label, scenes, pathResolver}] for tabbed layouts
 */
var DataGallery = (function () {
  'use strict';

  /* ── Helpers ──────────────────────────────────────────────────────────── */

  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function text(tag, cls, txt) {
    var e = el(tag, cls);
    e.textContent = txt;
    return e;
  }

  /* ── Lazy-load observer ──────────────────────────────────────────────── */

  var observer = null;
  function getLazyObserver() {
    if (observer) return observer;
    if (!('IntersectionObserver' in window)) return null;
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var video = entry.target;
          var src = video.getAttribute('data-src');
          if (src) {
            video.src = src;
            video.removeAttribute('data-src');
            video.load();
          }
          observer.unobserve(video);
        }
      });
    }, { rootMargin: '200px' });
    return observer;
  }

  function createLazyVideo(src) {
    var v = el('video', '', {
      muted: '',
      loop: '',
      playsinline: '',
      preload: 'none'
    });
    v.muted = true;
    var obs = getLazyObserver();
    if (obs) {
      v.setAttribute('data-src', src);
      obs.observe(v);
    } else {
      v.src = src;
    }
    // Play on hover
    v.addEventListener('mouseenter', function () {
      if (v.src && v.src !== window.location.href) v.play().catch(function () {});
    });
    v.addEventListener('mouseleave', function () {
      if (!v.paused) v.pause();
    });
    return v;
  }

  /* ── Lightbox ────────────────────────────────────────────────────────── */

  var lightbox = null;
  var lightboxInner = null;
  var lightboxCaption = null;
  var lightboxItems = [];
  var lightboxIdx = 0;

  function ensureLightbox() {
    if (lightbox) return;
    lightbox = el('div', 'dg-lightbox');
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    lightboxInner = el('div', 'dg-lightbox-inner');

    var closeBtn = el('button', 'dg-lightbox-close');
    closeBtn.innerHTML = '&#10005;';
    closeBtn.addEventListener('click', closeLightbox);

    var prevBtn = el('button', 'dg-lightbox-nav dg-lightbox-nav--prev');
    prevBtn.innerHTML = '&#8249;';
    prevBtn.addEventListener('click', function () { navigateLightbox(-1); });

    var nextBtn = el('button', 'dg-lightbox-nav dg-lightbox-nav--next');
    nextBtn.innerHTML = '&#8250;';
    nextBtn.addEventListener('click', function () { navigateLightbox(1); });

    lightboxCaption = el('div', 'dg-lightbox-caption');

    lightboxInner.appendChild(closeBtn);
    lightboxInner.appendChild(prevBtn);
    lightboxInner.appendChild(nextBtn);
    lightboxInner.appendChild(lightboxCaption);
    lightbox.appendChild(lightboxInner);
    document.body.appendChild(lightbox);

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });
  }

  function openLightbox(items, idx) {
    ensureLightbox();
    lightboxItems = items;
    lightboxIdx = idx;
    showLightboxItem();
    lightbox.classList.add('is-open');
  }

  function closeLightbox() {
    if (!lightbox) return;
    var oldVid = lightboxInner.querySelector('video');
    if (oldVid) { oldVid.pause(); oldVid.src = ''; }
    lightbox.classList.remove('is-open');
  }

  function navigateLightbox(dir) {
    lightboxIdx = (lightboxIdx + dir + lightboxItems.length) % lightboxItems.length;
    showLightboxItem();
  }

  function showLightboxItem() {
    var item = lightboxItems[lightboxIdx];
    var oldVid = lightboxInner.querySelector('video');
    if (oldVid) { oldVid.pause(); oldVid.src = ''; oldVid.remove(); }

    var v = el('video', '', { controls: '', autoplay: '', loop: '', playsinline: '' });
    v.muted = false;
    v.src = item.src;
    lightboxInner.insertBefore(v, lightboxCaption);
    v.play().catch(function () {});

    lightboxCaption.textContent = item.label || '';
  }

  /* ── Filter bar ──────────────────────────────────────────────────────── */

  function createFilterBar(models, container, onFilter) {
    var bar = el('div', 'dg-filter-bar');

    var allBtn = el('button', 'dg-filter-pill is-active');
    allBtn.textContent = 'All Models';
    allBtn.addEventListener('click', function () {
      bar.querySelectorAll('.dg-filter-pill').forEach(function (p) { p.classList.remove('is-active'); });
      allBtn.classList.add('is-active');
      onFilter(null);
    });
    bar.appendChild(allBtn);

    models.forEach(function (m) {
      var pill = el('button', 'dg-filter-pill');
      pill.textContent = m.label;
      pill.setAttribute('data-model', m.id);
      pill.addEventListener('click', function () {
        var wasActive = pill.classList.contains('is-active');
        bar.querySelectorAll('.dg-filter-pill').forEach(function (p) { p.classList.remove('is-active'); });
        if (wasActive) {
          allBtn.classList.add('is-active');
          onFilter(null);
        } else {
          pill.classList.add('is-active');
          onFilter(m.id);
        }
      });
      bar.appendChild(pill);
    });

    container.appendChild(bar);
  }

  /* ── Scene grid ──────────────────────────────────────────────────────── */

  function renderSceneGrid(container, models, scenes, pathResolver, gridColsClass) {
    // Clear existing
    container.innerHTML = '';

    // Collect all lightbox items for navigation
    var allItems = [];

    scenes.forEach(function (scene) {
      var group = el('div', 'dg-scene-group');
      group.setAttribute('data-scene', scene.id);

      var heading = text('h3', 'dg-scene-heading', 'Scene ' + scene.id);
      group.appendChild(heading);

      var grid = el('div', 'dg-grid' + (gridColsClass ? ' ' + gridColsClass : ''));

      models.forEach(function (model) {
        var src = pathResolver(model, scene);
        if (!src) return;

        var card = el('div', 'dg-card');
        card.setAttribute('data-model', model.id);

        var video = createLazyVideo(src);
        card.appendChild(video);

        var label = text('div', 'dg-card-label', model.label);
        card.appendChild(label);

        var itemIdx = allItems.length;
        allItems.push({ src: src, label: model.label + ' — Scene ' + scene.id });

        card.addEventListener('click', function () {
          openLightbox(allItems, itemIdx);
        });

        grid.appendChild(card);
      });

      group.appendChild(grid);
      container.appendChild(group);
    });

    return allItems;
  }

  /* ── Filtering logic ─────────────────────────────────────────────────── */

  function applyFilter(container, modelId) {
    var cards = container.querySelectorAll('.dg-card');
    cards.forEach(function (card) {
      if (!modelId || card.getAttribute('data-model') === modelId) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  /* ── Main init ───────────────────────────────────────────────────────── */

  function init(config) {
    var root = document.getElementById(config.containerId);
    if (!root) return;

    if (config.tabs) {
      // Tabbed layout (comparison page)
      initTabbed(root, config);
    } else {
      // Standard layout
      initStandard(root, config);
    }
  }

  function initStandard(root, config) {
    var gridContainer = el('div', 'dg-grid-container');

    createFilterBar(config.models, root, function (modelId) {
      applyFilter(gridContainer, modelId);
    });

    root.appendChild(gridContainer);

    var resolver = config.pathResolver || function (model, scene) {
      return model.pathPrefix + '/' + scene.file;
    };

    renderSceneGrid(gridContainer, config.models, config.scenes, resolver, config.gridCols);
  }

  function initTabbed(root, config) {
    var tabBar = el('div', 'dg-tab-bar');
    var gridContainer = el('div', 'dg-grid-container');
    var filterContainer = el('div', '');

    root.appendChild(tabBar);
    root.appendChild(filterContainer);
    root.appendChild(gridContainer);

    var currentTab = config.tabs[0];

    function renderTab(tab) {
      currentTab = tab;
      // Update active tab
      tabBar.querySelectorAll('.dg-tab').forEach(function (t) {
        t.classList.toggle('is-active', t.getAttribute('data-tab') === tab.id);
      });

      // Rebuild filter bar
      filterContainer.innerHTML = '';
      var models = tab.models || config.models;
      createFilterBar(models, filterContainer, function (modelId) {
        applyFilter(gridContainer, modelId);
      });

      // Rebuild grid
      var resolver = tab.pathResolver || config.pathResolver;
      renderSceneGrid(gridContainer, models, tab.scenes, resolver, config.gridCols);
    }

    config.tabs.forEach(function (tab) {
      var tabBtn = el('button', 'dg-tab');
      tabBtn.textContent = tab.label;
      tabBtn.setAttribute('data-tab', tab.id);
      tabBtn.addEventListener('click', function () { renderTab(tab); });
      tabBar.appendChild(tabBtn);
    });

    // Activate first tab
    renderTab(config.tabs[0]);
  }

  return { init: init };
})();
