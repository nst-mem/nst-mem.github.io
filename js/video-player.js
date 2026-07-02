/**
 * Visual Results Viewer — 3-tier interactive video comparison.
 * Zero dependencies. Works offline via file:// protocol.
 *
 * Zone 1: Example Selector (scene carousel)
 * Zone 2: Model Strip (5 synced model videos)
 * Zone 3: Analysis Box
 *   - Single: Input | Rendered | [Memory checkbox] | [Memory]
 *   - Compare: Input | Swipe(A vs B)
 *   + Synced playback controls
 *
 * Layout: JS-computed column widths/heights from video aspect ratios.
 *   Column 1 (input) determines row height; other columns match it.
 */
(function () {
  'use strict';

  /* ════════════════════════════════════════════════════════════
     MANIFEST DATA
     ════════════════════════════════════════════════════════════ */

  var MODELS = ['nstm', 'nstm_hires', 'token_mem', 'full_attn', 'lact_nvs'];
  var MODEL_LABELS = {
    nstm: 'NSTM (Ours)',
    nstm_hires: 'NSTM 512×512',
    token_mem: 'Token-Mem',
    full_attn: 'LVSM',
    lact_nvs: 'LACT-NVS'
  };
  var MEMORY_MODELS = ['nstm', 'nstm_hires'];
  var DEFAULT_MODEL = 'nstm_hires';

  /* Path helper: videos/{model}/{sceneId}/{orbitGroup}/{orbitIndex}/{file} */
  function vp(model, sceneId, orbitGroup, orbitIndex, file) {
    return 'videos/' + model + '/' + sceneId + '/' + orbitGroup + '/' + orbitIndex + '/' + file;
  }

  /* Build model entries for a scene — all 5 models share the same sceneId.
     nstm & nstm_hires include memory; others do not. */
  function buildModels(sceneId, og, oi) {
    var m = {};
    MODELS.forEach(function (model) {
      var entry = { rendered: vp(model, sceneId, og, oi, 'rendered.mp4') };
      if (MEMORY_MODELS.indexOf(model) > -1) {
        entry.memory = vp(model, sceneId, og, oi, 'memory.mp4');
      }
      m[model] = entry;
    });
    return m;
  }

  var SCENES = [
    {
      id: 'ft_202307_20230714_00032_02', label: 'Ladder',
      input: vp('nstm_hires', 'ft_202307_20230714_00032_02', 'reverse', 'orbit_1', 'input.mp4'),
      models: buildModels('ft_202307_20230714_00032_02', 'reverse', 'orbit_1')
    },
    {
      id: 'ft_202307_20230716_00019_02', label: 'Infinity',
      input: vp('nstm_hires', 'ft_202307_20230716_00019_02', 'reverse', 'orbit_1', 'input.mp4'),
      models: buildModels('ft_202307_20230716_00019_02', 'reverse', 'orbit_1')
    },
    {
      id: 'lg_202307_20230720_00036_02', label: 'Ribbon',
      input: vp('nstm_hires', 'lg_202307_20230720_00036_02', 'reverse', 'orbit_1', 'input.mp4'),
      models: buildModels('lg_202307_20230720_00036_02', 'reverse', 'orbit_1')
    },
    {
      id: 'lg_202307_20230705_00015_02', label: 'Leaf Logo',
      input: vp('nstm_hires', 'lg_202307_20230705_00015_02', 'reverse', 'orbit_1', 'input.mp4'),
      models: buildModels('lg_202307_20230705_00015_02', 'reverse', 'orbit_1')
    },
    {
      id: 'lg_202307_20230719_00007_01', label: 'Basketball',
      input: vp('nstm_hires', 'lg_202307_20230719_00007_01', 'reverse', 'orbit_1', 'input.mp4'),
      models: buildModels('lg_202307_20230719_00007_01', 'reverse', 'orbit_1')
    },
    {
      id: 'ft_202307_20230707_00017_01', label: 'Large Pattern',
      input: vp('nstm_hires', 'ft_202307_20230707_00017_01', 'reverse', 'orbit_1', 'input.mp4'),
      models: buildModels('ft_202307_20230707_00017_01', 'reverse', 'orbit_1')
    },
    {
      id: 'lg_202306_20230629_00015_02', label: '360 Spin',
      input: vp('nstm_hires', 'lg_202306_20230629_00015_02', 'NVS', 'orbit_1', 'input.mp4'),
      models: buildModels('lg_202306_20230629_00015_02', 'NVS', 'orbit_1')
    },
    {
      id: 'lg_202307_20230720_00038_01', label: 'Cartoon 360',
      input: vp('nstm_hires', 'lg_202307_20230720_00038_01', 'NVS', 'orbit_1', 'input.mp4'),
      models: buildModels('lg_202307_20230720_00038_01', 'NVS', 'orbit_1')
    }
  ];

  /* ════════════════════════════════════════════════════════════
     STATE
     ════════════════════════════════════════════════════════════ */

  var activeScene = null;
  var selectedModels = [];
  var showMemory = false;
  var syncRAF = null;
  var isPlaying = true;
  var isSeeking = false;
  var allFollowers = [];

  /* ════════════════════════════════════════════════════════════
     DOM REFERENCES
     ════════════════════════════════════════════════════════════ */

  var selectorEl = document.getElementById('example-selector');
  var stripEl = document.getElementById('model-strip');
  var analysisBox = document.getElementById('analysis-box');
  var analysisSingle = document.getElementById('analysis-single');
  var analysisCompare = document.getElementById('analysis-compare');
  var memoryToggle = document.getElementById('memory-toggle');
  var memoryCheckbox = document.getElementById('memory-checkbox');

  var stripVideos = {};
  stripEl.querySelectorAll('.model-strip-item').forEach(function (item) {
    stripVideos[item.dataset.model] = item.querySelector('video');
  });

  // Single-model DOM
  var analysisColInput = document.getElementById('analysis-col-input');
  var analysisColRendered = document.getElementById('analysis-col-rendered');
  var analysisColMemory = document.getElementById('analysis-col-memory');
  var analysisInputVideo = document.getElementById('analysis-input-video');
  var analysisModelVideo = document.getElementById('analysis-model-video');
  var analysisModelLabel = document.getElementById('analysis-model-label');
  var analysisMemoryVideo = document.getElementById('analysis-memory-video');

  // Comparison DOM
  var compareColInput = document.getElementById('compare-col-input');
  var compareContainer = document.getElementById('compare-container');
  var compareInputVideo = document.getElementById('compare-input-video');
  var compareUnder = document.getElementById('compare-video-under');
  var compareOver = document.getElementById('compare-video-over');
  var compareDivider = document.getElementById('compare-divider');
  var compareLabelLeft = document.getElementById('compare-label-left');
  var compareLabelRight = document.getElementById('compare-label-right');

  // Playback controls
  var playbackToggle = document.getElementById('playback-toggle');
  var playbackSeek = document.getElementById('playback-seek');
  var playbackSeekFill = document.getElementById('playback-seek-fill');
  var playbackTime = document.getElementById('playback-time');
  var iconPause = playbackToggle.querySelector('.icon-pause');
  var iconPlay = playbackToggle.querySelector('.icon-play');

  /* ════════════════════════════════════════════════════════════
     CONSTANTS
     ════════════════════════════════════════════════════════════ */

  var GAP = 8; // px between columns

  /* ════════════════════════════════════════════════════════════
     ZONE 1: EXAMPLE SELECTOR
     ════════════════════════════════════════════════════════════ */

  function buildExampleSelector() {
    var html = '';
    SCENES.forEach(function (scene, i) {
      html += '<button class="example-card' + (i === 0 ? ' is-active' : '') +
        '" data-index="' + i + '">' +
        '<span class="example-card-label">' + scene.label + '</span>' +
        '</button>';
    });
    selectorEl.innerHTML = html;
    selectorEl.addEventListener('click', function (e) {
      var card = e.target.closest('.example-card');
      if (!card) return;
      selectScene(parseInt(card.dataset.index, 10));
    });
  }

  function selectScene(index) {
    activeScene = SCENES[index];
    showMemory = false;
    memoryCheckbox.checked = false;
    isPlaying = true;
    updatePlaybackUI();

    selectorEl.querySelectorAll('.example-card').forEach(function (c, i) {
      c.classList.toggle('is-active', i === index);
    });

    loadStripVideos();

    selectedModels = [];
    stripEl.querySelectorAll('.model-strip-item').forEach(function (item) {
      item.classList.remove('is-selected');
    });
    if (activeScene.models[DEFAULT_MODEL]) {
      selectedModels = [DEFAULT_MODEL];
      var di = stripEl.querySelector('[data-model="' + DEFAULT_MODEL + '"]');
      if (di) di.classList.add('is-selected');
    }
    updateAnalysisBox();
  }

  /* ════════════════════════════════════════════════════════════
     ZONE 2: MODEL STRIP
     ════════════════════════════════════════════════════════════ */

  function loadStripVideos() {
    if (!activeScene) return;
    stopSync();
    MODELS.forEach(function (model) {
      var data = activeScene.models[model];
      var item = stripEl.querySelector('[data-model="' + model + '"]');
      if (data && data.rendered) {
        setVideoSrc(stripVideos[model], data.rendered);
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
    waitForVideosReady(getStripVideos(), function () {
      playAll(getStripVideos());
      startSync();
    });
  }

  function getStripVideos() {
    var vids = [];
    MODELS.forEach(function (m) {
      var item = stripEl.querySelector('[data-model="' + m + '"]');
      if (stripVideos[m] && item && item.style.display !== 'none') vids.push(stripVideos[m]);
    });
    return vids;
  }

  function getLeader() {
    var v = getStripVideos();
    return v.length > 0 ? v[0] : null;
  }

  stripEl.addEventListener('click', function (e) {
    var item = e.target.closest('.model-strip-item');
    if (!item) return;
    var model = item.dataset.model;
    var idx = selectedModels.indexOf(model);
    if (idx > -1) {
      selectedModels.splice(idx, 1);
      item.classList.remove('is-selected');
    } else {
      if (selectedModels.length >= 2) {
        var old = selectedModels.shift();
        stripEl.querySelector('[data-model="' + old + '"]').classList.remove('is-selected');
      }
      selectedModels.push(model);
      item.classList.add('is-selected');
    }
    showMemory = false;
    memoryCheckbox.checked = false;
    updateAnalysisBox();
  });

  /* ════════════════════════════════════════════════════════════
     ZONE 3: ANALYSIS BOX
     ════════════════════════════════════════════════════════════ */

  function updateAnalysisBox() {
    if (!activeScene) return;
    analysisSingle.style.display = 'none';
    analysisCompare.style.display = 'none';
    analysisColMemory.style.display = 'none';
    memoryToggle.style.display = 'none';

    if (selectedModels.length === 0) {
      if (activeScene.models[DEFAULT_MODEL]) {
        selectedModels = [DEFAULT_MODEL];
        var di = stripEl.querySelector('[data-model="' + DEFAULT_MODEL + '"]');
        if (di) di.classList.add('is-selected');
      }
    }

    if (selectedModels.length === 1) {
      showSingleModel(selectedModels[0]);
    } else if (selectedModels.length >= 2) {
      showCompare(selectedModels[0], selectedModels[1]);
    }
  }

  function showSingleModel(model) {
    var md = activeScene.models[model];
    analysisSingle.style.display = '';
    analysisModelLabel.textContent = MODEL_LABELS[model] || model;

    setVideoSrc(analysisInputVideo, activeScene.input);
    setVideoSrc(analysisModelVideo, md.rendered);

    var vids = [analysisInputVideo, analysisModelVideo];

    if (MEMORY_MODELS.indexOf(model) > -1 && md.memory) {
      memoryToggle.style.display = '';
      if (showMemory) {
        analysisColMemory.style.display = '';
        setVideoSrc(analysisMemoryVideo, md.memory);
        vids.push(analysisMemoryVideo);
      }
    }

    var leader = getLeader();
    if (leader) {
      waitForVideosReady(vids, function () {
        syncToLeader(leader, vids);
        layoutAnalysisRow();
      });
    }
  }

  function showCompare(modelA, modelB) {
    analysisCompare.style.display = '';

    compareLabelLeft.textContent = MODEL_LABELS[modelA] || modelA;
    compareLabelRight.textContent = MODEL_LABELS[modelB] || modelB;

    setVideoSrc(compareInputVideo, activeScene.input);
    setVideoSrc(compareUnder, activeScene.models[modelB].rendered);
    setVideoSrc(compareOver, activeScene.models[modelA].rendered);
    setComparePosition(50);

    var vids = [compareInputVideo, compareUnder, compareOver];
    var leader = getLeader();
    if (leader) {
      waitForVideosReady(vids, function () {
        syncToLeader(leader, vids);
        layoutAnalysisRow();
      });
    }
  }

  /* ── Layout Analysis Row ──
   *
   * Computes explicit widths and heights for all columns based on:
   *   W = container width (from .analysis-box clientWidth)
   *   AR_in = input video aspect ratio (W/H)
   *   AR_r  = rendered video aspect ratio
   *   AR_m  = memory video aspect ratio (if visible)
   *
   * Single-model (no memory):
   *   W = w1 + G + w2
   *   H = w1 / AR_in
   *   w2 = H × AR_r
   *   ∴ w1 = (W - G) / (1 + AR_r / AR_in)
   *
   * Single-model (with memory):
   *   W = w1 + G + w2 + G + w3
   *   w1 = (W - 2G) / (1 + AR_r/AR_in + AR_m/AR_in)
   *
   * Comparison:
   *   Same as "no memory" but w2 fills rest (compare videos use object-fit:cover)
   */
  function layoutAnalysisRow() {
    var W = analysisBox.clientWidth;
    if (W <= 0) return;

    if (analysisSingle.style.display !== 'none') {
      layoutSingleRow(W);
    } else if (analysisCompare.style.display !== 'none') {
      layoutCompareRow(W);
    }
  }

  function layoutSingleRow(W) {
    var arIn = getAR(analysisInputVideo);
    var arR = getAR(analysisModelVideo);
    if (!arIn || !arR) return;

    var memoryVisible = analysisColMemory.style.display !== 'none';
    var w1, H, w2, w3;

    if (memoryVisible) {
      var arM = getAR(analysisMemoryVideo) || arR; // fallback to rendered AR
      w1 = (W - 2 * GAP) / (1 + arR / arIn + arM / arIn);
      H = w1 / arIn;
      w2 = H * arR;
      w3 = H * arM;
    } else {
      w1 = (W - GAP) / (1 + arR / arIn);
      H = w1 / arIn;
      w2 = H * arR;
    }

    // Apply sizes
    setSize(analysisColInput, w1, H);
    setSize(analysisColRendered, w2, H);

    if (memoryVisible) {
      setSize(analysisColMemory, w3, H);
    }
  }

  function layoutCompareRow(W) {
    var arIn = getAR(compareInputVideo);
    // For compare, the swipe container uses the rendered videos' AR
    var arR = getAR(compareUnder);
    if (!arIn || !arR) return;

    var w1 = (W - GAP) / (1 + arR / arIn);
    var H = w1 / arIn;
    var w2 = H * arR;

    setSize(compareColInput, w1, H);
    setSize(compareContainer, w2, H);
  }

  function getAR(video) {
    if (!video || !video.videoWidth || !video.videoHeight) return null;
    return video.videoWidth / video.videoHeight;
  }

  function setSize(el, w, h) {
    if (!el) return;
    el.style.width = Math.round(w) + 'px';
    el.style.height = Math.round(h) + 'px';
  }

  // Re-layout on resize
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    // Clear explicit sizes so clientWidth is accurate
    clearSizes();
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layoutAnalysisRow, 50);
  });

  function clearSizes() {
    [analysisColInput, analysisColRendered, analysisColMemory,
      compareColInput, compareContainer].forEach(function (el) {
        if (el) { el.style.width = ''; el.style.height = ''; }
      });
  }

  /* ── Memory Toggle ── */

  memoryCheckbox.addEventListener('change', function () {
    showMemory = memoryCheckbox.checked;
    updateAnalysisBox();
  });

  /* ════════════════════════════════════════════════════════════
     SWIPE COMPARISON
     ════════════════════════════════════════════════════════════ */

  var isDragging = false;

  function setComparePosition(pct) {
    pct = Math.max(0, Math.min(100, pct));
    compareOver.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
    compareDivider.style.left = pct + '%';
  }

  compareDivider.addEventListener('pointerdown', function (e) {
    isDragging = true;
    compareDivider.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  document.addEventListener('pointermove', function (e) {
    if (!isDragging) return;
    var rect = compareContainer.getBoundingClientRect();
    setComparePosition(((e.clientX - rect.left) / rect.width) * 100);
  });
  document.addEventListener('pointerup', function () { isDragging = false; });

  /* ════════════════════════════════════════════════════════════
     SYNC ENGINE
     ════════════════════════════════════════════════════════════ */

  function startSync() {
    stopSync();
    var leader = getLeader();
    if (!leader) return;
    allFollowers = getStripVideos().filter(function (v) { return v !== leader; });
    var TH = 0.05;
    function tick() {
      if (leader.readyState >= 2) {
        var t = leader.currentTime;
        for (var i = 0; i < allFollowers.length; i++) {
          var f = allFollowers[i];
          if (f.readyState < 2) continue;
          if (Math.abs(f.currentTime - t) > TH) f.currentTime = t;
          if (!isPlaying && !f.paused) f.pause();
          if (isPlaying && f.paused) f.play().catch(function () { });
        }
      }
      if (!isSeeking && leader.duration) {
        var pct = (leader.currentTime / leader.duration) * 100;
        playbackSeek.value = (leader.currentTime / leader.duration) * 1000;
        playbackSeekFill.style.width = pct + '%';
        playbackTime.textContent = fmt(leader.currentTime) + ' / ' + fmt(leader.duration);
      }
      syncRAF = requestAnimationFrame(tick);
    }
    syncRAF = requestAnimationFrame(tick);
  }

  function stopSync() {
    if (syncRAF) { cancelAnimationFrame(syncRAF); syncRAF = null; }
  }

  function syncToLeader(leader, extras) {
    extras.forEach(function (v) {
      v.currentTime = leader.currentTime;
      if (isPlaying) v.play().catch(function () { });
      else v.pause();
    });
    var merged = allFollowers.slice();
    extras.forEach(function (v) { if (merged.indexOf(v) === -1) merged.push(v); });
    allFollowers = merged;
  }

  /* ════════════════════════════════════════════════════════════
     PLAYBACK CONTROLS
     ════════════════════════════════════════════════════════════ */

  playbackToggle.addEventListener('click', function () {
    isPlaying = !isPlaying;
    updatePlaybackUI();
    getAllVideos().forEach(function (v) {
      if (isPlaying) v.play().catch(function () { });
      else v.pause();
    });
  });

  playbackSeek.addEventListener('input', function () {
    isSeeking = true;
    var leader = getLeader();
    if (!leader || !leader.duration) return;
    var time = (playbackSeek.value / 1000) * leader.duration;
    playbackSeekFill.style.width = (playbackSeek.value / 10) + '%';
    playbackTime.textContent = fmt(time) + ' / ' + fmt(leader.duration);
    getAllVideos().forEach(function (v) { v.currentTime = time; });
  });

  playbackSeek.addEventListener('change', function () { isSeeking = false; });

  function updatePlaybackUI() {
    iconPause.style.display = isPlaying ? '' : 'none';
    iconPlay.style.display = isPlaying ? 'none' : '';
    playbackToggle.title = isPlaying ? 'Pause' : 'Play';
  }

  function getAllVideos() {
    var vids = getStripVideos();
    [analysisInputVideo, analysisModelVideo, analysisMemoryVideo,
      compareInputVideo, compareUnder, compareOver].forEach(function (v) {
      if (v && v.src && vids.indexOf(v) === -1) vids.push(v);
    });
    return vids;
  }

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00';
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  /* ════════════════════════════════════════════════════════════
     UTILITIES
     ════════════════════════════════════════════════════════════ */

  function setVideoSrc(video, src) {
    if (video.querySelector('source')) {
      video.querySelector('source').src = src;
      video.load();
    } else {
      video.src = src;
    }
  }

  function waitForVideosReady(vids, cb) {
    var n = 0, total = vids.length;
    if (!total) { cb(); return; }
    vids.forEach(function (v) {
      function done() { n++; if (n >= total) cb(); }
      if (v.readyState >= 2) done();
      else v.addEventListener('loadeddata', function h() { v.removeEventListener('loadeddata', h); done(); });
    });
  }

  function playAll(vids) {
    vids.forEach(function (v) {
      v.currentTime = 0;
      if (isPlaying) v.play().catch(function () { });
    });
  }

  /* ════════════════════════════════════════════════════════════
     INIT
     ════════════════════════════════════════════════════════════ */

  buildExampleSelector();
  selectScene(0);

})();
