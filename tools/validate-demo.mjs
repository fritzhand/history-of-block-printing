#!/usr/bin/env node
/**
 * validate-demo.mjs — the narrated demo cannot ship broken.
 *
 *   node tools/validate-demo.mjs
 *
 * Checks that every step has a take made from its current words and voice (and the file exists), that every
 * `spot` names a data-tour target that is in index.html, that every story event, hotspot slot, variant and
 * chapter a scene names is real, that scroll sections exist, that orbits are well-formed, and that the music
 * bed and generated data are present and current.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScript, currentTakes } from './lib/voice-script.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const errors = [], warnings = [];
const source = JSON.parse(read('data/demo/script.source.json'));
const script = buildScript(source);
const manifest = fs.existsSync(path.join(root, 'data/demo/voice-manifest.json')) ? JSON.parse(read('data/demo/voice-manifest.json')) : { takes: {} };
const takes = currentTakes(script, manifest);

const html = read('index.html');
const targets = new Set([...html.matchAll(/data-tour="([^"]+)"/g)].map(m => m[1]));
const sections = new Set([...html.matchAll(/<(?:section|header|footer)[^>]*\sid="([^"]+)"/g)].map(m => m[1]));
const win = {}; new Function('window', read('js/data.js'))(win);
const D = win.printData;
const events = new Set(D.scrollSteps.map(s => s.eventId));
const slots = new Set(D.hotspots.map(h => h.slot));
const chapters = new Set((script.chapters || []).map(c => c.id));
const ORBIT = /^\s*-?[\d.]+deg\s+-?[\d.]+deg\s+[\d.]+m\s*$/;

if (!script.voice || !script.voice.voice) errors.push('script has no voice');
script.steps.forEach((s, i) => {
  const w = `step ${i + 1} "${s.id}"`;
  for (const k of ['title', 'text', 'chapter']) if (!s[k]) errors.push(`${w}: ${k} missing`);
  if (!chapters.has(s.chapter)) errors.push(`${w}: chapter "${s.chapter}" is not in chapters`);
  if (s.spot && !targets.has(s.spot)) errors.push(`${w}: spot "${s.spot}" is not a data-tour target in index.html`);
  if (!takes[s.id]) errors.push(`${w}: no current take (run node tools/demo-voice.mjs)`);
  else if (!fs.existsSync(path.join(root, 'assets/demo/voice', s.id + '.mp3'))) errors.push(`${w}: take file missing`);
  const sc = s.scene || {};
  if (sc.section && !sections.has(sc.section)) errors.push(`${w}: scene.section "${sc.section}" is not a section`);
  if (sc.variant && !D.model.variants.includes(sc.variant)) errors.push(`${w}: variant "${sc.variant}" is not one of ${D.model.variants}`);
  if (sc.hotspot && !slots.has(sc.hotspot)) errors.push(`${w}: hotspot "${sc.hotspot}" is not a hotspot slot`);
  for (const id of sc.story || []) if (!events.has(id)) errors.push(`${w}: story event "${id}" is not a timeline step`);
  if (sc.orbit && !ORBIT.test(sc.orbit)) errors.push(`${w}: orbit "${sc.orbit}" is not "<az>deg <polar>deg <r>m"`);
  if (sc.sweep && !sc.orbit) errors.push(`${w}: a sweep needs an orbit`);
  if (sc.link && !/^https:\/\//.test(sc.link.href)) errors.push(`${w}: link must be https`);
  if (s.link && !/^https:\/\//.test(s.link.href)) errors.push(`${w}: link must be https`);
});
for (const c of script.chapters || []) if (!script.steps.some(s => s.chapter === c.id)) warnings.push(`chapter "${c.id}" has no steps`);
if (!fs.existsSync(path.join(root, 'assets/audio/demo-bed.mp3'))) warnings.push('assets/audio/demo-bed.mp3 is missing: the demo will have no music');
const data = fs.existsSync(path.join(root, 'js/demo-data.js')) ? read('js/demo-data.js') : '';
for (const s of script.steps) if (!data.includes(`"${s.hash}"`)) { errors.push('js/demo-data.js is out of date (run node tools/demo-script.mjs)'); break; }
if (!/name="asset-version" content="[0-9a-f]{8}"/.test(html)) warnings.push('index.html has no asset-version stamp (run node tools/build-data.mjs)');

const secs = Object.values(takes).reduce((n, t) => n + t.seconds, 0);
console.log(`demo: ${script.steps.length} steps in ${chapters.size} chapters, ${Object.keys(takes).length} current takes, ${(secs / 60).toFixed(1)} min of narration, ${targets.size} tour targets on the page`);
warnings.forEach(w => console.log('WARN  ', w)); errors.forEach(e => console.log('ERROR ', e));
console.log(errors.length ? `\n${errors.length} error(s)` : '\nOK: the demo is complete');
process.exit(errors.length ? 1 : 0);
