#!/usr/bin/env node
/* reel/align.mjs — when each word of each take is spoken, so captions and on-screen cues land on the words.
     node reel/align.mjs            (reads reel/script.json, reel/voice/*.mp3; writes reel/timing.json)
   Each take is transcribed with whisper.cpp (word timestamps), then the script's words are matched to what was
   heard, letters only, so a respelled name ("Mehrgarh" heard as "Mergar") still lines up. Words the match cannot
   place are spaced evenly between their neighbours. Needs ffmpeg, whisper-cli and ~/.cache/whisper/ggml-small.en.bin. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = JSON.parse(fs.readFileSync(path.join(here, 'script.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(here, 'voice-manifest.json'), 'utf8'));
const OUT = path.join(here, 'timing.json');
const old = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const model = path.join(os.homedir(), '.cache/whisper/ggml-small.en.bin');
const norm = w => w.toLowerCase().replace(/[^a-z0-9]+/g, '');

function lev(a, b) {
  const m = a.length, n = b.length; if (!m || !n) return Math.max(m, n);
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
const sim = (a, b) => (a || b ? 1 - lev(a, b) / Math.max(a.length, b.length) : 0);

/** Needleman–Wunsch over words: returns, for each script word, the index of the heard word it matches (or -1). */
function match(src, hyp) {
  const GAP = -0.5, n = src.length, m = hyp.length;
  const S = Array.from({ length: n + 1 }, () => new Float64Array(m + 1)), T = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1));
  for (let i = 1; i <= n; i++) { S[i][0] = i * GAP; T[i][0] = 1; }
  for (let j = 1; j <= m; j++) { S[0][j] = j * GAP; T[0][j] = 2; }
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const d = S[i - 1][j - 1] + sim(norm(src[i - 1]), norm(hyp[j - 1])) * 2 - 1, u = S[i - 1][j] + GAP, l = S[i][j - 1] + GAP;
    if (d >= u && d >= l) { S[i][j] = d; T[i][j] = 0; } else if (u >= l) { S[i][j] = u; T[i][j] = 1; } else { S[i][j] = l; T[i][j] = 2; }
  }
  const out = new Array(n).fill(-1);
  for (let i = n, j = m; i > 0 || j > 0;) {
    const t = T[i][j];
    if (i > 0 && j > 0 && t === 0) { if (sim(norm(src[i - 1]), norm(hyp[j - 1])) >= 0.34) out[i - 1] = j - 1; i--; j--; } else if (i > 0 && (j === 0 || t === 1)) i--; else j--;
  }
  return out;
}

const timing = {};
for (const step of script.steps) {
  const take = manifest.takes[step.id];
  if (!take || take.hash !== step.hash) { console.error(`✗ ${step.id}: no current take; run the voice tool first`); process.exit(1); }
  if (old[step.id] && old[step.id].hash === step.hash) { timing[step.id] = old[step.id]; continue; }
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'align-')), wav = path.join(work, 't.wav');
  let r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(here, 'voice', step.id + '.mp3'), '-ar', '16000', '-ac', '1', wav]);
  if (r.status) { console.error('✗ ffmpeg failed', String(r.stderr)); process.exit(1); }
  r = spawnSync('whisper-cli', ['-m', model, '-f', wav, '-ml', '1', '-sow', '-oj', '-of', path.join(work, 't'), '-np']);
  if (r.status) { console.error('✗ whisper-cli failed', String(r.stderr)); process.exit(1); }
  const heard = JSON.parse(fs.readFileSync(path.join(work, 't.json'), 'utf8')).transcription
    .map(s => ({ w: s.text.trim(), t0: s.offsets.from / 1000, t1: s.offsets.to / 1000 })).filter(s => norm(s.w));
  const words = step.text.split(/\s+/).filter(Boolean);
  const at = match(words, heard.map(h => h.w));
  const rows = words.map((w, i) => ({ w, t0: at[i] >= 0 ? heard[at[i]].t0 : null, t1: at[i] >= 0 ? heard[at[i]].t1 : null, matched: at[i] >= 0 }));
  // spread unmatched words evenly between the matched ones on either side
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].t0 !== null) continue;
    let a = i - 1, b = i + 1; while (a >= 0 && rows[a].t0 === null) a--; while (b < rows.length && rows[b].t0 === null) b++;
    const lo = a >= 0 ? rows[a].t1 : 0, hi = b < rows.length ? rows[b].t0 : take.seconds, k = i - a, n = b - a;
    rows[i].t0 = +(lo + ((hi - lo) * (k - 1)) / (n - 1 || 1)).toFixed(3); rows[i].t1 = +(lo + ((hi - lo) * k) / (n - 1 || 1)).toFixed(3);
  }
  const lost = rows.filter(r => !r.matched).map(r => r.w);
  timing[step.id] = { hash: step.hash, seconds: take.seconds, words: rows.map(r => ({ w: r.w, t0: +r.t0.toFixed(3), t1: +r.t1.toFixed(3) })) };
  console.log(`${step.id.padEnd(8)} ${words.length} words, ${words.length - lost.length} matched${lost.length ? ' (placed by spacing: ' + lost.join(' ') + ')' : ''}`);
  fs.rmSync(work, { recursive: true, force: true });
}
fs.writeFileSync(OUT, JSON.stringify(timing, null, 1) + '\n');
console.log('wrote reel/timing.json');
