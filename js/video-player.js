/**
 * Visual Results Viewer — 3-tier interactive video comparison.
 * Zero dependencies. Works offline via file:// protocol.
 *
 * Multi-instance: each ".vr-player" root on the page becomes an independent
 * player. All DOM lookups are scoped to the root, so several players can
 * coexist on one page (e.g. index has "1-Min Results" and "360° Demos").
 *
 * Scene source per root, in priority order:
 *   1. data-scenes="<key>"  -> window.VP_SCENE_SETS[key]
 *   2. window.VP_SCENES     (single-player pages)
 *   3. DEFAULT_SCENE_DEFS
 *
 * Zone 1: Example Selector (scene carousel)
 * Zone 2: Model Strip (5 synced model videos)
 * Zone 3: Analysis Box
 *   - Single: Input | Rendered | [Memory checkbox] | [Memory]
 *   - Compare: Input | Swipe(A vs B)
 *   + Synced playback controls
 */
(function () {
  'use strict';

  /* ════════════════════════════════════════════════════════════
     SHARED MANIFEST DATA (instance-independent)
     ════════════════════════════════════════════════════════════ */

  var MODELS = ['nstm', 'nstm_hires', 'token_mem', 'full_attn', 'lact_nvs'];
  var MODEL_LABELS = {
    nstm: 'NSTM 256×256',
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

  /* Fallback scene list (the six one-minute reverse scenes). Pages normally
     supply their own via data-scenes / window.VP_SCENE_SETS / window.VP_SCENES. */
  var DEFAULT_SCENE_DEFS = [
    { id: 'ft_202307_20230714_00032_02', label: 'Ladder Graphic', og: 'reverse', oi: 'orbit_1' },
    { id: 'ft_202307_20230716_00019_02', label: 'Infinity Pattern', og: 'reverse', oi: 'orbit_1' },
    { id: 'lg_202307_20230720_00036_02', label: 'Ribbon', og: 'reverse', oi: 'orbit_1' },
    { id: 'lg_202307_20230705_00015_02', label: 'Leaf Logo', og: 'reverse', oi: 'orbit_1' },
    { id: 'lg_202307_20230719_00007_01', label: 'Basketball Jersey', og: 'reverse', oi: 'orbit_1' },
    { id: 'ft_202307_20230707_00017_01', label: 'Large Pattern', og: 'reverse', oi: 'orbit_1' }
  ];

  /* ════════════════════════════════════════════════════════════
     PLAYER INSTANCE
     ════════════════════════════════════════════════════════════ */

  function initPlayer(root, sceneDefs) {
    var SCENES = sceneDefs.map(function (s) {
      return {
        id: s.id,
        label: s.label,
        input: vp('nstm_hires', s.id, s.og, s.oi, 'input.mp4'),
        models: buildModels(s.id, s.og, s.oi)
      };
    });

    /* ── State (per instance) ── */
    var activeScene = null;
    var selectedModels = [];
    var showMemory = false;
    var syncRAF = null;
    var isPlaying = true;
    var isSeeking = false;

    /* ── DOM references (scoped to this root) ── */
    var q = function (sel) { return root.querySelector(sel); };

    var selectorEl = q('#example-selector');
    var stripEl = q('#model-strip');
    var analysisBox = q('#analysis-box');
    var analysisSingle = q('#analysis-single');
    var analysisCompare = q('#analysis-compare');
    var memoryToggle = q('#memory-toggle');
    var memoryCheckbox = q('#memory-checkbox');

    var stripVideos = {};
    stripEl.querySelectorAll('.model-strip-item').forEach(function (item) {
      stripVideos[item.dataset.model] = item.querySelector('video');
    });

    // Single-model DOM
    var analysisColInput = q('#analysis-col-input');
    var analysisColRendered = q('#analysis-col-rendered');
    var analysisColMemory = q('#analysis-col-memory');
    var analysisInputVideo = q('#analysis-input-video');
    var analysisModelVideo = q('#analysis-model-video');
    var analysisModelLabel = q('#analysis-model-label');
    var analysisMemoryVideo = q('#analysis-memory-video');

    // Comparison DOM
    var compareColInput = q('#compare-col-input');
    var compareContainer = q('#compare-container');
    var compareInputVideo = q('#compare-input-video');
    var compareUnder = q('#compare-video-under');
    var compareOver = q('#compare-video-over');
    var compareDivider = q('#compare-divider');
    var compareLabelLeft = q('#compare-label-left');
    var compareLabelRight = q('#compare-label-right');

    // Playback controls
    var playbackToggle = q('#playback-toggle');
    var playbackSeek = q('#playback-seek');
    var playbackSeekFill = q('#playback-seek-fill');
    var playbackTime = q('#playback-time');
    var iconPause = playbackToggle.querySelector('.icon-pause');
    var iconPlay = playbackToggle.querySelector('.icon-play');

    var GAP = 8; // px between columns

    /* ── Zone 1: Example Selector ── */

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

    /* ── Zone 2: Model Strip ── */

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
      // Timing master = the on-screen input video for the current mode
      // (falls back to the first strip thumbnail before analysis is ready).
      if (analysisCompare.style.display !== 'none' && compareInputVideo.readyState >= 2) return compareInputVideo;
      if (analysisSingle.style.display !== 'none' && analysisInputVideo.readyState >= 2) return analysisInputVideo;
      var v = getStripVideos();
      return v.length > 0 ? v[0] : null;
    }

    // The videos that should be rotating for the current interaction state — the
    // whole decoder-budget policy, state-driven (not scroll/visibility driven):
    //   compare mode -> only the 3 comparison videos (strip thumbnails frozen)
    //   single mode  -> the strip thumbnails + input/rendered (+ memory)
    function playingSet() {
      if (analysisCompare.style.display !== 'none') {
        return [compareInputVideo, compareUnder, compareOver];
      }
      var vids = getStripVideos();
      vids.push(analysisInputVideo, analysisModelVideo);
      if (analysisColMemory.style.display !== 'none') vids.push(analysisMemoryVideo);
      return vids;
    }

    function pauseVideos(list) {
      list.forEach(function (v) { if (v && !v.paused) v.pause(); });
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

    /* ── Zone 3: Analysis Box ── */

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

      // Single mode: comparison videos idle; the strip thumbnails rotate again.
      pauseVideos([compareInputVideo, compareUnder, compareOver]);
      if (isPlaying) {
        getStripVideos().forEach(function (v) { if (v.paused) v.play().catch(function () { }); });
      }
      waitForVideosReady(vids, function () {
        // Align the analysis videos to the strip clock so the strip (followers)
        // don't get yanked to a different time.
        var sl = getStripVideos()[0];
        var t0 = sl ? sl.currentTime : 0;
        vids.forEach(function (v) {
          v.currentTime = t0;
          v.playbackRate = 1;
          if (isPlaying) v.play().catch(function () { });
          else v.pause();
        });
        layoutAnalysisRow();
      });
    }

    function showCompare(modelA, modelB) {
      analysisCompare.style.display = '';

      compareLabelLeft.textContent = MODEL_LABELS[modelA] || modelA;
      compareLabelRight.textContent = MODEL_LABELS[modelB] || modelB;

      setVideoSrc(compareInputVideo, activeScene.input);
      setVideoSrc(compareUnder, activeScene.models[modelB].rendered);
      setVideoSrc(compareOver, activeScene.models[modelA].rendered);
      setComparePosition(50);

      // Compare mode: freeze ALL strip thumbnails and the single-view videos so
      // only the three comparison videos hold decoders. Capture the strip clock
      // first so the comparison starts where the thumbnails were.
      var sl = getStripVideos()[0];
      var refT = sl ? sl.currentTime : 0;
      pauseVideos(getStripVideos());
      pauseVideos([analysisInputVideo, analysisModelVideo, analysisMemoryVideo]);

      var vids = [compareInputVideo, compareUnder, compareOver];
      waitForVideosReady(vids, function () {
        vids.forEach(function (v) {
          v.currentTime = refT;
          v.playbackRate = 1;
          if (isPlaying) v.play().catch(function () { });
          else v.pause();
        });
        layoutAnalysisRow();
      });
    }

    /* ── Layout Analysis Row (JS-computed column widths/heights) ── */

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

      setSize(analysisColInput, w1, H);
      setSize(analysisColRendered, w2, H);

      if (memoryVisible) {
        setSize(analysisColMemory, w3, H);
      }
    }

    function layoutCompareRow(W) {
      var arIn = getAR(compareInputVideo);
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

    /* ── Swipe Comparison ── */

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

    /* ── Sync Engine ── */

    var TH_RATE = 0.04;   // > ~1 frame of drift: nudge playbackRate to converge
    var TH_SEEK = 0.35;   // > 350ms drift (stall / loop wrap / seek): resync once

    function startSync() {
      stopSync();
      function tick() {
        var leader = getLeader();
        var play = playingSet();
        // Only drive playback when the leader is part of the active set. During the
        // brief switch into compare mode the fallback leader is a frozen strip
        // thumbnail — skip so the tick doesn't un-freeze it.
        if (leader && leader.readyState >= 2 && play.indexOf(leader) !== -1) {
          var t = leader.currentTime;
          if (isPlaying && leader.paused) leader.play().catch(function () { });
          if (leader.playbackRate !== 1) leader.playbackRate = 1;

          for (var i = 0; i < play.length; i++) {
            var f = play[i];
            if (f === leader || f.readyState < 2) continue;
            if (!isPlaying) {
              if (!f.paused) f.pause();
              if (f.playbackRate !== 1) f.playbackRate = 1;
              continue;
            }
            if (f.paused) f.play().catch(function () { });
            var drift = f.currentTime - t;             // + ahead, - behind
            var adrift = drift < 0 ? -drift : drift;
            if (adrift > TH_SEEK) {
              f.currentTime = t;                        // large drift: one hard resync
              if (f.playbackRate !== 1) f.playbackRate = 1;
            } else if (adrift > TH_RATE) {
              f.playbackRate = drift > 0 ? 0.96 : 1.04; // small drift: glide into sync
            } else if (f.playbackRate !== 1) {
              f.playbackRate = 1;
            }
          }

          if (!isSeeking && leader.duration) {
            var pct = (leader.currentTime / leader.duration) * 100;
            playbackSeek.value = (leader.currentTime / leader.duration) * 1000;
            playbackSeekFill.style.width = pct + '%';
            playbackTime.textContent = fmt(leader.currentTime) + ' / ' + fmt(leader.duration);
          }
        }
        syncRAF = requestAnimationFrame(tick);
      }
      syncRAF = requestAnimationFrame(tick);
    }

    function stopSync() {
      if (syncRAF) { cancelAnimationFrame(syncRAF); syncRAF = null; }
    }

    /* ── Playback Controls ── */

    playbackToggle.addEventListener('click', function () {
      isPlaying = !isPlaying;
      updatePlaybackUI();
      // Play the current interaction set; pause the full set so nothing keeps
      // decoding in the background.
      (isPlaying ? playingSet() : getAllVideos()).forEach(function (v) {
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

    /* ── Utilities ── */

    function setVideoSrc(video, src) {
      // Re-setting the same src re-runs the media load algorithm and resets the
      // video to t=0 (e.g. toggling Memory would restart Input/Rendered). Skip
      // only when this element already has this exact source AND is healthy —
      // an errored or stalled element (readyState < 2) falls through to a fresh
      // load(), keeping the old code's self-healing on every interaction.
      if (video.dataset.vpSrc === src && !video.error && video.readyState >= 2) return;
      video.dataset.vpSrc = src;
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

    /* ── Init this instance ── */
    buildExampleSelector();
    selectScene(0);
  }

  /* ════════════════════════════════════════════════════════════
     BOOT — initialize every .vr-player on the page
     ════════════════════════════════════════════════════════════ */

  function resolveScenes(root) {
    var key = root.getAttribute('data-scenes');
    if (key && window.VP_SCENE_SETS && window.VP_SCENE_SETS[key]) return window.VP_SCENE_SETS[key];
    if (window.VP_SCENES && window.VP_SCENES.length) return window.VP_SCENES;
    return DEFAULT_SCENE_DEFS;
  }

  function boot() {
    var roots = document.querySelectorAll('.vr-player');
    roots.forEach(function (root) {
      initPlayer(root, resolveScenes(root));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
