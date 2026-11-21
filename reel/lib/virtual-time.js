/* A virtual clock for frame-by-frame capture. The recorder injects this before the page's own scripts run;
   nothing in the site changes. The page's clocks read the virtual clock, which moves only when the recorder
   calls __vt.step(ms), so every captured frame is the page drawn at exactly that frame's time.

   - performance.now(), Date and Date.now() read the virtual clock.
   - setTimeout / setInterval / requestIdleCallback fire in virtual time, in order, during step().
   - requestAnimationFrame callbacks run once per step, with the step's end time. step(ms, false) moves the
     timers only (the page can finish loading without drawing).
   - CSS transitions and animations run on the browser's own clock, which a script cannot replace, so
     syncAnimations() pauses every Web Animation and seeks it to (virtual now - when it first appeared).
     One that has reached its end is finished, so transitionend / animationend still fire.
   - Math.random is seeded, so anything that looks random starts in the same place on every run.

   Real time keeps running underneath for the network, image decoding, fonts and layout; the recorder waits for
   those in real time while the virtual clock stands still. */
(() => {
  if (window.__vt) return;
  const realSetTimeout = window.setTimeout.bind(window);
  const realRAF = window.requestAnimationFrame.bind(window);
  const RealDate = window.Date;
  const WALL0 = RealDate.UTC(2026, 9, 1, 14, 0, 0);          // a fixed wall clock, so anything date-based renders the same

  let now = 0, nextId = 1, frameQueue = new Map();
  const timers = new Map();                                  // id -> { fn, args, at, every }
  const add = (fn, delay, args, every) => {
    const id = nextId++, d = Math.max(0, Number(delay) || 0);
    timers.set(id, { fn, args, at: now + d, every: every ? Math.max(1, d) : 0 });
    return id;
  };
  window.setTimeout = (fn, delay, ...args) => add(fn, delay, args, false);
  window.setInterval = (fn, delay, ...args) => add(fn, delay, args, true);
  window.clearTimeout = window.clearInterval = id => { timers.delete(id); };
  window.requestAnimationFrame = cb => { const id = nextId++; frameQueue.set(id, cb); return id; };
  window.cancelAnimationFrame = id => { frameQueue.delete(id); };
  window.requestIdleCallback = cb => add(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 1, [], false);
  window.cancelIdleCallback = id => timers.delete(id);

  let seed = 0x2f6b1d3a;                                     // mulberry32
  Math.random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0; let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const perfNow = () => now;
  try { Object.defineProperty(Performance.prototype, 'now', { value: perfNow, configurable: true, writable: true }); } catch { performance.now = perfNow; }

  function FakeDate(...a) {
    if (!new.target) return new RealDate(WALL0 + now).toString();
    return a.length ? new RealDate(...a) : new RealDate(WALL0 + now);
  }
  FakeDate.prototype = RealDate.prototype; FakeDate.now = () => Math.floor(WALL0 + now);
  FakeDate.parse = RealDate.parse; FakeDate.UTC = RealDate.UTC;
  window.Date = FakeDate;

  const yieldTask = () => new Promise(r => realSetTimeout(r, 0));
  const call = (fn, args) => { try { if (typeof fn === 'function') fn(...args); } catch (e) { console.error('[vt]', e); } };

  const started = new WeakMap();                             // animation -> the virtual time it first appeared
  function syncAnimations() {
    let n = 0;
    for (const a of document.getAnimations()) {
      let t0 = started.get(a);
      if (t0 === undefined) { t0 = now; started.set(a, t0); }
      if (a.playState === 'finished' || a.playState === 'idle') continue;
      const timing = a.effect && a.effect.getComputedTiming && a.effect.getComputedTiming();
      const end = timing ? Number(timing.endTime) : Infinity;
      const t = Math.max(0, (now - t0) * (a.playbackRate || 1));
      if (Number.isFinite(end) && t >= end) { try { a.finish(); } catch { a.cancel(); } continue; }
      if (a.playState !== 'paused') a.pause();
      a.currentTime = t; n++;
    }
    return n;
  }

  /** Move the clock on by ms: due timers in order, then (unless frames is false) one animation frame. */
  async function step(ms, frames = true) {
    const target = now + ms;
    for (let guard = 0; guard < 5000; guard++) {
      let id = 0, best = null;
      for (const [k, t] of timers) if (t.at <= target && (!best || t.at < best.at)) { id = k; best = t; }
      if (!best) break;
      now = Math.max(now, best.at);
      if (best.every) best.at += best.every; else timers.delete(id);
      call(best.fn, best.args); await yieldTask();
    }
    now = target;
    if (frames) { const q = frameQueue; frameQueue = new Map(); for (const cb of q.values()) call(cb, [now]); }
    for (let i = 0; i < 3; i++) await yieldTask();            // let promise chains settle what the frame started
    return now;
  }

  /** Wait for the browser to draw n real frames (layout, observers, paint) at the current virtual time. */
  const realFrames = (n = 1) => new Promise(r => { const tick = () => (--n <= 0 ? r() : realRAF(tick)); realRAF(tick); });

  window.__vt = { step, syncAnimations, realFrames, realSetTimeout, get now() { return now; }, pending: () => ({ timers: timers.size, frames: frameQueue.size }) };
})();
