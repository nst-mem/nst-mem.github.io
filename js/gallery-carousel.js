/**
 * Gallery Carousel — lightweight, zero-dependency carousel.
 * Uses CSS transform for slide positioning (no scroll-snap).
 * Supports: arrow buttons, dot nav, keyboard, touch swipe, responsive resize.
 * Auto-initializes all elements with class `.gallery-carousel`.
 */
(function () {
  'use strict';

  document.querySelectorAll('.gallery-carousel').forEach(function (carousel) {
    var track = carousel.querySelector('.gallery-carousel-track');
    var slides = carousel.querySelectorAll('.gallery-carousel-slide');
    var prevBtn = carousel.querySelector('.gallery-carousel-nav--prev');
    var nextBtn = carousel.querySelector('.gallery-carousel-nav--next');
    var dots = carousel.querySelectorAll('.gallery-carousel-dot');

    carousel.setAttribute('data-count', slides.length);
    if (slides.length <= 1) return;

    var currentIndex = 0;
    var trackHeight = 0;

    // ──── Height lock ────
    // Measure tallest slide and lock the track height to prevent page jumps.
    function lockHeight() {
      track.style.height = '';
      var maxH = 0;
      slides.forEach(function (s) {
        var h = s.offsetHeight;
        if (h > maxH) maxH = h;
      });
      if (maxH > 0) {
        trackHeight = maxH;
        track.style.height = maxH + 'px';
      }
    }

    // Wait for all images to load before measuring
    var imgs = track.querySelectorAll('img');
    var loaded = 0;
    function onImgReady() {
      loaded++;
      if (loaded >= imgs.length) lockHeight();
    }
    if (imgs.length === 0) {
      lockHeight();
    } else {
      imgs.forEach(function (img) {
        if (img.complete) onImgReady();
        else {
          img.addEventListener('load', onImgReady);
          img.addEventListener('error', onImgReady);
        }
      });
    }
    window.addEventListener('resize', lockHeight);

    // ──── Navigation ────
    function goTo(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      currentIndex = index;
      track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
      updateDots();
    }

    function updateDots() {
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === currentIndex);
      });
    }

    // Arrow clicks
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(currentIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(currentIndex + 1); });

    // Dot clicks
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { goTo(i); });
    });

    // Keyboard
    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(currentIndex - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(currentIndex + 1); }
    });

    // ──── Touch / swipe ────
    var touchStartX = 0;
    var touchStartY = 0;
    var touchDeltaX = 0;
    var isSwiping = false;
    var SWIPE_THRESHOLD = 40;

    carousel.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchDeltaX = 0;
      isSwiping = false;
      // Disable transition during drag for instant feedback
      track.style.transition = 'none';
    }, { passive: true });

    carousel.addEventListener('touchmove', function (e) {
      var dx = e.touches[0].clientX - touchStartX;
      var dy = e.touches[0].clientY - touchStartY;

      // Determine swipe direction on first significant move
      if (!isSwiping && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        isSwiping = Math.abs(dx) > Math.abs(dy); // horizontal wins
      }
      if (!isSwiping) return; // let vertical scroll proceed

      e.preventDefault();
      touchDeltaX = dx;

      // Live drag: offset from current slide position
      var baseOffset = -(currentIndex * 100);
      var dragPercent = (touchDeltaX / carousel.offsetWidth) * 100;
      track.style.transform = 'translateX(' + (baseOffset + dragPercent) + '%)';
    }, { passive: false });

    carousel.addEventListener('touchend', function () {
      // Restore transition
      track.style.transition = '';

      if (Math.abs(touchDeltaX) > SWIPE_THRESHOLD) {
        if (touchDeltaX < 0) goTo(currentIndex + 1); // swipe left → next
        else goTo(currentIndex - 1);                   // swipe right → prev
      } else {
        goTo(currentIndex); // snap back
      }
      touchDeltaX = 0;
      isSwiping = false;
    }, { passive: true });

    // Initialize
    updateDots();
  });
})();
