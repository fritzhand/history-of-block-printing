import fs from 'node:fs'; import { JSDOM, VirtualConsole } from 'jsdom';
/**
 * smoke-test.mjs — run index.html, js/data.js and js/app.js in a simulated DOM (jsdom, with the
 * real Leaflet) and check that every section renders and nothing throws. It is not a browser:
 * Chart.js is stubbed, model-viewer is not loaded, and Leaflet is forced to SVG.
 *
 *   npm i --no-save jsdom@24 leaflet@1.9.4 && node tools/smoke-test.mjs .
 *   (a second argument names the node_modules directory, if it is not ./node_modules)
 */
const ROOT = process.argv[2] || '.';
const NM = process.argv[3] || ROOT + '/node_modules';
let html = fs.readFileSync(ROOT + '/index.html', 'utf8');
const strip = html.replace(/<script[^>]*src="https:[^"]*"[^>]*><\/script>/g, '').replace(/<script type="module"[^>]*><\/script>/g, '');
const leaflet = fs.readFileSync(NM + '/leaflet/dist/leaflet.js', 'utf8');
const data = fs.readFileSync(ROOT + '/js/data.js', 'utf8'), app = fs.readFileSync(ROOT + '/js/app.js', 'utf8');
const stubs = `window.fetch = () => Promise.resolve({ ok: true });
window.Chart = function (cv, cfg) { window.__chart = cfg; this.destroy = () => {}; this.update = () => {}; };`;
const page = strip.replace('<script src="js/data.js"></script>', '').replace('<script src="js/app.js"></script>', '')
  .replace('</body>', () => `<script>${stubs}</script><script>${leaflet.replace(/<\/script>/g, '<\\/script>')}</script><script>L.Browser.svg = true; L.Browser.canvas = false;</script><script>${data}</script><script>${app}</script></body>`);
const errors = [], vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + String(e.message).split('\n')[0]));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ').slice(0, 220)));
const dom = new JSDOM(page, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/' });
await new Promise(r => setTimeout(r, 600));
console.log('captured so far:', errors.length ? errors : 'none'); console.log('readyState', dom.window.document.readyState, '| printData?', !!dom.window.printData, '| L?', !!dom.window.L);
const d = dom.window.document, q = s => d.querySelectorAll(s).length;
const rep = {
  'hero stats': q('#hero-stats > div'), 'footer stats': q('#footer-stats > div'), 'nav drawer links': q('#nav-drawer-list a'),
  'hotspot buttons in viewer': q('#pk-viewer .hotspot'), 'feature list items': q('#feature-list li'), 'ledger rows': q('.ledger-row'), 'king photos': q('#king-photos figure'),
  'process steps': q('#process-steps li'), 'swatches': q('.swatch'), 'story steps': q('.story-step'), 'era pills': q('.era-pill'),
  'leaflet panes (story map)': q('#story-map .leaflet-pane'), 'story markers': q('#story-map .leaflet-interactive'),
  'blue cards': q('.blue-card'), 'blue markers': q('#blue-map .leaflet-interactive'), 'claims': q('.claim'), 'media cards': q('.media-card'),
  'audit items': q('.audit-item'), 'audit stats': q('.audit-stat'), 'scrub readout': d.querySelector('#scrub-readout').textContent.slice(0, 80),
  'chart config built': !!dom.window.__chart && dom.window.__chart.data.datasets[0].data.length
};
console.log(rep);
// exercise interactions
d.querySelector('#theme-toggle').click(); console.log('theme after toggle:', d.documentElement.getAttribute('data-theme') || 'dark');
d.querySelector('#feature-list button').click(); console.log('feature detail:', d.querySelector('#feature-detail').textContent.slice(0, 90).replace(/\s+/g, ' '));
d.querySelector('.seg-btn[data-variant="printed"]').click(); console.log('viewer note after variant:', d.querySelector('#viewer-note').textContent.slice(0, 60));
const r = d.querySelector('#scrub-range'); r.value = 400; r.dispatchEvent(new dom.window.Event('input')); console.log('scrub:', d.querySelector('#scrub-year').textContent, '|', d.querySelector('#scrub-readout').textContent.slice(0, 90));
d.querySelector('.blue-card').click(); console.log('blue card active:', !!d.querySelector('.blue-card.is-active'));

// ── scroll assist: mock the layout, then walk the buttons through the whole page
const w = dom.window; let Y = 0; const calls = []; let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log((ok ? 'OK    ' : 'FAIL  ') + name + (extra ? '  ' + extra : '')); };
Object.defineProperty(w, 'scrollY', { get: () => Y, configurable: true });
Object.defineProperty(w, 'innerHeight', { get: () => 800, configurable: true });
Object.defineProperty(w, 'innerWidth', { get: () => 1280, configurable: true });
Object.defineProperty(d.body, 'scrollHeight', { get: () => 40000, configurable: true });
Object.defineProperty(w.HTMLElement.prototype, 'offsetParent', { get() { return this.parentNode; }, configurable: true });
w.scrollTo = o => { calls.push(o.top); Y = o.top; w.dispatchEvent(new w.Event('scroll')); };
const tg = Array.from(d.querySelectorAll('#hero, section[id], footer[id], .story-step'));
tg.forEach((el, i) => { el.getBoundingClientRect = () => ({ top: i * 1000 - Y }); });
const nav = d.querySelector('#section-nav'), up = d.querySelector('#section-nav-up'), down = d.querySelector('#section-nav-down');
w.dispatchEvent(new w.Event('scroll'));
check('hidden at the top', !nav.classList.contains('is-visible') && up.classList.contains('is-disabled'));
Y = 700; w.dispatchEvent(new w.Event('scroll'));
check('appears after scrolling', nav.classList.contains('is-visible') && !up.classList.contains('is-disabled'));
Y = 0; calls.length = 0; const visited = [];
for (let i = 0; i < 40 && !down.classList.contains('is-disabled'); i++) {
  down.click();
  const act = d.querySelector('.story-step.is-active');
  const cur = tg.findIndex(el => Math.abs((tg.indexOf(el) * 1000 - 64) - Y) < 1);
  if (tg[cur] && tg[cur].classList.contains('story-step')) visited.push({ ev: tg[cur].dataset.event, active: act && act.dataset.event });
}
const mono = calls.every((v, i) => i === 0 || v > calls[i - 1]);
check('Down moves strictly forward', mono, `${calls.length} presses`);
check('Down visits all ' + d.querySelectorAll('.story-step').length + ' story steps one by one', visited.length === d.querySelectorAll('.story-step').length, `visited ${visited.length}`);
check('the map\'s active step is the one the button landed on, every time', visited.every(v => v.ev === v.active), visited.filter(v => v.ev !== v.active).map(v => v.ev).join(','));
check('Down disables at the bottom', down.classList.contains('is-disabled'));
calls.length = 0;
for (let i = 0; i < 40 && !up.classList.contains('is-disabled'); i++) up.click();
check('Up moves strictly back to the top', calls.every((v, i) => i === 0 || v < calls[i - 1]) && Y === 0, `${calls.length} presses, ends at ${Y}`);
check('Up disables at the top', up.classList.contains('is-disabled'));
// anchor links scroll via the helper, and update the hash
calls.length = 0; const claims = tg.findIndex(el => el.id === 'claims');
d.querySelector('a[href="#claims"]') ? d.querySelector('a[href="#claims"]').click() : d.querySelector('#nav-drawer-list a[href="#claims"]').click();
check('an anchor link scrolls to its section', calls[0] === claims * 1000 - 64 && w.location.hash === '#claims', `top ${calls[0]}, hash ${w.location.hash}`);
// an era pill jumps to a step and activates it at once
calls.length = 0; d.querySelector('.era-pill[data-era="chintz"]').click();
check('an era pill goes to its first step and the map follows', d.querySelector('.story-step.is-active').dataset.phase === 'chintz' && calls.length === 1);
console.log(fails ? `\nSCROLL ASSIST: ${fails} check(s) failed` : '\nSCROLL ASSIST: all checks passed');
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no runtime errors captured');
process.exit(0);
