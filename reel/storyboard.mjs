/* reel/storyboard.mjs — the reel, as a function of time.
   plan() lays the six takes on a timeline; stateAt(t) says what the page and the overlays look like at time t.
   Everything that changes on screen is keyed to a spoken word (cue), so it lands with the voice. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FPS = 30;
export const VIEW = { width: 432, height: 768 };          // phone-sized; at 2.5x it is 1080 x 1920
export const DPR = 2.5;
export const ORDER = ['hook', 'what', 'king', 'proof', 'history', 'open'];
const HEAD = 0.5, GAP = 0.45, TAIL = 2.8;                  // lead-in, pause between takes, hold on the end card
const here = path.dirname(fileURLToPath(import.meta.url));

const clamp01 = x => Math.max(0, Math.min(1, x));
const ramp = (t, a, b) => clamp01((t - a) / (b - a));
const ease = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const norm = w => w.toLowerCase().replace(/[^a-z0-9]+/g, '');

export function plan() {
  const timing = JSON.parse(fs.readFileSync(path.join(here, 'timing.json'), 'utf8'));
  const seg = {}; let t = HEAD;
  for (const id of ORDER) {
    if (!timing[id]) throw new Error(`no timing for "${id}": run node reel/align.mjs`);
    seg[id] = { id, start: t, dur: timing[id].seconds, words: timing[id].words, end: t + timing[id].seconds + GAP };
    t = seg[id].end;
  }
  const duration = seg.open.start + seg.open.dur + TAIL;
  seg.open.end = duration;
  const cue = (id, word, nth = 0) => {
    const hits = seg[id].words.filter(w => norm(w.w).startsWith(norm(word)));
    if (!hits[nth]) throw new Error(`cue: no word "${word}" (#${nth}) in "${id}"`);
    return seg[id].start + hits[nth].t0;
  };
  return { seg, duration, frames: Math.ceil(duration * FPS), cue, captions: captionsOf(seg) };
}

/** Phrases of at most 8 words, broken at punctuation, timed by the words they start and end on. */
function captionsOf(seg) {
  const out = [];
  for (const id of ORDER) {
    const s = seg[id], pieces = [];
    let cur = [];
    const flush = () => { if (cur.length) pieces.push(cur); cur = []; };
    for (const w of s.words) {
      cur.push(w);
      if (/[.?!]$/.test(w.w) || (/[,;:]$/.test(w.w) && cur.length >= 3)) flush();
    }
    flush();
    for (let i = 0; i < pieces.length - 1; i++) {                          // fold a short tail into its neighbour
      if (pieces[i].length < 3 && !/[.?!]$/.test(pieces[i][pieces[i].length - 1].w) && pieces[i].length + pieces[i + 1].length <= 8) { pieces[i + 1] = pieces[i].concat(pieces[i + 1]); pieces.splice(i, 1); i--; }
    }
    const final = [];
    for (const p of pieces) {                                              // a long phrase splits into even parts
      const n = Math.ceil(p.length / 8), size = Math.ceil(p.length / n);
      for (let i = 0; i < p.length; i += size) final.push(p.slice(i, i + size));
    }
    final.forEach((p, i) => {
      const next = final[i + 1], t0 = s.start + p[0].t0 - 0.04;
      const t1 = next ? s.start + next[0].t0 - 0.04 : s.start + p[p.length - 1].t1 + 0.4;
      out.push({ id, text: p.map(w => w.w).join(' ').replace(/[.,;:]+$/, ''), t0, t1, fade: !next });
    });
  }
  return out;
}

const SEL = {
  viewer: '#pk-viewer',
  ledger: '[data-tour="ledger"]',
  stats: '[data-tour="hero-stats"]',
  step: id => `.story-step[data-event="${id}"]`,
};
const at = (sel, off = 0) => ({ sel, off });

/** Where the page scrolls: keyframes of (time, place); between two, the page eases from one place to the next. */
export function scrollKeys(P) {
  const { seg, cue } = P;
  const K = [];
  const key = (t, to, mode = 'ease') => K.push({ t, to, mode });
  key(0, 0);
  key(seg.hook.start + 3.4, 0, 'linear');                                  // the title card, then the page
  key(seg.what.start - 0.2, 250);                                          // a slow drift down the hero
  key(seg.what.start + 2.8, at(SEL.stats, -135));                          // the numbers, with the next heading below the captions
  key(seg.king.start - 0.15, at(SEL.stats, -135), 'linear');               // hold
  key(seg.king.start + 1.7, at(SEL.viewer, -62));                          // the model fills the screen
  key(seg.king.end - 0.5, at(SEL.viewer, -62), 'linear');
  key(seg.proof.start + 1.4, at(SEL.ledger, -66));                         // the ledger of claims, scrolled slowly
  let prev = at(SEL.ledger, 1000), tPrev = seg.proof.start + seg.proof.dur - 0.6;
  key(tPrev, prev, 'linear');
  // the timeline: swipe to each stop so it is in place (and the map has flown there) just before the word that names it
  const stops = [['cotton', 'mehrgarh-cotton-fibres'], ['egypt', 'egypt-printing-block-10c'], ['cairo', 'quseir-fustat-block-prints'], ['calico', 'european-calico-1690s']];
  stops.forEach(([word, ev], i) => {
    const to = at(SEL.step(ev), -272), arrive = cue('history', word) - 0.6, depart = Math.max(tPrev + 0.3, arrive - (i === 0 ? 3.4 : 1.0));
    key(depart, prev, 'linear'); key(arrive, to, 'sine'); prev = to; tPrev = arrive;
  });
  key(seg.history.end, prev, 'linear');
  return K;
}

export function stateAt(t, P, K = scrollKeys(P)) {
  const { seg, cue } = P, s = {};

  // scroll
  let i = K.length - 1; while (i > 0 && K[i].t > t) i--;
  const a = K[i], b = K[i + 1];
  if (!b) s.scroll = { from: a.to, to: a.to, k: 0 };
  else { const f = clamp01((t - a.t) / (b.t - a.t)); s.scroll = { from: a.to, to: b.to, k: b.mode === 'linear' ? f : b.mode === 'sine' ? 0.5 - Math.cos(Math.PI * f) / 2 : ease(f) }; }

  // the model: it turns through the take, and changes into printed cloth on the word "printed"
  const k0 = seg.king.start + 1.0, k1 = seg.king.start + seg.king.dur;
  const az = -40 + 170 * ease(ramp(t, k0, k1));
  s.orbit = `${az.toFixed(1)}deg 80deg 0.38m`;
  s.variant = t >= cue('king', 'printed') - 0.1 ? 'printed' : 'stone';
  s.hotspot = null;

  // the hero video's own clock while the hero is on screen
  s.video = t < seg.king.start ? t : null;

  // captions
  const c = P.captions.find(c => t >= c.t0 && t < c.t1);
  s.caption = c ? { text: c.text, alpha: Math.min(ramp(t, c.t0, c.t0 + 0.1), c.fade ? 1 - ramp(t, c.t1 - 0.12, c.t1) : 1) } : null;

  // title card: whole from the first frame (so a cover taken from it is complete), then it lifts
  s.title = { alpha: 1 - ramp(t, 2.7, 3.5), stamps: [1, 1, 1, 1, 1], parts: [1, 1, 1, 1] };

  // end card: it rises as the last take begins; each line arrives on the words that name it
  const o = seg.open.start, up = (when, d = 0.45) => ramp(t, when, when + d);
  s.end = {
    alpha: ramp(t, o - 0.1, o + 0.6),
    parts: [up(o + 0.3), up(o + 0.5), up(o + 0.55), up(cue('open', 'GitHub') - 0.2), up(cue('open', 'GitHub') + 0.35), up(cue('open', 'GitHub') + 0.6), up(cue('open', 'Fork') - 0.1, 0.6)],
  };
  return s;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const P = plan();
  console.log(`reel: ${P.duration.toFixed(2)} s, ${P.frames} frames at ${FPS} fps`);
  for (const id of ORDER) console.log(`  ${id.padEnd(8)} ${P.seg[id].start.toFixed(2)} → ${(P.seg[id].start + P.seg[id].dur).toFixed(2)}`);
  console.log(`captions: ${P.captions.length}, longest ${Math.max(...P.captions.map(c => c.text.split(' ').length))} words`);
  for (const c of P.captions) console.log(`  ${c.t0.toFixed(2).padStart(6)}–${c.t1.toFixed(2).padStart(6)}  ${c.text}`);
}
