/**
 * ambient.js — quiet ambient features for Sarah Blachly's portfolio.
 * Vanilla JS, no dependencies. Entry: `window.SarahAmbient.init(base)`.
 * 1. ROOM TONE — footer toggle for very quiet filtered brown noise.
 * 2. CURATOR'S WHISPER — a fading line of text on every 5th artwork view.
 * 3. RAKED SAND — barely-visible canvas texture following the cursor.
 * 4. MEMORY GARDEN — faint constellation of visitor words + "leave a trace" form.
 * Animated features skip when prefers-reduced-motion is set.
 * Every DOM lookup is guarded; nothing throws on a foreign page.
 */
(function () {
  'use strict';

  var REDUCED =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Safe storage wrappers (private mode can throw).
  var store = {
    get: function (backend, key) {
      try { return window[backend].getItem(key); } catch (e) { return null; }
    },
    set: function (backend, key, value) {
      try { window[backend].setItem(key, value); } catch (e) { /* ignore */ }
    }
  };

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Deterministic hash — garden dots keep stable positions across visits.
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967295;
  }

  /* ---------- 1. ROOM TONE ---------- */
  // Brown noise -> lowpass (~320Hz) -> gain 0.015. Never autoplays: the
  // AudioContext is created only on user click. Preference persists in
  // localStorage ("sarah-ambient-room-tone"); on load it restores the
  // button UI only — sound still waits for a click.
  function initRoomTone() {
    var btn = document.getElementById('room-tone-toggle');
    if (!btn) return;

    var KEY = 'sarah-ambient-room-tone';
    var ctx = null, nodes = null;
    var on = store.get('localStorage', KEY) === '1';

    function paint() {
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.classList.toggle('on', on);
    }

    function start() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();

      // Brown noise: integrate white noise so the lows dominate (room hum).
      var len = Math.floor(ctx.sampleRate * 4);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var data = buf.getChannelData(0);
      var last = 0;
      for (var i = 0; i < len; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        data[i] = last * 3.2;
      }

      var source = ctx.createBufferSource();
      source.buffer = buf;
      source.loop = true;
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      var gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      source.start();
      nodes = { source: source, gain: gain };

      if (ctx.state === 'suspended') ctx.resume();
      var t = ctx.currentTime; // gentle fade-in, no click
      gain.gain.linearRampToValueAtTime(0.015, t + 1.5);
    }

    function stop() {
      if (!ctx || !nodes) return;
      var t = ctx.currentTime, g = nodes.gain.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(0, t + 0.8);
      var old = nodes, oldCtx = ctx;
      setTimeout(function () {
        try { old.source.stop(); } catch (e) { /* already stopped */ }
        oldCtx.close();
      }, 900);
      nodes = null; ctx = null;
    }

    btn.addEventListener('click', function () {
      on = !on;
      store.set('localStorage', KEY, on ? '1' : '0');
      paint();
      if (on) start(); else stop();
    });

    paint();
  }

  /* ---------- 2. CURATOR'S WHISPER ---------- */
  // Counts artwork detail views (base/work/<slug>/) in sessionStorage.
  // Every 5th view: one plain serif line, bottom-center, visible 3s,
  // then fades. No box, no notification chrome — a ghost.
  function initWhisper(base) {
    var re = new RegExp('^' + escapeRegExp(base) + '/work/[^/]+/?$');
    if (!re.test(window.location.pathname)) return;

    var KEY = 'sarah-ambient-work-views';
    var count = parseInt(store.get('sessionStorage', KEY) || '0', 10) || 0;
    count += 1;
    store.set('sessionStorage', KEY, String(count));
    if (count % 5 !== 0) return;

    var el = document.createElement('div');
    el.id = 'curators-whisper';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = 'testing testing 123'; // placeholder — artist replaces
    el.style.cssText = [
      'position:fixed', 'left:50%', 'bottom:8vh', 'transform:translateX(-50%)',
      'z-index:60', 'pointer-events:none',
      'font-family:Georgia,"Times New Roman",serif', 'font-style:italic',
      'font-size:1.05rem', 'color:rgba(226,230,250,0.85)',
      'text-shadow:0 0 18px rgba(160,180,255,0.35)',
      'opacity:0', 'white-space:nowrap'
    ].join(';') + ';';
    if (!REDUCED) el.style.transition = 'opacity 1.2s ease';
    document.body.appendChild(el);

    requestAnimationFrame(function () { // paint first, then fade in
      el.style.opacity = '1';
      setTimeout(function () {
        el.style.opacity = '0';
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, REDUCED ? 0 : 1300);
      }, 3000);
    });
  }

  /* ---------- 3. RAKED SAND ---------- */
  // Fixed full-screen canvas, pointer-events none, z-index 2 (just above
  // the background). Cursor motion leaves a fading trail; clicks make soft
  // ripples — at ~1/10th intensity. Marks smooth over in ~3.6s.
  function initSand() {
    if (REDUCED) return; // animation feature: skipped under reduced motion

    // Reuse the template canvas when present (it carries transition:persist
    // so it survives view-transition navigations); create it otherwise.
    var canvas = document.getElementById('raked-sand');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'raked-sand';
      document.body.appendChild(canvas);
    }
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = [
      'position:fixed', 'inset:0', 'width:100vw', 'height:100vh',
      'z-index:2', 'pointer-events:none'
    ].join(';') + ';';

    var g = canvas.getContext('2d');
    if (!g) return;

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', size);

    var LIFE = 3600, marks = [], lastMove = 0, rafId = 0;

    function draw(now) {
      g.clearRect(0, 0, window.innerWidth, window.innerHeight);
      var alive = false;
      for (var i = marks.length - 1; i >= 0; i--) {
        var m = marks[i], age = now - m.born;
        if (age >= LIFE) { marks.splice(i, 1); continue; }
        alive = true;
        var fade = 1 - age / LIFE;
        fade *= fade; // ease-out: lingers, then gone
        if (m.kind === 'dot') {
          var r = 26 * (0.6 + 0.4 * fade);
          var grad = g.createRadialGradient(m.x, m.y, 0, m.x, m.y, r);
          grad.addColorStop(0, 'rgba(214,220,248,' + (0.032 * fade).toFixed(3) + ')');
          grad.addColorStop(1, 'rgba(214,220,248,0)');
          g.fillStyle = grad;
          g.beginPath(); g.arc(m.x, m.y, r, 0, Math.PI * 2); g.fill();
        } else {
          g.strokeStyle = 'rgba(214,220,248,' + (0.05 * fade).toFixed(3) + ')';
          g.lineWidth = 1;
          g.beginPath();
          g.arc(m.x, m.y, 8 + (age / LIFE) * 46, 0, Math.PI * 2);
          g.stroke();
        }
      }
      rafId = alive ? requestAnimationFrame(draw) : 0;
    }
    function kick() { if (!rafId) rafId = requestAnimationFrame(draw); }

    window.addEventListener('pointermove', function (e) {
      var now = performance.now();
      if (now - lastMove < 60) return; // sparse, gentle trail
      lastMove = now;
      marks.push({ x: e.clientX, y: e.clientY, born: now, kind: 'dot' });
      if (marks.length > 240) marks.shift();
      kick();
    }, { passive: true });

    window.addEventListener('pointerdown', function (e) {
      marks.push({ x: e.clientX, y: e.clientY, born: performance.now(), kind: 'ripple' });
      kick();
    }, { passive: true });
  }

  /* ---------- 4. MEMORY GARDEN ---------- */
  // Faint fixed constellation at the page background from
  // `${base}/traces.json` (array of strings; 404/empty is fine).
  // Also appends a discreet "leave a trace" button to the footer; its
  // inline form POSTs to FormSubmit for Sarah's approval — nothing
  // appears in the garden without her say-so.
  function initGarden(base) {
    var canvas = document.createElement('canvas');
    canvas.id = 'memory-garden';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = [
      'position:fixed', 'inset:0', 'width:100vw', 'height:100vh',
      'z-index:1', 'pointer-events:none'
    ].join(';') + ';';
    document.body.appendChild(canvas);
    var g = canvas.getContext('2d');

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      if (g) g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();

    var dots = [];

    function drawDots(now) {
      if (!g) return;
      g.clearRect(0, 0, window.innerWidth, window.innerHeight);
      var i, j, d;
      g.lineWidth = 1;
      for (i = 0; i < dots.length; i++) { // faint near-neighbour links
        for (j = i + 1; j < dots.length; j++) {
          var dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
          if (dx * dx + dy * dy < 130 * 130) {
            g.strokeStyle = 'rgba(190,200,240,0.028)';
            g.beginPath();
            g.moveTo(dots[i].x, dots[i].y);
            g.lineTo(dots[j].x, dots[j].y);
            g.stroke();
          }
        }
      }
      for (i = 0; i < dots.length; i++) {
        d = dots[i];
        var a = REDUCED ? 0.10
          : 0.05 + 0.07 * (0.5 + 0.5 * Math.sin(d.phase + now * d.speed));
        g.fillStyle = 'rgba(206,212,246,' + a.toFixed(3) + ')';
        g.beginPath(); g.arc(d.x, d.y, 1.4, 0, Math.PI * 2); g.fill();
      }
    }

    window.addEventListener('resize', function () { size(); drawDots(0); });

    fetch(base + '/traces.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('no traces');
        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data) || !g) return;
        var words = data.filter(function (w) {
          return typeof w === 'string' && w.trim().length > 0;
        });
        if (!words.length) return;
        dots = words.slice(0, 400).map(function (w, i) {
          return {
            x: hashStr('x:' + w + ':' + i) * window.innerWidth,
            y: hashStr('y:' + w + ':' + i) * window.innerHeight,
            phase: hashStr('p:' + w) * Math.PI * 2,
            speed: 0.0004 + hashStr('s:' + w) * 0.0008
          };
        });
        if (REDUCED) { drawDots(0); return; } // static dots, no twinkle
        (function tick(now) {
          drawDots(now);
          requestAnimationFrame(tick);
        })(performance.now());
      })
      .catch(function () { /* empty garden — by design, silently */ });

    // --- "leave a trace" footer form ---
    var footer = document.querySelector('#site-footer, footer');
    if (!footer) return;

    var wrap = document.createElement('div');
    wrap.id = 'leave-trace';

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'leave-trace-toggle';
    toggle.textContent = 'leave a trace';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.style.cssText = [
      'background:none', 'border:none', 'padding:0.25rem 0',
      'font:inherit', 'font-size:0.78rem', 'letter-spacing:0.08em',
      'color:rgba(226,230,250,0.45)', 'cursor:pointer',
      'text-decoration:underline', 'text-underline-offset:3px'
    ].join(';') + ';';

    var form = document.createElement('form');
    form.id = 'leave-trace-form';
    form.style.cssText = 'display:none;margin-top:0.5rem;max-width:22rem;';
    form.innerHTML =
      '<label for="leave-trace-input" style="display:block;font-size:0.8rem;' +
      'color:rgba(226,230,250,0.7);margin-bottom:0.35rem;">' +
      'One word, one feeling — it joins a faint constellation of visitor moods.</label>' +
      '<div style="display:flex;gap:0.5rem;">' +
      '<input id="leave-trace-input" type="text" maxlength="24" autocomplete="off" ' +
      'placeholder="a single word…" ' +
      'style="flex:1;min-width:0;background:rgba(20,24,48,0.5);' +
      'border:1px solid rgba(180,190,235,0.25);border-radius:6px;color:#e8ebfa;' +
      'padding:0.4rem 0.6rem;font:inherit;font-size:0.85rem;" />' +
      '<button type="submit" style="background:none;border:1px solid rgba(180,190,235,0.35);' +
      'border-radius:6px;color:rgba(226,230,250,0.8);padding:0.4rem 0.8rem;' +
      'font:inherit;font-size:0.85rem;cursor:pointer;">send</button></div>' +
      '<p style="font-size:0.72rem;color:rgba(226,230,250,0.45);margin:0.4rem 0 0;">' +
      'Sarah approves every trace before it appears.</p>' +
      '<p class="leave-trace-status" role="status" aria-live="polite" ' +
      'style="font-size:0.8rem;color:rgba(226,230,250,0.7);margin:0.4rem 0 0;min-height:1.2em;"></p>';

    var inputEl = form.querySelector('#leave-trace-input');
    var statusEl = form.querySelector('.leave-trace-status');

    toggle.addEventListener('click', function () {
      var open = form.style.display !== 'none';
      form.style.display = open ? 'none' : 'block';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (!open && inputEl) inputEl.focus();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var word = inputEl ? inputEl.value.trim() : '';
      if (!word) { if (statusEl) statusEl.textContent = 'Write a word first.'; return; }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      if (statusEl) statusEl.textContent = 'Sending…';

      fetch('https://formsubmit.co/ajax/s.blachly2023@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: 'Memory garden visitor',
          _subject: 'Memory garden trace — needs your approval',
          message: word
        })
      })
        .then(function (res) {
          if (!res.ok) throw new Error('send failed');
          return res.json().catch(function () { return {}; });
        })
        .then(function () {
          if (statusEl) statusEl.textContent = 'Thank you — Sarah will review it.';
          if (inputEl) inputEl.value = '';
          if (btn) btn.disabled = false;
        })
        .catch(function () {
          if (statusEl) statusEl.textContent = 'Could not send just now — please try again later.';
          if (btn) btn.disabled = false;
        });
    });

    wrap.appendChild(toggle);
    wrap.appendChild(form);
    footer.appendChild(wrap);
  }

  /* ---------- entry point ---------- */
  function init(base) {
    base = (base || '').replace(/\/$/, ''); // tolerate trailing slash
    initRoomTone();
    initSand();
    initGarden(base);
  }

  // Called on every page view, including client-side view-transition
  // navigations (astro:page-load). The Curator's Whisper counts artwork
  // views, so it must run per navigation, not just per full page load.
  function pageView(base) {
    base = (base || '').replace(/\/$/, '');
    initWhisper(base);
  }

  window.SarahAmbient = { init: init, pageView: pageView };
})();
