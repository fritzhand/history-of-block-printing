import fs from 'node:fs'; import { JSDOM, VirtualConsole } from 'jsdom';
/**
 * smoke-test.mjs — run index.html, js/data.js and js/app.js in a simulated DOM (jsdom, with the
 * real Leaflet) and check that every section renders and nothing throws. It is not a browser:
 * Chart.js is stubbed, model-viewer is not loaded, and Leaflet is forced to SVG.
 *
 *   npm i --no-save jsdom@24 leaflet@1.9.4 && node tools/smoke-test.mjs .
 */
const ROOT = process.argv[2] || '.';
let html = fs.readFileSync(ROOT + '/index.html', 'utf8');
const strip = html.replace(/<script[^>]*src="https:[^"]*"[^>]*><\/script>/g, '').replace(/<script type="module"[^>]*><\/script>/g, '');
const leaflet = fs.readFileSync(ROOT + '/node_modules/leaflet/dist/leaflet.js', 'utf8');
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
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no runtime errors captured');
process.exit(0);
