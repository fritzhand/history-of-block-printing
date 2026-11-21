#!/usr/bin/env node
/* reel/record.mjs — record the site, frame by frame, into reel/build/video.mkv.

     node reel/record.mjs [--url URL] [--node-modules DIR] [--chrome PATH]
                          [--from S --to S]      only the frames between those seconds -> build/preview.mkv
                          [--stills 3,12.5,40]   one PNG per time -> build/stills/   (the page still runs from 0 s)

   The site runs in a real Chrome at phone size, on a virtual clock (lib/virtual-time.js): the recorder moves the
   clock one frame at a time, puts the page in the state storyboard.mjs gives for that frame, waits for anything
   still loading in real time (map tiles, images, the model), and takes a screenshot at 2.5x, which is 1080 x 1920.
   The page is driven only through its own control API (window.PrintApp) and window.scrollTo.
   Playwright is not a dependency of the site: point --node-modules at any folder that has it. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DPR, FPS, VIEW, plan, scrollKeys, stateAt } from './storyboard.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const URL_ = opt('--url', 'https://fritzhand.github.io/history-of-block-printing/');
const NM = opt('--node-modules', process.env.REEL_NODE_MODULES || null);
const CHROME = opt('--chrome', process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const FROM = opt('--from') !== null ? +opt('--from') : null, TO = opt('--to') !== null ? +opt('--to') : null;
const STILLS = opt('--stills') ? opt('--stills').split(',').map(Number) : null;
const BUILD = path.join(here, 'build');
fs.mkdirSync(path.join(BUILD, 'stills'), { recursive: true });

const { chromium } = (NM ? createRequire(path.join(path.resolve(NM), 'x.js')) : createRequire(import.meta.url))('playwright');
const P = plan(), K = scrollKeys(P);
const MS = 1000 / FPS;
const stillFrames = STILLS ? new Map(STILLS.map(s => [Math.round(s * FPS), s])) : null;
const lastFrame = stillFrames ? Math.max(...stillFrames.keys()) : TO !== null ? Math.min(P.frames - 1, Math.round(TO * FPS)) : P.frames - 1;
const firstCaptured = stillFrames ? 0 : FROM !== null ? Math.round(FROM * FPS) : 0;
const partial = FROM !== null || TO !== null;

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--use-angle=metal', '--ignore-gpu-blocklist', '--hide-scrollbars'] });
// Phone-sized, but not phone-emulated: Leaflet only loads map tiles once a move ends when it thinks it is on a phone,
// which would leave blank tiles during the map's flights. The layout follows the width, so the page looks the same.
const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: DPR, hasTouch: argv.includes('--touch'), isMobile: argv.includes('--touch'), colorScheme: 'dark', reducedMotion: 'no-preference' });
await ctx.addInitScript({ path: path.join(here, 'lib/virtual-time.js') });
await ctx.addInitScript({ path: path.join(here, 'lib/page.js') });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', e => problems.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') problems.push('console: ' + m.text().slice(0, 200)); });
const cdp = await ctx.newCDPSession(page);

const ev = (fn, arg) => page.evaluate(fn, arg);
const settle = async (max = 8000) => {
  const t0 = Date.now(); let p = await ev(() => __reel.pending());
  while (p.length && Date.now() - t0 < max) { await ev(() => __vt.realFrames(2)); p = await ev(() => __reel.pending()); }
  return p;
};

/* ── boot: load, warm every lazy thing once, put the page back at the top ── */
console.log('loading', URL_);
await page.goto(URL_, { waitUntil: 'load' });
await page.waitForFunction(() => window.PrintApp && PrintApp.viewer, null, { polling: 100, timeout: 30000 });
await ev(() => __reel.init());
for (let i = 0; i < 6; i++) await ev(() => __vt.step(50));
await settle(20000);
const docH = await ev(() => document.documentElement.scrollHeight);
for (let y = 0; y < docH; y += 480) {                              // scroll the whole page once, so lazy images are in the cache
  await ev(async y => { scrollTo({ top: y, behavior: 'instant' }); await __vt.step(50); await __vt.realFrames(2); }, y);
  await settle(6000);
}
await ev(async () => { PrintApp.setVariant('printed'); await __vt.step(100); await __vt.realFrames(3); PrintApp.setVariant('stone'); await __vt.step(100); scrollTo({ top: 0, behavior: 'instant' }); await __vt.step(100); await __vt.realFrames(3); });
const left = await settle(20000);
if (left.length) console.warn('  still loading after warm-up:', left.join(', '));
console.log(`ready: ${P.frames} frames, ${P.duration.toFixed(1)} s${partial || stillFrames ? ' (partial run)' : ''}`);

/* ── the encoder ── */
let enc = null, encDone = null;
if (!stillFrames) {
  const out = path.join(BUILD, partial ? 'preview.mkv' : 'video.mkv');
  enc = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-g', String(FPS),
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  encDone = new Promise((res, rej) => { enc.on('close', c => (c ? rej(new Error('ffmpeg exited ' + c)) : res(out))); });
  enc.stdin.on('error', () => {});
}

/* ── the frames ── */
const t0 = Date.now(); let slow = 0;
for (let f = 0; f <= lastFrame; f++) {
  const t = f / FPS, want = f >= firstCaptured && (!stillFrames || stillFrames.has(f));
  await ev(([s, ms]) => __reel.frame(s, ms), [stateAt(t, P, K), MS]);
  if (!want) continue;
  const left = await settle();
  if (left.length) { slow++; console.warn(`  frame ${f} (${t.toFixed(2)} s): still loading: ${left.join(', ')}`); }
  // the clip is in document coordinates, so it starts where the page is scrolled to
  const top = await ev(() => window.scrollY);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, clip: { x: 0, y: top, width: VIEW.width, height: VIEW.height, scale: DPR } });
  const buf = Buffer.from(data, 'base64');
  if (stillFrames) fs.writeFileSync(path.join(BUILD, 'stills', `t${stillFrames.get(f).toFixed(1).padStart(5, '0')}.png`), buf);
  else if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r));
  if (f % 60 === 0) {
    const done = f - firstCaptured + 1, total = lastFrame - firstCaptured + 1, el = (Date.now() - t0) / 1000;
    console.log(`  ${t.toFixed(1)} s  ${done}/${total}  ${(el / done).toFixed(2)} s/frame  eta ${Math.round((el / done) * (total - done))} s`);
  }
}
if (enc) { enc.stdin.end(); console.log('wrote', await encDone); }
await browser.close();
if (slow) console.warn(`${slow} frame(s) were taken while something was still loading`);
if (problems.length) { console.warn('page problems:'); [...new Set(problems)].forEach(p => console.warn('  ' + p)); }
console.log(`done in ${Math.round((Date.now() - t0) / 1000)} s`);
