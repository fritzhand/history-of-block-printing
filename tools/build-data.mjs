#!/usr/bin/env node
/**
 * build-data.mjs — compile js/data.js from the research files and the editorial layer.
 *
 *   node tools/build-data.mjs
 *
 * Inputs
 *   research/indus.json, printing.json   the evidence: events, each with source objects that
 *                                        carry the exact quote supporting them
 *   research/indigo-crossover.json       events carried from the indigo study, with their
 *                                        sources and statuses unchanged
 *   research/priest-king.json            feature-level quotes for the 3D viewer
 *   research/media.json, media-indigo.json   the picture archive, licence read from each record
 *   tools/editorial.mjs                  the judgement layer
 *
 * Output
 *   js/data.js                           window.printData
 *
 * Rules the build enforces so the page cannot drift from its evidence:
 *   - an event's era is computed from its year, never copied;
 *   - an event or step that names a missing event or image is an error;
 *   - an image whose mirrored file is missing is left out of the page and listed in meta.pendingMedia.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import editorial from './editorial.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const readJson = f => JSON.parse(fs.readFileSync(path.join(root, 'research', f), 'utf8'));
const exists = f => fs.existsSync(path.join(root, 'research', f));

const events = new Map(), features = new Map();
for (const f of ['indus.json', 'printing.json', 'indigo-crossover.json']) {
  if (!exists(f)) continue;
  for (const e of readJson(f).events) { if (events.has(e.id)) throw new Error(`duplicate event ${e.id}`); events.set(e.id, e); }
}
if (exists('priest-king.json')) for (const x of readJson('priest-king.json').features) features.set(x.id, x);
const images = [...(exists('media.json') ? readJson('media.json').images : []), ...(exists('media-indigo.json') ? readJson('media-indigo.json').images : [])];

/* ── sources ─────────────────────────────────────────────── */
const SRC_KEYS = ['institution', 'title', 'date', 'url', 'quote', 'note', 'verificationStatus', 'accessType'];
function cleanSource(s) {
  if (!s || typeof s !== 'object') return null;
  const o = {};
  for (const k of SRC_KEYS) if (s[k] != null && s[k] !== '') o[k] = typeof s[k] === 'string' ? s[k].trim() : s[k];
  if (!o.verificationStatus) o.verificationStatus = 'PENDING';
  if (!o.accessType) o.accessType = 'FREE';
  if (!o.date) o.date = 'n.d.';
  return o;
}
/* One record often quotes one document twice; merge into one source object per document. */
function mergeSources(list) {
  const out = [], byKey = new Map();
  for (const s of list.filter(Boolean)) {
    const k = `${s.url}|${s.title || ''}|${s.verificationStatus}`;
    const prev = byKey.get(k);
    if (!prev) { const c = { ...s }; byKey.set(k, c); out.push(c); continue; }
    if (s.quote && prev.quote !== s.quote && !String(prev.quote || '').includes(s.quote)) prev.quote = prev.quote ? `${prev.quote} … ${s.quote}` : s.quote;
    if (s.note && !String(prev.note || '').includes(s.note)) prev.note = prev.note ? `${prev.note} ${s.note}` : s.note;
  }
  return out;
}
const need = (map, id, kind) => { const v = map.get(id); if (!v) throw new Error(`${kind} "${id}" is not in the research files`); return v; };
const H = {
  eventSources: (id, idx) => {
    const all = (need(events, id, 'event').sources || []).map(cleanSource);
    return mergeSources(idx == null ? all : [].concat(idx).map(i => { if (!all[i]) throw new Error(`event ${id} has no source #${i}`); return all[i]; }));
  },
  featureSources: id => mergeSources((need(features, id, 'feature').sources || []).map(cleanSource))
};
const E = editorial(H);

/* ── eras and continents ─────────────────────────────────── */
const ERAS = E.meta.eras;
const eraOf = y => { let cur = ERAS[0].slug; for (const e of ERAS) if (y >= e.start) cur = e.slug; return cur; };
function continentOf(lat, lng) {
  if (lng < -30) return 'Americas';
  if (lat < 37 && lng >= -20 && lng < 34) return 'Africa';
  if (lat >= 36 && lng >= -30 && lng < 40) return 'Europe';
  if (lng >= 34 && lng < 62) return 'West Asia';
  if (lng >= 62 && lng < 92.6 && lat < 36) return 'South Asia';
  return 'East Asia & Southeast Asia';
}

/* ── map events ──────────────────────────────────────────── */
const mapEvents = E.events.map(sel => {
  const e = need(events, sel.id, 'event');
  return {
    id: e.id, date: e.displayDate, year: e.year, phase: eraOf(e.year), title: e.title, place: e.place, body: e.summary,
    ...(e.significance ? { significance: e.significance } : {}),
    lat: e.lat, lng: e.lng, kind: e.kind || 'textile',
    continent: sel.continent || continentOf(e.lat, e.lng),
    carried: events.get(e.id) && (readJson('indigo-crossover.json').events.some(x => x.id === e.id)) || undefined,
    source: mergeSources((e.sources || []).map(cleanSource))
  };
}).sort((a, b) => a.year - b.year);
const evById = new Map(mapEvents.map(e => [e.id, e]));

/* ── media ───────────────────────────────────────────────── */
const mediaAssets = [], pendingMedia = [];
for (const a of images) {
  const local = a.thumbUrl && !/^https?:/.test(a.thumbUrl) ? a.thumbUrl : `assets/media/${a.id}.jpg`;
  if (!fs.existsSync(path.join(root, local))) { pendingMedia.push(a.id); continue; }
  const yr = typeof a.year === 'number' ? a.year : parseYear(a.year);
  const m = { id: a.id, year: yr, yearLabel: a.yearLabel || (typeof a.year === 'string' ? a.year : undefined), era: eraOf(yr),
    title: a.title, caption: a.caption, alt: a.alt || a.title, creator: a.creator, license: a.license, creditLine: a.creditLine,
    sourceUrl: a.sourceUrl, thumbUrl: local, fullUrl: a.fullUrl, upstreamArchive: a.upstreamArchive, kind: a.kind,
    lat: a.lat, lng: a.lng, rightsEvidence: a.rightsEvidence, verificationStatus: a.verified ? 'CONFIRMED' : 'PENDING' };
  for (const k of Object.keys(m)) if (m[k] == null || m[k] === '' || Number.isNaN(m[k])) delete m[k];
  mediaAssets.push(m);
}
function parseYear(s) {
  const t = String(s || '');
  const bce = /BCE/.test(t); const n = t.match(/\d{3,4}/);
  if (!n) { const c = t.match(/(\d{1,2})(?:st|nd|rd|th)\s+century/); return c ? (Number(c[1]) - 1) * 100 + 50 : 1900; }
  return bce ? -Number(n[0]) : Number(n[0]);
}
const order = E.mediaOrder || [];
mediaAssets.sort((a, b) => {
  const ia = order.indexOf(a.id), ib = order.indexOf(b.id);
  return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || a.year - b.year;
});
const mediaIds = new Set(mediaAssets.map(m => m.id));

/* ── steps ───────────────────────────────────────────────── */
const scrollSteps = E.scrollSteps.map(st => {
  const e = evById.get(st.eventId);
  if (!e) throw new Error(`step ${st.eventId}: event not selected in editorial events`);
  const media = (st.media || []).filter(id => mediaIds.has(id));
  return { eventId: st.eventId, date: st.date ?? e.date, phase: e.phase, headline: st.headline, narrative: st.narrative,
    ...(media.length ? { media } : {}), flyTo: st.flyTo ?? [e.lat, e.lng], zoom: st.zoom ?? 5 };
});

/* process steps and blue thread */
const process = E.process.map(p => ({ ...p, source: mergeSources(p.source), media: p.media && mediaIds.has(p.media) ? p.media : undefined }));
for (const p of process) if (!p.media) delete p.media;
const hotspots = E.hotspots.map(h => ({ ...h, source: h.feature ? (h.feature === 'cloak' ? H.eventSources('priest-king-mohenjo-daro', [0]) : H.featureSources(h.feature)) : [] }));
const blueThread = E.blueThread.map(id => { need(evById, id, 'mapped event'); return id; });

const data = {
  meta: { ...E.meta, pendingMedia },
  heroStats: E.heroStats, footerStats: E.footerStats,
  mapEvents, scrollSteps,
  ledger: E.ledger.map(r => ({ ...r, source: mergeSources(r.source) })),
  claims: E.claims.map(c => ({ ...c, source: mergeSources(c.source) })),
  process, hotspots, swatches: E.swatches, blueThread, mediaAssets,
  model: { src: 'assets/models/priest-king.glb', poster: 'assets/video/hero-poster.jpg', variants: ['stone', 'printed'] }
};

/* ── serialise ───────────────────────────────────────────── */
const q = s => JSON.stringify(s);
const K = k => /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
function fmt(v, indent) {
  const pad = ' '.repeat(indent);
  if (v === null || v === undefined) return 'null';
  if (typeof v !== 'object') return q(v);
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    if (v.every(x => typeof x !== 'object' || x === null)) return '[' + v.map(x => q(x)).join(', ') + ']';
    return '[\n' + v.map(x => pad + '  ' + fmt(x, indent + 2)).join(',\n') + '\n' + pad + ']';
  }
  const keys = Object.keys(v).filter(k => v[k] !== undefined);
  return '{\n' + keys.map(k => pad + '  ' + K(k) + ': ' + fmt(v[k], indent + 2)).join(',\n') + '\n' + pad + '}';
}
const header = `/**
 * data.js — The Repeating Hand: A History of Block Printing
 * GENERATED by tools/build-data.mjs from research/*.json and tools/editorial.mjs.
 * Edit those and rebuild (node tools/build-data.mjs); do not edit this file by hand.
 *
 * Every claim carries a source object:
 *   { institution, title, date, url, quote?, note?, verificationStatus, accessType }
 *   CONFIRMED = the cited page states it (the quote is the evidence; tools/check-quotes.py re-checks it)
 *   PENDING   = a credible source named but not yet read
 *   DERIVED   = this study's own reading, a midpoint or a comparison; the note says what it rests on
 */
`;
fs.writeFileSync(path.join(root, 'js', 'data.js'), header + '\nwindow.printData = {\n\n' + Object.keys(data).map(k => `  ${k}: ${fmt(data[k], 2)}`).join(',\n\n') + '\n};\n');
const size = (fs.statSync(path.join(root, 'js', 'data.js')).size / 1024).toFixed(0);
console.log(`js/data.js: ${mapEvents.length} events, ${scrollSteps.length} steps, ${mediaAssets.length} images` +
  (pendingMedia.length ? ` (${pendingMedia.length} left out, file missing: ${pendingMedia.join(', ')})` : '') + `, ${size} KB`);
