#!/usr/bin/env node
/**
 * demo-voice.mjs — record the narration takes.
 *
 *   node tools/demo-voice.mjs                 speak what is stale, check each take, encode
 *   node tools/demo-voice.mjs --check         list what is stale; exit 1 if anything is
 *   node tools/demo-voice.mjs --all           speak every line again
 *   node tools/demo-voice.mjs --only a,b      speak those ids again
 *   --voice-env DIR     a folder whose .venv has kokoro and soundfile (default $VOICE_ENV, else this repo's own .venv)
 *   --no-verify         skip the transcription check
 *   --script / --out / --manifest / --bitrate   other scripts (the reel uses these); defaults are the demo's
 *
 * The voice is Kokoro-82M's `af_heart` (Apache-2.0 code and weights): open source, and it clones no one.
 * Each take is transcribed back with whisper.cpp and compared with its line, letters only: the check
 * catches a dropped or changed word, not a wrong emphasis, so listen to the takes too.
 * Needs ffmpeg, whisper-cli and ~/.cache/whisper/ggml-small.en.bin for the check.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const SCRIPT = opt('--script', 'data/demo/script.json'), MANIFEST = opt('--manifest', 'data/demo/voice-manifest.json');
const VOICE_DIR = opt('--out', 'assets/demo/voice'), BITRATE = opt('--bitrate', '48k');
const readJson = (p, fb) => { try { return JSON.parse(readFileSync(join(ROOT, p), 'utf8')); } catch { return fb; } };

const script = readJson(SCRIPT);
if (!script) { console.error(`✗ no ${SCRIPT}: run node tools/demo-script.mjs first`); process.exit(1); }
const manifest = readJson(MANIFEST, { takes: {} }); manifest.takes ||= {};
const only = opt('--only') ? new Set(opt('--only').split(',')) : null;
const fileOf = id => join(ROOT, VOICE_DIR, `${id}.mp3`);
const stale = script.steps.filter(s => (only ? only.has(s.id) : argv.includes('--all') || manifest.takes[s.id]?.hash !== s.hash || !existsSync(fileOf(s.id))));

if (argv.includes('--check')) {
  if (!stale.length) { console.log('voice: every line has a current take'); process.exit(0); }
  console.error(`voice: ${stale.length} line(s) have no current take: ${stale.map(s => s.id).join(', ')}`); process.exit(1);
}
if (!stale.length) { console.log('voice: every line has a current take'); process.exit(0); }

const VS = (opt('--voice-env') || process.env.VOICE_ENV || ROOT).replace(/^~/, homedir());
const py = join(VS, '.venv', 'bin', 'python');
if (!existsSync(py)) { console.error(`✗ no Python environment at ${py}: create one with kokoro and soundfile in it, or point at one with --voice-env (see REUSE.md, section 0)`); process.exit(1); }

const work = mkdtempSync(join(tmpdir(), 'voice-')), wavs = join(work, 'wav');
writeFileSync(join(work, 'lines.json'), JSON.stringify(stale.map(s => ({ id: s.id, text: s.say }))));
console.log(`speaking ${stale.length} line(s) with ${script.voice.voice} (${script.voice.engine})`);
const r = spawnSync(py, [join(ROOT, 'tools', 'demo-speak.py'), join(work, 'lines.json'), wavs, script.voice.voice, String(script.voice.speed)], { stdio: ['ignore', 'inherit', 'inherit'] });
if (r.status !== 0) { console.error('✗ speaking failed'); process.exit(r.status || 1); }

/* the check: transcribe each take and compare it with its line, letters only */
const ONES = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
const below100 = n => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : ''));
const words = n => (n < 100 ? below100(n) : n < 1000 ? ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + below100(n % 100) : '') : words(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + words(n % 1000) : ''));
const letters = t => t.toLowerCase().replace(/\b\d{1,4}\b/g, n => words(parseInt(n, 10))).replace(/[^a-z]+/g, '');
const cer = (ref, hyp) => {
  const a = letters(ref), b = letters(hyp), d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) { let prev = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } }
  return d[b.length] / Math.max(1, a.length);
};
const MODEL = join(homedir(), '.cache', 'whisper', 'ggml-small.en.bin');
const verify = !argv.includes('--no-verify') && existsSync(MODEL);
if (!argv.includes('--no-verify') && !verify) console.warn(`! no whisper model at ${MODEL}: the takes are not checked`);

mkdirSync(join(ROOT, VOICE_DIR), { recursive: true });
let drifted = 0;
for (const s of stale) {
  const wav = join(wavs, `${s.id}.wav`), mp3 = fileOf(s.id);
  const e = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-af', 'loudnorm=I=-18:TP=-1.5:LRA=9', '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', BITRATE, mp3]);
  if (e.status !== 0) { console.error(`✗ ${s.id}: ffmpeg failed`); process.exit(1); }
  const seconds = Math.round(parseFloat(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3], { encoding: 'utf8' }).stdout) * 100) / 100;
  manifest.takes[s.id] = { hash: s.hash, seconds };
  let note = '';
  if (verify) {
    const w16 = join(work, `${s.id}-16k.wav`);
    spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-ac', '1', '-ar', '16000', w16]);
    const heard = spawnSync('whisper-cli', ['-m', MODEL, '-f', w16, '-nt', '-np'], { encoding: 'utf8' }).stdout.replace(/\s+/g, ' ').trim();
    const err = cer(s.say, heard);
    note = `  ${(err * 100).toFixed(0)}% off`;
    if (err > 0.1) { drifted++; note = `  ✗ letter error ${(err * 100).toFixed(0)}%\n       said:  ${s.say}\n       heard: ${heard}`; }
  }
  console.log(`${s.id.padEnd(14)} ${String(seconds).padStart(6)} s${note}`);
}
const ids = new Set(script.steps.map(s => s.id));
for (const id of Object.keys(manifest.takes)) if (!ids.has(id)) delete manifest.takes[id];
for (const f of readdirSync(join(ROOT, VOICE_DIR))) if (f.endsWith('.mp3') && !ids.has(f.slice(0, -4))) rmSync(join(ROOT, VOICE_DIR, f));
manifest.voice = script.voice;
manifest.takes = Object.fromEntries(Object.entries(manifest.takes).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(join(ROOT, MANIFEST), JSON.stringify(manifest, null, 2) + '\n');
rmSync(work, { recursive: true, force: true });
const total = Object.values(manifest.takes).reduce((n, t) => n + t.seconds, 0);
const bytes = readdirSync(join(ROOT, VOICE_DIR)).reduce((n, f) => n + statSync(join(ROOT, VOICE_DIR, f)).size, 0);
console.log(`\n✓ ${stale.length} take(s) in ${VOICE_DIR}; all takes: ${(total / 60).toFixed(1)} min of narration, ${(bytes / 1e6).toFixed(1)} MB`);
if (drifted) { console.error(`✗ ${drifted} take(s) differ from their line: listen, then change the words or \`pronounce\` and run again`); process.exit(1); }
