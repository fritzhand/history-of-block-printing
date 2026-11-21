#!/usr/bin/env node
/**
 * validate-data.mjs — schema and sanity checks for the data layer.
 *
 *   node tools/validate-data.mjs
 *
 * Checks: every source object's fields and status; era slugs and event years against
 * meta.eras; coordinates; steps, hotspots and the blue thread against the events they
 * name; images against the allowed licence set and for rights evidence; the evidence
 * ledger's tags; the hero rule (hero and footer numbers must be CONFIRMED); that the
 * model, poster and every image file exist; and that no local file path ("/Users/…")
 * has found its way into anything the page ships.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const rel = process.argv[2] || 'js/data.js';
const src = fs.readFileSync(path.join(root, rel), 'utf8');
const win = {}; new Function('window', src)(win);
const d = win.printData;
if (!d) { console.log(`ERROR ${rel}: does not define window.printData`); process.exit(1); }

const errors = [], warnings = [];
const STATUS = new Set(['CONFIRMED', 'PENDING', 'DERIVED']);
const ACCESS = new Set(['FREE', 'REGISTRATION', 'PAYWALL', 'API']);
const TAGS = new Set(['EVIDENCED', 'REPORTED', 'NOT FOUND', 'IMAGINED', 'OBSERVED']);
const LICENSES = /^(Public domain|PD|CC0|CC BY( \d\.\d)?|CC BY-SA( \d\.\d)?)/i;
const eras = d.meta.eras || [], ERA = new Set(eras.map(e => e.slug));
eras.forEach((e, i) => { if (i && e.start <= eras[i - 1].start) errors.push(`meta.eras[${i}] (${e.slug}) starts before the era it follows`); });
const eraOf = y => { let c = eras[0].slug; for (const e of eras) if (y >= e.start) c = e.slug; return c; };

const counts = { CONFIRMED: 0, PENDING: 0, DERIVED: 0 }, institutions = new Set();
function checkSource(s, where) {
  if (!s) return errors.push(`${where}: missing source`);
  if (Array.isArray(s)) { if (!s.length) errors.push(`${where}: empty source array`); return s.forEach((x, i) => checkSource(x, `${where}[${i}]`)); }
  if (typeof s === 'string') return errors.push(`${where}: source is a string, not a source object`);
  for (const k of ['institution', 'date', 'url']) if (!s[k]) errors.push(`${where}: source.${k} missing`);
  if (s.url && !/^https?:\/\//.test(s.url)) errors.push(`${where}: source.url is not http(s)`);
  if (!STATUS.has(s.verificationStatus)) errors.push(`${where}: verificationStatus "${s.verificationStatus}" invalid`); else counts[s.verificationStatus]++;
  if (!ACCESS.has(s.accessType)) errors.push(`${where}: accessType "${s.accessType}" invalid`);
  if (s.verificationStatus === 'DERIVED' && !s.note) warnings.push(`${where}: DERIVED without a note`);
  if (s.verificationStatus === 'CONFIRMED' && !s.quote) errors.push(`${where}: CONFIRMED without a quote`);
  if (s.verificationStatus === 'PENDING' && s.quote) warnings.push(`${where}: PENDING but has a quote`);
  if (s.institution) institutions.add(s.institution);
}

/* map events */
const ids = new Set();
let prev = -1e9;
d.mapEvents.forEach((e, i) => {
  const w = `mapEvents[${i}] ${e.id}`;
  for (const k of ['id', 'date', 'title', 'place', 'body', 'continent', 'kind']) if (!e[k]) errors.push(`${w}: ${k} missing`);
  if (ids.has(e.id)) errors.push(`${w}: duplicate id`); ids.add(e.id);
  if (!Number.isFinite(e.year)) errors.push(`${w}: year is not a number`);
  if (e.year < prev) errors.push(`${w}: not sorted by year`); prev = e.year;
  if (!ERA.has(e.phase)) errors.push(`${w}: phase "${e.phase}" not in meta.eras`);
  else if (e.phase !== eraOf(e.year)) errors.push(`${w}: phase ${e.phase} does not match year ${e.year}`);
  if (!(e.lat >= -90 && e.lat <= 90 && e.lng >= -180 && e.lng <= 180)) errors.push(`${w}: coordinates out of range`);
  checkSource(e.source, `${w}.source`);
});

/* steps */
d.scrollSteps.forEach((s, i) => {
  const w = `scrollSteps[${i}] ${s.eventId}`;
  if (!ids.has(s.eventId)) errors.push(`${w}: event not found`);
  if (!s.headline || !s.narrative) errors.push(`${w}: headline/narrative missing`);
  if (!Array.isArray(s.flyTo) || s.flyTo.length !== 2) errors.push(`${w}: flyTo invalid`);
});
d.blueThread.forEach(id => { if (!ids.has(id)) errors.push(`blueThread: ${id} is not a mapped event`); });

/* ledger, claims, process, hotspots */
d.ledger.forEach((r, i) => { const w = `ledger[${i}]`; if (!TAGS.has(r.tag)) errors.push(`${w}: tag "${r.tag}" invalid`); if (!r.claim || !r.basis) errors.push(`${w}: claim/basis missing`); checkSource(r.source, `${w}.source`); });
d.claims.forEach((c, i) => { const w = `claims[${i}]`; for (const k of ['claim', 'verdict', 'correction']) if (!c[k]) errors.push(`${w}: ${k} missing`); if (!ERA.has(c.era)) errors.push(`${w}: era invalid`); checkSource(c.source, `${w}.source`); });
d.process.forEach((p, i) => { const w = `process[${i}]`; if (!p.title || !p.text) errors.push(`${w}: title/text missing`); checkSource(p.source, `${w}.source`); });
d.hotspots.forEach((h, i) => {
  const w = `hotspots[${i}] ${h.slot}`;
  if (!/^-?[\d.]+ -?[\d.]+ -?[\d.]+$/.test(h.position)) errors.push(`${w}: position "${h.position}" is not "x y z"`);
  if (!TAGS.has(h.tag)) errors.push(`${w}: tag invalid`);
  if (h.tag === 'EVIDENCED') checkSource(h.source, `${w}.source`);
});

/* hero rule */
for (const [name, list] of [['heroStats', d.heroStats], ['footerStats', d.footerStats]]) {
  list.forEach((s, i) => {
    checkSource(s.source, `${name}[${i}].source`);
    for (const x of [].concat(s.source || [])) if (x.verificationStatus !== 'CONFIRMED') errors.push(`${name}[${i}] "${s.value}": hero and footer numbers must be CONFIRMED`);
  });
}

/* media */
d.mediaAssets.forEach((m, i) => {
  const w = `mediaAssets[${i}] ${m.id}`;
  for (const k of ['title', 'caption', 'creator', 'license', 'creditLine', 'sourceUrl', 'thumbUrl', 'rightsEvidence']) if (!m[k]) errors.push(`${w}: ${k} missing`);
  if (m.license && !LICENSES.test(m.license)) errors.push(`${w}: licence "${m.license}" is not in the allowed set`);
  if (m.thumbUrl && !fs.existsSync(path.join(root, m.thumbUrl))) errors.push(`${w}: file ${m.thumbUrl} missing`);
});
for (const f of [d.model.src, d.model.poster, ...d.swatches.map(s => s.file)]) if (!fs.existsSync(path.join(root, f))) errors.push(`file missing: ${f}`);
const media = new Set(d.mediaAssets.map(m => m.id));
d.scrollSteps.forEach(s => (s.media || []).forEach(id => { if (!media.has(id)) errors.push(`step ${s.eventId}: image ${id} not in the archive`); }));

/* nothing local in what ships */
const shipped = [src, fs.readFileSync(path.join(root, 'index.html'), 'utf8'), fs.readFileSync(path.join(root, 'js/app.js'), 'utf8'), fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8')];
shipped.forEach((t, i) => { if (/\/Users\/|\/private\/tmp|C:\\Users/.test(t)) errors.push(`a local file path appears in ${['data.js', 'index.html', 'app.js', 'styles.css'][i]}`); });

console.log(`events ${d.mapEvents.length}, steps ${d.scrollSteps.length}, ledger ${d.ledger.length}, claims ${d.claims.length}, images ${d.mediaAssets.length}`);
console.log(`source objects: CONFIRMED ${counts.CONFIRMED}, PENDING ${counts.PENDING}, DERIVED ${counts.DERIVED}; institutions ${institutions.size}`);
warnings.forEach(w => console.log('WARN  ', w));
errors.forEach(e => console.log('ERROR ', e));
console.log(errors.length ? `\n${errors.length} error(s)` : '\nOK: no errors');
process.exit(errors.length ? 1 : 0);
