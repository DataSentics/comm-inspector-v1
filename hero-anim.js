/* Hero animation (homepage, column 2).
   The photo shrinks into one tile of a grid of conversations, a 2–5% sample is
   highlighted, then every tile lights up (100%) and four flags appear.
   Plays once (~12 s) when the hero is in view, then holds the end state with a
   Replay button. Reduced motion gets the end state straight away. Without JS
   the plain photo stays, because the tiles are only created here. */
(() => {
  const root = document.getElementById('ciAnim');
  if (!root || !root.animate) return;

  const COLS = 7, ROWS = 6, T = 52, G = 7, OX = 10, OY = 106;
  const EASE = 'cubic-bezier(.22,.61,.36,1)';
  const POP = 'cubic-bezier(.34,1.56,.64,1)';
  const PHOTO = { c: 3, r: 2 };
  const SAMPLED = [{ c: 3, r: 2 }, { c: 5, r: 4 }];          // 2 of 42 tiles ≈ 5 %
  // One chip per row (0, 1, 3, 5) so the chips never overlap each other or the photo tile.
  const FLAGS = [
    { c: 0, r: 0, text: 'Buying signal',   color: 'var(--sig-revenue)', side: 'right' },
    { c: 6, r: 1, text: 'Churn risk',      color: 'var(--sig-risk)',    side: 'left'  },
    { c: 1, r: 3, text: 'Compliance flag', color: 'var(--sig-comp)',    side: 'right' },
    { c: 5, r: 5, text: 'Coaching tip',    color: 'var(--sig-life)',    side: 'left'  },
  ];
  // Rough channel mix: mostly calls, then emails and chats, a few bots.
  const MIX = ['call','call','mail','call','chat','call','mail','chat','call','bot','call','chat','mail','call','call','chat'];

  const stage = document.getElementById('ciStage');
  const photo = document.getElementById('ciPhoto');
  const labelA = document.querySelector('#ciLabelA .ci-label__in');
  const labelB = document.querySelector('#ciLabelB .ci-label__in');
  const legend = document.querySelector('#ciLegend .ci-legend__in');
  const count = document.getElementById('ciCount');
  const replayBtn = document.getElementById('ciReplay');

  // Scale the fixed 425×538 stage to the column width (CSS zoom keeps text sharp).
  new ResizeObserver(([e]) => stage.style.setProperty('--s', e.contentRect.width / 425)).observe(root);

  const pos = (c, r) => ({ x: OX + c * (T + G), y: OY + r * (T + G) });
  const key = (c, r) => c + ',' + r;

  // Tiles (the photo tile slot stays empty: the shrunken photo sits there).
  const tiles = {};
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (c === PHOTO.c && r === PHOTO.r) continue;
    const el = document.createElement('div');
    el.className = 'ci-tile';
    const { x, y } = pos(c, r);
    el.style.left = x + 'px'; el.style.top = y + 'px';
    el.innerHTML = `<svg aria-hidden="true"><use href="#ci-i-${MIX[(r * COLS + c * 5) % MIX.length]}"/></svg>`;
    stage.insertBefore(el, photo);
    tiles[key(c, r)] = el;
  }

  // Flag chips.
  const chips = FLAGS.map(f => {
    const { x, y } = pos(f.c, f.r);
    const el = document.createElement('div');
    el.className = 'ci-chip';
    if (f.side === 'left') el.style.right = (425 - (x - 8)) + 'px';
    else el.style.left = (x + T + 8) + 'px';
    el.style.top = (y + T / 2 - 21) + 'px';
    el.innerHTML = `<div class="ci-chip__in"><i class="ci-chip__dot" style="background:${f.color}"></i>${f.text}</div>`;
    stage.appendChild(el);
    return el.firstElementChild;
  });

  const dist = (c, r) => Math.hypot(c - PHOTO.c, r - PHOTO.r);
  const MAXD = Math.hypot(3, 3);

  let anims = [], timers = [], raf = 0;

  function a(el, keyframes, start, dur, easing = EASE) {
    const an = el.animate(keyframes, { delay: start * 1000, duration: dur * 1000, easing, fill: 'forwards' });
    anims.push(an);
    return an;
  }
  function later(fn, s) { timers.push(setTimeout(fn, s * 1000)); }

  function reset() {
    anims.forEach(an => an.cancel()); anims = [];
    timers.forEach(clearTimeout); timers = [];
    cancelAnimationFrame(raf);
    replayBtn.classList.remove('is-on');
    count.textContent = '100';
  }

  function build() {
    const p = pos(PHOTO.c, PHOTO.r);

    // 0–2 s: photo as before. 2–3.5 s: photo shrinks into one tile of many.
    a(photo, [
      { left: '0px', top: '0px', width: '425px', height: '538px', borderRadius: '18px', objectPosition: '50% 50%' },
      { left: p.x + 'px', top: p.y + 'px', width: T + 'px', height: T + 'px', borderRadius: '12px', objectPosition: '62% 18%' },
    ], 2.0, 1.5, 'cubic-bezier(.65,0,.35,1)');

    for (const k in tiles) {
      const [c, r] = k.split(',').map(Number);
      a(tiles[k], [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1)' }], 2.5 + (dist(c, r) / MAXD) * 0.9, 0.5, POP);
    }
    a(legend, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], 3.4, 0.5);

    // 4–6 s: only a sample is reviewed.
    a(labelA, [{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], 4.0, 0.5);
    SAMPLED.forEach((s, i) => {
      const at = 4.3 + i * 0.25;
      if (s.c === PHOTO.c && s.r === PHOTO.r) {
        a(photo, [{ boxShadow: '0 0 0 0 rgba(255,85,57,0)' }, { boxShadow: '0 0 0 4px #FF5539' }], at, 0.4);
      } else {
        a(tiles[key(s.c, s.r)], [
          { background: '#E6EAF1', color: '#A3ACBD', boxShadow: '0 0 0 0 rgba(255,85,57,0)' },
          { background: '#FFE4DF', color: '#FF5539', boxShadow: '0 0 0 4px #FF5539' },
        ], at, 0.4);
      }
    });

    // 6–7.3 s: every conversation lights up, label flips, counter runs to 100.
    a(labelA, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px)' }], 6.0, 0.3);
    a(labelB, [{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], 6.2, 0.4);
    a(photo, [{ boxShadow: '0 0 0 4px #FF5539' }, { boxShadow: '0 0 0 4px #001f63' }], 6.0, 0.4);
    for (const k in tiles) {
      const [c, r] = k.split(',').map(Number);
      const sampled = SAMPLED.some(s => s.c === c && s.r === r);
      a(tiles[k], [
        sampled ? { background: '#FFE4DF', color: '#FF5539', boxShadow: '0 0 0 4px #FF5539' }
                : { background: '#E6EAF1', color: '#A3ACBD', boxShadow: '0 0 0 0 rgba(255,85,57,0)' },
        { background: '#001f63', color: '#ffffff', boxShadow: '0 0 0 0 rgba(255,85,57,0)' },
      ], 6.0 + (dist(c, r) / MAXD) * 0.9, 0.35);
    }
    later(() => {
      const start = performance.now();
      const tick = now => {
        const k = Math.min(1, (now - start) / 1000);
        count.textContent = Math.round(4 + (100 - 4) * (1 - Math.pow(1 - k, 3)));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      count.textContent = '4';
      raf = requestAnimationFrame(tick);
    }, 6.2);

    // 8.4–11 s: the all-lit grid holds ~1 s, then steps back so the four
    // flagged conversations and their chips read cleanly.
    for (const k in tiles) {
      if (FLAGS.some(f => key(f.c, f.r) === k)) continue;
      a(tiles[k], [{ opacity: 1 }, { opacity: .22 }], 8.4, 0.6);
    }
    a(photo, [{ opacity: 1 }, { opacity: .45 }], 8.4, 0.6);
    FLAGS.forEach((f, i) => {
      const at = 8.7 + i * 0.55;
      a(tiles[key(f.c, f.r)], [
        { background: '#001f63', color: '#ffffff', boxShadow: '0 0 0 0 rgba(0,0,0,0)', transform: 'scale(1)' },
        { background: '#ffffff', color: f.color, boxShadow: `0 0 0 3px ${f.color}`, transform: 'scale(1.06)' },
      ], at, 0.4, POP);
      a(chips[i], [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], at + 0.1, 0.45, POP);
    });

    later(() => replayBtn.classList.add('is-on'), 11.6);
  }

  function play() { reset(); build(); }
  function finalFrame() {
    reset(); build(); anims.forEach(an => an.finish());
    timers.forEach(clearTimeout); timers = [];
    count.textContent = '100';
    replayBtn.classList.add('is-on');
  }

  replayBtn.addEventListener('click', play);

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { finalFrame(); replayBtn.classList.remove('is-on'); }
  else new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { io.disconnect(); play(); } }, { threshold: .4 }).observe(root);
})();
