/* The reel's side of the page: the title card, the captions and the end card, drawn over the live site, and
   one function that puts the page in the state a frame calls for. Injected after virtual-time.js.

   The recorder calls __reel.init() once the page has loaded, then __reel.frame(state, ms) for every frame.
   A state says where the page scrolls, where the model's camera is, which surface it wears, which hotspot is
   open, what the hero video's clock reads, and how visible each overlay is. The site is driven through the
   same control API the narrated demo uses (window.PrintApp). */
(() => {
  const CSS = `
  #rl-root { position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; font-family: var(--sans, 'Work Sans', system-ui, sans-serif); color: #ece8dd; }
  #rl-root * { box-sizing: border-box; }
  .rl { position: absolute; inset: 0; opacity: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 28px; }
  .rl-title { background: #0e1019; }
  .rl-end { background: #0e1019; }
  .rl-pattern { position: absolute; inset: 0; opacity: .075; color: #8fa4ea;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64' fill='%238fa4ea'><g id='t'><circle cx='16' cy='11' r='5.2'/><circle cx='11' cy='20' r='5.2'/><circle cx='21' cy='20' r='5.2'/></g><use href='%23t' x='32' y='32'/></svg>"); background-size: 64px 64px; }
  .rl-inner { position: relative; width: 100%; max-width: 400px; margin-top: -4%; }
  .rl-stamps { display: flex; justify-content: center; gap: 12px; margin: 0 0 20px; color: #d96b52; }
  .rl-stamps svg { width: 30px; height: 30px; fill: currentColor; display: block; }
  .rl-eyebrow { font: 600 12px/1.2 var(--sans, sans-serif); letter-spacing: .24em; text-transform: uppercase; color: #d96b52; margin: 0 0 14px; }
  .rl-ochre { color: #dcab55; }
  .rl-h { font: 600 56px/1.0 var(--serif, Georgia, serif); letter-spacing: -.02em; margin: 0 0 16px; color: #ece8dd; }
  .rl-end .rl-h { font-size: 44px; line-height: 1.04; margin-bottom: 18px; }
  .rl-tag { margin-top: 22px; font: italic 600 25px/1.2 var(--serif, Georgia, serif); color: #d96b52; }
  .rl-sub { font: 400 17px/1.45 var(--sans, sans-serif); color: #cfcabc; }
  .rl-pill { display: inline-block; margin: 6px 0 14px; padding: 11px 16px; border-radius: 14px; border: 1.5px solid #8fa4ea; background: rgba(143,164,234,.12); font: 600 14.5px/1.3 var(--sans, sans-serif); color: #ece8dd; overflow-wrap: anywhere; }
  .rl-pill small { display: block; font: 600 10.5px/1 var(--sans, sans-serif); letter-spacing: .2em; text-transform: uppercase; color: #8fa4ea; margin-bottom: 6px; }
  .rl-live { font: 400 13.5px/1.4 var(--sans, sans-serif); color: #aaa79d; overflow-wrap: anywhere; }
  .rl-lic { margin-top: 10px; font: 500 11.5px/1.4 var(--sans, sans-serif); letter-spacing: .08em; color: #7d7b73; }
  #rl-cap { position: absolute; left: 0; right: 0; bottom: 21%; display: flex; justify-content: center; padding: 0 22px; opacity: 0; }
  #rl-cap span { max-width: 100%; padding: 9px 15px 10px; border-radius: 13px; background: rgba(8,9,16,.8); color: #fff; font: 600 20px/1.26 var(--sans, sans-serif); text-align: center; text-wrap: balance; box-shadow: 0 6px 22px rgba(0,0,0,.35); }
  `;
  const TREFOIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7.2" r="5.4"/><circle cx="7.2" cy="15.6" r="5.4"/><circle cx="16.8" cy="15.6" r="5.4"/><circle cx="12" cy="12.6" r="2.4" fill="#0e1019"/></svg>';
  const STAMPS = Array.from({ length: 5 }, () => TREFOIL).join('');
  const HTML = `
    <div class="rl rl-title" id="rl-title"><div class="rl-pattern"></div><div class="rl-inner">
      <div class="rl-stamps" id="rl-title-stamps">${STAMPS}</div>
      <div class="rl-eyebrow" data-p="1">A history of block printing</div>
      <h1 class="rl-h" data-p="2">The Repeating Hand</h1>
      <div class="rl-sub" data-p="3">From the Indus Valley to the world.<br>An open-data history.</div>
    </div></div>
    <div class="rl rl-end" id="rl-end"><div class="rl-pattern"></div><div class="rl-inner">
      <div class="rl-stamps" data-p="0">${STAMPS}</div>
      <div class="rl-eyebrow rl-ochre" data-p="1">The Repeating Hand</div>
      <h2 class="rl-h" data-p="2">Free &amp; open source</h2>
      <div class="rl-pill" data-p="3"><small>On GitHub</small>github.com/fritzhand/history-of-block-printing</div>
      <div class="rl-live" data-p="4">fritzhand.github.io/history-of-block-printing</div>
      <div class="rl-lic" data-p="5">Code CC0 &middot; Data CC BY 4.0</div>
      <div class="rl-tag" data-p="6">Fork it. Reuse it.<br>Tell a different history.</div>
    </div></div>
    <div id="rl-cap"><span></span></div>`;

  let root, titleEl, endEl, capEl, capText = null, lastVariant, lastHotspot, lastOrbit, lastY = null;
  const $ = s => document.querySelector(s);
  const part = (card, i, p) => {
    const el = card.querySelector(`[data-p="${i}"]`); if (!el) return;
    const q = Math.max(0, Math.min(1, p == null ? 1 : p));
    el.style.opacity = String(q); el.style.transform = `translateY(${((1 - q) * 14).toFixed(2)}px)`;
  };
  const setAlpha = (el, a) => { const v = String(Math.max(0, Math.min(1, a || 0))); if (el.style.opacity !== v) el.style.opacity = v; };

  function init() {
    if (root) return;
    const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    root = document.createElement('div'); root.id = 'rl-root'; root.innerHTML = HTML; document.body.appendChild(root);
    titleEl = $('#rl-title'); endEl = $('#rl-end'); capEl = $('#rl-cap');
    // draw everything once at almost no opacity, so fonts and the pattern are ready before the first frame
    [titleEl, endEl].forEach(e => { e.style.opacity = '0.01'; });
  }

  const resolveY = spec => {
    if (typeof spec === 'number') return spec;
    const el = $(spec.sel); if (!el) return window.scrollY;
    return Math.max(0, el.getBoundingClientRect().top + window.scrollY + (spec.off || 0));
  };

  let seekDone = null;
  function apply(s) {
    // overlays
    if (s.title) {
      setAlpha(titleEl, s.title.alpha);
      const st = (s.title.stamps || []);
      titleEl.querySelectorAll('#rl-title-stamps svg').forEach((svg, i) => {
        const q = Math.max(0, Math.min(1, st[i] == null ? 1 : st[i]));
        svg.style.opacity = String(q); svg.style.transform = `translateY(${((1 - q) * -14).toFixed(2)}px) scale(${(0.7 + 0.3 * q).toFixed(3)})`;
      });
      [1, 2, 3].forEach(i => part(titleEl, i, (s.title.parts || [])[i]));
    }
    if (s.end) {
      setAlpha(endEl, s.end.alpha);
      [0, 1, 2, 3, 4, 5, 6].forEach(i => part(endEl, i, (s.end.parts || [])[i]));
    }
    const text = s.caption ? s.caption.text : null;
    if (text !== capText) { capText = text; capEl.firstElementChild.textContent = text || ''; }
    setAlpha(capEl, s.caption ? s.caption.alpha : 0);

    // the page: scroll, model, hotspot, hero video
    const app = window.PrintApp || {};
    if (s.variant && s.variant !== lastVariant && app.setVariant) { app.setVariant(s.variant); lastVariant = s.variant; }
    if ('hotspot' in s && s.hotspot !== lastHotspot && app.selectHotspot) { app.selectHotspot(s.hotspot); lastHotspot = s.hotspot; }
    if (s.orbit && s.orbit !== lastOrbit && app.orbit) { app.orbit(s.orbit, true); lastOrbit = s.orbit; }
    if (s.scroll) {
      const a = resolveY(s.scroll.from), b = s.scroll.to == null ? a : resolveY(s.scroll.to);
      const y = Math.round(a + (b - a) * (s.scroll.k == null ? 0 : s.scroll.k));
      if (y !== lastY || Math.abs(window.scrollY - y) > 1) { window.scrollTo({ top: y, behavior: 'instant' }); lastY = y; }
    }
    seekDone = null;
    const v = $('#hero-video');
    if (v && s.video != null) {
      if (!v.paused) v.pause();
      const d = v.duration || 12, t = s.video % d;
      if (Math.abs(v.currentTime - t) > 0.0005) {
        v.currentTime = t;
        seekDone = new Promise(res => { v.addEventListener('seeked', res, { once: true }); __vt.realSetTimeout(res, 1500); });
      }
    }
  }

  /** What is still loading in real time that would show in this frame. */
  function pending() {
    const out = [];
    if (document.fonts && document.fonts.status !== 'loaded') out.push('fonts');
    const mv = $('model-viewer'); if (mv && !mv.loaded) out.push('model');
    if (document.querySelector('.leaflet-tile-loading')) out.push('map tiles');
    const vh = window.innerHeight;
    for (const i of document.images) {
      const r = i.getBoundingClientRect();
      if (r.bottom > -vh && r.top < vh * 2 && !(i.complete && (i.naturalWidth > 0 || !i.currentSrc))) { out.push('image ' + (i.currentSrc || i.src).split('/').pop()); break; }
    }
    const v = $('#hero-video'); if (v && v.seeking) out.push('video seek');
    return out;
  }

  /** Put the page in the state for one frame, move the virtual clock on by ms, and let the browser draw it. */
  async function frame(state, ms) {
    apply(state);
    if (seekDone) await seekDone;
    await __vt.step(ms);
    __vt.syncAnimations();
    await __vt.realFrames(2);
    return pending();
  }

  window.__reel = { init, frame, pending, resolveY };
})();
